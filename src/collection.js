import { COLLECTION_PIECES } from '../data/notes.js?v=30';

const gallery = document.querySelector('#collection-gallery');
const detail = document.querySelector('#collection-detail');
const list = document.querySelector('#collection-list');
const previousButton = document.querySelector('#previous-item');
const nextButton = document.querySelector('#next-item');
const allItemsLink = document.querySelector('.all-items-link');
const helpButton = document.querySelector('#help-button');
const helpDialog = document.querySelector('#help-dialog');
const keyboardControls = helpDialog.querySelector('.keyboard-controls');

let currentIndex = -1;

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

helpDialog.querySelector('[data-close-dialog]').addEventListener('click', () => helpDialog.close());

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
  const xPosition = side.width === crop.width ? 0 : (crop.x / (side.width - crop.width)) * 100;
  const yPosition = side.height === crop.height ? 0 : (crop.y / (side.height - crop.height)) * 100;
  viewport.style.backgroundImage = `url('${side.image}')`;
  viewport.style.backgroundRepeat = 'no-repeat';
  viewport.style.backgroundSize = `${(side.width / crop.width) * 100}% ${(side.height / crop.height) * 100}%`;
  viewport.style.backgroundPosition = `${xPosition}% ${yPosition}%`;

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
    viewport.style.width = '100%';
    viewport.style.maxWidth = `${Math.min(crop.width, side.maxDisplayWidth ?? crop.width)}px`;
  }

  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${side.label} view of ${identification(piece)} showing ${piece.errorName.toLowerCase()}.`;
  image.loading = mode === 'gallery' ? 'lazy' : 'eager';
  image.decoding = 'async';
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
  link.className = `gallery-entry gallery-entry-${piece.pieceKind}`;
  link.href = `#${piece.id}`;

  const photo = document.createElement('div');
  photo.className = `gallery-photo specimen-mount specimen-mount-${piece.pieceKind}`;
  photo.append(imageGroup(piece, 'gallery'));

  const copy = document.createElement('div');
  copy.className = 'gallery-copy';
  copy.innerHTML = `
    <h3>${piece.errorName}</h3>
    <p>${identification(piece)}</p>`;
  link.append(photo, copy);
  return link;
}

function gallerySection(title, pieces, kind) {
  const section = document.createElement('section');
  section.className = `album-section album-section-${kind}`;

  const heading = document.createElement('h2');
  heading.className = 'album-section-title';
  heading.textContent = title;

  const grid = document.createElement('div');
  grid.className = `album-grid album-grid-${kind}`;
  grid.append(...pieces.map(galleryEntry));
  section.append(heading, grid);
  return section;
}

function detailCloseup(piece) {
  if (!piece.revealCrop) return null;
  const crop = piece.revealCrop;
  const side = piece.sides[crop.side];
  const sourceCrop = cropFor(side);
  const source = {
    x: sourceCrop.x + (crop.x / 100) * sourceCrop.width,
    y: sourceCrop.y + (crop.y / 100) * sourceCrop.height,
    width: (crop.width / 100) * sourceCrop.width,
    height: (crop.height / 100) * sourceCrop.height,
  };

  const figure = document.createElement('figure');
  figure.className = 'collection-closeup';
  const label = document.createElement('figcaption');
  label.textContent = crop.label;

  const viewport = document.createElement('span');
  viewport.className = 'collection-closeup-crop';
  viewport.style.aspectRatio = `${source.width} / ${source.height}`;

  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${crop.label} from the original photograph of ${identification(piece)}.`;
  image.loading = 'eager';
  image.style.width = `${(side.width / source.width) * 100}%`;
  image.style.left = `${-(source.x / source.width) * 100}%`;
  image.style.top = `${-(source.y / source.height) * 100}%`;
  viewport.append(image);
  figure.append(label, viewport);
  return figure;
}

function pieceArticle(piece) {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = piece.id;

  const imageColumn = document.createElement('div');
  imageColumn.className = 'collection-image';
  const mount = document.createElement('div');
  mount.className = `detail-mount detail-mount-${piece.pieceKind}`;
  mount.append(imageGroup(piece, 'detail'));
  imageColumn.append(mount);
  const closeup = detailCloseup(piece);
  if (closeup) imageColumn.append(closeup);

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
  const notes = COLLECTION_PIECES.filter((piece) => piece.pieceKind === 'note');
  const coins = COLLECTION_PIECES.filter((piece) => piece.pieceKind === 'coin');
  const divider = document.createElement('div');
  divider.className = 'collection-art-break';
  divider.setAttribute('aria-hidden', 'true');
  divider.innerHTML = '<img src="assets/art/watercolor/uneven-coin-stack.png" alt="" loading="lazy" decoding="async">';
  const tail = document.createElement('div');
  tail.className = 'collection-art-tail';
  tail.setAttribute('aria-hidden', 'true');
  tail.innerHTML = '<img src="assets/art/watercolor/open-coin-envelope.png" alt="" loading="lazy" decoding="async">';
  gallery.replaceChildren(
    gallerySection('Paper money', notes, 'notes'),
    divider,
    gallerySection('Coins', coins, 'coins'),
    tail,
  );
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
  showAdjacent(1);
});
allItemsLink.addEventListener('click', (event) => {
  event.preventDefault();
  history.pushState(null, '', `${window.location.pathname}${window.location.search}`);
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
