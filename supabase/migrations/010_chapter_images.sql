-- Chapter images: block-level images placed between paragraphs in curated texts.
-- Images are parsed from markdown ![alt](filename) markers during ingestion,
-- stripped from curated_texts.body (keeping it pure text for audio/tokenization/glosses),
-- and stored as placement metadata in this JSONB column.
--
-- Each entry: {filename, alt, afterParagraph, publicUrl}
--   afterParagraph: -1 = before first paragraph, 0 = after paragraph 0, etc.
--
-- Image files live in Supabase Storage bucket "chapter-images" under {text_id}/{filename}.
-- Create the bucket manually:
--   INSERT INTO storage.buckets (id, name, public) VALUES ('chapter-images', 'chapter-images', true);

ALTER TABLE curated_texts ADD COLUMN images JSONB DEFAULT '[]';
