# Cadence — Project Context

*Extensive reading, intensive practice.*

## What This App Is

Cadence is a React (Vite) ESL reading and vocabulary acquisition app for
Spanish-speaking A2–B2 English learners, with emphasis on adolescent and
young adult long-term English learners (LTEL) in K-12 settings.

Core loop: Read extensively → Encounter vocabulary → Track depth of
knowledge through a 5-level fluency model → Practice via flashcards
and shadow reading → Re-read to build fluency → Repeat.

Cadence is a redesign of VocabFrontier (`C:\Users\User\vocab-reader-app`).
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

Cadence reuses and adapts code from VocabFrontier where appropriate.
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

Cadence measures word knowledge through a fluency development lens.
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

### Read & Track
Text display with word-level highlighting. Click triggers word popup
with definition, Spanish translation, English definition. Cursor-gated
colored underlines by vocabulary tier. Encounter tracking across sessions.

### Flashcards (Leitner SRS)
Five-box Leitner system. Intervals: Box 1 = immediate, 2 = 1 day,
3 = 3 days, 4 = 1 week, 5 = 2 weeks. Card types: dual (word + L1),
definition, cloze. Pleco-style 0–5 response scale. Cards recommended
from quiz results, not auto-added.

### Shadow Reading
Full-screen audio playback with synchronized word-level highlighting.
ElevenLabs-generated audio (admin-time, cached in Supabase Storage).
Speed slider (0.5×–1.25×). Sentence loop for practice. Student
self-recording with playback.

Shadowing is a fluency activity, not vocabulary acquisition. Words
receive cursor-level passive encounter credit only (depth ceiling 0.10).

### Story Workshop
Guided writing with vocabulary scaffolding. Will be redesigned for
Cadence (carried over from VocabFrontier as a concept, not as code).

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
- `curated_texts` — admin-managed corpus texts (authoritative store)
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

Cadence uses **EFLLex** (EFL Lexicon) as its sole vocabulary classification
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
- `es_dictionary.js` — ~37k Spanish definitions
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

### AWL (Academic Word List) — Not Used
AWL is not maintained as a separate system. 82% of AWL headwords appear
in EFLLex naturally (mostly at B1–C1). The remaining 18% are tracked as
unclassified when encountered.

### NGSL / BNC/COCA — Not Used
Cadence does not use NGSL bands, BNC/COCA frequency tiers, or the
BAND_TIER_MAP system from VocabFrontier. The `lemmaMap.js` file was
extracted from wordData.js for its inflection-to-headword mappings only;
the frequency data was discarded.

### English Definition Lookup Order
1. IndexedDB cache (`enDefinitions` store)
2. Bundled `en_dictionary.js`
3. Merriam-Webster Learner's Dictionary API (`VITE_MW_LEARNERS_KEY`)
4. Cache MW results to IndexedDB

### Build script
`scripts/build-data.mjs` regenerates `cefrLookup.js` and `lemmaMap.js`
from source files. Run `node scripts/build-data.mjs` if source data changes.

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
