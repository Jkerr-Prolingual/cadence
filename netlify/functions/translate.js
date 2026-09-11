export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { word, fromLang, toLang, context } = body;
  if (!word || !fromLang || !toLang) {
    return Response.json({ error: 'Missing required fields: word, fromLang, toLang' }, { status: 400 });
  }

  const LANG_NAMES = { en: 'English', es: 'Spanish', zh: 'Mandarin Chinese', ja: 'Japanese', ko: 'Korean' };
  const fromName = LANG_NAMES[fromLang] || fromLang;
  const toName = LANG_NAMES[toLang] || toLang;

  const prompt = [
    `Translate the ${fromName} word "${word}" to ${toName}.`,
    context ? `Context: "${context}"` : null,
    'Give the most common translation. If there is a second common meaning, add it after " / ".',
    'Reply with ONLY the translation(s), nothing else. No quotes, no explanation.',
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `OpenAI API error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const translation = data.choices?.[0]?.message?.content?.trim();

    if (!translation) {
      return Response.json({ error: 'No translation returned' }, { status: 502 });
    }

    return Response.json({ translation });
  } catch (err) {
    return Response.json({ error: `Translation failed: ${err.message}` }, { status: 500 });
  }
};
