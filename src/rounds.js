export function shuffle(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
