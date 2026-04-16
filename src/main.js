import './styles.css';
import fallbackChallenges from './data/challenge-library.json';
import { normalizeChallenge } from './lib/challenge-utils.js';
import { loadChallengeTelemetry } from './lib/challenge-assets.js';
import { mountWaveform } from './lib/waveform.js';
import {
  buildTelemetryPath,
  getInterpolatedTelemetryPoint,
  getNearestTelemetrySample,
  normalizeTelemetryPoints,
  toElapsedSamples
} from './lib/telemetry-utils.js';

const TRACK_DIMENSIONS = { width: 360, height: 250, padding: 26 };
const STORAGE_KEY = 'f1-guess:selected-challenge';
const app = document.querySelector('#app');

let library = [];
let selectedChallengeId = '';
let activeWaveform = null;

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function destroyWaveform() {
  if (!activeWaveform) {
    return;
  }

  activeWaveform.destroy();
  activeWaveform = null;
}

function getStoredChallengeId() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeChallengeId(challengeId) {
  try {
    window.localStorage.setItem(STORAGE_KEY, challengeId);
  } catch {
    // Ignore storage failures in private mode.
  }
}

function getPlayableChallenges(challenges) {
  return challenges
    .map((challenge) => normalizeChallenge(challenge))
    .filter((challenge) =>
      challenge.audioSrc &&
      challenge.trackSvgSrc &&
      challenge.telemetryLocationSrc &&
      challenge.telemetryCarDataSrc
    );
}

async function loadChallengeLibrary() {
  try {
    const response = await fetch('/api/studio/library');
    if (!response.ok) {
      throw new Error('load failed');
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload : payload.records;
  } catch {
    return fallbackChallenges;
  }
}

function getSelectedChallenge() {
  return library.find((challenge) => challenge.id === selectedChallengeId) ?? library[0] ?? null;
}

function renderLoadingShell() {
  app.innerHTML = `
    <main class="page-shell">
      <section class="answer-panel">
        <p class="answer-feedback__label">Loading</p>
        <h2>正在载入题目与遥测数据...</h2>
      </section>
    </main>
  `;
}

function renderErrorShell(message) {
  app.innerHTML = `
    <main class="page-shell">
      <section class="answer-panel">
        <p class="answer-feedback__label">Load failed</p>
        <h2>${escapeHtml(message)}</h2>
      </section>
    </main>
  `;
}

function renderChallengeChips(currentChallenge) {
  return `
    <div class="challenge-switcher">
      <span class="challenge-switcher__label">题库</span>
      <div class="challenge-switcher__list">
        ${library.map((challenge, index) => `
          <button
            class="challenge-chip ${challenge.id === currentChallenge.id ? 'is-active' : ''}"
            type="button"
            data-challenge-id="${escapeHtml(challenge.id)}"
          >
            <strong>${String(index + 1).padStart(2, '0')}</strong>
            <span>${escapeHtml(challenge.trackName || challenge.title || challenge.id)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function buildTelemetryModel(locationData, carData) {
  const locationFrames = normalizeTelemetryPoints(toElapsedSamples(locationData), TRACK_DIMENSIONS);
  const carFrames = toElapsedSamples(carData);

  if (!locationFrames.length) {
    throw new Error('Challenge telemetry has no location frames.');
  }

  if (!carFrames.length) {
    throw new Error('Challenge telemetry has no car data frames.');
  }

  return {
    locationFrames,
    carFrames,
    telemetryPath: buildTelemetryPath(locationFrames),
    initialMarker: locationFrames[0],
    initialHud: carFrames[0]
  };
}

function renderChallengeView(challenge, telemetryModel) {
  const {
    telemetryPath,
    initialMarker,
    initialHud
  } = telemetryModel;

  app.innerHTML = `
    <main class="page-shell">
      <section class="experience-frame">
        <section class="media-stage">
          <div class="media-stage__overlay"></div>
          <div class="media-stage__scanlines"></div>
          <header class="top-bar">
            <div>
              <p class="eyebrow">F1 SOUND GUESS</p>
              <h1>Read the circuit from the engine note.</h1>
            </div>
            <div class="top-bar__actions">
              <a class="developer-link" href="/studio.html" target="_blank" rel="noreferrer">开发者模式</a>
              <span class="status-pill ${challenge.hasAudio ? 'is-live' : 'is-empty'}">${challenge.statusLabel}</span>
            </div>
          </header>

          ${renderChallengeChips(challenge)}

          <section class="wave-panel">
            <div class="wave-panel__header">
              <button class="play-button" type="button" ${challenge.hasAudio ? '' : 'disabled'}>
                ${challenge.hasAudio ? 'Play Clip' : 'Load Clip'}
              </button>
              <div class="wave-meta">
                <p>${escapeHtml(challenge.title)}</p>
                <span>${escapeHtml(challenge.driverName)} · ${escapeHtml(challenge.trackCountry)}</span>
              </div>
            </div>
            <div class="waveform-shell">
              <div class="waveform" data-waveform></div>
            </div>
          </section>

          <section class="hero-copy">
            <p class="hero-kicker">Telemetry-synced onboard</p>
            <p class="hero-title">${escapeHtml(challenge.title)}</p>
            <p class="hero-description">${escapeHtml(challenge.helperCopy)}</p>
          </section>
        </section>

        <section class="telemetry-stage">
          <div class="telemetry-stage__header">
            <div>
              <p class="panel-label">Live trace</p>
              <h2>${escapeHtml(challenge.trackName)}</h2>
            </div>
            <div class="telemetry-sources">
              <span>${escapeHtml(challenge.telemetrySource)}</span>
              <span>${escapeHtml(challenge.trackVectorSource)}</span>
            </div>
          </div>

          <div class="track-panel">
            <div class="track-panel__glow"></div>
            <img class="track-reference" src="${escapeHtml(challenge.trackSvgSrc)}" alt="${escapeHtml(challenge.trackName)} vector reference" />
            <svg viewBox="0 0 ${TRACK_DIMENSIONS.width} ${TRACK_DIMENSIONS.height}" class="track-canvas">
              <path class="track-canvas__shadow" d="${telemetryPath}" pathLength="100"></path>
              <path class="track-canvas__line" d="${telemetryPath}" pathLength="100"></path>
              <circle class="track-start" cx="${initialMarker.x}" cy="${initialMarker.y}" r="4"></circle>
              <circle class="track-marker-glow" data-marker-glow cx="${initialMarker.x}" cy="${initialMarker.y}" r="10"></circle>
              <circle class="track-marker" data-marker cx="${initialMarker.x}" cy="${initialMarker.y}" r="4.8"></circle>
            </svg>

            <div class="telemetry-ring">
              <span class="timer-ring__label">elapsed</span>
              <strong data-current-time>00:00:00</strong>
              <small>${escapeHtml(challenge.durationLabel)}</small>
            </div>
          </div>

          <div class="telemetry-hud">
            <article class="hud-card"><span>Speed</span><strong data-speed>${Math.round(initialHud.speed ?? 0)}</strong><small>km/h</small></article>
            <article class="hud-card"><span>Gear</span><strong data-gear>${escapeHtml(initialHud.n_gear ?? '-')}</strong><small>current</small></article>
            <article class="hud-card"><span>Throttle</span><strong data-throttle>${escapeHtml(initialHud.throttle ?? '-')}</strong><small>%</small></article>
            <article class="hud-card"><span>RPM</span><strong data-rpm>${escapeHtml(initialHud.rpm ?? '-')}</strong><small>engine</small></article>
          </div>
        </section>
      </section>
    </main>
  `;
}

function bindChallengeSwitcher() {
  document.querySelectorAll('[data-challenge-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const challengeId = button.getAttribute('data-challenge-id');
      if (!challengeId || challengeId === selectedChallengeId) {
        return;
      }

      selectedChallengeId = challengeId;
      storeChallengeId(challengeId);
      await renderSelectedChallenge();
    });
  });
}

