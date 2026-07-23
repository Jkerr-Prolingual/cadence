import { createClient } from '@supabase/supabase-js';

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const whisperKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!whisperKey || !supabaseUrl || !serviceRoleKey) {
    const missing = [
      !whisperKey && 'OPENAI_API_KEY',
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

  const { storagePath } = body;
  if (!storagePath) {
    return Response.json({ error: 'Missing required field: storagePath' }, { status: 400 });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: dlError } = await supabase.storage
      .from('student-recordings')
      .download(storagePath);
    if (dlError) throw new Error(`Storage download failed: ${dlError.message}`);

    const formData = new FormData();
    formData.append('file', new File([fileData], 'recording.webm', { type: 'audio/webm' }));
    formData.append('model', 'whisper-large-v3');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    const whisperRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${whisperKey}` },
      body: formData,
    });

    if (!whisperRes.ok) {
      const errorText = await whisperRes.text();
      throw new Error(`Whisper API error: ${whisperRes.status} — ${errorText}`);
    }

    const result = await whisperRes.json();

    return Response.json({
      transcript: result.text,
      words: result.words || [],
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = {
  path: '/.netlify/functions/transcribe-whisper',
};
