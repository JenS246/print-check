import assert from 'node:assert/strict';
import test from 'node:test';
import { CANDIDATES, NOTES, PLAYABLE_NOTES, REFERENCE_NOTES } from '../data/notes.js';
import { markerHitsRegions, shuffle } from '../src/rounds.js';

test('the reviewed collection separates playable and reference-only records', () => {
  assert.equal(PLAYABLE_NOTES.length, 7);
  assert.equal(REFERENCE_NOTES.length, 14);
  assert.equal(NOTES.length, 21);
  assert.equal(new Set(NOTES.map((note) => note.id)).size, NOTES.length);
  assert.ok(PLAYABLE_NOTES.every((note) => note.playable));
  assert.ok(REFERENCE_NOTES.every((note) => !note.playable));
});

test('research candidates remain non-playable and state what is missing', () => {
  assert.equal(CANDIDATES.length, 10);
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

test('shuffle keeps every note exactly once', () => {
  const shuffled = shuffle(PLAYABLE_NOTES, () => 0.42);
  assert.equal(shuffled.length, PLAYABLE_NOTES.length);
  assert.equal(new Set(shuffled.map((note) => note.id)).size, PLAYABLE_NOTES.length);
  assert.deepEqual(
    shuffled.map((note) => note.id).sort(),
    PLAYABLE_NOTES.map((note) => note.id).sort(),
  );
});

test('play screen contains no fixed-session or scoring language', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/game.js', import.meta.url), 'utf8')}`;
  assert.equal(/\b(points?|scores?|streaks?|rankings?|timer)\b/i.test(visible), false);
  assert.equal(/note\s+\d+\s+of\s+\d+|round-count|round-progress/i.test(visible), false);
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
