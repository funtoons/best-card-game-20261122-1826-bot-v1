// The screenshot scenes behind ?shot=title|play|win|loss. Each one plays the
// real rules forward from a fresh, seeded duel, steered by a simple autopilot
// (play the dearest affordable creature, strike taunts, then the hero), so the
// frame is what a real game looks like and the same seed always gives the
// same frame. Win and loss scenes try seeds in order until the duel ends the
// way the scene needs.

import { createRandom } from './random.js';
import { aiTakeTurn, attack, canPlayCard, createGame, endTurn, playCard, taunts } from './state.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const PLAY_ROUND = 5;

/** One full player turn from the autopilot: spells, creatures, attacks. */
function autopilotTurn(state, aggressive) {
  const player = state.player;
  // Mend while badly hurt; bolt when it finishes the duel.
  for (let guard = 0; guard < 4; guard += 1) {
    let cast = -1;
    for (let i = 0; i < player.hand.length; i += 1) {
      const card = player.hand[i];
      if (!card.spell || card.cost > player.mana) continue;
      if (card.spell === 'mend' && player.life <= 12) { cast = i; break; }
      if (card.spell === 'bolt' && aggressive && card.damage >= state.ai.life) { cast = i; break; }
    }
    if (cast === -1) break;
    playCard(state, 'player', cast);
    if (state.phase === 'over') return;
  }
  // Creatures: dearest first, while mana and board room last.
  for (let guard = 0; guard < 8; guard += 1) {
    let best = -1;
    for (let i = 0; i < player.hand.length; i += 1) {
      const card = player.hand[i];
      if (card.spell || !canPlayCard(state, 'player', i)) continue;
      if (best === -1 || card.cost > player.hand[best].cost) best = i;
    }
    if (best === -1) break;
    playCard(state, 'player', best);
    if (state.phase === 'over') return;
  }
  // Attacks, when the pilot is aggressive.
  if (aggressive) {
    for (const creature of player.board.slice()) {
      if (state.phase === 'over') return;
      if (!creature.canAttack) continue;
      const guards = taunts(state, 'ai');
      if (guards.length > 0) {
        const target = guards.slice().sort((a, b) => a.hp - b.hp)[0];
        attack(state, 'player', creature, { card: target });
      } else {
        attack(state, 'player', creature, { hero: true });
      }
    }
  }
}

/** Play whole rounds (player + AI) until `stop(state)` says enough. */
function playRounds(state, stop, maxRounds) {
  for (let round = 0; round < maxRounds; round += 1) {
    if (state.phase === 'over' || stop(state)) return;
    autopilotTurn(state, true);
    if (state.phase === 'over' || stop(state)) return;
    endTurn(state, 'player');
    if (state.phase === 'over' || stop(state)) return;
    aiTakeTurn(state);
    if (state.phase === 'over' || stop(state)) return;
    endTurn(state, 'ai');
  }
}

/** A duel that ends with `winner`, trying seeds in order; null when none did. */
function findEnding(winner, seeds) {
  for (const seed of seeds) {
    const state = createGame(createRandom(seed));
    playRounds(state, () => false, 40);
    if (state.winner === winner) return state;
  }
  return null;
}

/**
 * Set the duel to the named scene (title, play, win or loss; any other name is
 * title) and return the screen to draw over it and the best result to show.
 */
export function stageShot(name, random) {
  if (name === 'play') {
    const state = createGame(random);
    playRounds(state, (s) => s.round >= PLAY_ROUND && s.phase === 'player' && s.player.board.length >= 2 && s.ai.board.length >= 1 && s.player.hand.length >= 4, 12);
    return { screen: SCREEN_PLAY, state, best: 0 };
  }
  if (name === 'win') {
    const state = findEnding('player', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
      ?? createGame(createRandom(1));
    return { screen: SCREEN_OVER, state, best: state.stats.turns };
  }
  if (name === 'loss') {
    // A passive player: never attacks, so Malachar grinds the duel down.
    let found = null;
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const state = createGame(createRandom(seed));
      for (let round = 0; round < 40 && state.phase !== 'over'; round += 1) {
        autopilotTurn(state, false);
        if (state.phase === 'over') break;
        endTurn(state, 'player');
        if (state.phase === 'over') break;
        aiTakeTurn(state);
        if (state.phase === 'over') break;
        endTurn(state, 'ai');
      }
      if (state.winner === 'ai') { found = state; break; }
    }
    const state = found ?? createGame(createRandom(1));
    return { screen: SCREEN_OVER, state, best: 0 };
  }
  const state = createGame(random);
  return { screen: SCREEN_TITLE, state, best: 0 };
}
