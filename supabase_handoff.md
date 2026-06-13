# Relato — Supabase Integration Handoff

## Goal

Wire Relato up to Supabase for real multi-user auth, data sync, and
teacher-student class management. Currently everything runs on IndexedDB
with mock auth (dev mode). After this work, teachers and students will
log in with real accounts and share data.

## Credentials (already in .env.local)

```
VITE_SUPABASE_URL=https://thvifdxfffftwfdddshr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_wwPmbzEmN0B2BIuxzgiHrg_lEo1FF0b
```

The Supabase client is already initialized in `src/lib/supabase.js`.
Auth context is in `src/context/AuthContext.jsx` — it has a working
Supabase auth flow but falls back to dev mode when credentials are
placeholder values. Now that real credentials are set, the app will
try to use Supabase auth on next load.

---

## What Needs to Be Built

### 1. Supabase Schema (SQL Migrations)

Create these tables in `supabase/migrations/`. The app currently uses
IndexedDB stores with these shapes:

#### profiles
Created on user signup via trigger. Extends Supabase auth.users.
```sql
- id: uuid PRIMARY KEY REFERENCES auth.users(id)
- email: text
- display_name: text
- role: text CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student'
- l1: text DEFAULT 'es'
- created_at: timestamptz DEFAULT now()
```

#### classes
Teacher-owned class containers.
```sql
- id: text PRIMARY KEY
- name: text NOT NULL
- join_code: text UNIQUE NOT NULL
- teacher_id: uuid REFERENCES profiles(id) NOT NULL
- created_at: timestamptz DEFAULT now()
```
Note: In IndexedDB, students are stored as an array on the class object.
In Supabase, use a separate `class_enrollments` table instead.

#### class_enrollments
```sql
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- class_id: text REFERENCES classes(id) ON DELETE CASCADE
- student_id: uuid REFERENCES profiles(id)
- joined_at: timestamptz DEFAULT now()
- UNIQUE(class_id, student_id)
```

#### curated_texts
Admin-managed corpus. Currently stored in IndexedDB with audio blobs.
Audio blobs should move to Supabase Storage; the table stores metadata.
```sql
- id: text PRIMARY KEY
- title: text NOT NULL
- author: text
- body: text NOT NULL
- cefr_estimate: text
- series_id: text
- series_order: integer
- audio_storage_path: text  -- path in 'curated-text-audio' bucket
- audio_timestamps: jsonb   -- word-level timing array
- analysis: jsonb            -- AI analysis (particles, probes, etc.)
- provenance: text
- published_at: timestamptz DEFAULT now()
```

#### assignments
Teacher assigns a text to a class with required tasks.
```sql
- id: text PRIMARY KEY
- class_id: text REFERENCES classes(id) ON DELETE CASCADE
- text_id: text NOT NULL  -- references curated_texts.id or sample text id
- title: text NOT NULL
- tasks: jsonb NOT NULL   -- e.g. {"readingPass": true, "flashcards": true}
- due_date: date
- created_at: timestamptz DEFAULT now()
```

#### assignment_progress
Per-student completion tracking. Auto-completed by the app when student
finishes audio playback (readingPass) or creates a flashcard (flashcards).
```sql
- id: text PRIMARY KEY  -- format: {student_id}_{assignment_id}
- assignment_id: text REFERENCES assignments(id) ON DELETE CASCADE
- student_id: uuid REFERENCES profiles(id)
- completed: jsonb NOT NULL DEFAULT '{}'  -- e.g. {"readingPass": true, "flashcards": true}
- updated_at: timestamptz DEFAULT now()
```

#### srs_cards
Leitner flashcard state. Keyed by word per user.
```sql
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid REFERENCES profiles(id) NOT NULL
- word: text NOT NULL
- front: text
- back: text
- card_type: text  -- 'spanish' or 'cloze'
- cefr: text
- spanish: text
- image_url: text
- image_attribution: text
- text_id: text     -- which text the card was created from
- text_title: text
- box: integer DEFAULT 1
- next_review_date: bigint  -- epoch ms
- last_review_date: bigint
- consecutive_correct: integer DEFAULT 0
- created_at: bigint
- UNIQUE(user_id, word)
```

#### encounters
Word lookup events.
```sql
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid REFERENCES profiles(id) NOT NULL
- headword: text NOT NULL
- word: text
- cefr: text
- text_id: text
- type: text DEFAULT 'lookup'
- timestamp: bigint
```

#### student_recordings
One saved recording per user per text. Audio in Supabase Storage.
```sql
- user_id: uuid REFERENCES profiles(id)
- text_id: text
- storage_path: text  -- path in 'student-recordings' bucket
- duration_seconds: real
- playback_rate: real
- recorded_at: timestamptz DEFAULT now()
- PRIMARY KEY (user_id, text_id)
```

#### review_log
Flashcard review history.
```sql
- id: uuid PRIMARY KEY DEFAULT gen_random_uuid()
- user_id: uuid REFERENCES profiles(id) NOT NULL
- word: text
- response: integer
- correct: boolean
- review_date: bigint
- box_before: integer
- box_after: integer
```

### 2. RLS Policies

Pattern from CLAUDE.md:
- **Students** manage their own rows: `auth.uid() = user_id`
- **Teachers** read enrolled students' data via class_enrollments join
- **Admins** read/write all

