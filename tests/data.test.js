import assert from 'node:assert/strict';
import test from 'node:test';
import { COLLECTION_PIECES, PLAYABLE_COINS, PLAYABLE_NOTES, PLAYABLE_PIECES } from '../data/notes.js';
import { markerHitsRegions, shuffle } from '../src/rounds.js';

test('the game rotation contains only playable records', () => {
  assert.equal(PLAYABLE_PIECES.length, 7);
  assert.equal(PLAYABLE_NOTES.length, 1);
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

test('soft museum crops and the die cap remain documented but are held from play', () => {
  assert.equal(COLLECTION_PIECES.length, 11);
  const dieCap = COLLECTION_PIECES.find((piece) => piece.id === 'jefferson-nickel-die-cap');
  assert.equal(dieCap?.playable, false);
  assert.equal(PLAYABLE_PIECES.includes(dieCap), false);
  const museumPieces = COLLECTION_PIECES.filter((piece) => piece.sides.some((side) => side.croppedFromGroup));
  assert.equal(museumPieces.length, 3);
  assert.ok(museumPieces.every((piece) => piece.playable === false));
  assert.ok(museumPieces.every((piece) => !PLAYABLE_PIECES.includes(piece)));
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
  assert.equal(/<button[^>]*>\s*(?:Check|Hint)\s*<|Zoom in|Zoom out|Reset view|number-grid|margin-doodle/i.test(visible), false);
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
  assert.equal(/\.page-shell\s*\{[^}]*min-height/s.test(styles), false);
  assert.match(styles, /\.response-slot:has\(/);
  assert.match(game, /loadToken/);
  assert.match(game, /preloadNextPiece/);
  assert.match(game, /requestIdleCallback/);
  assert.equal(/overflow:\s*hidden[^;]*;\s*\/\* page/i.test(styles), false);
});

test('the asymmetric money drawings use the requested ink and remain inert', async () => {
  const { access, readFile } = await import('node:fs/promises');
  const artFiles = [
    'coin-stack.svg',
    'loose-coins.svg',
    'coin-envelope.svg',
    'folded-bill.svg',
  ];
  for (const file of artFiles) {
    await access(new URL(`../assets/art/${file}`, import.meta.url));
    const artwork = await readFile(new URL(`../assets/art/${file}`, import.meta.url), 'utf8');
    assert.match(artwork, /stroke="#76541E"/, file);
    assert.equal(/<text|[0-9]\s*(?:cent|dollar)/i.test(artwork), false, file);
  }
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const html = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}`;
  for (const file of artFiles) assert.match(html, new RegExp(file.replace('.', '\\.')));
  assert.match(styles, /opacity:\s*0\.38/);
  assert.match(styles, /pointer-events:\s*none/);
  assert.match(html, /aria-hidden="true"/);
  assert.equal((html.match(/class="decoration /g) ?? []).length, 8);
  assert.match(styles, /\.decoration-envelope \{ bottom:\s*1\.5%; left:\s*-6px;/);
  assert.match(styles, /\.decoration-coins-loose \{ bottom:\s*-0\.5%; left:\s*86px;/);
  assert.match(styles, /\.decoration-folded-bill \{ top:\s*8%; right:\s*-12px;/);
  assert.match(styles, /\.decoration-stack \{ top:\s*39%; left:\s*25px;/);
});

test('the title uses two ink colors and a reduced-motion-safe Next flip', async () => {
  const { access, readFile } = await import('node:fs/promises');
  await access(new URL('../assets/art/title-coin.svg', import.meta.url));
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const html = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}`;
  const scripts = `${await readFile(new URL('../src/game.js', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`;
  assert.match(html, /class="title-print">Print</);
  assert.match(html, /class="title-check-front">Check</);
  assert.match(styles, /\.title-check[^}]*color:\s*#963b24/s);
  assert.match(styles, /translate\(2px, 2px\)/);
  assert.match(styles, /animation:\s*title-coin-flip 400ms/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.title-coin\.is-flipping \{ animation:\s*none; \}/);
  assert.match(scripts, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/);
  assert.match(scripts, /classList\.add\('is-flipping'\)/);
});

test('museum crops have honest archived source wording and remain in Collection', async () => {
  const { readFile } = await import('node:fs/promises');
  const museumPieces = COLLECTION_PIECES.filter((piece) => piece.sides.some((side) => side.croppedFromGroup));
  assert.equal(museumPieces.length, 3);
  assert.ok(museumPieces.every((piece) => piece.sourceLabel === 'Archived original museum photograph'));
  assert.ok(museumPieces.every((piece) => piece.documentationLabel === 'ANA exhibit documentation'));
  assert.ok(museumPieces.every((piece) => /crops the original group photograph/i.test(piece.rights.detail)));
  assert.ok(museumPieces.every((piece) => piece.playable === false));
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
  assert.match(styles, /--page:\s*#d6ab45/);
  assert.match(styles, /--paper:\s*#fff9ed/);
  assert.match(styles, /--ink:\s*#302820/);
  assert.match(styles, /--accent:\s*#b94726/);
  assert.match(styles, /--decor:\s*#76541e/);
  assert.equal(/gradient|drop-shadow/i.test(styles), false);
  assert.match(styles, /box-shadow:\s*0 8px 14px rgb\(82 55 25 \/ 0\.18\)/);
  assert.match(styles, /paper-grain\.svg/);
});

test('the drawing-paper surface and requested large type are explicit', async () => {
  const { readFile } = await import('node:fs/promises');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(styles, /\.page-shell\s*\{[^}]*background-color:\s*var\(--paper\)/s);
  assert.match(styles, /\.site-name\s*\{[^}]*font-size:\s*58px/s);
  assert.match(styles, /\.prompt h1\s*\{[^}]*font-size:\s*32px/s);
  assert.match(styles, /\.primary-button\s*\{\s*background:\s*var\(--accent\);\s*color:\s*var\(--white\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.site-name\s*\{[^}]*font-size:\s*42px/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.prompt h1\s*\{[^}]*font-size:\s*28px/s);
});

test('paired sides and clean rust SVG answer outlines are available', async () => {
  const { readFile } = await import('node:fs/promises');
  const paired = PLAYABLE_PIECES.find((piece) => piece.id === 'lincoln-cent-broadstrike-indent');
  assert.equal(paired?.showSidesTogether, true);
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(game, /createElementNS\('http:\/\/www\.w3\.org\/2000\/svg'/);
  assert.match(styles, /--rust:\s*#96331f/);
  assert.match(styles, /stroke:\s*var\(--rust\)/);
  assert.match(styles, /stroke-width:\s*1\.5/);
});

test('the doubled-die answer uses a crop from the original photograph', async () => {
  const { readFile } = await import('node:fs/promises');
  const doubledDie = PLAYABLE_PIECES.find((piece) => piece.id === '1955-lincoln-cent-doubled-die-obverse');
  assert.deepEqual(doubledDie?.revealCrop, {
    side: 0,
    x: 64,
    y: 67,
    width: 34,
    height: 25,
    label: 'Close-up of the doubled date',
  });
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  assert.match(game, /function renderAnswerCloseup/);
  assert.match(game, /sourceCrop/);
  assert.equal(/createElement\(['"]canvas|sharpen|filter\s*=/.test(game), false);
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
