import { useEffect, useMemo, useRef } from 'react';

const LAYER_CONFIGS = [
  { id: 'near', rows: 11, cols: 22, amplitude: 34, baseY: 438, rowGap: 19, phase: 0.2 },
  { id: 'mid', rows: 9, cols: 20, amplitude: 28, baseY: 352, rowGap: 18, phase: 0.9 },
  { id: 'far', rows: 7, cols: 18, amplitude: 18, baseY: 286, rowGap: 15, phase: 1.7 }
];

const SIDE_MARKS = Array.from({ length: 10 }, (_, index) => ({
  top: 4 + index * 9.2,
  width: 54 + (index % 4) * 12,
  offset: (index % 3) * 18
}));

function sampleWave(x, row, amplitude, phase) {
  return (
    Math.sin(x / 138 + row * 0.56 + phase) * amplitude
    + Math.cos(x / 72 + row * 0.28 + phase * 1.2) * amplitude * 0.18
  );
}

function buildMeshLayer(config) {
  const width = 1600;
  const height = 620;
  const stepX = width / (config.cols - 1);
  const horizontal = [];
  const vertical = [];

  for (let row = 0; row < config.rows; row += 1) {
    const points = [];
    const yBase = config.baseY - row * config.rowGap;

    for (let col = 0; col < config.cols; col += 1) {
      const x = col * stepX;
      const y = yBase + sampleWave(x, row, config.amplitude, config.phase);
      points.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }

    horizontal.push(points.join(' '));
  }

  for (let col = 0; col < config.cols; col += 1) {
    const points = [];
    const x = col * stepX;

    for (let row = 0; row < config.rows; row += 1) {
      const yBase = config.baseY - row * config.rowGap;
      const drift = Math.sin(row * 0.9 + config.phase + col * 0.14) * 10;
      const y = yBase + sampleWave(x, row, config.amplitude, config.phase);
      points.push(`${(x + drift).toFixed(2)},${y.toFixed(2)}`);
    }

    vertical.push(points.join(' '));
  }

  return {
    id: config.id,
    horizontal,
    vertical,
    width,
    height
  };
}

export default function SignalBackdrop() {
  const rootRef = useRef(null);
  const sceneRef = useRef(null);
  const rafRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const meshLayers = useMemo(() => LAYER_CONFIGS.map(buildMeshLayer), []);

  useEffect(() => {
    const root = rootRef.current;
    const scene = sceneRef.current;

    if (!root || !scene) {
      return undefined;
    }

    const updateScene = () => {
      const current = currentRef.current;
      const target = targetRef.current;

      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;

      root.style.setProperty('--tilt-x', `${(-current.y * 7).toFixed(2)}deg`);
      root.style.setProperty('--tilt-y', `${(current.x * 11).toFixed(2)}deg`);
      root.style.setProperty('--scene-drift-x', `${(current.x * 4).toFixed(2)}px`);
      root.style.setProperty('--scene-drift-y', `${(current.y * 3).toFixed(2)}px`);
      root.style.setProperty('--mesh-drift-near', `${(current.x * 18).toFixed(2)}px`);
      root.style.setProperty('--mesh-drift-mid', `${(current.x * 10).toFixed(2)}px`);
      root.style.setProperty('--mesh-drift-far', `${(current.x * 5).toFixed(2)}px`);

      rafRef.current = window.requestAnimationFrame(updateScene);
    };

    const handlePointerMove = (event) => {
      const bounds = root.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      targetRef.current = {
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y))
      };
    };

    const handlePointerLeave = () => {
      targetRef.current = { x: 0, y: 0 };
    };

    root.addEventListener('pointermove', handlePointerMove);
    root.addEventListener('pointerleave', handlePointerLeave);
    rafRef.current = window.requestAnimationFrame(updateScene);

    return () => {
      root.removeEventListener('pointermove', handlePointerMove);
      root.removeEventListener('pointerleave', handlePointerLeave);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div aria-hidden="true" className="signal-backdrop" ref={rootRef}>
      <div className="signal-backdrop__grid" />
      <div className="signal-backdrop__glow signal-backdrop__glow--left" />
      <div className="signal-backdrop__glow signal-backdrop__glow--right" />

      <div className="signal-backdrop__scene" ref={sceneRef}>
        {meshLayers.map((layer) => (
          <svg
            className={`signal-backdrop__mesh signal-backdrop__mesh--${layer.id}`}
            key={layer.id}
            preserveAspectRatio="none"
            viewBox={`0 0 ${layer.width} ${layer.height}`}
          >
            {layer.horizontal.map((line, index) => (
              <polyline
                className="signal-backdrop__mesh-line signal-backdrop__mesh-line--horizontal"
                key={`${layer.id}-h-${index}`}
                points={line}
              />
            ))}
            {layer.vertical.map((line, index) => (
              <polyline
                className="signal-backdrop__mesh-line signal-backdrop__mesh-line--vertical"
                key={`${layer.id}-v-${index}`}
                points={line}
              />
            ))}
          </svg>
        ))}
      </div>

      <div className="signal-backdrop__frame signal-backdrop__frame--left">
        <span />
        <span />
        <span />
      </div>
      <div className="signal-backdrop__frame signal-backdrop__frame--right">
        {SIDE_MARKS.map((mark) => (
          <span
            key={`${mark.top}-${mark.width}`}
            style={{
              top: `${mark.top}%`,
              width: `${mark.width}px`,
              right: `${mark.offset}px`
            }}
          />
        ))}
      </div>
    </div>
  );
}
