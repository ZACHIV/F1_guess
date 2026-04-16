---
name: incremental-batch-persistence
description: Use when running long imports, batch generation, data backfills, or network-dependent pipelines where each completed item should be saved immediately so interruptions do not erase prior progress.
---

# Incremental Batch Persistence

## Overview

Long-running batch work should optimize for durable progress, not perfect end-of-run success.

If a task processes many independent items, each completed item is a checkpoint. Persist it before moving on.

## When to Use

Use this skill when the work has one or more of these traits:

- Many independent records, files, or jobs are processed in sequence
- Network APIs, scraping, rate limits, or third-party services can interrupt the run
- Generated artifacts are expensive or slow to recreate
- A single bad item should not invalidate already-completed work
- The user cares more about forward progress than a single all-or-nothing run

Do not use this for tiny one-shot scripts where rerunning everything is trivial.

## Core Rule

After each durable unit completes, write the durable state immediately.

Durable state usually means:

- generated files
- manifest or library JSON
- CSV or spreadsheet rows
- checkpoint metadata
- manual-review markers for partial failures

## Workflow

1. Define the durable unit.
   Usually one row, one record, one asset bundle, or one external job.
2. Separate per-item work from final aggregation.
   Avoid designs where the only write happens at the very end.
3. Before the loop, load existing state and decide how to merge or replace duplicates.
4. For each item:
   Compute metadata.
   Generate artifacts.
   Validate the item-level result.
   Persist outputs immediately.
   Persist the updated manifest/index immediately.
5. If one item fails, prefer item-level fallback over aborting the whole batch.
6. If fallback is necessary, create an explicit placeholder and mark it for manual follow-up.
7. Only do lightweight finalization after the loop.

## Persistence Contract

Treat these as hard requirements:

- Never keep the only correct result in memory until the end of the loop.
- Never wait until all items succeed before updating the manifest.
- Never discard already-generated artifacts because a later item failed.
- If an item must be skipped, record why it was skipped.

Good pattern:

```js
for (const row of rows) {
  const result = await processRow(row);
  records = upsert(records, result.record);
  await writeLibrary(records);
  await writeCsv(rows);
}
```

Bad pattern:

```js
for (const row of rows) {
  results.push(await processRow(row));
}

await writeLibrary(results);
```

## Fallback Strategy

When a single item is blocked:

- reuse the last known-good pattern only if the user accepts degraded data
- mark the record as `draft`, `manual`, or similar
- add a note explaining exactly what is wrong
- keep the batch moving

The fallback must be obvious in data, not hidden in logs only.

## Common Mistakes

| Mistake | Why it hurts | Better move |
|--------|--------------|-------------|
| Write once at the end | One crash loses everything | Write after each item |
| Abort on first bad record | Turns one defect into total failure | Record the issue and continue |
| Keep status only in console logs | Manual recovery becomes guesswork | Persist notes/checkpoints in repo data |
| Rebuild completed items on every rerun | Wastes time and increases risk | Merge with existing state and replace only duplicates |
| Hide degraded placeholders as ready data | Users cannot trust outputs | Mark placeholders clearly for manual follow-up |

## Red Flags

Stop and redesign if you catch yourself thinking:

- "We'll write the CSV after the loop"
- "If one row fails, we should just rerun later"
- "The generated files are already on disk, that's probably enough"
- "The note about manual handling can live in the terminal output"
- "This batch is almost done, one final write is cleaner"

If progress would be painful to reconstruct, it is not persisted enough yet.
