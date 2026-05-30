export async function searchImages(query, count = 8) {
  const key = import.meta.env.VITE_PIXABAY_API_KEY;
  if (!key) throw new Error('Pixabay API key not configured');
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&safesearch=true&image_type=photo&per_page=${count}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Image search failed');
  const data = await res.json();
  return (data.hits || []).map(img => ({
    url: img.webformatURL,
    thumbnail: img.previewURL,
    title: img.tags || '',
    attribution: img.pageURL,
  }));
}
