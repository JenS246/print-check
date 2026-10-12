import assert from 'node:assert/strict';
import test from 'node:test';
import { COLLECTION_PIECES, PLAYABLE_COINS, PLAYABLE_NOTES, PLAYABLE_PIECES } from '../data/notes.js';
import { markerHitsRegions, shuffle } from '../src/rounds.js';

test('the game rotation contains only playable records', () => {
  assert.equal(PLAYABLE_PIECES.length, 10);
  assert.equal(PLAYABLE_NOTES.length, 4);
  assert.equal(PLAYABLE_COINS.length, 6);
  assert.equal(new Set(PLAYABLE_PIECES.map((piece) => piece.id)).size, PLAYABLE_PIECES.length);
  assert.ok(PLAYABLE_PIECES.every((piece) => piece.playable));
});

test('every record has specimen evidence, a local image, and a documented reuse basis', async () => {
  const { access } = await import('node:fs/promises');
  for (const piece of COLLECTION_PIECES) {
    assert.match(piece.sourceUrl, /^https:\/\//, piece.id);
    assert.ok(piece.imageCredit, piece.id);
    assert.ok(piece.rights?.label, piece.id);
    assert.match(piece.rights?.url, /^https:\/\//, piece.id);
    assert.ok(piece.answerExplanation, piece.id);
    assert.ok(piece.answerExplanation.split(/[.!?](?:\s|$)/).filter(Boolean).length >= 2, piece.id);
    assert.match(piece.pieceKind, /^(coin|note)$/, piece.id);
    assert.match(piece.errorProcess, /^(Minting|Printing) error$/, piece.id);
    for (const side of piece.sides) {
      await access(new URL(`../${side.image}`, import.meta.url));
    }
  }
});

test('the die cap remains documented in Collection but is held from play', () => {
  assert.equal(COLLECTION_PIECES.length, 11);
  const dieCap = COLLECTION_PIECES.find((piece) => piece.id === 'jefferson-nickel-die-cap');
  assert.equal(dieCap?.playable, false);
  assert.equal(PLAYABLE_PIECES.includes(dieCap), false);
});

test('playable crops and image-relative answer regions are valid', () => {
  for (const piece of PLAYABLE_PIECES) {
    assert.ok(piece.regions.length > 0, piece.id);
    assert.ok(piece.outlines.length > 0, piece.id);
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
    for (const outline of piece.outlines) {
      assert.ok(outline.x >= 0 && outline.y >= 0, piece.id);
      assert.ok(outline.width > 0 && outline.height > 0, piece.id);
      assert.ok(outline.x + outline.width <= 100, piece.id);
      assert.ok(outline.y + outline.height <= 100, piece.id);
    }
    const toleranceArea = piece.regions.reduce((sum, region) => sum + region.width * region.height, 0);
    const outlineArea = piece.outlines.reduce((sum, region) => sum + region.width * region.height, 0);
    assert.ok(outlineArea < toleranceArea, piece.id);
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

test('play screen is immediate and contains no fixed-session or scoring language', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/game.js', import.meta.url), 'utf8')}`;
  assert.equal(/\b(points?|scores?|streaks?|rankings?|timer)\b/i.test(visible), false);
  assert.equal(/note\s+\d+\s+of\s+\d+|round-count|round-progress/i.test(visible), false);
  assert.match(visible, />Tap the error\.</);
  assert.match(visible, />Next</);
  assert.equal(/Next (?:note|piece)/i.test(visible), false);
  assert.equal(/>Check<|>Hint<|Zoom in|Zoom out|Reset view|number-grid|margin-doodle/i.test(visible), false);
  assert.match(visible, /Try another spot/);
  assert.match(visible, /Enlarge image/);
  assert.match(visible, /You found it!/);
  assert.match(visible, /answer-title/);
});

test('collection copy contains only documented coins and bills', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`;
  assert.match(visible, /Coins and bills/);
  assert.match(visible, />Previous</);
  assert.match(visible, />Next</);
  assert.match(visible, />Play</);
  assert.match(visible, /All coins and bills/);
  assert.match(visible, /gallery\.replaceChildren\(\.\.\.COLLECTION_PIECES\.map\(galleryEntry\)\)/);
  assert.match(visible, /link\.href = `#\$\{piece\.id\}`/);
  assert.match(visible, /replaceChildren\(pieceArticle\(piece\)\)/);
  assert.match(visible, /<details class="source-details collection-credit">/);
  assert.equal(/Reference records|Candidates awaiting material|research lead|permission gap|maintenance/i.test(visible), false);
});

test('the game reserves response space and uses measured viewport height', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /id="response-slot"/);
  assert.match(game, /window\.visualViewport\?\.height/);
  assert.match(styles, /min-height:\s*100dvh/);
  assert.equal(/overflow:\s*hidden[^;]*;\s*\/\* page/i.test(styles), false);
});

test('the two production drawings use the requested ink, remain inert, and respond to narrow screens', async () => {
  const { access, readFile } = await import('node:fs/promises');
  await access(new URL('../assets/art/printing-press.svg', import.meta.url));
  await access(new URL('../assets/art/coin-press.svg', import.meta.url));
  const printingPress = await readFile(new URL('../assets/art/printing-press.svg', import.meta.url), 'utf8');
  const coinPress = await readFile(new URL('../assets/art/coin-press.svg', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(styles, /printing-press\.svg/);
  assert.match(styles, /coin-press\.svg/);
  assert.equal(/ink-roller\.svg|engraving-tools\.svg/.test(styles), false);
  assert.match(printingPress, /stroke="#80604D"/);
  assert.match(coinPress, /stroke="#80604D"/);
  assert.match(styles, /opacity:\s*0\.25/);
  assert.match(styles, /pointer-events:\s*none/);
  assert.match(styles, /@media \(min-width: 1200px\)/);
  assert.match(styles, /@media \(max-width: 1199px\)/);
});

test('museum crops have honest source wording and crop-aware enlargement', async () => {
  const { readFile } = await import('node:fs/promises');
  const museumPieces = PLAYABLE_NOTES.filter((piece) => piece.sides.some((side) => side.croppedFromGroup));
  assert.equal(museumPieces.length, 3);
  assert.ok(museumPieces.every((piece) => piece.sourceLabel === 'Original museum photograph'));
  assert.ok(museumPieces.every((piece) => piece.documentationLabel === 'ANA exhibit documentation'));
  assert.ok(museumPieces.every((piece) => /crops the original group photograph/i.test(piece.rights.detail)));
  assert.equal(COLLECTION_PIECES.some((piece) => piece.id === 'ana-1-offset-transfer'), false);
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const collection = await readFile(new URL('../src/collection.js', import.meta.url), 'utf8');
  assert.match(game, /className = 'full-image-crop'/);
  assert.match(collection, /usesWholePhotograph/);
  assert.equal(/View specimen source/.test(`${game}\n${collection}`), false);
  assert.ok(museumPieces.every((piece) => /Scanner48v2\.pdf$/.test(piece.documentationUrl)));
});

test('the public palette uses the warm flat colors', async () => {
  const { readFile } = await import('node:fs/promises');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(styles, /--paper:\s*#f3dcc8/);
  assert.match(styles, /--ink:\s*#352c27/);
  assert.match(styles, /--sage:\s*#e8c58f/);
  assert.match(styles, /--button:\s*#fff7ed/);
  assert.equal(/gradient|box-shadow|drop-shadow/i.test(styles), false);
});

test('paired sides and clean rust SVG answer outlines are available', async () => {
  const { readFile } = await import('node:fs/promises');
  const paired = PLAYABLE_PIECES.find((piece) => piece.id === 'lincoln-cent-broadstrike-indent');
  assert.equal(paired?.showSidesTogether, true);
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(game, /createElementNS\('http:\/\/www\.w3\.org\/2000\/svg'/);
  assert.match(styles, /--rust:\s*#a44732/);
  assert.match(styles, /stroke:\s*var\(--rust\)/);
  assert.match(styles, /stroke-width:\s*2/);
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
