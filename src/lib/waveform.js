import WaveSurfer from 'wavesurfer.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

export function findTriggerIndex(samples, threshold = 0.01) {
  if (!samples?.length) {
    return 0;
  }

  const startIndex = Math.max(1, Math.floor(samples.length * 0.05));
  const endIndex = samples.length - 1;

  for (let index = startIndex; index < endIndex; index += 1) {
    const previous = samples[index - 1] ?? 0;
    const current = samples[index] ?? 0;
    const next = samples[index + 1] ?? current;
    if (previous < threshold && current >= threshold && next >= current) {
      return index;
    }
  }

  return 0;
}

export function buildOscilloscopePoints(samples, pointCount, options = {}) {
  if (!samples?.length || pointCount < 2) {
    return [];
  }

  const triggerIndex = options.alignPhase === false
    ? 0
    : findTriggerIndex(samples, options.triggerThreshold ?? 0.01);
  const usableLength = Math.max(2, samples.length - triggerIndex);
  const windowRadius = Math.max(0, Math.round(options.windowRadius ?? 3));
  const points = new Array(pointCount);

  for (let pointIndex = 0; pointIndex < pointCount; pointIndex += 1) {
    const ratio = pointCount === 1 ? 0 : pointIndex / (pointCount - 1);
    const sampleIndex = triggerIndex + ratio * (usableLength - 1);
    const center = Math.round(sampleIndex);
    let total = 0;
    let count = 0;

    for (let offset = -windowRadius; offset <= windowRadius; offset += 1) {
      const nextIndex = clamp(center + offset, 0, samples.length - 1);
      total += samples[nextIndex];
      count += 1;
    }

    points[pointIndex] = total / Math.max(1, count);
  }

  return points;
}

export function mountWaveform(container, audioSrc, options = {}) {
  if (!container || !audioSrc) {
    return null;
  }

  const wave = WaveSurfer.create({
    container,
    url: audioSrc,
    height: 64,
    barWidth: 3,
    barRadius: 999,
    barGap: 2,
    normalize: true,
    interact: false,
    waveColor: 'rgba(255,255,255,0.25)',
    progressColor: '#ffffff',
    cursorWidth: 0,
    ...options
  });

  return wave;
}

