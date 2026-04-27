// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Turn1App from '../src/turn1/Turn1App.jsx';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('Turn1App', () => {
  it('renders the minigame shell and answer options', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"></svg>'
    })));

    render(<Turn1App />);

    expect(screen.getByRole('heading', { name: /turn 1 desk test/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to gallery/i })).toHaveAttribute('href', '/');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /next corner/i })).toBeInTheDocument();
      expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(5);
    });
  });

  it('reveals the answer state after choosing an option', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"></svg>'
    })));

    render(<Turn1App />);

    await waitFor(() => {
      expect(screen.getByText(/which circuit opens like this/i)).toBeInTheDocument();
    });

    const firstOption = screen.getAllByRole('button').find((button) => button.textContent && button.textContent !== 'Next corner');
    fireEvent.click(firstOption);

    await waitFor(() => {
      expect(screen.getByText(/Reveal/i)).toBeInTheDocument();
    });
  });

  it('hides archive identity metadata before answering and reveals it afterwards', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"></svg>'
    })));

    render(<Turn1App />);

    await waitFor(() => {
      expect(screen.getByText(/answer first\. details later\./i)).toBeInTheDocument();
    });

    expect(screen.queryByText('Country')).not.toBeInTheDocument();
    expect(screen.queryByText('Circuit')).not.toBeInTheDocument();

    const firstOption = screen.getAllByRole('button').find((button) => button.textContent && button.textContent !== 'Next corner');
    fireEvent.click(firstOption);

    await waitFor(() => {
      expect(screen.getAllByText('Country').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Circuit').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Australia').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Albert Park').length).toBeGreaterThan(0);
    });
  });
});
