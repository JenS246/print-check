import { COLLECTION_PIECES } from '../data/notes.js?v=22';

const gallery = document.querySelector('#collection-gallery');
const detail = document.querySelector('#collection-detail');
const list = document.querySelector('#collection-list');
const previousButton = document.querySelector('#previous-item');
const nextButton = document.querySelector('#next-item');
const allItemsLink = document.querySelector('.all-items-link');
const titleCoin = document.querySelector('.title-coin');

let currentIndex = -1;

function flipTitleCoin() {
  if (!titleCoin || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  titleCoin.classList.remove('is-flipping');
  requestAnimationFrame(() => titleCoin.classList.add('is-flipping'));
}

titleCoin?.addEventListener('animationend', () => titleCoin.classList.remove('is-flipping'));

function identification(piece) {
  const name = piece.pieceKind === 'coin' ? piece.noteType : `${piece.denomination} ${piece.noteType}`;
  return piece.series ? `${name}, ${piece.series}` : name;
}

function cropFor(side) {
  return side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
}

function usesWholePhotograph(side) {
  const crop = cropFor(side);
  return crop.x === 0 && crop.y === 0 && crop.width === side.width && crop.height === side.height;
}

function imageFigure(piece, side, mode) {
  const crop = cropFor(side);
  const ratio = crop.width / crop.height;
  const figure = document.createElement('figure');
  const canOpenOriginal = mode === 'detail' && usesWholePhotograph(side);
  const viewport = document.createElement(canOpenOriginal ? 'a' : 'span');
  viewport.className = 'collection-crop';
  viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;

  if (mode === 'detail') {
    const viewportHeight = window.visualViewport?.height ?? document.documentElement.clientHeight;
    const heightLimit = window.matchMedia('(max-width: 760px)').matches
      ? Math.min(280, viewportHeight * 0.36)
      : Math.min(460, viewportHeight * 0.54);
    const widthLimit = Math.min(crop.width, side.maxDisplayWidth ?? crop.width, heightLimit * ratio);
    viewport.style.width = `${widthLimit}px`;
    if (canOpenOriginal) {
      viewport.href = side.image;
      viewport.target = '_blank';
      viewport.rel = 'noreferrer';
      viewport.setAttribute('aria-label', `Open the full photograph for ${identification(piece)}`);
    }
  } else {
    const widthLimit = Math.min(crop.width, side.maxDisplayWidth ?? crop.width, 234 * ratio);
    viewport.style.width = `${widthLimit}px`;
  }

  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${side.label} view of ${identification(piece)} showing ${piece.errorName.toLowerCase()}.`;
  image.loading = mode === 'gallery' ? 'lazy' : 'eager';
  image.style.width = `${(side.width / crop.width) * 100}%`;
  image.style.left = `${-(crop.x / crop.width) * 100}%`;
  image.style.top = `${-(crop.y / crop.height) * 100}%`;
  viewport.append(image);
  figure.append(viewport);
  return figure;
}

function imageGroup(piece, mode) {
  const group = document.createElement('div');
  group.className = `collection-image-group collection-image-group-${mode}`;
  group.dataset.piece = piece.id;
  if (piece.sides.length > 1) group.classList.add('collection-image-pair');
  group.append(...piece.sides.map((side) => imageFigure(piece, side, mode)));
  return group;
}

function galleryEntry(piece) {
  const link = document.createElement('a');
  link.className = 'gallery-entry';
  link.href = `#${piece.id}`;

  const photo = document.createElement('div');
  photo.className = 'gallery-photo';
  photo.append(imageGroup(piece, 'gallery'));

  const copy = document.createElement('div');
  copy.className = 'gallery-copy';
  copy.innerHTML = `
    <p>${identification(piece)}</p>
    <h2>${piece.errorName}</h2>`;
  link.append(photo, copy);
  return link;
}

function pieceArticle(piece) {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = piece.id;

  const imageColumn = document.createElement('div');
  imageColumn.className = 'collection-image';
  imageColumn.append(imageGroup(piece, 'detail'));

  const copy = document.createElement('div');
  copy.className = 'collection-copy';
  const documentationLink = piece.documentationUrl && piece.documentationLabel
    ? `<p>Documentation: <a href="${piece.documentationUrl}" target="_blank" rel="noreferrer">${piece.documentationLabel}</a>.</p>`
    : '';
  const supportingLink = piece.supportingUrl && piece.supportingLabel
    ? `<p>Background: <a href="${piece.supportingUrl}" target="_blank" rel="noreferrer">${piece.supportingLabel}</a>.</p>`
    : '';
  copy.innerHTML = `
    <p class="collection-meta">${identification(piece)}</p>
    <h2>${piece.errorName}</h2>
    <p>${piece.answerExplanation}</p>
    <details class="source-details collection-credit">
      <summary>Source and image credit</summary>
      <p>Image: ${piece.imageCredit}.</p>
      <p>Photograph: <a href="${piece.sourceUrl}" target="_blank" rel="noreferrer">${piece.sourceLabel ?? 'Photograph and specimen record'}</a>.</p>
      ${documentationLink}
      ${supportingLink}
      <p>License: <a href="${piece.rights.url}" target="_blank" rel="noreferrer">${piece.rights.label}</a>.</p>
      <p>${piece.rights.detail}</p>
    </details>`;
  article.append(imageColumn, copy);
  return article;
}

function renderGallery() {
  gallery.replaceChildren(...COLLECTION_PIECES.map(galleryEntry));
}

function indexFromHash() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  if (!id) return -1;
  return COLLECTION_PIECES.findIndex((piece) => piece.id === id);
}

function renderFromHash() {
  currentIndex = indexFromHash();
  if (currentIndex < 0) {
    document.body.classList.remove('collection-detail-active');
    gallery.hidden = false;
    detail.hidden = true;
    document.title = 'Coins and bills | Print Check';
    return;
  }

  const piece = COLLECTION_PIECES[currentIndex];
  document.body.classList.add('collection-detail-active');
  gallery.hidden = true;
  detail.hidden = false;
  list.replaceChildren(pieceArticle(piece));
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === COLLECTION_PIECES.length - 1;
  document.title = `${piece.errorName} | Print Check`;
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

function showAdjacent(offset) {
  const nextIndex = currentIndex + offset;
  if (nextIndex < 0 || nextIndex >= COLLECTION_PIECES.length) return;
  window.location.hash = COLLECTION_PIECES[nextIndex].id;
}

previousButton.addEventListener('click', () => showAdjacent(-1));
nextButton.addEventListener('click', () => {
  flipTitleCoin();
  showAdjacent(1);
});
allItemsLink.addEventListener('click', (event) => {
  event.preventDefault();
  history.pushState(null, '', window.location.pathname);
  renderFromHash();
  window.scrollTo({ top: 0, behavior: 'instant' });
});

window.addEventListener('hashchange', renderFromHash);
window.addEventListener('popstate', renderFromHash);

let resizeFrame;
function scheduleDetailResize() {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(() => {
    if (currentIndex >= 0) renderFromHash();
  });
}
window.addEventListener('resize', scheduleDetailResize);
window.visualViewport?.addEventListener('resize', scheduleDetailResize);

renderGallery();
renderFromHash();
