import { CANDIDATES, NOTES } from '../data/notes.js';

const params = new URLSearchParams(window.location.search);
const requestedIds = (params.get('ids') ?? '').split(',').filter(Boolean);
const requestedSet = new Set(requestedIds);
const reviewContext = document.querySelector('#review-context');
const list = document.querySelector('#collection-list');
const candidateList = document.querySelector('#candidate-list');

let visibleNotes = NOTES;
if (requestedSet.size) {
  visibleNotes = requestedIds.map((id) => NOTES.find((note) => note.id === id)).filter(Boolean);
  reviewContext.hidden = false;
  reviewContext.replaceChildren('Showing the five notes from your last game. ');
  const showAll = document.createElement('a');
  showAll.href = 'notes.html';
  showAll.textContent = 'Show the full collection.';
  reviewContext.append(showAll);
}

function imageFigure(note) {
  const side = note.sides[note.answerSide];
  const crop = side.crop ?? { x: 0, y: 0, width: side.width, height: side.height };
  const figure = document.createElement('figure');
  const viewport = document.createElement('a');
  viewport.className = 'collection-crop';
  viewport.href = side.image;
  viewport.target = '_blank';
  viewport.rel = 'noreferrer';
  viewport.style.aspectRatio = `${crop.width} / ${crop.height}`;
  viewport.setAttribute('aria-label', `Open the full source image for ${note.denomination} ${note.noteType}`);
  const image = document.createElement('img');
  image.src = side.image;
  image.alt = `${side.label} view of ${note.denomination} ${note.noteType} showing ${note.errorName.toLowerCase()}.`;
  image.loading = 'lazy';
  image.style.width = `${(side.width / crop.width) * 100}%`;
  image.style.left = `${-(crop.x / crop.width) * 100}%`;
  image.style.top = `${-(crop.y / crop.height) * 100}%`;
  viewport.append(image);
  const caption = document.createElement('figcaption');
  caption.textContent = note.imageCredit;
  figure.append(viewport, caption);
  return figure;
}

function sourceLabel(note) {
  if (note.sourceUrl.includes('flickr.com')) return 'View photograph record';
  if (note.sourceUrl.includes('wikimedia.org')) return 'View scan record';
  if (note.sourceUrl.includes('currency.ha.com')) return 'View auction record';
  return 'View source record';
}

function noteArticle(note) {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = note.id;

  const imageColumn = document.createElement('div');
  imageColumn.className = 'collection-image';
  imageColumn.append(imageFigure(note));

  const copy = document.createElement('div');
  copy.className = 'collection-copy';
  const stateClass = note.playable ? 'record-state' : 'record-state reference-state';
  const stateText = note.playable ? 'Playable in randomized rounds.' : 'Reference only. Not used in rounds.';
  copy.innerHTML = `
    <h3>${note.errorName}</h3>
    <p class="collection-meta">${note.denomination} ${note.noteType}</p>
    <p>${note.explanation}</p>
    <p class="${stateClass}">${stateText}</p>
    <p class="visible-source"><a href="${note.sourceUrl}" target="_blank" rel="noreferrer">${sourceLabel(note)}</a></p>
    <details>
      <summary>More details</summary>
      <p>${note.cause}</p>
      <p>${note.production}</p>
      <dl class="record-details">
        <dt>Series</dt><dd>${note.series}</dd>
        <dt>Printing date</dt><dd>${note.printingDate ?? 'Not documented in the cited record'}</dd>
        <dt>Catalog</dt><dd>${note.catalog}</dd>
        <dt>Error category</dt><dd>${note.errorCategory}</dd>
        <dt>Image credit</dt><dd>${note.imageCredit}</dd>
        <dt>Reuse basis</dt><dd>${note.rights.label}. ${note.rights.detail}</dd>
      </dl>
      <div class="collection-links">
        ${note.documentationUrl ? `<a href="${note.documentationUrl}" target="_blank" rel="noreferrer">${note.documentationLabel}</a>` : ''}
        ${note.supportingUrl ? `<a href="${note.supportingUrl}" target="_blank" rel="noreferrer">${note.supportingLabel}</a>` : ''}
        <a href="${note.rights.url}" target="_blank" rel="noreferrer">View reuse terms</a>
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
    section.append(heading, ...groupNotes.map(noteArticle));
    parent.append(section);
  });
}

if (requestedSet.size) {
  renderGroups(visibleNotes, list);
} else {
  renderGroups(visibleNotes.filter((note) => note.playable), list);
  const referenceHeading = document.createElement('div');
  referenceHeading.className = 'collection-divider';
  referenceHeading.innerHTML = '<h2>Reference records</h2><p>Documented specimens retained for research, but excluded from randomized rounds because their image terms do not clearly cover cropped gameplay.</p>';
  list.append(referenceHeading);
  renderGroups(visibleNotes.filter((note) => !note.playable), list);
}

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
