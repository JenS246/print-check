import { PLAYABLE_PIECES } from '../data/notes.js?v=22';
import { markerHitsRegions, shuffle } from './rounds.js?v=22';

const $ = (selector) => document.querySelector(selector);
const imageFrame = $('#image-frame');
const imageCanvas = $('#image-canvas');
const sideImages = $('#game-side-images');
const feedback = $('#feedback');
const answerPanel = $('#answer-panel');
const playActions = $('.play-actions');
const titleCoin = $('.title-coin');

const state = {
  queue: [],
  current: null,
  lastPieceId: null,
  marker: null,
  solved: false,
  imageReady: false,
  loadToken: 0,
  sideNodes: new Map(),
};

function identification(piece) {
  const name = piece.pieceKind === 'coin' ? piece.noteType : `${piece.denomination} ${piece.noteType}`;
  return piece.series ? `${name}, ${piece.series}` : name;
}

function refillQueue() {
  state.queue = shuffle(PLAYABLE_PIECES);
  if (state.queue.length > 1 && state.queue[0].id === state.lastPieceId) {
    [state.queue[0], state.queue[1]] = [state.queue[1], state.queue[0]];
  }
}

function flipTitleCoin() {
  if (!titleCoin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  titleCoin.classList.remove('is-flipping');
  requestAnimationFrame(() => titleCoin.classList.add('is-flipping'));
}

titleCoin?.addEventListener('animationend', () => titleCoin.classList.remove('is-flipping'));

function setFeedback(message = '', tone = '') {
  feedback.textContent = message;
  feedback.hidden = !message;
  if (tone) feedback.dataset.tone = tone;
  else feedback.removeAttribute('data-tone');
}

function resetPieceState() {
  state.marker = null;
  state.solved = false;
  state.imageReady = false;
  state.sideNodes.clear();
  sideImages.replaceChildren();
  answerPanel.hidden = true;
  setFeedback();
  $('#reveal-button').disabled = true;
}

function cropFor(side) {
  return side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
}

function displayedSideIndexes() {
  return state.current.showSidesTogether
    ? state.current.sides.map((_, index) => index)
    : [state.current.answerSide];
}

function prepareImageFrame() {
  const sides = displayedSideIndexes().map((index) => state.current.sides[index]);
  const ratios = sides.map((side) => {
    const crop = cropFor(side);
    return crop.width / crop.height;
  });
  const stackSides = state.current.stackOnNarrow && window.matchMedia('(max-width: 760px)').matches;
  const combinedRatio = stackSides
    ? 1 / ratios.reduce((sum, ratio) => sum + (1 / ratio), 0)
    : ratios.reduce((sum, ratio) => sum + ratio, 0);
  const widthCap = sides.reduce((sum, side) => sum + (side.maxDisplayWidth ?? Infinity), 0);
  const availableWidth = Math.min($('#game-screen').clientWidth, 1050);
  const viewportHeight = window.visualViewport?.height ?? document.documentElement.clientHeight;
  const frameTop = imageFrame.getBoundingClientRect().top;
  const answerReserve = window.matchMedia('(max-width: 760px)').matches ? 132 : 122;
  const reserveBelow = answerReserve + playActions.offsetHeight + 20;
  const isNarrow = window.matchMedia('(max-width: 760px)').matches;
  const minimumHeight = stackSides ? 430 : (isNarrow ? 230 : 290);
  const maximumHeight = stackSides ? 520 : (isNarrow ? 360 : 460);
  const stageHeight = Math.max(minimumHeight, Math.min(viewportHeight - frameTop - reserveBelow, maximumHeight));
  const innerWidth = Math.max(140, availableWidth - 18);
  const innerHeight = Math.max(140, stageHeight - 18);
  const fitWidth = Math.min(innerWidth, widthCap, innerHeight * combinedRatio);
  const fitHeight = fitWidth / combinedRatio;

  imageFrame.style.width = `${availableWidth}px`;
  imageFrame.style.height = `${stageHeight}px`;
  imageCanvas.style.width = `${fitWidth}px`;
  imageCanvas.style.height = `${fitHeight}px`;
  imageCanvas.style.aspectRatio = `${combinedRatio} / 1`;
  sideImages.classList.toggle('game-side-images-stack', stackSides);
  sideImages.style.gridTemplateColumns = stackSides ? '1fr' : ratios.map((ratio) => `${ratio}fr`).join(' ');
  sideImages.style.gridTemplateRows = stackSides ? ratios.map((ratio) => `${1 / ratio}fr`).join(' ') : '1fr';
}

function buildSide(side, sideIndex) {
  const crop = cropFor(side);
  const wrapper = document.createElement('div');
  wrapper.className = 'game-side';
  wrapper.dataset.side = `${sideIndex}`;
  wrapper.style.aspectRatio = `${crop.width} / ${crop.height}`;

  const image = document.createElement('img');
  image.alt = `${side.label} view of a genuine ${identification(state.current)}. Error details are hidden until the answer is shown.`;
  image.draggable = false;
  image.style.width = `${(side.width / crop.width) * 100}%`;
  image.style.left = `${-(crop.x / crop.width) * 100}%`;
  image.style.top = `${-(crop.y / crop.height) * 100}%`;

  const marker = document.createElement('span');
  marker.className = 'guess-marker';
  marker.hidden = true;
  marker.setAttribute('aria-hidden', 'true');

  const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  overlay.classList.add('answer-overlay');
  overlay.setAttribute('viewBox', '0 0 100 100');
  overlay.setAttribute('preserveAspectRatio', 'none');
  overlay.setAttribute('aria-hidden', 'true');

  wrapper.append(image, marker, overlay);
  state.sideNodes.set(sideIndex, { wrapper, image, marker, overlay });
  return wrapper;
}

function loadImage() {
  const loadToken = ++state.loadToken;
  const piece = state.current;
  state.imageReady = false;
  $('#loading-message').hidden = false;
  $('#image-error').hidden = true;
  imageCanvas.hidden = true;
  const sideIndexes = displayedSideIndexes();
  sideImages.classList.toggle('game-side-images-pair', sideIndexes.length > 1);
  sideImages.replaceChildren(...sideIndexes.map((index) => buildSide(state.current.sides[index], index)));
  prepareImageFrame();
  let loaded = 0;
  let failed = false;
  state.sideNodes.forEach(({ image }, sideIndex) => {
    image.onload = () => {
      if (loadToken !== state.loadToken) return;
      loaded += 1;
      if (!failed && loaded === sideIndexes.length) {
        $('#loading-message').hidden = true;
        imageCanvas.hidden = false;
        state.imageReady = true;
        $('#reveal-button').disabled = false;
      }
    };
    image.onerror = () => {
      if (loadToken !== state.loadToken) return;
      failed = true;
      $('#loading-message').hidden = true;
      $('#image-error').hidden = false;
      state.imageReady = false;
    };
    image.src = piece.sides[sideIndex].image;
  });
}

function preloadNextPiece() {
  const next = state.queue[0];
  if (!next) return;
  next.sides.forEach((side) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = side.image;
  });
}

