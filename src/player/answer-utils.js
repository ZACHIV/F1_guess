import {
  getAllLocalizedCountryNames,
  getAllLocalizedTrackNames,
  getCountryNameByLocale,
  getTrackNameByLocale
} from './track-locales.js';

function unique(values) {
  return [...new Set(values)];
}

function buildChineseVariants(value) {
  if (!value) {
    return [];
  }

  const compact = String(value).trim();
  if (!compact) {
    return [];
  }

  return unique([
    compact,
    compact.replace(/国际赛车场/g, ''),
    compact.replace(/国际赛道/g, ''),
    compact.replace(/城市赛道/g, ''),
    compact.replace(/滨海赛道/g, ''),
    compact.replace(/大道赛道/g, ''),
    compact.replace(/赛道/g, ''),
    compact.replace(/赛车场/g, '')
  ].map((item) => item.trim()).filter(Boolean));
}

export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAcceptedAnswers(challenge) {
  const trackName = challenge?.trackName || '';
  const countryName = challenge?.trackCountry || '';
  const trackZhHans = getTrackNameByLocale(trackName, 'zh-Hans');
  const trackZhHant = getTrackNameByLocale(trackName, 'zh-Hant');
  const countryZhHans = getCountryNameByLocale(countryName, 'zh-Hans');
  const countryZhHant = getCountryNameByLocale(countryName, 'zh-Hant');

  return unique([
    ...getAllLocalizedTrackNames(trackName),
    ...getAllLocalizedCountryNames(countryName),
    ...buildChineseVariants(trackZhHans),
    ...buildChineseVariants(trackZhHant),
    ...buildChineseVariants(countryZhHans),
    ...buildChineseVariants(countryZhHant),
    ...(Array.isArray(challenge?.zhAliases) ? challenge.zhAliases.flatMap(buildChineseVariants) : []),
    ...(Array.isArray(challenge?.answerAliases) ? challenge.answerAliases : [])
  ].map(normalizeAnswer).filter(Boolean));
}

export function isChallengeAnswerCorrect(challenge, userAnswer) {
  const normalizedAnswer = normalizeAnswer(userAnswer);
  if (!normalizedAnswer) {
    return false;
  }

  return getAcceptedAnswers(challenge).includes(normalizedAnswer);
}
