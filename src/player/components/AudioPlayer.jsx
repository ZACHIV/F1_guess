import { useEffect, useEffectEvent, useRef } from 'react';

export default function AudioPlayer({
  audioSrc,
  onFinish,
  onPlayStateChange,
  onReady,
  onTimeUpdate
}) {
  const audioRef = useRef(null);
  const frameRef = useRef(0);
  const emitReady = useEffectEvent((value) => onReady?.(value));
  const emitPlayStateChange = useEffectEvent((value) => onPlayStateChange?.(value));
  const emitTimeUpdate = useEffectEvent((value) => onTimeUpdate?.(value));
  const emitFinish = useEffectEvent(() => onFinish?.());
  const stopFrameLoop = useEffectEvent(() => {
    if (!frameRef.current) {
      return;
    }

    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  });
  const syncPlaybackTime = useEffectEvent(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    emitTimeUpdate(audio.currentTime * 1000);
  });
  const startFrameLoop = useEffectEvent(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    stopFrameLoop();

    const tick = () => {
      if (!audioRef.current || audioRef.current.paused || audioRef.current.ended) {
        frameRef.current = 0;
        return;
      }

      syncPlaybackTime();
      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioSrc) {
      emitReady(null);
      return undefined;
    }

    const handleTimeUpdate = () => {
      emitTimeUpdate(audio.currentTime * 1000);
    };
    const handlePlay = () => {
      emitPlayStateChange(true);
      startFrameLoop();
    };
    const handlePause = () => {
      stopFrameLoop();
      syncPlaybackTime();
      emitPlayStateChange(false);
    };
    const handleEnded = () => {
      stopFrameLoop();
      syncPlaybackTime();
      emitPlayStateChange(false);
      emitFinish();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    emitReady(audio);

    return () => {
      stopFrameLoop();
      audio.pause();
      audio.currentTime = 0;
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      emitReady(null);
    };
  }, [audioSrc]);

  return (
    <audio
      aria-hidden="true"
      data-testid="duel-audio"
      preload="auto"
      ref={audioRef}
      src={audioSrc}
      style={{ display: 'none' }}
    />
  );
}
