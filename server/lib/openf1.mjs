const OPENF1_BASE_URL = 'https://api.openf1.org/v1';

export function buildLapWindow(lap) {
  const start = new Date(lap.date_start);
  const end = new Date(start.getTime() + lap.lap_duration * 1000);

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString()
  };
}

export async function fetchOpenF1(pathname, searchParams = {}) {
  const url = new URL(`${OPENF1_BASE_URL}${pathname}`);

  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`OpenF1 request failed: ${response.status}`);
  }

  return response.json();
}
