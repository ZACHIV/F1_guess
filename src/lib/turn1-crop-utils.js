export const TURN1_RATIO_PRESETS = [
  { id: '1:1', label: '1:1', width: 1, height: 1 },
  { id: '4:3', label: '4:3', width: 4, height: 3 },
  { id: '3:2', label: '3:2', width: 3, height: 2 },
  { id: '16:9', label: '16:9', width: 16, height: 9 },
  { id: '9:16', label: '9:16', width: 9, height: 16 }
];

const DEFAULT_RATIO_ID = '4:3';
const DEFAULT_CROP_FILL = 0.42;
const MIN_EDGE = 48;

export function getTurn1RatioPreset(ratioId = DEFAULT_RATIO_ID) {
  return TURN1_RATIO_PRESETS.find((preset) => preset.id === ratioId) ?? TURN1_RATIO_PRESETS[1];
}

export function getAspectRatioValue(ratioId = DEFAULT_RATIO_ID) {
  const preset = getTurn1RatioPreset(ratioId);
  return preset.width / preset.height;
}

export function buildViewBoxBounds(viewBox) {
  if (!viewBox) {
    return { x: 0, y: 0, width: 500, height: 500 };
  }

  const parts = String(viewBox)
    .trim()
    .split(/[\s,]+/)
    .map((value) => Number.parseFloat(value));

  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return { x: 0, y: 0, width: 500, height: 500 };
  }

  return {
    x: parts[0],
    y: parts[1],
    width: parts[2],
    height: parts[3]
  };
}

function fitRectWithAspect(maxWidth, maxHeight, ratio) {
  let width = maxWidth;
  let height = width / ratio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * ratio;
  }

  return { width, height };
}

function getMinCropSize(ratio) {
  if (ratio >= 1) {
    return {
      width: MIN_EDGE * ratio,
      height: MIN_EDGE
    };
  }

  return {
    width: MIN_EDGE,
    height: MIN_EDGE / ratio
  };
}

export function buildDefaultTurn1Crop(bounds, ratioId = DEFAULT_RATIO_ID) {
  const ratio = getAspectRatioValue(ratioId);
  const target = fitRectWithAspect(bounds.width * DEFAULT_CROP_FILL, bounds.height * DEFAULT_CROP_FILL, ratio);

  return clampTurn1Crop({
    aspectRatio: getTurn1RatioPreset(ratioId).id,
    x: bounds.x + (bounds.width - target.width) / 2,
    y: bounds.y + (bounds.height - target.height) / 2,
    width: target.width,
    height: target.height
  }, bounds);
}

function normalizeAngleDelta(delta) {
  let nextDelta = delta;

  while (nextDelta > Math.PI) {
    nextDelta -= Math.PI * 2;
  }

  while (nextDelta < -Math.PI) {
    nextDelta += Math.PI * 2;
  }

  return nextDelta;
}

function computeBoundingBox(points) {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    maxX: Math.max(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxY: Math.max(...points.map((point) => point.y))
  };
}

export function buildTurn1CropFromSampledPoints(points, bounds, ratioId = DEFAULT_RATIO_ID) {
  if (!Array.isArray(points) || points.length < 12) {
    return buildDefaultTurn1Crop(bounds, ratioId);
  }

  const segmentAngles = [];
  for (let index = 1; index < points.length; index += 1) {
    const dx = points[index].x - points[index - 1].x;
    const dy = points[index].y - points[index - 1].y;
    segmentAngles.push(Math.atan2(dy, dx));
  }

  const localCurvature = segmentAngles.map((angle, index) => {
    if (index === 0) {
      return 0;
    }

    return Math.abs(normalizeAngleDelta(angle - segmentAngles[index - 1]));
  });

  const windowRadius = Math.max(4, Math.round(points.length * 0.025));
  const scanStart = Math.min(points.length - 1, Math.max(windowRadius + 1, Math.round(points.length * 0.03)));
  const rollingScores = localCurvature.map((_, index) => {
    const start = Math.max(0, index - windowRadius);
    const end = Math.min(localCurvature.length - 1, index + windowRadius);
    let total = 0;

    for (let cursor = start; cursor <= end; cursor += 1) {
      total += localCurvature[cursor];
    }

    return total;
  });

  let peakIndex = -1;
  let peakScore = 0;
  const threshold = 0.5;

  for (let index = scanStart; index < rollingScores.length; index += 1) {
    if (rollingScores[index] > threshold) {
      peakIndex = index;
      peakScore = rollingScores[index];
      break;
    }
  }

  if (peakIndex === -1) {
    peakIndex = rollingScores.indexOf(Math.max(...rollingScores.slice(scanStart)));
    peakScore = rollingScores[peakIndex] ?? 0;
  }

  if (!Number.isFinite(peakScore) || peakScore <= 0) {
    return buildDefaultTurn1Crop(bounds, ratioId);
  }

  const expansion = Math.max(4, Math.round(points.length * 0.025));
  const segmentStart = Math.max(0, peakIndex - expansion);
  const segmentEnd = Math.min(points.length - 1, peakIndex + expansion);
  const segmentPoints = points.slice(segmentStart, segmentEnd + 1);
  const box = computeBoundingBox(segmentPoints);
  const segmentWidth = Math.max(box.maxX - box.minX, 1);
  const segmentHeight = Math.max(box.maxY - box.minY, 1);
  const padding = Math.max(segmentWidth, segmentHeight) * 0.28;

  return clampTurn1Crop({
    aspectRatio: getTurn1RatioPreset(ratioId).id,
    x: box.minX - padding,
    y: box.minY - padding,
    width: segmentWidth + padding * 2,
    height: (segmentWidth + padding * 2) / getAspectRatioValue(ratioId)
  }, bounds);
}

