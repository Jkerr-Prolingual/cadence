export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text, voiceId, modelId = 'eleven_turbo_v2', stability = 0.5, similarityBoost = 0.75, speed = 0.92 } = body;

  if (!text || !voiceId) {
    return Response.json({ error: 'Missing required fields: text, voiceId' }, { status: 400 });
  }

  if (text.length > 50000) {
    return Response.json({ error: 'Text too long (max 50,000 characters)' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: { stability, similarity_boost: similarityBoost, speed },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json(
        { error: `ElevenLabs API error: ${response.status} — ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return Response.json({ audio_base64: data.audio_base64, alignment: data.alignment });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/generate-audio',
};
