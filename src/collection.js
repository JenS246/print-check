import { COLLECTION_PIECES } from '../data/notes.js?v=11';

const list = document.querySelector('#collection-list');
const previousButton = document.querySelector('#previous-item');
const nextButton = document.querySelector('#next-item');
let currentIndex = Math.max(0, COLLECTION_PIECES.findIndex((piece) => `#${piece.id}` === window.location.hash));

function identification(piece) {
  const name = piece.pieceKind === 'coin' ? piece.noteType : `${piece.denomination} ${piece.noteType}`;
  return piece.series ? `${name}, ${piece.series}` : name;
}

function imageFigure(piece, side) {
  const crop = side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
  const figure = document.createElement('figure');
  const viewport = document.createElement('a');
  viewport.className = 'collection-crop';
  viewport.href = side.image;
  viewport.target = '_blank';
  viewport.rel = 'noreferrer';
  viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;
  viewport.style.maxWidth = `${Math.min(crop.width, side.maxDisplayWidth ?? crop.width)}px`;
  viewport.setAttribute('aria-label', `Open the full photograph for ${identification(piece)}`);
  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${side.label} view of ${identification(piece)} showing ${piece.errorName.toLowerCase()}.`;
  image.style.width = `${(side.width / crop.width) * 100}%`;
  image.style.left = `${-(crop.x / crop.width) * 100}%`;
  image.style.top = `${-(crop.y / crop.height) * 100}%`;
  viewport.append(image);
  figure.append(viewport);
  return figure;
}

function imageGroup(piece) {
  const group = document.createElement('div');
  if (piece.sides.length > 1) group.className = 'collection-image-pair';
  group.append(...piece.sides.map((side) => imageFigure(piece, side)));
  return group;
}

function pieceArticle(piece) {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = piece.id;

  const imageColumn = document.createElement('div');
  imageColumn.className = 'collection-image';
  imageColumn.append(imageGroup(piece));

  const copy = document.createElement('div');
  copy.className = 'collection-copy';
  copy.innerHTML = `
    <p class="collection-meta">${identification(piece)}</p>
    <h2>${piece.errorName}</h2>
    <p>${piece.answerExplanation}</p>
    <details class="source-details collection-credit">
      <summary>Source and image credit</summary>
      <p>Image: ${piece.imageCredit}.</p>
      <p><a href="${piece.sourceUrl}" target="_blank" rel="noreferrer">View specimen source</a> · <a href="${piece.documentationUrl}" target="_blank" rel="noreferrer">${piece.documentationLabel ?? 'Read documentation'}</a> · <a href="${piece.rights.url}" target="_blank" rel="noreferrer">${piece.rights.label}</a></p>
      <p>${piece.rights.detail}</p>
    </details>`;
  article.append(imageColumn, copy);
  return article;
}

function renderCurrentItem() {
  const piece = COLLECTION_PIECES[currentIndex];
  list.replaceChildren(pieceArticle(piece));
  previousButton.disabled = currentIndex === 0;
  nextButton.disabled = currentIndex === COLLECTION_PIECES.length - 1;
  history.replaceState(null, '', `#${piece.id}`);
}

previousButton.addEventListener('click', () => {
  if (currentIndex === 0) return;
  currentIndex -= 1;
  renderCurrentItem();
});

nextButton.addEventListener('click', () => {
  if (currentIndex === COLLECTION_PIECES.length - 1) return;
  currentIndex += 1;
  renderCurrentItem();
});

renderCurrentItem();
