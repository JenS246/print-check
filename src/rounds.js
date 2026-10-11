export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function chooseCategoryDiverseRounds(notes, count = 5, random = Math.random) {
  const groups = new Map();
  shuffle(notes, random).forEach((note) => {
    if (!groups.has(note.errorCategory)) groups.set(note.errorCategory, []);
    groups.get(note.errorCategory).push(note);
  });
  const selected = shuffle([...groups.values()], random).map((group) => group[0]).slice(0, count);
  const selectedIds = new Set(selected.map((note) => note.id));
  const fill = shuffle(notes.filter((note) => !selectedIds.has(note.id)), random);
  return [...selected, ...fill].slice(0, count);
}

export function markerHitsRegions(marker, answerSide, regions) {
  if (!marker || marker.side !== answerSide) return false;
  return regions.some((region) => (
    marker.x >= region.x
    && marker.x <= region.x + region.width
    && marker.y >= region.y
    && marker.y <= region.y + region.height
  ));
}
