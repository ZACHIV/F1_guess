const OPENF1_BASE_URL = 'https://api.openf1.org/v1';
const OPENF1_MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRetryDelayMs(response, attempt) {
  const retryAfterSeconds = Number.parseFloat(response.headers?.get?.('retry-after') ?? '');
  if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
    return retryAfterSeconds * 1000;
  }

  return Math.min(1000 * 2 ** attempt, 8000);
}

export function buildLapWindow(lap) {
  const start = new Date(lap.date_start);
  const end = new Date(start.getTime() + lap.lap_duration * 1000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

export async function fetchOpenF1(pathname, searchParams = {}, options = {}) {
  const url = new URL(`${OPENF1_BASE_URL}${pathname}`);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleep ?? sleep;

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  for (let attempt = 0; attempt <= OPENF1_MAX_RETRIES; attempt += 1) {
    const response = await fetchImpl(url);

    if (response.ok) {
      return response.json();
    }

    if (response.status === 429 && attempt < OPENF1_MAX_RETRIES) {
      await sleepImpl(getRetryDelayMs(response, attempt));
      continue;
    }

    throw new Error(`OpenF1 request failed: ${response.status}`);
  }

  throw new Error('OpenF1 request failed after retries');
}
