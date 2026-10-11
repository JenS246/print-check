import { NOTES } from '../data/notes.js';

const $ = (selector) => document.querySelector(selector);
const homeScreen = $('#home-screen');
const gameScreen = $('#game-screen');
const resultScreen = $('#result-screen');
const imageScroll = $('#image-scroll');
const imageCanvas = $('#image-canvas');
const noteImage = $('#note-image');
const marker = $('#guess-marker');
const answerRegions = $('#answer-regions');
const numberGrid = $('#number-grid');
const feedback = $('#feedback');
const answerPanel = $('#answer-panel');

const state = {
  order: [],
  round: 0,
  score: 0,
  side: 0,
  zoom: 1,
  marker: null,
  numberedMode: false,
  usedReveal: false,
  solved: false,
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function currentNote() { return state.order[state.round]; }

function showScreen(screen) {
  [homeScreen, gameScreen, resultScreen].forEach((item) => { item.hidden = item !== screen; });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function startGame() {
  state.order = shuffle(NOTES).slice(0, 5);
  state.round = 0;
  state.score = 0;
  showScreen(gameScreen);
  loadRound();
}

function loadRound() {
  state.side = currentNote().answerSide;
  state.zoom = 1;
  state.marker = null;
  state.numberedMode = false;
  state.usedReveal = false;
  state.solved = false;
  marker.hidden = true;
  answerRegions.replaceChildren();
  numberGrid.hidden = true;
  answerPanel.hidden = true;
  feedback.textContent = '';
  feedback.removeAttribute('data-tone');
  $('#round-count').textContent = `Round ${state.round + 1} of 5`;
  $('#score').textContent = `${state.score} ${state.score === 1 ? 'point' : 'points'}`;
  $('#alternate-mode').setAttribute('aria-pressed', 'false');
  $('#alternate-mode').textContent = 'Use numbered regions';
  $('#check-button').disabled = true;
  $('#hint-button').disabled = false;
  $('#reveal-button').disabled = false;
  $('#next-button').textContent = state.round === 4 ? 'See score' : 'Next note';
  renderSideControls();
  renderNumberGrid();
  renderImage();
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
      if (state.solved) return;
      state.side = index;
      state.marker = null;
      marker.hidden = true;
      $('#check-button').disabled = true;
      renderSideControls();
      renderImage();
    });
    container.append(button);
  });
}

function renderImage() {
  const note = currentNote();
  const side = note.sides[state.side];
  const cropHeight = side.height - side.cropY;
  imageCanvas.style.aspectRatio = `${side.width} / ${cropHeight}`;
  imageCanvas.style.width = `${state.zoom * 100}%`;
  noteImage.src = side.image;
  noteImage.alt = `${side.label} of a ${note.denomination} ${note.noteType}. Error details are hidden until the answer is checked.`;
  $('#zoom-value').textContent = `${Math.round(state.zoom * 100)}%`;
  $('#zoom-out').disabled = state.zoom <= 1;
  $('#zoom-in').disabled = state.zoom >= 2.5;
  imageScroll.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  renderMarker();
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
  if (state.solved) return;
  state.marker = { x, y, side };
  renderMarker();
  $('#check-button').disabled = false;
  $('#image-status').textContent = `Marker placed in region near ${Math.round(x)} percent across and ${Math.round(y)} percent down.`;
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
  if (state.solved) return;
  const column = (number - 1) % 3;
  const row = Math.floor((number - 1) / 3);
  placeMarker((column + 0.5) * (100 / 3), (row + 0.5) * (100 / 3));
  [...numberGrid.children].forEach((button, index) => {
    button.setAttribute('aria-pressed', String(index + 1 === number));
  });
}

function isCorrect() {
  if (!state.marker || state.marker.side !== currentNote().answerSide) return false;
  return currentNote().regions.some((region) => (
    state.marker.x >= region.x
    && state.marker.x <= region.x + region.width
    && state.marker.y >= region.y
    && state.marker.y <= region.y + region.height
  ));
}

function checkAnswer() {
  if (state.solved || !state.marker) return;
  if (isCorrect()) {
    if (!state.usedReveal) state.score += 1;
    feedback.textContent = state.usedReveal ? 'That is the documented area.' : 'Correct. You found it without Reveal.';
    feedback.dataset.tone = 'correct';
    showAnswer(false);
  } else {
    feedback.textContent = state.marker.side !== currentNote().answerSide
      ? `Not on this side. Try the ${currentNote().sides[currentNote().answerSide].label.toLowerCase()}.`
      : 'Not there. Move the marker and try again.';
    feedback.dataset.tone = 'wrong';
  }
}

