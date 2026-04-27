import './studio.css';
import {
  buildMetadataAssistantPrompt,
  parseMetadataAssistantResponse
} from './lib/studio-ai-utils.js';
import {
  buildDefaultTurn1Crop,
  clampTurn1Crop
} from './lib/turn1-crop-utils.js';
import {
  createDefaultStudioFormState,
  createEmptyStudioDraft,
  createInitialStudioState,
  createTurn1CropAssetState,
  getLapStats
} from './studio/state.js';
import {
  formatDurationLabel,
  friendlyErrorMessage,
  requireValue
} from './studio/utils.js';
import {
  renderStudioApp,
  renderTrackPreview,
  renderTurn1CropSection
} from './studio/render.js';
import {
  bindTurn1CropEditor
} from './studio/turn1-crop-workbench.js';

const app = document.querySelector('#app');
const state = createInitialStudioState();

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

function setDraftTurn1Crop(bounds, nextCrop = state.draft.turn1Crop) {
  state.draft.turn1Crop = nextCrop
    ? clampTurn1Crop(nextCrop, bounds)
    : buildDefaultTurn1Crop(bounds);
  return state.draft.turn1Crop;
}

async function loadLibrary() {
  const payload = await request('/api/studio/library');
  state.challenges = payload.records;
  state.librarySummary = payload.summary;

  if (!state.selectedId && state.challenges.length) {
    state.selectedId = state.challenges[0].id;
  }

  if (state.selectedId && !state.challenges.some((item) => item.id === state.selectedId)) {
    state.selectedId = state.challenges[0]?.id ?? '';
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

function getFilteredChallenges() {
  const searchTerm = state.form.librarySearch.trim().toLowerCase();

  const filtered = state.challenges.filter((challenge) => {
    const matchesSearch = !searchTerm || [
      challenge.id,
      challenge.title,
      challenge.trackName,
      challenge.trackCountry,
      challenge.driverName,
      challenge.category,
      ...(Array.isArray(challenge.tags) ? challenge.tags : [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm);

    const matchesCategory = state.form.categoryFilter === 'all' || challenge.category === state.form.categoryFilter;
    const matchesStatus = state.form.statusFilter === 'all' || challenge.status === state.form.statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (state.form.librarySort === 'updated-desc') {
    return [...filtered].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  if (state.form.librarySort === 'created-desc') {
    return [...filtered].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  if (state.form.librarySort === 'title-asc') {
    return [...filtered].sort((left, right) => left.title.localeCompare(right.title, 'en'));
  }

  if (state.form.librarySort === 'category-asc') {
    return [...filtered].sort((left, right) =>
      left.category.localeCompare(right.category, 'en') ||
      left.title.localeCompare(right.title, 'en')
    );
  }

  return [...filtered].sort((left, right) => left.sortOrder - right.sortOrder);
}

function syncDraftFromForm() {
  state.draft.id = document.querySelector('#draft-id')?.value.trim() ?? state.draft.id;
  state.draft.title = document.querySelector('#draft-title')?.value.trim() ?? state.draft.title;
  state.draft.category = document.querySelector('#draft-category')?.value.trim() ?? state.draft.category;
  state.draft.status = document.querySelector('#draft-status')?.value.trim() ?? state.draft.status;
  state.draft.tags = (document.querySelector('#draft-tags')?.value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  state.draft.notes = document.querySelector('#draft-notes')?.value.trim() ?? state.draft.notes;
  state.draft.trackName = document.querySelector('#draft-track-name')?.value.trim() ?? state.draft.trackName;
  state.draft.trackCountry = document.querySelector('#draft-track-country')?.value.trim() ?? state.draft.trackCountry;
  state.draft.driverName = document.querySelector('#draft-driver-name')?.value.trim() ?? state.draft.driverName;
  state.draft.driverNumber = document.querySelector('#draft-driver-number')?.value.trim() ?? state.draft.driverNumber;
  state.draft.turn1CornerName = document.querySelector('#draft-turn1-corner-name')?.value.trim() ?? state.draft.turn1CornerName;
  state.draft.prompt = document.querySelector('#draft-prompt')?.value.trim() ?? state.draft.prompt;
  state.draft.options = (document.querySelector('#draft-options')?.value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function syncFormState() {
  state.form.librarySearch = document.querySelector('#library-search')?.value ?? state.form.librarySearch;
  state.form.categoryFilter = document.querySelector('#category-filter')?.value ?? state.form.categoryFilter;
  state.form.statusFilter = document.querySelector('#status-filter')?.value ?? state.form.statusFilter;
  state.form.librarySort = document.querySelector('#library-sort')?.value ?? state.form.librarySort;
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

function render() {
  const filteredChallenges = getFilteredChallenges();
  const lapStats = getLapStats(state.laps);
  const trackPreviewHtml = renderTrackPreview({ state, setDraftTurn1Crop });
  const turn1CropHtml = renderTurn1CropSection({ state, setDraftTurn1Crop });

  app.innerHTML = renderStudioApp({
    state,
    filteredChallenges,
    lapStats,
    trackPreviewHtml,
    turn1CropHtml
  });

  bindEvents();
}

async function resolveSessionKeyForTelemetry() {
  if (state.form.sessionKey) {
    return state.form.sessionKey;
  }

  requireValue(state.form.year, '请先填写年份。');
  requireValue(state.draft.trackCountry, '请先填写国家，才能自动匹配场次。');
  requireValue(state.form.sessionName, '请先填写场次名称，才能自动匹配场次。');

  const sessions = (await request(
    `/api/studio/openf1/sessions?year=${encodeURIComponent(state.form.year)}&countryName=${encodeURIComponent(state.draft.trackCountry)}&sessionName=${encodeURIComponent(state.form.sessionName)}`
  )).data ?? [];

  state.sessions = sessions;

  if (sessions.length !== 1) {
    throw new Error(`无法自动确定唯一场次，当前匹配到 ${sessions.length} 条结果，请手动填写场次 Key。`);
  }

  state.form.sessionKey = String(sessions[0].session_key ?? '').trim();
  return state.form.sessionKey;
}

async function resolveLapsForTelemetry() {
  const sessionKey = await resolveSessionKeyForTelemetry();
  requireValue(state.draft.driverNumber, '请先填写车手号码。');

  const laps = await request(
    `/api/studio/openf1/laps?sessionKey=${encodeURIComponent(sessionKey)}&driverNumber=${encodeURIComponent(state.draft.driverNumber)}`
  );

  state.laps = Array.isArray(laps?.data)
    ? laps.data
        .filter((lap) => lap.lap_duration !== null)
        .sort((left, right) => Number(left.lap_number) - Number(right.lap_number))
    : [];

  if (!state.laps.length) {
    throw new Error('没有找到这个车手的有效圈速数据。');
  }

  return state.laps;
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
  bindTurn1CropEditor({
    state,
    render,
    createTurn1CropAssetState,
    setDraftTurn1Crop,
    onSaveCrop: () => {
      if (state.busy) {
        return;
      }

      runAction('正在保存 Turn 1 裁剪...', async () => {
        syncAllFromForm();
        requireValue(state.draft.id, '保存前请先填写题目 ID / slug。');
        requireValue(state.draft.title, '保存前请先填写题目标题。');
        await request('/api/studio/challenges', {
          method: 'POST',
          body: JSON.stringify(state.draft)
        });
        await loadLibrary();
        state.selectedId = state.draft.id;
        setStatus(`Turn 1 裁剪已保存：${state.draft.title || state.draft.id}`, 'success');
        pushActivity(`Turn 1 裁剪已保存：${state.draft.id}`, 'success');
      });
    }
  });

  ['#library-search', '#category-filter', '#status-filter', '#library-sort'].forEach((selector) => {
    document.querySelector(selector)?.addEventListener('input', () => {
      syncFormState();
      render();
    });
    document.querySelector(selector)?.addEventListener('change', () => {
      syncFormState();
      render();
    });
  });

  document.querySelector('#new-btn')?.addEventListener('click', () => {
    state.selectedId = '';
    state.draft = createEmptyStudioDraft();
    state.form = {
      ...state.form,
      ...createDefaultStudioFormState(),
      trackAsset: ''
    };
    state.cropAsset = createTurn1CropAssetState();
    state.sessions = [];
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
      state.laps = [];
      setStatus(`已载入题目：${challenge.title || challenge.id}`, 'success');
      pushActivity(`已载入题目：${challenge.title || challenge.id}`, 'success');
      render();
    });
  });

  document.querySelectorAll('[data-duplicate-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const sourceId = button.getAttribute('data-duplicate-id');
      const source = state.challenges.find((item) => item.id === sourceId);
      if (!source) return;

      const suggestedId = `${source.id}-copy`;
      const newId = window.prompt('请输入复制后的题目 ID / slug', suggestedId);
      if (!newId) return;

      runAction('正在复制题目...', async () => {
        await request('/api/studio/challenges/duplicate', {
          method: 'POST',
          body: JSON.stringify({
            sourceId,
            newId
          })
        });
        state.selectedId = newId.trim();
        await loadLibrary();
        state.form.trackAsset = state.draft.id;
        setStatus(`题目已复制：${newId.trim()}`, 'success');
        pushActivity(`题目已复制：${newId.trim()}`, 'success');
      });
    });
  });

  document.querySelectorAll('[data-move-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-move-id');
      const direction = button.getAttribute('data-direction');
      if (!id || !direction) return;

      runAction('正在调整题目排序...', async () => {
        await request('/api/studio/challenges/reorder', {
          method: 'POST',
          body: JSON.stringify({ id, direction })
        });
        await loadLibrary();
        state.selectedId = id;
        setStatus(`题目排序已更新：${direction === 'up' ? '上移' : '下移'}`, 'success');
        pushActivity(`题目排序已更新：${id}`, 'success');
      });
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

      state.draft.audioSrc = payload.audioSrc;
      state.draft.clipDurationMs = payload.durationMs;
      state.draft.durationLabel = formatDurationLabel(payload.durationMs);
      state.form.trackAsset = state.form.trackAsset || state.draft.id;
      setStatus(`音频提取完成，已生成 ${state.draft.audioSrc}`, 'success');
      pushActivity(`音频提取完成：${payload.storage === 'remote' ? '已上传远程存储' : state.draft.audioSrc}`, 'success');
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
      state.laps = [];

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
      state.laps = [];

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

  document.querySelector('#duplicate-btn')?.addEventListener('click', () => {
    if (!state.draft.id) return;
    const suggestedId = `${state.draft.id}-copy`;
    const newId = window.prompt('请输入复制后的题目 ID / slug', suggestedId);
    if (!newId) return;

    runAction('正在复制题目...', async () => {
      await request('/api/studio/challenges/duplicate', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: state.draft.id,
          newId
        })
      });
      state.selectedId = newId.trim();
      await loadLibrary();
      state.form.trackAsset = state.draft.id;
      setStatus(`题目已复制：${newId.trim()}`, 'success');
      pushActivity(`题目已复制：${newId.trim()}`, 'success');
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
      state.draft = state.challenges[0] ? structuredClone(state.challenges[0]) : createEmptyStudioDraft();
      state.form.trackAsset = state.draft.id;
      setStatus('题目已删除。', 'success');
      pushActivity('题目已删除。', 'success');
    });
  });

  document.querySelector('#track-btn')?.addEventListener('click', () => {
    runAction('正在匹配本地赛道 SVG...', async () => {
      requireValue(state.form.trackAsset || state.draft.id, '请先填写赛道 SVG 文件名。');
      requireValue(state.form.trackQuery || state.draft.trackName, '请先填写赛道名或本地检索关键词。');
      const payload = await request('/api/studio/tracks/import-local', {
        method: 'POST',
        body: JSON.stringify({
          assetName: state.form.trackAsset || state.draft.id,
          query: state.form.trackQuery || state.draft.trackName
        })
      });
      state.draft.turn1Crop = null;
      state.draft.trackSvgSrc = payload.trackSvgSrc;
      state.draft.trackVectorSource = `F1DB white-outline 赛道 SVG · ${payload.circuitName} · ${payload.layoutId}`;
      setStatus(`已匹配并导入赛道图：${payload.circuitName} (${payload.layoutId})。下方预览已更新。`, 'success');
      pushActivity(`赛道图已匹配：${payload.circuitName} (${payload.storage === 'remote' ? '远程已同步' : payload.layoutId})`, 'success');
    });
  });

  document.querySelector('#telemetry-btn')?.addEventListener('click', () => {
    runAction('正在导入遥测数据...', async () => {
      requireValue(state.draft.id, '导入遥测数据前请先填写题目 ID / slug。');
      requireValue(state.draft.driverNumber, '请先填写车手号码。');
      const laps = await resolveLapsForTelemetry();
      const sessionKey = state.form.sessionKey;
      const fastestLap = [...laps].sort((left, right) => Number(left.lap_duration) - Number(right.lap_duration))[0];
      const selectedLapNumber = state.form.lapNumber || String(fastestLap?.lap_number ?? '');

      if (!selectedLapNumber) {
        throw new Error('没有找到可用于导入的有效圈速。');
      }

      const selectedLap = laps.find((lap) => String(lap.lap_number) === String(selectedLapNumber));
      if (!selectedLap) {
        throw new Error(`第 ${selectedLapNumber} 圈不在当前有效圈范围内，请改为 1-${getLapStats(state.laps).maxLapNumber}。`);
      }

      state.form.lapNumber = selectedLapNumber;
      const payload = await request('/api/studio/openf1/import', {
        method: 'POST',
        body: JSON.stringify({
          slug: state.draft.id,
          sessionKey,
          driverNumber: state.draft.driverNumber,
          lapNumber: selectedLapNumber
        })
      });
      state.draft.telemetryLocationSrc = payload.telemetryLocationSrc;
      state.draft.telemetryCarDataSrc = payload.telemetryCarDataSrc;
      state.draft.telemetrySource = 'OpenF1 官方 location + car_data';
      setStatus(`遥测数据导入完成：场次 ${sessionKey}，第 ${selectedLapNumber} 圈，${payload.locationPoints} 个位置点，${payload.carSamples} 个车辆数据点。`, 'success');
      pushActivity(`遥测已导入：场次 ${sessionKey} · 第 ${selectedLapNumber} 圈${payload.storage === 'remote' ? ' · 远程已同步' : ''}`, 'success');
    });
  });
}

loadLibrary()
  .then(render)
  .catch((error) => {
    setStatus(error.message, 'error');
    render();
  });
