# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Relato — Project Context

*Leer, escuchar, y aprender inglés.*

## What This App Is

Relato is a React (Vite) ESL reading and vocabulary acquisition app for
A2–B2 English learners across multiple L1 backgrounds (Spanish, Mandarin,
Japanese, Korean), with emphasis on adolescent and young adult long-term
English learners (LTEL) in K-12 settings.

Core loop: Read extensively → Encounter vocabulary → Track depth of
knowledge through a 5-level fluency model → Practice via flashcards
and shadow reading → Re-read to build fluency → Repeat.

Relato is a redesign of VocabFrontier (`C:\Users\User\vocab-reader-app`).
It keeps the reading, lookup, flashcard, shadow reading, story workshop,
and teacher control features but drops the frontier-based profiling,
island/hex map metaphor, development scores, and terrain states.

---

## Development Commands

```bash
npm run dev          # Start Vite dev server (HMR)
npm run build        # Production build → dist/
npm run preview      # Serve production build locally
npm run lint         # ESLint (flat config, React hooks + refresh plugins)
```

No test framework is configured. No TypeScript — plain JS/JSX only.

Netlify Functions live in `netlify/functions/` and deploy automatically.
Local testing with `netlify dev` if the Netlify CLI is installed.

Dictionary build scripts (run manually when source data changes):
```bash
node scripts/build-data.mjs        # Regenerate cefrLookup.js + lemmaMap.js
node scripts/build-zh-dict.mjs     # Regenerate zh_dictionary.js from CC-CEDICT
node scripts/build-ja-dict.mjs     # Regenerate ja_dictionary.js from JMdict
node scripts/build-ko-dict.mjs     # Regenerate ko_dictionary.js from KENGDIC
```

---

## Tech Stack

- React (Vite)
- Tailwind CSS (v4, `@tailwindcss/vite` plugin)
- Supabase (auth, profiles, progress sync, curated texts, teacher data)
- IndexedDB (local word tracking, caching, offline-first stores)
- Netlify (deployment target)
- **Environment variables use `VITE_` prefix** (not `REACT_APP_`). This
  is Vite, not CRA. Use `import.meta.env.VITE_*`.

---

## Relationship to VocabFrontier

Relato reuses and adapts code from VocabFrontier where appropriate.
Key reusable pieces:

**Direct reuse:**
- Leitner SRS system (flashcardDB.js patterns, LeitnerReview UI)
- ShadowingPlayer (audio playback, timestamp sync, sentence looping)
- useAudioRecorder hook (MediaRecorder wrapper)
- Definition/translation fetching + caching chain (MW API, L1 dictionaries,
  en_dictionary, IndexedDB cache)
- Auth context (Supabase auth + role management)
- Word highlighting + click-to-lookup popup pattern
- Flashcard creation (CardCreator, FlashcardPage)
- Data files: es_dictionary.js, zh_dictionary.js, ja_dictionary.js,
  ko_dictionary.js, en_dictionary.js, BNC/COCA frequency data, NGSL,
  AWL word lists

**Adapted:**
- useProgressSync (remove CEFR instrument handoff)
- AdminPanel (keep ElevenLabs + corpus ingestion, strip island metadata)
- textPipeline (keep tokenization + vocab profiling, strip island geometry)
- ChallengeTest (reuse quiz structure, remove frontier triggering)
- Story Workshop (will be redesigned)

**Left behind:**
- Island map (WorldMap, IslandView, HexTile, TileDetailPanel, islandShape)
- Frontier computation (computeFrontier, FrontierStrip, calibration prompt)
- Development score (computeIslandState, terrain states)
- Bubble continent / expository map
- ProgressView visualizations (FrontierCard, CoverageRibbon, AWLGrid)

---

## 5-Level Vocabulary Depth Model

Relato measures word knowledge through a fluency development lens.
The five levels are independent flags per student per headword — not a
strict staircase. Each can be set in any order. A word's depth score is
an aggregation of which levels have been achieved.

### Level 1: Decode (Articulatory Fluency)

Can the student pronounce this word without the "tongue-twister effect"?
Past the phonological hurdle that happens with unfamiliar words or
challenging word combinations in L2.