function showAnswer(revealed) {
  state.solved = true;
  if (revealed) state.usedReveal = true;
  state.side = currentNote().answerSide;
  renderSideControls();
  renderImage();
  drawAnswerRegions();
  $('#check-button').disabled = true;
  $('#hint-button').disabled = true;
  $('#reveal-button').disabled = true;
  const note = currentNote();
  $('#answer-kicker').textContent = revealed ? 'Revealed' : 'Found';
  $('#answer-title').textContent = note.errorName;
  $('#answer-explanation').textContent = note.explanation;
  $('#answer-cause').textContent = note.cause;
  $('#answer-note').textContent = `${note.denomination} ${note.noteType}`;
  $('#answer-series').textContent = note.series;
  $('#answer-credit').textContent = note.imageCredit;
  $('#source-link').href = note.sourceUrl;
  answerPanel.hidden = false;
  $('#score').textContent = `${state.score} ${state.score === 1 ? 'point' : 'points'}`;
  answerPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

function nextRound() {
  if (state.round === 4) {
    $('#final-score').textContent = String(state.score);
    $('#result-message').textContent = state.score === 5
      ? 'A clean inspection. You found every documented error without Reveal.'
      : 'Each note is documented in the collection, with its full scans and auction record.';
    showScreen(resultScreen);
    return;
  }
  state.round += 1;
  window.scrollTo({ top: 0, behavior: 'instant' });
  loadRound();
}

function openFullImage() {
  const note = currentNote();
  const side = note.sides[note.answerSide];
  $('#full-image-title').textContent = `${note.denomination} ${note.noteType}, ${side.label.toLowerCase()}`;
  $('#full-image').src = side.image;
  $('#full-image').alt = `Full uncropped ${side.label.toLowerCase()} scan of ${note.denomination} ${note.noteType}, including its grading holder.`;
  $('#full-image-credit').textContent = `Image: ${note.imageCredit}`;
  $('#full-image-source').href = note.sourceUrl;
  $('#full-image-dialog').showModal();
}

imageCanvas.addEventListener('click', (event) => {
  if (state.numberedMode || state.solved) return;
  const rect = imageCanvas.getBoundingClientRect();
  placeMarker(((event.clientX - rect.left) / rect.width) * 100, ((event.clientY - rect.top) / rect.height) * 100);
});

$('#start-button').addEventListener('click', startGame);
$('#play-again').addEventListener('click', startGame);
$('#home-button').addEventListener('click', () => showScreen(homeScreen));
$('#check-button').addEventListener('click', checkAnswer);
$('#hint-button').addEventListener('click', () => {
  feedback.textContent = currentNote().hint;
  feedback.removeAttribute('data-tone');
});
$('#reveal-button').addEventListener('click', () => {
  feedback.textContent = 'The documented area is outlined below.';
  feedback.dataset.tone = 'correct';
  showAnswer(true);
});
$('#next-button').addEventListener('click', nextRound);
$('#full-image-button').addEventListener('click', openFullImage);
$('#help-button').addEventListener('click', () => $('#help-dialog').showModal());
$('#alternate-mode').addEventListener('click', () => {
  state.numberedMode = !state.numberedMode;
  numberGrid.hidden = !state.numberedMode;
  $('#alternate-mode').setAttribute('aria-pressed', String(state.numberedMode));
  $('#alternate-mode').textContent = state.numberedMode ? 'Use pointer marker' : 'Use numbered regions';
});
$('#zoom-in').addEventListener('click', () => { state.zoom = Math.min(2.5, state.zoom + 0.5); renderImage(); });
$('#zoom-out').addEventListener('click', () => { state.zoom = Math.max(1, state.zoom - 0.5); renderImage(); });

document.querySelectorAll('[data-close-dialog]').forEach((button) => {
  button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close());
});

document.addEventListener('keydown', (event) => {
  if (!gameScreen.hidden && state.numberedMode && /^[1-9]$/.test(event.key)) {
    event.preventDefault();
    selectNumberedRegion(Number(event.key));
  }
});
