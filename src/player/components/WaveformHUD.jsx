import { useEffect, useEffectEvent, useMemo, useRef } from 'react';
import { mountWaveform } from '../../lib/waveform.js';

export default function WaveformHUD({
  audioSrc,
  runState,
  result,
  isPlaying,
  elapsedMs,
  benchmarkLabel,
  onReady,
  onPlayStateChange,
  onTimeUpdate,
  onFinish
}) {
  const waveformRef = useRef(null);
  const reactiveBarRefs = useRef([]);
  const emitReady = useEffectEvent((value) => onReady?.(value));
  const emitPlayStateChange = useEffectEvent((value) => onPlayStateChange?.(value));
  const emitTimeUpdate = useEffectEvent((value) => onTimeUpdate?.(value));
  const emitFinish = useEffectEvent(() => onFinish?.());
  const reactiveBars = useMemo(
    () => Array.from({ length: 72 }, (_, index) => ({
      id: index,
      height: `${28 + ((index * 17) % 48)}%`,
      delay: `${(index % 12) * 80}ms`,
      duration: `${1200 + ((index * 47) % 900)}ms`,
      seed: ((index * 13) % 19) / 18
    })),
    []
  );
  const stageCopy = useMemo(() => {
    if (result?.outcome === 'win') {
      return {
        eyebrow: 'audio dominance',
        title: 'You heard the corner map before Max did.',
        meta: `Benchmark cleared at ${benchmarkLabel}.`
      };
    }

    if (result?.outcome === 'lose' || result?.outcome === 'timeout') {
      return {
        eyebrow: 'orange takeover',
        title: 'Verstappen P1. The headset duel is over.',
        meta: result.outcome === 'timeout' ? 'Clock expired at 60.00s.' : `Max closed it at ${benchmarkLabel}.`
      };
    }

    if (runState === 'live') {
      return {
        eyebrow: 'live duel',
        title: 'Listen for shift rhythm, lift points, and straight-line violence.',
        meta: `Max benchmark: ${benchmarkLabel}.`
      };
    }

    return {
      eyebrow: 'black-box preview',
      title: 'One random circuit. One minute. Only the engine note.',
      meta: 'Start the duel to unlock the live waveform wall.'
    };
  }, [benchmarkLabel, result, runState]);

  useEffect(() => {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    const waveform = mountWaveform(waveformRef.current, audioSrc, {
      height: 164,
      barWidth: 3,
      barRadius: 999,
      barGap: 2,
      waveColor: 'rgba(158, 190, 255, 0.24)',
      progressColor: '#f6f7fb'
    });

    if (!waveform) {
      emitReady(null);
      return undefined;
    }

    emitReady(waveform);

    let animationFrameId = 0;
    let animationTick = 0;
    let context = null;
    let analyser = null;
    let dataArray = null;
    let mediaSource = null;
    let monitorGain = null;

    const mediaElement = typeof waveform.getMediaElement === 'function'
      ? waveform.getMediaElement()
      : null;

    if (AudioContextCtor && mediaElement instanceof HTMLMediaElement) {
      try {
        context = new AudioContextCtor();
        analyser = context.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.82;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        mediaSource = context.createMediaElementSource(mediaElement);
        monitorGain = context.createGain();
        monitorGain.gain.value = 0;
        mediaSource.connect(analyser);
        analyser.connect(monitorGain);
        monitorGain.connect(context.destination);
      } catch {
        analyser = null;
        dataArray = null;
      }
    }

    const renderReactiveBars = () => {
      if (!analyser || !dataArray) {
        return;
      }

      analyser.getByteFrequencyData(dataArray);
      animationTick += 1;

      for (let index = 0; index < reactiveBarRefs.current.length; index += 1) {
        const node = reactiveBarRefs.current[index];
        if (!node) {
          continue;
        }

        const sampleIndex = Math.min(
          dataArray.length - 1,
          Math.floor((index / reactiveBarRefs.current.length) * dataArray.length)
        );
        const energy = dataArray[sampleIndex] / 255;
        const seed = reactiveBars[index]?.seed ?? 0;
        const shimmer = 0.15 + (Math.sin(animationTick / 6 + index / 5) + 1) * 0.08;
        const amplitude = Math.max(0.14, Math.min(1.18, energy * 1.08 + seed * 0.28 + shimmer));
        const opacity = Math.max(0.28, Math.min(1, 0.26 + energy * 0.88));
        node.style.transform = `scaleY(${amplitude.toFixed(3)})`;
        node.style.opacity = opacity.toFixed(3);
      }
    };

    const stopReactiveLoop = () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    };

    const startReactiveLoop = async () => {
      if (context?.state === 'suspended') {
        try {
          await context.resume();
        } catch {
          // Ignore resume failures and keep CSS fallback motion.
        }
      }

      stopReactiveLoop();

      const tick = () => {
        renderReactiveBars();
        animationFrameId = window.requestAnimationFrame(tick);
      };

      tick();
    };

    waveform.on('timeupdate', (currentTime) => {
      emitTimeUpdate(currentTime * 1000);
    });

    waveform.on('play', () => {
      emitPlayStateChange(true);
      void startReactiveLoop();
    });
    waveform.on('pause', () => {
      emitPlayStateChange(false);
      stopReactiveLoop();
    });
    waveform.on('finish', () => {
      emitPlayStateChange(false);
      stopReactiveLoop();
      emitFinish();
    });

    return () => {
      stopReactiveLoop();
      monitorGain?.disconnect();
      analyser?.disconnect();
      mediaSource?.disconnect();
      if (context && context.state !== 'closed') {
        void context.close().catch(() => {});
      }
      waveform.destroy();
      emitReady(null);
    };
  }, [audioSrc, reactiveBars]);

  return (
    <section
      className={`glass-panel waveform-stage relative overflow-hidden rounded-[34px] border border-white/12 px-4 py-4 shadow-[0_28px_100px_rgba(0,0,0,0.5)] ${
        runState === 'live' ? 'is-live' : ''
      } ${result?.outcome === 'lose' || result?.outcome === 'timeout' ? 'is-defeat' : ''} ${
        result?.outcome === 'win' ? 'is-victory' : ''
      }`}
      data-testid="waveform-hud"
    >
      <div className="waveform-stage__grid pointer-events-none absolute inset-0" />
      <div className="waveform-stage__aurora pointer-events-none absolute inset-0" />
      <div className="waveform-stage__beam pointer-events-none absolute inset-y-0 left-0 w-1/3" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="hud-label">{stageCopy.eyebrow}</p>
            <p className="mt-2 max-w-[24rem] text-sm leading-6 text-stone-200/92">{stageCopy.title}</p>
          </div>
          <div className="text-right">
            <p className="hud-stat">{audioSrc ? 'Hot mic' : 'Offline'}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-stone-400">{stageCopy.meta}</p>
            <p className="mt-2 text-[1.65rem] font-semibold tracking-[-0.08em] text-white">
              {(elapsedMs / 1000).toFixed(2)}s
            </p>
          </div>
        </div>

        <div className="waveform-frame rounded-[28px] border border-white/10 bg-black/25 px-3 py-5">
          <div className="waveform-stage__rails pointer-events-none absolute inset-x-5 top-1/2 -translate-y-1/2" />
          <div className="waveform-stage__halo pointer-events-none absolute inset-x-[10%] top-[18%] h-16 rounded-full" />
          <div
            aria-hidden="true"
            className={`waveform-reactive ${isPlaying ? 'is-playing' : ''} ${
              runState === 'live' ? 'is-live' : ''
            }`}
          >
            {reactiveBars.map((bar) => (
              <span
                className="waveform-reactive__bar"
                key={bar.id}
                ref={(node) => {
                  reactiveBarRefs.current[bar.id] = node;
                }}
                style={{
                  '--bar-height': bar.height,
                  '--bar-delay': bar.delay,
                  '--bar-duration': bar.duration
                }}
              />
            ))}
          </div>
          <div className="min-h-[164px] w-full" ref={waveformRef} />
          {!audioSrc ? (
            <div className="waveform-placeholder absolute inset-x-4 top-12 h-[164px]">
              {Array.from({ length: 32 }).map((_, index) => (
                <span key={index} style={{ '--index': index }} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