**Evidence sources:**
- Student self-report flags (end-of-pass review: "which words still
  feel hard to say?")
- AI pronunciation assessment (Azure Speech — per-word accuracy scores
  from oral read-alouds, hesitation/restart detection)
- Teacher flags on student recordings (confirms/extends student + AI flags)

**Key design:** Self-report is the primary signal, not a workaround for
missing ASR. Learners' subjective experience of articulatory difficulty
drives downstream behavior. The act of noticing "I'm stuck" is itself
a learning event (Schmidt-style noticing).

**Flag UX:** During reading, tap-to-flag only (minimal interruption).
After the pass, a follow-up screen shows flagged words and asks for
ratings (1–5 anchored scale: 1 = said it smoothly, 5 = completely stuck).

### Level 2: Meaning (Contextual Comprehension)

Does the student know the L1 translation / meaning of this word in
this context? Can they create an L1 approximation?

**Evidence sources:**
- Student self-report (meaning-unknown flags)
- Quiz probes (show word in original sentence context, meaning-check MCQ)
- Lookup behavior (looked up = weak negative evidence)

**Known ceiling:** L1 translation knowledge is shallow — "take = tomar"
doesn't cover "take a chance." Accepted at A2–B1; upper levels do the
discriminating for B2+.

### Level 3: Local Recognition (Same-Spot Re-read)

Can the student recognize this word at the same location in the text
on a re-read?

**Evidence sources:**
- Pronunciation assessment on re-read (fluent production at same spot on
  pass 2+ = dual evidence for Level 1 AND Level 3)
- Quiz probes after re-read pass (show the sentence, meaning check)
- Student self-report (end-of-pass confirmation on previously flagged words)

**Design note:** Level 3 evidence comes from active signals (pronunciation
assessment, quiz probes, self-report), NOT passive behavioral inference
like "didn't look it up on pass 2." Lookup absence is weak evidence.

### Level 4: Global Recognition (Whole-Text)

Can the student recognize this word across the entire text, not just at
the spot where they first encountered it?

**Evidence sources:**
- Encounter data across multiple segments of the same text without lookup
- Quiz probes using the word in different sentences from the same text
- Pronunciation assessment showing consistent fluency across the full text

### Level 5: Cross-Text Transfer

Can the student recognize this word when it appears in a different text?

**Evidence sources:**
- Encounter in a new text without lookup or flag
- Quiz probes using the word in a novel context
- Pronunciation assessment in a new text

### Cross-Source Signal (The 2×2)

Flag events from three sources (student, AI, teacher) are stored in one
unified `flag_events` table, distinguished by `source`. The 2×2 analysis
is computed on read, not denormalized:

| | Student flagged | Student did not flag |
|---|---|---|
| **AI/Teacher flagged** | High-confidence difficulty | Blind spot — student doesn't notice the problem |
| **AI/Teacher did not flag** | Subjective difficulty or over-monitoring | Strongest positive evidence |

The "teacher only" cell (blind spot) is the most pedagogically valuable:
it identifies words the student will keep mishandling because they don't
know they're mishandling them.

### WordKnowledgeState (Rollup)

Per student per headword, computed from accumulated flag events and
encounters. Each level has: status (achieved/not), first_at,
last_confirmed_at, confidence. Not stored as derived scores — computed
from evidence on demand.

---

## Recording + Transcription Pipeline

### Student Recordings

Students record oral read-alouds of texts. Two recording modes:

**Full-text recording (saved):** Available when sentence loop is not
active. Mic button in transport bar. Starts recording + model audio
simultaneously. After stop: review with "Listen back", "Save", "Discard".
Save uploads to Supabase Storage, upserts `student_recordings` row.
One recording per (user_id, text_id).

**Sentence-loop recording (ephemeral):** Available during sentence loop.
Small button in loop controls. Auto-plays back. No save flow. Discarded
when loop clears.

Audio format: 32kbps opus/webm via MediaRecorder. ~1.2MB ceiling for
5-minute recording.

### AI Pronunciation Assessment

**Recommended hybrid approach:**
- Whisper for full transcription (cheap, text + timing + diff against
  reference text)
- Azure Pronunciation Assessment on flagged segments only (student
  self-report or Whisper deviation from reference)
- Premium pricing only on slices that matter; ~$40-50/year per class

**Azure output:** Per-word accuracy scores (0–100), fluency score,
prosody score, completeness score, phoneme-level breakdowns.

**L2 calibration:** Default thresholds over-flag accented-but-intelligible
production. Use change-over-time signal rather than absolute score. Tune
accuracy threshold empirically (maybe < 60 rather than default).

### Teacher Recording Review Workflow

Teacher opens dashboard → sees per-student recording with:
- Student self-flagged words (yellow)
- AI-flagged words (orange)
- Both flagged (red)
- Teacher scrubs to red/orange segments first, audits, confirms/dismisses/adds

Target: 2–3 minutes of teacher attention per 10-minute recording.

---

## Features

### Read & Listen (Unified Reading View)
Reading while listening is the primary mode. The reading view and shadow
reading are integrated into one cohesive screen — shadow reading is a
sub-mode of reading, not a separate destination.

**Text display:** Word-level and particle-level highlighting. Single words
and multi-word particles are both clickable. Click triggers a popup with
CEFR level, L1 translation (locale-aware), English definition. For
particles, the popup supports Pleco-style drill-down to constituent words
and back up to the particle as a unit (see "Particle-aware reading view"
in the Particle Model section). Cursor-gated colored underlines by CEFR
tier. Encounter tracking across sessions.

**Translation mode (syntax glosses):** Binary toggle that overlays
phrase-level L1 translations on the text. Curated per-book during graded
reader production — every sentence is segmented into contiguous syntax
glosses with grammatical type and complexity classification. Complex
glosses are visually flagged with a darker underline. Tapping a gloss
shows the phrase translation with drill-down to contextually translated
constituent words. See "Syntax Glosses" section for schema and design
details.

**Audio playback:** ElevenLabs-generated audio with word-level timestamps,
synchronized highlighting, speed slider (0.5×–1.25×), sentence loop for
practice. Tapping a word during playback pauses audio and shows the popup;
popup includes a resume button for zero-friction vocabulary investigation.

**Student recording:** Full-text recording (saved, one per user per text)
and sentence-loop ephemeral recording (not saved, auto-plays back).
useAudioRecorder hook (MediaRecorder, 32kbps opus/webm).

**Shadow reading sub-mode:** When the student is actively shadowing
(listen-then-repeat), vocabulary popups remain available but encounter
crediting is capped at cursor-level passive credit (depth ceiling 0.10).
Shadowing builds phonological fluency; explicit vocabulary knowledge is
built through the primary read-and-listen mode.

### Flashcards (Leitner SRS)
Five-box Leitner system. Intervals: Box 1 = immediate, 2 = 1 day,
3 = 3 days, 4 = 1 week, 5 = 2 weeks. Card types: dual (word + L1),
definition, cloze. Pleco-style 0–5 response scale. Cards recommended
from quiz results, not auto-added.

### Story Workshop
Guided writing with vocabulary scaffolding. Will be redesigned for
Relato (carried over from VocabFrontier as a concept, not as code).

### Teacher Controls
Class creation with join codes. Student roster. Reading progress
visibility. Recording review with cross-source flag analysis.
RLS-gated: teachers see enrolled students only.

### Admin Corpus Ingestion
Text upload with vocabulary profiling. ElevenLabs audio generation
with voice selection. Metadata entry (title, author, CEFR estimate,
provenance). Series/sequence support for multi-chapter works.

---

## Data Layer

### Supabase Tables
- `profiles` — user identity, roles (student/teacher/admin), L1, CEFR
- `classes` — teacher-owned class containers with join codes
- `class_enrollments` — student ↔ class mapping
- `books` — book containers grouping curated_texts, with `vocabulary_manifest` JSONB and `syntax_glosses` JSONB
- `curated_texts` — admin-managed corpus texts (authoritative store), linked to books via `book_id`
- `user_progress` — per-user JSONB for userWords and wordEncounters
- `reading_sessions` — per-pass records (silent/oral/shadow mode)
- `recordings` — oral read-aloud audio files
- `transcriptions` — STT + pronunciation assessment output
- `flag_events` — unified flags (student/AI/teacher source)
- `fluency_sessions` — timed reading and shadowing session logs
- `srs_cards` — Leitner box flashcard state (`translation` + `l1` columns)
- `student_recordings` — shadow read recordings for teacher review

### IndexedDB Stores (local)
`srsCards`, `reviewLog`, `translationCache`, `enDefinitions`, `texts`,
`curatedTexts`, `encounters`, `flagEvents`, `readingSessions`,
`recordings`, `fluencySessions`, `sets`, `cards`

### RLS Pattern
Students manage their own rows (`auth.uid() = user_id/student_id`).
Teachers read enrolled students' rows via `class_enrollments → classes`
join (`classes.teacher_id = auth.uid()`). Admins read/write all rows.

---

## Multi-L1 Translation Layer

Relato supports four L1 (native language) backgrounds. The L2 (English)
is fixed. The vocabulary engine (EFLLex, particles, depth model) is
L1-independent.

### Supported locales

Defined in `src/lib/locales.js`:

| Code | Label | English | Base dictionary coverage |
|---|---|---|---|
| `es` | Español | Spanish | ~28% (hand-curated) |
| `zh` | 中文 | Mandarin | ~72% (CC-CEDICT) |
| `ja` | 日本語 | Japanese | ~82% (JMdict) |
| `ko` | 한국어 | Korean | ~77% (KENGDIC) |

Default L1 is `es`. Users select L1 at signup (stored in `profiles.l1`)
and can change it from the settings menu in Layout.

### Architecture

- **AuthContext** exposes `l1` from the user's profile (fallback: `'es'`).
- **`src/lib/translations.js`** is the central translation utility:
  - `getL1Dict(l1)` — returns the locale's base dictionary
  - `getManifestTranslation(entry, l1)` — reads `entry.translations[l1]`
    with fallback to `entry.spanish` (backward compat)
  - `getManifestConstituents(entry, l1)` — reads locale-keyed
    constituents with auto-detection of old flat format
  - `getGlossTranslation(gloss, l1)` / `getGlossConstituents(gloss, l1)`
    — same pattern for syntax glosses
- **Components** receive `l1` as a prop from ReadingView (which gets it
  from AuthContext). WordPopup, CardCreator, and TextDisplay all use the
  translation helpers.
- **SRS cards** store `translation` and `l1` columns (not `spanish`).
  Card type `'translation'` replaces `'spanish'`.
- **EGP grammar overlays** (`egpL1Overlays.js`) are locale-keyed:
  `explanations[l1]`, `contrasts[l1]`, `examples[l1]`. Currently only
  `es` is populated; other locales render without the overlay until
  content is added.

### Backward compatibility

Manifests and glosses stored as JSONB on `books` coexist in old and new
format. Detection is automatic:

| Data | Old format | New format | Detection |
|---|---|---|---|
| Manifest entry | `entry.spanish` | `entry.translations.es` | Check `translations[l1]` first, fall back to `spanish` |
| Manifest constituents | `{ "take": "quitar" }` (flat) | `{ "es": { "take": "quitar" } }` (nested) | Values are strings → flat; values are objects → nested |
| Syntax gloss | `gloss.spanish` | `gloss.translations.es` | Same as manifest |
| Gloss constituents | `{ "I": "yo" }` (flat) | `{ "es": { "I": "yo" } }` (nested) | Same detection |

Old books keep working without re-ingestion. New books use the
`translations` format. AdminPanel detects and displays which locales are
populated when ingesting manifests and glosses.

### DB migration

`supabase/migrations/014_multi_l1.sql`:
- Auth trigger reads `l1` from signup metadata
- `srs_cards`: added `translation` and `l1` columns
- Card type constraint accepts both `'spanish'` and `'translation'`

---

## Vocabulary Classification: EFLLex

Relato uses **EFLLex** (EFL Lexicon) as its sole vocabulary classification
backbone. EFLLex assigns CEFR levels directly based on word frequency in
actual EFL textbook corpora — no intermediate band-to-tier mapping needed.

### Data files (src/data/)
- `cefrLookup.js` — 10,019 unique single words → CEFR level (A1–C1).
  Where a word has multiple POS entries, the lowest CEFR level wins.
- `cefrMultiWord` (in cefrLookup.js) — 3,852 multi-word collocations/phrases
  → CEFR level. Available for future quiz/probe generation.
- `lemmaMap.js` — 34,466 inflected form → headword mappings extracted from
  BNC/COCA wordData.js. Used to resolve surface forms (e.g. "running" → "run")
  before EFLLex lookup.
- `en_dictionary.js` — ~3,400 learner-friendly English definitions

**L1 dictionaries** — base translation fallback layer per locale. Each
maps EFLLex headwords to L1 translations. Vocabulary manifests override
these when a book-specific sense or note is needed.

| File | Locale | Entries | Coverage | Source | License |
|---|---|---|---|---|---|
| `es_dictionary.js` | Spanish | ~3,000 | ~28% | Hand-curated (NGSL+AWL) | — |
| `zh_dictionary.js` | Mandarin | ~7,200 | ~72% | CC-CEDICT (inverted) | CC BY-SA 4.0 |
| `ja_dictionary.js` | Japanese | ~8,200 | ~82% | JMdict (inverted) | CC BY-SA 4.0 |
| `ko_dictionary.js` | Korean | ~7,700 | ~77% | KENGDIC (inverted) | MPL 2.0 / LGPL 2.0+ |

The zh/ja/ko dictionaries are machine-generated by inverting L1→English
dictionaries and matching against cefrLookup headwords. They pick the
most common translation per headword but lack sense disambiguation — the
per-book vocabulary manifest provides context-aware overrides.

### Lookup chain (`lookupCefr()` in wordUtils.js)
1. Clean and lowercase the token
2. Direct lookup in `cefrLookup`
3. If not found, resolve via `lemmaMap` → retry `cefrLookup`
4. If still not found → `{ cefr: null, via: 'unclassified' }`

### CEFR Distribution (single words)
| Level | Count |
|---|---|
| A1 | 1,325 |
| A2 | 1,184 |
| B1 | 2,154 |
| B2 | 2,596 |
| C1 | 2,760 |

### Off-list / Unclassified Words
Words not found in EFLLex after lemma resolution are classified as
`unclassified`. They are still trackable and still receive depth scoring
— they just don't get a CEFR color. This is the correct behavior for
above-level vocabulary, proper nouns, and domain-specific terms.

### EFLLex Rule C — Canonical CEFR Derivation

EFLLex reports a normalized frequency at each of five CEFR levels (A1,
A2, B1, B2, C1). Rule C collapses these into a single level:

```
frequencies = [freq_a1, freq_a2, freq_b1, freq_b2, freq_c1]
peak = max(frequencies)
threshold = max(0.2 × peak, 1.0)

For each level in order A1 → A2 → B1 → B2 → C1:
    if frequency at level ≥ threshold:
        assign this level; stop.

If no level meets threshold:
    fallback: assign lowest level with non-zero frequency.
```

Rule C is defined in `C:\Users\User\graded_readers\methodology\vocabulary_framework.md`
§5. Relato's `cefrLookup.js` (10,019 entries) is a subset of the graded
reader project's `efllex.json` (15,281 entries with Rule C applied).
Relato should adopt the full Rule C dataset; `build-data.mjs` should
regenerate from the graded reader's `efllex.json` as the canonical source.

### AWL (Academic Word List) — Not Used
AWL is not maintained as a separate system. 82% of AWL headwords appear
in EFLLex naturally (mostly at B1–C1). The remaining 18% are tracked as
unclassified when encountered.

### NGSL / BNC/COCA — Not Used
Relato does not use NGSL bands, BNC/COCA frequency tiers, or the
BAND_TIER_MAP system from VocabFrontier. The `lemmaMap.js` file was
extracted from wordData.js for its inflection-to-headword mappings only;
the frequency data was discarded.

### L1 Translation Lookup Order

Translation lookup is locale-aware — the user's L1 setting (from
`AuthContext.l1`) determines which dictionary and manifest translations
are used. The lookup chain, implemented in `src/lib/translations.js`:

