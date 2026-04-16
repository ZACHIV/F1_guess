function unique(values) {
  return [...new Set(values)];
}

export function normalizeAnswer(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getAcceptedAnswers(challenge) {
  return unique([
    challenge?.trackName,
    challenge?.trackCountry,
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
