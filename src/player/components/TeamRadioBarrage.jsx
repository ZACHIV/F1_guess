import { useEffect, useRef, useState } from 'react';
import { getTeamRadioBarragePool } from '../team-radio-barrage.js';

const LIVE_LANES = [15, 23, 31, 40, 49, 58];
const MAX_LANES = [18, 30, 42, 54];

function getRandomNumber(min, max) {
  return min + Math.random() * (max - min);
}

function pickEntry(pool, previousId) {
  if (!pool.length) {
    return null;
  }

  const filteredPool = pool.filter((entry) => entry.id !== previousId);
  const nextPool = filteredPool.length ? filteredPool : pool;
  return nextPool[Math.floor(Math.random() * nextPool.length)];
}

export default function TeamRadioBarrage({ result, runState }) {
  const mode =
    result?.outcome === 'lose' || result?.outcome === 'timeout'
      ? 'max-win'
      : runState === 'live'
        ? 'live'
        : 'off';
  const [messages, setMessages] = useState([]);
  const previousEntryIdRef = useRef('');
  const laneIndexRef = useRef(0);

  useEffect(() => {
    const pool = getTeamRadioBarragePool(mode);

    if (mode === 'off' || !pool.length) {
      setMessages([]);
      previousEntryIdRef.current = '';
      laneIndexRef.current = 0;
      return undefined;
    }

    let messageId = 0;
    const timeouts = new Set();
    const laneSet = mode === 'max-win' ? MAX_LANES : LIVE_LANES;

    const clearTimer = (timer) => {
      window.clearTimeout(timer);
      timeouts.delete(timer);
    };

    const scheduleSpawn = (delayMs) => {
      const timer = window.setTimeout(() => {
        timeouts.delete(timer);
        spawnMessage();
      }, delayMs);
      timeouts.add(timer);
    };

    const spawnMessage = () => {
      const entry = pickEntry(pool, previousEntryIdRef.current);
      if (!entry) {
        return;
      }

      previousEntryIdRef.current = entry.id;
      const lane = laneSet[laneIndexRef.current % laneSet.length];
      laneIndexRef.current += 1;
      const durationMs = mode === 'max-win' ? getRandomNumber(7600, 9800) : getRandomNumber(10800, 14200);
      const item = {
        id: `${mode}-${messageId}`,
        driver: entry.driver,
        quote: entry.quote,
        lane,
        durationMs,
        accent: mode === 'max-win' ? 'max' : laneIndexRef.current % 3 === 0 ? 'ice' : 'heat'
      };

      messageId += 1;
      setMessages((current) => [...current.slice(-7), item]);

      const removalTimer = window.setTimeout(() => {
        clearTimer(removalTimer);
        setMessages((current) => current.filter((message) => message.id !== item.id));
      }, durationMs + 280);
      timeouts.add(removalTimer);

      scheduleSpawn(mode === 'max-win' ? getRandomNumber(1100, 1900) : getRandomNumber(1800, 3200));
    };

    scheduleSpawn(mode === 'max-win' ? 220 : 600);

    return () => {
      timeouts.forEach((timer) => window.clearTimeout(timer));
      timeouts.clear();
      setMessages([]);
      previousEntryIdRef.current = '';
      laneIndexRef.current = 0;
    };
  }, [mode]);

  if (!messages.length) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className={`team-radio-barrage team-radio-barrage--${mode}`}
      data-testid="team-radio-barrage"
    >
      {messages.map((message) => (
        <div
          className="team-radio-barrage__item"
          data-accent={message.accent}
          key={message.id}
          style={{
            '--barrage-duration': `${message.durationMs}ms`,
            '--barrage-top': `${message.lane}%`
          }}
        >
          <span className="team-radio-barrage__driver">{message.driver}</span>
          <span className="team-radio-barrage__quote">{message.quote}</span>
        </div>
      ))}
    </div>
  );
}
