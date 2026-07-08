/**
 * Extracts image markers from markdown text, returning clean body text
 * and image placement metadata. Image markers must be standalone blocks
 * (separated by blank lines), not inline within paragraphs.
 *
 * Markdown format: ![alt text](filename.png)
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
      cleanParagraphs.push(trimmed);
      paragraphIndex++;
    }
  }

  return {
    cleanBody: cleanParagraphs.join('\n\n'),
    images,
  };
}
