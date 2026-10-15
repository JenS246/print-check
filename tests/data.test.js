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

test('museum crops are playable while the die cap remains held from play', () => {
  assert.equal(COLLECTION_PIECES.length, 11);
  const dieCap = COLLECTION_PIECES.find((piece) => piece.id === 'jefferson-nickel-die-cap');
  assert.equal(dieCap?.playable, false);
  assert.equal(PLAYABLE_PIECES.includes(dieCap), false);
  const museumPieces = COLLECTION_PIECES.filter((piece) => piece.sides.some((side) => side.croppedFromGroup));
  assert.equal(museumPieces.length, 3);
  assert.ok(museumPieces.every((piece) => piece.playable === true));
  assert.ok(museumPieces.every((piece) => PLAYABLE_PIECES.includes(piece)));
});

test('off-center strike uses the concise production wording', () => {
  const offCenter = COLLECTION_PIECES.find((piece) => piece.id === 'lincoln-cent-off-center');
  assert.equal(
    offCenter?.answerExplanation,
    'The design sits near one edge, leaving much of the coin blank. The blank was off-center when the design was struck.',
  );
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
  assert.match(visible, /href="notes\.html\?rev=33">Collection/);
});

test('the How to play dialog has exact guidance, real shortcuts, and modal focus safeguards', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const expected = [
    'Spot the error in real US coins and bills.',
    'Tap the part of the coin or bill that looks wrong.',
    'Need help? Choose Show error.',
    'Choose Next to try another.',
    'Every photograph shows real US currency with a documented production error.',
  ];
  const visibleText = html.replace(/<[^>]+>/g, '');
  let position = -1;
  for (const sentence of expected) {
    const nextPosition = visibleText.indexOf(sentence);
    assert.ok(nextPosition > position, sentence);
    position = nextPosition;
  }
  assert.match(html, /<details class="keyboard-controls">/);
  assert.equal(/<details class="keyboard-controls"\s+open/.test(html), false);
  assert.match(html, /press 1 through 9/);
  assert.match(html, /Press Escape to close this panel/);
  assert.match(html, /class="help-dialog-art" aria-hidden="true"/);
  assert.match(html, /assets\/art\/watercolor\/uneven-coin-stack\.png/);
  assert.match(game, /keyboardControls\.open = false/);
  assert.match(game, /helpDialog\.addEventListener\('close', \(\) => helpButton\.focus/);
  assert.match(game, /event\.key !== 'Tab'/);
  assert.match(styles, /\.help-dialog\s*\{[^}]*background-color:\s*var\(--paper\)[^}]*box-shadow:/s);
  assert.match(styles, /\.help-instructions p\s*\{[^}]*font-size:\s*22px/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.help-instructions p\s*\{[^}]*font-size:\s*20px/s);
});

test('collection copy contains only documented coins and bills', async () => {
  const { readFile } = await import('node:fs/promises');
  const visible = `${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`;
  assert.match(visible, /Coins and bills/);
  assert.match(visible, />Previous</);
  assert.match(visible, />Next</);
  assert.match(visible, />Play</);
  assert.match(visible, /All coins and bills/);
  assert.match(visible, /gallerySection\('Paper money', notes, 'notes'\)/);
  assert.match(visible, /gallerySection\('Coins', coins, 'coins'\)/);
  assert.match(visible, /<h3>\$\{piece\.errorName\}<\/h3>[\s\S]*<p>\$\{identification\(piece\)\}<\/p>/);
  assert.match(visible, /link\.href = `#\$\{piece\.id\}`/);
  assert.match(visible, /replaceChildren\(pieceArticle\(piece\)\)/);
  assert.match(visible, /<details class="source-details collection-credit">/);
  assert.match(visible, /Loading collection\.\.\./);
  assert.match(visible, />Retry</);
  assert.match(visible, /import\('\.\/src\/collection\.js\?v=33'\)/);
  assert.match(visible, /href="notes\.html\?rev=33"/);
  assert.match(visible, /id="help-button"[^>]*>How to play<\/button>/);
  assert.match(visible, /id="help-dialog"/);
  assert.match(visible, /keyboardControls\.open = false/);
  assert.equal(/Reference records|Candidates awaiting material|research lead|permission gap|maintenance/i.test(visible), false);
});