1. **Book vocabulary manifest** (override layer) — sense-disambiguated
   translations, multi-word particles, and pedagogical notes generated
   per-book during graded reader production. Stored as JSONB on the
   `books` table (`vocabulary_manifest` column). Entries use
   `translations: { es: "...", zh: "..." }` (new format) or `spanish`
   field (old format, backward compat). Only includes entries where the
   base dictionary is insufficient. Typically 20–50 entries per book.
   Helpers: `getManifestTranslation(entry, l1)`,
   `getManifestConstituents(entry, l1)`.
2. **Bundled L1 dictionary** — `getL1Dict(l1)` returns the locale's
   base dictionary (`es_dictionary`, `zh_dictionary`, etc.). Covers
   EFLLex vocabulary. The manifest overrides this when a book-specific
   sense or note is needed.
3. *(Future)* API fallback for native/uncurated content — translation
   API or LLM call with sentence context, cached to IndexedDB

The manifest is produced during graded reader authoring, not at ingestion
time. The LLM has full text context during production, so translations
are sense-disambiguated. Manifests are reviewed and version-controlled
in the graded reader project.

For non-curated or native content without a manifest, the lookup falls
through to the static dictionary and eventually to an API layer.

### English Definition Lookup Order
1. IndexedDB cache (`enDefinitions` store)
2. Bundled `en_dictionary.js`
3. Merriam-Webster Learner's Dictionary API (`VITE_MW_LEARNERS_KEY`)
4. Cache MW results to IndexedDB

### Build scripts
- `scripts/build-data.mjs` — regenerates `cefrLookup.js` and `lemmaMap.js`
  from source files. Run if EFLLex or lemma source data changes.
- `scripts/build-zh-dict.mjs` — downloads CC-CEDICT, inverts to
  English→Chinese, generates `zh_dictionary.js`. Caches source to
  `scripts/.cache/cedict.txt`.
- `scripts/build-ja-dict.mjs` — downloads JMdict, inverts to
  English→Japanese, generates `ja_dictionary.js`. Caches source to
  `scripts/.cache/JMdict_e.xml`.
- `scripts/build-ko-dict.mjs` — downloads KENGDIC, inverts to
  English→Korean, generates `ko_dictionary.js`. Caches source to
  `scripts/.cache/kengdic.tsv`.

All L1 build scripts accept an optional local file path argument. Cached
source files are gitignored (`scripts/.cache/`).

---

## The Particle Model

Relato adopts the **particle** as the unit of vocabulary tracking for
multi-word expressions. A particle is a vocabulary item the learner
processes as a single cognitive unit — either a single word (*house*,
*eventually*) or a multi-word chunk (*of course*, *pick up*, *a lot of*).

The particle model is defined in the graded reader project's vocabulary
framework (`C:\Users\User\graded_readers\methodology\vocabulary_framework.md`).
Graded reader content produced under that framework is ingested into
Relato; the particle model must be consistent across both projects.

### Why particles matter for Relato

Traditional word-level tracking inflates apparent cognitive load. A student
who reads "of course" and looks it up gets an encounter event for "of",
"course", and "of course" — but the learner is processing one unit, not
three. The particle model fixes this: multi-word chunks are clickable units
in the reading view, tracked as single items in the depth model, and
credited correctly in encounter accounting.

### Compositionality classification

Multi-word particles are classified as **compositional** or
**non-compositional**. This classification determines encounter crediting:

- **Compositional chunk** (*bus stop*): meaning derivable from parts.
  An encounter credits each constituent word toward its own depth score
  (if tracked independently).
- **Non-compositional chunk** (*of course*): meaning NOT derivable from
  parts. An encounter credits ONLY the chunk — constituents receive no
  depth credit for their independent senses.

The PHRASE List (Martinez & Schmitt, 2012) is the authoritative source for
non-compositional classification — 506 entries in the graded reader
project's `data/phrase_list.json`. Additional chunks are classified by
the content author during graded reader production and recorded in
`data/observed_chunks.json`.

### CEFR assignment for particles

| Particle type | Method |
|---|---|
| Single word | EFLLex lookup via Rule C |
| Compositional chunk | Highest CEFR level among constituent words (constituent ceiling) |
| Non-compositional chunk | Author-assigned based on chunk-meaning difficulty (chunk-meaning principle) |

The **chunk-meaning principle**: for non-compositional chunks, CEFR level
reflects the difficulty of acquiring the chunk meaning as a unit, not the
difficulty of its parts. Constituent ceiling is inappropriate because by
definition the learner cannot derive the chunk meaning from parts.
"Nothing but" (= "only") is not A1 despite both constituents being A1.

### Pre-known vs. tiered chunks

Every registered chunk is dispositioned as either:

- **Pre-known** — chunk meaning at or below A2. Budget-exempt, no
  encounter floor, but registered for accounting accuracy. Examples:
  *have to*, *going to*, *there is/are*, *get up*.
