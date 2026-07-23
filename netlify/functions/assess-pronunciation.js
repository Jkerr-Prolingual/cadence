import { createClient } from '@supabase/supabase-js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const azureKey = process.env.AZURE_SPEECH_KEY;
  const azureRegion = process.env.AZURE_SPEECH_REGION;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!azureKey || !azureRegion || !supabaseUrl || !serviceRoleKey) {
    const missing = [
      !azureKey && 'AZURE_SPEECH_KEY',
      !azureRegion && 'AZURE_SPEECH_REGION',
      !supabaseUrl && 'SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ');
    return Response.json({ error: `Missing env vars: ${missing}` }, { status: 500 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { storagePath, referenceText } = body;
  if (!storagePath || !referenceText) {
    return Response.json(
      { error: 'Missing required fields: storagePath, referenceText' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: dlError } = await supabase.storage
      .from('student-recordings')
      .download(storagePath);
    if (dlError) throw new Error(`Storage download failed: ${dlError.message}`);

    const audioBuffer = await fileData.arrayBuffer();

    const paConfig = {
      ReferenceText: referenceText,
      GradingSystem: 'HundredMark',
      Granularity: 'Word',
      Dimension: 'Comprehensive',
      EnableMiscue: true,
    };
    const paHeaderValue = btoa(JSON.stringify(paConfig));

    const azureUrl =
      `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1` +
      `?language=en-US`;

    const azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'audio/wav',
        'Pronunciation-Assessment': paHeaderValue,
        Accept: 'application/json',
      },
      body: audioBuffer,
    });

    if (!azureRes.ok) {
      const errorText = await azureRes.text();
      throw new Error(`Azure Speech error: ${azureRes.status} — ${errorText}`);
    }

    const result = await azureRes.json();

    const nBest = result.NBest?.[0];
    if (!nBest) {
      return Response.json({
        words: [],
        fluencyScore: null,
        prosodyScore: null,
        completenessScore: null,
      });
    }

    const words = (nBest.Words || []).map((w) => ({
      word: w.Word,
      accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? null,
      errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
    }));

    return Response.json({
      words,
      fluencyScore: nBest.PronunciationAssessment?.FluencyScore ?? null,
      prosodyScore: nBest.PronunciationAssessment?.ProsodyScore ?? null,
      completenessScore: nBest.PronunciationAssessment?.CompletenessScore ?? null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/assess-pronunciation',
};
