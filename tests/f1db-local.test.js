import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findLocalCircuit,
  normalizeSearchTerm,
  parseCircuitYaml,
  readF1dbCircuitIndex,
  scoreCircuitMatch
} from '../server/lib/f1db-local.mjs';

describe('normalizeSearchTerm', () => {
  it('normalizes accents and separators for local circuit lookup', () => {
    expect(normalizeSearchTerm('Österreichring')).toBe('osterreichring');
    expect(normalizeSearchTerm('Red-Bull Ring')).toBe('red bull ring');
  });
});

describe('scoreCircuitMatch', () => {
  const circuit = {
    normalizedAliases: ['red bull ring', 'spielberg', 'osterreichring', 'a1 ring']
  };

  it('prefers exact alias matches', () => {
    expect(scoreCircuitMatch(circuit, 'Red Bull Ring')).toBe(100);
  });

  it('supports fuzzy token overlap for partial queries', () => {
    expect(scoreCircuitMatch(circuit, 'bull ring')).toBeGreaterThan(0);
  });
});

describe('parseCircuitYaml', () => {
  it('parses the local f1db circuit metadata format', async () => {
    const source = await readFile(resolve(process.cwd(), 'submodule/f1db/src/data/circuits/spielberg.yml'), 'utf8');
    const circuit = parseCircuitYaml(source);

    expect(circuit.id).toBe('spielberg');
    expect(circuit.name).toBe('Red Bull Ring');
    expect(circuit.currentLayoutId).toBe('spielberg-3');
    expect(circuit.normalizedAliases).toContain('osterreichring');
  });
});

describe('readF1dbCircuitIndex', () => {
  it('builds a searchable local index from submodule/f1db', async () => {
    const circuits = await readF1dbCircuitIndex(process.cwd());
    const redBullRing = circuits.find((item) => item.id === 'spielberg');

    expect(circuits.length).toBeGreaterThan(50);
    expect(redBullRing?.layouts.at(-1)?.id).toBe('spielberg-3');
    expect(redBullRing?.layouts.at(-1)?.assetRelativePath).toBe('src/assets/circuits/white-outline/spielberg-3.svg');
  });
});

describe('findLocalCircuit', () => {
  it('matches by current name and historical alias', async () => {
    await expect(findLocalCircuit(process.cwd(), 'Red Bull Ring')).resolves.toMatchObject({
      id: 'spielberg'
    });

    await expect(findLocalCircuit(process.cwd(), 'Österreichring')).resolves.toMatchObject({
      id: 'spielberg'
    });
  });
});
