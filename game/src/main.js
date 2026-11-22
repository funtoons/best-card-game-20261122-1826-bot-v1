// Ember Court — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps, and the renderer paints what is there. The
// duel moves between four screens: title, play, paused and game over.
//
// ?seed=N fixes the shuffle and the draw order. ?shot=title|play|win|loss (with
// &seed=N) stages that scene instead of running the loop, paints it twice and
// sets window.__shotReady for a screenshot.

import { BEST_KEY } from './config.js';
import { createRandom } from './random.js';
import { aiTakeTurn, attack, canPlayCard, createGame, endTurn, playCard } from './state.js';
import { ACTION_CONFIRM, ACTION_END_TURN, ACTION_MUTE, ACTION_PAUSE, createInput, interpretClick } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { createAudio } from './audio.js';

/** How long Malachar's turn is left to show before his moves land. */
const AI_THINK_MS = 900;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const audio = createAudio();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, createRandom(seed));
  let painted = 0;
  function paint() {
    renderer.draw(scene.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let state = createGame(createRandom(seed));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let aiPendingSince = 0;
  let announcedWin = false;

  // Screen readers (and anyone watching the page's text) hear screen changes.
  function announce(message) {
    status.textContent = message;
  }

  function startDuel() {
    state = createGame(createRandom(seed));
    screen = SCREEN_PLAY;
    aiPendingSince = 0;
    announcedWin = false;
    audio.play();
    announce('Duel started. Your turn: play a card, attack, then end your turn.');
  }

  function endDuel() {
    screen = SCREEN_OVER;
    if (state.winner === 'player') {
      audio.win();
      if (best === 0 || state.stats.turns < best) {
        best = state.stats.turns;
        saveBest(best);
      }
    } else {
      audio.lose();
    }
    announce(state.winner === 'player'
      ? `Victory in ${state.stats.turns} turns.`
      : 'Defeat. Malachar claims the Ember Court.');
  }

  function handleClick(point) {
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      startDuel();
      return;
    }
    if (screen !== SCREEN_PLAY || state.phase !== 'player') return;
    const move = interpretClick(state, point);
    if (!move) return;
    audio.unlock();
    if (move.endTurn) {
      state.selection = { hand: -1, attacker: null };
      endTurn(state, 'player');
      aiPendingSince = performance.now();
      audio.turn();
      announce('Malachar is thinking…');
      return;
    }
    if (move.cancel) {
      state.selection = { hand: -1, attacker: null };
      return;
    }
    if (move.play !== undefined) {
      if (canPlayCard(state, 'player', move.play)) {
        playCard(state, 'player', move.play);
        state.selection = { hand: -1, attacker: null };
        audio.play();
        if (state.phase === 'over') endDuel();
      }
      return;
    }
    if (move.attack !== undefined) {
      const card = state.player.board.find((c) => c.id === move.attack);
      if (card && card.canAttack) state.selection = { hand: -1, attacker: card.id };
      return;
    }
    if (move.target) {
      const attacker = state.player.board.find((c) => c.id === state.selection.attacker);
      if (attacker) {
        attack(state, 'player', attacker, move.target);
        state.selection = { hand: -1, attacker: null };
        audio.hit();
        if (state.phase === 'over') endDuel();
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return;
    }
    if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startDuel();
      return;
    }
    if (actions & (ACTION_CONFIRM | ACTION_END_TURN) && screen === SCREEN_PLAY && state.phase === 'player') {
      state.selection = { hand: -1, attacker: null };
      endTurn(state, 'player');
      aiPendingSince = performance.now();
      audio.turn();
      announce('Malachar is thinking…');
    }
  }

  function step() {
    if (state.phase === 'ai' && aiPendingSince > 0 && performance.now() - aiPendingSince >= AI_THINK_MS) {
      aiPendingSince = 0;
      aiTakeTurn(state);
      if (state.phase === 'over') {
        endDuel();
      } else {
        endTurn(state, 'ai');
        announce('Your turn.');
      }
    }
    if (state.phase === 'over' && !announcedWin) {
      announcedWin = true;
      endDuel();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    handleActions();
    const click = input.takeClick();
    if (click) handleClick(click);
    step();
    renderer.draw(state, screen, best);
  }

  // Leaving the tab pauses a running duel rather than letting it sit unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Court. Press Space or click to begin the duel.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
