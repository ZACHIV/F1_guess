import SignalBackdrop from './SignalBackdrop.jsx';

export default function PosterStage({ children }) {
  return (
    <main className="duel-stage relative min-h-screen overflow-hidden text-[#f6eee8]" data-testid="poster-stage">
      <SignalBackdrop />
      <div className="duel-stage__backdrop-veil absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1560px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="duel-stage__shell relative flex min-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-[2rem] border border-[rgba(246,238,232,0.08)] bg-[rgba(18,12,12,0.38)] shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-[10px] sm:rounded-[2.4rem]">
          <div className="duel-stage__shell-highlight absolute inset-x-0 top-0 h-32" />
          <div className="poster-noise absolute inset-0 opacity-[0.2]" />
          <div className="relative z-10 flex min-h-full flex-col">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
