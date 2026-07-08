/**
 * Extracts image markers from markdown text, returning clean body text
 * and image placement metadata. Image markers must be standalone blocks
 * (separated by blank lines), not inline within paragraphs.
 *
 * Markdown format: ![alt text](filename.png)
 *
 * Non-image paragraph content is preserved exactly as-is (no trimming)
 * to avoid misaligning audio timestamps generated from the original text.
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
    const match = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (match) {
      images.push({
        alt: match[1],
        filename: match[2].replace(/^.*[\\/]/, ''),
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
