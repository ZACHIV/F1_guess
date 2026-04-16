function stringifyValue(value) {
  return value ? String(value).trim() : '';
}

export function buildMetadataAssistantPrompt({
  videoUrl = '',
  videoTitle = '',
  videoDescription = '',
  draft = {},
  form = {}
} = {}) {
  const context = {
    videoUrl: stringifyValue(videoUrl),
    videoTitle: stringifyValue(videoTitle),
    videoDescription: stringifyValue(videoDescription),
    draftId: stringifyValue(draft.id),
    draftTitle: stringifyValue(draft.title),
    trackName: stringifyValue(draft.trackName),
    trackCountry: stringifyValue(draft.trackCountry),
    driverName: stringifyValue(draft.driverName),
    driverNumber: stringifyValue(draft.driverNumber),
    trackQuery: stringifyValue(form.trackQuery),
    year: stringifyValue(form.year),
    sessionName: stringifyValue(form.sessionName),
    sessionKey: stringifyValue(form.sessionKey),
    lapNumber: stringifyValue(form.lapNumber)
  };

  return [
    '你是 F1 赛事数据整理助手。请根据我提供的视频信息，帮我确认这条 onboard / pole / qualifying 视频对应的标准化元数据，目标是后续去 OpenF1 精确抓取遥测数据。',
    '',
    '要求：',
    '1. 优先识别排位赛 Qualifying；如果信息明显不是排位赛，再按事实填写 sessionName。',
    '2. 如果无法确定某个字段，返回空字符串，不要猜，不要编造。',
    '3. sessionKey 和 lapNumber 只有在你足够确定时才填写，否则留空。',
    '4. trackQuery 请给我适合本地检索赛道 SVG 的关键词，允许多个别名，用 " / " 连接。',
    '5. driverNumber 必须是字符串，例如 "4"。',
    '6. year 必须是四位数字字符串，例如 "2025"。',
    '7. 只返回 JSON，不要写解释，不要加 Markdown 代码块。',
    '',
    '返回 JSON 结构：',
    '{',
    '  "id": "",',
    '  "title": "",',
    '  "trackName": "",',
    '  "trackCountry": "",',
    '  "trackQuery": "",',
    '  "driverName": "",',
    '  "driverNumber": "",',
    '  "year": "",',
    '  "sessionName": "",',
    '  "sessionKey": "",',
    '  "lapNumber": "",',
    '  "confidence": "",',
    '  "reasoning": "",',
    '  "unresolvedFields": []',
    '}',
    '',
    '当前上下文：',
    JSON.stringify(context, null, 2)
  ].join('\n');
}

function extractJsonBlock(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    throw new Error('请先粘贴大模型返回结果。');
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch) {
    return fencedMatch[1].trim();
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('没有找到可解析的 JSON 对象。');
  }

  return trimmed.slice(start, end + 1);
}

export function parseMetadataAssistantResponse(text) {
  const jsonText = extractJsonBlock(text);
  let parsed;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('大模型返回的 JSON 格式不正确。');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('大模型返回内容不是有效的对象。');
  }

  return {
    id: stringifyValue(parsed.id),
    title: stringifyValue(parsed.title),
    trackName: stringifyValue(parsed.trackName),
    trackCountry: stringifyValue(parsed.trackCountry),
    trackQuery: stringifyValue(parsed.trackQuery),
    driverName: stringifyValue(parsed.driverName),
    driverNumber: stringifyValue(parsed.driverNumber),
    year: stringifyValue(parsed.year),
    sessionName: stringifyValue(parsed.sessionName),
    sessionKey: stringifyValue(parsed.sessionKey),
    lapNumber: stringifyValue(parsed.lapNumber),
    confidence: stringifyValue(parsed.confidence),
    reasoning: stringifyValue(parsed.reasoning),
    unresolvedFields: Array.isArray(parsed.unresolvedFields)
      ? parsed.unresolvedFields.map((item) => stringifyValue(item)).filter(Boolean)
      : []
  };
}
