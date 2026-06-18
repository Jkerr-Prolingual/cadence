# Handoff: Grammar structure entries for graded reader manifests

## Context

Relato now supports `type: "structure"` entries in vocabulary manifests,
alongside the existing `type: "word"` and `type: "particle"` entries.
Structure entries identify grammar patterns in the chapter text that
should be highlighted in the reading view with a popup showing the
grammar explanation, L1 Spanish contrast, and a cloze card creation
button.

The CEFR level and grammar categorization come from the **English Grammar
Profile (EGP)**, a corpus-based dataset of 1,222 grammar constructs
mapped to CEFR levels by Cambridge. The graded readers project does NOT
assign CEFR levels to grammar structures -- it references EGP construct
IDs, and the level comes from the EGP data.

## What the graded readers project needs to produce

### Per book: structure entries in the vocabulary manifest

For each grammar structure that is deliberately introduced or has notable
L1 transfer implications, add a `type: "structure"` entry to the chapter
manifest. The entry is small:

```json
"egp_382__ch01": {
  "type": "structure",
  "egp_id": 382,
  "instances": ["will see", "will smile"]
}
```

That's the minimal entry. Three fields: `type`, `egp_id`, `instances`.

**How to find the right `egp_id`:** The EGP has 1,222 entries organized
by SuperCategory (FUTURE, PAST, CLAUSES, VERBS, etc.) and SubCategory.
Each entry has a guideword that describes the specific form or use.
The full EGP is available as an XLSX at
https://github.com/ninja33/EGP/raw/master/asset/egpo.xlsx or browse it
online at https://englishprofile.org/?menu=egp-online.

Examples of how constraint spec structures map to EGP IDs:

| Constraint spec structure | EGP # | EGP guideword |
|---|---|---|
| Simple present affirmative | 892 | FORM: AFFIRMATIVE |
| Simple past affirmative | 770 | FORM: AFFIRMATIVE |
| Will future (affirmative) | 382 | FORM: AFFIRMATIVE 'WILL' |
| Will future (plans/intentions) | 383 | USE: PLANS AND INTENTIONS WITH 'WILL' |
| Will future (negative) | 385 | FORM: NEGATIVE 'WILL' |
| Going-to future (intentions) | 400 | USE: INTENTIONS |
| Present continuous for future | 412 | USE: FUTURE ARRANGEMENTS |
| There is (singular) | 1095 | FORM: 'THERE IS' |
| There are (plural) | 1096 | FORM: 'THERE ARE' |
| Relative clause with 'who' (defining) | 222 | FORM: DEFINING, SUBJECT, WITH 'WHO' |
| Relative clause with 'who' (non-defining) | 221 | FORM: NON-DEFINING, SUBJECT, WITH 'WHO' |
| Phrasal verb (no object) | 1057 | FORM: NO OBJECT |
| Phrasal verb (separable, pronoun) | 1058 | FORM: VERB + PRONOUN + PARTICLE |
| Present perfect (affirmative) | 818 | FORM: AFFIRMATIVE |
| Present perfect (with 'for') | 816 | FORM/USE: TIME WITH 'FOR' |
| First conditional | Look up in CLAUSES > conditionals |

**Instance format:** Each instance is a string representing the token
sequence to find and highlight in the chapter text.

- Contiguous: `"will see"` -- matches the exact token sequence
- Gapped (discontinuous): `"picked ... up"` -- the `...` matches 1-5
  intervening tokens. Only the anchor words get highlighted.
- Case-insensitive matching (handles sentence-initial caps)
- If the same string appears multiple times in the chapter, all
  occurrences are highlighted

**What to include:**
- Structures the constraint spec explicitly permits or restricts
- Structures with notable L1 transfer implications for Spanish speakers
- Structures above the book's target CEFR (these should also have a
  `note` explaining why they appear)

**What NOT to include:**
- Unremarkable grammar (basic SVO, simple "and" coordination)
- Every instance of simple present or simple past in an A1 text
- Structures the student is expected to already know at the target level

**Optional fields:**

`note` -- book-specific pedagogical rationale (author/teacher-facing):
```json
"egp_382__ch01": {
  "type": "structure",
  "egp_id": 382,
  "note": "Above target CEFR. Three careful encounters only, in internal thought. L1-transparent.",
  "instances": ["will see", "will smile"]
}
```

