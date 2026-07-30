# Teacher Data Reports & Student Data Enhancements — Spec

## Overview

Data reports for teachers, structured around the graded reader content
hierarchy rather than assignments. Assignments are the data collection
mechanism; the graded reader is the organizational structure.

Primary early customers: school districts, middle and high school
teachers managing classes of 30+ students.

---

## Data Rules

### Assignment-gated reporting

Only data from assigned work flows into teacher reports. Practice
sessions (shadow reading, unassigned timed reads, unassigned recordings)
remain visible to the student but do not appear in teacher-facing data.

| Data source | Feeds teacher reports | Feeds student view |
|---|---|---|
| Assigned timed reads | Yes | Yes |
| Assigned recordings + pronunciation assessment | Yes | Yes |
| Assigned exercises | Yes | Yes |
| Assigned flashcard practice | Yes (card count, box distribution) | Yes |
| Unassigned timed reads | No | Yes |
| Shadow reading (always practice) | No | Yes |
| Unassigned recordings | No | Yes |

### Phoneme data

Phoneme data (`phoneme_sessions`) comes from assigned recordings only.
Shadow reading provides real-time phoneme feedback to the student but
does not accumulate into longitudinal reports. Rationale: assignments
produce consistent, comparable data across students. If practice works,
the assignment captures the outcome. If it doesn't, the assignment
reveals that.

### Re-reads

When a student re-reads a chapter for an assignment, teacher reports
show only the most recent submitted recording/timed read. Students see
their own prior attempts but the teacher sees the final submission.

### Flashcard validation

Rather than relying on the current self-report checkbox for the
flashcards assignment task, count cards with `text_id` matching the
assignment's chapter and `added_date` after the assignment date. This
gives teachers a verified card count instead of a self-reported
checkmark.

---

## Content Hierarchy

Reports follow the graded reader structure at three levels:

### Global (cross-book summary)

The headline numbers across everything the student has read. Used for
at-a-glance roster views and parent conference summaries.

Metrics:
- Books completed (e.g., "1/3")
- Total cards created / mastered (box 4-5) / overdue
- Review consistency (last review date, overdue count)
- Overall WPM trend (delta between first and most recent assigned
  timed read — reported per book, not cross-book, to avoid the
  moving goalpost problem)
- Overall pronunciation accuracy (mean across assigned recordings)
- Weak phonemes (persistent low scorers across all phoneme sessions)

### Book level (the primary unit)

The story of growth through a specific text. All metrics are
within-book, so difficulty is controlled and trends are unambiguous.

Metrics:
- Chapter completion progress (chapters finished / total)
- WPM trajectory across assigned timed reads per chapter (line or
  bar showing acceleration through the book as recycled vocabulary
  becomes automatic)
