# Handoff Prompt: Create CLAUDE.md for graded_readers project

Paste this into a Claude Code session with the working directory set to `C:\Users\User\graded_readers`.

---

## Prompt

I need you to create a CLAUDE.md for this project. Read the following files first to understand the project fully:

1. `methodology/vocabulary_framework.md` — the core vocabulary framework (particle model, compositionality, CEFR assignment, encounter crediting)
2. `methodology/series_kickoff_interview.md` — the interactive interview process for starting a new series
3. `prompts/series_kickoff.md` — the prompt that triggers the interview
4. `data/SOURCES.md` — provenance and licensing for data files
5. `data/observed_chunks.json` — accumulated compositionality decisions from authoring
6. `series/monkeys_paw/constraint_spec.md` — a complete constraint spec (B1 supernatural adaptation)
7. `series/monkeys_paw/vocabulary_inventory.md` — a complete vocabulary inventory
8. `series/monkeys_paw/narrative_outline.md` — chapter structure
9. `series/monkeys_paw/source_summary.md` — source work summary
10. `series/monkeys_paw/adaptation_brief.md` — adaptation decisions
11. `series/monkeys_paw/l1_adjustments.md` — L1 transfer adjustments
12. `series/monkeys_paw/chapters/` — all chapter files (ch01–ch05)
13. `series/a1_romance/constraint_spec.md` — a second constraint spec (A1 romance original)
14. `series/a1_romance/narrative_outline.md`
15. `series/a1_romance/l1_adjustments.md`
16. `series/a1_romance/chapters/` — any drafted chapters

After reading, create a CLAUDE.md at the project root that covers:

### Project identity
- This is a graded reader authoring project, not a software project. There is no application code, no build system, no deployment. The project is a structured content production pipeline that uses AI (Claude Code) as a co-author within strict methodological constraints.
- Primary audience: Spanish L1 adolescent and adult ESL learners (A0–B2).
- The project produces content for **Relato** (`C:\Users\User\cadence`), an ESL reading and vocabulary acquisition app. Relato is the consumption platform; this project is the content production pipeline. Changes to the vocabulary framework here have downstream implications for Relato's vocabulary tracking, reading view, and depth model.

### The particle model
- Define the particle as the unit of vocabulary accounting (not the headword). Reference vocabulary_framework.md §2.
- Explain compositionality classification (compositional vs. non-compositional) and its two operational consequences: budget accounting and encounter crediting. Reference §4.
- Explain the chunk-meaning principle for non-compositional CEFR assignment — CEFR reflects the difficulty of acquiring the chunk meaning as a unit, not constituent ceiling. Reference §5.
- Explain chunk tier obligation — every registered chunk must be dispositioned as pre-known (≤ A2, budget-exempt) or tiered (B1+, encounter floor enforced). Reference §3.
- Explain the three-tier structure (Core, Thematic, Peripheral) with encounter floors.
- Explain the inventory-as-output principle — the vocabulary inventory is an output of drafting, not a fixed input. Reference §7.

### CEFR level assignment
- Rule C algorithm for single-word particles (from EFLLex). Include the algorithm and worked examples from §5.
- Constituent ceiling for compositional chunks.
- Chunk-meaning principle for non-compositional chunks.
- Provenance tags: `efllex`, `compositional_ceiling`, `chunk_meaning`.

### Data artifacts
- `data/efllex.json` — 15,281 entries, Rule C applied. This is also the canonical source for Relato's `cefrLookup.js`.
- `data/phrase_list.json` — 506 non-compositional multi-word expressions from Martinez & Schmitt (2012). Also used by Relato for particle identification.
- `data/observed_chunks.json` — compositionality decisions accumulated across all series. Shared across series. Also consumed by Relato during content ingestion.
- `data/efllex_data.js` — raw EFLLex data in JS format.

### Series structure
- Each series lives under `series/<slug>/` with a standard directory structure.
- Document the files produced by a complete series kickoff (constraint_spec, l1_adjustments, narrative_outline, source_summary/adaptation_brief/creative_dna, chapters/, inventory/).
- The series kickoff interview (`methodology/series_kickoff_interview.md`) is the entry point for starting a new series. It is run via the prompt in `prompts/series_kickoff.md`.

### Authoring pipeline
Document the end-to-end pipeline from kickoff to finished chapters:
1. Series kickoff interview → produces constraint spec, narrative outline, l1_adjustments
2. Chapter drafting — author writes for register and natural collocation within the target CEFR band
3. Compliance review — inventory particles used, assign tiers, check encounter floors, identify overages
4. Chunk identification and seeding — audit text against phrase_list.json, identify seeding opportunities, register in observed_chunks.json
5. Lexical compression — iterative reduction of unique lemmas and hapax legomena through author-guided revision
6. Final compliance re-run

### Relationship to Relato
This is critical. Include a section that explicitly describes:

- **Relato** (`C:\Users\User\cadence`) is the ESL reading and vocabulary acquisition app that consumes graded reader content produced here.
- Relato uses the same EFLLex data and Rule C algorithm for CEFR classification.
- Relato's reading view renders particles as clickable multi-word spans with Pleco-style drill-down navigation (tap particle → see unit meaning → decompose to constituent words → navigate back).
- Relato's depth model uses compositionality to determine encounter crediting: compositional chunk encounters credit constituents; non-compositional chunk encounters do NOT credit constituents.
- When a graded reader chapter is ingested into Relato, it needs: the chapter text, particle span annotations (character positions of every multi-word particle), per-particle metadata (CEFR, compositionality, tier, Spanish translation, constituents), audio with word-level timestamps, and L1 adjustments.
- Shared data artifacts: `efllex.json` is canonical for both projects; `phrase_list.json` and `observed_chunks.json` are consumed by Relato during ingestion.
- Changes to the vocabulary framework (e.g., the chunk-meaning principle, pre-known threshold, encounter crediting rules) require corresponding updates to Relato's CLAUDE.md and particle model implementation.

### Active series
List each series under `series/` with its status:
- `monkeys_paw` — B1 supernatural adaptation of W.W. Jacobs' "The Monkey's Paw". Honduran-American family in California. 5 chapters, ~4,500 words. Status: chapters drafted, vocabulary inventory complete, chunks identified and seeded, lexical compression complete.
- `a1_romance` — A1 original romance. First-person present tense, college dining hall setting. 10 planned chapters. Status: [determine from what's actually written].

### Conventions
- Environment variables use `REACT_APP_` prefix — wait, no. This project has no application code. Skip env vars.
- File naming: series slugs are lowercase with underscores. Chapter files are `ch01.md`, `ch02.md`, etc.
- Methodology documents are the authority. The series kickoff interview (§5 of the interview doc) states: "Don't redebate locked decisions." The vocabulary framework locks particle accounting, three-tier structure, encounter floors, compositionality classification, CEFR assignment, and inventory-as-output.

### What this project is NOT
- It is not a software project. There is no code to run, test, or deploy.
- It is not a dictionary or corpus linguistics tool. It produces graded reading content.
- It does not contain Relato's source code. Relato is a separate project at `C:\Users\User\cadence`.
- It does not produce audio. Audio generation happens in Relato's admin panel via ElevenLabs TTS.

### Observed chunks status note
The current `data/observed_chunks.json` entries were created before the chunk-meaning principle was adopted. Most entries have `cefr_derivation: "constituent_ceiling"` — these need to be reviewed and reclassified using the chunk-meaning principle per vocabulary_framework.md §5. This is a known gap, not a bug.
