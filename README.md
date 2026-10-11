# Print Check

Print Check is a five-round browser game about documented production errors on genuine U.S. paper currency. A player studies a real specimen, places a marker on the visible error, and checks a manually reviewed image-relative answer region.

The interface is a visual companion to [ORIGINS](https://jens246.github.io/origin-money-game/): Newsreader display type, IBM Plex Sans Condensed controls, archival gray-green surfaces, restrained red accents, and a specimen-first layout.

## How it works

- Every session shuffles all five verified notes and presents each note exactly once.
- Each record lives in `data/notes.js`, separate from the game logic.
- Gameplay crops the grading label so it cannot reveal the error category before the player answers.
- One error-bearing scan is used per specimen so each entry stays within Heritage's stated one-image noncommercial article allowance.
- Pointer guesses use percentages of the displayed image canvas, so markers and answer outlines stay aligned through resize and zoom.
- An alternate 3 by 3 numbered-region mode supports keyboard play with the number keys.
- Incorrect answers can be moved and checked again. Reveal forfeits the point for that round.
- After a round, the player sees the plain-language error name, a source-limited explanation, series designation, image credit, original scan, and auction record.
- `notes.html` is the collection page with both uncropped scans, specimen metadata, evidence links, and reuse terms.
- There are no accounts, cookies, analytics, ads, paid services, or backend.

## Verified corpus

The launch corpus is deliberately limited to five notes from *The Conway Collection of Error Notes, Part I*, an article credited to Heritage Auctions and mirrored by Mint Error News. Each error-bearing scan shows the same certified specimen described by a specimen-specific Heritage auction lot:

1. Series 1985 $20 Federal Reserve Note, Type II inverted back.
2. Series 2006 $1 Federal Reserve Note, Type II inverted back.
3. Series 1988A $1 Federal Reserve Note, foldover error.
4. Series 2003 $1 Federal Reserve Note, printed fold error.
5. Series 2009 $10 Federal Reserve Note, foldover with retained selvage.

The records do not convert a Federal Reserve district into a printing facility. An actual printing date is not supplied when the source only provides a series designation. Specimens without paired usable images and exact documentation were excluded.

## Image permission and currency-image handling

Heritage Auctions' Website and Mobile App Use Agreement states that one credited image may accompany a noncommercial article without separate written consent. The collection page treats each note as its own educational article, credits Heritage Auctions, links the auction record, and links the use agreement. Mint Error News is identified as the host of the Heritage-authored article. The site is noncommercial.

The game shows one side at a time. The grading label is cropped only in the gameplay viewport; the original source file remains intact and is available after reveal. See the Bureau of Engraving and Printing's [currency image use guidance](https://www.bep.gov/currency/currency-image-use) before republishing or materially changing the presentation.

The application code is MIT licensed. The currency scans are not relicensed by this repository.

## Run locally

No build step or dependency install is required.

```bash
npm run dev
```

Open [http://localhost:4178](http://localhost:4178).

## Test

```bash
npm test
npm run check
```

The tests cover unique rounds, evidence fields, answer-region bounds, grading-label crops, and the visible-copy dash constraint inherited from the visual system.

## Accessibility

- Semantic headings, buttons, dialogs, lists, and status regions
- 44px minimum controls and strong focus indicators
- Pointer and numbered-region answer modes
- Number-key selection in alternate mode
- Color-independent text feedback and outlined answer regions
- System light and dark appearance
- Reduced-motion support
- Explicit phone and desktop layouts

## Important URLs and services

- Production site: https://jens246.github.io/print-check/
- Collection page: https://jens246.github.io/print-check/notes.html
- Source repository: https://github.com/JenS246/print-check
- Visual reference: https://jens246.github.io/origin-money-game/
- Specimen documentation: https://currency.ha.com/
- Image article host: https://www.minterrornews.com/news-12-15-20-the-conway-collection-of-error-notes-part-1.html
- Image reuse terms: https://domains.ha.com/c/ref/website-use-agreement.zx?ic=footer-website-use-agreement-121117
- Currency image guidance: https://www.bep.gov/currency/currency-image-use
- Hosting: GitHub Pages
- Backend services: none

## Adding a note

Add one object to `data/notes.js` only after confirming all of the following:

1. The image depicts a genuine U.S. paper currency note.
2. The cited record authenticates the exact pictured specimen.
3. The documented error is visible in the available image.
4. Image reuse is expressly permitted.
5. Series and actual printing date are stored separately.
6. Any production facility is explicitly documented, not inferred from a district seal.
7. A second side is added only when its reuse permission is independently sufficient for the published context.
8. Answer regions are manually checked against the gameplay crop at phone and desktop sizes.
