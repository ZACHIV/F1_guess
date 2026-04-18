import {
  getCountryNameByLocale,
  getTrackNameByLocale
} from './track-locales.js';

const MESSAGES = {
  en: {
    noPlayableChallenge: 'No playable challenge found.',
    audioArmingError: 'Audio is still arming. Give the waveform a second, then start again.',
    playbackBlockedError: 'Audio playback was blocked. Interact again to continue the duel.',
    loadChallengeError: 'Failed to load challenge.',
    wrongCircuitFeedback: 'Wrong circuit. Keep listening for the braking rhythm and straight-line signature.',
    startDuel: 'Start Duel',
    submit: 'Submit',
    wrong: 'Wrong',
    pause: 'Pause',
    resume: 'Resume',
    replay: 'Replay',
    surrender: 'Surrender',
    answerPlaceholder: 'e.g. COTA',
    idleHelper: 'Press start, listen to the onboard, then submit the circuit name, city, country, or alias.',
    liveHelper: '',
    benchmarkSourceRecorded: 'Recorded benchmark',
    benchmarkSourceEstimated: 'Estimated benchmark',
    languageCurrentZh: 'EN',
    languageCurrentEn: '中文',
    resultEyebrow: 'Headset Duel Result',
    nextDuel: 'Next Duel',
    retry: 'Retry',
    replayAudio: 'Replay Audio',
    debrief: 'Debrief',
    player: 'Player',
    max: 'Max',
    gap: 'Gap',
    trackReveal: 'Track Reveal',
    circuit: 'Circuit',
    country: 'Country',
    driver: 'Driver',
    deltaFaster: '{delta} faster',
    deltaBehind: '{delta} behind',
    deltaSlower: '{delta} slower',
    winHeadline: 'You beat Max to {track}.',
    winCopy: 'Circuit revealed: {answer}. You locked the call {delta} before Verstappen\'s benchmark line.',
    timeoutHeadline: 'Clock out. Verstappen still takes P1.',
    timeoutCopy: 'The answer was {answer}. One minute expired before the correct call landed, so the Dutch anthem gets the room.',
    forfeitHeadline: 'You waved off before {track}.',
    forfeitCopy: 'Correct answer: {answer}. You bailed out of the duel early, so Verstappen keeps the line.',
    loseHeadline: 'Max still called {track} first.',
    loseCopy: 'Correct answer: {answer}. You found it, but Verstappen\'s line was already gone by {delta}.'
  },
  zh: {
    noPlayableChallenge: '没有可玩的赛道题目。',
    audioArmingError: '音频还在加载中，请稍等一秒再开始。',
    playbackBlockedError: '音频播放被浏览器拦截，请再次点击继续。',
    loadChallengeError: '赛道数据加载失败。',
    wrongCircuitFeedback: '答案不对，继续听刹车节奏和直线特征。',
    startDuel: '开始对决',
    submit: '提交',
    wrong: '错误',
    pause: '暂停',
    resume: '继续',
    replay: '重播',
    surrender: '投降',
    answerPlaceholder: '例如：COTA / 蒙扎',
    idleHelper: '点击开始后听这段 onboard，输入赛道名、城市名、国家名或常见别称即可提交。',
    liveHelper: '',
    benchmarkSourceRecorded: '真实基准',
    benchmarkSourceEstimated: '估算基准',
    languageCurrentZh: 'EN',
    languageCurrentEn: '中文',
    resultEyebrow: '耳机对决复盘',
    nextDuel: '下一局',
    retry: '再试一次',
    replayAudio: '重听音频',
    debrief: '结果复盘',
    player: '你',
    max: 'Max',
    gap: '差距',
    trackReveal: '赛道揭晓',
    circuit: '赛道',
    country: '国家',
    driver: '车手',
    deltaFaster: '快 {delta}',
    deltaBehind: '慢 {delta}',
    deltaSlower: '慢 {delta}',
    winHeadline: '你在 {track} 战胜了 Max。',
    winCopy: '正确答案：{answer}。你比 Max 的基准时间快了 {delta} 完成锁定。',
    timeoutHeadline: '时间到，Max 依然拿下 P1。',
    timeoutCopy: '正确答案是 {answer}。1 分钟内未给出正确答案，荷兰国歌响起。',
    forfeitHeadline: '你在 {track} 之前选择了投降。',
    forfeitCopy: '正确答案：{answer}。你提前结束了这场对决，Max 保住了优势。',
    loseHeadline: 'Max 在 {track} 仍然更快。',
    loseCopy: '正确答案：{answer}。你答对了，但比 Max 的基准时间慢了 {delta}。'
  }
};

export function detectInitialLocale() {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem('f1_guess_locale');
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }
  }

  if (typeof navigator !== 'undefined' && /^zh\b/i.test(navigator.language || '')) {
    return 'zh';
  }

  return 'en';
}

export function getLanguageBadge(locale) {
  return locale === 'zh'
    ? '🇨🇳 中文'
    : '🇺🇸 EN';
}

export function t(locale, key, variables = {}) {
  const template = MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, token) =>
    variables[token] == null ? '' : String(variables[token]));
}

export function getLocalizedAnswerLabel(challenge, locale) {
  const track = getTrackNameByLocale(challenge?.trackName || '', locale);
  const country = getCountryNameByLocale(challenge?.trackCountry || '', locale);
  return `${track} · ${country}`;
}