export function clampTurn1Crop(crop, bounds) {
  const ratioId = crop?.aspectRatio || DEFAULT_RATIO_ID;
  const ratio = getAspectRatioValue(ratioId);
  const minSize = getMinCropSize(ratio);
  const maxSize = fitRectWithAspect(bounds.width, bounds.height, ratio);

  let width = Number(crop?.width);
  if (!Number.isFinite(width) || width <= 0) {
    width = buildDefaultTurn1Crop(bounds, ratioId).width;
  }

  width = Math.min(Math.max(width, minSize.width), maxSize.width);
  let height = width / ratio;

  if (height > maxSize.height) {
    height = maxSize.height;
    width = height * ratio;
  }

  let x = Number(crop?.x);
  let y = Number(crop?.y);

  if (!Number.isFinite(x)) {
    x = bounds.x + (bounds.width - width) / 2;
  }

  if (!Number.isFinite(y)) {
    y = bounds.y + (bounds.height - height) / 2;
  }

  x = Math.min(Math.max(x, bounds.x), bounds.x + bounds.width - width);
  y = Math.min(Math.max(y, bounds.y), bounds.y + bounds.height - height);

  return {
    aspectRatio: getTurn1RatioPreset(ratioId).id,
    x,
    y,
    width,
    height
  };
}

export function moveTurn1Crop(crop, deltaX, deltaY, bounds) {
  return clampTurn1Crop({
    ...crop,
    x: Number(crop.x) + deltaX,
    y: Number(crop.y) + deltaY
  }, bounds);
}

export function nudgeTurn1Crop(crop, direction, bounds, step = 4) {
  const deltaByDirection = {
    left: [-step, 0],
    right: [step, 0],
    up: [0, -step],
    down: [0, step]
  };

  const [deltaX, deltaY] = deltaByDirection[direction] ?? [0, 0];
  return moveTurn1Crop(crop, deltaX, deltaY, bounds);
}

export function withTurn1AspectRatio(crop, ratioId, bounds) {
  const current = clampTurn1Crop(crop, bounds);
  const ratio = getAspectRatioValue(ratioId);
  const centerX = current.x + current.width / 2;
  const centerY = current.y + current.height / 2;
  const area = current.width * current.height;
  let width = Math.sqrt(area * ratio);
  let height = width / ratio;

  const maxSize = fitRectWithAspect(bounds.width, bounds.height, ratio);
  if (width > maxSize.width || height > maxSize.height) {
    width = maxSize.width;
    height = maxSize.height;
  }

  return clampTurn1Crop({
    aspectRatio: ratioId,
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height
  }, bounds);
}

export function scaleTurn1Crop(crop, scaleDelta, bounds) {
  const current = clampTurn1Crop(crop, bounds);
  const ratio = getAspectRatioValue(current.aspectRatio);
  const centerX = current.x + current.width / 2;
  const centerY = current.y + current.height / 2;
  const nextWidth = current.width * scaleDelta;
  const nextHeight = nextWidth / ratio;

  return clampTurn1Crop({
    ...current,
    x: centerX - nextWidth / 2,
    y: centerY - nextHeight / 2,
    width: nextWidth,
    height: nextHeight
  }, bounds);
}

export function resizeTurn1Crop(crop, handle, pointer, bounds) {
  const current = clampTurn1Crop(crop, bounds);
  const ratio = getAspectRatioValue(current.aspectRatio);
  const minSize = getMinCropSize(ratio);
  const anchorByHandle = {
    nw: { x: current.x + current.width, y: current.y + current.height },
    ne: { x: current.x, y: current.y + current.height },
    sw: { x: current.x + current.width, y: current.y },
    se: { x: current.x, y: current.y }
  };

  const anchor = anchorByHandle[handle];
  if (!anchor) {
    return current;
  }

  const rawWidth = Math.abs(anchor.x - pointer.x);
  const rawHeight = Math.abs(anchor.y - pointer.y);
  const widthFromHeight = rawHeight * ratio;
  let width = rawWidth;

  if (rawHeight > 0 && rawWidth / Math.max(rawHeight, 0.0001) < ratio) {
    width = widthFromHeight;
  }

  const maxWidthByHandle = {
    nw: anchor.x - bounds.x,
    ne: bounds.x + bounds.width - anchor.x,
    sw: anchor.x - bounds.x,
    se: bounds.x + bounds.width - anchor.x
  }[handle];

  const maxHeightByHandle = {
    nw: anchor.y - bounds.y,
    ne: anchor.y - bounds.y,
    sw: bounds.y + bounds.height - anchor.y,
    se: bounds.y + bounds.height - anchor.y
  }[handle];

  const maxSize = fitRectWithAspect(maxWidthByHandle, maxHeightByHandle, ratio);
  width = Math.min(Math.max(width, minSize.width), maxSize.width);
  const height = width / ratio;

  if (handle === 'nw') {
    return clampTurn1Crop({
      ...current,
      x: anchor.x - width,
      y: anchor.y - height,
      width,
      height
    }, bounds);
  }

  if (handle === 'ne') {
    return clampTurn1Crop({
      ...current,
      x: anchor.x,
      y: anchor.y - height,
      width,
      height
    }, bounds);
  }

  if (handle === 'sw') {
    return clampTurn1Crop({
      ...current,
      x: anchor.x - width,
      y: anchor.y,
      width,
      height
    }, bounds);
  }

  return clampTurn1Crop({
    ...current,
    x: anchor.x,
    y: anchor.y,
    width,
    height
  }, bounds);
}
