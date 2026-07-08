import { useState, useEffect, useMemo } from 'react';
import { analyzeText, titleToSlug, buildAnalysisPrompt, CEFR_LEVELS, CEFR_COLORS } from '../../lib/textAnalysis';
import { getVoiceOptions, generateAudio } from '../../lib/elevenlabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { extractImages } from '../../lib/imageUtils';

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
  const [bookId, setBookId] = useState('');
  const [chapterOrder, setChapterOrder] = useState('');
  const [rawText, setRawText] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Books management
  const [books, setBooks] = useState([]);
  const [showBookForm, setShowBookForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookDescription, setBookDescription] = useState('');
  const [bookCefr, setBookCefr] = useState('B1');
  const [bookCoverFile, setBookCoverFile] = useState(null);
  const [bookCoverPreview, setBookCoverPreview] = useState(null);
  const [bookManifestJson, setBookManifestJson] = useState('');
  const [bookSyntaxGlossesJson, setBookSyntaxGlossesJson] = useState('');
  const [savingBook, setSavingBook] = useState(false);
  const [bookError, setBookError] = useState(null);

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
  const { cleanBody, images: parsedImages } = useMemo(() => extractImages(rawText), [rawText]);
  const analysis = useMemo(() => analyzeText(cleanBody), [cleanBody]);
  const textId = useMemo(() => titleToSlug(title), [title]);

  useEffect(() => {
    loadCorpus();
    loadBooks();
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
        bookId: t.book_id,
        chapterOrder: t.chapter_order,
        textAnalysis: t.analysis,
        audioBlob: null,
        hasAudio: !!(t.audio_urls?.mp3),
        audioTimestamps: t.audio_timestamps,
        wordCount: t.word_count,
        coverImageUrl: t.cover_image_url,
        images: t.images || [],
        status: t.status,
        publishedAt: t.published_at,
      })));
    } catch {}
  }

  async function loadBooks() {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBooks(data || []);
    } catch (err) {
      console.warn('Failed to load books:', err);
    }
  }

  function resetBookForm() {
    setShowBookForm(false);
    setEditingBookId(null);
    setBookTitle('');
    setBookAuthor('');
    setBookDescription('');
    setBookCefr('B1');
    setBookCoverFile(null);
    setBookCoverPreview(null);
    setBookManifestJson('');
    setBookSyntaxGlossesJson('');
    setBookError(null);
  }

  async function handleSaveBook() {
    if (!bookTitle.trim()) return;
    setSavingBook(true);
    setBookError(null);
    try {
      const id = editingBookId || titleToSlug(bookTitle);
      let coverImageUrl = null;
      if (editingBookId) {
        const existing = books.find(b => b.id === editingBookId);
        coverImageUrl = existing?.cover_image_url || null;
      }
      if (bookCoverFile) {
        const ext = bookCoverFile.name.split('.').pop();
        const coverPath = `${id}.${ext}`;
        const { error: coverError } = await supabase.storage
          .from('book-covers')
          .upload(coverPath, bookCoverFile, { contentType: bookCoverFile.type, upsert: true });
        if (coverError) throw coverError;
        const { data: urlData } = supabase.storage.from('book-covers').getPublicUrl(coverPath);
        coverImageUrl = urlData.publicUrl;
      }
      let parsedManifest = null;
      if (bookManifestJson.trim()) {
        try {
          parsedManifest = JSON.parse(bookManifestJson);
          if (!parsedManifest.entries || typeof parsedManifest.entries !== 'object') {
            throw new Error('Manifest must have an "entries" object');
          }
        } catch (parseErr) {
          throw new Error(`Invalid manifest JSON: ${parseErr.message}`);
        }
      }
      let parsedSyntaxGlosses = null;
      if (bookSyntaxGlossesJson.trim()) {
        try {
          parsedSyntaxGlosses = JSON.parse(bookSyntaxGlossesJson);
          if (!parsedSyntaxGlosses.chapters || typeof parsedSyntaxGlosses.chapters !== 'object') {
            throw new Error('Syntax glosses must have a "chapters" object');
          }
        } catch (parseErr) {
          throw new Error(`Invalid syntax glosses JSON: ${parseErr.message}`);
        }
      }
      const record = {
        id,
        title: bookTitle,
        author: bookAuthor || null,
        description: bookDescription || null,
        cefr_estimate: bookCefr,
        cover_image_url: coverImageUrl,
        vocabulary_manifest: parsedManifest,
        syntax_glosses: parsedSyntaxGlosses,
        status: 'published',
      };
      const { error } = await supabase.from('books').upsert(record, { onConflict: 'id' });
      if (error) throw error;
      resetBookForm();
      await loadBooks();
    } catch (err) {
      console.error('Book save error:', err);
      setBookError(err.message);
    }
    setSavingBook(false);
  }

  async function handleDeleteBook(id) {
    try {
      await supabase.from('curated_texts').update({ book_id: null, chapter_order: null }).eq('book_id', id);
      await supabase.from('books').delete().eq('id', id);
      await loadBooks();
      await loadCorpus();
    } catch {}
  }

  function handleEditBook(book) {
    setEditingBookId(book.id);
    setBookTitle(book.title || '');
    setBookAuthor(book.author || '');
    setBookDescription(book.description || '');
    setBookCefr(book.cefr_estimate || 'B1');
    setBookCoverFile(null);
    setBookCoverPreview(book.cover_image_url || null);
    setBookManifestJson(book.vocabulary_manifest ? JSON.stringify(book.vocabulary_manifest, null, 2) : '');
    setBookSyntaxGlossesJson(book.syntax_glosses ? JSON.stringify(book.syntax_glosses, null, 2) : '');
    setShowBookForm(true);
  }

  function handleCopyPrompt() {
    if (!title || !cleanBody) return;
    const prompt = buildAnalysisPrompt(title, cleanBody, cefrEstimate);
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
    if (!cleanBody || !selectedVoice) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const data = await generateAudio(cleanBody, selectedVoice);
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
    if (!title || !cleanBody) return;
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

      let imagesToStore = existingImages;
      if (parsedImages.length > 0) {
        const uploadedImages = [];
        for (const img of parsedImages) {
          const file = imageFiles.find(f => f.name === img.filename);
          if (file) {
            const storagePath = `${textId}/${img.filename}`;
            const { error: imgError } = await supabase.storage
              .from('chapter-images')
              .upload(storagePath, file, { contentType: file.type, upsert: true });
            if (imgError) throw imgError;
            const { data: imgUrlData } = supabase.storage.from('chapter-images').getPublicUrl(storagePath);
            uploadedImages.push({
              filename: img.filename,
              alt: img.alt,
              afterParagraph: img.afterParagraph,
              publicUrl: imgUrlData.publicUrl,
            });
          }
        }
        if (uploadedImages.length > 0) imagesToStore = uploadedImages;
      }

      const record = {
        id: textId,
        title,
        author,
        cefr_estimate: cefrEstimate,
        book_id: bookId || null,
        chapter_order: chapterOrder ? Number(chapterOrder) : null,
        body: cleanBody,
        analysis: textAnalysis || null,
        audio_urls: audioUrls,
        audio_timestamps: audioData?.audioTimestamps || existing?.audioTimestamps || null,
        word_count: analysis?.wordCount || 0,
        cover_image_url: coverImageUrl,
        images: imagesToStore,
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
    setBookId(text.bookId || '');
    setChapterOrder(text.chapterOrder != null ? String(text.chapterOrder) : '');
    setRawText(text.body || '');
    setImageFiles([]);
    setExistingImages(text.images || []);
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
    setBookId('');
    setChapterOrder('');
    setRawText('');
    setCoverFile(null);
    setCoverPreview(null);
    setImageFiles([]);
    setExistingImages([]);
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

      {/* Books Management */}
      <div className="mb-8 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Books ({books.length})</h2>
          <button
            onClick={() => { resetBookForm(); setShowBookForm(true); }}
            className="text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            + New Book
          </button>
        </div>

        {showBookForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="The Monkey's Paw"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
                {bookTitle && !editingBookId && (
                  <p className="text-xs text-gray-400 mt-1">ID: {titleToSlug(bookTitle)}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Author</label>
                <input
                  type="text"
                  value={bookAuthor}
                  onChange={(e) => setBookAuthor(e.target.value)}
                  placeholder="Adapted from W.W. Jacobs"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">CEFR Estimate</label>
                <select
                  value={bookCefr}
                  onChange={(e) => setBookCefr(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cover Image</label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setBookCoverFile(file);
                        setBookCoverPreview(URL.createObjectURL(file));
                      }
                    }}
                    className="text-sm text-gray-500 file:mr-2 file:px-2 file:py-1 file:rounded file:border file:border-gray-300 file:text-xs file:bg-white file:text-gray-700"
                  />
                  {bookCoverPreview && (
                    <img src={bookCoverPreview} alt="Cover" className="w-10 h-14 object-cover rounded border border-gray-200" />
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Description</label>
              <textarea
                value={bookDescription}
                onChange={(e) => setBookDescription(e.target.value)}
                placeholder="A short description of the book..."
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Vocabulary Manifest (JSON)</label>
              <textarea
                value={bookManifestJson}
                onChange={(e) => setBookManifestJson(e.target.value)}
                placeholder='Paste vocabulary_manifest.json from the graded readers project...'
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
              />
              {bookManifestJson.trim() && (() => {
                try {
                  const parsed = JSON.parse(bookManifestJson);
                  const count = Object.keys(parsed.entries || {}).length;
                  return <p className="text-xs text-green-600 mt-1">{count} entries</p>;
                } catch {
                  return <p className="text-xs text-red-500 mt-1">Invalid JSON</p>;
                }
              })()}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Syntax Glosses (JSON)</label>
              <textarea
                value={bookSyntaxGlossesJson}
                onChange={(e) => setBookSyntaxGlossesJson(e.target.value)}
                placeholder='Paste syntax_glosses.json from the graded readers project...'
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-gray-900 resize-y"
              />
              {bookSyntaxGlossesJson.trim() && (() => {
                try {
                  const parsed = JSON.parse(bookSyntaxGlossesJson);
                  const chapterCount = Object.keys(parsed.chapters || {}).length;
                  const glossCount = Object.values(parsed.chapters || {}).reduce((sum, ch) => sum + ch.length, 0);
                  return <p className="text-xs text-green-600 mt-1">{glossCount} glosses across {chapterCount} chapters</p>;
                } catch {
                  return <p className="text-xs text-red-500 mt-1">Invalid JSON</p>;
                }
              })()}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveBook}
                disabled={savingBook || !bookTitle.trim()}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  savingBook || !bookTitle.trim()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {savingBook ? 'Saving...' : editingBookId ? 'Update Book' : 'Create Book'}
              </button>
              <button
                onClick={resetBookForm}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
            {bookError && (
              <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{bookError}</p>
            )}
          </div>
        )}

        {books.length > 0 && (
          <div className="space-y-1.5">
            {books.map(book => {
              const chapterCount = corpusTexts.filter(t => t.bookId === book.id).length;
              return (
                <div key={book.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: (CEFR_COLORS[book.cefr_estimate] || '#6b7280') + '20',
                        color: CEFR_COLORS[book.cefr_estimate] || '#6b7280',
                      }}
                    >
                      {book.cefr_estimate}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{book.title}</span>
                    {book.author && <span className="text-xs text-gray-400">{book.author}</span>}
                    <span className="text-xs text-gray-400">({chapterCount} ch.)</span>
                    {book.vocabulary_manifest && (
                      <span className="text-xs text-green-600" title={`${Object.keys(book.vocabulary_manifest.entries || {}).length} manifest entries`}>manifest</span>
                    )}
                    {book.syntax_glosses && (
                      <span className="text-xs text-purple-600" title={`${Object.values(book.syntax_glosses.chapters || {}).reduce((s, ch) => s + ch.length, 0)} syntax glosses`}>glosses</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditBook(book)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                    <button onClick={() => handleDeleteBook(book.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

            <div className={`grid gap-4 ${bookId ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Book</label>
                <select
                  value={bookId}
                  onChange={(e) => setBookId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                >
                  <option value="">Standalone text</option>
                  {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                </select>
              </div>
              {bookId && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Chapter Order</label>
                  <input
                    type="number"
                    value={chapterOrder}
                    onChange={(e) => setChapterOrder(e.target.value)}
                    placeholder="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              )}
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
              {parsedImages.length > 0 && (
                <p className="text-xs text-blue-600 mt-1">
                  {parsedImages.length} image{parsedImages.length > 1 ? 's' : ''} detected in text
                </p>
              )}
            </div>

            {(parsedImages.length > 0 || existingImages.length > 0) && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                  Chapter Images
                </label>
                {parsedImages.length > 0 && (
                  <>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                      className="text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    <div className="mt-2 space-y-1">
                      {parsedImages.map((img, i) => {
                        const hasFile = imageFiles.some(f => f.name === img.filename);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded ${hasFile ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                              {hasFile ? 'ready' : 'needs file'}
                            </span>
                            <span className="font-mono text-gray-600">{img.filename}</span>
                            <span className="text-gray-400">after paragraph {img.afterParagraph + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
                {parsedImages.length === 0 && existingImages.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500 mb-1">{existingImages.length} existing image{existingImages.length > 1 ? 's' : ''} (will be preserved)</p>
                    {existingImages.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">stored</span>
                        <span className="font-mono text-gray-600">{img.filename}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
                  <Stat label="Images" value={parsedImages.length || existingImages.length || 0} />
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
