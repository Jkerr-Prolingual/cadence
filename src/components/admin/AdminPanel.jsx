import { useState, useEffect, useMemo } from 'react';
import { analyzeText, titleToSlug, buildAnalysisPrompt, CEFR_LEVELS, CEFR_COLORS } from '../../lib/textAnalysis';
import { getVoiceOptions, generateAudio } from '../../lib/elevenlabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Content', 'Analysis', 'Audio & Publish'];

function CefrBars({ dist }) {
  const max = Math.max(...CEFR_LEVELS.map(l => dist[l] || 0), 1);
  return (
    <div className="space-y-1.5">
      {CEFR_LEVELS.map(level => (
        <div key={level} className="flex items-center gap-2">
          <span className="text-xs w-6 text-right font-medium" style={{ color: CEFR_COLORS[level] }}>{level}</span>
          <div className="flex-1 bg-gray-100 rounded h-3.5 overflow-hidden">
            <div
              className="h-full rounded"
              style={{
                width: `${(dist[level] / max) * 100}%`,
                backgroundColor: CEFR_COLORS[level],
                minWidth: dist[level] > 0 ? '4px' : '0',
              }}
            />
          </div>
          <span className="text-xs text-gray-500 w-8 tabular-nums">{dist[level] || 0}</span>
        </div>
      ))}
      {dist.unclassified > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs w-6 text-right text-gray-400">?</span>
          <div className="flex-1 bg-gray-100 rounded h-3.5 overflow-hidden">
            <div className="h-full rounded bg-gray-300" style={{ width: `${(dist.unclassified / max) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-500 w-8 tabular-nums">{dist.unclassified}</span>
        </div>
      )}
    </div>
  );
}

function AnalysisPreview({ data }) {
  if (!data) return null;

  return (
    <div className="space-y-4 mt-6">
      {data.topicLabel && (
        <Section label="Topic">
          <p className="text-sm font-semibold">{data.topicLabel}</p>
          {data.topicCluster?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {data.topicCluster.map((item, i) => (
                <span key={i} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{item.word}</span>
              ))}
            </div>
          )}
        </Section>
      )}

      {data.particles?.length > 0 && (
        <Section label={`Particles (${data.particles.length})`}>
          <div className="space-y-1.5">
            {data.particles.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                  p.type === 'non-compositional' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {p.type === 'non-compositional' ? 'NC' : 'C'}
                </span>
                <span className="font-medium">{p.chunk}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">{p.spanish}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.probePool?.length > 0 && (
        <Section label={`Probes (${data.probePool.length})`}>
          <div className="flex gap-3 mb-2">
            {['meaning', 'cloze', 'context'].map(type => {
              const count = data.probePool.filter(p => p.questionType === type).length;
              return count > 0 ? (
                <span key={type} className="text-xs text-gray-500">{type}: {count}</span>
              ) : null;
            })}
          </div>
          <div className="space-y-2">
            {data.probePool.map((p, i) => (
              <div key={i} className="text-sm border-l-2 border-gray-200 pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{p.questionType}</span>
                  <span className="font-medium">{p.word}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{p.question}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.cognates?.length > 0 && (
        <Section label={`Cognates (${data.cognates.length})`}>
          <div className="space-y-1">
            {data.cognates.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  c.transparent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {c.transparent ? 'cognate' : 'false friend'}
                </span>
                <span>{c.word}</span>
                <span className="text-gray-400">→</span>
                <span className="text-gray-600">{c.spanish}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {data.textCollocates?.length > 0 && (
        <Section label={`Collocates (${data.textCollocates.length})`}>
          <div className="flex flex-wrap gap-2">
            {data.textCollocates.map((c, i) => (
              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {c.anchor} + {c.collocate}
              </span>
            ))}
          </div>
        </Section>
      )}

      {data.registerProfile && (
        <Section label="Register">
          <p className="text-sm text-gray-700">{data.registerProfile}</p>
        </Section>
      )}

      {data.difficultyNotes && (
        <Section label="Difficulty Notes">
          <p className="text-sm text-gray-700">{data.difficultyNotes}</p>
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</h4>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1: Content
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cefrEstimate, setCefrEstimate] = useState('B1');
  const [seriesId, setSeriesId] = useState('');
  const [seriesOrder, setSeriesOrder] = useState('');
  const [rawText, setRawText] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);

  // Step 2: Analysis
  const [analysisJson, setAnalysisJson] = useState('');
  const [textAnalysis, setTextAnalysis] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Step 3: Audio & Publish
  const [selectedVoice, setSelectedVoice] = useState('');
  const [audioData, setAudioData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Corpus list
  const [corpusTexts, setCorpusTexts] = useState([]);

  const voices = useMemo(() => getVoiceOptions(), []);
  const analysis = useMemo(() => analyzeText(rawText), [rawText]);
  const textId = useMemo(() => titleToSlug(title), [title]);

  useEffect(() => {
    loadCorpus();
  }, []);

  useEffect(() => {
    if (voices.length > 0 && !selectedVoice) {
      setSelectedVoice(voices[0].id);
    }
  }, [voices, selectedVoice]);

  async function loadCorpus() {
    try {
      const { data, error } = await supabase
        .from('curated_texts')
        .select('*')
        .order('published_at', { ascending: false });
      if (error) throw error;
      setCorpusTexts((data || []).map(t => ({
        id: t.id,
        title: t.title,
        author: t.author,
        body: t.body,
        cefrEstimate: t.cefr_estimate,
        seriesId: t.series_id,
        seriesOrder: t.series_order,
        textAnalysis: t.analysis,
        audioBlob: null,
        hasAudio: !!(t.audio_urls?.mp3),
        audioTimestamps: t.audio_timestamps,
        wordCount: t.word_count,
        coverImageUrl: t.cover_image_url,
        status: t.status,
        publishedAt: t.published_at,
      })));
    } catch {}
  }

  function handleCopyPrompt() {
    if (!title || !rawText) return;
    const prompt = buildAnalysisPrompt(title, rawText, cefrEstimate);
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleParseJson() {
    setParseError(null);
    try {
      let cleaned = analysisJson.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      const parsed = JSON.parse(cleaned);
      if (!parsed.topicLabel) throw new Error('Missing topicLabel field');
      setTextAnalysis(parsed);
    } catch (err) {
      setParseError(err.message);
      setTextAnalysis(null);
    }
  }

  async function handleGenerateAudio() {
    if (!rawText || !selectedVoice) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const data = await generateAudio(rawText, selectedVoice);
      setAudioData(data);

      if (data.audioBlob) {
        const storagePath = `${textId}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('curated-text-audio')
          .upload(storagePath, data.audioBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const existing = corpusTexts.find(t => t.id === textId);
        if (existing) {
          await supabase
            .from('curated_texts')
            .update({
              audio_urls: { mp3: storagePath },
              audio_timestamps: data.audioTimestamps,
              audio_voice_ids: [selectedVoice],
              audio_generated_at: new Date().toISOString(),
            })
            .eq('id', textId);
          await loadCorpus();
        }
      }
    } catch (err) {
      setGenerateError(err.message);
    }
    setGenerating(false);
  }

  async function handlePublish() {
    if (!title || !rawText) return;
    setPublishing(true);
    try {
      const existing = corpusTexts.find(t => t.id === textId);

      let audioUrls = existing?.hasAudio ? { mp3: `${textId}.mp3` } : null;
      if (audioData?.audioBlob) {
        const storagePath = `${textId}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('curated-text-audio')
          .upload(storagePath, audioData.audioBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });
        if (uploadError) throw uploadError;
        audioUrls = { mp3: storagePath };
      }

      let coverImageUrl = existing?.coverImageUrl || null;
      if (coverFile) {
        const ext = coverFile.name.split('.').pop();
        const coverPath = `${textId}.${ext}`;
        const { error: coverError } = await supabase.storage
          .from('text-covers')
          .upload(coverPath, coverFile, { contentType: coverFile.type, upsert: true });
        if (coverError) throw coverError;
        const { data: urlData } = supabase.storage.from('text-covers').getPublicUrl(coverPath);
        coverImageUrl = urlData.publicUrl;
      }

      const record = {
        id: textId,
        title,
        author,
        cefr_estimate: cefrEstimate,
        series_id: seriesId || null,
        series_order: seriesOrder ? Number(seriesOrder) : null,
        body: rawText,
        analysis: textAnalysis || null,
        audio_urls: audioUrls,
        audio_timestamps: audioData?.audioTimestamps || existing?.audioTimestamps || null,
        word_count: analysis?.wordCount || 0,
        cover_image_url: coverImageUrl,
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: user?.id || null,
      };

      const { error } = await supabase
        .from('curated_texts')
        .upsert(record, { onConflict: 'id' });
      if (error) throw error;

      setPublished(true);
      await loadCorpus();
    } catch (err) {
      setGenerateError(err.message);
    }
    setPublishing(false);
  }

  function handleEditText(text) {
    setTitle(text.title || '');
    setAuthor(text.author || '');
    setCefrEstimate(text.cefrEstimate || 'B1');
    setSeriesId(text.seriesId || '');
    setSeriesOrder(text.seriesOrder != null ? String(text.seriesOrder) : '');
    setRawText(text.body || '');
    setTextAnalysis(text.textAnalysis || null);
    setAnalysisJson(text.textAnalysis ? JSON.stringify(text.textAnalysis, null, 2) : '');
    setParseError(null);
    setCoverFile(null);
    setCoverPreview(text.coverImageUrl || null);
    setAudioData(null);
    setGenerateError(null);
    setPublished(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDeleteText(id) {
    try {
      await supabase.storage.from('curated-text-audio').remove([`${id}.mp3`]);
      await supabase.from('curated_texts').delete().eq('id', id);
      await loadCorpus();
    } catch {}
  }

  function handleReset() {
    setStep(1);
    setTitle('');
    setAuthor('');
    setCefrEstimate('B1');
    setSeriesId('');
    setSeriesOrder('');
    setRawText('');
    setCoverFile(null);
    setCoverPreview(null);
    setAnalysisJson('');
    setTextAnalysis(null);
    setParseError(null);
    setAudioData(null);
    setGenerateError(null);
    setPublished(false);
  }

  const canAdvance = title.trim() && rawText.trim();

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Panel</h1>

      {/* Step indicator */}
      <div className="flex gap-1 mb-8">
        {STEPS.map((label, i) => {
          const s = i + 1;
          const active = step === s;
          return (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                active
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {s}. {label}
            </button>
          );
        })}
      </div>

      {/* Step 1: Content & Metadata */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Monkey's Paw — Chapter 1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {textId && <p className="text-xs text-gray-400 mt-1">ID: {textId}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Author</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Adapted from W.W. Jacobs"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">CEFR Estimate</label>
                <select
                  value={cefrEstimate}
                  onChange={(e) => setCefrEstimate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Series ID</label>
                <input
                  type="text"
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  placeholder="monkeys-paw"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Series Order</label>
                <input
                  type="number"
                  value={seriesOrder}
                  onChange={(e) => setSeriesOrder(e.target.value)}
                  placeholder="1"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cover Image</label>
              <div className="flex items-start gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                  className="text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                />
                {coverPreview && (
                  <img src={coverPreview} alt="Cover preview" className="w-20 h-28 object-cover rounded border border-gray-200" />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Text Body</label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the full text here..."
                rows={16}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(2)}
                disabled={!canAdvance}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  canAdvance ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                Next: Analysis
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canAdvance}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Skip to Publish
              </button>
            </div>
          </div>

          {/* Analysis sidebar */}
          <div>
            {analysis ? (
              <div className="border border-gray-200 rounded-lg p-4 space-y-4 sticky top-4">
                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Live Analysis</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Words" value={analysis.wordCount} />
                  <Stat label="Unique" value={analysis.uniqueWordCount} />
                  <Stat label="Sentences" value={analysis.sentenceCount} />
                  <Stat label="Avg length" value={analysis.avgSentenceLength} />
                  <Stat label="Content words" value={analysis.contentWordCount} />
                  <Stat label="Lex. density" value={analysis.lexicalDensity} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">CEFR Distribution</p>
                  <CefrBars dist={analysis.cefrDist} />
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center text-sm text-gray-400">
                Paste text to see analysis
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Text Analysis */}
      {step === 2 && (
        <div className="space-y-6">
          {!canAdvance && (
            <p className="text-sm text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
              Go back to Step 1 and enter a title and text first.
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyPrompt}
              disabled={!canAdvance}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                canAdvance ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {copied ? 'Copied!' : 'Copy Analysis Prompt'}
            </button>
            <span className="text-xs text-gray-400">
              Paste into Claude or ChatGPT, then paste the JSON response below
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
              Paste AI Response (JSON)
            </label>
            <textarea
              value={analysisJson}
              onChange={(e) => setAnalysisJson(e.target.value)}
              placeholder='{"topicLabel": "...", "topicCluster": [...], ...}'
              rows={10}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleParseJson}
              disabled={!analysisJson.trim()}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                analysisJson.trim() ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Parse JSON
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors"
            >
              Skip to Audio & Publish
            </button>
          </div>

          {parseError && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
              Parse error: {parseError}
            </p>
          )}

          {textAnalysis && (
            <>
              <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                Analysis parsed successfully
              </p>
              <AnalysisPreview data={textAnalysis} />
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                Next: Audio & Publish
              </button>
            </>
          )}
        </div>
      )}

      {/* Step 3: Audio & Publish */}
      {step === 3 && (
        <div className="space-y-6">
          {published ? (
            <div className="text-center py-12">
              <p className="text-lg font-semibold text-green-700">Published!</p>
              <p className="text-sm text-gray-500 mt-2">
                "{title}" is now available in the reading view.
              </p>
              <button
                onClick={handleReset}
                className="mt-6 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
              >
                Ingest Another Text
              </button>
            </div>
          ) : (
            <>
              {/* Audio generation */}
              <Section label="Audio Generation">
                {voices.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Set <code className="bg-gray-100 px-1 rounded">VITE_ELEVENLABS_VOICE_IDS</code> in .env.local (comma-separated voice IDs).
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <select
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      >
                        {voices.map(v => (
                          <option key={v.id} value={v.id}>{v.name} ({v.id.slice(0, 8)}...)</option>
                        ))}
                      </select>
                      <button
                        onClick={handleGenerateAudio}
                        disabled={generating || !rawText}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          generating || !rawText
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {generating ? 'Generating...' : 'Generate Audio'}
                      </button>
                    </div>

                    {generateError && (
                      <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{generateError}</p>
                    )}

                    {audioData && (
                      <div className="flex items-center gap-4 bg-green-50 px-4 py-3 rounded-lg">
                        <audio controls src={audioData.audioUrl} className="h-8" />
                        <span className="text-sm text-green-700">
                          {audioData.audioTimestamps.length} word timestamps generated
                          {corpusTexts.find(t => t.id === textId) && ' — saved to corpus'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* Publish summary */}
              <Section label="Publish Summary">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Title" value={title || '—'} />
                  <Stat label="Author" value={author || '—'} />
                  <Stat label="CEFR" value={cefrEstimate} />
                  <Stat label="Words" value={analysis?.wordCount || 0} />
                  <Stat label="Analysis" value={textAnalysis ? 'Yes' : 'None'} />
                  <Stat label="Audio" value={audioData ? 'Yes' : 'None'} />
                </div>
              </Section>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePublish}
                  disabled={publishing || !canAdvance}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    publishing || !canAdvance
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-700 text-white hover:bg-green-600'
                  }`}
                >
                  {publishing ? 'Publishing...' : 'Publish to Corpus'}
                </button>
                {!audioData && (
                  <span className="text-xs text-gray-400">Publishing without audio — you can generate it later</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Published texts */}
      {corpusTexts.length > 0 && (
        <div className="mt-12 border-t border-gray-200 pt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Published Texts ({corpusTexts.length})</h2>
          <div className="space-y-2">
            {corpusTexts.map(text => (
              <div key={text.id} className="flex items-center justify-between py-3 px-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: (CEFR_COLORS[text.cefrEstimate] || '#6b7280') + '20',
                      color: CEFR_COLORS[text.cefrEstimate] || '#6b7280',
                    }}
                  >
                    {text.cefrEstimate}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-900">{text.title}</span>
                    <span className="text-xs text-gray-400 ml-2">{text.author}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">{text.wordCount} words</span>
                  {text.hasAudio && <span className="text-xs text-green-600">audio</span>}
                  {text.textAnalysis && <span className="text-xs text-blue-600">analyzed</span>}
                  <button
                    onClick={() => handleEditText(text)}
                    className="text-xs text-blue-500 hover:text-blue-700 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteText(text.id)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}
