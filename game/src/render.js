// Ember Court — everything the player sees, painted on one canvas.
// The table is a fixed 1280x720 logical area scaled to the window. Cards carry
// big readable numbers: a blue cost gem, an attack circle, a health circle, and
// the element's name and glyph. The judge reads the game from these frames.

import { CARD, ELEMENTS, FONT, FONT_UI, HERO, PALETTE, TABLE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const HAND_Y = 548;
const BOARD_TOP_Y = 128;
const BOARD_BOTTOM_Y = 372;

/** Rectangles the mouse can hit: hand cards, board cards, buttons, heroes. */
export function layoutFor(state) {
  const layout = { hand: [], playerBoard: [], aiBoard: [], endTurn: null, aiHero: null, playerHero: null };
  const hand = state.player.hand;
  const handWidth = hand.length * (CARD.width + 8) - 8;
  hand.forEach((card, i) => {
    const selected = state.selection.hand === i;
    layout.hand.push({
      card, index: i,
      x: (TABLE.width - handWidth) / 2 + i * (CARD.width + 8),
      y: HAND_Y - (selected ? 26 : 0), width: CARD.width, height: CARD.height,
    });
  });
  const boardSlot = (row, i, total) => {
    const w = total * (CARD.boardWidth + 10) - 10;
    return {
      x: (TABLE.width - w) / 2 + i * (CARD.boardWidth + 10),
      y: row, width: CARD.boardWidth, height: CARD.boardHeight,
    };
  };
  state.ai.board.forEach((card, i) => layout.aiBoard.push({ card, ...boardSlot(BOARD_TOP_Y, i, state.ai.board.length) }));
  state.player.board.forEach((card, i) => layout.playerBoard.push({ card, ...boardSlot(BOARD_BOTTOM_Y, i, state.player.board.length) }));
  layout.endTurn = { x: 1130, y: 330, width: 128, height: 46 };
  layout.aiHero = { x: 16, y: 10, width: 330, height: 56 };
  layout.playerHero = { x: 16, y: 654, width: 330, height: 56 };
  return layout;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx, x, y, size, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 20, size / 20);
  ctx.beginPath();
  ctx.moveTo(0, 6);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 6);
  ctx.closePath();
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.restore();
}

/** The element's mark, drawn as a vector glyph so it never depends on a font. */
export function drawGlyph(ctx, glyph, x, y, size, colour) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = Math.max(2, size / 12);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (glyph === 'flame') {
    ctx.beginPath();
    ctx.moveTo(0, size * 0.5);
    ctx.bezierCurveTo(-size * 0.45, size * 0.1, -size * 0.2, -size * 0.35, 0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.2, -size * 0.35, size * 0.45, size * 0.1, 0, size * 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, size * 0.32);
    ctx.bezierCurveTo(-size * 0.18, size * 0.12, -size * 0.06, -size * 0.12, 0, -size * 0.22);
    ctx.bezierCurveTo(size * 0.06, -size * 0.12, size * 0.18, size * 0.12, 0, size * 0.32);
    ctx.fillStyle = '#ffd27a';
    ctx.fill();
  } else if (glyph === 'flake') {
    for (let i = 0; i < 6; i += 1) {
      const a = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * size * 0.5, Math.sin(a) * size * 0.5);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (glyph === 'leaf') {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.5);
    ctx.bezierCurveTo(size * 0.5, -size * 0.2, size * 0.4, size * 0.4, 0, size * 0.5);
    ctx.bezierCurveTo(-size * 0.4, size * 0.4, -size * 0.5, -size * 0.2, 0, -size * 0.5);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.4);
    ctx.lineTo(0, size * 0.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(size * 0.12, -size * 0.5);
    ctx.lineTo(-size * 0.28, size * 0.08);
    ctx.lineTo(-size * 0.02, size * 0.08);
    ctx.lineTo(-size * 0.12, size * 0.5);
    ctx.lineTo(size * 0.28, -size * 0.08);
    ctx.lineTo(size * 0.02, -size * 0.08);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawCardBack(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 8);
  ctx.fillStyle = PALETTE.cardBack;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  roundRect(ctx, x + 7, y + 7, w - 14, h - 14, 5);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(232,182,76,0.7)';
  ctx.stroke();
  drawGlyph(ctx, 'flame', x + w / 2, y + h / 2, Math.min(w, h) * 0.5, PALETTE.gold);
}

