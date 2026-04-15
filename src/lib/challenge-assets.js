export async function loadChallengeTelemetry(challenge) {
  const [locationResponse, carDataResponse] = await Promise.all([
    fetch(challenge.telemetryLocationSrc),
    fetch(challenge.telemetryCarDataSrc)
  ]);

  if (!locationResponse.ok || !carDataResponse.ok) {
    throw new Error('Failed to load telemetry assets for challenge.');
  }

  return {
    locationData: await locationResponse.json(),
    carData: await carDataResponse.json()
  };
}
