import SignalBackdrop from './SignalBackdrop.jsx';

export default function PosterStage({ children }) {
  return (
    <div className="relative min-h-screen" data-testid="poster-stage" style={{ background: 'var(--color-bg)' }}>
      <SignalBackdrop />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
