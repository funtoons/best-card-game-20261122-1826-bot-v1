// A small seeded random number generator (splitmix32): the same seed gives the
// same shuffle and the same draw order, which is what makes the screenshot
// scenes repeatable. No Math.random is used anywhere in the game itself.

export function createRandom(seed) {
  let state = (seed | 0) >>> 0;
  return function random() {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    z = (z ^ (z >>> 15)) >>> 0;
    return z / 4294967296;
  };
}

/** Fisher-Yates shuffle of a copy of `items`, driven by the seeded generator. */
export function shuffled(items, random) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
