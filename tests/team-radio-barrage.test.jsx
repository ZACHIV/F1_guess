// @vitest-environment jsdom

import { act } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import TeamRadioBarrage from '../src/player/components/TeamRadioBarrage.jsx';

describe('TeamRadioBarrage', () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('spawns encouragement barrage messages while the duel is live', () => {
    vi.useFakeTimers();
    render(<TeamRadioBarrage result={null} runState="live" />);

    expect(screen.queryByTestId('team-radio-barrage')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(screen.getByTestId('team-radio-barrage').textContent).not.toHaveLength(0);
  });

  it('switches to the Max-only voice pack after a loss', () => {
    vi.useFakeTimers();
    render(<TeamRadioBarrage result={{ outcome: 'lose' }} runState="result" />);

    act(() => {
      vi.advanceTimersByTime(260);
    });

    const barrage = screen.getByTestId('team-radio-barrage');
    expect(barrage.textContent).toContain('Simply lovely.');
    expect(barrage.textContent).toContain('Max Verstappen');
  });
});
