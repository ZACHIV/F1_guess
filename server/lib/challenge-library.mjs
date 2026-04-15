import { readFile, writeFile } from 'node:fs/promises';

export function upsertChallengeRecord(records, nextRecord) {
  const index = records.findIndex((record) => record.id === nextRecord.id);

  if (index === -1) {
    return [...records, nextRecord];
  }

  return records.map((record, recordIndex) => (recordIndex === index ? nextRecord : record));
}

export function removeChallengeRecord(records, id) {
  return records.filter((record) => record.id !== id);
}

export async function readChallengeLibrary(pathname) {
  const source = await readFile(pathname, 'utf8');
  return JSON.parse(source);
}

export async function writeChallengeLibrary(pathname, records) {
  await writeFile(pathname, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
}
