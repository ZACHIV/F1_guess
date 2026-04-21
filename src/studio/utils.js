export function formatDurationLabel(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

export function roundCropValue(value) {
  return Number(value ?? 0).toFixed(1).replace(/\.0$/, '');
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function requireValue(value, message) {
  if (!String(value ?? '').trim()) {
    throw new Error(message);
  }
}

export function friendlyErrorMessage(message = '') {
  if (message.includes('No timed lap found')) {
    return '没有找到符合条件的有效圈速，请确认场次 Key、车手号码和圈数是否正确。';
  }

  if (message.includes('F1DB circuit not found')) {
    return '本地 f1db 里没有找到对应赛道，请检查赛道名或换一个别名再试。';
  }

  if (message.includes('F1DB SVG asset is missing')) {
    return '本地 f1db 资源不完整，缺少对应的赛道 SVG 文件。';
  }

  if (message.includes('F1DB local repository is missing')) {
    return '没有找到本地 f1db 仓库，请确认它位于 submodule/f1db。';
  }

  if (message.includes('ffprobe failed')) {
    return '音频时长探测失败，请确认 FFmpeg / ffprobe 已正确安装。';
  }

  if (message.includes('Duplicate challenge id already exists')) {
    return '复制失败：新的题目 ID 已存在。';
  }

  if (message.includes('Source challenge not found')) {
    return '复制失败：没有找到要复制的题目。';
  }

  return message || '发生了未知错误。';
}