export function mountRealtimeOscilloscope(canvas, mediaElement, options = {}) {
  if (!canvas || !mediaElement || typeof window === 'undefined') {
    return null;
  }

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  const context2d = canvas.getContext('2d');
  if (!AudioContextCtor || !context2d) {
    return null;
  }

  let audioContext;
  let sourceNode;
  let analyser;
  try {
    audioContext = new AudioContextCtor();
    sourceNode = audioContext.createMediaElementSource(mediaElement);
    analyser = audioContext.createAnalyser();
  } catch {
    return null;
  }

  analyser.fftSize = options.fftSize ?? 1024;
  analyser.smoothingTimeConstant = options.smoothingTimeConstant ?? 0.9;
  sourceNode.connect(analyser);
  analyser.connect(audioContext.destination);

  const buffer = typeof analyser.getFloatTimeDomainData === 'function'
    ? new Float32Array(analyser.fftSize)
    : new Uint8Array(analyser.fftSize);
  const baselineColor = options.baselineColor ?? 'rgba(255, 255, 255, 0.16)';
  const glowColor = options.glowColor ?? 'rgba(255, 140, 64, 0.28)';
  const trailColor = options.trailColor ?? 'rgba(255, 255, 255, 0.28)';
  const lineColor = options.lineColor ?? 'rgba(255, 255, 255, 0.96)';
  const trailScale = options.trailScale ?? 0.5;
  const lineScale = options.lineScale ?? 0.82;
  const trailOffset = options.trailOffset ?? 7;
  const lineWidth = options.lineWidth ?? 2.1;
  const glowWidth = options.glowWidth ?? 5.2;
  const idleAmplitude = options.idleAmplitude ?? 0.014;
  const temporalSmoothing = options.temporalSmoothing ?? 0.28;
  const triggerThreshold = options.triggerThreshold ?? 0.01;
  const pointDensity = options.pointDensity ?? 1.7;
  const pointWindowRadius = options.pointWindowRadius ?? 3;

  let rafId = 0;
  let destroyed = false;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let previousPoints = [];

  function syncCanvasSize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width || canvas.clientWidth || options.width || 278));
    const height = Math.max(1, Math.round(rect.height || canvas.clientHeight || options.height || 40));
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const nextWidth = Math.round(width * pixelRatio);
    const nextHeight = Math.round(height * pixelRatio);

    if (canvas.width === nextWidth && canvas.height === nextHeight) {
      canvasWidth = width;
      canvasHeight = height;
      return;
    }

    canvas.width = nextWidth;
    canvas.height = nextHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context2d.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    canvasWidth = width;
    canvasHeight = height;
  }

  function normalizeToFloat(value) {
    return typeof value === 'number' && value <= 1 && value >= -1
      ? value
      : (value - 128) / 128;
  }

  function drawCurve(points, { amplitudeScale, offsetY, strokeStyle, strokeWidth }) {
    if (!points.length) {
      return;
    }

    const width = canvasWidth || canvas.clientWidth || options.width || 278;
    const height = canvasHeight || canvas.clientHeight || options.height || 40;
    const centerY = height / 2 + offsetY;

    context2d.beginPath();
    const firstY = centerY + points[0] * height * amplitudeScale;
    context2d.moveTo(0, firstY);

    for (let index = 1; index < points.length - 1; index += 1) {
      const currentX = (index / (points.length - 1)) * width;
      const currentY = centerY + points[index] * height * amplitudeScale;
      const nextX = ((index + 1) / (points.length - 1)) * width;
      const nextY = centerY + points[index + 1] * height * amplitudeScale;
      context2d.quadraticCurveTo(
        currentX,
        currentY,
        (currentX + nextX) / 2,
        (currentY + nextY) / 2
      );
    }

    const lastX = width;
    const lastY = centerY + points[points.length - 1] * height * amplitudeScale;
    context2d.lineTo(lastX, lastY);
    context2d.lineWidth = strokeWidth;
    context2d.strokeStyle = strokeStyle;
    context2d.lineJoin = 'round';
    context2d.lineCap = 'round';
    context2d.stroke();
  }

  function drawIdle() {
    const width = canvasWidth || canvas.clientWidth || options.width || 278;
    const height = canvasHeight || canvas.clientHeight || options.height || 40;

    context2d.clearRect(0, 0, width, height);
    context2d.beginPath();
    context2d.moveTo(0, height / 2);
    context2d.lineTo(width, height / 2);
    context2d.lineWidth = 1;
    context2d.strokeStyle = baselineColor;
    context2d.stroke();
  }

  function drawFrame() {
    syncCanvasSize();

    if (!mediaElement || mediaElement.paused || mediaElement.ended) {
      drawIdle();
      return;
    }

    if (typeof analyser.getFloatTimeDomainData === 'function') {
      analyser.getFloatTimeDomainData(buffer);
    } else {
      analyser.getByteTimeDomainData(buffer);
    }
    const width = canvasWidth || canvas.clientWidth || options.width || 278;
    const height = canvasHeight || canvas.clientHeight || options.height || 40;
    const pointCount = clamp(Math.round(width / pointDensity), 72, 180);
    const rawPoints = buildOscilloscopePoints(buffer, pointCount, {
      triggerThreshold,
      windowRadius: pointWindowRadius
    }).map(normalizeToFloat);
    const smoothedPoints = rawPoints.map((point, index) => (
      previousPoints[index] == null
        ? point
        : lerp(previousPoints[index], point, temporalSmoothing)
    ));
    previousPoints = smoothedPoints;

    context2d.clearRect(0, 0, width, height);

    context2d.beginPath();
    context2d.moveTo(0, height / 2);
    context2d.lineTo(width, height / 2);
    context2d.lineWidth = 1;
    context2d.strokeStyle = baselineColor;
    context2d.stroke();

    drawCurve(smoothedPoints, {
      amplitudeScale: idleAmplitude,
      offsetY: 0,
      strokeStyle: glowColor,
      strokeWidth: glowWidth
    });
    drawCurve(smoothedPoints, {
      amplitudeScale: trailScale,
      offsetY: -trailOffset,
      strokeStyle: trailColor,
      strokeWidth: 1.15
    });
    drawCurve(smoothedPoints, {
      amplitudeScale: trailScale,
      offsetY: trailOffset,
      strokeStyle: trailColor,
      strokeWidth: 1.15
    });
    drawCurve(smoothedPoints, {
      amplitudeScale: lineScale,
      offsetY: 0,
      strokeStyle: lineColor,
      strokeWidth: lineWidth
    });
  }

  function stopLoop() {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function tick() {
    rafId = 0;
    drawFrame();
    if (!destroyed && mediaElement && !mediaElement.paused && !mediaElement.ended) {
      rafId = window.requestAnimationFrame(tick);
    }
  }

  function startLoop() {
    if (rafId || destroyed) {
      return;
    }

    rafId = window.requestAnimationFrame(tick);
  }

  function handlePlay() {
    audioContext.resume?.().catch(() => {});
    startLoop();
  }

  function handlePause() {
    stopLoop();
    previousPoints = [];
    drawIdle();
  }

  function handleResize() {
    drawFrame();
  }

  mediaElement.addEventListener('play', handlePlay);
  mediaElement.addEventListener('pause', handlePause);
  mediaElement.addEventListener('ended', handlePause);
  window.addEventListener('resize', handleResize);

  syncCanvasSize();
  drawIdle();

  return {
    destroy() {
      destroyed = true;
      stopLoop();
      mediaElement.removeEventListener('play', handlePlay);
      mediaElement.removeEventListener('pause', handlePause);
      mediaElement.removeEventListener('ended', handlePause);
      window.removeEventListener('resize', handleResize);
      try {
        sourceNode.disconnect();
        analyser.disconnect();
      } catch {
        // Disconnect failures are safe to ignore during teardown.
      }
      audioContext.close?.().catch(() => {});
    }
  };
}
