import { IMAGE_PERMISSION, NOTES } from '../data/notes.js';

const permission = document.querySelector('#permission-summary');
permission.append('Image permission: ', IMAGE_PERMISSION.detail, ' ');
const permissionLink = document.createElement('a');
permissionLink.href = IMAGE_PERMISSION.url;
permissionLink.target = '_blank';
permissionLink.rel = 'noreferrer';
permissionLink.textContent = 'Read the Heritage use agreement.';
permission.append(permissionLink);

const list = document.querySelector('#collection-list');

NOTES.forEach((note) => {
  const article = document.createElement('article');
  article.className = 'collection-item';
  article.id = note.id;

  const figures = note.sides.map((side) => `
    <figure>
      <img src="${side.image}" alt="Full ${side.label.toLowerCase()} scan of ${note.denomination} ${note.noteType}, including the grading holder." loading="lazy" width="${side.width}" height="${side.height}" />
      <figcaption>${side.label}. Full uncropped source image.</figcaption>
    </figure>`).join('');

  article.innerHTML = `
    <div class="collection-images">${figures}</div>
    <div class="collection-copy">
      <h2>${note.errorName}</h2>
      <p class="collection-meta">${note.denomination} ${note.noteType}, ${note.series}</p>
      <p>${note.explanation}</p>
      <p>${note.production}</p>
      <dl>
        <dt>Series</dt><dd>${note.series}</dd>
        <dt>Print date</dt><dd>Not documented in the cited record</dd>
        <dt>Catalog</dt><dd>${note.catalog}</dd>
        <dt>District</dt><dd>${note.district}</dd>
        <dt>Category</dt><dd>${note.errorCategory}</dd>
        <dt>Image credit</dt><dd>${note.imageCredit}</dd>
        <dt>Reuse</dt><dd>${IMAGE_PERMISSION.label}</dd>
      </dl>
      <div class="collection-links">
        <a href="${note.sourceUrl}" target="_blank" rel="noreferrer">View auction record</a>
        <a href="${note.imageArticleUrl}" target="_blank" rel="noreferrer">View image article</a>
        <a href="${IMAGE_PERMISSION.url}" target="_blank" rel="noreferrer">View reuse terms</a>
      </div>
    </div>`;
  list.append(article);
});