`override_cefr` + `override_reason` -- only when the content author has
a justified reason to diverge from EGP's CEFR assignment:
```json
"egp_818__ch03": {
  "type": "structure",
  "egp_id": 818,
  "override_cefr": "A1",
  "override_reason": "L1-transparent: Spanish preterito perfecto maps directly. Used only with high-frequency verbs (have seen, have been) in controlled frames.",
  "instances": ["have seen", "have been"]
}
```

Valid override reasons: L1 transparency, controlled context/scaffolding,
constraint spec rationale. "I feel like this is A2" is NOT a valid reason.

### Per new structure: L1 Spanish overlay entry

When a structure appears in a graded reader for the first time across
all books, add an entry to `data/egp_spanish_overlay.json`. This is a
shared file -- entries are reused across all books that reference the
same EGP construct.

```json
{
  "382": {
    "pattern": "subject + will + verb (base form)",
    "explanation_es": "Usamos 'will + verbo' para hablar del futuro. El verbo despues de 'will' siempre va en forma base (sin conjugar).",
    "spanish_contrast": "En espanol se usa el futuro simple (vere, sonreira) -- una sola palabra conjugada. En ingles se necesitan dos: 'will' + verbo base.",
    "examples": [
      { "en": "I will see you tomorrow.", "es": "Te vere manana." },
      { "en": "She will come later.", "es": "Ella vendra despues." }
    ]
  }
}
```

| Field | Description |
|---|---|
| `pattern` | Structural formula in plain English |
| `explanation_es` | Learner-facing grammar explanation in Spanish (2-3 sentences) |
| `spanish_contrast` | How this structure differs from Spanish. The most pedagogically valuable field. |
| `examples` | 2-3 generic bilingual pairs (not from any specific book) |

**This is the substantial authoring work.** The `spanish_contrast` field
requires genuine L1 transfer expertise. But it's incremental: maybe 5-10
new overlay entries per book, and the same entries are reused as more
books cover the same structures. Growth plateaus after a few books.

**If the overlay file doesn't exist yet**, create it at
`data/egp_spanish_overlay.json` with an empty object `{}` and add
entries as needed.

## What NOT to do

- Don't assign CEFR levels to grammar structures based on author
  judgment -- reference EGP construct IDs and let the level come from
  the EGP data
- Don't build a full grammar reference -- EGP already provides the
  label, category, level, can-do statement, and example. We only add
  the Spanish layer.
- Don't include structure entries for unremarkable grammar that every
  student at the target level already knows
- Don't modify Relato code -- that's a separate project
- Don't modify existing word/particle entries in the manifest

## Workflow for a new chapter

1. Read the chapter text and constraint spec
2. Identify structures that are deliberately introduced, restricted,
   or have L1 transfer implications
3. For each structure, find the matching EGP construct ID (browse the
   XLSX or online EGP)
4. Add `type: "structure"` entries to the chapter manifest with
   instances (exact token sequences from the chapter text)
5. If this is the first time a structure appears across all books,
   add an overlay entry to `data/egp_spanish_overlay.json`
6. If a structure is above the book's target CEFR, add a `note`
   explaining why it appears

## Example: The Cookie, Chapter 1

The constraint spec permits: SVO, coordination, simple negation,
yes/no questions, wh-questions, there is/are, imperatives, simple
relative clauses with 'who'. Simple present primary tense. Will future
permitted sparingly in internal thought (3 encounters total).

Structure entries for ch01 manifest:

```json
"egp_382__ch01": {
  "type": "structure",
  "egp_id": 382,
  "note": "Above target. Internal thought only, L1-transparent.",
  "instances": ["will see", "will smile"]
},
"egp_1095__ch01": {
  "type": "structure",
  "egp_id": 1095,
  "instances": ["There is"]
},
"egp_1096__ch01": {
  "type": "structure",
  "egp_id": 1096,
  "instances": ["there are"]
},
"egp_222__ch01": {
  "type": "structure",
  "egp_id": 222,
  "note": "Only relative pronoun at A1. Contact clauses avoided.",
  "instances": ["who comes"]
}
```

Read ch01.md first and pull exact token sequences for the instances.
