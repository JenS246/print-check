import { PLAYABLE_NOTES } from '../data/notes.js';
import { markerHitsRegions, shuffle } from './rounds.js';

const $ = (selector) => document.querySelector(selector);
const imageScroll = $('#image-scroll');
const imageCanvas = $('#image-canvas');
const noteImage = $('#note-image');
const marker = $('#guess-marker');
const answerRegions = $('#answer-regions');
const numberGrid = $('#number-grid');
const feedback = $('#feedback');
const answerPanel = $('#answer-panel');

const state = {
  queue: [],
  current: null,
  lastNoteId: null,
  side: 0,
  zoom: 1,
  marker: null,
  numberedMode: false,
  solved: false,
  imageReady: false,
  drag: null,
};

function currentNote() { return state.current; }
function currentSide() { return currentNote().sides[state.side]; }

function refillQueue() {
  state.queue = shuffle(PLAYABLE_NOTES);
  if (state.queue.length > 1 && state.queue[0].id === state.lastNoteId) {
    [state.queue[0], state.queue[1]] = [state.queue[1], state.queue[0]];
  }
}

function setFeedback(message = '', tone = '') {
  feedback.textContent = message;
  feedback.hidden = !message;
  if (tone) feedback.dataset.tone = tone;
  else feedback.removeAttribute('data-tone');
}

function setAnsweringEnabled(enabled) {
  state.imageReady = enabled;
  $('#hint-button').disabled = !enabled || state.solved;
  $('#reveal-button').disabled = !enabled || state.solved;
  $('#check-button').disabled = !enabled || state.solved || !state.marker;
  $('#alternate-mode').disabled = !enabled || state.solved;
}

function resetNoteState() {
  state.side = currentNote().answerSide;
  state.zoom = 1;
  state.marker = null;
  state.numberedMode = false;
  state.solved = false;
  state.imageReady = false;
  state.drag = null;
  marker.hidden = true;
  answerRegions.replaceChildren();
  numberGrid.hidden = true;
  answerPanel.hidden = true;
  setFeedback();
  $('#image-status').textContent = '';
  $('#alternate-mode').setAttribute('aria-pressed', 'false');
  $('#alternate-mode').textContent = 'Use numbered regions';
}

function nextNote() {
  if (!state.queue.length) refillQueue();
  state.current = state.queue.shift();
  state.lastNoteId = state.current.id;
  resetNoteState();
  renderSideControls();
  renderNumberGrid();
  loadImage();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderSideControls() {
  const container = $('#side-controls');
  container.replaceChildren();
  container.hidden = currentNote().sides.length < 2;
  currentNote().sides.forEach((side, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = side.label;
    button.setAttribute('aria-pressed', String(state.side === index));
    button.addEventListener('click', () => {
      if (state.solved || !state.imageReady) return;
      state.side = index;
      state.marker = null;
      marker.hidden = true;
      renderSideControls();
      loadImage();
    });
    container.append(button);
  });
}

function prepareImageFrame() {
  const side = currentSide();
  const crop = side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
  imageCanvas.style.aspectRatio = `${crop.width} / ${crop.height}`;
  noteImage.style.width = `${(side.width / crop.width) * 100}%`;
  noteImage.style.left = `${-(crop.x / crop.width) * 100}%`;
  noteImage.style.top = `${-(crop.y / crop.height) * 100}%`;
  applyZoom();
}

function loadImage() {
  const note = currentNote();
  const side = currentSide();
  setAnsweringEnabled(false);
  $('#loading-message').hidden = false;
  $('#image-error').hidden = true;
  imageCanvas.hidden = true;
  noteImage.removeAttribute('src');
  noteImage.alt = `${side.label} view of a genuine ${note.denomination} ${note.noteType}. Error details are hidden until the answer is shown.`;
  prepareImageFrame();
  noteImage.onload = () => {
    $('#loading-message').hidden = true;
    imageCanvas.hidden = false;
    imageScroll.scrollTo({ left: 0, top: 0, behavior: 'instant' });
    setAnsweringEnabled(true);
    renderMarker();
    if (state.solved) drawAnswerRegions();
  };
  noteImage.onerror = () => {
    $('#loading-message').hidden = true;
    $('#image-error').hidden = false;
    imageCanvas.hidden = true;
    setAnsweringEnabled(false);
  };
  noteImage.src = side.image;
}

function applyZoom() {
  imageCanvas.style.width = `${state.zoom * 100}%`;
  $('#zoom-value').textContent = `${Math.round(state.zoom * 100)}%`;
  $('#zoom-out').disabled = state.zoom <= 1;
  $('#zoom-in').disabled = state.zoom >= 3;
  renderMarker();
}

function resetView() {
  state.zoom = 1;
  applyZoom();
  imageScroll.scrollTo({ left: 0, top: 0, behavior: 'instant' });
}

function renderMarker() {
  if (!state.marker || state.marker.side !== state.side) {
    marker.hidden = true;
    return;
  }
  marker.style.left = `${state.marker.x}%`;
  marker.style.top = `${state.marker.y}%`;
  marker.hidden = false;
}

function placeMarker(x, y, side = state.side) {
  if (state.solved || !state.imageReady) return;
  state.marker = { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)), side };
  renderMarker();
  $('#check-button').disabled = false;
  $('#image-status').textContent = `Marker placed near ${Math.round(x)} percent across and ${Math.round(y)} percent down.`;
}

