import VerstappenVictoryOverlay from './VerstappenVictoryOverlay.jsx';

export default function PosterStage({ challenge, result, children }) {
  const posterSrc = challenge.posterSrc || '/assets/max-verstappen.jpg';
  const hasLoss = result?.outcome === 'lose' || result?.outcome === 'timeout';
  const hasWin = result?.outcome === 'win';

  return (
    <main
      className={`duel-stage relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,120,36,0.18),_transparent_24%),linear-gradient(180deg,_#040507_0%,_#020304_100%)] text-stone-100 ${
        hasLoss ? 'is-defeat' : ''
      } ${hasWin ? 'is-victory' : ''}`}
      data-testid="poster-stage"
    >
      <div className="absolute inset-0">
        <div className="duel-stage__portrait-shell absolute right-[-10vw] top-[-6vh] h-[64vh] w-[58vw] min-w-[34rem] overflow-hidden rounded-[3rem] border border-white/8">
          <img
            alt={challenge.driverName ? `${challenge.driverName} poster` : 'Driver poster'}
            className="duel-stage__portrait absolute inset-0 h-full w-full object-cover object-center"
            src={posterSrc}
          />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,8,0.2)_0%,rgba(2,4,8,0.34)_24%,rgba(2,4,8,0.82)_70%,rgba(2,4,8,0.96)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(166,222,255,0.12),transparent_16%),radial-gradient(circle_at_18%_18%,rgba(255,206,111,0.1),transparent_18%),radial-gradient(circle_at_24%_72%,rgba(255,124,39,0.16),transparent_20%)]" />
        <div className="poster-grid absolute inset-0 opacity-35" />
        <div className="poster-noise absolute inset-0 opacity-20 mix-blend-screen" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(0,0,0,0.4),transparent)]" />
      </div>
      <div className="duel-stage__wash absolute inset-0" />
      <div className="duel-stage__vignette absolute inset-0" />
      <VerstappenVictoryOverlay challenge={challenge} result={result} />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(4,5,7,0.16)_40%,rgba(4,5,7,0.82)_100%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1380px] flex-col px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