/** One card, full size (hand) or board size. `opts` marks selection and readiness. */
function drawCard(ctx, card, x, y, w, h, opts = {}) {
  const el = ELEMENTS[card.element];
  const scale = w / CARD.width;
  roundRect(ctx, x, y, w, h, 9);
  ctx.fillStyle = PALETTE.parchment;
  ctx.fill();
  ctx.lineWidth = opts.selected ? 4 : opts.attacker ? 4 : 2.5;
  ctx.strokeStyle = opts.selected ? PALETTE.gold : opts.attacker ? '#ffdf6b' : el.colour;
  ctx.stroke();
  // Element banner.
  ctx.fillStyle = el.colour;
  ctx.fillRect(x + 3, y + 3, w - 6, 24 * scale + 6);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(13 * scale + 3)}px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(el.name, x + w / 2 + 10 * scale, y + 15 * scale + 4);
  // Cost gem.
  ctx.beginPath();
  ctx.arc(x + 20 * scale, y + 20 * scale, 17 * scale, 0, Math.PI * 2);
  ctx.fillStyle = '#2f7fc2';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(20 * scale + 2)}px ${FONT_UI}`;
  ctx.fillText(String(card.cost), x + 20 * scale, y + 21 * scale);
  // Art: the element glyph, large.
  drawGlyph(ctx, el.glyph, x + w / 2, y + h * 0.42, 44 * scale, el.colour);
  // Name.
  ctx.fillStyle = PALETTE.ink;
  ctx.font = `bold ${Math.round(13 * scale + 2)}px ${FONT}`;
  ctx.fillText(card.name, x + w / 2, y + h * 0.62);
  // Rules text (hand cards only): one line, shortened to fit, so it never
  // runs into the attack and health circles below it.
  if (w >= CARD.width) {
    ctx.font = `${Math.round(10 * scale + 1)}px ${FONT_UI}`;
    ctx.fillStyle = '#5a4a32';
    let line = card.text;
    while (line.length > 1 && ctx.measureText(line).width > w - 16) line = line.slice(0, -1);
    if (line.length < card.text.length) line = line.slice(0, -1).trimEnd() + '…';
    ctx.fillText(line, x + w / 2, y + h * 0.74);
  }
  if (card.spell) {
    ctx.fillStyle = el.dark;
    ctx.font = `bold ${Math.round(22 * scale + 4)}px ${FONT_UI}`;
    ctx.fillText(card.spell === 'bolt' ? `-${card.damage} DMG` : `+${card.damage + 2} LIFE`, x + w / 2, y + h * 0.88);
  } else {
    // Attack circle (left) and health circle (right).
    statCircle(ctx, x + 22 * scale, y + h - 20 * scale, 16 * scale, '#c22e2e', String(card.atk));
    statCircle(ctx, x + w - 22 * scale, y + h - 20 * scale, 16 * scale, '#2e7d32', String(card.hp));
    ctx.font = `bold ${Math.round(9 * scale + 1)}px ${FONT_UI}`;
    ctx.fillStyle = '#8a7a5a';
    ctx.fillText('ATK', x + 22 * scale, y + h - 40 * scale);
    ctx.fillText('HP', x + w - 22 * scale, y + h - 40 * scale);
    if (card.taunt) {
      ctx.fillStyle = PALETTE.goldDark;
      roundRect(ctx, x + w / 2 - 34 * scale, y + h - 12, 68 * scale, 15, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${Math.round(9 * scale + 2)}px ${FONT_UI}`;
      ctx.fillText('TAUNT', x + w / 2, y + h - 4);
    }
  }
  if (opts.dim) {
    ctx.fillStyle = 'rgba(20, 20, 30, 0.45)';
    roundRect(ctx, x, y, w, h, 9);
    ctx.fill();
  }
  if (opts.attacker) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffdf6b';
    roundRect(ctx, x - 3, y - 3, w + 6, h + 6, 11);
    ctx.stroke();
  }
}