- **Tiered** — chunk meaning at B1+. Assigned to Core/Thematic/Peripheral
  with encounter floor enforcement. These are chunks the text actively
  teaches.

### Particle-aware reading view (popup interaction)

The reading view renders particles as clickable multi-word spans. The
popup supports Pleco-style drill-down / drill-up navigation:

1. **Tap a particle span** (e.g., "pick up") → popup shows: particle as
   a unit, CEFR level, L1 translation, compositionality tag
2. **Decompose** → shows constituent words ("pick", "up") with their own
   CEFR levels and L1 translations (locale-aware via manifest or base
   dictionary)
3. For non-compositional chunks, signal that meaning is NOT the sum of
   parts — this is itself a learning event
4. **Navigate back** → return to particle-level view

When a student taps a word that is part of a recognized particle, the
popup defaults to the particle view (the cognitively relevant unit) with
the option to drill down to the individual word.

### Particle identification during ingestion

Particles are identified during corpus ingestion via two sources:

1. **Inventory lookup** — match token sequences in the text against
   `phrase_list.json`, `observed_chunks.json`, and `cefrMultiWord` data.
   This catches known multi-word expressions.
2. **AI annotation** — the ingestion pipeline identifies additional
   collocations and lexical chunks per text (stored in
   `textCollocates` and `lexicalChunks` on the TextAnalysis object).

Both sources produce **span annotations** per text: character positions
marking where each particle occurs. These spans drive clickable rendering
in the reading view.

### Relationship to existing Relato concepts

The particle model unifies three previously separate multi-word concepts:

| Previous concept | Maps to |
|---|---|
| `cefrMultiWord` (3,852 EFLLex phrases) | Static particle lookup table |
| `textCollocates` (AI per-text collocations) | Compositional particles identified at ingestion |
| `lexicalChunks` (AI per-text formulaic phrases, `holistic: true`) | Non-compositional particles identified at ingestion |

### Encounter crediting in the depth model

When a student encounters a particle in the reading view:

- The particle itself receives a depth event (encounter, lookup, flag,
  etc.) tracked against the particle as a unit.
- If the particle is **compositional**, each constituent word that is
  independently tracked also receives an encounter credit.
- If the particle is **non-compositional**, constituents receive NO
  encounter credit for their independent senses.

This mirrors the graded reader framework's crediting rules (vocabulary
framework §6) and ensures consistency between content production and
content consumption.

---

## Content Pipeline: Graded Readers

Relato consumes graded reader content produced in the graded reader
project (`C:\Users\User\graded_readers`). The two projects share the
same EFLLex data source and vocabulary framework. Changes to the
vocabulary framework in the graded reader project have downstream
implications for Relato's vocabulary tracking and reading view.

### What the graded reader project produces

Each graded reader series produces:
- Chapter text files (`series/<slug>/chapters/ch*.md`)
- A vocabulary inventory (`series/<slug>/vocabulary_inventory.md`) with
  particles tiered as Core/Thematic/Peripheral, encounter counts, and
  chapter spread
- A **vocabulary manifest** (`series/<slug>/vocabulary_manifest.json`) —
  override file with sense-disambiguated multi-locale translations,
  multi-word particles, and pedagogical notes. Only entries where the
  base dictionary is insufficient. Uses `translations: { es, zh, ... }`
  format. Schema and details below in "Vocabulary Manifest Schema."
- **Syntax glosses** (`series/<slug>/syntax_glosses.json`) — full-text
  phrase-level segmentation with multi-locale translations, grammatical
  type, complexity flags, and constituent translations. Uses
  `translations: { es, zh, ... }` format. Authored during the same
  curation pass as the vocabulary manifest. Schema and details in
  "Syntax Glosses" section.
- A constraint specification (`series/<slug>/constraint_spec.md`) with
  CEFR target, sentence constraints, and compliance rules
- L1 transfer adjustments (`series/<slug>/l1_adjustments.md`) with
  cognate transparency and false friend penalties
- Observed chunks (`data/observed_chunks.json`) — compositionality
  decisions accumulated across all series, with PHRASE List source,
  compositionality classification, and encounter data

### What Relato needs from ingested content

When a graded reader chapter is ingested into Relato as a `curated_text`:
- The chapter text
- **Particle span annotations** — character positions marking every
  multi-word particle occurrence in the text
- **Per-particle metadata** — CEFR level, compositionality, tier,
  constituent words
- **Vocabulary manifest** — context-aware multi-locale translations for
  words and particles in the text, stored as JSONB on the `books` table
  (`vocabulary_manifest` column), ingested from the graded reader
  project's `vocabulary_manifest.json` via AdminPanel
- **Syntax glosses** — full-text phrase-level multi-locale translations
  with grammatical type and complexity flags, stored as JSONB on the
  `books` table (`syntax_glosses` column), ingested from the graded
  reader project's `syntax_glosses.json` via AdminPanel
- Audio (ElevenLabs TTS with word-level timestamps)
- L1 adjustments (cognate/false-friend effective CEFR overrides)

### Data flow

```
graded_readers/                          relato/
  data/efllex.json ───────────────────→ build-data.mjs → cefrLookup.js
  data/phrase_list.json ──────────────→ particle lookup table
  data/observed_chunks.json ──────────→ particle lookup table
  series/<slug>/chapters/ch*.md ──────→ curated_texts (Supabase + IndexedDB)
  series/<slug>/vocabulary_inventory ─→ per-text particle metadata
  series/<slug>/vocabulary_manifest ──→ books.vocabulary_manifest (JSONB)
  series/<slug>/syntax_glosses.json ──→ books.syntax_glosses (JSONB)
  series/<slug>/l1_adjustments.md ────→ effective CEFR overrides
```

### Shared data artifacts

Both projects use EFLLex as the CEFR classification backbone. The graded
reader project's `data/efllex.json` (15,281 entries, Rule C applied) is
the canonical source. Relato's `cefrLookup.js` should be regenerated
from this file.

The PHRASE List (`data/phrase_list.json`, 506 entries) is the canonical
source for non-compositional classification. Relato should bundle or
reference this data for particle identification during ingestion and
for compositionality-aware encounter crediting.

---

## Vocabulary Manifest Schema

The vocabulary manifest is an **override file** produced per-series during
graded reader authoring and stored **per-book** in Relato as a JSONB column
on the `books` table (`vocabulary_manifest`). It does NOT duplicate the
base dictionaries. It contains only entries where the base dictionary is
insufficient: sense disambiguation, multi-word particles, false friend
warnings, and pedagogical notes. Typically 20–50 entries per book.

The graded reader project produces the manifest as
`series/<slug>/vocabulary_manifest.json`. At ingestion time, it is pasted
into AdminPanel's book form and stored on the `books` row. ReadingView
fetches the manifest for the current book and passes it to TextDisplay
(for particle detection) and WordPopup (for single-word translation
overrides). AdminPanel detects and displays which locales are populated.

### Multi-locale format

Manifests use a `translations` object keyed by locale code instead of a
single `spanish` field. Old manifests with `spanish` are still accepted
via backward-compat detection in `src/lib/translations.js`.

### When an entry belongs in the manifest

Include an entry only when one or more of these conditions apply:

1. **Sense disambiguation** — the word has multiple common translations and
   the book uses a specific sense (e.g., "watch" → "observar" not "reloj")
2. **Multi-word particle** — phrasal verbs and chunks that don't exist as
   units in the base dictionary (e.g., "put on", "pick up", "of course")
3. **False friend** — flagged in `l1_adjustments.md`; `note` MUST include
   the warning. Note: false friend warnings are Spanish-specific and stay
   in the `note` field as single-string English text.
4. **Pedagogical note** — story significance, cognate flag, cultural
   context, or L1 transfer hazard worth surfacing

If the base dictionary translation is correct for the book's context and
no note is needed, do not include the word.

### Schema (multi-locale)

