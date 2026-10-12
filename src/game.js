import { PLAYABLE_PIECES } from '../data/notes.js?v=10';
import { markerHitsRegions, shuffle } from './rounds.js?v=10';

const $ = (selector) => document.querySelector(selector);
const imageFrame = $('#image-frame');
const imageCanvas = $('#image-canvas');
const noteImage = $('#note-image');
const marker = $('#guess-marker');
const answerRegions = $('#answer-regions');
const feedback = $('#feedback');
const answerPanel = $('#answer-panel');

const state = {
  queue: [],
  current: null,
  lastPieceId: null,
  marker: null,
  solved: false,
  imageReady: false,
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
  marker.hidden = true;
  answerRegions.replaceChildren();
  answerPanel.hidden = true;
  setFeedback();
  $('#reveal-button').disabled = true;
}

function currentSide() {
  return state.current.sides[state.current.answerSide];
}

function prepareImageFrame() {
  const side = currentSide();
  const crop = side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
  const availableWidth = Math.min($('#game-screen').clientWidth, 1050, side.maxDisplayWidth ?? Infinity);
  const heightShare = window.matchMedia('(max-width: 760px)').matches ? 0.54 : 0.5;
  const availableHeight = Math.max(230, Math.min(window.innerHeight * heightShare, 520));
  const fitWidth = Math.max(220, Math.min(availableWidth, availableHeight * (crop.width / crop.height)));
  const fitHeight = fitWidth * (crop.height / crop.width);

  imageFrame.style.width = `${fitWidth + 3}px`;
  imageFrame.style.height = `${fitHeight + 3}px`;
  imageCanvas.style.aspectRatio = `${crop.width} / ${crop.height}`;
  noteImage.style.width = `${(side.width / crop.width) * 100}%`;
  noteImage.style.left = `${-(crop.x / crop.width) * 100}%`;
  noteImage.style.top = `${-(crop.y / crop.height) * 100}%`;
}

function loadImage() {
  const piece = state.current;
  const side = currentSide();
  state.imageReady = false;
  $('#loading-message').hidden = false;
  $('#image-error').hidden = true;
  imageCanvas.hidden = true;
  noteImage.removeAttribute('src');
  noteImage.alt = `${side.label} view of a genuine ${identification(piece)}. Error details are hidden until the answer is shown.`;
  prepareImageFrame();
  noteImage.onload = () => {
    $('#loading-message').hidden = true;
    imageCanvas.hidden = false;
    state.imageReady = true;
    $('#reveal-button').disabled = false;
  };
  noteImage.onerror = () => {
    $('#loading-message').hidden = true;
    $('#image-error').hidden = false;
    state.imageReady = false;
  };
  noteImage.src = side.image;
}

function nextPiece() {
  if (!state.queue.length) refillQueue();
  state.current = state.queue.shift();
  state.lastPieceId = state.current.id;
  resetPieceState();
  loadImage();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function renderMarker() {
  if (!state.marker) {
    marker.hidden = true;
    return;
  }
  marker.style.left = `${state.marker.x}%`;
  marker.style.top = `${state.marker.y}%`;
  marker.hidden = false;
}

function placeAndJudge(x, y) {
  if (state.solved || !state.imageReady) return;
  state.marker = {
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
    side: state.current.answerSide,
  };
  renderMarker();

  if (markerHitsRegions(state.marker, state.current.answerSide, state.current.regions)) {
    setFeedback('You found it', 'correct');
    showAnswer();
  } else {
    setFeedback('Try another spot', 'wrong');
  }
}

function drawAnswerRegions() {
  answerRegions.replaceChildren();
  state.current.regions.forEach((region) => {
    const outline = document.createElement('span');
    outline.className = 'answer-region';
    outline.style.left = `${region.x}%`;
    outline.style.top = `${region.y}%`;
    outline.style.width = `${region.width}%`;
    outline.style.height = `${region.height}%`;
    answerRegions.append(outline);
  });
}

function showAnswer() {
  if (state.solved || !state.imageReady) return;
  state.solved = true;
  drawAnswerRegions();
  $('#reveal-button').disabled = true;
  $('#answer-title').textContent = state.current.errorName;
  $('#answer-explanation').textContent = state.current.answerExplanation;
  $('#answer-process').textContent = state.current.errorProcess;
  $('#answer-identification').textContent = identification(state.current);
  $('#answer-credit').textContent = state.current.imageCredit;
  $('#source-link').href = state.current.sourceUrl;
  $('#documentation-link').href = state.current.documentationUrl;
  $('#documentation-link').textContent = state.current.documentationLabel ?? 'Read documentation';
  $('#answer-rights').href = state.current.rights.url;
  $('#answer-rights').textContent = state.current.rights.label;
  $('#rights-detail').textContent = state.current.rights.detail;
  answerPanel.hidden = false;
}

function pointerPosition(event) {
  const rect = imageCanvas.getBoundingClientRect();
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
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const caption = document.createElement('figcaption');
    image.src = side.image;
    image.alt = `${side.label} view of ${identification(state.current)}.`;
    image.style.maxWidth = side.maxDisplayWidth ? `${side.maxDisplayWidth}px` : '';
    caption.textContent = side.label;
    figure.append(image, caption);
    gallery.append(figure);
  });
  $('#full-image-dialog').showModal();
}

imageCanvas.addEventListener('click', (event) => {
  const position = pointerPosition(event);
  placeAndJudge(position.x, position.y);
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
$('#next-button').addEventListener('click', nextPiece);
$('#enlarge-link').addEventListener('click', openFullImage);
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close());
});

let resizeFrame;
window.addEventListener('resize', () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (state.current) prepareImageFrame();
  });
});

if (window.location.hash === '#how-to-play') $('#help-dialog').showModal();
nextPiece();
