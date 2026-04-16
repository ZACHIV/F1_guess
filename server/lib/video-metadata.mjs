const TRACK_HINTS = [
  { slug: 'australia', trackName: 'Albert Park', trackCountry: 'Australia', trackQuery: 'Melbourne / Albert Park', aliases: ['australia', 'australian gp', 'melbourne', 'albert park'] },
  { slug: 'china', trackName: 'Shanghai International Circuit', trackCountry: 'China', trackQuery: 'Shanghai', aliases: ['china', 'chinese gp', 'shanghai'] },
  { slug: 'japan', trackName: 'Suzuka', trackCountry: 'Japan', trackQuery: 'Suzuka', aliases: ['japan', 'japanese gp', 'suzuka'] },
  { slug: 'bahrain', trackName: 'Bahrain International Circuit', trackCountry: 'Bahrain', trackQuery: 'Sakhir / Bahrain', aliases: ['bahrain', 'sakhir'] },
  { slug: 'saudi-arabia', trackName: 'Jeddah Corniche Circuit', trackCountry: 'Saudi Arabia', trackQuery: 'Jeddah', aliases: ['saudi arabia', 'saudi', 'jeddah'] },
  { slug: 'miami', trackName: 'Miami International Autodrome', trackCountry: 'United States', trackQuery: 'Miami', aliases: ['miami', 'miami gardens'] },
  { slug: 'imola', trackName: 'Imola', trackCountry: 'Italy', trackQuery: 'Imola / Emilia-Romagna', aliases: ['imola', 'emilia romagna', 'emilia-romagna', 'san marino', 'enzo e dino ferrari'] },
  { slug: 'monaco', trackName: 'Circuit de Monaco', trackCountry: 'Monaco', trackQuery: 'Monaco / Monte Carlo', aliases: ['monaco', 'monte carlo'] },
  { slug: 'spain', trackName: 'Circuit de Barcelona-Catalunya', trackCountry: 'Spain', trackQuery: 'Barcelona / Catalunya', aliases: ['spain', 'spanish gp', 'barcelona', 'catalunya', 'catalunya barcelona'] },
  { slug: 'canada', trackName: 'Circuit Gilles Villeneuve', trackCountry: 'Canada', trackQuery: 'Montreal / Gilles Villeneuve', aliases: ['canada', 'canadian gp', 'montreal', 'montreal', 'gilles villeneuve'] },
  { slug: 'austria', trackName: 'Red Bull Ring', trackCountry: 'Austria', trackQuery: 'Red Bull Ring / Spielberg / A1-Ring', aliases: ['austria', 'austrian gp', 'red bull ring', 'spielberg', 'a1 ring', 'a1-ring', 'osterreichring'] },
  { slug: 'great-britain', trackName: 'Silverstone', trackCountry: 'United Kingdom', trackQuery: 'Silverstone', aliases: ['great britain', 'britain', 'british gp', 'silverstone', 'uk'] },
  { slug: 'belgium', trackName: 'Spa-Francorchamps', trackCountry: 'Belgium', trackQuery: 'Spa / Spa-Francorchamps', aliases: ['belgium', 'belgian gp', 'spa', 'spa francorchamps', 'spa-francorchamps'] },
  { slug: 'hungary', trackName: 'Hungaroring', trackCountry: 'Hungary', trackQuery: 'Hungaroring / Budapest', aliases: ['hungary', 'hungarian gp', 'hungaroring', 'budapest'] },
  { slug: 'netherlands', trackName: 'Zandvoort', trackCountry: 'Netherlands', trackQuery: 'Zandvoort', aliases: ['netherlands', 'dutch gp', 'zandvoort'] },
  { slug: 'italy', trackName: 'Monza', trackCountry: 'Italy', trackQuery: 'Monza', aliases: ['italy', 'italian gp', 'monza', 'autodromo nazionale monza'] },
  { slug: 'azerbaijan', trackName: 'Baku City Circuit', trackCountry: 'Azerbaijan', trackQuery: 'Baku', aliases: ['azerbaijan', 'baku'] },
  { slug: 'singapore', trackName: 'Marina Bay', trackCountry: 'Singapore', trackQuery: 'Singapore / Marina Bay', aliases: ['singapore', 'marina bay'] },
  { slug: 'united-states', trackName: 'Circuit of the Americas', trackCountry: 'United States', trackQuery: 'Austin / COTA', aliases: ['united states', 'united states gp', 'usa', 'us gp', 'austin', 'cota', 'circuit of the americas'] },
  { slug: 'mexico', trackName: 'Autodromo Hermanos Rodriguez', trackCountry: 'Mexico', trackQuery: 'Mexico City', aliases: ['mexico', 'mexico city', 'hermanos rodriguez'] },
  { slug: 'brazil', trackName: 'Interlagos', trackCountry: 'Brazil', trackQuery: 'Interlagos / Sao Paulo', aliases: ['brazil', 'brazilian gp', 'sao paulo', 'sao paulo gp', 'interlagos'] },
  { slug: 'las-vegas', trackName: 'Las Vegas Strip Circuit', trackCountry: 'United States', trackQuery: 'Las Vegas', aliases: ['las vegas', 'vegas'] },
  { slug: 'qatar', trackName: 'Lusail International Circuit', trackCountry: 'Qatar', trackQuery: 'Lusail / Qatar', aliases: ['qatar', 'lusail'] },
  { slug: 'abu-dhabi', trackName: 'Yas Marina Circuit', trackCountry: 'United Arab Emirates', trackQuery: 'Yas Marina / Abu Dhabi', aliases: ['abu dhabi', 'yas marina', 'yas island', 'uae'] }
];

