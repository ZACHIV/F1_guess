// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

  beforeEach(() => {
    global.ResizeObserver = MockResizeObserver;
    global.requestAnimationFrame = vi.fn(() => 1);
    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.ResizeObserver = originalResizeObserver;
    global.requestAnimationFrame = originalRequestAnimationFrame;
    global.cancelAnimationFrame = originalCancelAnimationFrame;
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

  it('closes the detail view when the surrounding blank layout area is clicked', () => {
    render(<ArchiveApp />);

    openMonacoDossier();

    expect(screen.getByRole('dialog', { name: /monte carlo archive detail/i })).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('archive-detail-layout'));

    expect(screen.queryByRole('dialog', { name: /monte carlo archive detail/i })).not.toBeInTheDocument();
  });
});
