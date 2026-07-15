export default async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
  }

  return Response.json({ key: apiKey });
};

export const config = {
  path: '/.netlify/functions/elevenlabs-key',
};
