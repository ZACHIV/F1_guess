import { useEffect, useEffectEvent, useRef } from 'react';
import { mountWaveform } from '../../lib/waveform.js';

export default function WaveformHUD({
  audioSrc,
  hidden = false,
  onReady,
  onPlayStateChange,
  onTimeUpdate,
  onFinish
}) {
  const waveformRef = useRef(null);
  const emitReady = useEffectEvent((value) => onReady?.(value));
  const emitPlayStateChange = useEffectEvent((value) => onPlayStateChange?.(value));
  const emitTimeUpdate = useEffectEvent((value) => onTimeUpdate?.(value));
  const emitFinish = useEffectEvent(() => onFinish?.());

  useEffect(() => {
    const waveform = mountWaveform(waveformRef.current, audioSrc, {
      height: 30,
      barWidth: 2,
      barRadius: 999,
      barGap: 1.35,
      waveColor: 'rgba(255, 255, 255, 0.55)',
      progressColor: 'rgba(255, 255, 255, 0.98)'
    });

    if (!waveform) {
      emitReady(null);
      return undefined;
    }

    emitReady(waveform);

    waveform.on('timeupdate', (currentTime) => {
      emitTimeUpdate(currentTime * 1000);
    });

    waveform.on('play', () => {
      emitPlayStateChange(true);
    });

    waveform.on('pause', () => {
      emitPlayStateChange(false);
    });

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
      className={hidden
        ? 'waveform-hud--hidden'
        : 'poster-waveform pointer-events-none px-11 pt-14 sm:px-14 sm:pt-16'}
      data-testid="waveform-hud"
    >
      <div className="poster-waveform__glow" />
      <div className="poster-waveform__shell">
        <div className="poster-waveform__canvas" ref={waveformRef} />
      </div>
    </section>
  );
}
