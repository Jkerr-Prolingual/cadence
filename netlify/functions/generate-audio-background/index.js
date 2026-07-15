const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { jobId, text, voiceId, textId, modelId, stability, similarityBoost, speed } = body;
  if (!jobId || !text || !voiceId || !textId) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !apiKey) {
    const missing = [
      !supabaseUrl && 'SUPABASE_URL',
      !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
      !apiKey && 'ELEVENLABS_API_KEY',
    ].filter(Boolean).join(', ');

    await updateJobError(supabaseUrl, serviceRoleKey, jobId, `Missing server env vars: ${missing}`);
    return { statusCode: 200 };
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    await supabase.from('audio_jobs').update({ status: 'processing' }).eq('id', jobId);

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
          model_id: modelId || 'eleven_turbo_v2',
          voice_settings: {
            stability: stability ?? 0.5,
            similarity_boost: similarityBoost ?? 0.75,
            speed: speed ?? 0.92,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} — ${errorText}`);
    }

    const data = await response.json();

    const audioBytes = Buffer.from(data.audio_base64, 'base64');
    const storagePath = `${textId}.mp3`;

    const { error: uploadError } = await supabase.storage
      .from('curated-text-audio')
      .upload(storagePath, audioBytes, {
        contentType: 'audio/mpeg',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    await supabase.from('audio_jobs').update({
      status: 'complete',
      alignment: data.alignment,
      audio_path: storagePath,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);

  } catch (err) {
    await supabase.from('audio_jobs').update({
      status: 'error',
      error_message: err.message,
      completed_at: new Date().toISOString(),
    }).eq('id', jobId);
  }

  return { statusCode: 200 };
};

async function updateJobError(url, key, jobId, message) {
  if (!url || !key) return;
  const supabase = createClient(url, key);
  await supabase.from('audio_jobs').update({
    status: 'error',
    error_message: message,
    completed_at: new Date().toISOString(),
  }).eq('id', jobId);
}
