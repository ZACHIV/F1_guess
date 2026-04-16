import './studio.css';
import {
  buildMetadataAssistantPrompt,
  parseMetadataAssistantResponse
} from './lib/studio-ai-utils.js';

const app = document.querySelector('#app');

const emptyDraft = () => ({
  id: '',
  title: '',
  audioSrc: '',
  clipDurationMs: 0,
  durationLabel: '',
  trackName: '',
  trackCountry: '',
  driverName: '',
  driverNumber: '',
  telemetrySource: '',
  trackVectorSource: '',
  trackSvgSrc: '',
  telemetryLocationSrc: '',
  telemetryCarDataSrc: '',
  prompt: '',
  options: []
});

const defaultFormState = () => ({
  videoUrl: '',
  videoTitle: '',
  videoDescription: '',
  aiPrompt: '',
  aiResponse: '',
  trackAsset: '',
  trackQuery: '',
  year: '2025',
  sessionName: 'Qualifying',
  sessionKey: '',
  lapNumber: ''
});

const state = {
  challenges: [],
  selectedId: '',
  draft: emptyDraft(),
  form: defaultFormState(),
  sessions: [],
  drivers: [],
  laps: [],
  busy: false,
  busyLabel: '',
  message: '准备就绪。',
  tone: 'neutral',
  activity: []
};

function formatDurationLabel(durationMs) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `00:${minutes}:${seconds}`;
}

function renderOptions(options) {
  return Array.isArray(options) ? options.join(', ') : '';
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || '请求失败');
  }

  return payload;
}

async function loadLibrary() {
  state.challenges = await request('/api/studio/library');

  if (!state.selectedId && state.challenges.length) {
    state.selectedId = state.challenges[0].id;
  }

  if (state.selectedId) {
    const challenge = state.challenges.find((item) => item.id === state.selectedId);
    if (challenge) {
      state.draft = structuredClone(challenge);
    }
  }
}

function setStatus(message, tone = 'neutral') {
  state.message = message;
  state.tone = tone;
}

function pushActivity(message, tone = 'neutral') {
  const time = new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(new Date());

  state.activity = [{ message, tone, time }, ...state.activity].slice(0, 6);
}

