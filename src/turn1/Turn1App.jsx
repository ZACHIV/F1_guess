import { useEffect, useMemo, useState } from 'react';
import { ARCHIVE_TRACKS } from '../archive/archive-metadata.js';
import { buildTurn1CropFromSvgNode, buildViewBoxBounds } from '../lib/turn1-crop-utils.js';

const OPTION_COUNT = 4;

function shuffle(values) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function buildOptionPool(track, tracks) {
  const distractors = shuffle(
    tracks
      .filter((candidate) => candidate.id !== track.id)
      .map((candidate) => candidate.circuit)
  ).slice(0, OPTION_COUNT - 1);

  return shuffle([track.circuit, ...distractors]);
}

function chooseNextTrack(tracks, currentId = '') {
  const pool = tracks.filter((track) => track.id !== currentId);
  const source = pool.length ? pool : tracks;
  return source[Math.floor(Math.random() * source.length)];
}

async function loadTurn1Asset(asset) {
  const response = await fetch(asset);
  if (!response.ok) {
    throw new Error('Turn 1 SVG load failed');
  }

  const source = await response.text();
  const parser = new DOMParser();
  const documentNode = parser.parseFromString(source, 'image/svg+xml');
  const svgNode = documentNode.documentElement;
  const width = Number.parseFloat(svgNode.getAttribute('width') || '500');
  const height = Number.parseFloat(svgNode.getAttribute('height') || '500');
  const viewBox = svgNode.getAttribute('viewBox') || `0 0 ${width} ${height}`;
  const markup = Array.from(svgNode.childNodes)
    .map((node) => new XMLSerializer().serializeToString(node))
    .join('');

  return {
    markup,
    viewBox,
    crop: buildTurn1CropFromSvgNode(svgNode, '4:3'),
    bounds: buildViewBoxBounds(viewBox)
  };
}

