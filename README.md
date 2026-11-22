# Ember Court — A Duel of Cards

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/funtoons/best-card-game-20261122-1826-bot-v1/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/funtoons/best-card-game-20261122-1826-bot-v1/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Ember Court** is an original turn-based card duel for the [Make the best card game](https://make.fun/bounty/best-card-game-20261122-1826) bounty on make.fun. You are Aria, the Ember Warden, dueling Malachar, the Frost Baron, on a green felt table: play creatures from your hand, spend mana, break through taunts, and take his 30 life before he takes yours.

## How to play

- **Play a card:** click it in your hand (or press 1–7). Creatures cost mana and enter the board; spells strike at once.
- **Attack:** click one of your ready creatures, then click an enemy creature — or Malachar himself. Taunt creatures must be attacked first.
- **End turn:** click END TURN, press Space, or press E. Malachar answers with his own cards and attacks.
- **Win:** reduce Malachar to 0 life. **Lose:** fall to 0 life yourself.
- **P** pauses, **M** mutes the synthesized sounds (WebAudio, no audio files).

## The deck

20 original cards across four elements — Ember, Frost, Thorn and Storm — from the 1-cost Ember Imp to the 4-cost Ember Dragon, plus the Ember Bolt and Frost Mend spells. Every card shows a big readable cost, attack, health, element and rules text.

## Run it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Screenshots are staged scenes of the real game (`?shot=title|play|win|loss&seed=7`, see `shots.json`): the title screen, a mid-duel table, the victory screen and the defeat screen.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library. The game runs entirely offline from static files: no network requests, no external assets, deterministic from its seed.
