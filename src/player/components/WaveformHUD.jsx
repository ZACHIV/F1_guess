import { useEffect, useEffectEvent, useRef } from 'react';
import { mountWaveform } from '../../lib/waveform.js';

export default function WaveformHUD({ audioSrc, onReady, onPlayStateChange, onTimeUpdate, onFinish }) {
  const waveformRef = useRef(null);
  const emitReady = useEffectEvent((value) => onReady?.(value));
  const emitPlayStateChange = useEffectEvent((value) => onPlayStateChange?.(value));
  const emitTimeUpdate = useEffectEvent((value) => onTimeUpdate?.(value));
  const emitFinish = useEffectEvent(() => onFinish?.());

  useEffect(() => {
    const waveform = mountWaveform(waveformRef.current, audioSrc, {
      height: 76,
      barWidth: 2,
      barGap: 2,
      waveColor: 'rgba(196, 210, 255, 0.28)',
      progressColor: '#f8fafc'
    });

    if (!waveform) {
      emitReady(null);
      return undefined;
    }

    emitReady(waveform);

    waveform.on('timeupdate', (currentTime) => {
      emitTimeUpdate(currentTime * 1000);
    });

    waveform.on('play', () => emitPlayStateChange(true));
    waveform.on('pause', () => emitPlayStateChange(false));
    waveform.on('finish', () => {
      emitPlayStateChange(false);
      emitFinish();
    });

    return () => {
      waveform.destroy();
      emitReady(null);
    };
  }, [audioSrc]);

  return (
    <section
      className="glass-panel relative overflow-hidden rounded-[28px] border border-white/12 px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.42)]"
      data-testid="waveform-hud"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.06),transparent_35%,rgba(255,126,40,0.08)_100%)]" />
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="hud-label">engine note</p>
            <p className="mt-1 text-sm text-stone-300/90">Audio-synced waveform</p>
          </div>
          <div className="text-right">
            <p className="hud-stat">{audioSrc ? 'Live' : 'Offline'}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] text-stone-400">
              {audioSrc ? 'Telemetry lock' : 'Awaiting clip'}
            </p>
          </div>
        </div>

        <div className="waveform-frame rounded-[24px] border border-white/10 bg-black/20 px-2 py-3">
          <div className="min-h-[76px] w-full" ref={waveformRef} />
          {!audioSrc ? (
            <div className="waveform-placeholder absolute inset-x-4 top-16 h-[76px]">
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
