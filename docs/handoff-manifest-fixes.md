# Handoff: Manifest fixes from Relato review

Three issues found when reviewing the Cookie ch01 manifest against
Relato's matching engine. All three require changes in the graded
readers project — Relato code is not affected.

---

## 1. Remove `constituents` from non-compositional particles

**Rule:** Non-compositional particles must NOT have a `constituents`
field. Only compositional particles get `constituents`.

**Why:** The Relato popup uses `constituents` to show drill-down
translations for each word in the phrase. For non-compositional
particles, showing part-by-part translations implies the meaning is
derivable from the parts — which is exactly wrong. "Put on" doesn't
mean "poner + encima"; it means "ponerse". Showing constituent
translations misleads the learner.

This is already documented in CLAUDE.md under "Vocabulary Manifest
Schema > Design decisions":

> Non-compositional chunks don't show constituent translations in the
> popup — displaying them would imply the meaning is derivable from
> parts, which it isn't.

**Action:** In the Cookie ch01 manifest, remove the `constituents`
field from these entries:

- `"put on"` — non-compositional, remove `constituents`
- `"put away"` — non-compositional, remove `constituents`
- `"take off"` — non-compositional, remove `constituents`
- `"take a bite"` — non-compositional, remove `constituents`

These entries should keep `type`, `compositionality`, `cefr`,
`spanish`, and `note`. Only `constituents` is removed.

The compositional particles (`"walk away"`, `"look up"`,
`"close my eyes"`) correctly have `constituents` — leave those alone
(but see issue #2 for `"close one's eyes"`).

**Apply this rule going forward:** When authoring new manifest entries,
only add `constituents` when `compositionality` is `"compositional"`.

---

## 2. Particle keys must use exact token forms, not abstract patterns

**Rule:** Particle entry keys must match the exact token sequence that
appears in the chapter text. Relato's `findParticles` does literal
token-by-token matching — it has no pronoun resolution or pattern
expansion.

**Why:** The key `"close one's eyes"` will never match because the
text contains "I close my eyes" — the tokens are `close`, `my`,
`eyes`, and `my` ≠ `one's`.

**Action:** Rename `"close one's eyes"` to the form that appears in
the chapter text. If the text says "I close my eyes", the key should
be `"close my eyes"`.

If the same particle appears with different possessives across the
chapter (e.g., "close my eyes" and "close his eyes"), register each
form as a separate entry, or register only the form you want to
highlight. The entries can share the same metadata:

```json
"close my eyes": {
  "type": "particle",
  "compositionality": "compositional",
  "cefr": "A2",
  "spanish": "cerrar los ojos",
  "constituents": {
    "close": "cerrar",
    "my": "mis",
    "eyes": "ojos"
  },
  "note": "Narrator's transition-to-reflection marker"
}
```

Note: `constituents` includes "my" → "mis" because this is a
compositional particle — every token in the span gets a translation.

**Apply this rule going forward:** Always pull particle keys from the
actual chapter text. Never use abstract/dictionary forms like
"close one's eyes" or "put on one's [clothing]". Read the chapter,
find the exact token sequence, use that as the key.

---

## 3. Structure instances must also use exact token sequences

**Rule:** The `instances` array in structure entries must contain
token sequences that literally appear in the chapter text. Same
matching engine, same constraint.

This was already documented in the grammar structures handoff, but
reinforcing it here: read the chapter text and pull the exact words.
If a structure appears as "Why does he sit alone?" then the instance
is `"does he sit"`, not `"does ... sit"` or `"do/does + subject + verb"`.

The current Cookie ch01 structure instances look correct based on the
constraint spec examples, but **verify each one against the actual
ch01.md text** before finalizing the manifest.

**Checklist for ch01 structure instances:**
- [ ] `"will see"` — appears in ch01.md text?
- [ ] `"there is"` — appears in ch01.md text?
- [ ] `"no voice"` — appears in ch01.md text?
- [ ] `"does he sit"` — appears in ch01.md text?

If an instance string doesn't appear verbatim, it won't highlight
anything — it fails silently, not with an error.

---

## Summary of changes

| Entry | Change | Reason |
|---|---|---|
| `"put on"` | Remove `constituents` | Non-compositional |
| `"put away"` | Remove `constituents` | Non-compositional |
| `"take off"` | Remove `constituents` | Non-compositional |
| `"take a bite"` | Remove `constituents` | Non-compositional |
| `"close one's eyes"` | Rename to `"close my eyes"` (or actual text form) | Exact token matching |
| Structure instances | Verify against ch01.md | Exact token matching |

No Relato code changes are needed. These are all manifest data fixes.
