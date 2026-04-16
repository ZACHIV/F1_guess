export function getSynchronizedElapsedMs(currentTimeMs, challenge) {
  const offsetMs = Math.max(0, Number(challenge?.telemetryOffsetMs ?? 0));
  return Math.max(0, Number(currentTimeMs ?? 0) - offsetMs);
}
