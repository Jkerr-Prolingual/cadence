# Relato — Project Context

*Leer, escuchar, y aprender inglés.*

## What This App Is

Relato is a React (Vite) ESL reading and vocabulary acquisition app for
Spanish-speaking A2–B2 English learners, with emphasis on adolescent and
young adult long-term English learners (LTEL) in K-12 settings.

Core loop: Read extensively → Encounter vocabulary → Track depth of
knowledge through a 5-level fluency model → Practice via flashcards
and shadow reading → Re-read to build fluency → Repeat.

Relato is a redesign of VocabFrontier (`C:\Users\User\vocab-reader-app`).
It keeps the reading, lookup, flashcard, shadow reading, story workshop,
and teacher control features but drops the frontier-based profiling,
island/hex map metaphor, development scores, and terrain states.

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
- Definition/translation fetching + caching chain (MW API, es_dictionary,
  en_dictionary, IndexedDB cache)
- Auth context (Supabase auth + role management)
- Word highlighting + click-to-lookup popup pattern
- Flashcard creation (CardCreator, FlashcardPage)
- Data files: es_dictionary.js, en_dictionary.js, BNC/COCA frequency
  data, NGSL, AWL word lists

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
CEFR level, Spanish translation, English definition. For particles, the
popup supports Pleco-style drill-down to constituent words and back up to
the particle as a unit (see "Particle-aware reading view" in the Particle
Model section). Cursor-gated colored underlines by CEFR tier. Encounter
tracking across sessions.

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
- `books` — book containers grouping curated_texts, with `vocabulary_manifest` JSONB
- `curated_texts` — admin-managed corpus texts (authoritative store), linked to books via `book_id`
- `user_progress` — per-user JSONB for userWords and wordEncounters
- `reading_sessions` — per-pass records (silent/oral/shadow mode)
- `recordings` — oral read-aloud audio files
- `transcriptions` — STT + pronunciation assessment output
- `flag_events` — unified flags (student/AI/teacher source)
- `fluency_sessions` — timed reading and shadowing session logs
- `srs_cards` — Leitner box flashcard state
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
- `es_dictionary.js` — ~3k Spanish definitions (NGSL + AWL focused).
  Only covers ~28% of EFLLex words — insufficient on its own. Serves as
  the static fallback layer; series vocabulary manifests are the primary
  translation source for curated content.
- `en_dictionary.js` — ~3,400 learner-friendly English definitions

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

### Spanish Translation Lookup Order
1. **Book vocabulary manifest** (override layer) — sense-disambiguated
   translations, multi-word particles, and pedagogical notes generated
   per-book during graded reader production. Stored as JSONB on the
   `books` table (`vocabulary_manifest` column). Only includes entries
   where the base dictionary translation is insufficient: wrong sense in
   context, phrasal verbs that don't exist as units in the base dictionary,
   false friend warnings, or story-specific notes. Typically 20–50 entries
   per book, not a full dictionary.
2. Bundled `es_dictionary.js` — base translations for all single words.
   Covers EFLLex vocabulary plus common content words. The manifest
   overrides this when a book-specific sense or note is needed.
3. *(Future)* API fallback for native/uncurated content — translation
   API or LLM call with sentence context, cached to IndexedDB

The manifest is produced during graded reader authoring, not at ingestion
time. The LLM has full text context during production, so translations
are sense-disambiguated (e.g., "watch" → "observar" not "reloj" in a
story about observing people). Manifests are reviewed and version-controlled
in the graded reader project alongside chapter text and vocabulary
inventories.

For non-curated or native content without a manifest, the lookup falls
through to the static dictionary and eventually to an API layer. This
ensures coverage scales beyond EFLLex's ~10k ceiling as students advance
to B2+ material.

### English Definition Lookup Order
1. IndexedDB cache (`enDefinitions` store)
2. Bundled `en_dictionary.js`
3. Merriam-Webster Learner's Dictionary API (`VITE_MW_LEARNERS_KEY`)
4. Cache MW results to IndexedDB

### Build script
`scripts/build-data.mjs` regenerates `cefrLookup.js` and `lemmaMap.js`
from source files. Run `node scripts/build-data.mjs` if source data changes.

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
   a unit, CEFR level, Spanish translation, compositionality tag
2. **Decompose** → shows constituent words ("pick", "up") with their own
   CEFR levels and translations
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
  override file with sense-disambiguated translations, multi-word particles,
  and pedagogical notes. Only entries where the base dictionary is
  insufficient. Schema and details below in "Vocabulary Manifest Schema."
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
- **Vocabulary manifest** — context-aware Spanish translations for all
  words and particles in the text, stored as JSONB on the `books` table
  (`vocabulary_manifest` column), ingested from the graded reader
  project's `vocabulary_manifest.json` via AdminPanel
- Audio (ElevenLabs TTS with word-level timestamps)
- L1 adjustments (cognate/false-friend effective CEFR overrides)

### Data flow

