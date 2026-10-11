# Print Check

Print Check is a five-round browser game about documented production errors on genuine U.S. paper currency. Its interface is a compact bank-vault inspection desk: five stateful steel drawers sit beside a felt examination surface where players place a marker on the visible error.

The project is deliberately small and rights-aware. Six records are eligible for randomized rounds. Fifteen previously researched Heritage specimens remain in the collection as reference-only records because Heritage's limited noncommercial article allowance does not clearly authorize cropped interactive gameplay.

## How it works

- Five randomized notes per session, without repeats
- Category-diverse selection before duplicate categories are considered
- Local recent-note memory that prefers the unseen specimen when the small corpus permits it
- Pointer marker plus a keyboard-friendly numbered-region mode
- Zoom to 300 percent, drag-to-pan, and Reset view
- Incorrect guesses can be moved and checked again
- One point for a correct answer unless Reveal was used
- Per-round loading state, disabled controls until load, Retry, and Skip
- Image-relative crops, markers, and answer regions that remain aligned through resize and zoom
- Static HTML, CSS, and JavaScript with no accounts, tracking, backend, or dependencies

## Corpus and rights review

The playable corpus uses two image sources:

1. A public-domain Smithsonian National Numismatic Collection scan of a First Issue 5-cent Postage Currency note, Fr. 1230. The Wikimedia Commons record explicitly identifies the inverted reverse and includes a reviewed VRT permission ticket.
2. Five labeled crops from David Shankbone's Creative Commons photograph of the American Numismatic Association Money Museum error-note display. The visible specimens show shifted overprints, a foldover, an offset transfer, and mismatched serial numbers. The complete photograph stays available from each record.

The museum photograph does not make every series line legible. Those records say "Series not legible in the source photograph" instead of guessing. The site also does not infer a printing facility from a Federal Reserve district.

The fifteen Heritage records retain their original specimen links and scans on the collection page. They are excluded from gameplay and labeled reference-only. They can be reconsidered if broader written permission is obtained.

The collection register also tracks three PMG research leads: a Series 1977 $50 gutter fold, a Series 1974 $1 offset print, and a Series 1988A $10 doubled first printing. These are not playable because written display permission, exact original specimen records, and suitable high-resolution images are still required.

Currency reproductions remain subject to U.S. law. Review the Bureau of Engraving and Printing's [currency image use guidance](https://www.bep.gov/currency/currency-image-use) before republishing.

## Run locally

No build or dependency install is required.

```bash
npm run dev
```

Open [http://localhost:4178](http://localhost:4178).

## Test

```bash
npm test
npm run check
```

The tests cover the playable/reference split, local image availability, reuse metadata, crop bounds, answer-region bounds, category-diverse selection, hit testing, and visible-copy constraints.

## Accessibility

- Semantic headings, buttons, dialogs, figures, details, and status regions
- Large controls and visible focus indicators
- Pointer and numbered keyboard answer modes
- Number-key shortcuts in alternate mode
- Text feedback in addition to color
- Reduced visual ornament and no required animation
- Phone and desktop layouts

## Important URLs and services

- Production site: https://jens246.github.io/print-check/
- Collection page: https://jens246.github.io/print-check/notes.html
- Source repository: https://github.com/JenS246/print-check
- Visual reference: https://jens246.github.io/origin-money-game/
- Smithsonian scan: https://commons.wikimedia.org/wiki/File:US-Fractional_(1st_Issue)-$0.05-Fr.1230.jpg
- ANA museum photograph: https://www.flickr.com/photos/shankbone/3200806102
- Heritage use agreement: https://domains.ha.com/c/ref/website-use-agreement.zx?ic=footer-website-use-agreement-121117
- Hosting: GitHub Pages
- Backend services: none

## Adding a note

Add a playable record only after confirming all of the following:

1. The image depicts a genuine U.S. paper currency note.
2. The cited record authenticates or institutionally documents the exact pictured specimen.
3. The documented error is visible in the image.
4. Image reuse and any required cropping are expressly permitted.
5. Series and actual printing date are stored separately, with unknown details left unknown.
6. A production facility is included only when the source explicitly documents it.
7. Front and back views are paired only when they show the same specimen and preserve the evidence needed to judge orientation.
8. Answer regions are manually checked at phone and desktop sizes.