test('collection album mounts preserve every entry and show the documented close-up', async () => {
  const { readFile } = await import('node:fs/promises');
  const collection = await readFile(new URL('../src/collection.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.equal(COLLECTION_PIECES.filter((piece) => piece.pieceKind === 'note').length, 4);
  assert.equal(COLLECTION_PIECES.filter((piece) => piece.pieceKind === 'coin').length, 7);
  assert.match(collection, /specimen-mount-\$\{piece\.pieceKind\}/);
  assert.match(styles, /\.specimen-mount-note\s*\{[^}]*aspect-ratio:\s*1\.62 \/ 1/s);
  assert.match(styles, /\.specimen-mount-coin\s*\{[^}]*aspect-ratio:\s*1 \/ 1/s);
  assert.match(styles, /\.collection-image-group-gallery figure\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.collection-image-group-gallery\.collection-image-pair figure\s*\{[^}]*width:\s*auto/s);
  assert.match(collection, /function detailCloseup/);
  assert.match(collection, /sourceCrop\.x \+ \(crop\.x \/ 100\)/);
  assert.match(styles, /\.collection-closeup-crop/);
  assert.equal(/createElement\(['"]canvas|sharpen|filter\s*=/.test(collection), false);
});

test('the game fits the stage to each photograph and expands answers naturally', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  const game = await readFile(new URL('../src/game.js', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(html, /id="response-slot"/);
  assert.match(game, /pieceKind === 'note' \? 880/);
  assert.match(game, /pieceKind === 'coin'[^\n]*\? 460/);
  assert.match(styles, /min-height:\s*100dvh/);
  assert.equal(/\.page-shell\s*\{[^}]*min-height/s.test(styles), false);
  assert.match(styles, /\.response-slot\s*\{[^}]*min-height:\s*0/s);
  assert.match(styles, /\.image-frame\s*\{[^}]*border:\s*0/s);
  assert.match(game, /loadToken/);
  assert.match(game, /preloadNextPiece/);
  assert.match(game, /requestIdleCallback/);
  assert.match(game, /game-side-images-stack/);
  assert.match(game, /gameScreen\.style\.width = `\$\{fitWidth \+ panelChromeWidth\}px`/);
  assert.equal(/overflow:\s*hidden[^;]*;\s*\/\* page/i.test(styles), false);
});

test('the public composition uses only the supplied transparent watercolor decorations', async () => {
  const { access, readFile } = await import('node:fs/promises');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const html = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}`;
  const files = ['open-coin-envelope.png', 'folded-banknote.png', 'overlapping-coins.png', 'uneven-coin-stack.png'];
  for (const file of files) {
    await access(new URL(`../assets/art/watercolor/${file}`, import.meta.url));
    assert.match(`${html}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`, new RegExp(file.replace('.', '\\.')));
  }
  assert.match(html, /class="decorative-art game-art" aria-hidden="true"/);
  assert.match(html, /class="decorative-art collection-art" aria-hidden="true"/);
  assert.match(html, /class="art-piece game-art-stack"[^>]*uneven-coin-stack\.png/);
  assert.match(styles, /\.decorative-art\s*\{[^}]*position:\s*absolute[^}]*overflow:\s*hidden[^}]*pointer-events:\s*none/s);
  assert.match(styles, /\.art-piece\s*\{[^}]*opacity:\s*0\.82[^}]*pointer-events:\s*none/s);
  assert.equal((html.match(/class="art-piece game-art-[^"]+"/g) ?? []).length, 8);
  assert.match(styles, /\.game-art-envelope\s*\{[^}]*width:\s*680px/s);
  assert.match(styles, /\.game-art-bill\s*\{[^}]*width:\s*560px/s);
  assert.match(styles, /\.game-art-coins\s*\{[^}]*width:\s*390px/s);
  assert.match(styles, /\.game-art-stack\s*\{[^}]*top:\s*126px[^}]*width:\s*380px/s);
  assert.match(styles, /\.game-art-stack-low\s*\{[^}]*top:\s*582px[^}]*width:\s*280px/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.game-art-mobile\s*\{[^}]*width:\s*330px[\s\S]*\.game-art-envelope\s*\{[^}]*width:\s*380px/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.decorative-art \.art-piece \{ display:\s*none; \}[\s\S]*\.game-art-mobile/s);
  assert.equal(/page-decorations|class="decoration |coin-envelope\.svg|coin-stack\.svg|overlapping-coins\.svg|folded-bill\.svg/.test(html), false);
  assert.equal(/\.page-decorations|\.decoration-envelope|\.decoration-stack/.test(styles), false);
});

test('the title uses two ink colors without decorative coin animation', async () => {
  const { readFile } = await import('node:fs/promises');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  const html = `${await readFile(new URL('../index.html', import.meta.url), 'utf8')}\n${await readFile(new URL('../notes.html', import.meta.url), 'utf8')}`;
  const scripts = `${await readFile(new URL('../src/game.js', import.meta.url), 'utf8')}\n${await readFile(new URL('../src/collection.js', import.meta.url), 'utf8')}`;
  assert.match(html, /class="title-print">Print</);
  assert.match(html, /class="title-check-front">Check</);
  assert.match(styles, /\.title-check[^}]*color:\s*#963b24/s);
  assert.match(styles, /translate\(2px, 2px\)/);
  assert.equal(/title-coin|title-coin-flip/.test(`${html}\n${styles}\n${scripts}`), false);
});

test('museum crops have honest archived source wording and remain playable', async () => {
  const { readFile } = await import('node:fs/promises');
  const museumPieces = COLLECTION_PIECES.filter((piece) => piece.sides.some((side) => side.croppedFromGroup));
  assert.equal(museumPieces.length, 3);
  assert.ok(museumPieces.every((piece) => piece.sourceLabel === 'Archived original museum photograph'));
  assert.ok(museumPieces.every((piece) => piece.documentationLabel === 'ANA exhibit documentation'));
  assert.ok(museumPieces.every((piece) => /crops the original group photograph/i.test(piece.rights.detail)));
  assert.ok(museumPieces.every((piece) => piece.playable === true));
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
  assert.match(styles, /--paper:\s*#fffcf4/);
  assert.match(styles, /--ink:\s*#302820/);
  assert.match(styles, /--accent:\s*#a83d24/);
  assert.match(styles, /--decor:\s*#76541e/);
  assert.equal(/gradient|drop-shadow/i.test(styles), false);
  assert.match(styles, /box-shadow:\s*0 7px 14px rgb\(82 55 25 \/ 0\.2\)/);
  assert.match(styles, /paper-grain\.svg/);
});

test('the specimen sheet and requested large type are explicit', async () => {
  const { readFile } = await import('node:fs/promises');
  const styles = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
  assert.match(styles, /\.game-screen\s*\{[^}]*width:\s*fit-content[^}]*background:\s*var\(--paper\)/s);
  assert.equal(/class="page-shell"/.test(await readFile(new URL('../index.html', import.meta.url), 'utf8')), false);
  assert.match(styles, /\.site-name\s*\{[^}]*font-size:\s*68px/s);
  assert.match(styles, /\.prompt h1\s*\{[^}]*font-size:\s*32px/s);
  assert.match(styles, /\.primary-button\s*\{\s*background:\s*var\(--accent\);\s*color:\s*var\(--white\)/);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.site-name\s*\{[^}]*font-size:\s*48px/s);
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.prompt h1\s*\{[^}]*font-size:\s*28px/s);
});

test('paired sides and clean rust SVG answer outlines are available', async () => {
  const { readFile } = await import('node:fs/promises');
  const paired = PLAYABLE_PIECES.find((piece) => piece.id === 'lincoln-cent-broadstrike-indent');
  assert.equal(paired?.showSidesTogether, true);
  const postage = PLAYABLE_PIECES.find((piece) => piece.id === 'fractional-5-cent-inverted-reverse');
  assert.equal(postage?.showSidesTogether, true);
  assert.equal(postage?.stackOnNarrow, true);
  assert.equal(postage?.sides.length, 2);
  assert.equal(postage?.answerSide, 1);
  assert.ok(postage?.sides.every((side) => side.image === 'assets/notes/fr1230-inverted-reverse.jpg'));
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