function renderNumberGrid() {
  numberGrid.replaceChildren();
  for (let n = 1; n <= 9; n += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = String(n);
    button.setAttribute('aria-label', `Choose image region ${n}`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectNumberedRegion(n));
    numberGrid.append(button);
  }
}

function selectNumberedRegion(number) {
  if (state.solved || !state.imageReady) return;
  const column = (number - 1) % 3;
  const row = Math.floor((number - 1) / 3);
  placeMarker((column + 0.5) * (100 / 3), (row + 0.5) * (100 / 3));
  [...numberGrid.children].forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index + 1 === number));
  });
}

function checkAnswer() {
  if (state.solved || !state.marker || !state.imageReady) return;
  if (markerHitsRegions(state.marker, currentNote().answerSide, currentNote().regions)) {
    setFeedback('You found it', 'correct');
    showAnswer();
  } else {
    setFeedback('Try another spot.', 'wrong');
  }
}

function showAnswer() {
  state.solved = true;
  const note = currentNote();
  if (state.side !== note.answerSide) {
    state.side = note.answerSide;
    renderSideControls();
    loadImage();
  } else {
    drawAnswerRegions();
  }
  setAnsweringEnabled(false);
  $('#answer-title').textContent = note.errorName;
  $('#answer-explanation').textContent = note.explanation;
  $('#answer-note').textContent = `${note.denomination} ${note.noteType}`;
  $('#answer-series').textContent = note.series;
  $('#answer-credit').textContent = note.imageCredit;
  $('#source-link').href = note.sourceUrl;
  answerPanel.hidden = false;
}

function drawAnswerRegions() {
  answerRegions.replaceChildren();
  currentNote().regions.forEach((region) => {
    const outline = document.createElement('span');
    outline.className = 'answer-region';
    outline.style.left = `${region.x}%`;
    outline.style.top = `${region.y}%`;
    outline.style.width = `${region.width}%`;
    outline.style.height = `${region.height}%`;
    answerRegions.append(outline);
  });
}

function openFullImage() {
  const note = currentNote();
  const side = currentSide();
  $('#full-image-title').textContent = `${note.denomination} ${note.noteType}`;
  $('#full-image').src = side.image;
  $('#full-image').alt = `Full source image for ${note.denomination} ${note.noteType}.`;
  $('#full-image-credit').textContent = `Image: ${note.imageCredit}`;
  $('#full-image-source').href = note.sourceUrl;
  $('#full-image-dialog').showModal();
}

function pointerPosition(event) {
  const rect = imageCanvas.getBoundingClientRect();
  return { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 };
}

imageCanvas.addEventListener('pointerdown', (event) => {
  if (state.numberedMode || state.solved || !state.imageReady) return;
  state.drag = { x: event.clientX, y: event.clientY, left: imageScroll.scrollLeft, top: imageScroll.scrollTop, moved: false };
  imageCanvas.setPointerCapture(event.pointerId);
});

imageCanvas.addEventListener('pointermove', (event) => {
  if (!state.drag) return;
  const dx = event.clientX - state.drag.x;
  const dy = event.clientY - state.drag.y;
  if (Math.hypot(dx, dy) > 10) state.drag.moved = true;
  if (state.zoom > 1 && state.drag.moved) {
    imageCanvas.classList.add('is-dragging');
    imageScroll.scrollLeft = state.drag.left - dx;
    imageScroll.scrollTop = state.drag.top - dy;
  }
});

imageCanvas.addEventListener('pointerup', (event) => {
  if (!state.drag) return;
  const moved = state.drag.moved;
  state.drag = null;
  imageCanvas.classList.remove('is-dragging');
  if (!moved) {
    const position = pointerPosition(event);
    placeMarker(position.x, position.y);
  }
});

imageCanvas.addEventListener('pointercancel', () => {
  state.drag = null;
  imageCanvas.classList.remove('is-dragging');
});

$('#check-button').addEventListener('click', checkAnswer);
$('#hint-button').addEventListener('click', () => setFeedback(currentNote().hint));
$('#reveal-button').addEventListener('click', () => {
  setFeedback();
  showAnswer();
});
$('#next-button').addEventListener('click', nextNote);
$('#full-image-button').addEventListener('click', openFullImage);
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#retry-image').addEventListener('click', loadImage);
$('#skip-image').addEventListener('click', nextNote);
$('#alternate-mode').addEventListener('click', () => {
  state.numberedMode = !state.numberedMode;
  numberGrid.hidden = !state.numberedMode;
  $('#alternate-mode').setAttribute('aria-pressed', String(state.numberedMode));
  $('#alternate-mode').textContent = state.numberedMode ? 'Use pointer marker' : 'Use numbered regions';
});
$('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(3, state.zoom + 0.5); applyZoom(); });
$('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(1, state.zoom - 0.5); applyZoom(); });
$('#reset-view').addEventListener('click', resetView);

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close());
});

document.addEventListener('keydown', (event) => {
  if (state.numberedMode && /^[1-9]$/.test(event.key)) {
    event.preventDefault();
    selectNumberedRegion(Number(event.key));
  }
});

if (window.location.hash === '#how-to-play') $('#help-dialog').showModal();
nextNote();
