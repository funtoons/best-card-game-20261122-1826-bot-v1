// Ember Court — mouse and keyboard, translated into game actions.
// Clicks are tested against the renderer's layout, so the picture and the
// hit areas can never drift apart. Keys: Space/Enter confirms or ends the
// turn, 1-7 plays a hand card, P pauses, M mutes.

import { TABLE } from './config.js';
import { layoutFor } from './render.js';

export const ACTION_CONFIRM = 1;
export const ACTION_END_TURN = 2;
export const ACTION_PAUSE = 4;
export const ACTION_MUTE = 8;

export function createInput(canvas) {
  let actions = 0;
  let click = null;

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / TABLE.width, rect.height / TABLE.height);
    const offsetX = (rect.width - TABLE.width * scale) / 2;
    const offsetY = (rect.height - TABLE.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - offsetX) / scale,
      y: (event.clientY - rect.top - offsetY) / scale,
    };
  }

  canvas.addEventListener('pointerdown', (event) => {
    click = toLogical(event);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (event.code === 'Space' || event.code === 'Enter') {
      actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (event.code === 'KeyE') {
      actions |= ACTION_END_TURN;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      actions |= ACTION_PAUSE;
    } else if (event.code === 'KeyM') {
      actions |= ACTION_MUTE;
    } else if (/^Digit[1-7]$/.test(event.code)) {
      click = { digit: Number(event.code.slice(5)) - 1 };
    }
  });

  return {
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
  };
}

function inside(point, rect) {
  return point && point.x >= rect.x && point.x <= rect.x + rect.width
    && point.y >= rect.y && point.y <= rect.y + rect.height;
}

/**
 * Turn one click into a move for the player: { play: handIndex }, { attack: cardId },
 * { target: { hero: true } | { card } }, { endTurn: true }, or null when the click
 * hit nothing actionable. `state` carries the current selection.
 */
export function interpretClick(state, point) {
  if (!point || point.digit !== undefined) {
    if (point && point.digit !== undefined) {
      if (point.digit >= 0 && point.digit < state.player.hand.length) return { play: point.digit };
      return null;
    }
    return null;
  }
  const layout = layoutFor(state);
  if (state.phase !== 'player') return null;
  if (inside(point, layout.endTurn)) return { endTurn: true };
  // A chosen attacker wants a target: an enemy creature, or Malachar himself.
  if (state.selection.attacker !== null) {
    for (const slot of layout.aiBoard) {
      if (inside(point, slot)) return { target: { card: slot.card } };
    }
    if (inside(point, layout.aiHero)) return { target: { hero: true } };
    for (const slot of layout.playerBoard) {
      if (inside(point, slot)) return { attack: slot.card.id };
    }
    return { cancel: true };
  }
  for (const slot of layout.playerBoard) {
    if (inside(point, slot) && slot.card.canAttack) return { attack: slot.card.id };
  }
  for (const slot of layout.hand) {
    if (inside(point, slot)) return { play: slot.index };
  }
  return null;
}
