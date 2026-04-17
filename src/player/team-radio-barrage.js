import teamRadioCsv from '../../docs/research/team-radio-barrage.csv?raw';

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let isQuoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (isQuoted && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        isQuoted = !isQuoted;
      }
      continue;
    }

    if (char === ',' && !isQuoted) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseTeamRadioCsv(csvText) {
  const lines = csvText
    .trim()
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const headers = parseCsvLine(lines[0]);

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const record = headers.reduce((entry, header, headerIndex) => {
      entry[header] = values[headerIndex] ?? '';
      return entry;
    }, {});

    return {
      ...record,
      id: `${record.driver}-${index}-${record.quote}`.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    };
  });
}

export const TEAM_RADIO_BARRAGE_LIBRARY = parseTeamRadioCsv(teamRadioCsv);

export function getTeamRadioBarragePool(mode) {
  if (mode === 'max-win') {
    return TEAM_RADIO_BARRAGE_LIBRARY.filter((entry) => entry.usage_bucket === 'max_win_voice_pack');
  }

  if (mode === 'live') {
    return TEAM_RADIO_BARRAGE_LIBRARY.filter((entry) => entry.usage_bucket !== 'max_win_voice_pack');
  }

  return [];
}