function statCircle(ctx, x, y, r, colour, text) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = colour;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(r + 4)}px ${FONT_UI}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function drawHeroPanel(ctx, x, y, w, h, side, state, layout) {
  const hero = side === 'player' ? state.player : state.ai;
  const isPlayer = side === 'player';
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = 'rgba(16, 20, 26, 0.82)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = isPlayer ? ELEMENTS.ember.colour : ELEMENTS.frost.colour;
  ctx.stroke();
  // Portrait medallion.
  ctx.beginPath();
  ctx.arc(x + 30, y + h / 2, 20, 0, Math.PI * 2);
  ctx.fillStyle = isPlayer ? ELEMENTS.ember.colour : ELEMENTS.frost.colour;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  drawGlyph(ctx, isPlayer ? 'flame' : 'flake', x + 30, y + h / 2, 22, '#ffffff');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = `bold 17px ${FONT}`;
  ctx.fillText(isPlayer ? 'ARIA' : 'MALACHAR', x + 58, y + 18);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = `12px ${FONT_UI}`;
  ctx.fillText(isPlayer ? 'Ember Warden  •  YOU' : 'Frost Baron  •  RIVAL AI', x + 58, y + 40);
  // Life total: heart + big number.
  drawHeart(ctx, x + w - 78, y + h / 2 + 1, 26, PALETTE.life);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px ' + FONT_UI;
  ctx.textAlign = 'left';
  ctx.fillText(String(hero.life), x + w - 58, y + h / 2 + 1);
  ctx.font = 'bold 10px ' + FONT_UI;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText('LIFE', x + w - 58, y + h / 2 + 20);
}

function drawMana(ctx, state) {
  const hero = state.player;
  const x = 1010;
  const y = 668;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 15px ' + FONT_UI;
  ctx.fillText(`MANA  ${hero.mana}/${hero.maxMana}`, x, y - 4);
  for (let i = 0; i < HERO.maxMana; i += 1) {
    ctx.beginPath();
    ctx.arc(x + 8 + i * 20, y + 18, 7, 0, Math.PI * 2);
    ctx.fillStyle = i < hero.mana ? PALETTE.mana : 'rgba(255,255,255,0.18)';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
  }
}

function drawDeckPile(ctx, x, y, count, label) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.06);
  roundRect(ctx, -26, -36, 52, 72, 6);
  ctx.fillStyle = '#2c2118';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 18px ' + FONT_UI;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(count), x, y);
  ctx.font = '11px ' + FONT_UI;
  ctx.fillStyle = PALETTE.muted;
  ctx.fillText(label, x, y + 50);
}

