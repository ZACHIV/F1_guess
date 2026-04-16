import { copyFile, readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

let cachedIndex;

export function normalizeSearchTerm(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function scoreCircuitMatch(circuit, query) {
  const normalizedQuery = normalizeSearchTerm(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (circuit.normalizedAliases.includes(normalizedQuery)) {
    return 100;
  }

  if (circuit.normalizedAliases.some((alias) => alias.startsWith(normalizedQuery) || alias.includes(normalizedQuery))) {
    return 75;
  }

  const queryTokens = normalizedQuery.split(' ').filter(Boolean);
  const aliasTokens = new Set(circuit.normalizedAliases.flatMap((alias) => alias.split(' ').filter(Boolean)));
  const overlap = queryTokens.filter((token) => aliasTokens.has(token)).length;

  if (!overlap) {
    return 0;
  }

  return Math.min(40 + overlap * 10, 70);
}

export function parseCircuitYaml(source) {
  const lines = source.split(/\r?\n/);
  const circuit = {
    id: '',
    name: '',
    fullName: '',
    placeName: '',
    countryId: '',
    previousNames: [],
    layouts: []
  };

  let mode = '';

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, '  ');

    if (!line.trim()) {
      continue;
    }

    if (line.startsWith('id: ')) {
      circuit.id = line.slice(4).trim();
      mode = '';
      continue;
    }

    if (line.startsWith('name: ')) {
      circuit.name = line.slice(6).trim();
      mode = '';
      continue;
    }

    if (line.startsWith('fullName: ')) {
      circuit.fullName = line.slice(10).trim();
      mode = '';
      continue;
    }

    if (line.startsWith('placeName: ')) {
      circuit.placeName = line.slice(11).trim();
      mode = '';
      continue;
    }

    if (line.startsWith('countryId: ')) {
      circuit.countryId = line.slice(11).trim();
      mode = '';
      continue;
    }

    if (line.startsWith('previousNames:')) {
      mode = 'previousNames';
      continue;
    }

    if (line.startsWith('layouts:')) {
      mode = 'layouts';
      continue;
    }

    if (mode === 'previousNames' && line.trimStart().startsWith('- ')) {
      circuit.previousNames.push(line.trim().slice(2).trim());
      continue;
    }

    if (mode === 'layouts' && line.trimStart().startsWith('- id: ')) {
      const layoutId = line.trim().slice(6).split('#')[0].trim();
      circuit.layouts.push({ id: layoutId });
    }
  }

  const aliases = [
    circuit.id,
    circuit.name,
    circuit.fullName,
    circuit.placeName,
    ...circuit.previousNames
  ].filter(Boolean);

  return {
    ...circuit,
    aliases,
    normalizedAliases: [...new Set(aliases.map(normalizeSearchTerm).filter(Boolean))],
    currentLayoutId: circuit.layouts.at(-1)?.id ?? ''
  };
}

function resolveF1dbRoot(root) {
  return resolve(root, 'submodule/f1db');
}

export async function readF1dbCircuitIndex(root) {
  if (cachedIndex) {
    return cachedIndex;
  }

  const f1dbRoot = resolveF1dbRoot(root);
  const circuitsDir = resolve(f1dbRoot, 'src/data/circuits');
  const assetsDir = resolve(f1dbRoot, 'src/assets/circuits/white');

  if (!existsSync(circuitsDir) || !existsSync(assetsDir)) {
    throw new Error('F1DB local repository is missing. Expected submodule/f1db with src/data/circuits and src/assets/circuits/white.');
  }

  const files = (await readdir(circuitsDir))
    .filter((filename) => filename.endsWith('.yml'))
    .sort((left, right) => left.localeCompare(right, 'en'));

  cachedIndex = [];

  for (const filename of files) {
    const source = await readFile(resolve(circuitsDir, filename), 'utf8');
    const circuit = parseCircuitYaml(source);

    circuit.layouts = circuit.layouts
      .map((layout) => {
        const assetRelativePath = `src/assets/circuits/white/${layout.id}.svg`;
        const assetAbsolutePath = resolve(f1dbRoot, assetRelativePath);

        if (!existsSync(assetAbsolutePath)) {
          return null;
        }

        return {
          ...layout,
          assetRelativePath
        };
      })
      .filter(Boolean);

    if (!circuit.layouts.length) {
      continue;
    }

    circuit.currentLayoutId = circuit.layouts.at(-1)?.id ?? '';
    cachedIndex.push(circuit);
  }

  return cachedIndex;
}

export async function findLocalCircuit(root, query) {
  const normalizedQuery = normalizeSearchTerm(query);

  if (!normalizedQuery) {
    return null;
  }

  const circuits = await readF1dbCircuitIndex(root);
  const ranked = circuits
    .map((circuit) => ({ circuit, score: scoreCircuitMatch(circuit, normalizedQuery) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.circuit.name.localeCompare(right.circuit.name, 'en'));

  return ranked[0]?.circuit ?? null;
}

export async function importLocalCircuitSvg(root, { assetName, query }) {
  const circuit = await findLocalCircuit(root, query);

  if (!circuit) {
    throw new Error(`F1DB circuit not found for query: ${query}`);
  }

  const layout = circuit.layouts.find((item) => item.id === circuit.currentLayoutId) ?? circuit.layouts.at(-1);
  if (!layout) {
    throw new Error(`F1DB circuit has no SVG layouts: ${circuit.name}`);
  }

  const sourcePath = resolve(resolveF1dbRoot(root), layout.assetRelativePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`F1DB SVG asset is missing: ${layout.assetRelativePath}`);
  }

  const targetPath = resolve(root, 'public/assets/tracks', `${assetName}.svg`);
  await copyFile(sourcePath, targetPath);

  return {
    circuitId: circuit.id,
    circuitName: circuit.name,
    layoutId: layout.id,
    trackSvgSrc: `/assets/tracks/${assetName}.svg`
  };
}
