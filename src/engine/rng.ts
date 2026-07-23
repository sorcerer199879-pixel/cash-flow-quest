export function nextRandom(state: number): [number, number] {
  let x = state | 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return [(x >>> 0) / 4294967296, x >>> 0];
}
