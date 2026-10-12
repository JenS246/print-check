const FLICKR_SOURCE = 'https://www.flickr.com/photos/shankbone/3200806102';
const ANA_SUPPORT = 'https://www.sc-na.org/documents/Scanner48v2.pdf';
const ANA_IMAGE = 'assets/notes/ana-error-display.jpg';

const ANA_RIGHTS = {
  label: 'Creative Commons Attribution 2.0',
  url: 'https://creativecommons.org/licenses/by/2.0/',
  detail: 'David Shankbone published the museum photograph under a Creative Commons attribution license.',
};

function anaRecord({ id, denomination, crop, errorName, shortExplanation, hint, regions }) {
  return {
    id,
    pieceKind: 'note',
    errorProcess: 'Printing error',
    denomination,
    noteType: 'Federal Reserve Note',
    errorName,
    shortExplanation,
    hint,
    sides: [{ label: 'Exhibit photograph', image: ANA_IMAGE, width: 1600, height: 1118, crop }],
    answerSide: 0,
    regions,
    sourceUrl: FLICKR_SOURCE,
    documentationUrl: ANA_SUPPORT,
    documentationLabel: 'View the museum display reference',
    imageCredit: '“U.S. Currency Error Notes” by David Shankbone',
    rights: ANA_RIGHTS,
    playable: true,
  };
}

export const PLAYABLE_NOTES = [
  {
    id: 'fractional-5-cent-inverted-reverse',
    pieceKind: 'note',
    errorProcess: 'Printing error',
    denomination: '5 cents',
    noteType: 'First Issue U.S. Postage Currency',
    series: 'First Issue, issued 1862 to 1863',
    errorName: 'Inverted reverse',
    shortExplanation: 'The reverse is upside down relative to Jefferson on the face.',
    hint: 'Compare the direction of Jefferson with the words on the reverse below.',
    sides: [{
      label: 'Face and reverse',
      image: 'assets/notes/fr1230-inverted-reverse.jpg',
      width: 1500,
      height: 2103,
      crop: { x: 0, y: 0, width: 1500, height: 2103 },
    }],
    answerSide: 0,
    regions: [{ x: 9, y: 54, width: 82, height: 43 }],
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:US-Fractional_(1st_Issue)-$0.05-Fr.1230.jpg',
    documentationUrl: 'https://americanhistory.si.edu/collections/object-groups/national-numismatic-collection',
    documentationLabel: 'About the National Numismatic Collection',
    imageCredit: 'National Numismatic Collection, Smithsonian Institution; scanned by Godot13',
    rights: {
      label: 'Public domain; Wikimedia VRT permission confirmed',
      url: 'https://commons.wikimedia.org/wiki/File:US-Fractional_(1st_Issue)-$0.05-Fr.1230.jpg#Licensing',
      detail: 'The Commons record marks the scan public domain and includes a reviewed VRT permission ticket. Credit to the National Numismatic Collection is requested.',
    },
    playable: true,
  },
  anaRecord({
    id: 'ana-20-shifted-overprint', denomination: '$20', crop: { x: 850, y: 0, width: 700, height: 315 },
    errorName: 'Shifted seal and serial numbers',
    shortExplanation: 'The green seal and serial numbers sit too far to the right.',
    hint: 'Compare the green printing with Jackson and the right border.',
    regions: [{ x: 58, y: 18, width: 34, height: 24 }, { x: 63, y: 38, width: 25, height: 32 }],
  }),
  anaRecord({
    id: 'ana-5-foldover', denomination: '$5', crop: { x: 35, y: 385, width: 705, height: 320 },
    errorName: 'Foldover printing error',
    shortExplanation: 'A diagonal fold left a large blank area across the reverse.',
    hint: 'Trace the diagonal boundary between the printed green design and the blank paper.',
    regions: [{ x: 48, y: 2, width: 50, height: 94 }],
  }),
  anaRecord({
    id: 'ana-10-shifted-overprint', denomination: '$10', crop: { x: 860, y: 380, width: 710, height: 330 },
    errorName: 'Shifted seal and serial numbers',
    shortExplanation: 'The green seal and serial numbers sit too far to the right.',
    hint: 'Look at where the green elements sit in relation to Hamilton.',
    regions: [
      { x: 59, y: 18, width: 36, height: 24 },
      { x: 18, y: 52, width: 34, height: 24 },
      { x: 67, y: 34, width: 26, height: 38 },
    ],
  }),
  anaRecord({
    id: 'ana-1-offset-transfer', denomination: '$1', crop: { x: 10, y: 770, width: 735, height: 348 },
    errorName: 'Offset transfer on the back',
    shortExplanation: 'A reversed impression of the face appears across the back.',
    hint: 'This is the back of a one-dollar note. Look for face-side elements that do not belong there.',
    regions: [{ x: 5, y: 5, width: 90, height: 90 }],
  }),
  anaRecord({
    id: 'ana-5-mismatched-serials', denomination: '$5', crop: { x: 865, y: 760, width: 725, height: 358 },
    errorName: 'Mismatched serial numbers',
    shortExplanation: 'The two green serial numbers on the bill do not match.',
    hint: 'Read the digits in both green serial numbers and compare them.',
    regions: [{ x: 53, y: 13, width: 42, height: 35 }, { x: 6, y: 48, width: 43, height: 38 }],
  }),
];

