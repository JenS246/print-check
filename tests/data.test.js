import assert from 'node:assert/strict';
import test from 'node:test';
import { CANDIDATES, NOTES, PLAYABLE_NOTES, REFERENCE_NOTES } from '../data/notes.js';
import { chooseCategoryDiverseRounds, markerHitsRegions } from '../src/rounds.js';

test('the reviewed collection separates playable and reference-only records', () => {
  assert.equal(PLAYABLE_NOTES.length, 6);
  assert.equal(REFERENCE_NOTES.length, 15);
  assert.equal(NOTES.length, 21);
  assert.equal(new Set(NOTES.map((note) => note.id)).size, NOTES.length);
  assert.ok(PLAYABLE_NOTES.every((note) => note.playable));
  assert.ok(REFERENCE_NOTES.every((note) => !note.playable));
});

test('research candidates remain non-playable and state what is missing', () => {
  assert.equal(CANDIDATES.length, 3);
  for (const candidate of CANDIDATES) {
    assert.match(candidate.sourceUrl, /^https:\/\//);
    assert.match(candidate.missing, /permission/i);
    assert.equal('playable' in candidate, false);
  }
});

test('every record has specimen evidence, a local image, and a documented reuse basis', async () => {
  const { access } = await import('node:fs/promises');
  for (const note of NOTES) {
    assert.match(note.sourceUrl, /^https:\/\//, note.id);
    assert.ok(note.imageCredit, note.id);
    assert.ok(note.rights?.label, note.id);
    assert.match(note.rights?.url, /^https:\/\//, note.id);
    assert.ok(note.series, note.id);
    assert.equal(note.printingDate, null, note.id);
    for (const side of note.sides) {
      await access(new URL(`../${side.image}`, import.meta.url));
    }
  }
});

test('playable crops and image-relative answer regions are valid', () => {
  for (const note of PLAYABLE_NOTES) {
    assert.ok(note.regions.length > 0, note.id);
    const side = note.sides[note.answerSide];
    const crop = side.crop;
    assert.ok(crop.width > 0 && crop.height > 0, note.id);
    assert.ok(crop.x >= 0 && crop.y >= 0, note.id);
    assert.ok(crop.x + crop.width <= side.width, note.id);
    assert.ok(crop.y + crop.height <= side.height, note.id);
    for (const region of note.regions) {
      assert.ok(region.x >= 0 && region.y >= 0, note.id);
      assert.ok(region.width >= 20 && region.height >= 20, note.id);
      assert.ok(region.x + region.width <= 100, note.id);
      assert.ok(region.y + region.height <= 100, note.id);
    }
  }
});

test('five-round selection avoids repeats and maximizes category diversity', () => {
  const rounds = chooseCategoryDiverseRounds(PLAYABLE_NOTES, 5, () => 0.42);
  assert.equal(rounds.length, 5);
  assert.equal(new Set(rounds.map((note) => note.id)).size, 5);
  assert.equal(new Set(rounds.map((note) => note.errorCategory)).size, 5);
});

test('five-round selection prefers an unseen note within a repeated category', () => {
  const recentIds = PLAYABLE_NOTES.filter((note) => note.id !== 'ana-10-shifted-overprint').map((note) => note.id);
  const rounds = chooseCategoryDiverseRounds(PLAYABLE_NOTES, 5, () => 0.42, recentIds);
  assert.ok(rounds.some((note) => note.id === 'ana-10-shifted-overprint'));
});

test('marker hit testing respects both regions and note side', () => {
  const regions = [{ x: 20, y: 20, width: 30, height: 30 }];
  assert.equal(markerHitsRegions({ x: 30, y: 30, side: 0 }, 0, regions), true);
  assert.equal(markerHitsRegions({ x: 30, y: 30, side: 1 }, 0, regions), false);
  assert.equal(markerHitsRegions({ x: 80, y: 80, side: 0 }, 0, regions), false);
});

test('visible copy does not contain prohibited long dash characters', async () => {
  const files = ['index.html', 'notes.html', 'styles.css', 'src/game.js', 'src/rounds.js', 'src/collection.js', 'data/notes.js'];
  const { readFile } = await import('node:fs/promises');
  for (const file of files) {
    const text = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    assert.equal(/[—–]/.test(text), false, file);
  }
});
