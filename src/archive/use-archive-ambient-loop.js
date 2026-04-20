import { useEffect, useRef, useState } from 'react';

const DEFAULT_VOLUME = 0.36;
const LOOKAHEAD_MS = 180;
const TICK_MS = 150;

function fadeVolume(fromAudio, toAudio, durationMs, onDone) {
  const startedAt = performance.now();

  function frame(now) {
    const progress = Math.min((now - startedAt) / durationMs, 1);
    const eased = progress * progress * (3 - 2 * progress);

    if (fromAudio) {
      fromAudio.volume = fromAudio.__baseVolume * (1 - eased);
    }

    if (toAudio) {
      toAudio.volume = toAudio.__baseVolume * eased;
    }

    if (progress < 1) {
      window.requestAnimationFrame(frame);
      return;
    }

    onDone?.();
  }

  window.requestAnimationFrame(frame);
}

function disposeAudio(audio) {
  if (!audio) {
    return;
  }

  audio.pause?.();
  audio.currentTime = 0;
  audio.src = '';
}

export function useArchiveAmbientLoop(track) {
  const audioPairRef = useRef({ active: null, queued: null });
  const intervalRef = useRef(0);
  const overlapRef = useRef(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    setIsEnabled(true);
    setIsBlocked(false);
  }, [track?.id]);

  useEffect(() => {
    if (!track?.audioSrc || !track?.ambientEndMs || !isEnabled) {
      stopAmbientLoop(audioPairRef, intervalRef, overlapRef);
      return undefined;
    }

    let disposed = false;

    const startInstance = async (volume = DEFAULT_VOLUME) => {
      const audio = new Audio(track.audioSrc);
      audio.preload = 'auto';
      audio.loop = false;
      audio.currentTime = 0;
      audio.volume = 0;
      audio.__baseVolume = volume;
      await audio.play?.();
      return audio;
    };

    const queueOverlap = async () => {
      if (disposed || overlapRef.current) {
        return;
      }

      overlapRef.current = true;

      try {
        const nextAudio = await startInstance();
        audioPairRef.current.queued = nextAudio;

        fadeVolume(audioPairRef.current.active, nextAudio, track.crossfadeMs, () => {
          disposeAudio(audioPairRef.current.active);
          audioPairRef.current.active = nextAudio;
          audioPairRef.current.queued = null;
          overlapRef.current = false;
        });
      } catch {
        setIsBlocked(true);
      }
    };

    (async () => {
      try {
        stopAmbientLoop(audioPairRef, intervalRef, overlapRef);
        const audio = await startInstance();
        if (disposed) {
          disposeAudio(audio);
          return;
        }

        audio.volume = audio.__baseVolume;
        audioPairRef.current.active = audio;
        intervalRef.current = window.setInterval(() => {
          const currentAudio = audioPairRef.current.active;
          if (!currentAudio || overlapRef.current) {
            return;
          }

          const remainingMs = track.ambientEndMs - currentAudio.currentTime * 1000;
          if (remainingMs <= track.crossfadeMs + LOOKAHEAD_MS) {
            queueOverlap();
          }
        }, TICK_MS);
      } catch {
        setIsBlocked(true);
      }
    })();

    return () => {
      disposed = true;
      stopAmbientLoop(audioPairRef, intervalRef, overlapRef);
    };
  }, [retryToken, track?.ambientEndMs, track?.audioSrc, track?.crossfadeMs, track?.id, isEnabled]);

  return {
    isEnabled,
    isBlocked,
    setIsEnabled,
    retry() {
      setIsBlocked(false);
      setIsEnabled(true);
      setRetryToken((current) => current + 1);
    }
  };
}

function stopAmbientLoop(audioPairRef, intervalRef, overlapRef) {
  window.clearInterval(intervalRef.current);
  intervalRef.current = 0;
  overlapRef.current = false;
  disposeAudio(audioPairRef.current.active);
  disposeAudio(audioPairRef.current.queued);
  audioPairRef.current.active = null;
  audioPairRef.current.queued = null;
}
