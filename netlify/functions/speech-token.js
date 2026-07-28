export default async (req) => {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;

  if (!azureKey || !azureRegion) {
    return Response.json(
      { error: 'Missing Azure Speech env vars' },
      { status: 500 }
    );
  }

  try {
    const tokenRes = await fetch(
      `https://${azureRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': azureKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: '',
      }
    );

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      throw new Error(`Token endpoint error: ${tokenRes.status} — ${errorText}`);
    }

    const token = await tokenRes.text();
    return Response.json({ token, region: azureRegion });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/speech-token',
};