- Pronunciation accuracy trend across assigned recordings per chapter
- Phoneme trends within the book (from `phoneme_sessions` linked to
  this book's chapters)
- Exercise scores per chapter, book average
- Flashcard data: cards created from this book, Leitner box
  distribution (box 1-5), mastery rate (box 4-5 / total)

### Chapter level (the detail view)

Specific assignment data for a single chapter. Where the teacher
listens, inspects, and diagnoses.

Contents:
- Recording playback (the submitted assigned recording)
- Word-level pronunciation overlay (colored underlines from
  `pronunciation_assessments`)
- Per-word accuracy scores, phoneme-level IPA detail
- Timed read WPM (the assigned submission)
- Exercise results (score, individual question results)
- Flashcard cards created from this chapter, with box status

---

## Teacher Dashboard: Reports Tab

A new "Reports" tab within the existing TeacherDashboard, alongside the
current "Assignments" tab. Same audience, same data source, different
lens.

### View 1: Class Roster Overview

One row per student, aggregated metrics from assigned work. The view a
teacher checks daily/weekly.

| Column | Source | Notes |
|---|---|---|
| Student name | `profiles` | |
| Books completed | `assignment_progress` + `curated_texts` | X/Y format |
| Assignments done | `assignment_progress` | Completed / total assigned |
| Avg WPM | `fluency_sessions` (assigned only) | Mean across all assigned timed reads |
| WPM trend | `fluency_sessions` (assigned only) | Delta: most recent minus first assigned timed read. Per-book only — do not compute cross-book deltas. Display as per-book deltas or the most recent book's delta. |
| Avg accuracy | `pronunciation_assessments` (assigned only) | Mean `overall_accuracy` across assigned recordings |
| Weak phonemes | `phoneme_sessions` (assigned only) | Phonemes with persistent low medians (threshold TBD, starting point: median < 50 across 3+ sessions) |
| Cards / Mastered | `srs_cards` | Total cards / box 4-5 count |
| Cards overdue | `srs_cards` | Cards past `next_review_date` |
| Last review | `srs_cards` | Most recent `last_review_date` |
| Exercises avg | `exercise_results` (assigned only) | Mean score across assigned exercises |

Color-coding: cells use green/yellow/red thresholds for at-a-glance
triage. Thresholds TBD empirically once real usage data exists.

Filterable by:
- **Book** — show only data from a specific book
- **Date range** — for grading periods (e.g., Oct 1 – Oct 15)

Clicking a student row drills into their individual profile.

### View 2: Individual Student Profile

The view for parent conferences, IEP meetings, and intervention
planning. Shows one student's full data, organized by book.

**Header strip:** Global metrics (books completed, total cards/mastered/
overdue, last review date, overall weak phonemes).

**Per-book cards:** One expandable card per book the student has been
assigned, showing:

- **WPM chart** — one data point per assigned timed read, ordered by
  chapter sequence. Bar chart (similar to existing `TimedReadStrip`
  style but spanning all assigned chapters). Delta badge showing
  first-to-last gain within the book.
- **Pronunciation accuracy chart** — one data point per assigned
  recording, ordered by chapter. Same visual style as WPM.
- **Phoneme panel** — phonemes assessed across this book's assigned
  recordings. Show median accuracy per phoneme with trend indicator
  (improving/stable/declining). Highlight weak phonemes. Similar to
  `PhonemeSummaryReport` but longitudinal rather than single-session.
- **Exercises** — scores per chapter, book average.
- **Flashcard summary** — cards from this book, box distribution bar
  (like existing `BoxDistribution` component), mastery rate.

Clicking a chapter within a book card drills into chapter detail.

**Date range filter:** For grading purposes, filter all data by
assignment date range. Shows only assignments due/completed within
the selected period.

### View 3: Chapter Detail

The specific data for one chapter, one student. Accessed from the
student profile drill-down.

- Recording playback (assigned submission)
- Word-level pronunciation overlay (colored underlines)
- Pronunciation scores: overall accuracy, fluency, prosody,
  completeness
- Per-word scores with phoneme-level IPA detail on tap
- Weak phonemes for this chapter
- Timed read WPM
- Exercise results (per-question breakdown)
- Flashcards created from this chapter with current box status

This is largely what the current `AssignmentCard` already shows per
student — restructured under the chapter rather than the assignment.

---

## Student-Facing Enhancements

### Flashcard tab enrichment

No new tab. Enhance the existing `FlashcardPage` with:

**Summary strip (new, top of page):**
- Total cards
- Mastery rate (box 4-5 / total, as percentage)
- Overdue count
- Last review date

**Book-level grouping (new, above chapter folders):**
Book headers above the existing chapter folder tabs. Each book header
shows: book title, card count, mastery %, overdue count. Expanding a
book shows its chapter folders (existing behavior).

Example:
```
The Cookie — 32 cards · 58% mastered · 3 overdue
  [Ch 1 (8)] [Ch 2 (6)] [Ch 3 (5)] [Ch 4 (7)] [Ch 5 (6)]

Leo's Lunch — 16 cards · 25% mastered · 8 overdue
  [Ch 1 (4)] [Ch 2 (3)] [Ch 3 (5)] [Ch 4 (4)]
```

**Box distribution** — already exists (`BoxDistribution` component),
already responds to folder filtering. No changes needed.

**Card list** — already exists (`CardList` component). No changes
needed.

### Assignment-triggered chapter review

When a teacher assigns flashcard practice for a chapter, the student's
assignment checklist links directly to a review session scoped to that
chapter's cards — all cards, not just due ones. This practice still
updates Leitner state (correct answers advance the box). The SRS
intervals are a guide; early correct review just means the card moves
up sooner.

### Student progress view (deferred)

A dedicated `/progress` tab showing longitudinal WPM and phoneme
trajectories is deferred until the library grows beyond A1. The
per-chapter progress panel (`ChapterProgressPanel`) and phoneme report
modal (`PhonemeSummaryReport`) are sufficient for three books.

---

## Phoneme Reporting Details

### Session counting

A "session" for a given phoneme means an assigned recording where that
phoneme actually appeared. A student may have 10 assigned recordings
total, but if /ŋ/ only appeared in 6 of those texts, the session count
for /ŋ/ is 6. This is the honest credibility signal — it reflects how
much data we actually have for that phoneme.

Common phonemes (/ə/, /t/, /n/) will show high session counts because
they appear in nearly every text. Rarer phonemes (/ŋ/, /θ/, /ð/) will
have fewer sessions, which correctly signals lower confidence in the
trend.

### L1-specific frequency considerations

Phoneme frequency in English is L1-independent, but the *trouble
phonemes* differ by L1, and some are rarer than others:

**Spanish L1:** Most non-transparent phonemes (/θ/, /ð/, /v/, /z/, /ŋ/)
live in extremely high-frequency English words (*the*, *this*, *that*,
*with*, *think*, *very*, *is*, *was*). A student reading 2 minutes of
text per week will encounter these phonemes abundantly. Session counts
will be high even over a 9-week period.

**CJK L1 (Japanese, Chinese, Korean):** Trouble phonemes differ —
/l/ vs /r/, /f/ vs /p/, consonant clusters, vowel length contrasts.
Some of these are positional (only matter at word boundaries or in
specific consonant combinations) and may not surface as frequently in
a controlled A1 vocabulary of 300 headwords. Session counts may be
genuinely low for some phonemes, not because of insufficient
assignments but because the texts don't contain enough instances.

This means the minimum threshold is more important for CJK learners —
low session counts are real, not a data gap to work around.

### Minimum data thresholds

A phoneme trend (the Change column in the growth table) requires at
least **5 sessions with 3+ occurrences** of that phoneme per session.

**Above threshold (5+ sessions):** Show current accuracy, first
accuracy, change delta, session count. The delta is credible.

**Below threshold (< 5 sessions):** Show the phoneme, show current
median accuracy, show session count. **Suppress the delta** — display
"—" or "insufficient data" instead of computing a change from too few
points. The teacher can see the phoneme exists as a weak spot but
understands the trend isn't established yet.

**Presentation in the growth table:**

| Phoneme | Current | First | Change | Sessions |
|---|---|---|---|---|
| /θ/ | 62 | 38 | **+24** | 7 |
| /v/ | 55 | 41 | **+14** | 9 |
| /ŋ/ | 35 | — | *insufficient data* | 2 |

The Sessions column itself serves as the credibility indicator. Teachers
can see which phonemes are approaching the threshold and will become
reportable with more assigned recordings.

### Teacher roster: weak phoneme identification

A phoneme is classified as "weak" when its median score is below 50
across 3 or more sessions. This threshold is a starting point — adjust
empirically once real student data is available.

Weak phoneme badges on the class roster use the same threshold logic:
only phonemes with enough sessions to be credible are shown. A phoneme
below 50 with only 1-2 sessions is not surfaced as a weak phoneme badge
on the roster — it would create false signals from too little data.

### L1-grouped phoneme view (future)

For Spanish L1 learners (the primary early audience), the predictable
trouble phonemes are: /θ/ vs /s/, /ɪ/ vs /iː/, /b/ vs /v/, /dʒ/ vs
/ʃ/, /z/, /ŋ/ word-final. For CJK learners, different groupings apply
(/l/ vs /r/, /f/ vs /p/, consonant clusters, etc.). A future
enhancement could lead with "L1-predicted difficulty phonemes" and show
just those, with "all phonemes" as drill-down. Deferred until there is
real data to validate the groupings across L1 backgrounds.

### Class-wide phoneme patterns (future)

Aggregate phoneme data across the class to find common weak spots
(e.g., 60% of students struggling with /θ/). This is a whole-class
instruction signal. Deferred — build the individual student view first.

---

## Data Sources and Queries

### Filtering to assignment data only

The key join: `assignments.text_id` links an assignment to a chapter.
Session data (`fluency_sessions`, `pronunciation_assessments`,
`phoneme_sessions`) also carries `text_id`. To filter to assigned-only
data for a student:

1. Get all assignments for the student's class
2. Get the set of `text_id` values from those assignments
3. Filter session data to rows where `text_id` is in that set

For date-range filtering: additionally filter by
`assignments.created_at` or `assignments.due_date` falling within the
grading period.

For re-reads: when multiple sessions exist for the same (student,
text_id), use the most recent one for teacher reports.

### Book-level roll-up

`curated_texts.book_id` links chapters to books. Aggregate chapter-level
data to book level via this join:
- WPM: array of per-chapter values, ordered by chapter sequence
- Pronunciation accuracy: array of per-chapter values
- Exercises: mean score across chapters
- Flashcards: count cards where `text_id` in book's chapter set

### Flashcard validation query

For a given assignment (with `text_id` and `created_at`):
```sql
select count(*) from srs_cards
where user_id = :student_id
  and text_id = :assignment_text_id
  and added_date >= :assignment_created_at
```

This replaces the self-report checkbox with a verified count.

---

## Implementation Notes

### Where it lives

Reports tab within existing `TeacherDashboard`. No new route. Toggle
between "Assignments" (existing operational view) and "Reports" (new
analytical view).

### Visualization approach

No charting library. Use inline SVGs for sparklines, histograms, and
bar charts. SVG gives precise control over color, spacing, and hover
behavior while staying lightweight and dependency-free. The existing
`BoxDistribution` and `TimedReadStrip` use styled `<div>` elements;
new visualizations use SVG for a step up in polish.

A lightweight `<Sparkline>` component that takes an array of values
and renders an SVG bar chart covers the roster sparklines, the book-
level charts (rendered larger), and can be adapted for the phoneme
histogram (horizontal bars). One component pattern, multiple scales.

### Visualization placements

#### View 1: Class Roster — Inline sparklines

Each row in the roster table includes inline sparklines for key
metrics, replacing flat numbers with visual trends:

| Column | Visualization | Details |
|---|---|---|
| WPM | Bar sparkline | One bar per assigned timed read, chronological. Final WPM value printed beside it. Single muted color (e.g., slate blue) — the trend shape is the information. |
| Accuracy | Bar sparkline | One bar per assigned recording. Same style as WPM. |
| Exercises | Bar sparkline | One bar per assigned exercise score. Shows consistency vs. volatility. |
| Cards | Mini stacked horizontal bar | Leitner box distribution as 5 colored segments (red/amber/yellow/green/dark-green). Mastery % printed beside it. |
| Weak phonemes | Text badges | IPA symbols, not sparklines. Color-coded by severity (absolute accuracy threshold). Categorical data doesn't suit sparklines. |

#### View 2: Student Profile — Book-level charts

Each book card contains larger visualizations:

**WPM bar chart** — one bar per assigned chapter, tall enough to read
values. Color gradient from light to dark as chapters progress. Delta
badge showing first-to-last gain within the book.

**Pronunciation accuracy bar chart** — same layout as WPM, positioned
parallel so the teacher can visually correlate fluency and accuracy
trends.

**Phoneme histogram** — all assessed phonemes as vertical bars, sorted
by median accuracy (lowest to highest, left to right). Each bar is one
phoneme, labeled with its IPA symbol below. Bars colored by **absolute
accuracy** using the standard pronunciation thresholds:
- Red: < 30
- Orange: 30–49
- Yellow: 50–69
- Green: 70–84
- Purple: 85+

The histogram gives the gestalt — the teacher sees the shape of the
student's pronunciation profile at a glance. Weak spots (red/orange
bars on the left) are immediately visible.

