# Print Check

Print Check is a casual browser activity about documented production errors on genuine U.S. paper currency. It opens directly to a note, asks the visitor to mark the error, and continues through a shuffled collection for as long as the visitor wants to play.

The interface is intentionally small and rights-aware. Seven specimens are playable. Fourteen additional authenticated auction specimens remain on the Notes page as reference records because their image terms do not clearly authorize cropped interactive use.

## How it works

- One note at a time, with Next note always available
- A shuffled queue that shows every playable specimen before reshuffling
- Pointer marker plus a keyboard-friendly numbered-region mode
- Zoom to 300 percent, drag-to-pan, and Reset view
- Unlimited guesses, an optional hint, and Show error
- Image-relative crops, markers, and answer regions that stay aligned through resize and zoom
- Loading, retry, and next-note fallbacks for image failures
- Static HTML, CSS, and JavaScript with no accounts, tracking, backend, or dependencies

## Corpus and rights review

The playable corpus uses three image sources:

1. A public-domain Smithsonian National Numismatic Collection scan of a First Issue 5-cent Postage Currency note, Fr. 1230. The Wikimedia Commons record identifies the inverted reverse and includes a reviewed VRT permission ticket.
2. Five labeled crops from David Shankbone's Creative Commons photograph of the American Numismatic Association Money Museum error-note display. The visible specimens show shifted overprints, a foldover, an offset transfer, and mismatched serial numbers.
3. A public-domain closeup of the Series 1996 Del Monte note. PMG and Heritage document this exact specimen as an obstructed printing error with the sticker retained and official third-print elements printed over it.

The museum photograph does not make every series line legible. Those records say "Series not legible in the source photograph" instead of guessing. The site also does not infer a printing facility from a Federal Reserve district.

The fourteen remaining Heritage records retain their specimen links and images on the collection page. They are excluded from play and labeled reference-only. They can be reconsidered if broader written permission is obtained or a separately reusable scan is found.

The candidate register contains ten documented leads. Three are PMG Error Note Chronicles awaiting authorized images and exact records. Seven are exact Smithsonian specimens whose records document an error but do not currently provide downloadable object media suitable for play.

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

The tests cover the playable/reference split, local image availability, reuse metadata, crop bounds, answer-region bounds, shuffled collection integrity, hit testing, removed fixed-session language, and visible-copy constraints.

## Accessibility

- Semantic headings, buttons, dialogs, figures, details, and status regions
- 20px minimum body text on phones and 22px controls
- Large controls and visible focus indicators
- Pointer and numbered keyboard answer modes
- Number-key shortcuts in alternate mode
- Text feedback in addition to color
- No required animation
- Self-hosted Patrick Hand display type with a readable sans-serif body face
- Phone and desktop layouts that wrap instead of shrinking text

## Important URLs and services

- Production site: https://jens246.github.io/print-check/
- Collection page: https://jens246.github.io/print-check/notes.html
- Source repository: https://github.com/JenS246/print-check
- Visual reference: https://jens246.github.io/origin-money-game/
- Smithsonian scan: https://commons.wikimedia.org/wiki/File:US-Fractional_(1st_Issue)-$0.05-Fr.1230.jpg
- ANA museum photograph: https://www.flickr.com/photos/shankbone/3200806102
- Del Monte image record: https://commons.wikimedia.org/wiki/File:Del_Monte_note.jpg
- Del Monte PMG documentation: https://www.pmgnotes.com/news/article/8844/del-monte-note-record-auction/
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
