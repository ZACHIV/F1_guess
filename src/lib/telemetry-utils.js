function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toElapsedSamples(samples) {
  if (!samples.length) {
    return [];
  }

  const origin = new Date(samples[0].date).getTime();

  return samples.map((sample) => ({
    ...sample,
    elapsedMs: new Date(sample.date).getTime() - origin
  }));
}

export function normalizeTelemetryPoints(points, dimensions) {
  if (!points.length) {
    return [];
  }

  const { width, height, padding } = dimensions;
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const drawableWidth = width - padding * 2;
  const drawableHeight = height - padding * 2;
  const scale = Math.min(
    drawableWidth / Math.max(maxX - minX, 1),
    drawableHeight / Math.max(maxY - minY, 1)
  );
  const offsetX = (width - (maxX - minX) * scale) / 2;
  const offsetY = (height - (maxY - minY) * scale) / 2;

  return points.map((point) => ({
    ...point,
    x: (point.x - minX) * scale + offsetX,
    y: height - ((point.y - minY) * scale + offsetY)
  }));
}

export function buildTelemetryPath(points) {
  return points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(' ');
}

export function getInterpolatedTelemetryPoint(points, elapsedMs) {
  if (!points.length) {
    return null;
  }

  if (elapsedMs <= points[0].elapsedMs) {
    return points[0];
  }

  const lastPoint = points[points.length - 1];
  if (elapsedMs >= lastPoint.elapsedMs) {
    return lastPoint;
  }

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (elapsedMs <= current.elapsedMs) {
      const progress = clamp(
        (elapsedMs - previous.elapsedMs) / Math.max(current.elapsedMs - previous.elapsedMs, 1),
        0,
        1
      );

      return {
        ...current,
        x: previous.x + (current.x - previous.x) * progress,
        y: previous.y + (current.y - previous.y) * progress
      };
    }
  }

  return lastPoint;
}

export function getNearestTelemetrySample(samples, elapsedMs) {
  if (!samples.length) {
    return null;
  }

  return samples.reduce((closest, sample) => {
    if (!closest) {
      return sample;
    }

    const currentDistance = Math.abs(sample.elapsedMs - elapsedMs);
    const bestDistance = Math.abs(closest.elapsedMs - elapsedMs);

    return currentDistance < bestDistance ? sample : closest;
  }, null);
}
