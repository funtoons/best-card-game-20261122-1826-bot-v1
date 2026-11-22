// Ember Court — the duel itself: two heroes, two decks, one table.
// A turn: gain mana, draw a card, play cards, attack with creatures, end the
// turn. Creatures cannot attack the turn they are played. Taunt creatures must
// be attacked before anything else. A hero at 0 life loses. Everything here is
// pure logic on a seeded deck order, so the same seed always plays the same way.

import { HERO } from './config.js';
import { DECK_LIST, makeCard } from './cards.js';
import { shuffled } from './random.js';

export const PHASE_PLAYER = 'player';
export const PHASE_AI = 'ai';
export const PHASE_OVER = 'over';

/** A fresh hero: life, mana, a shuffled deck, a hand and an empty board. */
function makeHero(random, goesFirst) {
  const deck = shuffled(DECK_LIST, random).map((defId) => makeCard(defId));
  const hero = {
    life: HERO.startLife, mana: 0, maxMana: 0,
    deck, hand: [], board: [], fatigue: 0,
  };
  const draws = goesFirst ? HERO.startHand : HERO.startHand + 1;
  for (let i = 0; i < draws; i += 1) drawCard(hero);
  return hero;
}

function drawCard(hero) {
  if (hero.deck.length === 0) {
    hero.fatigue += 1;
    hero.life -= hero.fatigue;
    return { fatigued: true, damage: hero.fatigue };
  }
  const card = hero.deck.shift();
  if (hero.hand.length >= HERO.maxHand) return { burned: true, card };
  hero.hand.push(card);
  return { card };
}

/** A new duel. The player always opens; the AI answers with one extra card. */
export function createGame(random) {
  const state = {
    round: 1,
    phase: PHASE_PLAYER,
    winner: null,
    player: makeHero(random, true),
    ai: makeHero(random, false),
    log: ['The duel begins. Aria, the Ember Warden, opens.'],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, damageTaken: 0 },
    selection: { hand: -1, attacker: null },
  };
  beginTurn(state, 'player');
  return state;
}

function sideOf(state, side) {
  return side === 'player' ? state.player : state.ai;
}

function otherSide(side) {
  return side === 'player' ? 'ai' : 'player';
}

/** Start `side`'s turn: more mana, a fresh draw, creatures ready to strike. */
export function beginTurn(state, side) {
  const hero = sideOf(state, side);
  hero.maxMana = Math.min(HERO.maxMana, state.round);
  hero.mana = hero.maxMana;
  const drawn = drawCard(hero);
  for (const creature of hero.board) {
    creature.canAttack = true;
    creature.justPlayed = false;
  }
  if (drawn?.fatigued) {
    state.log.push(`${nameOf(side)} draws from an empty deck and takes ${drawn.damage} fatigue.`);
  } else if (drawn?.burned) {
    state.log.push(`${nameOf(side)} draws ${drawn.card.name} but the hand is full — it burns.`);
  }
  state.phase = side === 'player' ? PHASE_PLAYER : PHASE_AI;
  state.selection = { hand: -1, attacker: null };
  if (side === 'player') state.stats.turns += 1;
  checkWin(state);
}

export function nameOf(side) {
  return side === 'player' ? 'Aria' : 'Malachar';
}

export function titleOf(side) {
  return side === 'player' ? 'Ember Warden' : 'Frost Baron';
}

/** Can `side` play the card at `handIndex` right now? */
export function canPlayCard(state, side, handIndex) {
  const hero = sideOf(state, side);
  const card = hero.hand[handIndex];
  if (!card || state.phase !== (side === 'player' ? PHASE_PLAYER : PHASE_AI)) return false;
  if (card.cost > hero.mana) return false;
  if (!card.spell && hero.board.length >= HERO.maxBoard) return false;
  return true;
}

/** Play the card at `handIndex`. Returns a short line for the log, or null. */
export function playCard(state, side, handIndex) {
  if (!canPlayCard(state, side, handIndex)) return null;
  const hero = sideOf(state, side);
  const foe = sideOf(state, otherSide(side));
  const card = hero.hand.splice(handIndex, 1)[0];
  hero.mana -= card.cost;
  if (side === 'player') state.stats.cardsPlayed += 1;
  if (card.spell === 'bolt') {
    foe.life -= card.damage;
    state.log.push(`${nameOf(side)} casts ${card.name} for ${card.damage} damage to ${nameOf(otherSide(side))}.`);
    if (side === 'player') state.stats.damageDealt += card.damage;
    else state.stats.damageTaken += card.damage;
  } else if (card.spell === 'mend') {
    const healed = Math.min(card.damage + 2, HERO.maxLife - hero.life);
    hero.life += healed;
    state.log.push(`${nameOf(side)} casts ${card.name} and restores ${healed} life.`);
  } else {
    card.canAttack = false;
    card.justPlayed = true;
    hero.board.push(card);
    state.log.push(`${nameOf(side)} plays ${card.name} (${card.atk}/${card.hp}).`);
  }
  checkWin(state);
  return card.name;
}

