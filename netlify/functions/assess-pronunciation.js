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

    const cleanRef = referenceText.replace(/[\r\n]+/g, ' ').trim();
    const paConfig = {
      ReferenceText: cleanRef,
      GradingSystem: 'HundredMark',
      Granularity: 'Phoneme',
      PhonemeAlphabet: 'IPA',
      Dimension: 'Comprehensive',
      EnableMiscue: true,
    };
    const paJson = JSON.stringify(paConfig);
    const paHeaderValue = Buffer.from(paJson, 'utf-8').toString('base64');
    console.log('[assess-pronunciation] PA header JSON:', paJson);
    console.log('[assess-pronunciation] PA header base64:', paHeaderValue);

    const azureUrl =
      `https://${azureRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1` +
      `?language=en-US&format=detailed`;

    const audioBody = Buffer.from(audioBuffer);
    const azureRes = await fetch(azureUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': azureKey,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': paHeaderValue,
        Accept: 'application/json',
      },
      body: audioBody,
    });

    if (!azureRes.ok) {
      const errorText = await azureRes.text();
      throw new Error(`Azure Speech error: ${azureRes.status} — ${errorText}`);
    }

    const result = await azureRes.json();
    console.log('[assess-pronunciation] Azure raw response:', JSON.stringify(result).substring(0, 3000));
    console.log('[assess-pronunciation] Audio size:', audioBody.byteLength, 'Reference:', cleanRef);
    const nBest0 = result.NBest?.[0];
    console.log('[assess-pronunciation] NBest[0] keys:', nBest0 ? Object.keys(nBest0) : 'NO_NBEST');
    console.log('[assess-pronunciation] First word:', nBest0?.Words?.[0] ? JSON.stringify(nBest0.Words[0]) : 'NO_WORDS');

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
      accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? w.AccuracyScore ?? null,
      errorType: w.PronunciationAssessment?.ErrorType ?? w.ErrorType ?? 'None',
      phonemes: (w.Phonemes || []).map((p) => ({
        phoneme: p.Phoneme,
        accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? p.AccuracyScore ?? null,
      })),
    }));

    const pa = nBest.PronunciationAssessment || {};
    return Response.json({
      words,
      fluencyScore: pa.FluencyScore ?? nBest.FluencyScore ?? null,
      prosodyScore: pa.ProsodyScore ?? nBest.ProsodyScore ?? null,
      completenessScore: pa.CompletenessScore ?? nBest.CompletenessScore ?? null,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/assess-pronunciation',
};