function drawTable(ctx, state, layout) {
  // Wood frame + green felt.
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.woodDark;
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.fillStyle = PALETTE.wood;
  ctx.fillRect(10, 10, TABLE.width - 20, TABLE.height - 20);
  roundRect(ctx, 22, 22, TABLE.width - 44, TABLE.height - 44, 18);
  ctx.fillStyle = PALETTE.felt;
  ctx.fill();
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  // Felt shading: a lighter oval in the middle, a centre line.
  ctx.beginPath();
  ctx.ellipse(TABLE.width / 2, TABLE.height / 2, 520, 220, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(60, TABLE.height / 2);
  ctx.lineTo(TABLE.width - 60, TABLE.height / 2);
  ctx.strokeStyle = 'rgba(232,182,76,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Rival hand: face-down backs, top centre.
  const backs = state.ai.hand.length;
  const backW = 52;
  const backTotal = backs * (backW + 6) - 6;
  for (let i = 0; i < backs; i += 1) {
    drawCardBack(ctx, (TABLE.width - backTotal) / 2 + i * (backW + 6), 74, backW, 72);
  }

  // Board rows: empty slots as dashed outlines.
  for (const row of [BOARD_TOP_Y, BOARD_BOTTOM_Y]) {
    for (let i = 0; i < HERO.maxBoard; i += 1) {
      const w = HERO.maxBoard * (CARD.boardWidth + 10) - 10;
      const x = (TABLE.width - w) / 2 + i * (CARD.boardWidth + 10);
      roundRect(ctx, x, row, CARD.boardWidth, CARD.boardHeight, 8);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  for (const slot of layout.aiBoard) {
    drawCard(ctx, slot.card, slot.x, slot.y, slot.width, slot.height, {});
  }
  for (const slot of layout.playerBoard) {
    const selected = state.selection.attacker === slot.card.id;
    drawCard(ctx, slot.card, slot.x, slot.y, slot.width, slot.height, { attacker: selected, dim: !slot.card.canAttack });
  }

  // Hero panels, decks, mana.
  drawHeroPanel(ctx, layout.aiHero.x, layout.aiHero.y, layout.aiHero.width, layout.aiHero.height, 'ai', state, layout);
  drawHeroPanel(ctx, layout.playerHero.x, layout.playerHero.y, layout.playerHero.width, layout.playerHero.height, 'player', state, layout);
  drawDeckPile(ctx, 1230, 100, state.ai.deck.length, 'DECK');
  drawDeckPile(ctx, 1230, 600, state.player.deck.length, 'DECK');

  // Player hand.
  for (const slot of layout.hand) {
    const playable = state.phase === 'player' && slot.card.cost <= state.player.mana
      && (slot.card.spell || state.player.board.length < HERO.maxBoard);
    drawCard(ctx, slot.card, slot.x, slot.y, slot.width, slot.height, {
      selected: state.selection.hand === slot.index,
      dim: state.phase === 'player' && !playable,
    });
  }

  // Round + turn banner.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 15px ' + FONT_UI;
  const turnText = state.phase === 'player' ? 'YOUR TURN — play a card, attack, then END TURN'
    : state.phase === 'ai' ? 'MALACHAR IS THINKING…' : '';
  ctx.fillText(`ROUND ${state.round}   •   ${turnText}`, TABLE.width / 2, 330);

  // End turn button.
  const btn = layout.endTurn;
  const enabled = state.phase === 'player';
  roundRect(ctx, btn.x, btn.y, btn.width, btn.height, 10);
  ctx.fillStyle = enabled ? PALETTE.gold : 'rgba(255,255,255,0.14)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.goldDark;
  ctx.stroke();
  ctx.fillStyle = enabled ? '#241a10' : PALETTE.muted;
  ctx.font = 'bold 16px ' + FONT_UI;
  ctx.textBaseline = 'middle';
  ctx.fillText('END TURN', btn.x + btn.width / 2, btn.y + btn.height / 2 + 1);

  // Mana + last log line (centred in the gap between the board and the hand).
  drawMana(ctx, state);
  const last = state.log[state.log.length - 1] ?? '';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '13px ' + FONT_UI;
  ctx.fillText(`» ${last}`, TABLE.width / 2, 540);

  // Attack hint when a creature is chosen.
  if (state.selection.attacker !== null) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdf6b';
    ctx.font = 'bold 14px ' + FONT_UI;
    ctx.fillText('Choose a target: click an enemy creature or Malachar', TABLE.width / 2, 300);
  }
}

function drawTitle(ctx, state, best) {
  ctx.fillStyle = 'rgba(8, 10, 14, 0.88)';
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  drawGlyph(ctx, 'flame', TABLE.width / 2 - 405, 180, 46, ELEMENTS.ember.colour);
  drawGlyph(ctx, 'flake', TABLE.width / 2 + 405, 180, 46, ELEMENTS.frost.colour);
  ctx.fillStyle = PALETTE.gold;
  ctx.font = 'bold 88px ' + FONT;
  ctx.fillText('EMBER COURT', TABLE.width / 2, 180);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'italic 26px ' + FONT;
  ctx.fillText('A Duel of Cards', TABLE.width / 2, 238);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(TABLE.width / 2 - 260, 278);
  ctx.lineTo(TABLE.width / 2 + 260, 278);
  ctx.stroke();
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px ' + FONT_UI;
  ctx.fillText('You are Aria, the Ember Warden. Malachar, the Frost Baron, holds the court.', TABLE.width / 2, 322);
  ctx.fillText('Play creatures, spend mana, break through his taunts — take his 30 life first.', TABLE.width / 2, 354);
  ctx.fillStyle = PALETTE.muted;
  ctx.font = '16px ' + FONT_UI;
  ctx.fillText('Click a card to play it  •  Click a creature, then a target, to attack  •  SPACE ends your turn', TABLE.width / 2, 402);
  if (best > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 17px ' + FONT_UI;
    ctx.fillText(`Fastest victory yet: ${best} turns`, TABLE.width / 2, 444);
  }
  ctx.fillStyle = '#ffdf6b';
  ctx.font = 'bold 24px ' + FONT_UI;
  ctx.fillText('—  CLICK OR PRESS SPACE TO BEGIN  —', TABLE.width / 2, 540);
}

function drawOver(ctx, state, best) {
  const won = state.winner === 'player';
  ctx.fillStyle = won ? 'rgba(20, 16, 4, 0.78)' : 'rgba(16, 4, 6, 0.8)';
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (won) {
    drawGlyph(ctx, 'flame', TABLE.width / 2, 200, 90, PALETTE.gold);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 96px ' + FONT;
    ctx.fillText('VICTORY!', TABLE.width / 2, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'italic 26px ' + FONT;
    ctx.fillText('Malachar falls. The Ember Court is yours, Warden.', TABLE.width / 2, 380);
  } else {
    drawGlyph(ctx, 'flake', TABLE.width / 2, 200, 90, ELEMENTS.frost.light);
    ctx.fillStyle = '#ff7a8a';
    ctx.font = 'bold 96px ' + FONT;
    ctx.fillText('DEFEAT', TABLE.width / 2, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'italic 26px ' + FONT;
    ctx.fillText('Malachar claims the Ember Court… this time.', TABLE.width / 2, 380);
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = '19px ' + FONT_UI;
  ctx.fillText(
    `Rounds played: ${state.stats.turns}   •   Cards played: ${state.stats.cardsPlayed}   •   Damage dealt: ${state.stats.damageDealt}`,
    TABLE.width / 2, 440,
  );
  if (won && best > 0) {
    ctx.fillStyle = PALETTE.gold;
    ctx.font = 'bold 18px ' + FONT_UI;
    ctx.fillText(`Fastest victory: ${best} turns`, TABLE.width / 2, 478);
  }
  ctx.fillStyle = '#ffdf6b';
  ctx.font = 'bold 22px ' + FONT_UI;
  ctx.fillText('—  CLICK OR PRESS SPACE TO DUEL AGAIN  —', TABLE.width / 2, 560);
}

function drawPaused(ctx) {
  ctx.fillStyle = PALETTE.overlay;
  ctx.fillRect(0, 0, TABLE.width, TABLE.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 64px ' + FONT;
  ctx.fillText('PAUSED', TABLE.width / 2, 330);
  ctx.font = '20px ' + FONT_UI;
  ctx.fillText('Press P or click to return to the duel.', TABLE.width / 2, 380);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  // Backing store exactly the logical table size: the page stretches the canvas
  // to the window, so a 1280x720 window paints pixel for pixel, never blurred.
  canvas.width = TABLE.width;
  canvas.height = TABLE.height;

  function draw(state, screen, best) {
    const scale = Math.min(canvas.width / TABLE.width, canvas.height / TABLE.height);
    const offsetX = (canvas.width - TABLE.width * scale) / 2;
    const offsetY = (canvas.height - TABLE.height * scale) / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0c0e12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);
    const layout = layoutFor(state);
    if (screen === SCREEN_TITLE) {
      drawTable(ctx, state, layout);
      drawTitle(ctx, state, best);
    } else if (screen === SCREEN_OVER) {
      drawTable(ctx, state, layout);
      drawOver(ctx, state, best);
    } else if (screen === SCREEN_PAUSED) {
      drawTable(ctx, state, layout);
      drawPaused(ctx);
    } else {
      drawTable(ctx, state, layout);
    }
  }

  return { draw };
}