Key policies needed:
- `profiles`: users read/update own row; teachers read enrolled students
- `classes`: teachers CRUD own classes; students read classes they're enrolled in
- `class_enrollments`: teachers manage for own classes; students read own enrollment
- `curated_texts`: admins CRUD; all authenticated users read
- `assignments`: teachers CRUD for own classes; students read for enrolled classes
- `assignment_progress`: students manage own rows; teachers read for own classes
- `srs_cards`: students manage own rows; teachers read for enrolled students
- `encounters`: students manage own; teachers read for enrolled students
- `student_recordings`: students manage own; teachers read for enrolled students
- `review_log`: students insert own; teachers read for enrolled students

### 3. Supabase Storage Buckets

- `curated-text-audio` — MP3 files from ElevenLabs TTS. Path: `{text_id}.mp3`
  Admin upload during corpus ingestion. All authenticated users can read.
- `student-recordings` — WebM opus recordings. Path: `{user_id}/{text_id}.webm`
  Students upload own; teachers read enrolled students' recordings.

### 4. Auth Trigger

Create a trigger on `auth.users` insert to auto-create a `profiles` row:
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 5. Code Changes Needed

#### AuthContext.jsx
- Remove the DEV_MODE fallback (or keep it behind a flag for local dev)
- Add signup flow (email/password with role selection + display name)
- The LoginPage already exists at `src/components/shared/LoginPage.jsx`

#### TeacherDashboard.jsx
- Replace IndexedDB calls with Supabase queries
- Students are now in `class_enrollments` (joined with profiles), not
  an array on the class object
- Add student-joins-via-code flow (student enters join code → enrollment)

#### AssignmentChecklist.jsx + assignments.js
- Replace `dbGetAll`/`dbPut` with Supabase queries
- `completeTaskForText()` should upsert to Supabase
- Query assignments by student's enrolled classes

#### ReadingView.jsx
- Load curated texts from Supabase (with signed audio URLs from Storage)
  instead of IndexedDB
- Encounters: write to Supabase (can batch/debounce)

#### AdminPanel.jsx
- Publish curated texts to Supabase table + Storage bucket
- Currently saves audio blob to IndexedDB; switch to uploading to
  `curated-text-audio` bucket

#### FlashcardPage.jsx + srs.js
- Read/write srs_cards from Supabase with `user_id` filter
- Consider offline-first: write to IndexedDB first, sync to Supabase

#### CardCreator.jsx
- Save to Supabase srs_cards table (with user_id)

#### Student recordings
- Upload audio blob to `student-recordings` bucket
- Save metadata to `student_recordings` table

---

## Current IndexedDB Stores → Supabase Mapping

| IndexedDB Store      | Supabase Table        | Notes                                    |
|----------------------|-----------------------|------------------------------------------|
| srsCards             | srs_cards             | Add user_id, move to Supabase            |
| reviewLog            | review_log            | Add user_id                              |
| translationCache     | KEEP LOCAL            | Cache only, no sync needed               |
| enDefinitions        | KEEP LOCAL            | Cache only                               |
| texts                | (unused)              | Remove                                   |
| curatedTexts         | curated_texts         | Audio blobs → Storage bucket             |
| encounters           | encounters            | Add user_id                              |
| flagEvents           | (future)              | Not wired up yet                         |
| readingSessions      | (future)              | Not wired up yet                         |
| recordings           | (unused)              | Remove, replaced by studentRecordings    |
| fluencySessions      | (future)              | Not wired up yet                         |
| sets                 | (unused)              | Remove                                   |
| cards                | (unused)              | Remove                                   |
| studentRecordings    | student_recordings    | Audio → Storage bucket                   |
| classes              | classes                | Students move to class_enrollments       |
| assignments          | assignments            | Direct migration                         |
| assignmentProgress   | assignment_progress    | Direct migration                         |

## Migration Strategy

Phase the work:
1. **Auth first** — get login/signup working with profiles table + trigger
2. **Curated texts** — move corpus to Supabase so all users see same texts
3. **Classes + assignments** — teacher flow: create class, assign texts
4. **Student data** — encounters, flashcards, recordings, progress
5. **Clean up** — remove unused IndexedDB stores, remove dev mode fallback

Keep `translationCache` and `enDefinitions` in IndexedDB permanently —
they're local caches that don't need to sync.

---

## Files to Read First

- `CLAUDE.md` — full project context, data layer docs, RLS patterns
- `src/context/AuthContext.jsx` — current auth with dev mode
- `src/lib/supabase.js` — client init
- `src/lib/db.js` — all IndexedDB stores and helpers
- `src/lib/assignments.js` — assignment completion logic
- `src/lib/srs.js` — Leitner SRS functions
- `src/components/teacher/TeacherDashboard.jsx` — class/assignment UI
- `src/components/admin/AdminPanel.jsx` — corpus ingestion (publishes to IndexedDB)
- `src/components/reading/ReadingView.jsx` — main reading view, audio, recording
- `src/components/reading/AssignmentChecklist.jsx` — student checklist
- `src/components/reading/CardCreator.jsx` — flashcard creation
- `src/components/flashcards/FlashcardPage.jsx` — flashcard review with folder tabs
