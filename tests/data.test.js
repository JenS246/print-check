import assert from 'node:assert/strict';
import test from 'node:test';
import { IMAGE_PERMISSION, NOTES } from '../data/notes.js';

test('the game has exactly five unique verified specimens', () => {
  assert.equal(NOTES.length, 5);
  assert.equal(new Set(NOTES.map((note) => note.id)).size, 5);
});

test('every note includes one error-bearing scan and specimen-specific evidence', () => {
  for (const note of NOTES) {
    assert.equal(note.sides.length, 1, note.id);
    assert.match(note.sourceUrl, /^https:\/\/currency\.ha\.com\/itm\//, note.id);
    assert.match(note.imageArticleUrl, /^https:\/\/www\.minterrornews\.com\//, note.id);
    assert.ok(note.imageCredit.includes('Heritage Auctions'), note.id);
    assert.equal(note.printingDate, null, note.id);
    assert.ok(note.series.startsWith('Series '), note.id);
    assert.ok(note.production.includes('Heritage'), note.id);
  }
  assert.match(IMAGE_PERMISSION.url, /ha\.com\/c\/ref\/website-use-agreement/);
});

test('all image-relative answer regions are valid and generous', () => {
  for (const note of NOTES) {
    assert.ok(note.regions.length > 0, note.id);
    for (const region of note.regions) {
      assert.ok(region.x >= 0 && region.y >= 0, note.id);
      assert.ok(region.width >= 20 && region.height >= 20, note.id);
      assert.ok(region.x + region.width <= 100, note.id);
      assert.ok(region.y + region.height <= 100, note.id);
    }
    assert.ok(note.numberedRegions.every((value) => value >= 1 && value <= 9), note.id);
  }
});

test('grading labels are outside the gameplay crop', () => {
  for (const note of NOTES) {
    for (const side of note.sides) {
      assert.ok(side.cropY >= 70, `${note.id} ${side.label}`);
      assert.ok(side.height - side.cropY >= 170, `${note.id} ${side.label}`);
    }
  }
});

test('visible copy does not contain prohibited long dash characters', async () => {
  const files = ['index.html', 'notes.html', 'styles.css', 'src/game.js', 'src/collection.js', 'data/notes.js'];
  const { readFile } = await import('node:fs/promises');
  for (const file of files) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(/[—–]/.test(text), false, file);
  }
});
