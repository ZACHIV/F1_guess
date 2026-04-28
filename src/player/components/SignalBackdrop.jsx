import { useEffect, useRef } from 'react';

export default function SignalBackdrop() {
  const rootRef = useRef(null);
  const rafRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const updateScene = () => {
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      root.style.setProperty('--drift-x', `${(current.x * 8).toFixed(2)}px`);
      root.style.setProperty('--drift-y', `${(current.y * 6).toFixed(2)}px`);
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
    <div
      aria-hidden="true"
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        '--drift-x': '0px',
        '--drift-y': '0px'
      }}
    >
      {/* Red ambient glows */}
      <div style={{
        position: 'absolute',
        left: '-8%',
        top: '20%',
        width: '32rem',
        height: '32rem',
        borderRadius: '999px',
        background: 'rgba(255,51,48,0.06)',
        filter: 'blur(120px)',
        opacity: 0.5,
        transform: 'translate(var(--drift-x), var(--drift-y))'
      }} />
      <div style={{
        position: 'absolute',
        right: '-6%',
        bottom: '10%',
        width: '24rem',
        height: '24rem',
        borderRadius: '999px',
        background: 'rgba(225,6,0,0.05)',
        filter: 'blur(100px)',
        opacity: 0.4,
        transform: 'translate(calc(var(--drift-x) * -0.6), calc(var(--drift-y) * -0.4))'
      }} />
      <div style={{
        position: 'absolute',
        left: '40%',
        top: '-10%',
        width: '20rem',
        height: '20rem',
        borderRadius: '999px',
        background: 'rgba(255,51,48,0.04)',
        filter: 'blur(80px)',
        opacity: 0.3
      }} />
    </div>
  );
}
