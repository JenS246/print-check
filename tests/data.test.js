import assert from 'node:assert/strict';
import test from 'node:test';
import { PLAYABLE_COINS, PLAYABLE_NOTES, PLAYABLE_PIECES } from '../data/notes.js';
import { markerHitsRegions, shuffle } from '../src/rounds.js';

test('the public collection contains only playable records', () => {
  assert.equal(PLAYABLE_PIECES.length, 9);
  assert.equal(PLAYABLE_NOTES.length, 6);
  assert.equal(PLAYABLE_COINS.length, 3);
  assert.equal(new Set(PLAYABLE_PIECES.map((piece) => piece.id)).size, PLAYABLE_PIECES.length);
  assert.ok(PLAYABLE_PIECES.every((piece) => piece.playable));
});

test('every record has specimen evidence, a local image, and a documented reuse basis', async () => {
  const { access } = await import('node:fs/promises');
  for (const piece of PLAYABLE_PIECES) {
    assert.match(piece.sourceUrl, /^https:\/\//, piece.id);
    assert.ok(piece.imageCredit, piece.id);
    assert.ok(piece.rights?.label, piece.id);
    assert.match(piece.rights?.url, /^https:\/\//, piece.id);
    assert.ok(piece.shortExplanation, piece.id);
    assert.match(piece.pieceKind, /^(coin|note)$/, piece.id);
    assert.match(piece.errorProcess, /^(Minting|Printing) error$/, piece.id);
    for (const side of piece.sides) {
      await access(new URL(`../${side.image}`, import.meta.url));
    }
  }
});

test('playable crops and image-relative answer regions are valid', () => {
  for (const piece of PLAYABLE_PIECES) {
    assert.ok(piece.regions.length > 0, piece.id);
    const side = piece.sides[piece.answerSide];
    const crop = side.crop;
    assert.ok(crop.width > 0 && crop.height > 0, piece.id);
    assert.ok(crop.x >= 0 && crop.y >= 0, piece.id);
    assert.ok(crop.x + crop.width <= side.width, piece.id);
    assert.ok(crop.y + crop.height <= side.height, piece.id);
    if (piece.pieceKind === 'coin') {
      assert.deepEqual(crop, { x: 0, y: 0, width: side.width, height: side.height }, piece.id);
      assert.ok(side.maxDisplayWidth <= side.width, piece.id);
    }
    for (const region of piece.regions) {
      assert.ok(region.x >= 0 && region.y >= 0, piece.id);
      assert.ok(region.width >= 20 && region.height >= 20, piece.id);
      assert.ok(region.x + region.width <= 100, piece.id);
      assert.ok(region.y + region.height <= 100, piece.id);
    }
  }
});

test('shuffle keeps every piece exactly once', () => {
  const shuffled = shuffle(PLAYABLE_PIECES, () => 0.42);
  assert.equal(shuffled.length, PLAYABLE_PIECES.length);
  assert.equal(new Set(shuffled.map((piece) => piece.id)).size, PLAYABLE_PIECES.length);
  assert.deepEqual(
    shuffled.map((piece) => piece.id).sort(),
    PLAYABLE_PIECES.map((piece) => piece.id).sort(),
  );
});

test('play screen contains no fixed-session or scoring language', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/game.js', import.meta.url), 'utf8')}`;
  assert.equal(/\b(points?|scores?|streaks?|rankings?|timer)\b/i.test(visible), false);
  assert.equal(/note\s+\d+\s+of\s+\d+|round-count|round-progress/i.test(visible), false);
  assert.match(visible, /Can you spot the error\?/);
  assert.match(visible, />Next</);
  assert.equal(/Next (?:note|piece)/i.test(visible), false);
});

test('collection copy contains only the playable coins and bills', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`;
  assert.match(visible, /Coins and bills/);
  assert.equal(/Reference records|Candidates awaiting material|research lead|permission gap|maintenance/i.test(visible), false);
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