async function renderSelectedChallenge() {
  const challenge = getSelectedChallenge();

  if (!challenge) {
    renderErrorShell('No playable challenge found. Add audio, track SVG, and telemetry assets in Studio first.');
    return;
  }

  destroyWaveform();
  renderLoadingShell();

  try {
    const { locationData, carData } = await loadChallengeTelemetry(challenge);
    const telemetryModel = buildTelemetryModel(locationData, carData);
    renderChallengeView(challenge, telemetryModel);
    bindChallengeSwitcher();

    const playButton = document.querySelector('.play-button');
    const waveformElement = document.querySelector('[data-waveform]');
    const markerElement = document.querySelector('[data-marker]');
    const markerGlowElement = document.querySelector('[data-marker-glow]');
    const currentTimeElement = document.querySelector('[data-current-time]');
    const speedElement = document.querySelector('[data-speed]');
    const gearElement = document.querySelector('[data-gear]');
    const throttleElement = document.querySelector('[data-throttle]');
    const rpmElement = document.querySelector('[data-rpm]');

    let isPlaying = false;

    function updateTelemetry(elapsedMs) {
      const markerState = getInterpolatedTelemetryPoint(telemetryModel.locationFrames, elapsedMs) ?? telemetryModel.initialMarker;
      const hudState = getNearestTelemetrySample(telemetryModel.carFrames, elapsedMs) ?? telemetryModel.initialHud;

      markerElement?.setAttribute('cx', markerState.x);
      markerElement?.setAttribute('cy', markerState.y);
      markerGlowElement?.setAttribute('cx', markerState.x);
      markerGlowElement?.setAttribute('cy', markerState.y);
      currentTimeElement.textContent = formatElapsed(elapsedMs);
      speedElement.textContent = Math.round(hudState.speed ?? 0);
      gearElement.textContent = hudState.n_gear ?? '-';
      throttleElement.textContent = hudState.throttle ?? '-';
      rpmElement.textContent = hudState.rpm ?? '-';
    }

    if (challenge.hasAudio) {
      activeWaveform = mountWaveform(waveformElement, challenge.audioSrc);
      activeWaveform?.on('timeupdate', (currentTime) => updateTelemetry(currentTime * 1000));
      activeWaveform?.on('finish', () => {
        isPlaying = false;
        playButton.textContent = 'Play Clip';
        updateTelemetry(0);
      });
    }

    playButton?.addEventListener('click', async () => {
      if (!activeWaveform) {
        return;
      }

      await activeWaveform.playPause();
      isPlaying = !isPlaying;
      playButton.textContent = isPlaying ? 'Pause Clip' : 'Play Clip';
    });

    updateTelemetry(0);
  } catch (error) {
    renderErrorShell(error instanceof Error ? error.message : 'Unknown render error');
  }
}

async function bootstrap() {
  library = getPlayableChallenges(await loadChallengeLibrary());

  if (!library.length) {
    renderErrorShell('No playable challenge found. Add audio, track SVG, and telemetry assets in Studio first.');
    return;
  }

  selectedChallengeId = getStoredChallengeId();
  if (!library.some((challenge) => challenge.id === selectedChallengeId)) {
    selectedChallengeId = library[0].id;
  }

  storeChallengeId(selectedChallengeId);
  await renderSelectedChallenge();
}

bootstrap().catch((error) => {
  renderErrorShell(error instanceof Error ? error.message : 'Unknown bootstrap error');
});
