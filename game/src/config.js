// Ember Court — every tuning number and colour in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the
// window, so no rule below depends on the screen size.

export const TABLE = { width: 1280, height: 720 };

/** Fixed simulation step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const HERO = {
  startLife: 30,
  maxLife: 30,
  startHand: 4,
  maxHand: 7,
  maxBoard: 5,
  maxMana: 10,
  deckSize: 20,
};

/** Card size on the table (player hand) and on the board rows. */
export const CARD = { width: 118, height: 164, boardWidth: 104, boardHeight: 146 };

export const ELEMENTS = {
  ember: { name: 'EMBER', colour: '#e8532f', light: '#ff9a5c', dark: '#7a1e08', glyph: 'flame' },
  frost: { name: 'FROST', colour: '#3fa7e8', light: '#a8dcff', dark: '#0d3a5c', glyph: 'flake' },
  thorn: { name: 'THORN', colour: '#58a83c', light: '#b5e39a', dark: '#1d4a12', glyph: 'leaf' },
  storm: { name: 'STORM', colour: '#9a6ee8', light: '#d3b8ff', dark: '#3a1d6e', glyph: 'bolt' },
};

export const PALETTE = {
  felt: '#1d5c33',
  feltDark: '#143d22',
  feltLight: '#2a7a45',
  wood: '#5a3a1e',
  woodDark: '#3c2512',
  gold: '#e8b64c',
  goldDark: '#9a7414',
  parchment: '#f4e8c8',
  ink: '#241a10',
  cardBack: '#7a1e08',
  text: '#f7f2e2',
  muted: '#b9ac8a',
  life: '#ff5a6e',
  mana: '#4fc3f7',
  panel: '#20242c',
  overlay: 'rgba(8, 10, 14, 0.72)',
};

export const FONT = 'Georgia, "Times New Roman", serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best result (fewest turns to win) is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.best-turns';
