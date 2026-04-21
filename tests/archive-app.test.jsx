// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ArchiveApp from '../src/archive/ArchiveApp.jsx';

class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    this.callback([{ contentRect: { width: 1440 } }]);
  }

  disconnect() {}
}

describe('ArchiveApp', () => {
  const originalResizeObserver = global.ResizeObserver;
  const originalRequestAnimationFrame = global.requestAnimationFrame;
  const originalCancelAnimationFrame = global.cancelAnimationFrame;
  const originalAudio = global.Audio;
  let audioInstances = [];

  beforeEach(() => {
    global.ResizeObserver = MockResizeObserver;
    global.requestAnimationFrame = vi.fn(() => 1);
    global.cancelAnimationFrame = vi.fn();
    audioInstances = [];
    global.Audio = vi.fn((src) => {
      const audio = {
        src,
        preload: 'auto',
        loop: false,
        currentTime: 0,
        volume: 1,
        __baseVolume: 1,
        play: vi.fn().mockResolvedValue(undefined),
        pause: vi.fn()
      };
      audioInstances.push(audio);
      return audio;
    });
  });

  afterEach(() => {
    cleanup();
    global.ResizeObserver = originalResizeObserver;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
    global.Audio = originalAudio;
  });

  function openMonacoDossier() {
    const button = screen.getByRole('button', { name: /open monaco dossier/i });
    fireEvent.pointerDown(button, { pointerId: 1, clientX: 120 });
    fireEvent.pointerUp(button, { pointerId: 1, clientX: 120 });
    fireEvent.click(button);
  }

  it('renders the full circuit archive from the complete challenge library', () => {
    render(<ArchiveApp />);

    expect(screen.getAllByRole('button', { name: /open .* dossier/i })).toHaveLength(24);
    expect(screen.getByRole('button', { name: /open china dossier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open qatar dossier/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open mexico dossier/i })).toBeInTheDocument();
  });

  it('jump in opens a valid circuit dossier from the curated collection', () => {
    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<ArchiveApp />);

    fireEvent.click(screen.getByRole('button', { name: /jump into the archive/i }));

    expect(screen.getByRole('dialog', { name: /albert park archive detail/i })).toBeInTheDocument();

    randomSpy.mockRestore();
  });

  it('surfaces a turn 1 minigame entry in the archive intro panel', () => {
    render(<ArchiveApp />);

    const link = screen.getByRole('link', { name: /enter the turn 1 desk test/i });
    expect(link).toHaveAttribute('href', '/turn1.html');
  });

  it('opens an inline archive detail view for the selected circuit and closes on escape', () => {
    render(<ArchiveApp />);

    expect(screen.queryByText("Curator's Note")).not.toBeInTheDocument();

    openMonacoDossier();

    expect(screen.getByRole('dialog', { name: /monte carlo archive detail/i })).toBeInTheDocument();
    expect(screen.getByText("Curator's Note")).toBeInTheDocument();
    expect(screen.getByText('Monte Carlo forms the archive’s benchmark for proximity, theatre, and impossible precision.')).toBeInTheDocument();
    expect(screen.getByText('3.337 km')).toBeInTheDocument();
    expect(screen.getAllByText('19')).toHaveLength(2);
    expect(screen.getAllByText('1950')).toHaveLength(2);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /monte carlo archive detail/i })).not.toBeInTheDocument();
  });

  it('starts ambient playback for the selected track and stops it on close', async () => {
    render(<ArchiveApp />);

    openMonacoDossier();

    await waitFor(() => {
      expect(global.Audio).toHaveBeenCalledWith('/audio/monaco-quali-lando-norris-2025.mp3');
    });

    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(audioInstances[0].pause).toHaveBeenCalled();
    });
  });

  it('supports next and previous browsing controls plus keyboard navigation in detail mode', () => {
    render(<ArchiveApp />);

    openMonacoDossier();

    expect(screen.getByText('08 / 24')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /next circuit/i }));

    expect(screen.getByRole('dialog', { name: /barcelona-catalunya archive detail/i })).toBeInTheDocument();
    expect(screen.getByText('09 / 24')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    expect(screen.getByRole('dialog', { name: /monte carlo archive detail/i })).toBeInTheDocument();
    expect(screen.getByText('08 / 24')).toBeInTheDocument();
  });

  it('switches the ambient source when browsing to the next circuit', async () => {
    render(<ArchiveApp />);

    openMonacoDossier();
    fireEvent.click(screen.getByRole('button', { name: /next circuit/i }));

    await waitFor(() => {
      expect(global.Audio).toHaveBeenCalledWith('/audio/monaco-quali-lando-norris-2025.mp3');
      expect(global.Audio).toHaveBeenCalledWith('/audio/spain-quali-oscar-piastri-2025.mp3');
    });
  });

  it('closes the detail view when the surrounding blank layout area is clicked', () => {
    render(<ArchiveApp />);

    openMonacoDossier();

    expect(screen.getByRole('dialog', { name: /monte carlo archive detail/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('archive-detail-layout'));

    expect(screen.queryByRole('dialog', { name: /monte carlo archive detail/i })).not.toBeInTheDocument();
  });

  it('offers a track-specific turn 1 entry from the archive detail view', () => {
    render(<ArchiveApp />);

    openMonacoDossier();

    const link = screen.getByRole('link', { name: /enter monte carlo turn 1 desk test/i });
    expect(link).toHaveAttribute('href', '/turn1.html?track=monaco-quali-lando-norris-2025');
  });
});
