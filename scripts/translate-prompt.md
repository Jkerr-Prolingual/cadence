# Spanish Translation Generation

I need you to generate Spanish translations for English vocabulary words.
These translations will be used in an ESL reading app for Spanish-speaking
A2–B2 English learners (adolescent and young adult, primarily Mexican and
Central American background).

## Your task

I will paste a JSON object containing English words grouped by CEFR level.
For each word, provide a concise Spanish translation.

Return a JSON object in the **exact same grouped format**:

```json
{
  "A1": {
    "apple": "manzana",
    "airport": "aeropuerto"
  },
  "A2": {
    "accent": "acento",
    "acre": "acre"
  }
}
```

## Translation rules

1. **Concise entries.** Give the 1–2 most common translations, separated
   by ` / ` if there are two. Do not list more than two. Example:
   `"smile": "sonreír / sonrisa"` (verb and noun senses).

2. **Neutral Latin American Spanish.** Use vocabulary natural to Mexican
   and Central American speakers. Prefer *computadora* over *ordenador*,
   *carro* over *coche*, *celular* over *móvil*, etc.

3. **Match the part of speech.** If the English word is primarily a noun,
   give the noun translation. If it functions as multiple parts of speech,
   give the most common sense first: `"clean": "limpiar / limpio"`.

4. **No definitions or explanations.** Just the Spanish word(s). No
   parenthetical clarifications, no English glosses, no usage notes.

5. **Infinitive for verbs.** Use the infinitive form: *correr*, not
   *corre* or *corriendo*.

6. **Skip words that don't have a natural Spanish translation.** If a word
   is essentially the same in Spanish (e.g., "yoga", "internet", "taxi"),
   still include it with the Spanish form: `"taxi": "taxi"`,
   `"internet": "internet"`.

7. **Compound adjectives and niche terms.** Some words may be compound
   adjectives (e.g., "old-fashioned") or domain-specific. Translate as
   naturally as possible: `"old-fashioned": "anticuado / pasado de moda"`.

8. **If genuinely untranslatable** (e.g., a very English-specific cultural
   term), use the closest Spanish approximation.

## Output format

- Return ONLY the JSON object, no commentary before or after
- Maintain the CEFR level grouping from the input
- Alphabetical order within each group (same as input)
- Every key from the input must appear in the output

## Ready

I will paste the words in my next message. There may be a lot — if you believe I need
to split across messages, please suggest how to split.