```json
{
  "book": "the_cookie",
  "target_cefr": "A1",
  "generated": "2026-07-16",
  "entries": {
    "watch": {
      "type": "word",
      "pos": "v",
      "cefr": "A1",
      "translations": {
        "es": "observar",
        "zh": "观看"
      },
      "note": "Used as 'observe people' throughout, not as noun (reloj)"
    },
    "library": {
      "type": "word",
      "pos": "n",
      "cefr": "A2",
      "translations": {
        "es": "biblioteca",
        "zh": "图书馆"
      },
      "note": "False friend — 'library' ≠ librería (bookstore)"
    },
    "put on": {
      "type": "particle",
      "compositionality": "non-compositional",
      "cefr": "A2",
      "translations": {
        "es": "ponerse (ropa)",
        "zh": "穿上"
      },
      "note": "Used for clothing — 'I put on my apron'"
    },
    "take off": {
      "type": "particle",
      "compositionality": "compositional",
      "cefr": "A2",
      "translations": {
        "es": "quitarse (ropa)",
        "zh": "脱掉"
      },
      "constituents": {
        "es": { "take": "quitar", "off": "de encima" },
        "zh": { "take": "脱", "off": "掉" }
      }
    }
  }
}
```

### Schema (old format — still accepted)

```json
{
  "entries": {
    "watch": {
      "type": "word",
      "pos": "v",
      "cefr": "A1",
      "spanish": "observar",
      "note": "..."
    }
  }
}
```

Old manifests with `spanish` field and flat `constituents` (values are
strings) are detected automatically by the backward-compat helpers in
`translations.js`. No re-ingestion required for existing books.

### Field reference

| Field | Required | Description |
|---|---|---|
| `book` | yes | Book slug, matches `books.id` in Relato |
| `target_cefr` | yes | Book CEFR target range (e.g., "A1") |
| `generated` | yes | Date manifest was generated (YYYY-MM-DD) |
| `entries` | yes | Map of lemma/phrase → entry object |
| `entries.*.type` | yes | `"word"` or `"particle"` |
| `entries.*.pos` | yes (words) | Part of speech: n, v, adj, adv, n/v, etc. |
| `entries.*.cefr` | yes | CEFR level (from EFLLex for words; chunk-meaning principle for non-compositional particles; constituent ceiling for compositional particles) |
| `entries.*.translations` | yes | Object keyed by locale code → context-aware translation for the sense used in this book. Multiple senses separated by ` / `. Not all locales need to be present — missing locales fall through to the base dictionary. |
| `entries.*.compositionality` | yes (particles) | `"compositional"` or `"non-compositional"` |
| `entries.*.constituents` | conditionally | Object keyed by locale code → map of constituent word (lemma) → sense-disambiguated translation. Omit a locale key if the L1 translation is a single indivisible unit that doesn't decompose — the popup will show the unit translation without drill-down for that locale. Omitted entirely for non-compositional particles (parts don't sum to meaning). |
| `entries.*.note` | no | Pedagogical note — single English string. False friends, cultural context, story significance. Spanish-specific references (e.g., "≠ librería") are acceptable — this field is for content authors and es-speaking learners, not locale-keyed. |

### Design decisions

**Override-only, not a full dictionary.** The manifest is deliberately
small. Words where the base dictionary translation is correct and no
pedagogical note is needed are not included.

**One manifest per book, all locales in one file.** Each entry has a
`translations` object with per-locale values. Not all locales need to be
present — locales can be added incrementally. AdminPanel shows which
locales are populated (e.g., "42 entries — locales: es, zh").

**`cefr` is included even though `cefrLookup` has it.** Makes the
manifest self-contained for review. For particles, CEFR comes from the
vocabulary inventory (chunk-meaning principle), not from `cefrLookup`.

**`constituents` locale-keyed, optional per locale.** For compositional
particles, each locale's constituent map reflects the word's sense
*within the phrase*, not its default dictionary entry. If a CJK language
has no clean decomposition for a particle (the L1 translation is an
indivisible unit), omit that locale from `constituents` — the popup will
show the unit translation without drill-down. Non-compositional chunks
never have `constituents`.

**`note` stays a single English string.** False friend warnings are
Spanish-specific ("library ≠ librería") and not meaningful for zh/ja/ko
learners. Rather than locale-keying notes, keep them as author-facing
English text with Spanish L1 references where relevant.

---

## Syntax Glosses

Syntax glosses provide **full-text phrase-level L1 translations** for
every sentence in a curated text. Where the vocabulary manifest handles
word- and particle-level translations, syntax glosses handle the
structures that connect them — clauses, phrases, and constructions whose
meaning is not recoverable from individual word translations alone.

### Motivation

A2–B1 readers often understand every word in a sentence but cannot parse
the syntax: relative clauses, participial phrases, conditionals, passive
constructions. Word-level popups don't help because the problem is
structural, not lexical. Syntax glosses provide a full interlinear-style
translation layer the student can lean on when syntax impedes
comprehension — analogous to the reading support common in CJK language
learning tools.

### Full-text segmentation model

Syntax glosses are a **complete, contiguous segmentation** of the chapter
text into non-overlapping phrase-level chunks. Every word in the text
belongs to exactly one syntax gloss. This means the file covers the
entire text, not just anticipated problem spots — the author cannot
reliably predict where every learner will get lost, and full coverage
lets the UI offer granularity modes.

Each gloss carries a `complexity` flag (`"simple"` or `"complex"`).
Translation mode is a binary toggle (on/off). When on, all glosses are
shown — complex glosses are visually distinguished with a darker
underline color so learners can see which structures are syntactically
challenging.

### Tiling contract and whitespace

The tiling contract is **word-sequence equivalence**: the ordered sequence
of words extracted from all gloss `text` fields for a chapter must match
the ordered sequence of words in the chapter body text. Glosses are
separated by implicit single space. Paragraph boundaries and line breaks
in the source markdown are **not** represented in the gloss stream —
Relato's renderer already has paragraph structure from tokenizing the
chapter markdown; it does not need glosses to encode it.

**Scope:** Gloss the body text only. Skip `# Chapter N` header lines,
`---` horizontal rules, and any non-body markdown. Strip `*` italic
markers from gloss text — Relato renders raw text without markdown.
Include quotation marks and punctuation as they appear in the source.

### Controlled type vocabulary

Every gloss is categorized by grammatical type:

| Type | Example |
|---|---|
| `simple clause` | "She smiled." |
| `noun phrase` | "the old woman next door" |
| `relative clause` | "the one she had been saving" |
| `subordinate clause` | "even though she wasn't hungry" |
| `prepositional phrase` | "without saying a word" |
| `participial phrase` | "sitting by the window" |
| `infinitive phrase` | "to make sure no one was watching" |
| `conditional` | "if she had known earlier" |
| `passive construction` | "was given to her by the teacher" |
| `inverted structure` | "never had she seen anything like it" |
| `fragment` | "No tray. No book. No Leo." / "Not yet." / "Tomorrow." |

This list may grow as new patterns are encountered during curation.

### Interaction with word/particle popups

Syntax glosses coexist with word-level and particle-level popups. The
layers nest: a syntax gloss span may contain particles, which may contain
individual words. Tapping behavior in translation mode:

1. **Tap a syntax gloss span** → shows the phrase-level L1 translation,
   grammatical type, and complexity flag
2. **Drill down** → shows constituent sub-phrases with contextually
   appropriate L1 translations from the gloss's `constituents` map
   (locale-keyed). Constituents are rendered as a vertical list sorted
   by position in the English text — no left-to-right alignment is
   implied, which works well for SOV languages (ja, ko).
3. **Individual word/particle popups** remain available within the
   drill-down — CEFR level, definitions, encounter data

Constituent translations in the syntax gloss override the base L1
dictionary and the vocabulary manifest for words within that gloss,
ensuring the translation reflects the word's sense *in that specific
phrase*. If a locale key is missing from `constituents`, the drill-down
button is hidden for that locale.

### File format and storage

The syntax glosses file is a **separate JSON file** produced per-book
during graded reader curation, stored alongside the vocabulary manifest.
Stored as a `syntax_glosses` JSONB column on the `books` table, ingested
via AdminPanel alongside the vocabulary manifest.

### Schema (multi-locale)

```json
{
  "book": "the_cookie",
  "target_cefr": "A1",
  "generated": "2026-07-16",
  "chapters": {
    "ch01": [
      {
        "text": "I work at the college cafeteria.",
        "translations": {
          "es": "Yo trabajo en la cafetería de la universidad.",
          "zh": "我在大学食堂工作。"
        },
        "type": "simple clause",
        "complexity": "simple",
        "constituents": {
          "es": {
            "I": "yo",
            "work": "trabajo",
            "at the college cafeteria": "en la cafetería de la universidad"
          },
          "zh": {
            "I": "我",
            "work": "工作",
            "at the college cafeteria": "在大学食堂"
          }
        }
      },
      {
        "text": "the one she had been saving",
        "translations": {
          "es": "la que había estado guardando",
          "zh": "她一直存着的那个"
        },
        "type": "relative clause",
        "complexity": "complex",
        "constituents": {
          "es": {
            "the one": "la que",
            "she had been saving": "había estado guardando"
          },
          "zh": {
            "the one": "那个",
            "she had been saving": "她一直存着的"
          }
        },
        "note": "past perfect progressive — complex tense for A1 readers"
      }
    ]
  }
}
```

