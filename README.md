# Print Check

Print Check is a casual browser activity about documented production errors on genuine U.S. coins and paper currency. It opens directly to a coin or bill, asks the visitor to mark the error, and continues through a shuffled collection for as long as the visitor wants to play.

The interface is intentionally small and rights-aware. Ten specimens are playable: four paper notes and six coins. The public Collection also retains one documented die cap held out until a matched side view is available.

## How it works

- One coin or note at a time, with Next always available
- An album-style Collection with wide paper-money mounts, square coin mounts, and separate Paper money and Coins sections
- Larger Collection details with Previous, Next, All coins and bills navigation, and source-photo close-ups where they clarify the error
- A shuffled queue that shows every playable specimen before reshuffling
- Direct tap-to-answer with unlimited guesses and Show error
- Keyboard answers with the 1 through 9 keys, without a permanent region panel
- An accessible enlarged-image dialog with one Close control
- Image-relative crops, markers, generous answer targets, and separate precise reveal outlines that stay aligned through resizing
- Separate face and reverse crops from the original postage-currency scan, shown side by side on wide screens and stacked on narrow screens
- A source-photo close-up of the doubled date on the 1955 doubled-die cent in the answer reveal and Collection detail
- A stable image stage, tokenized image loading, and preloading of the next specimen
- A visible Collection loading state with a retry path if the data module fails
- Dynamic viewport fitting, safe-area support, and natural scrolling on short or enlarged-text layouts
- A compact ivory specimen mount sized around the active photograph, with the site header directly on the mustard background
- A two-color hand-drawn title; all navigation, controls, captions, and explanatory copy use Arial/Helvetica
- A loading state and an always-available Next fallback for image failures
- Static HTML, CSS, and JavaScript with no accounts, tracking, backend, or dependencies

Four original transparent watercolor-and-ink assets in `assets/art/watercolor/` frame the game and Collection without entering the specimen mounts. The game uses seven varied desktop placements and three mobile placements; the Collection continues the artwork through its margins and between album sections.

## Corpus and rights review

The note corpus uses two image sources:

1. A public-domain Smithsonian National Numismatic Collection scan of a First Issue 5-cent Postage Currency note, Fr. 1230. The Wikimedia Commons record identifies the inverted reverse and includes a reviewed VRT permission ticket.
2. Three labeled crops from David Shankbone's Creative Commons photograph of the American Numismatic Association Money Museum error-note display. The visible specimens show shifted overprints and a foldover. They are included in play at the project owner's request, though the 1600 by 1118 available file is softer than the other playable photographs. The direct Flickr page is currently unavailable, so the public source link uses a verified Internet Archive capture of the original page.
The archived Flickr record identifies a 3122 by 2182 original, but that original file could not be retrieved during the latest audit. The museum photograph does not make every series line legible, so those entries omit a series rather than guessing. The site also does not infer a printing facility from a Federal Reserve district.

The coin corpus uses seven credited Creative Commons photographs from Wikimedia Commons. Six are playable:

1. A Lincoln cent with a large off-center strike, photographed by Contactsmc under CC BY-SA 3.0.
2. A Lincoln Memorial cent with a flip-over multiple strike, photographed by Economicrealist under CC BY-SA 3.0.
3. Matched obverse and reverse photographs of one broadstruck and indented Lincoln Memorial cent, photographed by No Fear Of Change under CC BY-SA 4.0.
4. A 1984-P Jefferson nickel with a clipped planchet, photographed by Economicrealist under CC BY-SA 3.0.
5. A 2000 Lincoln Memorial cent with a brockage, photographed by Economicrealist under CC BY-SA 3.0.
6. A 1955 Lincoln Wheat cent with a doubled die obverse, photographed by Lost Dutchman Rare Coins under CC BY-SA 3.0 US with reviewed Wikimedia VRT permission.
7. A Jefferson nickel die cap, photographed by Economicrealist under CC BY-SA 4.0. It remains in Collection, but its top view does not demonstrate the raised shape clearly enough for fair gameplay.

The photographs are shown whole and without visual alteration. Each coin image is capped at its source width during normal viewing, so a small photograph is not enlarged until it blurs. The optional enlarged view also respects that cap; ordinary browser zoom remains available. The doubled-die close-up is a browser crop from the original photograph, not a reconstructed or sharpened image.

Reference records, the Del Monte detail, and candidates that are not ready for play live in `research/records.js`. The latest accepted and rejected image review is in `research/expansion-2026-10-11.md`. Neither file is imported by the game or Collection page.

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

The tests cover the playable collection, local image availability, reuse metadata, crop bounds, answer-region bounds, shuffled collection integrity, hit testing, removed fixed-session language, and visible-copy constraints.

## Accessibility

- Semantic headings, buttons, dialogs, figures, details, and status regions
- 20px minimum body text on phones and 22px controls
- Large controls and visible focus indicators
- Pointer answers and number-key keyboard answers
- Text feedback in addition to color
- No required animation
- Self-hosted Patrick Hand for the title and page headings; Arial/Helvetica for navigation, controls, captions, and body copy
- Phone and desktop layouts that wrap instead of shrinking text

## Important URLs and services

- Production site: https://jens246.github.io/print-check/
- Collection page: https://jens246.github.io/print-check/notes.html
- Source repository: https://github.com/JenS246/print-check
- Visual reference: https://jens246.github.io/origin-money-game/
- Smithsonian scan: https://commons.wikimedia.org/wiki/File:US-Fractional_(1st_Issue)-$0.05-Fr.1230.jpg
- ANA museum photograph: https://www.flickr.com/photos/shankbone/3200806102
- Off-center cent photograph: https://commons.wikimedia.org/wiki/File:Lincolncentoffcenter.jpg
- Flip-over multiple-strike photograph: https://commons.wikimedia.org/wiki/File:Flipover.jpg
- Broadstrike obverse photograph: https://commons.wikimedia.org/wiki/File:Mint_Error_LMC_Obverse.jpg
- Broadstrike reverse photograph: https://commons.wikimedia.org/wiki/File:Lincoln_Memorial_Cent_Mint_Error_Reverse.jpg
- Clipped-planchet nickel photograph: https://commons.wikimedia.org/wiki/File:Clipped_planchet.jpg
- Brockage cent photograph: https://commons.wikimedia.org/wiki/File:Brockage.jpg
- 1955 doubled-die cent photograph: https://commons.wikimedia.org/wiki/File:1955_doubled_die_Lincoln_cent.jpg
- Die-cap nickel photograph: https://commons.wikimedia.org/wiki/File:Die_cap.jpg
- Hosting: GitHub Pages
- Backend services: none

## Adding a piece

Add a playable record only after confirming all of the following:

1. The image depicts genuine U.S. paper currency or a genuine U.S. coin.
2. The cited record authenticates or institutionally documents the exact pictured specimen.
3. The documented error is visible in the image.
4. Image reuse and any required cropping are expressly permitted.
5. Note series and actual printing dates are stored separately; coin dates and mint marks are included only when visible or documented.
6. A printing or mint facility is included only when the source explicitly documents it.
7. Front and back views are paired only when they show the same specimen.
8. Answer regions are manually checked at phone and desktop sizes.