const COIN_RIGHTS_3 = {
  label: 'Creative Commons Attribution-ShareAlike 3.0',
  url: 'https://creativecommons.org/licenses/by-sa/3.0/',
  detail: 'The photographer released the specimen photograph under CC BY-SA 3.0.',
};

const COIN_RIGHTS_4 = {
  label: 'Creative Commons Attribution-ShareAlike 4.0',
  url: 'https://creativecommons.org/licenses/by-sa/4.0/',
  detail: 'The photographer released both specimen views under CC BY-SA 4.0.',
};

export const PLAYABLE_COINS = [
  {
    id: 'lincoln-cent-off-center',
    pieceKind: 'coin',
    errorProcess: 'Minting error',
    denomination: '1 cent',
    noteType: 'Lincoln cent',
    errorName: 'Off-center strike',
    shortExplanation: 'The design sits near the edge, leaving much of the coin blank.',
    hint: 'Look for a large area of the coin that never received the design.',
    sides: [{ label: 'Obverse', image: 'assets/coins/lincoln-cent-off-center.jpg', width: 800, height: 600, crop: { x: 0, y: 0, width: 800, height: 600 }, maxDisplayWidth: 800 }],
    answerSide: 0,
    regions: [{ x: 24, y: 0, width: 63, height: 67 }],
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lincolncentoffcenter.jpg',
    documentationUrl: 'https://www.pcgs.com/news/the-popular-off-center-strike',
    documentationLabel: 'Read the PCGS error description',
    imageCredit: 'Contactsmc, via Wikimedia Commons',
    rights: COIN_RIGHTS_3,
    playable: true,
  },
  {
    id: 'lincoln-cent-flipover-multiple-strike',
    pieceKind: 'coin',
    errorProcess: 'Minting error',
    denomination: '1 cent',
    noteType: 'Lincoln Memorial cent',
    errorName: 'Flip-over multiple strike',
    shortExplanation: 'A second, upside-down partial strike crosses the lower half of the reverse.',
    hint: 'Look below ONE CENT for a second impression that curves across the first design.',
    sides: [{ label: 'Reverse', image: 'assets/coins/lincoln-cent-flipover-multiple-strike.jpg', width: 498, height: 289, crop: { x: 0, y: 0, width: 498, height: 289 }, maxDisplayWidth: 498 }],
    answerSide: 0,
    regions: [{ x: 30, y: 51, width: 48, height: 48 }],
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Flipover.jpg',
    documentationUrl: 'https://www.pcgs.com/news/doublestruck-mint-errors',
    documentationLabel: 'Read the PCGS error description',
    imageCredit: 'Economicrealist, via Wikimedia Commons',
    rights: COIN_RIGHTS_3,
    playable: true,
  },
  {
    id: 'lincoln-cent-broadstrike-indent',
    pieceKind: 'coin',
    errorProcess: 'Minting error',
    denomination: '1 cent',
    noteType: 'Lincoln Memorial cent',
    errorName: 'Broadstrike with an indent',
    shortExplanation: 'The coin spread beyond a normal round rim, with a large curved indent across the face.',
    hint: 'Trace the outside edge. A normal cent should be round and contained by a rim.',
    sides: [
      { label: 'Obverse', image: 'assets/coins/lincoln-cent-broadstrike-obverse.jpg', width: 1924, height: 1899, crop: { x: 0, y: 0, width: 1924, height: 1899 }, maxDisplayWidth: 900 },
      { label: 'Reverse', image: 'assets/coins/lincoln-cent-broadstrike-reverse.jpg', width: 1994, height: 1983, crop: { x: 0, y: 0, width: 1994, height: 1983 }, maxDisplayWidth: 900 },
    ],
    answerSide: 0,
    regions: [{ x: 6, y: 0, width: 88, height: 44 }, { x: 0, y: 35, width: 100, height: 65 }],
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mint_Error_LMC_Obverse.jpg',
    documentationUrl: 'https://commons.wikimedia.org/wiki/File:Lincoln_Memorial_Cent_Mint_Error_Reverse.jpg',
    documentationLabel: 'View the matched reverse photograph',
    supportingUrl: 'https://www.ngccoin.com/news/article/9300/mint-error-coin-chronicles-ngc-broadstrikes/',
    supportingLabel: 'Read the NGC error description',
    imageCredit: 'No Fear Of Change, via Wikimedia Commons',
    rights: COIN_RIGHTS_4,
    playable: true,
  },
];

export const PLAYABLE_PIECES = [...PLAYABLE_NOTES, ...PLAYABLE_COINS];
