-- 015: Multi-chapter card sources
-- Allow a single SRS card to be linked to multiple chapters

CREATE TABLE srs_card_sources (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  word text NOT NULL,
  text_id text NOT NULL,
  text_title text,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, word, text_id),
  FOREIGN KEY (user_id, word) REFERENCES srs_cards(user_id, word) ON DELETE CASCADE
);

ALTER TABLE srs_card_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own card sources"
  ON srs_card_sources FOR ALL
  USING (auth.uid() = user_id);

-- Populate from existing data
INSERT INTO srs_card_sources (user_id, word, text_id, text_title)
SELECT user_id, word, text_id, text_title
FROM srs_cards
WHERE text_id IS NOT NULL
ON CONFLICT DO NOTHING;
