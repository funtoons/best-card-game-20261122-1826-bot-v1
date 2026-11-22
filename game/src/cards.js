// The card catalogue of Ember Court: every card is an original creature or
// spell of the court, with a mana cost, an element, and (for creatures) an
// attack and a health value. Spells have `spell: 'bolt' | 'mend'` and no
// attack/health; creatures may carry the `taunt` keyword, which forces the
// enemy to attack them before any other target.

export const CARD_DEFS = {
  emberImp: { name: 'Ember Imp', element: 'ember', cost: 1, atk: 2, hp: 1, text: 'A spark with teeth.' },
  cinderPup: { name: 'Cinder Pup', element: 'ember', cost: 1, atk: 1, hp: 2, text: 'Loyal. Warm. Hungry.' },
  frostSprite: { name: 'Frost Sprite', element: 'frost', cost: 1, atk: 1, hp: 1, text: 'It giggles as it bites.' },
  thornSprout: { name: 'Thorn Sprout', element: 'thorn', cost: 1, atk: 1, hp: 3, text: 'Small, but it stings.' },
  stormWisp: { name: 'Storm Wisp', element: 'storm', cost: 1, atk: 2, hp: 1, text: 'Here, then gone.' },
  emberHound: { name: 'Ember Hound', element: 'ember', cost: 2, atk: 3, hp: 2, text: 'Its bark is a backdraft.' },
  frostWolf: { name: 'Frost Wolf', element: 'frost', cost: 2, atk: 2, hp: 3, text: 'Its howl freezes the air.' },
  thornGuard: { name: 'Thorn Guard', element: 'thorn', cost: 2, atk: 1, hp: 4, taunt: true, text: 'TAUNT. None shall pass.' },
  stormCrow: { name: 'Storm Crow', element: 'storm', cost: 2, atk: 3, hp: 1, text: 'It nests in thunderheads.' },
  emberKnight: { name: 'Ember Knight', element: 'ember', cost: 3, atk: 3, hp: 4, text: 'His blade never cools.' },
  frostGiant: { name: 'Frost Giant', element: 'frost', cost: 3, atk: 2, hp: 5, taunt: true, text: 'TAUNT. A walking glacier.' },
  thornWarden: { name: 'Thorn Warden', element: 'thorn', cost: 3, atk: 4, hp: 3, text: 'The grove fights back.' },
  stormSerpent: { name: 'Storm Serpent', element: 'storm', cost: 3, atk: 4, hp: 2, text: 'Lightning, given scales.' },
  emberDragon: { name: 'Ember Dragon', element: 'ember', cost: 4, atk: 5, hp: 4, text: 'The court bows to fire.' },
  frostQueen: { name: 'Frost Queen', element: 'frost', cost: 4, atk: 4, hp: 5, text: 'Winter wears a crown.' },
  thornTitan: { name: 'Thorn Titan', element: 'thorn', cost: 4, atk: 3, hp: 6, taunt: true, text: 'TAUNT. Rooted. Unmoved.' },
  stormPhoenix: { name: 'Storm Phoenix', element: 'storm', cost: 4, atk: 6, hp: 3, text: 'It dies in thunder, returns in it.' },
  emberBolt: { name: 'Ember Bolt', element: 'ember', cost: 2, spell: 'bolt', text: 'Deal 3 damage to the enemy hero.' },
  frostMend: { name: 'Frost Mend', element: 'frost', cost: 2, spell: 'mend', text: 'Restore 5 life to your hero.' },
  stormSurge: { name: 'Storm Surge', element: 'storm', cost: 3, spell: 'bolt', damage: 5, text: 'Deal 5 damage to the enemy hero.' },
};

/** The 20-card deck both duelists bring to the court (same list, shuffled apart). */
export const DECK_LIST = [
  'emberImp', 'stormSurge', 'cinderPup', 'frostSprite', 'thornSprout', 'stormWisp',
  'emberHound', 'frostWolf', 'thornGuard', 'stormCrow',
  'emberKnight', 'frostGiant', 'thornWarden', 'stormSerpent',
  'emberDragon', 'frostQueen', 'thornTitan', 'stormPhoenix',
  'emberBolt', 'frostMend',
];

let nextCardId = 1;

/** A fresh, playable copy of a card definition, with its own identity. */
export function makeCard(defId) {
  const def = CARD_DEFS[defId];
  return {
    id: nextCardId,
    defId,
    name: def.name,
    element: def.element,
    cost: def.cost,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    taunt: Boolean(def.taunt),
    spell: def.spell ?? null,
    damage: def.damage ?? 3,
    text: def.text,
    canAttack: false,
    justPlayed: false,
  };
}