export default function Turn1App() {
  const urlTrackId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('track')
    : '';
  const initialTrack = ARCHIVE_TRACKS.find((track) => track.id === urlTrackId) ?? ARCHIVE_TRACKS[0];
  const [activeTrack, setActiveTrack] = useState(initialTrack);
  const [options, setOptions] = useState(() => buildOptionPool(initialTrack, ARCHIVE_TRACKS));
  const [assetState, setAssetState] = useState({
    status: 'loading',
    markup: '',
    viewBox: '0 0 500 500',
    crop: null
  });
  const [selectedAnswer, setSelectedAnswer] = useState('');

  useEffect(() => {
    let cancelled = false;

    setAssetState({
      status: 'loading',
      markup: '',
      viewBox: '0 0 500 500',
      crop: null
    });

    loadTurn1Asset(activeTrack.asset)
      .then((result) => {
        if (cancelled) {
          return;
        }

        setAssetState({
          status: 'ready',
          ...result
        });
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setAssetState({
          status: 'error',
          markup: '',
          viewBox: '0 0 500 500',
          crop: null
        });
      });

    return () => {
      cancelled = true;
    };
  }, [activeTrack]);

  const isAnswered = Boolean(selectedAnswer);
  const isCorrect = selectedAnswer === activeTrack.circuit;
  const cropViewBox = assetState.crop
    ? `${assetState.crop.x} ${assetState.crop.y} ${assetState.crop.width} ${assetState.crop.height}`
    : '0 0 500 375';

  const answerCopy = useMemo(() => {
    if (!selectedAnswer) {
      return 'Choose the circuit that matches this opening corner.';
    }

    if (isCorrect) {
      return `${activeTrack.circuit} is correct. The opening gesture matches ${activeTrack.note.toLowerCase()} better than anything else in the archive.`;
    }

    return `Not quite. The candidate was ${activeTrack.circuit}, filed in the archive under ${activeTrack.note.toLowerCase()}.`;
  }, [activeTrack, isCorrect, selectedAnswer]);

  const handleAnswer = (option) => {
    if (selectedAnswer) {
      return;
    }

    setSelectedAnswer(option);
  };

  const handleNextTrack = () => {
    const nextTrack = chooseNextTrack(ARCHIVE_TRACKS, activeTrack.id);
    setActiveTrack(nextTrack);
    setOptions(buildOptionPool(nextTrack, ARCHIVE_TRACKS));
    setSelectedAnswer('');
  };

  return (
    <main className="turn1-page">
      <header className="turn1-header">
        <div>
          <p className="turn1-header__eyebrow">PADDOCK ARCHIVE MINI GAME</p>
          <h1>Turn 1 Desk Test</h1>
          <p className="turn1-header__lede">
            One opening corner. Four circuits. One answer.
          </p>
        </div>
        <div className="turn1-header__actions">
          <a className="turn1-link" href="/">Back to gallery</a>
          <button className="turn1-link turn1-link--button" type="button" onClick={handleNextTrack}>Next corner</button>
        </div>
      </header>

      <section className="turn1-stage">
        <article className="turn1-card turn1-card--crop">
          <div className="turn1-card__header">
            <p className="turn1-card__eyebrow">&nbsp;</p>
          </div>
          <div className="turn1-card__viewport">
            {assetState.status === 'ready' ? (
              <svg
                className="turn1-card__crop-svg"
                viewBox={cropViewBox}
                preserveAspectRatio="xMidYMid meet"
                aria-label="Turn 1 crop"
              >
                <g dangerouslySetInnerHTML={{ __html: assetState.markup }} />
              </svg>
            ) : (
              <div className="turn1-card__placeholder">
                {assetState.status === 'error' ? 'Turn 1 extract unavailable.' : 'Extracting Turn 1 geometry...'}
              </div>
            )}
          </div>
        </article>

        <article className="turn1-card turn1-card--answer">
          <div className="turn1-card__header">
            <p className="turn1-card__eyebrow">Response sheet</p>
            <span>{isAnswered ? 'Result logged' : 'Single corner study'}</span>
          </div>

          <div className="turn1-answer__meta">
            <p>{isAnswered ? activeTrack.country : 'Answer first. Details later.'}</p>
            <h2>Which circuit opens like this?</h2>
            <p>{answerCopy}</p>
          </div>

          <div className="turn1-options" role="list" aria-label="Turn 1 answer options">
            {options.map((option) => {
              const isSelected = selectedAnswer === option;
              const isWinningOption = selectedAnswer && option === activeTrack.circuit;
              const isLosingSelection = selectedAnswer && isSelected && option !== activeTrack.circuit;

              return (
                <button
                  key={option}
                  type="button"
                  className={`turn1-option${isSelected ? ' is-selected' : ''}${isWinningOption ? ' is-correct' : ''}${isLosingSelection ? ' is-wrong' : ''}`}
                  onClick={() => handleAnswer(option)}
                >
                  <span>{option}</span>
                </button>
              );
            })}
          </div>

          {isAnswered ? (
            <div className="turn1-answer__reveal">
              <div>
                <p className="turn1-card__eyebrow">Reveal</p>
                <strong>{activeTrack.circuit}</strong>
                <p>{activeTrack.curatorNote}</p>
              </div>
              <button className="turn1-link turn1-link--button" type="button" onClick={handleNextTrack}>
                Next corner
              </button>
            </div>
          ) : null}
        </article>

        <article className="turn1-card turn1-card--reference">
          <div className="turn1-card__header">
            <p className="turn1-card__eyebrow">{isAnswered ? 'Archive note' : 'Desk rule'}</p>
            <span>{isAnswered ? activeTrack.note : 'No metadata before reveal'}</span>
          </div>
          <div className="turn1-reference__sheet">
            <div>
              <p className="turn1-reference__label">{isAnswered ? 'Country' : 'Hint discipline'}</p>
              <strong>{isAnswered ? activeTrack.country : 'No extra hints.'}</strong>
            </div>
            <div>
              <p className="turn1-reference__label">{isAnswered ? 'Circuit' : 'What is hidden'}</p>
              <strong>{isAnswered ? activeTrack.circuit : 'Identity details stay hidden.'}</strong>
            </div>
            <div>
              <p className="turn1-reference__label">{isAnswered ? 'Length' : 'Question format'}</p>
              <strong>{isAnswered ? activeTrack.length : 'Pick one of four circuits.'}</strong>
            </div>
            <div>
              <p className="turn1-reference__label">{isAnswered ? 'Turns' : 'Reveal timing'}</p>
              <strong>{isAnswered ? activeTrack.turns : 'Full details appear after selection.'}</strong>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
