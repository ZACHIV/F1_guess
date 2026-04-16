import { readFile, writeFile } from 'node:fs/promises';

function normalizeString(value, fallback = '') {
  const nextValue = String(value ?? '').trim();
  return nextValue || fallback;
}

function toTagArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeString(item)).filter(Boolean);
  }

  return normalizeString(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeChallengeRecord(record = {}, index = 0) {
  const now = new Date().toISOString();
  const createdAt = normalizeString(record.createdAt, now);
  const updatedAt = normalizeString(record.updatedAt, createdAt);
  const status = normalizeString(record.status, record.audioSrc ? 'ready' : 'draft');

  return {
    ...record,
    id: normalizeString(record.id),
    title: normalizeString(record.title),
    category: normalizeString(record.category, 'Uncategorized'),
    status,
    tags: toTagArray(record.tags),
    notes: normalizeString(record.notes),
    createdAt,
    updatedAt,
    sortOrder: Number.isFinite(Number(record.sortOrder)) ? Number(record.sortOrder) : index
  };
}

export function resequenceChallengeRecords(records) {
  return records.map((record, index) => ({
    ...record,
    sortOrder: index
  }));
}

export function sortChallengeRecords(records, mode = 'manual') {
  const normalized = records.map((record, index) => normalizeChallengeRecord(record, index));

  if (mode === 'updated-desc') {
    return [...normalized].sort((left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) ||
      left.title.localeCompare(right.title, 'en')
    );
  }

  if (mode === 'created-desc') {
    return [...normalized].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt) ||
      left.title.localeCompare(right.title, 'en')
    );
  }

  if (mode === 'title-asc') {
    return [...normalized].sort((left, right) =>
      left.title.localeCompare(right.title, 'en') ||
      left.id.localeCompare(right.id, 'en')
    );
  }

  if (mode === 'category-asc') {
    return [...normalized].sort((left, right) =>
      left.category.localeCompare(right.category, 'en') ||
      left.title.localeCompare(right.title, 'en')
    );
  }

  return [...normalized].sort((left, right) =>
    left.sortOrder - right.sortOrder ||
    right.updatedAt.localeCompare(left.updatedAt)
  );
}

export function upsertChallengeRecord(records, nextRecord) {
  const normalizedRecords = resequenceChallengeRecords(
    sortChallengeRecords(records, 'manual')
  );
  const index = normalizedRecords.findIndex((record) => record.id === nextRecord.id);
  const existingRecord = index === -1 ? null : normalizedRecords[index];
  const now = new Date().toISOString();
  const normalizedNextRecord = normalizeChallengeRecord(
    {
      ...existingRecord,
      ...nextRecord,
      createdAt: existingRecord?.createdAt ?? nextRecord.createdAt ?? now,
      updatedAt: now,
      sortOrder: existingRecord?.sortOrder ?? normalizedRecords.length
    },
    existingRecord?.sortOrder ?? normalizedRecords.length
  );

  if (index === -1) {
    return resequenceChallengeRecords([...normalizedRecords, normalizedNextRecord]);
  }

  return resequenceChallengeRecords(
    normalizedRecords.map((record, recordIndex) =>
      recordIndex === index ? normalizedNextRecord : record
    )
  );
}

export function removeChallengeRecord(records, id) {
  return resequenceChallengeRecords(records.filter((record) => record.id !== id));
}

export function moveChallengeRecord(records, id, direction) {
  const normalizedRecords = resequenceChallengeRecords(sortChallengeRecords(records, 'manual'));
  const index = normalizedRecords.findIndex((record) => record.id === id);

  if (index === -1) {
    return normalizedRecords;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= normalizedRecords.length) {
    return normalizedRecords;
  }

  const nextRecords = [...normalizedRecords];
  [nextRecords[index], nextRecords[targetIndex]] = [nextRecords[targetIndex], nextRecords[index]];
  return resequenceChallengeRecords(nextRecords);
}

export function duplicateChallengeRecord(records, sourceId, newId) {
  const normalizedRecords = resequenceChallengeRecords(sortChallengeRecords(records, 'manual'));
  const sourceRecord = normalizedRecords.find((record) => record.id === sourceId);

  if (!sourceRecord) {
    throw new Error('Source challenge not found');
  }

  const duplicateId = normalizeString(newId, `${sourceRecord.id}-copy`);
  if (normalizedRecords.some((record) => record.id === duplicateId)) {
    throw new Error('Duplicate challenge id already exists');
  }

  const now = new Date().toISOString();
  const duplicatedRecord = normalizeChallengeRecord({
    ...sourceRecord,
    id: duplicateId,
    title: `${sourceRecord.title || sourceRecord.id} Copy`,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    sortOrder: normalizedRecords.length
  });

  return resequenceChallengeRecords([...normalizedRecords, duplicatedRecord]);
}

export function getChallengeLibrarySummary(records) {
  const normalizedRecords = sortChallengeRecords(records, 'manual');
  const categories = [...new Set(normalizedRecords.map((record) => record.category).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'));
  const statuses = [...new Set(normalizedRecords.map((record) => record.status).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'en'));

  return {
    total: normalizedRecords.length,
    categories,
    statuses
  };
}

export async function readChallengeLibrary(pathname) {
  const source = await readFile(pathname, 'utf8');
  return sortChallengeRecords(JSON.parse(source), 'manual');
}

export async function writeChallengeLibrary(pathname, records) {
  await writeFile(
    pathname,
    `${JSON.stringify(resequenceChallengeRecords(sortChallengeRecords(records, 'manual')), null, 2)}\n`,
    'utf8'
  );
}