const DRIVER_HINTS = [
  { slug: 'max-verstappen', driverName: 'Max Verstappen', driverNumber: '1', aliases: ['max verstappen', 'verstappen', 'max'] },
  { slug: 'lando-norris', driverName: 'Lando Norris', driverNumber: '4', aliases: ['lando norris', 'norris', 'lando'] },
  { slug: 'gabriel-bortoleto', driverName: 'Gabriel Bortoleto', driverNumber: '5', aliases: ['gabriel bortoleto', 'bortoleto'] },
  { slug: 'isack-hadjar', driverName: 'Isack Hadjar', driverNumber: '6', aliases: ['isack hadjar', 'hadjar'] },
  { slug: 'pierre-gasly', driverName: 'Pierre Gasly', driverNumber: '10', aliases: ['pierre gasly', 'gasly'] },
  { slug: 'kimi-antonelli', driverName: 'Kimi Antonelli', driverNumber: '12', aliases: ['kimi antonelli', 'antonelli', 'andrea kimi antonelli'] },
  { slug: 'fernando-alonso', driverName: 'Fernando Alonso', driverNumber: '14', aliases: ['fernando alonso', 'alonso'] },
  { slug: 'charles-leclerc', driverName: 'Charles Leclerc', driverNumber: '16', aliases: ['charles leclerc', 'leclerc', 'charles'] },
  { slug: 'lance-stroll', driverName: 'Lance Stroll', driverNumber: '18', aliases: ['lance stroll', 'stroll'] },
  { slug: 'yuki-tsunoda', driverName: 'Yuki Tsunoda', driverNumber: '22', aliases: ['yuki tsunoda', 'tsunoda', 'yuki'] },
  { slug: 'alex-albon', driverName: 'Alexander Albon', driverNumber: '23', aliases: ['alex albon', 'alexander albon', 'albon'] },
  { slug: 'nico-hulkenberg', driverName: 'Nico Hulkenberg', driverNumber: '27', aliases: ['nico hulkenberg', 'hulkenberg', 'hulk'] },
  { slug: 'liam-lawson', driverName: 'Liam Lawson', driverNumber: '30', aliases: ['liam lawson', 'lawson'] },
  { slug: 'esteban-ocon', driverName: 'Esteban Ocon', driverNumber: '31', aliases: ['esteban ocon', 'ocon'] },
  { slug: 'franco-colapinto', driverName: 'Franco Colapinto', driverNumber: '43', aliases: ['franco colapinto', 'colapinto'] },
  { slug: 'lewis-hamilton', driverName: 'Lewis Hamilton', driverNumber: '44', aliases: ['lewis hamilton', 'hamilton', 'lewis'] },
  { slug: 'carlos-sainz', driverName: 'Carlos Sainz', driverNumber: '55', aliases: ['carlos sainz', 'sainz'] },
  { slug: 'george-russell', driverName: 'George Russell', driverNumber: '63', aliases: ['george russell', 'russell', 'george'] },
  { slug: 'oscar-piastri', driverName: 'Oscar Piastri', driverNumber: '81', aliases: ['oscar piastri', 'piastri', 'oscar'] },
  { slug: 'oliver-bearman', driverName: 'Oliver Bearman', driverNumber: '87', aliases: ['oliver bearman', 'bearman', 'ollie bearman'] },
  { slug: 'sergio-perez', driverName: 'Sergio Perez', driverNumber: '11', aliases: ['sergio perez', 'checo perez', 'perez', 'checo'] },
  { slug: 'daniel-ricciardo', driverName: 'Daniel Ricciardo', driverNumber: '3', aliases: ['daniel ricciardo', 'ricciardo', 'daniel'] },
  { slug: 'zhou-guanyu', driverName: 'Guanyu Zhou', driverNumber: '24', aliases: ['guanyu zhou', 'zhou guanyu', 'zhou'] },
  { slug: 'valtteri-bottas', driverName: 'Valtteri Bottas', driverNumber: '77', aliases: ['valtteri bottas', 'bottas'] }
];

function normalizeValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createSearchText(title, description) {
  return normalizeValue(`${title ?? ''} ${description ?? ''}`);
}

function countMatches(text, aliases) {
  return aliases.reduce((total, alias) => total + (text.includes(normalizeValue(alias)) ? 1 : 0), 0);
}

function pickBestHint(text, hints) {
  const scored = hints
    .map((hint) => ({ hint, score: countMatches(text, hint.aliases) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!scored.length) {
    return null;
  }

  if (scored.length > 1 && scored[0].score === scored[1].score) {
    return null;
  }

  return scored[0].hint;
}

function detectSessionName(text) {
  if (!text) {
    return 'Qualifying';
  }

  if (text.includes('sprint shootout')) {
    return 'Sprint Shootout';
  }

  if (text.includes('sprint qualifying')) {
    return 'Sprint Qualifying';
  }

  if (text.includes('sprint')) {
    return 'Sprint';
  }

  if (
    text.includes('qualifying') ||
    text.includes('quali') ||
    text.includes('pole') ||
    text.includes('q1') ||
    text.includes('q2') ||
    text.includes('q3') ||
    text.includes('hot lap')
  ) {
    return 'Qualifying';
  }

  if (text.includes('race')) {
    return '';
  }

  return 'Qualifying';
}

function extractYear(text) {
  const match = text.match(/\b(20\d{2})\b/);
  return match?.[1] ?? '';
}

function buildDraftTitle({ year, trackName, sessionName, driverName }) {
  const parts = [year, trackName, sessionName, driverName].filter(Boolean);
  return parts.join(' · ');
}

function buildDraftId({ year, trackHint, driverHint, sessionName }) {
  const base = [trackHint?.slug, sessionName === 'Qualifying' ? 'quali' : normalizeValue(sessionName).replaceAll(' ', '-'), driverHint?.slug, year]
    .filter(Boolean)
    .join('-');

  return base || '';
}

export function parseVideoMetadata({ title = '', description = '' }) {
  const searchText = createSearchText(title, description);
  const trackHint = pickBestHint(searchText, TRACK_HINTS);
  const driverHint = pickBestHint(searchText, DRIVER_HINTS);
  const year = extractYear(searchText);
  const sessionName = detectSessionName(searchText);

  return {
    sourceTitle: title,
    sourceDescription: description,
    id: buildDraftId({ year, trackHint, driverHint, sessionName }),
    title: buildDraftTitle({
      year,
      trackName: trackHint?.trackName ?? '',
      sessionName,
      driverName: driverHint?.driverName ?? ''
    }),
    trackName: trackHint?.trackName ?? '',
    trackCountry: trackHint?.trackCountry ?? '',
    trackQuery: trackHint?.trackQuery ?? '',
    trackAliases: trackHint?.aliases ?? [],
    driverName: driverHint?.driverName ?? '',
    driverNumber: driverHint?.driverNumber ?? '',
    driverAliases: driverHint?.aliases ?? [],
    year,
    sessionName,
    sessionKey: '',
    lapNumber: '',
    unresolvedFields: [
      !trackHint && 'trackName',
      !driverHint && 'driverName',
      !year && 'year'
    ].filter(Boolean)
  };
}

function pickSession(parsed, sessions) {
  const trackAliases = (parsed.trackAliases ?? []).map(normalizeValue).filter(Boolean);
  const targetTrackName = normalizeValue(parsed.trackName);
  const targetCountry = normalizeValue(parsed.trackCountry);

  if (!trackAliases.length && !targetTrackName && !targetCountry) {
    return sessions.length === 1 ? sessions[0] : null;
  }

  const scored = sessions
    .map((session) => {
      const haystack = normalizeValue(
        [
          session.circuit_short_name,
          session.country_name,
          session.location,
          session.session_name
        ].join(' ')
      );

      let score = 0;
      if (targetCountry && normalizeValue(session.country_name) === targetCountry) {
        score += 6;
      }

      if (
        targetTrackName &&
        [session.circuit_short_name, session.location]
          .map(normalizeValue)
          .some((value) => value && (value === targetTrackName || value.includes(targetTrackName)))
      ) {
        score += 8;
      }

      for (const alias of trackAliases) {
        if (alias.length >= 4 && haystack.includes(alias)) {
          score += Math.min(alias.split(' ').length * 2, 6);
        }
      }

      return { session, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  if (!scored.length) {
    return sessions.length === 1 ? sessions[0] : null;
  }

  if (scored.length > 1 && scored[0].score === scored[1].score) {
    const exactCircuit = scored.filter((item) =>
      normalizeValue(item.session.circuit_short_name).includes(normalizeValue(parsed.trackName))
    );
    return exactCircuit.length === 1 ? exactCircuit[0].session : null;
  }

  return scored[0].session;
}

function pickDriver(parsed, drivers) {
  if (parsed.driverNumber) {
    const byNumber = drivers.find((driver) => String(driver.driver_number) === String(parsed.driverNumber));
    if (byNumber) {
      return byNumber;
    }
  }

  if (!parsed.driverName) {
    return null;
  }

  const wanted = normalizeValue(parsed.driverName);
  const matched = drivers.filter((driver) => {
    const name = normalizeValue(driver.full_name);
    return name === wanted || name.includes(wanted) || wanted.includes(name);
  });

  return matched.length === 1 ? matched[0] : null;
}

export function pickFastestLap(laps) {
  return [...laps]
    .filter((lap) => lap.lap_duration !== null)
    .sort((left, right) => Number(left.lap_duration) - Number(right.lap_duration))[0] ?? null;
}

function isOpenF1NotFoundError(error) {
  return /OpenF1 request failed: 404/.test(String(error?.message ?? error));
}

export async function resolveParsedVideoMetadata(parsed, fetchOpenF1, options = {}) {
  const resolved = { ...parsed };

  if (resolved.year && resolved.sessionName) {
    const sessions = await fetchOpenF1('/sessions', {
      year: resolved.year,
      session_name: resolved.sessionName
    });
    const session = pickSession(resolved, sessions);

    if (session) {
      resolved.sessionKey = String(session.session_key);
      resolved.trackCountry = resolved.trackCountry || session.country_name || '';
      resolved.trackName = resolved.trackName || session.circuit_short_name || session.location || '';
      resolved.trackQuery = resolved.trackQuery || session.circuit_short_name || session.location || '';
    }
  }

  if (resolved.sessionKey && (resolved.driverName || resolved.driverNumber)) {
    const drivers = await fetchOpenF1('/drivers', {
      session_key: resolved.sessionKey
    });
    const driver = pickDriver(resolved, drivers);

    if (driver) {
      resolved.driverName = driver.full_name
        .toLowerCase()
        .split(' ')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      resolved.driverNumber = String(driver.driver_number);
    }
  }

  if (resolved.sessionKey && resolved.driverNumber && resolved.sessionName === 'Qualifying') {
    try {
      const laps = await fetchOpenF1('/laps', {
        session_key: resolved.sessionKey,
        driver_number: resolved.driverNumber
      });
      const fastestLap = pickFastestLap(laps);

      if (fastestLap) {
        resolved.lapNumber = String(fastestLap.lap_number);
      }
    } catch (error) {
      if (!isOpenF1NotFoundError(error) || !options.resolveFastestLap) {
        throw error;
      }

      const fallback = await options.resolveFastestLap(resolved);
      if (fallback) {
        resolved.lapNumber = String(fallback.lapNumber ?? '');
        resolved.lapStartIso = fallback.lapStartIso ?? '';
        resolved.lapDurationSeconds = Number(fallback.lapDurationSeconds ?? 0);
      }
    }
  }

  resolved.unresolvedFields = [
    !resolved.trackName && 'trackName',
    !resolved.trackCountry && 'trackCountry',
    !resolved.driverName && 'driverName',
    !resolved.driverNumber && 'driverNumber',
    !resolved.year && 'year',
    !resolved.sessionName && 'sessionName',
    !resolved.sessionKey && 'sessionKey',
    !resolved.lapNumber && resolved.sessionName === 'Qualifying' && 'lapNumber'
  ].filter(Boolean);

  return resolved;
}