```
graded_readers/                          cadence/
  data/efllex.json ───────────────────→ build-data.mjs → cefrLookup.js
  data/phrase_list.json ──────────────→ particle lookup table
  data/observed_chunks.json ──────────→ particle lookup table
  series/<slug>/chapters/ch*.md ──────→ curated_texts (Supabase + IndexedDB)
  series/<slug>/vocabulary_inventory ─→ per-text particle metadata
  series/<slug>/vocabulary_manifest ──→ books.vocabulary_manifest (JSONB)
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
base dictionary (`es_dictionary.js`). It contains only entries where the
base dictionary is insufficient: sense disambiguation, multi-word particles,
false friend warnings, and pedagogical notes. Typically 20–50 entries per
book.

The graded reader project produces the manifest as
`series/<slug>/vocabulary_manifest.json`. At ingestion time, it is pasted
into AdminPanel's book form and stored on the `books` row. ReadingView
fetches the manifest for the current book and passes it to TextDisplay
(for particle detection) and WordPopup (for single-word translation
overrides).

### When an entry belongs in the manifest

Include an entry only when one or more of these conditions apply:

1. **Sense disambiguation** — the word has multiple common translations and
   the book uses a specific sense (e.g., "watch" → "observar" not "reloj")
2. **Multi-word particle** — phrasal verbs and chunks that don't exist as
   units in the base dictionary (e.g., "put on", "pick up", "of course")
3. **False friend** — flagged in `l1_adjustments.md`; `note` MUST include
   the warning
4. **Pedagogical note** — story significance, cognate flag, cultural
   context, or L1 transfer hazard worth surfacing

If the base dictionary translation is correct for the book's context and
no note is needed, do not include the word.

### Schema

```json
{
  "book": "the_cookie",
  "target_cefr": "A1",
  "generated": "2026-06-09",
  "entries": {
    "watch": {
      "type": "word",
      "pos": "v",
      "cefr": "A1",
      "spanish": "observar",
      "note": "Used as 'observe people' throughout, not as noun (reloj)"
    },
    "library": {
      "type": "word",
      "pos": "n",
      "cefr": "A2",
      "spanish": "biblioteca",
      "note": "False friend — 'library' ≠ librería (bookstore)"
    },
    "apron": {
      "type": "word",
      "pos": "n",
      "cefr": "B1",
      "spanish": "delantal",
      "note": "Key story symbol — narrator's apron"
    },
    "put on": {
      "type": "particle",
      "compositionality": "non-compositional",
      "cefr": "A2",
      "spanish": "ponerse (ropa)",
      "note": "Used for clothing — 'I put on my apron'"
    },
    "pick up": {
      "type": "particle",
      "compositionality": "non-compositional",
      "cefr": "B1",
      "spanish": "recoger / levantar"
    }
  }
}
```

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
| `entries.*.spanish` | yes | Context-aware Spanish translation for the sense used in this book. Multiple senses separated by ` / `. |
| `entries.*.compositionality` | yes (particles) | `"compositional"` or `"non-compositional"` |
| `entries.*.constituents` | yes (compositional) | Map of constituent word → Spanish translation. Omitted for non-compositional particles (parts don't sum to meaning). |
| `entries.*.note` | no | Pedagogical note — false friends, cultural context, story significance, etc. |

### Design decisions

**Override-only, not a full dictionary.** The manifest is deliberately
small. Words where the base dictionary translation is correct and no
pedagogical note is needed are not included.

**One manifest per book, keyed by lemma/phrase.** Graded readers use
controlled vocabulary, so a word generally carries one sense throughout
a book. Stored as JSONB on `books.vocabulary_manifest`. Polysemy handling
(multiple senses per word within a book) is deferred until needed.

**`cefr` is included even though `cefrLookup` has it.** Makes the
manifest self-contained for review. For particles, CEFR comes from the
vocabulary inventory (chunk-meaning principle), not from `cefrLookup`.

**`constituents` only on compositional particles.** Non-compositional
chunks don't show constituent translations in the popup — displaying them
would imply the meaning is derivable from parts, which it isn't.

**`note` is the pedagogical annotation field.** Intended for content
authors reviewing the manifest and potentially surfaced in teacher-facing
views. Use for: false friends ("actually ≠ actualmente"), cultural context,
story-specific significance, or L1 transfer hazards.

---

## Project Structure

```
cadence/
  scripts/
    build-data.mjs    — generates cefrLookup.js + lemmaMap.js from source data
  src/
    components/
      reading/        — Read & Track, word highlighting, popups
      flashcards/     — CardCreator, FlashcardPage, LeitnerReview
      shadowing/      — ShadowingPlayer, audio controls
      teacher/        — TeacherDashboard, class management
      workshop/       — Story Workshop
      admin/          — AdminPanel, corpus ingestion
      onboarding/     — Onboarding flow
      shared/         — Layout, LoginPage, shared UI
    hooks/            — useAudioRecorder, useProgressSync
    lib/              — supabase client, db (IndexedDB), wordUtils
    data/             — cefrLookup, lemmaMap, dictionaries
    context/          — AuthContext
  supabase/
    migrations/       — SQL migration files
  netlify/
    functions/        — Serverless API proxies (MW dictionary)
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