/** The taunt creatures on `side`'s board, if any — they must be hit first. */
export function taunts(state, side) {
  return sideOf(state, side).board.filter((c) => c.taunt && c.hp > 0);
}

/** Can `attacker` strike `target`? target is { hero: true } or { card }. */
export function canAttack(state, side, attacker, target) {
  if (state.phase !== (side === 'player' ? PHASE_PLAYER : PHASE_AI)) return false;
  if (!attacker.canAttack) return false;
  const foeBoard = sideOf(state, otherSide(side)).board;
  const guards = foeBoard.filter((c) => c.taunt && c.hp > 0);
  if (guards.length > 0 && (!target.card || !target.card.taunt)) return false;
  return true;
}

/** Resolve one attack. Attacker and defender trade blows; heroes take damage raw. */
export function attack(state, side, attacker, target) {
  if (!canAttack(state, side, attacker, target)) return null;
  const foe = sideOf(state, otherSide(side));
  attacker.canAttack = false;
  if (target.hero) {
    foe.life -= attacker.atk;
    state.log.push(`${attacker.name} strikes ${nameOf(otherSide(side))} for ${attacker.atk}.`);
    if (side === 'player') state.stats.damageDealt += attacker.atk;
    else state.stats.damageTaken += attacker.atk;
  } else {
    const defender = target.card;
    defender.hp -= attacker.atk;
    attacker.hp -= defender.atk;
    state.log.push(`${attacker.name} (${attacker.atk}/${attacker.hp}) trades with ${defender.name} (${defender.atk}/${defender.hp}).`);
    if (defender.hp <= 0) {
      foe.board = foe.board.filter((c) => c.id !== defender.id);
      state.log.push(`${defender.name} falls.`);
    }
    if (attacker.hp <= 0) {
      sideOf(state, side).board = sideOf(state, side).board.filter((c) => c.id !== attacker.id);
      state.log.push(`${attacker.name} falls.`);
    }
  }
  checkWin(state);
  return true;
}

/** End `side`'s turn and open the other side's. */
export function endTurn(state, side) {
  if (state.phase === PHASE_OVER) return;
  if (side === 'ai') state.round += 1;
  beginTurn(state, otherSide(side));
}

function checkWin(state) {
  if (state.phase === PHASE_OVER) return;
  if (state.ai.life <= 0) {
    state.ai.life = 0;
    state.winner = 'player';
    state.phase = PHASE_OVER;
    state.log.push('Malachar falls. Aria takes the Ember Court!');
  } else if (state.player.life <= 0) {
    state.player.life = 0;
    state.winner = 'ai';
    state.phase = PHASE_OVER;
    state.log.push('Aria falls. Malachar claims the Ember Court.');
  }
}

/** Malachar's mind: play the dearest cards he can afford, mend when hurt, bolt
 *  when it finishes the duel, then send every ready creature at the hero —
 *  or at a taunt, when one stands in the way. */
export function aiTakeTurn(state) {
  const ai = state.ai;
  // Spells first when they matter: mend while badly hurt, bolt for the kill.
  for (let guard = 0; guard < 8; guard += 1) {
    let played = false;
    for (let i = 0; i < ai.hand.length; i += 1) {
      const card = ai.hand[i];
      if (!card.spell || card.cost > ai.mana) continue;
      if (card.spell === 'mend' && ai.life <= 15) { playCard(state, 'ai', i); played = true; break; }
      if (card.spell === 'bolt' && card.damage >= state.player.life) { playCard(state, 'ai', i); played = true; break; }
    }
    if (!played) break;
    if (state.phase === PHASE_OVER) return;
  }
  // Creatures: dearest first, while mana and board room last.
  for (let guard = 0; guard < 8; guard += 1) {
    let best = -1;
    for (let i = 0; i < ai.hand.length; i += 1) {
      const card = ai.hand[i];
      if (card.spell || card.cost > ai.mana) continue;
      if (best === -1 || card.cost > ai.hand[best].cost) best = i;
    }
    if (best === -1) break;
    playCard(state, 'ai', best);
    if (state.phase === PHASE_OVER) return;
  }
  // Leftover mana goes to bolts.
  for (let guard = 0; guard < 4; guard += 1) {
    let bolt = -1;
    for (let i = 0; i < ai.hand.length; i += 1) {
      const card = ai.hand[i];
      if (card.spell === 'bolt' && card.cost <= ai.mana) { bolt = i; break; }
    }
    if (bolt === -1) break;
    playCard(state, 'ai', bolt);
    if (state.phase === PHASE_OVER) return;
  }
  // Attacks: every ready creature, taunts first, then straight at the hero.
  for (const creature of ai.board.slice()) {
    if (state.phase === PHASE_OVER) return;
    if (!creature.canAttack) continue;
    const guards = taunts(state, 'player');
    if (guards.length > 0) {
      const target = guards.slice().sort((a, b) => a.hp - b.hp)[0];
      attack(state, 'ai', creature, { card: target });
    } else {
      attack(state, 'ai', creature, { hero: true });
    }
  }
}