### Schema (old format — still accepted)

```json
{
  "chapters": {
    "ch01": [
      {
        "text": "I work at the college cafeteria.",
        "spanish": "Yo trabajo en la cafetería de la universidad.",
        "type": "simple clause",
        "complexity": "simple",
        "constituents": {
          "I": "yo",
          "work": "trabajo",
          "at the college cafeteria": "en la cafetería de la universidad"
        }
      }
    ]
  }
}
```

Old glosses with `spanish` field and flat `constituents` (values are
strings) are detected automatically by the backward-compat helpers in
`translations.js`. No re-ingestion required for existing books.

### Field reference

| Field | Required | Description |
|---|---|---|
| `book` | yes | Book slug, matches `books.id` in Relato |
| `target_cefr` | yes | Book CEFR target range |
| `generated` | yes | Date glosses were generated (YYYY-MM-DD) |
| `chapters` | yes | Map of chapter key → ordered array of gloss objects |
| `chapters.*.text` | yes | Exact text from the chapter that this gloss covers. Matched by normalized string, not character offset — survives minor text edits. Glosses must tile the chapter text contiguously with no gaps or overlaps. |
| `chapters.*.translations` | yes | Object keyed by locale code → full L1 translation of the phrase. Not all locales need to be present. |
| `chapters.*.type` | yes | Grammatical type from the controlled vocabulary |
| `chapters.*.complexity` | yes | `"simple"` or `"complex"` — drives UI filtering |
| `chapters.*.constituents` | yes | Object keyed by locale code → map of English sub-phrase (as it appears in `text`) → contextually appropriate L1 translation. Constituent keys (English sub-phrases) are the SAME across all locales — only the values change. Prefer **sub-phrase keys** that translate as semantic units over atomic word-by-word keys. Translations are **gloss-local and conjugated** to match the phrase (`"work"` → `"trabajo"` in 1st person for es, `"工作"` for zh). Omit a locale key if constituent decomposition is not meaningful for that language. |
| `chapters.*.note` | no | Pedagogical note — grammatical explanation, tense complexity, etc. Single English string, not locale-keyed. |

### Design decisions

**Full-text segmentation, not problem-spot annotation.** Every word is
covered. The `complexity` flag lets the UI filter to just the hard
structures when a student wants scaffolded (not full) support. Authoring
the simple glosses is fast; the value of full coverage is that no student
hits an untranslated gap.

**String-keyed, not offset-keyed.** Glosses are matched by normalized
text string, not character positions. This survives text edits (typo
fixes, minor rewording) without invalidating the gloss file. Resolution
to character positions for rendering happens at ingestion or render time
via text matching.

**Separate file from the vocabulary manifest.** The manifest is keyed by
lemma (word-level overrides); syntax glosses are keyed by text span
(phrase-level segmentation). Different shape, different authoring
workflow, different storage column (`syntax_glosses` vs
`vocabulary_manifest` on `books`).

