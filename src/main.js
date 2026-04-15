import './styles.css';
import { rawChallenges } from './data/challenges.js';
import { normalizeChallenge } from './lib/challenge-utils.js';
import { mountWaveform } from './lib/waveform.js';
import locationData from './data/telemetry/austria-pole-onboard-2025.location.json';
import carData from './data/telemetry/austria-pole-onboard-2025.car-data.json';
import {
  buildTelemetryPath,
  getInterpolatedTelemetryPoint,
  getNearestTelemetrySample,
  normalizeTelemetryPoints,
  toElapsedSamples
} from './lib/telemetry-utils.js';

const challenge = normalizeChallenge(rawChallenges[0]);
const TRACK_DIMENSIONS = { width: 360, height: 250, padding: 26 };
const locationFrames = normalizeTelemetryPoints(toElapsedSamples(locationData), TRACK_DIMENSIONS);
const telemetryPath = buildTelemetryPath(locationFrames);
const carFrames = toElapsedSamples(carData);

const app = document.querySelector('#app');

function formatElapsed(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

const initialMarker = locationFrames[0];
const initialHud = carFrames[0];

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
          <span class="status-pill ${challenge.hasAudio ? 'is-live' : 'is-empty'}">${challenge.statusLabel}</span>
        </header>

        <section class="wave-panel">
          <div class="wave-panel__header">
            <button class="play-button" type="button" ${challenge.hasAudio ? '' : 'disabled'}>
              ${challenge.hasAudio ? 'Play Clip' : 'Load Clip'}
            </button>
            <div class="wave-meta">
              <p>${challenge.title}</p>
              <span>${challenge.driverName} · ${challenge.trackCountry}</span>
            </div>
          </div>
          <div class="waveform-shell">
            <div class="waveform" data-waveform></div>
            <div class="waveform-placeholder" ${challenge.hasAudio ? 'hidden' : ''}>
              ${Array.from({ length: 28 }, (_, index) => `<span style="--i:${index}"></span>`).join('')}
            </div>
          </div>
        </section>

        <section class="hero-copy">
          <p class="hero-kicker">Telemetry-synced onboard</p>
          <p class="hero-title">${challenge.title}</p>
          <p class="hero-description">${challenge.helperCopy}</p>
        </section>
      </section>

      <section class="telemetry-stage">
        <div class="telemetry-stage__header">
          <div>
            <p class="panel-label">Live trace</p>
            <h2>${challenge.trackName}</h2>
          </div>
          <div class="telemetry-sources">
            <span>${challenge.telemetrySource}</span>
            <span>${challenge.trackVectorSource}</span>
          </div>
        </div>

        <div class="track-panel">
          <div class="track-panel__glow"></div>
          <img
            class="track-reference"
            src="/assets/tracks/red-bull-ring.svg"
            alt="${challenge.trackName} vector reference"
          />
          <svg
            viewBox="0 0 ${TRACK_DIMENSIONS.width} ${TRACK_DIMENSIONS.height}"
            class="track-canvas"
            aria-label="${challenge.trackName} telemetry map"
          >
            <path class="track-canvas__shadow" d="${telemetryPath}" pathLength="100"></path>
            <path class="track-canvas__line" d="${telemetryPath}" pathLength="100"></path>
            <circle class="track-start" cx="${locationFrames[0].x}" cy="${locationFrames[0].y}" r="4"></circle>
            <circle class="track-marker-glow" data-marker-glow cx="${initialMarker.x}" cy="${initialMarker.y}" r="10"></circle>
            <circle class="track-marker" data-marker cx="${initialMarker.x}" cy="${initialMarker.y}" r="4.8"></circle>
          </svg>

          <div class="telemetry-ring">
            <span class="timer-ring__label">elapsed</span>
            <strong data-current-time>00:00:00</strong>
            <small>${challenge.durationLabel}</small>
          </div>
        </div>

        <div class="telemetry-hud">
          <article class="hud-card">
            <span>Speed</span>
            <strong data-speed>${initialHud.speed}</strong>
            <small>km/h</small>
          </article>
          <article class="hud-card">
            <span>Gear</span>
            <strong data-gear>${initialHud.n_gear}</strong>
            <small>current</small>
          </article>
          <article class="hud-card">
            <span>Throttle</span>
            <strong data-throttle>${initialHud.throttle}</strong>
            <small>%</small>
          </article>
          <article class="hud-card">
            <span>RPM</span>
            <strong data-rpm>${initialHud.rpm}</strong>
            <small>engine</small>
          </article>
        </div>

        <section class="answer-panel">
          <div class="answer-panel__header">
            <div>
              <p class="panel-label">Pick your circuit</p>
              <p class="answer-panel__subtext">The red marker is driven by official position data for this onboard minute.</p>
            </div>
            <div class="driver-pill">#${challenge.driverNumber}</div>
          </div>
          <div class="option-grid">
            ${challenge.options
              .map(
                (option) => `
                  <button class="guess-option" type="button" data-option="${option}">
                    ${option}
                  </button>
                `
              )
              .join('')}
          </div>
          <div class="answer-feedback" data-feedback>
            <p class="answer-feedback__label">Awaiting your call</p>
            <h2>Watch how the red point climbs the lap while the clip runs.</h2>
          </div>
        </section>
      </section>
    </section>
  </main>
`;

const playButton = document.querySelector('.play-button');
const waveformElement = document.querySelector('[data-waveform]');
const feedbackElement = document.querySelector('[data-feedback]');
const options = document.querySelectorAll('.guess-option');
const markerElement = document.querySelector('[data-marker]');
const markerGlowElement = document.querySelector('[data-marker-glow]');
const currentTimeElement = document.querySelector('[data-current-time]');
const speedElement = document.querySelector('[data-speed]');
const gearElement = document.querySelector('[data-gear]');
const throttleElement = document.querySelector('[data-throttle]');
const rpmElement = document.querySelector('[data-rpm]');

let waveform = null;
let isPlaying = false;

function updateTelemetry(elapsedMs) {
  const markerState = getInterpolatedTelemetryPoint(locationFrames, elapsedMs) ?? locationFrames[0];
  const hudState = getNearestTelemetrySample(carFrames, elapsedMs) ?? carFrames[0];

  markerElement?.setAttribute('cx', markerState.x);
  markerElement?.setAttribute('cy', markerState.y);
  markerGlowElement?.setAttribute('cx', markerState.x);
  markerGlowElement?.setAttribute('cy', markerState.y);

  if (currentTimeElement) {
    currentTimeElement.textContent = formatElapsed(elapsedMs);
  }

  if (speedElement) {
    speedElement.textContent = Math.round(hudState.speed ?? 0);
  }

  if (gearElement) {
    gearElement.textContent = hudState.n_gear ?? '-';
  }

  if (throttleElement) {
    throttleElement.textContent = hudState.throttle ?? '-';
  }

  if (rpmElement) {
    rpmElement.textContent = hudState.rpm ?? '-';
  }
}

if (challenge.hasAudio) {
  waveform = mountWaveform(waveformElement, challenge.audioSrc);

  waveform?.on('timeupdate', (currentTime) => {
    updateTelemetry(currentTime * 1000);
  });

  waveform?.on('finish', () => {
    isPlaying = false;
    playButton.textContent = 'Play Clip';
    updateTelemetry(0);
  });
}

playButton?.addEventListener('click', async () => {
  if (!waveform) {
    return;
  }

  await waveform.playPause();
  isPlaying = !isPlaying;
  playButton.textContent = isPlaying ? 'Pause Clip' : 'Play Clip';
});

updateTelemetry(0);

options.forEach((option) => {
  option.addEventListener('click', () => {
    const guess = option.dataset.option;
    const isCorrect = guess === challenge.trackName;

    options.forEach((button) => {
      button.classList.toggle('is-selected', button === option);
      button.classList.toggle('is-correct', button.dataset.option === challenge.trackName);
      button.classList.toggle(
        'is-wrong',
        button === option && button.dataset.option !== challenge.trackName
      );
    });

    feedbackElement.innerHTML = `
      <p class="answer-feedback__label">${isCorrect ? 'Correct read' : 'Answer revealed'}</p>
      <h2>${isCorrect ? 'You heard it.' : `It was ${challenge.trackName}.`}</h2>
      <p>${challenge.prompt}</p>
    `;
  });
});
