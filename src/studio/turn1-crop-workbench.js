import {
  buildTurn1CropFromSvgNode,
  buildDefaultTurn1Crop,
  moveTurn1Crop,
  nudgeTurn1Crop,
  resizeTurn1Crop,
  scaleTurn1Crop,
  withTurn1AspectRatio
} from '../lib/turn1-crop-utils.js';
import { roundCropValue } from './utils.js';

function buildAutoDetectedTurn1Crop(markup, viewBox, ratioId = '4:3') {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`, 'image/svg+xml');
  const svgNode = svgDoc.documentElement;
  return buildTurn1CropFromSvgNode(svgNode, ratioId);
}

export async function loadTrackSvgMarkup({
  svgSrc,
  state,
  render,
  createTurn1CropAssetState,
  setDraftTurn1Crop
}) {
  const previousSvgSrc = state.cropAsset.svgSrc;
  state.cropAsset = {
    ...createTurn1CropAssetState(),
    svgSrc,
    status: 'loading'
  };
  render();

  try {
    const response = await fetch(svgSrc);
    if (!response.ok) {
      throw new Error(`赛道 SVG 加载失败：${response.status}`);
    }

    const source = await response.text();
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(source, 'image/svg+xml');
    const svgNode = documentNode.documentElement;

    if (!svgNode || svgNode.nodeName.toLowerCase() !== 'svg') {
      throw new Error('赛道 SVG 结构无法识别。');
    }

    const width = Number.parseFloat(svgNode.getAttribute('width') || '500');
    const height = Number.parseFloat(svgNode.getAttribute('height') || '500');
    const viewBox = svgNode.getAttribute('viewBox') || `0 0 ${width} ${height}`;
    const bounds = buildViewBoxBounds(viewBox);
    const markup = Array.from(svgNode.childNodes)
      .map((node) => new XMLSerializer().serializeToString(node))
      .join('');

    state.cropAsset = {
      svgSrc,
      status: 'ready',
      viewBox,
      bounds,
      markup,
      error: ''
    };
    if (state.draft.turn1Crop && previousSvgSrc === svgSrc) {
      setDraftTurn1Crop(bounds);
    } else {
      try {
        state.draft.turn1Crop = buildAutoDetectedTurn1Crop(markup, viewBox, state.draft.turn1Crop?.aspectRatio || '4:3');
      } catch {
        state.draft.turn1Crop = buildDefaultTurn1Crop(bounds, state.draft.turn1Crop?.aspectRatio || '4:3');
      }
    }
  } catch (error) {
    state.cropAsset = {
      ...createTurn1CropAssetState(),
      svgSrc,
      status: 'error',
      error: error.message || '赛道 SVG 加载失败。'
    };
    state.draft.turn1Crop = buildDefaultTurn1Crop(
      state.cropAsset.bounds,
      state.draft.turn1Crop?.aspectRatio || '4:3'
    );
  }

  render();
}

function syncDraftJsonPreview(draft) {
  const preview = document.querySelector('.preview-json');
  if (preview) {
    preview.value = JSON.stringify(draft, null, 2);
  }
}

function applyTurn1CropDom({
  crop,
  bounds,
  draft,
  setDraftTurn1Crop
}) {
  const nextCrop = setDraftTurn1Crop(bounds, crop);
  const maskTop = document.querySelector('#turn1-mask-top');
  const maskLeft = document.querySelector('#turn1-mask-left');
  const maskRight = document.querySelector('#turn1-mask-right');
  const maskBottom = document.querySelector('#turn1-mask-bottom');
  const frame = document.querySelector('#turn1-crop-rect');
  const dragSurface = document.querySelector('#turn1-crop-drag-surface');
  const previewSvg = document.querySelector('#turn1-crop-preview-svg');

  if (maskTop) {
    maskTop.setAttribute('x', String(bounds.x));
    maskTop.setAttribute('y', String(bounds.y));
    maskTop.setAttribute('width', String(bounds.width));
    maskTop.setAttribute('height', String(Math.max(nextCrop.y - bounds.y, 0)));
  }

  if (maskLeft) {
    maskLeft.setAttribute('x', String(bounds.x));
    maskLeft.setAttribute('y', String(nextCrop.y));
    maskLeft.setAttribute('width', String(Math.max(nextCrop.x - bounds.x, 0)));
    maskLeft.setAttribute('height', String(nextCrop.height));
  }

  if (maskRight) {
    maskRight.setAttribute('x', String(nextCrop.x + nextCrop.width));
    maskRight.setAttribute('y', String(nextCrop.y));
    maskRight.setAttribute('width', String(Math.max(bounds.x + bounds.width - (nextCrop.x + nextCrop.width), 0)));
    maskRight.setAttribute('height', String(nextCrop.height));
  }

  if (maskBottom) {
    maskBottom.setAttribute('x', String(bounds.x));
    maskBottom.setAttribute('y', String(nextCrop.y + nextCrop.height));
    maskBottom.setAttribute('width', String(bounds.width));
    maskBottom.setAttribute('height', String(Math.max(bounds.y + bounds.height - (nextCrop.y + nextCrop.height), 0)));
  }

  if (frame) {
    frame.setAttribute('x', String(nextCrop.x));
    frame.setAttribute('y', String(nextCrop.y));
    frame.setAttribute('width', String(nextCrop.width));
    frame.setAttribute('height', String(nextCrop.height));
    frame.setAttribute('rx', String(Math.min(nextCrop.width, nextCrop.height) * 0.04));
    frame.setAttribute('ry', String(Math.min(nextCrop.width, nextCrop.height) * 0.04));
  }

  if (dragSurface) {
    dragSurface.setAttribute('x', String(nextCrop.x));
    dragSurface.setAttribute('y', String(nextCrop.y));
    dragSurface.setAttribute('width', String(nextCrop.width));
    dragSurface.setAttribute('height', String(nextCrop.height));
  }

  document.querySelectorAll('[data-crop-handle]').forEach((handle) => {
    const key = handle.getAttribute('data-crop-handle');
    const x = key === 'ne' || key === 'se' ? nextCrop.x + nextCrop.width : nextCrop.x;
    const y = key === 'sw' || key === 'se' ? nextCrop.y + nextCrop.height : nextCrop.y;
    handle.setAttribute('cx', String(x));
    handle.setAttribute('cy', String(y));
    handle.setAttribute('r', String(Math.max(Math.min(nextCrop.width, nextCrop.height) * 0.028, 8)));
  });

  if (previewSvg) {
    previewSvg.setAttribute('viewBox', `${roundCropValue(nextCrop.x)} ${roundCropValue(nextCrop.y)} ${roundCropValue(nextCrop.width)} ${roundCropValue(nextCrop.height)}`);
  }

  document.querySelector('[data-turn1-stat="ratio"]')?.replaceChildren(document.createTextNode(nextCrop.aspectRatio));
  document.querySelector('[data-turn1-stat="x"]')?.replaceChildren(document.createTextNode(roundCropValue(nextCrop.x)));
  document.querySelector('[data-turn1-stat="y"]')?.replaceChildren(document.createTextNode(roundCropValue(nextCrop.y)));
  document.querySelector('[data-turn1-stat="width"]')?.replaceChildren(document.createTextNode(roundCropValue(nextCrop.width)));
  document.querySelector('[data-turn1-stat="height"]')?.replaceChildren(document.createTextNode(roundCropValue(nextCrop.height)));

  syncDraftJsonPreview(draft);
}

function getSvgPointer(svg, event) {
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    return { x: 0, y: 0 };
  }

  const point = new DOMPoint(event.clientX, event.clientY);
  const localPoint = point.matrixTransform(matrix.inverse());
  return {
    x: localPoint.x,
    y: localPoint.y
  };
}

export function bindTurn1CropEditor({
  state,
  render,
  createTurn1CropAssetState,
  setDraftTurn1Crop,
  onSaveCrop
}) {
  if (!state.draft.trackSvgSrc) {
    state.cropAsset = createTurn1CropAssetState();
    return;
  }

  if (state.cropAsset.svgSrc !== state.draft.trackSvgSrc) {
    if (state.cropAsset.status !== 'loading') {
      loadTrackSvgMarkup({
        svgSrc: state.draft.trackSvgSrc,
        state,
        render,
        createTurn1CropAssetState,
        setDraftTurn1Crop
      });
    }
    return;
  }

  if (state.cropAsset.status !== 'ready') {
    return;
  }

  const svg = document.querySelector('#turn1-crop-editor');
  if (!svg) {
    return;
  }

  applyTurn1CropDom({
    crop: state.draft.turn1Crop,
    bounds: state.cropAsset.bounds,
    draft: state.draft,
    setDraftTurn1Crop
  });

  document.querySelectorAll('[data-turn1-ratio]').forEach((button) => {
    button.addEventListener('click', () => {
      state.draft.turn1Crop = withTurn1AspectRatio(
        state.draft.turn1Crop,
        button.getAttribute('data-turn1-ratio'),
        state.cropAsset.bounds
      );
      render();
    });
  });

  document.querySelectorAll('[data-turn1-nudge]').forEach((button) => {
    button.addEventListener('click', () => {
      state.draft.turn1Crop = nudgeTurn1Crop(
        state.draft.turn1Crop,
        button.getAttribute('data-turn1-nudge'),
        state.cropAsset.bounds
      );
      render();
    });
  });

  document.querySelectorAll('[data-turn1-scale]').forEach((button) => {
    button.addEventListener('click', () => {
      state.draft.turn1Crop = scaleTurn1Crop(
        state.draft.turn1Crop,
        button.getAttribute('data-turn1-scale') === 'up' ? 1.08 : 0.92,
        state.cropAsset.bounds
      );
      render();
    });
  });

  document.querySelector('#turn1-reset-btn')?.addEventListener('click', () => {
    state.draft.turn1Crop = buildDefaultTurn1Crop(state.cropAsset.bounds, state.draft.turn1Crop?.aspectRatio);
    render();
  });

  document.querySelector('#turn1-autodetect-btn')?.addEventListener('click', () => {
    state.draft.turn1Crop = buildAutoDetectedTurn1Crop(
      state.cropAsset.markup,
      state.cropAsset.viewBox,
      state.draft.turn1Crop?.aspectRatio || '4:3'
    );
    render();
  });

  document.querySelector('#turn1-save-btn')?.addEventListener('click', () => {
    onSaveCrop?.();
  });

  const startPointerInteraction = (event, interaction) => {
    event.preventDefault();
    event.stopPropagation();

    const startPointer = getSvgPointer(svg, event);
    const startCrop = setDraftTurn1Crop(state.cropAsset.bounds);
    state.cropInteraction = {
      pointerId: event.pointerId,
      type: interaction.type,
      handle: interaction.handle || '',
      startPointer,
      startCrop
    };

    svg.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent) => {
      if (!state.cropInteraction || moveEvent.pointerId !== state.cropInteraction.pointerId) {
        return;
      }

      const pointer = getSvgPointer(svg, moveEvent);
      const deltaX = pointer.x - state.cropInteraction.startPointer.x;
      const deltaY = pointer.y - state.cropInteraction.startPointer.y;
      const nextCrop = state.cropInteraction.type === 'move'
        ? moveTurn1Crop(state.cropInteraction.startCrop, deltaX, deltaY, state.cropAsset.bounds)
        : resizeTurn1Crop(state.cropInteraction.startCrop, state.cropInteraction.handle, pointer, state.cropAsset.bounds);

      applyTurn1CropDom({
        crop: nextCrop,
        bounds: state.cropAsset.bounds,
        draft: state.draft,
        setDraftTurn1Crop
      });
    };

    const finishInteraction = (finishEvent) => {
      if (!state.cropInteraction || finishEvent.pointerId !== state.cropInteraction.pointerId) {
        return;
      }

      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', finishInteraction);
      svg.removeEventListener('pointercancel', finishInteraction);
      svg.releasePointerCapture(finishEvent.pointerId);
      state.cropInteraction = null;
    };

    svg.addEventListener('pointermove', onPointerMove);
    svg.addEventListener('pointerup', finishInteraction);
    svg.addEventListener('pointercancel', finishInteraction);
  };

  document.querySelector('#turn1-crop-drag-surface')?.addEventListener('pointerdown', (event) => {
    startPointerInteraction(event, { type: 'move' });
  });

  document.querySelectorAll('[data-crop-handle]').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      startPointerInteraction(event, {
        type: 'resize',
        handle: handle.getAttribute('data-crop-handle')
      });
    });
  });
}
