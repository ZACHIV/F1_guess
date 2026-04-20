import { normalizeLocale } from './track-locales.js';

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
      }
    ],
    timeout: [
      {
        headline: 'Clock out. Max takes this one on default settings.',
        copy: 'Correct answer: {answer}. The minute expired before the answer landed, so Verstappen gets the room and the soundtrack.'
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
      }
    ]
  },
  'zh-Hans': {
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
      }
    ],
    timeout: [
      {
        headline: '时间到，Max 直接默认收下这一局。',
        copy: '正确答案：{answer}。1 分钟内没能完成作答，这局顺理成章回到 Verstappen 名下。'
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
        headline: '这一局提前退赛，成绩自然记给 Max。',
        copy: '正确答案：{answer}。你没把对决打完，所以基准优势还稳稳留在他那边。'
      }
    ]
  },
  'zh-Hant': {
    win: [
      {
        headline: '這次是你先叫出 {track}。',
        copy: '正確答案：{answer}。你比 Max 早了 {delta} 鎖定答案，這局輪到他看你的尾燈。'
      },
      {
        headline: 'Max 這回只能看你慶祝。',
        copy: '正確答案：{answer}。你快了 {delta} 完成鎖定，這種劇情在圍場裡並不常見。'
      }
    ],
    lose: [
      {
        headline: '你認出了 {track}，但 Max 更早一步。',
        copy: '正確答案：{answer}。答案沒錯，只是 Max 已經早了 {delta} 把門關上。'
      },
      {
        headline: '這題你會，Max 只是更像開卷考。',
        copy: '正確答案：{answer}。你答對了，但還是比基準慢了 {delta}。'
      }
    ],
    timeout: [
      {
        headline: '時間到，Max 直接收下這一局。',
        copy: '正確答案：{answer}。1 分鐘內沒能完成作答，這局順理成章回到 Verstappen 名下。'
      }
    ],
    forfeit: [
      {
        headline: '你在 {track} 露出真身前先投了降。',
        copy: '正確答案：{answer}。提前結束對決之後，Max 輕鬆保住了基準線。'
      }
    ]
  },
  fr: {
    win: [
      {
        headline: 'Cette fois, c’est vous qui avez appelé {track} avant Max.',
        copy: 'Bonne réponse : {answer}. Vous avez verrouillé la réponse {delta} avant la référence de Verstappen.'
      },
      {
        headline: 'Max vient de perdre l’appel sur {track}.',
        copy: 'Bonne réponse : {answer}. Vous étiez plus rapide de {delta}, ce qui mérite un petit tour d’honneur.'
      }
    ],
    lose: [
      {
        headline: 'Vous avez eu {track}, mais Max l’avait déjà.',
        copy: 'Bonne réponse : {answer}. Le timing vous a manqué de {delta}.'
      },
      {
        headline: 'La réponse était bonne, le chrono très Verstappen.',
        copy: 'Bonne réponse : {answer}. Vous êtes arrivé {delta} trop tard pour lui voler la ligne.'
      }
    ],
    timeout: [
      {
        headline: 'Temps écoulé. Max prend ça en mode automatique.',
        copy: 'Bonne réponse : {answer}. La minute a gagné la course avant votre réponse.'
      }
    ],
    forfeit: [
      {
        headline: 'Abandon enregistré avant que {track} ne se révèle.',
        copy: 'Bonne réponse : {answer}. En levant le pied trop tôt, vous laissez Max garder la référence.'
      }
    ]
  },
  es: {
    win: [
      {
        headline: 'Esta vez dijiste {track} antes que Max.',
        copy: 'Respuesta correcta: {answer}. Cerraste la respuesta {delta} antes de la referencia de Verstappen.'
      },
      {
        headline: 'Max acaba de perder la llamada en {track}.',
        copy: 'Respuesta correcta: {answer}. Fuiste {delta} más rápido y te llevaste la gloria.'
      }
    ],
    lose: [
      {
        headline: 'Acertaste {track}, pero Max llegó antes.',
        copy: 'Respuesta correcta: {answer}. Te faltaron {delta} para arrebatarle la línea.'
      },
      {
        headline: 'La respuesta era correcta; el timing, muy Verstappen.',
        copy: 'Respuesta correcta: {answer}. Llegaste {delta} tarde a la fiesta.'
      }
    ],
    timeout: [
      {
        headline: 'Se acabó el tiempo. Max se queda esta sin despeinarse.',
        copy: 'Respuesta correcta: {answer}. El cronómetro llegó antes que tu respuesta.'
      }
    ],
    forfeit: [
      {
        headline: 'Bandera blanca antes de que {track} mostrara la carta.',
        copy: 'Respuesta correcta: {answer}. Al rendirte antes de tiempo, Max conserva la referencia.'
      }
    ]
  },
  it: {
    win: [
      {
        headline: 'Questa volta hai chiamato {track} prima di Max.',
        copy: 'Risposta corretta: {answer}. Hai bloccato la risposta {delta} prima del riferimento di Verstappen.'
      },
      {
        headline: 'Max ha appena perso la chiamata su {track}.',
        copy: 'Risposta corretta: {answer}. Sei stato più rapido di {delta} e ti sei preso i diritti di vantarti.'
      }
    ],
    lose: [
      {
        headline: 'Hai preso {track}, ma Max c’era già arrivato.',
        copy: 'Risposta corretta: {answer}. Ti sono mancati {delta} per rubargli la linea.'
      },
      {
        headline: 'La risposta era giusta; il tempismo era molto Verstappen.',
        copy: 'Risposta corretta: {answer}. Sei arrivato {delta} troppo tardi per togliergli la scena.'
      }
    ],
    timeout: [
      {
        headline: 'Tempo scaduto. Max si prende anche questa con impostazioni di default.',
        copy: 'Risposta corretta: {answer}. Il cronometro è arrivato prima della tua risposta.'
      }
    ],
    forfeit: [
      {
        headline: 'Bandiera bianca prima che {track} svelasse il trucco.',
        copy: 'Risposta corretta: {answer}. Arrendendoti troppo presto, lasci a Max il riferimento.'
      }
    ]
  },
  ja: {
    win: [
      {
        headline: '今回は {track} を先に言い当てたのはあなたです。',
        copy: '正解：{answer}。Verstappen の基準より {delta} 早く答えをロックしました。'
      },
      {
        headline: 'この {track} は Max より先に取った。',
        copy: '正解：{answer}。{delta} 先着で、今回は完全にあなたの勝ちです。'
      }
    ],
    lose: [
      {
        headline: '{track} は当てた。でも Max が先でした。',
        copy: '正解：{answer}。答えは合っていましたが、基準より {delta} 遅れました。'
      },
      {
        headline: '答えは正解、タイミングは Verstappen。',
        copy: '正解：{answer}。あと {delta} 早ければ主役になれました。'
      }
    ],
    timeout: [
      {
        headline: '時間切れ。Max がいつものように持っていきました。',
        copy: '正解：{answer}。60 秒以内に答えが出ず、このラウンドは Verstappen のものです。'
      }
    ],
    forfeit: [
      {
        headline: '{track} の正体が出る前に白旗。',
        copy: '正解：{answer}。途中で降りたので、基準はそのまま Max 側に残りました。'
      }
    ]
  },
  de: {
    win: [
      {
        headline: 'Diesmal hast du {track} vor Max genannt.',
        copy: 'Richtige Antwort: {answer}. Du warst {delta} vor Verstappens Referenz dran.'
      },
      {
        headline: 'Max hat den Call auf {track} verloren.',
        copy: 'Richtige Antwort: {answer}. Mit {delta} Vorsprung geht dieses Duell auf dein Konto.'
      }
    ],
    lose: [
      {
        headline: '{track} war richtig, nur Max war früher da.',
        copy: 'Richtige Antwort: {answer}. Es fehlten {delta}, um ihm die Linie abzunehmen.'
      },
      {
        headline: 'Die Antwort war korrekt. Das Timing war sehr Verstappen.',
        copy: 'Richtige Antwort: {answer}. Du warst {delta} zu spät.'
      }
    ],
    timeout: [
      {
        headline: 'Zeit abgelaufen. Max nimmt das im Vorbeigehen mit.',
        copy: 'Richtige Antwort: {answer}. Die Uhr war schneller als dein Call.'
      }
    ],
    forfeit: [
      {
        headline: 'Weiße Flagge, bevor {track} sich verraten konnte.',
        copy: 'Richtige Antwort: {answer}. Durch die frühe Aufgabe bleibt die Referenz sicher bei Max.'
      }
    ]
  },
  ko: {
    win: [
      {
        headline: '이번에는 {track} 를 Max보다 먼저 맞혔습니다.',
        copy: '정답: {answer}. Verstappen 기준보다 {delta} 먼저 답을 잠갔습니다.'
      },
      {
        headline: '이번 {track} 는 Max보다 당신이 먼저였습니다.',
        copy: '정답: {answer}. {delta} 빠르게 들어와서 이번 라운드는 완전히 당신 몫입니다.'
      }
    ],
    lose: [
      {
        headline: '{track} 는 맞혔지만 Max가 더 빨랐습니다.',
        copy: '정답: {answer}. 정답은 맞았지만 기준보다 {delta} 늦었습니다.'
      },
      {
        headline: '답은 맞았고, 타이밍은 너무 Verstappen이었습니다.',
        copy: '정답: {answer}. 단지 {delta} 늦었을 뿐인데 이미 문이 닫혀 있었습니다.'
      }
    ],
    timeout: [
      {
        headline: '시간 종료. Max가 또 하나 챙겨 갑니다.',
        copy: '정답: {answer}. 60초 안에 답이 나오지 않아 이 라운드는 Verstappen의 몫입니다.'
      }
    ],
    forfeit: [
      {
        headline: '{track} 의 정체가 드러나기 전에 백기를 들었습니다.',
        copy: '정답: {answer}. 중간에 포기한 덕분에 기준선은 그대로 Max 쪽에 남았습니다.'
      }
    ]
  }
};

export function pickResultVariant(outcome) {
  const pool = RESULT_COPY_VARIANTS.en[outcome] ?? RESULT_COPY_VARIANTS.en.lose;
  return Math.floor(Math.random() * pool.length);
}

export function buildResultNarrative(locale, outcome, variables, variantId) {
  const normalizedLocale = normalizeLocale(locale);
  const localizedPool = RESULT_COPY_VARIANTS[normalizedLocale]?.[outcome]
    ?? RESULT_COPY_VARIANTS.en[outcome]
    ?? RESULT_COPY_VARIANTS.en.lose;
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
