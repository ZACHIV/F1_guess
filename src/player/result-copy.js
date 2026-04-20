function interpolate(template, variables) {
  return template.replace(/\{(\w+)\}/g, (_, token) =>
    variables[token] == null ? '' : String(variables[token]));
}

const RESULT_COPY_VARIANTS = {
  en: {
    win: [
      {
        headline: 'You called {track} before Max did.',
        copy: 'Correct answer: {answer}. You got there {delta} ahead of Verstappen’s benchmark, which is not a sentence he enjoys.'
      },
      {
        headline: 'Max just got undercut at {track}.',
        copy: 'Correct answer: {answer}. You beat the benchmark by {delta} and stole the bragging rights on the call.'
      },
      {
        headline: 'That one goes in the anti-Verstappen archive.',
        copy: 'Correct answer: {answer}. You locked it in {delta} early and handed Max the rare experience of being second.'
      },
      {
        headline: 'You rang in {track} like pole was on the line.',
        copy: 'Correct answer: {answer}. The answer landed {delta} before Max’s marker, so this duel goes on your timing sheet.'
      },
      {
        headline: 'For once, Max is the one chasing the delta.',
        copy: 'Correct answer: {answer}. You were {delta} quicker on the guess, which is a dangerous amount of confidence to give anyone.'
      }
    ],
    lose: [
      {
        headline: 'Max still had {track} on speed dial.',
        copy: 'Correct answer: {answer}. You found it, but Verstappen had already cleared out by {delta}.'
      },
      {
        headline: 'You got {track}. Max just got there first.',
        copy: 'Correct answer: {answer}. Good spot, unfortunate timing: the benchmark line was gone {delta} earlier.'
      },
      {
        headline: 'The answer was right. The timing was very Verstappen.',
        copy: 'Correct answer: {answer}. You were only {delta} late, which in Max units is basically a postcode.'
      },
      {
        headline: 'Close enough to brag, late enough to lose.',
        copy: 'Correct answer: {answer}. You had the track, but Max had already signed the sheet {delta} before you.'
      },
      {
        headline: 'You spotted {track}; Max had already filed the paperwork.',
        copy: 'Correct answer: {answer}. The call landed, just {delta} after Verstappen had slammed the door.'
      }
    ],
    timeout: [
      {
        headline: 'Clock out. Max takes this one on default settings.',
        copy: 'Correct answer: {answer}. The minute expired before the answer landed, so Verstappen gets the room and the soundtrack.'
      },
      {
        headline: 'Time called. Max keeps the trophy cabinet open.',
        copy: 'Correct answer: {answer}. You let the timer beat you to the flag, which means this round goes straight to Verstappen.'
      },
      {
        headline: 'The stopwatch waved the chequered flag first.',
        copy: 'Correct answer: {answer}. No call before 60 seconds, so Max strolls off with another one.'
      }
    ],
    forfeit: [
      {
        headline: 'You bailed before {track} gave up the secret.',
        copy: 'Correct answer: {answer}. Early surrender means Max keeps the benchmark without even needing a photo finish.'
      },
      {
        headline: 'Retired from the duel, classified behind Max.',
        copy: 'Correct answer: {answer}. You called it early, so Verstappen gets a very comfortable result.'
      },
      {
        headline: 'White flag raised. Max accepts your paperwork.',
        copy: 'Correct answer: {answer}. Once you waved it off, the benchmark stayed safely in Max territory.'
      }
    ]
  },
  zh: {
    win: [
      {
        headline: '这次是你先叫出 {track}。',
        copy: '正确答案：{answer}。你比 Max 早了 {delta} 锁定答案，这局轮到他看你的尾灯。'
      },
      {
        headline: 'Max 这回只能看你庆祝。',
        copy: '正确答案：{answer}。你快了 {delta} 完成锁定，这种剧情在围场里并不常见。'
      },
      {
        headline: '{track} 这一题，你先冲线。',
        copy: '正确答案：{answer}。你提前 {delta} 完成作答，把这场对决写进了自己的成绩单。'
      },
      {
        headline: '这一局，终于不是 Max 的素材。',
        copy: '正确答案：{answer}。你快了 {delta} 抢先交卷，稀有程度接近围场限量版。'
      },
      {
        headline: '这次轮到 Max 追你的 delta 了。',
        copy: '正确答案：{answer}。你领先 {delta} 锁定答案，气氛已经够你多回味两圈。'
      }
    ],
    lose: [
      {
        headline: '你认出了 {track}，但 Max 更早一步。',
        copy: '正确答案：{answer}。答案没错，只是 Max 已经早了 {delta} 把门关上。'
      },
      {
        headline: '这题你会，Max 只是更像开卷考。',
        copy: '正确答案：{answer}。你答对了，但还是比基准慢了 {delta}。'
      },
      {
        headline: '答案是对的，节奏还是 Max 的。',
        copy: '正确答案：{answer}。你只晚了 {delta}，可在 Max 这里这已经够他开香槟了。'
      },
      {
        headline: '差一点就能把 Max 拉下神坛。',
        copy: '正确答案：{answer}。你成功找到赛道，只是晚了 {delta}，遗憾还挺像正赛亚军。'
      },
      {
        headline: '{track} 你找到了，Max 先签字了。',
        copy: '正确答案：{answer}。作答时机慢了 {delta}，这局还是被他先收走。'
      }
    ],
    timeout: [
      {
        headline: '时间到，Max 直接默认收下这一局。',
        copy: '正确答案：{answer}。1 分钟内没能完成作答，这局顺理成章回到 Verstappen 名下。'
      },
      {
        headline: '还没等你开口，计时器先挥旗了。',
        copy: '正确答案：{answer}。超时之后，这一题就自动变成了 Max 的主场。'
      },
      {
        headline: '这次输给你的不是赛道，是秒表。',
        copy: '正确答案：{answer}。60 秒一到，Max 又多了一场毫不费力的胜利。'
      }
    ],
    forfeit: [
      {
        headline: '你在 {track} 露出真身前先投了降。',
        copy: '正确答案：{answer}。提前结束对决之后，Max 轻松保住了基准线。'
      },
      {
        headline: '白旗一挥，Max 省掉了加班流程。',
        copy: '正确答案：{answer}。你先结束了这局，Verstappen 直接保送胜利。'
      },
      {
        headline: '这一局提前退赛，成绩自然记给 Max。',
        copy: '正确答案：{answer}。你没把对决打完，所以基准优势还稳稳留在他那边。'
      }
    ]
  }
};

export function pickResultVariant(outcome) {
  const pool = RESULT_COPY_VARIANTS.en[outcome] ?? RESULT_COPY_VARIANTS.en.lose;
  return Math.floor(Math.random() * pool.length);
}

export function buildResultNarrative(locale, outcome, variables, variantId) {
  const localizedPool = RESULT_COPY_VARIANTS[locale]?.[outcome] ?? RESULT_COPY_VARIANTS.en[outcome] ?? RESULT_COPY_VARIANTS.en.lose;
  const normalizedVariantId = Number.isInteger(variantId)
    ? ((variantId % localizedPool.length) + localizedPool.length) % localizedPool.length
    : 0;
  const variant = localizedPool[normalizedVariantId] ?? localizedPool[0];

  return {
    variantId: normalizedVariantId,
    headline: interpolate(variant.headline, variables),
    copy: interpolate(variant.copy, variables)
  };
}