Available at both book level (phonemes from this book's assigned
recordings) and global level in the student profile header (all
phoneme sessions).

**Phoneme growth table** — companion table beside or below the
histogram. Provides the precision and growth evidence the histogram
cannot. Sorted by current accuracy ascending (weakest first, matching
histogram order).

| Phoneme | Current | First | Change | Sessions |
|---|---|---|---|---|
| /θ/ | 62 | 38 | +24 | 7 |
| /v/ | 55 | 41 | +14 | 9 |
| /z/ | 48 | 44 | +4 | 6 |
| /ŋ/ | 35 | — | — | 2 |
| /ɪ/ | 78 | 72 | +6 | 8 |

- **Current**: most recent session median for that phoneme
- **First**: first session median (baseline)
- **Change**: delta. Green for positive growth, neutral for flat,
  red for decline. Suppressed ("—") when below the 5-session
  minimum threshold.
- **Sessions**: number of assigned recordings where the phoneme
  appeared. Serves as credibility indicator.

The histogram gives the shape. The table gives the evidence. Each does
one thing well. A teacher can point at the table in a parent conference
and say "your student's /θ/ went from 38 to 62 over 7 sessions."

**Leitner box distribution** — the existing `BoxDistribution` bar
chart component, enlarged slightly for the book card context.

