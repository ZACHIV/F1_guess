import { TURN1_RATIO_PRESETS } from '../lib/turn1-crop-utils.js';
import { escapeHtml, roundCropValue } from './utils.js';

export function renderTrackPreview({ state, setDraftTurn1Crop }) {
  if (!state.draft.trackSvgSrc) {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>赛道图预览</strong>
          <span>未匹配</span>
        </div>
        <div class="result-empty result-empty--wide">还没有导入赛道 SVG。点击“添加地图”后会在这里显示匹配结果。</div>
      </section>
    `;
  }

  if (state.cropAsset.svgSrc !== state.draft.trackSvgSrc || state.cropAsset.status === 'loading') {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>赛道图预览</strong>
          <span>加载中</span>
        </div>
        <div class="result-empty result-empty--wide">正在准备赛道 SVG 与 Turn 1 裁剪工作台...</div>
      </section>
    `;
  }

  if (state.cropAsset.status === 'error') {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>赛道图预览</strong>
          <span>加载失败</span>
        </div>
        <div class="result-empty result-empty--wide">${escapeHtml(state.cropAsset.error || '赛道 SVG 无法加载。')}</div>
      </section>
    `;
  }

  const crop = setDraftTurn1Crop(state.cropAsset.bounds);
  const handlePositions = {
    nw: { x: crop.x, y: crop.y },
    ne: { x: crop.x + crop.width, y: crop.y },
    sw: { x: crop.x, y: crop.y + crop.height },
    se: { x: crop.x + crop.width, y: crop.y + crop.height }
  };
  const bounds = state.cropAsset.bounds;

  return `
    <section class="result-section">
      <div class="result-section__header">
        <strong>赛道图预览</strong>
        <span>已匹配</span>
      </div>
      <div class="track-preview-card">
        <div class="track-preview-card__media">
          <svg
            class="track-preview-card__svg"
            viewBox="${escapeHtml(state.cropAsset.viewBox)}"
            id="turn1-crop-editor"
            aria-label="Turn 1 裁剪工作台"
          >
            <g class="track-preview-card__track">
              ${state.cropAsset.markup}
            </g>
            <g class="turn1-crop-editor__mask">
              <rect id="turn1-mask-top" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${Math.max(crop.y - bounds.y, 0)}"></rect>
              <rect id="turn1-mask-left" x="${bounds.x}" y="${crop.y}" width="${Math.max(crop.x - bounds.x, 0)}" height="${crop.height}"></rect>
              <rect id="turn1-mask-right" x="${crop.x + crop.width}" y="${crop.y}" width="${Math.max(bounds.x + bounds.width - (crop.x + crop.width), 0)}" height="${crop.height}"></rect>
              <rect id="turn1-mask-bottom" x="${bounds.x}" y="${crop.y + crop.height}" width="${bounds.width}" height="${Math.max(bounds.y + bounds.height - (crop.y + crop.height), 0)}"></rect>
            </g>
            <g class="turn1-crop-editor__frame">
              <rect
                id="turn1-crop-rect"
                x="${crop.x}"
                y="${crop.y}"
                width="${crop.width}"
                height="${crop.height}"
                rx="${Math.min(crop.width, crop.height) * 0.04}"
                ry="${Math.min(crop.width, crop.height) * 0.04}"
              ></rect>
              <rect
                id="turn1-crop-drag-surface"
                data-crop-drag="move"
                x="${crop.x}"
                y="${crop.y}"
                width="${crop.width}"
                height="${crop.height}"
              ></rect>
              ${Object.entries(handlePositions).map(([handle, position]) => `
                <circle
                  class="turn1-crop-editor__handle"
                  data-crop-handle="${handle}"
                  cx="${position.x}"
                  cy="${position.y}"
                  r="${Math.max(Math.min(crop.width, crop.height) * 0.028, 8)}"
                ></circle>
              `).join('')}
            </g>
          </svg>
        </div>
        <div class="track-preview-card__meta">
          <strong>${escapeHtml(state.draft.trackName || state.form.trackQuery || '本地赛道图')}</strong>
          <span>${escapeHtml(state.draft.trackVectorSource || 'F1DB white-outline 赛道 SVG')}</span>
          <code>${escapeHtml(state.draft.trackSvgSrc)}</code>
        </div>
      </div>
    </section>
  `;
}

export function renderTurn1CropSection({ state, setDraftTurn1Crop }) {
  if (!state.draft.trackSvgSrc) {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>Turn 1 裁剪</strong>
          <span>等待赛道图</span>
        </div>
        <div class="result-empty result-empty--wide">先导入赛道 SVG，裁剪工具才会显示。</div>
      </section>
    `;
  }

  if (state.cropAsset.svgSrc !== state.draft.trackSvgSrc || state.cropAsset.status === 'loading') {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>Turn 1 裁剪</strong>
          <span>准备中</span>
        </div>
        <div class="result-empty result-empty--wide">正在加载 SVG 资源并准备裁剪框。</div>
      </section>
    `;
  }

  if (state.cropAsset.status === 'error') {
    return `
      <section class="result-section">
        <div class="result-section__header">
          <strong>Turn 1 裁剪</strong>
          <span>不可用</span>
        </div>
        <div class="result-empty result-empty--wide">${escapeHtml(state.cropAsset.error || '无法初始化 Turn 1 裁剪工具。')}</div>
      </section>
    `;
  }

  const crop = setDraftTurn1Crop(state.cropAsset.bounds);

  return `
    <section class="result-section">
      <div class="result-section__header">
        <strong>Turn 1 裁剪</strong>
        <span>固定比例工作台</span>
      </div>
      <div class="turn1-crop-shell">
        <div class="turn1-crop-toolbar">
          <div class="turn1-crop-toolbar__group">
            <span class="turn1-crop-toolbar__label">比例预设</span>
            <div class="turn1-crop-toolbar__buttons">
              ${TURN1_RATIO_PRESETS.map((preset) => `
                <button
                  class="mini-chip turn1-ratio-btn ${crop.aspectRatio === preset.id ? 'is-active' : ''}"
                  type="button"
                  data-turn1-ratio="${preset.id}"
                >${preset.label}</button>
              `).join('')}
            </div>
          </div>
          <div class="turn1-crop-toolbar__group">
            <span class="turn1-crop-toolbar__label">微调</span>
            <div class="turn1-crop-toolbar__buttons">
              <button class="ghost-btn" type="button" id="turn1-autodetect-btn" ${state.busy ? 'disabled' : ''}>自动识别</button>
              <button class="ghost-btn" type="button" data-turn1-nudge="left" ${state.busy ? 'disabled' : ''}>←</button>
              <button class="ghost-btn" type="button" data-turn1-nudge="up" ${state.busy ? 'disabled' : ''}>↑</button>
              <button class="ghost-btn" type="button" data-turn1-nudge="down" ${state.busy ? 'disabled' : ''}>↓</button>
              <button class="ghost-btn" type="button" data-turn1-nudge="right" ${state.busy ? 'disabled' : ''}>→</button>
              <button class="ghost-btn" type="button" data-turn1-scale="down" ${state.busy ? 'disabled' : ''}>-</button>
              <button class="ghost-btn" type="button" data-turn1-scale="up" ${state.busy ? 'disabled' : ''}>+</button>
              <button class="ghost-btn" type="button" id="turn1-reset-btn" ${state.busy ? 'disabled' : ''}>重置</button>
              <button class="primary turn1-save-btn" type="button" id="turn1-save-btn" ${state.busy ? 'disabled' : ''}>保存 Turn 1 裁剪</button>
            </div>
          </div>
        </div>

        <div class="turn1-crop-grid">
          <div class="turn1-crop-panel">
            <label class="field field--full">
              <span>一号弯名称</span>
              <input id="draft-turn1-corner-name" value="${escapeHtml(state.draft.turn1CornerName || '')}" placeholder="Sainte Devote / Abbey / Senna S Turn 1" />
            </label>

            <div class="turn1-crop-stats">
              <div class="turn1-crop-stat"><span>比例</span><strong data-turn1-stat="ratio">${escapeHtml(crop.aspectRatio)}</strong></div>
              <div class="turn1-crop-stat"><span>X</span><strong data-turn1-stat="x">${roundCropValue(crop.x)}</strong></div>
              <div class="turn1-crop-stat"><span>Y</span><strong data-turn1-stat="y">${roundCropValue(crop.y)}</strong></div>
              <div class="turn1-crop-stat"><span>宽</span><strong data-turn1-stat="width">${roundCropValue(crop.width)}</strong></div>
              <div class="turn1-crop-stat"><span>高</span><strong data-turn1-stat="height">${roundCropValue(crop.height)}</strong></div>
            </div>

            <div class="inline-note">
              系统会先自动给出一号弯候选裁切框。拖动框体可平移，拖四个角可在固定比例下缩放。右侧预览是最终题面；点击“保存 Turn 1 裁剪”后才会持久化到题库。
            </div>
          </div>

          <div class="turn1-crop-preview-card">
            <div class="turn1-crop-preview-card__header">
              <strong>裁剪结果</strong>
              <span>实时预览</span>
            </div>
            <div class="turn1-crop-preview-card__viewport">
              <svg
                class="turn1-crop-preview-card__svg"
                id="turn1-crop-preview-svg"
                viewBox="${roundCropValue(crop.x)} ${roundCropValue(crop.y)} ${roundCropValue(crop.width)} ${roundCropValue(crop.height)}"
                preserveAspectRatio="xMidYMid meet"
              >
                <g>${state.cropAsset.markup}</g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function renderStudioApp({
  state,
  filteredChallenges,
  lapStats,
  trackPreviewHtml,
  turn1CropHtml
}) {
  return `
    <main class="studio-shell">
      <header class="studio-header">
        <div>
          <p class="eyebrow">内容后台</p>
          <h1>F1 Guess 开发者模式</h1>
          <p class="studio-subtitle">从网址提整段音频，到赛道 SVG、OpenF1 遥测数据、题目保存，全部集中在这里。</p>
        </div>
        <div class="studio-header__actions">
          <button class="primary" type="button" id="save-btn" ${state.busy ? 'disabled' : ''}>保存题目</button>
          <button class="secondary" type="button" id="duplicate-btn" ${!state.draft.id || state.busy ? 'disabled' : ''}>复制题目</button>
          <button class="danger" type="button" id="delete-btn" ${!state.draft.id || state.busy ? 'disabled' : ''}>删除题目</button>
          <a class="studio-link" href="/" target="_blank" rel="noreferrer">打开前台预览</a>
        </div>
      </header>

      <section class="studio-layout">
        <aside class="library-panel">
          <div class="panel-title-row">
            <div>
              <p class="eyebrow">题库</p>
              <h2>本地题库</h2>
            </div>
            <button class="secondary" type="button" id="new-btn" ${state.busy ? 'disabled' : ''}>新建题目</button>
          </div>
          <div class="library-stats">
            <div class="library-stat"><strong>${state.librarySummary.total}</strong><span>总题目</span></div>
            <div class="library-stat"><strong>${state.librarySummary.categories.length}</strong><span>分类</span></div>
            <div class="library-stat"><strong>${state.librarySummary.statuses.length}</strong><span>状态</span></div>
          </div>
          <div class="form-grid library-filters">
            <label class="field field--full">
              <span>搜索</span>
              <input id="library-search" value="${escapeHtml(state.form.librarySearch)}" placeholder="标题 / 赛道 / 车手 / 标签" />
            </label>
            <label class="field">
              <span>分类筛选</span>
              <select id="category-filter">
                <option value="all" ${state.form.categoryFilter === 'all' ? 'selected' : ''}>全部分类</option>
                ${state.librarySummary.categories
                  .map((category) => `<option value="${escapeHtml(category)}" ${state.form.categoryFilter === category ? 'selected' : ''}>${escapeHtml(category)}</option>`)
                  .join('')}
              </select>
            </label>
            <label class="field">
              <span>状态筛选</span>
              <select id="status-filter">
                <option value="all" ${state.form.statusFilter === 'all' ? 'selected' : ''}>全部状态</option>
                ${state.librarySummary.statuses
                  .map((status) => `<option value="${escapeHtml(status)}" ${state.form.statusFilter === status ? 'selected' : ''}>${escapeHtml(status)}</option>`)
                  .join('')}
              </select>
            </label>
            <label class="field field--full">
              <span>排序方式</span>
              <select id="library-sort">
                <option value="manual" ${state.form.librarySort === 'manual' ? 'selected' : ''}>手动排序</option>
                <option value="updated-desc" ${state.form.librarySort === 'updated-desc' ? 'selected' : ''}>最近更新优先</option>
                <option value="created-desc" ${state.form.librarySort === 'created-desc' ? 'selected' : ''}>最近创建优先</option>
                <option value="title-asc" ${state.form.librarySort === 'title-asc' ? 'selected' : ''}>标题 A-Z</option>
                <option value="category-asc" ${state.form.librarySort === 'category-asc' ? 'selected' : ''}>分类 A-Z</option>
              </select>
            </label>
          </div>
          <div class="library-list">
            ${filteredChallenges.length
              ? filteredChallenges
                  .map(
                    (challenge) => `
                      <article class="library-item ${challenge.id === state.selectedId ? 'is-active' : ''}">
                        <button class="library-item__main" type="button" data-select-id="${challenge.id}">
                          <strong>${escapeHtml(challenge.title || challenge.id)}</strong>
                          <span>${escapeHtml(challenge.trackName || '未命名赛道')} · ${escapeHtml(challenge.driverName || '未知车手')}</span>
                          <div class="library-item__meta">
                            <span class="mini-chip">${escapeHtml(challenge.category || 'Uncategorized')}</span>
                            <span class="mini-chip is-status">${escapeHtml(challenge.status || 'draft')}</span>
                          </div>
                        </button>
                        <div class="library-item__actions">
                          <button class="ghost-btn" type="button" data-duplicate-id="${challenge.id}" ${state.busy ? 'disabled' : ''}>复制</button>
                          <button class="ghost-btn" type="button" data-move-id="${challenge.id}" data-direction="up" ${state.busy || state.form.librarySort !== 'manual' ? 'disabled' : ''}>上移</button>
                          <button class="ghost-btn" type="button" data-move-id="${challenge.id}" data-direction="down" ${state.busy || state.form.librarySort !== 'manual' ? 'disabled' : ''}>下移</button>
                        </div>
                      </article>
                    `
                  )
                  .join('')
              : '<div class="result-empty">当前筛选条件下没有题目</div>'}
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
            <h2>大模型校对与基础字段</h2>
            <div class="form-grid">
              <label class="field field--full">
                <span>提示词</span>
                <textarea id="ai-prompt" class="prompt-textarea" placeholder="点击下方按钮自动生成给大模型的提示词">${escapeHtml(state.form.aiPrompt)}</textarea>
              </label>
              <label class="field field--full">
                <span>大模型返回结果</span>
                <textarea id="ai-response" class="prompt-textarea" placeholder='把大模型返回的 JSON 直接粘贴到这里'>${escapeHtml(state.form.aiResponse)}</textarea>
              </label>
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
              <label class="field">
                <span>年份</span>
                <input id="year" value="${escapeHtml(state.form.year)}" />
              </label>
              <label class="field">
                <span>场次名称</span>
                <input id="session-name" value="${escapeHtml(state.form.sessionName)}" />
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
                <span>场次 Key</span>
                <input id="session-key" value="${escapeHtml(state.form.sessionKey)}" placeholder="9951" />
              </label>
              <label class="field">
                <span>圈数</span>
                <input id="lap-number" value="${escapeHtml(state.form.lapNumber)}" placeholder="${lapStats.fastestLap ? `默认最快圈 ${lapStats.fastestLap.lap_number}` : '留空则自动选最快圈'}" ${lapStats.maxLapNumber ? `max="${escapeHtml(lapStats.maxLapNumber)}"` : ''} />
              </label>
              <label class="field field--full">
                <span>圈速策略</span>
                <div class="inline-note">
                  ${lapStats.fastestLap
                    ? `当前已识别有效圈 ${state.laps.length} 条，最快圈为第 ${escapeHtml(lapStats.fastestLap.lap_number)} 圈 (${escapeHtml(lapStats.fastestLap.lap_duration)} 秒)，可手动改到 1-${escapeHtml(lapStats.maxLapNumber)}。`
                    : '若圈数留空，导入遥测时会自动查询该车手所有有效圈并默认选择最快单圈。'}
                </div>
              </label>
            </div>
            <div class="actions">
              <button class="secondary" type="button" id="track-btn" ${state.busy ? 'disabled' : ''}>添加地图</button>
              <button class="primary" type="button" id="telemetry-btn" ${state.busy ? 'disabled' : ''}>导入遥测数据</button>
            </div>
            <div class="result-stack">
              ${trackPreviewHtml}
              ${turn1CropHtml}
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
}
