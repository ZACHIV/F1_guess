import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import InteractionDock from '../src/player/components/InteractionDock.jsx';

describe('InteractionDock', () => {
  it('keeps benchmark source hints out of the guessing screen', () => {
    const markup = renderToStaticMarkup(
      <InteractionDock
        answerValue=""
        canResume={false}
        canStart
        isPlaying={false}
        locale="en"
        onAnswerChange={() => {}}
        onAnswerSubmit={() => {}}
        onReplay={() => {}}
        onStart={() => {}}
        onSurrender={() => {}}
        onTogglePlayback={() => {}}
        runState="idle"
        submitState="idle"
        timer={<div>timer</div>}
      />
    );

    expect(markup).not.toContain('Estimated benchmark');
    expect(markup).not.toContain('Recorded benchmark');
    expect(markup).not.toContain('Max benchmark');
  });
});