#### View 3: Chapter Detail — No sparklines

Chapter detail shows single-session data, not trends. Use absolute
accuracy coloring on word-level pronunciation overlays and per-phoneme
score bars (existing patterns from `PhonemeSummaryReport`). Sparklines
don't apply at this level.

### Existing components to reuse

| Component | Current location | Reuse in reports |
|---|---|---|
| `BoxDistribution` | `FlashcardPage.jsx` | Book-level and global flashcard summary |
| `WpmTimeline` | `TeacherDashboard.jsx` | Adapt for book-level WPM chart |
| `TimedReadStrip` bar chart | `TimedReadStrip.jsx` | Pattern for per-chapter bar charts |
| `PhonemeSummaryReport` | `PhonemeSummaryReport.jsx` | Adapt for longitudinal phoneme view |
| `ScoreBar` | `PhonemeSummaryReport.jsx` | Pronunciation accuracy bars |

### New components needed

- `ReportsTab` — container with roster view, student drill-down, filters
- `StudentReportCard` — individual student profile with book cards
- `BookReportCard` — per-book data panel (WPM chart, pronunciation,
  exercises, flashcards, phonemes)
- `ChapterDetail` — chapter-level detail view (adapted from existing
  `AssignmentCard` student row)
- `RosterTable` — class roster with sortable columns and color-coded
  cells
- `DateRangeFilter` — grading period date picker
- `FlashcardSummaryStrip` — student-facing summary (total, mastered,
  overdue, last review)
- `BookFolderGroup` — book-level grouping for flashcard folder tabs

---

## What We Are Not Building Yet

- **Cross-band (CEFR level) reports** — only three A1 books exist.
  When the library spans A1–B1+, add band-level grouping with
  "level-up" framing (each CEFR band is its own track, moving to a
  new band is an achievement, not a score decline).
- **Student progress tab** — deferred until library growth warrants it.
- **L1-grouped phoneme view** — deferred until real data validates
  groupings.
- **Class-wide phoneme aggregates** — build individual view first.
- **Reading contracts / free-choice assignments** — current model ties
  assignments to specific books. When library grows and teachers allow
  student choice, shift to level-based or task-pattern assignments.
- **Change-over-time pronunciation analysis** — comparing accuracy for
  the same word across recordings. Valuable but requires more data.
- **CSV export / SIS integration** — districts will eventually ask for
  this. Build the views first, add export later.
