/**
 * Extracts image markers from markdown text, returning clean body text
 * and image placement metadata. Image markers must be standalone blocks
 * (separated by blank lines), not inline within paragraphs.
 *
 * Supported formats:
 *   ![alt text]                — slot-based (admin assigns file)
 *   ![alt text](filename.png) — backward compat (filename is hint only)
 */
export function extractImages(rawText) {
  if (!rawText) return { cleanBody: '', images: [] };

  const blocks = rawText.split(/\n\n+/);
  const images = [];
  const cleanParagraphs = [];
  let paragraphIndex = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^!\[([^\]]*)\](?:\(([^)]+)\))?$/);
    if (match) {
      images.push({
        slot: images.length,
        alt: match[1],
        filenameHint: match[2] ? match[2].replace(/^.*[\\/]/, '') : null,
        afterParagraph: paragraphIndex - 1,
      });
    } else {
      cleanParagraphs.push(block);
      paragraphIndex++;
    }
  }

  return {
    cleanBody: cleanParagraphs.join('\n\n'),
    images,
  };
}