function nextPiece() {
  if (!state.queue.length) refillQueue();
  state.current = state.queue.shift();
  state.lastPieceId = state.current.id;
  resetPieceState();
  populateAnswerContent(false);
  loadImage();
  const schedule = window.requestIdleCallback ?? ((callback) => setTimeout(callback, 0));
  schedule(preloadNextPiece);
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderMarker() {
  state.sideNodes.forEach(({ marker }) => { marker.hidden = true; });
  if (!state.marker) return;
  const marker = state.sideNodes.get(state.marker.side)?.marker;
  if (!marker) return;
  marker.style.left = `${state.marker.x}%`;
  marker.style.top = `${state.marker.y}%`;
  marker.hidden = false;
}

function placeAndJudge(x, y, side = state.current.answerSide) {
  if (state.solved || !state.imageReady) return;
  state.marker = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    side,
  };
  renderMarker();

  if (markerHitsRegions(state.marker, state.current.answerSide, state.current.regions)) {
    showAnswer(true);
  } else {
    setFeedback('Try another spot', 'wrong');
  }
}

function drawAnswerRegions() {
  state.sideNodes.forEach(({ overlay }) => overlay.replaceChildren());
  (state.current.outlines ?? state.current.regions).forEach((region) => {
    const overlay = state.sideNodes.get(region.side ?? state.current.answerSide)?.overlay;
    if (!overlay) return;
    let outline;
    if (region.type === 'path') {
      outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      outline.setAttribute('d', region.d);
    } else if (region.type === 'ellipse') {
      outline = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      outline.setAttribute('cx', region.x + region.width / 2);
      outline.setAttribute('cy', region.y + region.height / 2);
      outline.setAttribute('rx', region.width / 2);
      outline.setAttribute('ry', region.height / 2);
    } else {
      outline = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      outline.setAttribute('x', region.x);
      outline.setAttribute('y', region.y);
      outline.setAttribute('width', region.width);
      outline.setAttribute('height', region.height);
      outline.setAttribute('rx', region.radius ?? 2);
    }
    outline.classList.add('answer-region');
    overlay.append(outline);
  });
}

function populateAnswerContent(includeSuccess) {
  $('#answer-success').hidden = !includeSuccess;
  $('#answer-title').textContent = state.current.errorName;
  $('#answer-explanation').textContent = state.current.answerExplanation;
  $('#answer-process').textContent = state.current.errorProcess;
  $('#answer-identification').textContent = identification(state.current);
  $('#answer-credit').textContent = state.current.imageCredit;
  renderAnswerCloseup();
  const recordLinks = $('#record-links');
  recordLinks.replaceChildren();
  const links = [
    ['Photograph: ', state.current.sourceUrl, state.current.sourceLabel ?? 'Photograph and specimen record'],
    ['Documentation: ', state.current.documentationUrl, state.current.documentationLabel],
    ['Background: ', state.current.supportingUrl, state.current.supportingLabel],
    ['License: ', state.current.rights.url, state.current.rights.label],
  ].filter(([, url, label]) => url && label);
  links.forEach(([prefix, url, label], index) => {
    const row = document.createElement('span');
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.textContent = label;
    row.append(prefix, link);
    recordLinks.append(row);
    if (index < links.length - 1) recordLinks.append(document.createElement('br'));
  });
  $('#rights-detail').textContent = state.current.rights.detail;
}

