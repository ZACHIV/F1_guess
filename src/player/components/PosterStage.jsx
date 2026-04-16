export default function PosterStage({ challenge, children }) {
  const posterSrc = challenge.posterSrc || '/assets/max-verstappen.jpg';

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,120,36,0.18),_transparent_24%),linear-gradient(180deg,_#040507_0%,_#020304_100%)] text-stone-100"
      data-testid="poster-stage"
    >
      <div className="absolute inset-0">
        <img
          alt={challenge.driverName ? `${challenge.driverName} poster` : 'Driver poster'}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
          src={posterSrc}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,4,8,0.28)_0%,rgba(2,4,8,0.45)_32%,rgba(2,4,8,0.9)_72%,rgba(2,4,8,1)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_22%,rgba(114,176,255,0.22),transparent_18%),radial-gradient(circle_at_22%_70%,rgba(255,124,39,0.2),transparent_26%)]" />
        <div className="poster-grid absolute inset-0 opacity-35" />
        <div className="poster-noise absolute inset-0 opacity-20 mix-blend-screen" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(0,0,0,0.52),transparent)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(4,5,7,0.16)_40%,rgba(4,5,7,0.82)_100%)]" />
      <div className="relative z-10 flex min-h-screen flex-col px-4 pb-6 pt-6 sm:px-5">
        {children}
      </div>
    </main>
  );
}