**Constituents on every gloss, locale-keyed.** Each gloss carries its
own constituent translations per locale rather than falling through to
the vocabulary manifest or base dictionaries. This gives the author full
control over per-phrase sense disambiguation. If a locale's constituent
decomposition is not meaningful (e.g., the L1 translation is structurally
different enough that English sub-phrase keys don't map), omit that
locale from `constituents` — the popup will hide the drill-down for
that locale.

**Sub-phrase keys over atomic keys.** Constituent keys should be semantic
units that translate naturally together (`"at the college cafeteria"` →
`"en la cafetería de la universidad"` / `"在大学食堂"`), not
one-word-per-key breakdowns. Atomic keys for function words are noise.
Word-level interactivity is already handled by the word/particle popup.

**Conjugated, gloss-local translations.** Constituent translations are
conjugated to match the phrase context (`"work"` → `"trabajo"` in first
person for es, `"trabaja"` in third). This means the same English word
may map to different L1 translations across glosses. This is intentional
— constituents serve reading comprehension, not vocabulary lookup.

**Constituent keys are English-anchored across all locales.** The same
English sub-phrases serve as keys for every locale. For SOV languages
(ja, ko), the L1 translations appear in a different order than the
English keys — this is expected. The popup renders constituents as a
vertical glossary-style list sorted by English text position, not as an
interlinear alignment, so word-order differences don't confuse the
presentation.

**Ordered array per chapter.** Glosses are ordered sequentially as they
appear in the text. The array order IS the segmentation — adjacent glosses
tile the chapter text from beginning to end.

**Vocabulary manifest stays book-level; syntax glosses are chapter-level.**
The manifest is lemma-keyed — a word carries one sense throughout the book
(by design in controlled vocabulary writing). Syntax glosses tile a
specific chapter's text and are meaningless without that chapter's exact
word sequence. Different granularity, different shape, both correct for
what they do.

---

## Project Structure

```
relato/
  scripts/
    build-data.mjs      — generates cefrLookup.js + lemmaMap.js
    build-zh-dict.mjs   — generates zh_dictionary.js from CC-CEDICT
    build-ja-dict.mjs   — generates ja_dictionary.js from JMdict
    build-ko-dict.mjs   — generates ko_dictionary.js from KENGDIC
    .cache/             — downloaded dictionary source files (gitignored)
  src/
    components/
      reading/          — Read & Track, word highlighting, popups
      flashcards/       — CardCreator, FlashcardPage, LeitnerReview
      shadowing/        — ShadowingPlayer, audio controls
      teacher/          — TeacherDashboard, class management
      workshop/         — Story Workshop
      admin/            — AdminPanel, corpus ingestion
      onboarding/       — Onboarding flow
      shared/           — Layout, LoginPage, shared UI
    hooks/              — useAudioRecorder, useProgressSync
    lib/
      supabase.js       — Supabase client
      db.js             — IndexedDB stores
      wordUtils.js      — CEFR lookup, lemma resolution
      locales.js        — L1_LOCALES, DEFAULT_L1, getL1Label()
      translations.js   — L1 dictionary registry, manifest/gloss helpers
      srs.js            — Leitner SRS logic
    data/
      cefrLookup.js     — EFLLex CEFR levels (10,019 words)
      lemmaMap.js       — inflection → headword (34,466 mappings)
      es_dictionary.js  — Spanish translations (~3k)
      zh_dictionary.js  — Mandarin translations (~7.2k)
      ja_dictionary.js  — Japanese translations (~8.2k)
      ko_dictionary.js  — Korean translations (~7.7k)
      en_dictionary.js  — English definitions (~3.4k)
      egpLookup.js      — EGP grammar pattern lookup
      egpL1Overlays.js  — locale-keyed grammar overlays (es populated)
    context/
      AuthContext.jsx    — auth + profile (exposes l1)
  supabase/
    migrations/         — SQL migration files
  netlify/
    functions/          — Serverless API proxies (MW dictionary)
```

---

## Environment Variables

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_MW_LEARNERS_KEY
VITE_ELEVENLABS_API_KEY
VITE_ELEVENLABS_VOICE_IDS
VITE_AZURE_SPEECH_KEY
VITE_AZURE_SPEECH_REGION
```

---

## AI Pronunciation Assessment Pipeline

### Overview

Students record oral read-alouds in ReadingView (saved to Supabase Storage
as webm/opus). The pronunciation assessment pipeline transcribes the
recording, diffs the transcript against the reference text, obtains
per-word accuracy scores, generates AI flag events, and surfaces results
in the reading view.

### Architecture: Client-Orchestrated Chunked Pipeline

The pipeline uses two Netlify functions orchestrated by the client. Audio
is chunked by sentence groups so Azure PA processes the full recording
rather than truncating after the first ~15 seconds.

**Why chunking:** Azure's single-shot REST API only processes one
recognition turn (~15–60s of audio). Sending a full multi-minute recording
in one call meant most words got no Azure score, defaulting to accuracy
100 (green). This eliminated yellow highlighting (60–80 accuracy range)
and made the assessment data unreliable. Sentence-level chunking gives
Azure a short, precisely-aligned audio slice with matching reference text
for every part of the recording.

**Why Whisper is still needed:** Whisper's word-level timestamps are what
make chunking possible — they tell the client where each word lives in
the audio so it can slice precisely at sentence boundaries. Whisper also
provides "you said X instead of Y" feedback for substitutions, which
Azure PA alone cannot (Azure scores pronunciation quality but doesn't
transcribe what was actually said).

```
Student saves recording (existing flow)
  → Recording uploaded to Supabase Storage (existing)
  → Client sets assessment_status = 'pending'
  → Client calls Netlify fn: transcribe-whisper
      → Downloads audio from Supabase Storage (service role key)
      → Sends to OpenAI Whisper API (whisper-1)
      → Returns transcript + word-level timestamps
  → Client runs word alignment locally (edit distance, pure JS)
  → Client detects sentence boundaries, groups into chunks (≥15 words)
  → Client decodes audio to AudioBuffer (Web Audio API, 16kHz mono)
  → For each chunk (in parallel):
      → Slices audio by Whisper timestamps (+ 300ms buffer)
      → Uploads chunk WAV to Supabase Storage
      → Calls Netlify fn: assess-pronunciation with chunk audio + ref text
      → Cleans up chunk WAV from storage
  → Client merges all chunk Azure results into one word score array
  → Client merges: alignment + merged Azure scores → flag events
  → Client writes pronunciation_assessments row + flag_events to Supabase
  → Client sets assessment_status = 'complete'
  → TextDisplay renders assessment overlay
```

**Chunking algorithm:** Sentences are detected using the same
`detectSentences()` used by the reading view. Consecutive sentences are
grouped until the chunk reaches ≥15 words (`CHUNK_MIN_WORDS`). A trailing
remainder smaller than half the minimum is merged into the last chunk.
This ensures every chunk has enough substance for Azure PA to score
accurately, while never splitting mid-sentence. The 15-word floor
accommodates A1–A2 graded readers with many short sentences and fragments;
longer B1+ sentences naturally stand alone.

**Pause detection:** Pauses between sentences are suppressed (natural
breath pauses, not pedagogically meaningful). Only mid-sentence pauses
≥1000ms are flagged. The 1000ms threshold is appropriate for L2 learners
— shorter pauses are normal for English language learners. The threshold
can be adjusted empirically once real usage data is available.

### Whisper Transcription (OpenAI)

OpenAI's Whisper API (`whisper-1`) provides transcription with word-level
timestamps. It accepts webm/opus directly. The Netlify function
`transcribe-whisper.js` downloads the recording from Supabase Storage
using the service role key, sends it to OpenAI, and returns the transcript
+ word timestamps.

Server-side env vars: `OPENAI_API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`.

### Word Alignment (Client-Side)

After receiving the Whisper transcript, the client runs a word-level edit
distance alignment (Wagner-Fischer) between the spoken words and the
reference text words. This produces an alignment array:

```json
[
  { "type": "match",        "refWord": "the", "refIdx": 0, "spokenWord": "the", "spokenIdx": 0, "timestampMs": 120 },
  { "type": "substitution", "refWord": "cat", "refIdx": 1, "spokenWord": "cut", "spokenIdx": 1, "timestampMs": 450 },
  { "type": "omission",     "refWord": "sat", "refIdx": 2, "spokenWord": null,  "spokenIdx": null, "timestampMs": null },
  { "type": "insertion",    "refWord": null,   "refIdx": null, "spokenWord": "um", "spokenIdx": 2, "timestampMs": 780 }
]
```

Word normalization: lowercase, strip punctuation, expand contractions
(reuses `CONTRACTIONS` from `wordUtils.js`).

Azure-to-alignment mapping filters out Azure Insertion entries and maps
sequentially to all reference words (not just matches/substitutions),
correctly handling Azure's omission detection.

### Azure Pronunciation Assessment

The Netlify function `assess-pronunciation.js` downloads audio from
Supabase Storage and sends it to Azure Speech with Pronunciation
Assessment config (referenceText, granularity=Word, dimension=
Comprehensive, enableMiscue=true). Returns per-word accuracy scores
(0–100), fluency, prosody, and completeness scores. Called once per
sentence chunk — each chunk is a short audio slice with matching
reference text.

Server-side env vars: `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

**Audio format:** Client converts webm/opus to 16kHz mono WAV via Web
Audio API (`decodeAudioBlob` + `encodeWavSlice` in `audioUtils.js`)
before uploading chunks.

**L2 accent calibration:** Azure PA scores accented-but-intelligible
speech at 75–95, so thresholds are raised above Azure's defaults to
surface meaningful variation for L2 learners:
- Green: ≥95 (near-native)
- Yellow: 75–95 (accented but intelligible, not flagged)
- Orange: 50–75 (flagged, needs work)
- Red: <50 (flagged, high severity)
Flag threshold: <75. Words scoring 75–95 get yellow UI treatment but
no flag event.

### Database Schema

**New columns on `student_recordings`:**
- `assessment_status` text (null | 'pending' | 'processing' | 'complete'
  | 'error')
- `assessment_error` text (nullable)

**New table `pronunciation_assessments`:**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | |
| `text_id` | text FK → curated_texts | |
| `whisper_transcript` | text | Full Whisper transcript |
| `whisper_word_timestamps` | jsonb | `[{word, start, end}]` |
| `alignment` | jsonb | `[{type, refWord, refIdx, spokenWord, spokenIdx, timestampMs}]` |
| `azure_word_scores` | jsonb | `[{word, accuracy, errorType}]` |
| `azure_fluency_score` | float | |
| `azure_prosody_score` | float | |
| `azure_completeness_score` | float | |
| `overall_accuracy` | float | Computed mean of matched word scores |
| `processed_at` | timestamptz | |

Unique constraint on (user_id, text_id). RLS: students read own, teachers
read enrolled students' (same pattern as `student_recordings`).

Uses the existing `flag_events` table with `source = 'ai'`.

### Flag Event Generation

From the merged Whisper alignment + Azure scores, `flag_events` rows are
generated with `source = 'ai'`:

| Condition | flag_type | severity |
|---|---|---|
| Word omitted (skip) | `skip` | 3 |
| Word substituted | `mispronunciation` | 3 |
| Azure accuracy < 40 | `mispronunciation` | 5 |
| Azure accuracy 40–50 | `mispronunciation` | 4 |
| Azure accuracy 50–65 | `mispronunciation` | 3 |
| Azure accuracy 65–75 | `mispronunciation` | 2 |
| Azure hesitation detected | `hesitation` | 2 |

### UI Integration

**RecordReviewStrip:** After save, shows "Analyzing pronunciation..."
spinner during processing. On complete, shows summary bar with overall
accuracy % and count of words needing work. Error state with retry button.

**TextDisplay:** Accepts `wordAssessmentMap` prop. Renders colored
underlines on assessed words (additive — does not replace CEFR underlines
or sentence highlighting):
- Green: accuracy 95+ (near-native)
- Yellow: accuracy 75–95 (accented but intelligible, not flagged)
- Orange: accuracy 50–75 (flagged, needs work)
- Red: accuracy < 50 or omitted (flagged, high severity)

**WordPopup:** Accepts `assessmentInfo` prop. Shows pronunciation section:
- Accuracy score
- For substitutions: "You said: [X] — Expected: [Y]"
- For omissions: "This word was skipped"
- Phoneme details from Azure data

### Files

**New files:**
- `supabase/migrations/009_pronunciation_assessments.sql`
- `src/lib/alignment.js` — word-level edit distance (Wagner-Fischer)
- `src/lib/pronunciation.js` — client-side pipeline orchestrator
- `netlify/functions/transcribe-whisper.js` — Groq Whisper proxy
- `netlify/functions/assess-pronunciation.js` — Azure PA proxy

**Modified files:**
- `src/components/reading/ReadingView.jsx` — trigger assessment after
  save, manage assessment state, pass data to child components
- `src/components/reading/RecordReviewStrip.jsx` — assessment
  status/summary UI
- `src/components/reading/TextDisplay.jsx` — assessment overlay rendering
- `src/components/reading/WordPopup.jsx` — pronunciation details section

### Cost Estimates

OpenAI Whisper: ~$0.10/hour of audio. Azure PA: ~$1/hour. Azure is billed
on total audio duration, not number of API calls, so sentence-level
chunking does not increase Azure cost vs. a single call that processes the
same audio. For a class of 30 students doing 2 recordings/week, each
3 minutes: ~$3.30/week (~$130/year).

**Cost decision (2026-07):** An earlier design ("flagged segments only")
would have sent only Whisper-flagged segments to Azure PA, reducing Azure
cost to ~$0.50–1.00/week. This was rejected because it fundamentally
cannot produce yellow (60–80 accuracy) highlighting — Whisper is
speech-to-text and cannot score pronunciation quality on correctly-
transcribed words. Full Azure coverage is necessary for meaningful
pronunciation feedback. If Relato scales, the service will need to charge
for pronunciation assessment.

### Future: Chunk-Level Pronunciation Feedback

Word-level assessment is the foundation, but much A2–B1 pronunciation
difficulty is suprasegmental — linking, phrasal stress, and chunking live
between words, not inside them. Deferred for now; document the design so
it can be layered on without schema changes.

**The problem:** A student who says every word correctly but pauses between
each one ("I... put... on... my... apron") scores fine per-word but sounds
non-fluent. Word-level scores also miss linking failures ("pick_it_up" as
one phonological phrase) and phrasal stress shifts that change meaning.

**What the existing data supports:** Whisper word-level timestamps already
contain inter-word pause duration. At render time, particle spans and
syntax gloss spans can group word-level timestamps and scores into
chunk-level feedback — no additional API call needed.

**Chunk-level signals (computable from existing data):**
- Max inter-word pause within a particle or syntax gloss span (threshold
  TBD empirically, ~300ms starting point). Flags "choppy" delivery of
  phrases that should flow as one breath group.
- Mean word accuracy within a chunk vs. individual word accuracy — catches
  words that are accurate in isolation but degrade in connected speech.
- Azure's global fluency and prosody scores, correlated with chunk
  boundaries, may reveal which phrase types cause the most disfluency.

**What it doesn't support (would need new data):** Phonological linking
quality, phrasal stress placement, and intonation contour within a chunk
require features Azure PA doesn't localize to phrases. These would need
either a more granular ASR model or teacher annotation.

**UI approach (when built):** Surface chunk-level feedback alongside
word-level — e.g., a syntax gloss span highlighted as "choppy" with a
tap target that says "Try saying this phrase as one breath group." Teacher
view would show which chunk types (relative clauses, phrasal verbs) a
student consistently fragments.

**Why defer:** Word-level feedback is concrete, API-supported, and
sufficient for the teacher review workflow. Chunk-level analysis is a
computation over data already being captured, grouped by spans already
defined in the reading view. It can be added without schema changes once
there's real word-level usage data to calibrate thresholds against.

### Known Risks

- **Netlify timeout:** Each chunk's Azure PA call must complete within
  the Netlify function timeout (~10–26s). Sentence-level chunks produce
  short audio slices (typically 5–30s), well within limits. Whisper
  processes the full recording in one call (~5–8s for 5-min audio).
  If timeouts occur: set function timeout to 26s in config, or move to
  Supabase Edge Functions.
- **Parallel chunk uploads:** All chunks upload to Supabase Storage and
  call Azure PA in parallel. For long texts with many chunks, this could
  hit Supabase or Azure rate limits. Monitor and add sequential fallback
  if needed.
- **L2 accent over-flagging:** Threshold at < 60 (not default ~80).
  Future: change-over-time analysis (compare accuracy across recordings
  for the same word).

### Future: Azure-Only Pipeline (Drop Whisper)

Whisper currently serves two purposes: (1) providing word-level timestamps
for audio slicing, and (2) identifying what the student actually said for
substitution feedback ("You said X instead of Y").

Azure's Speech SDK with continuous recognition could replace both Whisper
and the chunking approach entirely — it handles long audio natively via
WebSocket streaming and provides pronunciation assessment for the full
recording in one call. Azure also returns word-level Offset/Duration
timestamps that could replace Whisper's for pause detection.

**Why not yet:** Continuous recognition requires a persistent WebSocket
connection, which exceeds Netlify Functions' timeout. Moving to this
approach requires a different backend — Supabase Edge Functions, a
dedicated server, or Azure Functions. The "You said X" substitution
feedback would also be lost (Azure PA scores pronunciation quality but
doesn't transcribe the spoken word). When Relato's backend architecture
evolves, this is a simplification worth pursuing.

---

## Shadow Read Sentence-Level Pronunciation Feedback

### Overview

Shadow read mode provides immediate, per-word pronunciation feedback on
individual sentences. This is distinct from the full-text recording
pipeline above — it assesses one sentence at a time during the
listen-and-repeat loop, with results displayed inline before the student
moves on.

### Flow

Student loops a sentence → records themselves → taps feedback button →
sees per-word colored underlines (green/yellow/orange/red) with phoneme-
level IPA detail on tap.

### Pipeline

1. Client encodes sentence recording as 16kHz mono WAV (Web Audio API)
2. Uploads WAV to Supabase Storage (ephemeral)
3. Calls `assess-pronunciation` Netlify function with audio URL +
   sentence reference text
4. Azure PA returns per-word accuracy scores + per-phoneme IPA scores
   (`Granularity: 'Phoneme'`, `PhonemeAlphabet: 'IPA'`)
5. Client renders colored underlines on each word in the sentence

No Whisper step — single sentences don't need chunking or alignment.

### Thresholds (L2-calibrated)

Native speakers score in the high 80s on Azure PA. Thresholds are raised
above Azure defaults to surface meaningful variation for L2 learners:

| Color | Accuracy range | Meaning |
|---|---|---|
| Green | ≥ 90 | Near-native |
| Yellow | 70–90 | Accented but intelligible (no flag) |
| Orange | 50–70 | Needs work (flagged) |
| Red | < 50 | High severity (flagged) |

Flag threshold: < 70 (words below this generate flag events).

### Phoneme-Level IPA Feedback

Tapping a word with a pronunciation score opens a popup showing clickable
IPA phonemes from Azure PA. Each phoneme is color-coded by its individual
accuracy score. Tapping a phoneme expands an inline detail panel with:

- Articulation instruction (learner-friendly, authored in
  `src/data/ipaPhonemes.js`)
- Front-view mouth diagram (parametric SVG in
  `src/components/reading/MouthDiagram.jsx`) showing lip shape, tongue
  position, teeth visibility, and articulation zone highlights
- Example word with highlighted letters
- MW dictionary audio for the word (high-quality, cached to IndexedDB)

The ~44 English phonemes are a finite static dataset in `ipaPhonemes.js`.
Each entry has: type (consonant/vowel/diphthong), articulation zone,
tongue position, lip shape, example word, and instruction text. Azure
symbol variants (g/ɡ, r/ɹ, vowels with/without length marks) are
included as duplicate keys.

### What makes this novel

Pronunciation feedback is contextualized within the reading experience
rather than isolated as a separate drill. The student encounters a word
in a story, hears it in a model reading, shadows it, and gets phoneme-
level feedback — all without leaving the text. This integrates
pronunciation into the extensive reading loop alongside vocabulary depth
tracking and syntax glosses.

### Files

- `src/data/ipaPhonemes.js` — ~44 phoneme articulation entries
- `src/components/reading/MouthDiagram.jsx` — parametric front-view SVG
- `src/lib/mwDictionary.js` — MW dictionary audio fetch + playback
- `src/lib/pronunciation.js` — `assessSentencePronunciation()` orchestrator
- `netlify/functions/assess-pronunciation.js` — Azure PA proxy
- `src/components/reading/WordPopup.jsx` — phoneme display + detail panel
- `src/components/reading/TextDisplay.jsx` — colored underline rendering

### Future: Custom Phoneme Articulation Animations

The current mouth diagrams are programmatic SVGs — functional but static.
No freely licensed comprehensive animation set exists for all 44 English
phonemes (the closest proprietary resource, University of Iowa's Sounds
of Speech, is not user-friendly for non-linguist language learners).

Building 44 custom animations (AI-assisted) is a feasible project that
would replace `MouthDiagram.jsx` with animated assets showing tongue
movement, airflow, and voicing. Design goals: learner-friendly (front
view, not sagittal cross-section), culturally neutral, contextual (shown
alongside the word and sentence where the student struggled). These would
be produced incrementally and integrated as they're completed — the
current SVG diagrams serve as fallback for any phoneme without a custom
animation.
