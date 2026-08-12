# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game (`README.md`): HTML, CSS, JavaScript, zero dependencies, playable in browser.

- `index.html` — canvas host, loads `style.css` and `game.js`.
- `game.js` — entire game: state machine (`start` → `playing`/`paused` → `gameover`/`victory`), constants (paddle/ball/brick dimensions, colors), `state` object, update/draw loop via `requestAnimationFrame`, `localStorage` persistence (`arkanoid:highscore`).
- `style.css` — page/canvas styling.

No framework, no modules/bundler — everything is plain top-level functions and constants in one file. Follow that pattern for new code: add functions/constants to `game.js` in the same flat style rather than introducing modules, classes, or build tooling, unless a spec explicitly calls for it.

## Workflow: spec-driven development

This repo uses a two-phase skill workflow (from `Klerith/fernando-skills`, see `skills-lock.json`) instead of freeform coding:

- **`/spec <description>`** (`.agents/skills/spec/SKILL.md`) — turns a feature idea into an approved design doc. Never writes code. Asks clarifying questions in Phase 2 (scope, data, integration, persistence, UX/states, risks) before drafting. Saves to `specs/NN-slug.md` following `.agents/skills/spec/template.md` (header with Status/Depends on/Date/Objective, Scope in/out, Data model, numbered Implementation plan, boolean Acceptance criteria, Decisions taken/discarded, optional Risks). New specs start in `Draft` state.
- **`/spec-impl <NN-slug>`** (`.agents/skills/spec-impl/SKILL.md`) — implements an approved spec. Refuses to proceed unless the spec's Status is `Approved` (or equivalent in another language) — status changes are made by the human, not the agent. Creates/switches to git branch `spec-NN-slug` (auto, unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`), then implements the plan **one step at a time**, pausing after each step for diff review. Never commits automatically.

When asked to build a game feature, prefer routing through `/spec` first rather than writing code directly, unless the user explicitly asks for a quick throwaway change. `specs/` already exists, with `specs/.spec-config.yml` (`AutoCreateBranch: true`) and one spec file per feature, numbered sequentially:

- `01-mvp-arkanoid.md` — paddle, ball, bricks, 3 fixed levels, lives, score, highscore.
- `02-animacion-destruccion-bricks.md` — particle-explosion animation on brick break.
- `03-niveles-infinitos-y-bricks-solidos.md` — levels beyond 3 recycling the 3 layouts, 2-hit solid bricks, ball speed scaling per level, victory cap at level 10, max-level persistence.

Each spec's implementation lands on its own `spec-NN-slug` branch (created by `/spec-impl`); the spec's Status field is only flipped to Implemented by a human after its acceptance criteria are verified, not automatically by the agent.

## Language

Replies must match the language of the user's prompt (the spec skills are explicit about this: Spanish in → Spanish out, English in → English out). The existing `README.md` is written in Spanish.

## No build tooling yet

There is no package.json, build step, linter, or test suite in this repo. Check each spec's Acceptance criteria for how "done" is defined (typically manual browser verification, e.g. "breaking a brick adds exactly 10 points") rather than an automated test command — confirm current tooling before assuming otherwise.
