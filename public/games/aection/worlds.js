export const WORLDS = Object.freeze([
  {id:"wallis", sky:"#eee9e1", edge:"#627763", floor:"#101310"},
  {id:"planet", sky:"#29213f", edge:"#b097e4", floor:"#181321"},
  {id:"jungle", sky:"#1c4d43", edge:"#74b99b", floor:"#101e18"},
  {id:"hell", sky:"#5b2528", edge:"#f7a24e", floor:"#231311"},
  {id:"heaven", sky:"#afd6e6", edge:"#e9d8a3", floor:"#161f29"},
  {id:"greece", sky:"#b5d9dd", edge:"#dfcb9f", floor:"#192125"},
  {id:"egypt", sky:"#e6bc78", edge:"#e6af54", floor:"#251b13"}
]);
export const WORLD_FADE_SECONDS = 3;
export const WORLD_SECONDS = 30;
export function worldFrame(state) {
  const ticks = Math.max(0, Number.isFinite(state.tick) ? state.tick : Math.floor((state.time || 0) * 60));
  const visit = Math.floor(ticks / (WORLD_SECONDS * 60));
  const index = visit % WORLDS.length;
  const age = (ticks % (WORLD_SECONDS * 60)) / 60;
  const t = visit === 0 ? 1 : Math.min(1, age / WORLD_FADE_SECONDS);
  return {index, previous:visit === 0 ? 0 : (index + WORLDS.length - 1) % WORLDS.length,
    visit, age, blend:t*t*(3-2*t)};
}
