export default function PosterStage({ challenge, result, runState, children }) {
  const posterSrc = challenge.posterSrc || '/assets/max_with_earphone.jpeg';

  return (
    <main
      className="duel-stage relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,120,36,0.18),_transparent_24%),linear-gradient(180deg,_#040507_0%,_#020304_100%)] text-stone-100"
      data-testid="poster-stage"
    >
      <div className="absolute inset-0">
        <img
          alt=""
          aria-hidden="true"
          className="duel-stage__backdrop-image absolute inset-0 h-full w-full object-cover"
          src={posterSrc}
        />
        <div className="duel-stage__backdrop-veil absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full items-center justify-center px-3 py-4 sm:px-6 sm:py-6">
        <div className="duel-stage__phone-shell relative h-[min(100vh-2rem,920px)] w-[min(100%,430px)] overflow-hidden rounded-[2rem] border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.45)] sm:rounded-[2.4rem]">
          <img
            alt={challenge.driverName ? `${challenge.driverName} poster` : 'Driver poster'}
            className="duel-stage__portrait absolute inset-0 h-full w-full object-cover object-center"
            src={posterSrc}
          />
          <div className="duel-stage__photo-overlay absolute inset-0" />
          <div className="duel-stage__top-glow absolute inset-x-0 top-0 h-44" />
          <div className="duel-stage__bottom-glow absolute inset-x-0 bottom-0 h-72" />
          <div className="poster-noise absolute inset-0 opacity-[0.14] mix-blend-screen" />

          <div className="relative z-10 flex min-h-full flex-col">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
