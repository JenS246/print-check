import { CANDIDATES, PIECES } from '../data/notes.js';

const list = document.querySelector('#collection-list');
const candidateList = document.querySelector('#candidate-list');

function imageFigure(piece) {
  const side = piece.sides[piece.answerSide];
  const crop = side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
  const figure = document.createElement('figure');
  const viewport = document.createElement('a');
  viewport.className = 'collection-crop';
  viewport.href = side.image;
  viewport.target = '_blank';
  viewport.rel = 'noreferrer';
  viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;
  viewport.setAttribute('aria-label', `Open the full source image for ${piece.denomination} ${piece.noteType}`);
  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${side.label} view of ${piece.denomination} ${piece.noteType} showing ${piece.errorName.toLowerCase()}.`;
  image.loading = 'lazy';
  image.style.width = `${(side.width / crop.width) * 100}%`;
  image.style.left = `${-(crop.x / crop.width) * 100}%`;
  image.style.top = `${-(crop.y / crop.height) * 100}%`;
  viewport.append(image);
  figure.append(viewport);
  return figure;
}

function sourceLabel(piece) {
  if (piece.sourceUrl.includes('flickr.com') || piece.pieceKind === 'coin') return 'View photograph record';
  if (piece.sourceUrl.includes('wikimedia.org')) return 'View scan record';
  if (piece.sourceUrl.includes('currency.ha.com')) return 'View auction record';
  return 'View source record';
}

function pieceArticle(piece) {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = piece.id;

  const imageColumn = document.createElement('div');
  imageColumn.className = 'collection-image';
  imageColumn.append(imageFigure(piece));

  const copy = document.createElement('div');
  copy.className = 'collection-copy';
  const stateClass = piece.playable ? 'record-state' : 'record-state reference-state';
  const stateText = piece.playable ? 'Playable in the shuffled rotation.' : 'Reference only. Not used in play.';
  const dateLabel = piece.pieceKind === 'coin' ? 'Date and mint' : 'Series';
  const dateValue = piece.series;
  const productionDateLabel = piece.pieceKind === 'coin' ? 'Production date' : 'Printing date';
  copy.innerHTML = `
    <h3>${piece.errorName}</h3>
    <p class="collection-meta">${piece.denomination} ${piece.noteType}</p>
    <p>${piece.explanation}</p>
    <p class="error-process">${piece.errorProcess}</p>
    <p class="${stateClass}">${stateText}</p>
    <p class="visible-source"><a href="${piece.sourceUrl}" target="_blank" rel="noreferrer">${sourceLabel(piece)}</a></p>
    <details>
      <summary>More details</summary>
      <p>${piece.cause}</p>
      <p>${piece.production}</p>
      <dl class="record-details">
        <dt>${dateLabel}</dt><dd>${dateValue}</dd>
        <dt>${productionDateLabel}</dt><dd>${piece.printingDate ?? 'Not documented in the cited record'}</dd>
        <dt>Catalog</dt><dd>${piece.catalog}</dd>
        <dt>Error category</dt><dd>${piece.errorCategory}</dd>
        <dt>Image credit</dt><dd>${piece.imageCredit}</dd>
        <dt>Reuse basis</dt><dd>${piece.rights.label}. ${piece.rights.detail}</dd>
      </dl>
      <div class="collection-links">
        ${piece.documentationUrl ? `<a href="${piece.documentationUrl}" target="_blank" rel="noreferrer">${piece.documentationLabel}</a>` : ''}
        ${piece.supportingUrl ? `<a href="${piece.supportingUrl}" target="_blank" rel="noreferrer">${piece.supportingLabel}</a>` : ''}
        <a href="${piece.rights.url}" target="_blank" rel="noreferrer">View reuse terms</a>
      </div>
    </details>`;
  article.append(imageColumn, copy);
  return article;
}

function renderGroups(notes, parent) {
  const groups = new Map();
  notes.forEach((note) => {
    const groupName = note.errorCategory;
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(note);
  });
  [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).forEach(([category, groupNotes]) => {
    const section = document.createElement('section');
    section.className = 'category-section';
    const heading = document.createElement('h2');
    heading.textContent = category;
    section.append(heading, ...groupNotes.map(pieceArticle));
    parent.append(section);
  });
}

renderGroups(PIECES.filter((piece) => piece.playable), list);
const referenceHeading = document.createElement('div');
referenceHeading.className = 'collection-divider';
referenceHeading.innerHTML = '<h2>Reference records</h2><p>Documented specimens retained for research, but excluded from play because their image terms do not clearly cover cropped gameplay.</p>';
list.append(referenceHeading);
renderGroups(PIECES.filter((piece) => !piece.playable), list);

CANDIDATES.forEach((candidate) => {
  const item = document.createElement('li');
  const name = document.createElement('strong');
  name.textContent = candidate.errorName;
  const identification = document.createElement('p');
  identification.textContent = candidate.identification;
  const missing = document.createElement('p');
  missing.textContent = `Still needed: ${candidate.missing}`;
  const link = document.createElement('a');
  link.href = candidate.sourceUrl;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = 'View research lead';
  item.append(name, identification, missing, link);
  candidateList.append(item);
});
