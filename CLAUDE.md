# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Arkanoid game (`README.md`): HTML, CSS, JavaScript, zero dependencies, playable in browser. **Not implemented yet** — repo currently has no game code, only spec tooling.

## Workflow: spec-driven development

This repo uses a two-phase skill workflow (from `Klerith/fernando-skills`, see `skills-lock.json`) instead of freeform coding:

- **`/spec <description>`** (`.agents/skills/spec/SKILL.md`) — turns a feature idea into an approved design doc. Never writes code. Asks clarifying questions in Phase 2 (scope, data, integration, persistence, UX/states, risks) before drafting. Saves to `specs/NN-slug.md` following `.agents/skills/spec/template.md` (header with Status/Depends on/Date/Objective, Scope in/out, Data model, numbered Implementation plan, boolean Acceptance criteria, Decisions taken/discarded, optional Risks). New specs start in `Draft` state.
- **`/spec-impl <NN-slug>`** (`.agents/skills/spec-impl/SKILL.md`) — implements an approved spec. Refuses to proceed unless the spec's Status is `Approved` (or equivalent in another language) — status changes are made by the human, not the agent. Creates/switches to git branch `spec-NN-slug` (auto, unless `specs/.spec-config.yml` sets `AutoCreateBranch: false`), then implements the plan **one step at a time**, pausing after each step for diff review. Never commits automatically.

When asked to build a game feature, prefer routing through `/spec` first rather than writing code directly, unless the user explicitly asks for a quick throwaway change. `specs/` does not exist yet — the first `/spec` run creates it along with `specs/.spec-config.yml`.

## Language

Replies must match the language of the user's prompt (the spec skills are explicit about this: Spanish in → Spanish out, English in → English out). The existing `README.md` is written in Spanish.

## No build tooling yet

There is no package.json, build step, linter, or test suite in this repo. Once the game exists, check `specs/` for how each spec's Acceptance criteria define "done" (typically manual browser verification, e.g. "breaking a brick adds exactly 10 points") rather than an automated test command — confirm current tooling before assuming otherwise.