function syncDraftFromForm() {
  state.draft.id = document.querySelector('#draft-id')?.value.trim() ?? state.draft.id;
  state.draft.title = document.querySelector('#draft-title')?.value.trim() ?? state.draft.title;
  state.draft.trackName = document.querySelector('#draft-track-name')?.value.trim() ?? state.draft.trackName;
  state.draft.trackCountry = document.querySelector('#draft-track-country')?.value.trim() ?? state.draft.trackCountry;
  state.draft.driverName = document.querySelector('#draft-driver-name')?.value.trim() ?? state.draft.driverName;
  state.draft.driverNumber = document.querySelector('#draft-driver-number')?.value.trim() ?? state.draft.driverNumber;
  state.draft.prompt = document.querySelector('#draft-prompt')?.value.trim() ?? state.draft.prompt;
  state.draft.options = (document.querySelector('#draft-options')?.value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncFormState() {
  state.form.videoUrl = document.querySelector('#video-url')?.value.trim() ?? state.form.videoUrl;
  state.form.videoTitle = document.querySelector('#video-title')?.value.trim() ?? state.form.videoTitle;
  state.form.videoDescription = document.querySelector('#video-description')?.value.trim() ?? state.form.videoDescription;
  state.form.aiPrompt = document.querySelector('#ai-prompt')?.value ?? state.form.aiPrompt;
  state.form.aiResponse = document.querySelector('#ai-response')?.value ?? state.form.aiResponse;
  state.form.trackAsset = document.querySelector('#track-asset')?.value.trim() ?? state.form.trackAsset;
  state.form.trackQuery = document.querySelector('#track-query')?.value.trim() ?? state.form.trackQuery;
  state.form.year = document.querySelector('#year')?.value.trim() ?? state.form.year;
  state.form.sessionName = document.querySelector('#session-name')?.value.trim() ?? state.form.sessionName;
  state.form.sessionKey = document.querySelector('#session-key')?.value.trim() ?? state.form.sessionKey;
  state.form.lapNumber = document.querySelector('#lap-number')?.value.trim() ?? state.form.lapNumber;
}

function syncAllFromForm() {
  syncDraftFromForm();
  syncFormState();
}

function requireValue(value, message) {
  if (!String(value ?? '').trim()) {
    throw new Error(message);
  }
}

function friendlyErrorMessage(message) {
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

  return message || '发生了未知错误。';
}

function renderResultSection(title, items, labelBuilder) {
  return `
    <section class="result-section">
      <div class="result-section__header">
        <strong>${title}</strong>
        <span>${items.length} 条</span>
      </div>
      <div class="result-grid">
        ${
          items.length
            ? items
                .slice(0, 6)
                .map((item) => `<div class="result-card">${labelBuilder(item)}</div>`)
                .join('')
            : '<div class="result-empty">暂无结果</div>'
        }
      </div>
    </section>
  `;
}

function render() {
  app.innerHTML = `
    <main class="studio-shell">
      <header class="studio-header">
        <div>
          <p class="eyebrow">内容后台</p>
          <h1>F1 Guess 开发者模式</h1>
          <p class="studio-subtitle">从网址提整段音频，到赛道 SVG、OpenF1 遥测数据、题目保存，全部集中在这里。</p>
        </div>
        <div class="studio-header__actions">
          <a class="studio-link" href="/" target="_blank" rel="noreferrer">打开前台预览</a>
        </div>
      </header>

      <section class="studio-layout">
        <aside class="library-panel">
          <div class="panel-title-row">
            <div>
              <p class="eyebrow">题库</p>
              <h2>当前题目</h2>
            </div>
            <button class="secondary" type="button" id="new-btn" ${state.busy ? 'disabled' : ''}>新建题目</button>
          </div>
          <div class="library-list">
            ${state.challenges
              .map(
                (challenge) => `
                  <button class="library-item ${challenge.id === state.selectedId ? 'is-active' : ''}" type="button" data-select-id="${challenge.id}">
                    <strong>${escapeHtml(challenge.title || challenge.id)}</strong>
                    <span>${escapeHtml(challenge.trackName || '未命名赛道')}</span>
                  </button>
                `
              )
              .join('')}
          </div>
        </aside>

        <section class="workspace-panel">
          <article class="studio-card">
            <div class="panel-title-row">
              <div>
                <p class="eyebrow">状态</p>
                <h2>执行反馈</h2>
              </div>
              <span class="status-chip is-${state.tone}">${state.busy ? '处理中' : '待命中'}</span>
            </div>
            <div class="status-box is-${state.tone}">${state.message}</div>
            <div class="status-detail">${state.busy ? `当前操作：${escapeHtml(state.busyLabel || '后台处理中')}` : '当前没有进行中的任务。'}</div>
            <div class="progress-shell ${state.busy ? 'is-busy' : ''}">
              <div class="progress-bar"></div>
            </div>
            <div class="activity-list">
              ${
                state.activity.length
                  ? state.activity
                      .map(
                        (item) => `
                          <div class="activity-item">
                            <span class="activity-item__time">${item.time}</span>
                            <strong class="activity-item__tone is-${item.tone}">${escapeHtml(item.message)}</strong>
                          </div>
                        `
                      )
                      .join('')
                  : '<div class="result-empty">还没有操作记录</div>'
              }
            </div>
          </article>

          <article class="studio-card">
            <p class="eyebrow">步骤一</p>
            <h2>整段音频提取</h2>
            <div class="form-grid">
              <label class="field field--full">
                <span>视频网址</span>
                <input id="video-url" value="${escapeHtml(state.form.videoUrl)}" placeholder="https://..." />
              </label>
              <label class="field field--full">
                <span>视频标题</span>
                <input id="video-title" value="${escapeHtml(state.form.videoTitle)}" placeholder="可留空，支持从视频网址自动读取" />
              </label>
              <label class="field field--full">
                <span>视频简介</span>
                <textarea id="video-description" placeholder="可留空，支持从视频网址自动读取">${escapeHtml(state.form.videoDescription)}</textarea>
              </label>
              <label class="field">
                <span>题目 ID / slug</span>
                <input id="draft-id" value="${escapeHtml(state.draft.id)}" />
              </label>
              <label class="field">
                <span>题目标题</span>
                <input id="draft-title" value="${escapeHtml(state.draft.title)}" />
              </label>
            </div>
            <div class="actions">
              <button class="secondary" type="button" id="parse-video-btn" ${state.busy ? 'disabled' : ''}>${state.busy && state.busyLabel.includes('解析视频') ? '解析中...' : '解析视频信息'}</button>
              <button class="primary" type="button" id="extract-btn" ${state.busy ? 'disabled' : ''}>${state.busy && state.busyLabel.includes('音频') ? '提取中...' : '提取整段音频'}</button>
            </div>
          </article>

          <article class="studio-card">
            <p class="eyebrow">步骤二</p>
            <h2>大模型校对</h2>
            <div class="form-grid">
              <label class="field field--full">
                <span>提示词</span>
                <textarea id="ai-prompt" class="prompt-textarea" placeholder="点击下方按钮自动生成给大模型的提示词">${escapeHtml(state.form.aiPrompt)}</textarea>
              </label>
              <label class="field field--full">
                <span>大模型返回结果</span>
                <textarea id="ai-response" class="prompt-textarea" placeholder='把大模型返回的 JSON 直接粘贴到这里'>${escapeHtml(state.form.aiResponse)}</textarea>
              </label>
            </div>
            <div class="actions">
              <button class="secondary" type="button" id="generate-prompt-btn" ${state.busy ? 'disabled' : ''}>生成提示词</button>
              <button class="secondary" type="button" id="copy-prompt-btn" ${state.busy ? 'disabled' : ''}>复制提示词</button>
              <button class="primary" type="button" id="apply-ai-btn" ${state.busy ? 'disabled' : ''}>应用返回结果</button>
            </div>
          </article>

          <article class="studio-card">
            <p class="eyebrow">步骤三</p>
            <h2>赛道与题目编辑</h2>
            <div class="form-grid">
              <label class="field">
                <span>赛道名</span>
                <input id="draft-track-name" value="${escapeHtml(state.draft.trackName)}" />
              </label>
              <label class="field">
                <span>国家</span>
                <input id="draft-track-country" value="${escapeHtml(state.draft.trackCountry)}" />
              </label>
              <label class="field">
                <span>车手名</span>
                <input id="draft-driver-name" value="${escapeHtml(state.draft.driverName)}" />
              </label>
              <label class="field">
                <span>车手号码</span>
                <input id="draft-driver-number" value="${escapeHtml(state.draft.driverNumber)}" />
              </label>
              <label class="field field--full">
                <span>选项</span>
                <input id="draft-options" value="${escapeHtml(renderOptions(state.draft.options))}" placeholder="Red Bull Ring, Monza, Suzuka, Spa" />
              </label>
              <label class="field field--full">
                <span>提示文案</span>
                <textarea id="draft-prompt">${escapeHtml(state.draft.prompt)}</textarea>
              </label>
            </div>
            <div class="actions">
              <button class="primary" type="button" id="save-btn" ${state.busy ? 'disabled' : ''}>保存题目</button>
              <button class="danger" type="button" id="delete-btn" ${!state.draft.id || state.busy ? 'disabled' : ''}>删除题目</button>
            </div>
          </article>

          <article class="studio-card">
            <p class="eyebrow">步骤四</p>
            <h2>赛道 SVG 与遥测数据</h2>
            <div class="form-grid">
              <label class="field">
                <span>赛道 SVG 文件名</span>
                <input id="track-asset" value="${escapeHtml(state.form.trackAsset || state.draft.id || 'track-asset')}" />
              </label>
              <label class="field">
                <span>本地检索关键词</span>
                <input id="track-query" value="${escapeHtml(state.form.trackQuery || state.draft.trackName)}" placeholder="Red Bull Ring / Spielberg / A1-Ring" />
              </label>
              <label class="field">
                <span>年份</span>
                <input id="year" value="${escapeHtml(state.form.year)}" />
              </label>
              <label class="field">
                <span>场次名称</span>
                <input id="session-name" value="${escapeHtml(state.form.sessionName)}" />
              </label>
              <label class="field">
                <span>场次 Key</span>
                <input id="session-key" value="${escapeHtml(state.form.sessionKey)}" placeholder="9951" />
              </label>
              <label class="field">
                <span>圈数</span>
                <input id="lap-number" value="${escapeHtml(state.form.lapNumber)}" placeholder="17" />
              </label>
            </div>
            <div class="actions">
              <button class="secondary" type="button" id="track-btn" ${state.busy ? 'disabled' : ''}>从本地导入赛道 SVG</button>
              <button class="secondary" type="button" id="sessions-btn" ${state.busy ? 'disabled' : ''}>查询场次</button>
              <button class="secondary" type="button" id="drivers-btn" ${state.busy ? 'disabled' : ''}>查询车手</button>
              <button class="secondary" type="button" id="laps-btn" ${state.busy ? 'disabled' : ''}>查询圈速</button>
              <button class="primary" type="button" id="telemetry-btn" ${state.busy ? 'disabled' : ''}>导入遥测数据</button>
            </div>
            <div class="result-stack">
              ${renderResultSection('场次结果', state.sessions, (item) => `<strong>场次 ${escapeHtml(item.session_key)}</strong><span>${escapeHtml(item.country_name)} · ${escapeHtml(item.session_name)}</span>`)}
              ${renderResultSection('车手结果', state.drivers, (item) => `<strong>#${escapeHtml(item.driver_number)}</strong><span>${escapeHtml(item.full_name)}</span>`)}
              ${renderResultSection('圈速结果', state.laps, (item) => `<strong>第 ${escapeHtml(item.lap_number)} 圈</strong><span>${escapeHtml(item.lap_duration)} 秒</span>`)}
            </div>
          </article>

          <article class="studio-card">
            <p class="eyebrow">草稿预览</p>
            <h2>当前题目 JSON</h2>
            <textarea class="preview-json" readonly>${JSON.stringify(state.draft, null, 2)}</textarea>
          </article>
        </section>
      </section>
    </main>
  `;

  bindEvents();
}

async function runAction(message, fn) {
  syncAllFromForm();
  state.busy = true;
  state.busyLabel = message;
  setStatus(message, 'neutral');
  pushActivity(message, 'neutral');
  render();

  try {
    await fn();
  } catch (error) {
    state.busy = false;
    state.busyLabel = '';
    setStatus(friendlyErrorMessage(error.message), 'error');
    pushActivity(friendlyErrorMessage(error.message), 'error');
    render();
    return;
  }

  state.busy = false;
  state.busyLabel = '';
  render();
}

function bindEvents() {
  document.querySelector('#new-btn')?.addEventListener('click', () => {
    state.selectedId = '';
    state.draft = emptyDraft();
    state.form = {
      ...defaultFormState(),
      trackAsset: ''
    };
    state.sessions = [];
    state.drivers = [];
    state.laps = [];
    setStatus('已创建新的空白草稿。', 'success');
    pushActivity('已创建新的空白草稿。', 'success');
    render();
  });

  document.querySelectorAll('[data-select-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-select-id');
      const challenge = state.challenges.find((item) => item.id === id);
      if (!challenge) return;
      state.selectedId = id;
      state.draft = structuredClone(challenge);
      state.form.trackAsset = challenge.id;
      setStatus(`已载入题目：${challenge.title || challenge.id}`, 'success');
      pushActivity(`已载入题目：${challenge.title || challenge.id}`, 'success');
      render();
    });
  });

  document.querySelector('#extract-btn')?.addEventListener('click', () => {
    runAction('正在提取整段音频，请稍候...', async () => {
      requireValue(state.draft.id, '请先填写题目 ID / slug。');
      requireValue(state.form.videoUrl, '请先粘贴视频网址。');
      const payload = await request('/api/studio/extract', {
        method: 'POST',
        body: JSON.stringify({
          slug: state.draft.id,
          url: state.form.videoUrl
        })
      });

      state.draft.audioSrc = `/${payload.paths.audioMp3.replace(/^public\//, '')}`;
      state.draft.clipDurationMs = payload.durationMs;
      state.draft.durationLabel = formatDurationLabel(payload.durationMs);
      state.form.trackAsset = state.form.trackAsset || state.draft.id;
      setStatus(`音频提取完成，已生成 ${state.draft.audioSrc}`, 'success');
      pushActivity(`音频提取完成：${state.draft.audioSrc}`, 'success');
    });
  });

  document.querySelector('#parse-video-btn')?.addEventListener('click', () => {
    runAction('正在解析视频标题与简介...', async () => {
      requireValue(state.form.videoUrl || state.form.videoTitle || state.form.videoDescription, '请先填写视频网址，或至少补充标题 / 简介。');
      const payload = await request('/api/studio/video-metadata', {
        method: 'POST',
        body: JSON.stringify({
          url: state.form.videoUrl,
          title: state.form.videoTitle,
          description: state.form.videoDescription
        })
      });

      state.form.videoTitle = payload.sourceTitle || '';
      state.form.videoDescription = payload.sourceDescription || '';

      state.draft.id = payload.parsed.id || '';
      state.draft.title = payload.parsed.title || '';
      state.draft.trackName = payload.parsed.trackName || '';
      state.draft.trackCountry = payload.parsed.trackCountry || '';
      state.draft.driverName = payload.parsed.driverName || '';
      state.draft.driverNumber = payload.parsed.driverNumber || '';
      state.form.trackQuery = payload.parsed.trackQuery || '';
      state.form.year = payload.parsed.year || '';
      state.form.sessionName = payload.parsed.sessionName || '';
      state.form.sessionKey = payload.parsed.sessionKey || '';
      state.form.lapNumber = payload.parsed.lapNumber || '';
      state.form.trackAsset = state.form.trackAsset || state.draft.id;

      const unresolvedLabel = payload.parsed.unresolvedFields.length
        ? `未识别字段：${payload.parsed.unresolvedFields.join(', ')}`
        : '基础字段已自动补全。';
      setStatus(`视频信息解析完成。${unresolvedLabel}`, 'success');
      pushActivity(`视频信息解析完成。${unresolvedLabel}`, 'success');
    });
  });

  document.querySelector('#generate-prompt-btn')?.addEventListener('click', () => {
    syncAllFromForm();
    state.form.aiPrompt = buildMetadataAssistantPrompt({
      videoUrl: state.form.videoUrl,
      videoTitle: state.form.videoTitle,
      videoDescription: state.form.videoDescription,
      draft: state.draft,
      form: state.form
    });
    setStatus('已生成给大模型的提示词。', 'success');
    pushActivity('已生成给大模型的提示词。', 'success');
    render();
  });

  document.querySelector('#copy-prompt-btn')?.addEventListener('click', async () => {
    syncAllFromForm();

    if (!state.form.aiPrompt.trim()) {
      state.form.aiPrompt = buildMetadataAssistantPrompt({
        videoUrl: state.form.videoUrl,
        videoTitle: state.form.videoTitle,
        videoDescription: state.form.videoDescription,
        draft: state.draft,
        form: state.form
      });
    }

    try {
      await navigator.clipboard.writeText(state.form.aiPrompt);
      setStatus('提示词已复制，可以直接粘贴给大模型。', 'success');
      pushActivity('提示词已复制，可以直接粘贴给大模型。', 'success');
    } catch {
      setStatus('浏览器未能自动复制，提示词已生成，请手动复制文本框内容。', 'error');
      pushActivity('浏览器未能自动复制，请手动复制提示词。', 'error');
    }

    render();
  });

  document.querySelector('#apply-ai-btn')?.addEventListener('click', () => {
    runAction('正在应用大模型返回结果...', async () => {
      const parsed = parseMetadataAssistantResponse(state.form.aiResponse);

      state.draft.id = parsed.id || state.draft.id;
      state.draft.title = parsed.title || state.draft.title;
      state.draft.trackName = parsed.trackName;
      state.draft.trackCountry = parsed.trackCountry;
      state.draft.driverName = parsed.driverName;
      state.draft.driverNumber = parsed.driverNumber;
      state.form.trackQuery = parsed.trackQuery;
      state.form.year = parsed.year;
      state.form.sessionName = parsed.sessionName;
      state.form.sessionKey = parsed.sessionKey;
      state.form.lapNumber = parsed.lapNumber;
      state.form.trackAsset = state.form.trackAsset || state.draft.id;

      const unresolvedLabel = parsed.unresolvedFields.length
        ? `仍待确认：${parsed.unresolvedFields.join(', ')}`
        : '关键字段已回填完成。';
      setStatus(`大模型结果已应用。${unresolvedLabel}`, 'success');
      pushActivity(`大模型结果已应用。${unresolvedLabel}`, 'success');
    });
  });

  document.querySelector('#save-btn')?.addEventListener('click', () => {
    runAction('正在保存题目...', async () => {
      requireValue(state.draft.id, '保存前请先填写题目 ID / slug。');
      requireValue(state.draft.title, '保存前请先填写题目标题。');
      await request('/api/studio/challenges', {
        method: 'POST',
        body: JSON.stringify(state.draft)
      });
      await loadLibrary();
      state.selectedId = state.draft.id;
      setStatus(`题目已保存：${state.draft.title || state.draft.id}`, 'success');
      pushActivity(`题目已保存：${state.draft.title || state.draft.id}`, 'success');
    });
  });

  document.querySelector('#delete-btn')?.addEventListener('click', () => {
    if (!state.draft.id) return;
    if (!window.confirm(`确认删除题目「${state.draft.title || state.draft.id}」吗？`)) {
      return;
    }

    runAction('正在删除题目...', async () => {
      await request(`/api/studio/challenges/${encodeURIComponent(state.draft.id)}`, {
        method: 'DELETE'
      });
      await loadLibrary();
      state.selectedId = state.challenges[0]?.id ?? '';
      state.draft = state.challenges[0] ? structuredClone(state.challenges[0]) : emptyDraft();
      state.form.trackAsset = state.draft.id;
      setStatus('题目已删除。', 'success');
      pushActivity('题目已删除。', 'success');
    });
  });

  document.querySelector('#track-btn')?.addEventListener('click', () => {
    runAction('正在从本地 f1db 导入赛道 SVG...', async () => {
      requireValue(state.form.trackAsset || state.draft.id, '请先填写赛道 SVG 文件名。');
      requireValue(state.form.trackQuery || state.draft.trackName, '请先填写赛道名或本地检索关键词。');
      const payload = await request('/api/studio/tracks/import-local', {
        method: 'POST',
        body: JSON.stringify({
          assetName: state.form.trackAsset || state.draft.id,
          query: state.form.trackQuery || state.draft.trackName
        })
      });
      state.draft.trackSvgSrc = payload.trackSvgSrc;
      state.draft.trackVectorSource = `F1DB 本地赛道 SVG · ${payload.circuitName} · ${payload.layoutId}`;
      setStatus(`赛道 SVG 已导入：${payload.circuitName} (${payload.layoutId})`, 'success');
      pushActivity(`赛道 SVG 已导入：${payload.circuitName} (${payload.layoutId})`, 'success');
    });
  });

  document.querySelector('#sessions-btn')?.addEventListener('click', () => {
    runAction('正在查询场次...', async () => {
      requireValue(state.form.year, '请先填写年份。');
      state.sessions = await request(`/api/studio/openf1/sessions?year=${encodeURIComponent(state.form.year)}&countryName=${encodeURIComponent(state.draft.trackCountry)}&sessionName=${encodeURIComponent(state.form.sessionName)}`);
      setStatus(`已找到 ${state.sessions.length} 条场次结果。`, 'success');
      pushActivity(`已找到 ${state.sessions.length} 条场次结果。`, 'success');
    });
  });

  document.querySelector('#drivers-btn')?.addEventListener('click', () => {
    runAction('正在查询车手...', async () => {
      requireValue(state.form.sessionKey, '请先填写场次 Key。');
      state.drivers = await request(`/api/studio/openf1/drivers?sessionKey=${encodeURIComponent(state.form.sessionKey)}`);
      setStatus(`已找到 ${state.drivers.length} 位车手。`, 'success');
      pushActivity(`已找到 ${state.drivers.length} 位车手。`, 'success');
    });
  });

  document.querySelector('#laps-btn')?.addEventListener('click', () => {
    runAction('正在查询圈速...', async () => {
      requireValue(state.form.sessionKey, '请先填写场次 Key。');
      requireValue(state.draft.driverNumber, '请先填写车手号码。');
      state.laps = await request(`/api/studio/openf1/laps?sessionKey=${encodeURIComponent(state.form.sessionKey)}&driverNumber=${encodeURIComponent(state.draft.driverNumber)}`);
      setStatus(`已找到 ${state.laps.length} 条有效圈速。`, 'success');
      pushActivity(`已找到 ${state.laps.length} 条有效圈速。`, 'success');
    });
  });

  document.querySelector('#telemetry-btn')?.addEventListener('click', () => {
    runAction('正在导入遥测数据...', async () => {
      requireValue(state.draft.id, '导入遥测数据前请先填写题目 ID / slug。');
      requireValue(state.form.sessionKey, '请先填写场次 Key。');
      requireValue(state.draft.driverNumber, '请先填写车手号码。');
      requireValue(state.form.lapNumber, '请先填写圈数。');
      const payload = await request('/api/studio/openf1/import', {
        method: 'POST',
        body: JSON.stringify({
          slug: state.draft.id,
          sessionKey: state.form.sessionKey,
          driverNumber: state.draft.driverNumber,
          lapNumber: state.form.lapNumber
        })
      });
      state.draft.telemetryLocationSrc = payload.telemetryLocationSrc;
      state.draft.telemetryCarDataSrc = payload.telemetryCarDataSrc;
      state.draft.telemetrySource = 'OpenF1 官方 location + car_data';
      setStatus(`遥测数据导入完成：${payload.locationPoints} 个位置点，${payload.carSamples} 个车辆数据点。`, 'success');
      pushActivity(`遥测数据导入完成：${payload.locationPoints} 个位置点，${payload.carSamples} 个车辆数据点。`, 'success');
    });
  });
}

loadLibrary()
  .then(render)
  .catch((error) => {
    setStatus(error.message, 'error');
    render();
  });