function renderAnswerCloseup() {
  const figure = $('#answer-closeup');
  const viewport = $('#answer-closeup-crop');
  const caption = $('#answer-closeup-caption');
  const closeup = state.current.revealCrop;
  viewport.replaceChildren();
  figure.hidden = !closeup;
  if (!closeup) return;

  const side = state.current.sides[closeup.side ?? state.current.answerSide];
  const baseCrop = cropFor(side);
  const sourceCrop = {
    x: baseCrop.x + baseCrop.width * (closeup.x / 100),
    y: baseCrop.y + baseCrop.height * (closeup.y / 100),
    width: baseCrop.width * (closeup.width / 100),
    height: baseCrop.height * (closeup.height / 100),
  };
  const image = document.createElement('img');
  viewport.style.aspectRatio = `${sourceCrop.width} / ${sourceCrop.height}`;
  image.src = side.image;
  image.alt = closeup.label;
  image.style.width = `${(side.width / sourceCrop.width) * 100}%`;
  image.style.left = `${-(sourceCrop.x / sourceCrop.width) * 100}%`;
  image.style.top = `${-(sourceCrop.y / sourceCrop.height) * 100}%`;
  viewport.append(image);
  caption.textContent = closeup.label;
}

function showAnswer(found = false) {
  if (state.solved || !state.imageReady) return;
  state.solved = true;
  setFeedback();
  drawAnswerRegions();
  $('#reveal-button').disabled = true;
  populateAnswerContent(found);
  answerPanel.hidden = false;
}

function pointerPosition(event, sideNode) {
  const rect = sideNode.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 100,
    y: ((event.clientY - rect.top) / rect.height) * 100,
  };
}

function chooseKeyboardRegion(number) {
  const column = (number - 1) % 3;
  const row = Math.floor((number - 1) / 3);
  placeAndJudge((column + 0.5) * (100 / 3), (row + 0.5) * (100 / 3));
}

function openFullImage(event) {
  event.preventDefault();
  const gallery = $('#full-image-gallery');
  gallery.replaceChildren();
  $('#full-image-title').textContent = identification(state.current);

  state.current.sides.forEach((side) => {
    const crop = cropFor(side);
    const figure = document.createElement('figure');
    const viewport = document.createElement('div');
    viewport.className = 'full-image-crop';
    viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;
    viewport.style.width = `${Math.min(crop.width, side.maxDisplayWidth ?? crop.width)}px`;
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    image.src = side.image;
    image.alt = `${side.label} view of ${identification(state.current)}.`;
    image.style.width = `${(side.width / crop.width) * 100}%`;
    image.style.left = `${-(crop.x / crop.width) * 100}%`;
    image.style.top = `${-(crop.y / crop.height) * 100}%`;
    caption.textContent = side.label;
    viewport.append(image);
    figure.append(viewport, caption);
    gallery.append(figure);
  });
  $('#full-image-dialog').showModal();
}

imageCanvas.addEventListener('click', (event) => {
  const sideNode = event.target.closest('.game-side');
  if (!sideNode) return;
  const position = pointerPosition(event, sideNode);
  placeAndJudge(position.x, position.y, Number(sideNode.dataset.side));
});

imageCanvas.addEventListener('keydown', (event) => {
  if (/^[1-9]$/.test(event.key)) {
    event.preventDefault();
    chooseKeyboardRegion(Number(event.key));
  }
});

$('#reveal-button').addEventListener('click', () => {
  setFeedback();
  showAnswer();
});
$('#next-button').addEventListener('click', () => {
  flipTitleCoin();
  nextPiece();
});
$('#enlarge-link').addEventListener('click', openFullImage);

const helpButton = $('#help-button');
const helpDialog = $('#help-dialog');
const keyboardControls = helpDialog.querySelector('.keyboard-controls');

function openHelp() {
  keyboardControls.open = false;
  if (!helpDialog.open) helpDialog.showModal();
}

helpButton.addEventListener('click', openHelp);
helpDialog.addEventListener('close', () => helpButton.focus({ preventScroll: true }));
helpDialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  const focusable = [...helpDialog.querySelectorAll('button:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.getClientRects().length > 0);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close());
});

let resizeFrame;
function resizeCurrentFrame() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (state.current) prepareImageFrame();
  });
}
window.addEventListener('resize', resizeCurrentFrame);
window.visualViewport?.addEventListener('resize', resizeCurrentFrame);

function openHelpFromLocation() {
  if (window.location.hash === '#how-to-play') openHelp();
}

window.addEventListener('hashchange', openHelpFromLocation);
window.addEventListener('pageshow', openHelpFromLocation);
openHelpFromLocation();
nextPiece();
