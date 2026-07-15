import { useState, useEffect, useMemo } from 'react';
import { analyzeText, titleToSlug, buildAnalysisPrompt, CEFR_LEVELS, CEFR_COLORS } from '../../lib/textAnalysis';
import { getVoiceOptions, generateAudio } from '../../lib/elevenlabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { extractImages } from '../../lib/imageUtils';

const STEPS = ['Content', 'Analysis', 'Audio & Publish'];

const ELEVENLABS_MODELS = [
  { id: 'eleven_multilingual_v2', label: 'Multilingual v2 (Best quality)' },
  { id: 'eleven_flash_v2_5', label: 'Flash v2.5 (Fast, multilingual)' },
  { id: 'eleven_flash_v2', label: 'Flash v2 (Fast, English only)' },
  { id: 'eleven_turbo_v2', label: 'Turbo v2 (Legacy)' },
];

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
  const [editingTextId, setEditingTextId] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [cefrEstimate, setCefrEstimate] = useState('B1');
  const [bookId, setBookId] = useState('');
  const [chapterOrder, setChapterOrder] = useState('');
  const [saving, setSaving] = useState(false);
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
  const [selectedModel, setSelectedModel] = useState('eleven_multilingual_v2');
  const [audioStability, setAudioStability] = useState(0.75);
  const [audioSpeed, setAudioSpeed] = useState(0.92);
  const [audioData, setAudioData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  // Corpus list
  const [corpusTexts, setCorpusTexts] = useState([]);
  const [showWizard, setShowWizard] = useState(false);

  const voices = useMemo(() => getVoiceOptions(), []);
  const { cleanBody, images: parsedImages } = useMemo(() => extractImages(rawText), [rawText]);
  const analysis = useMemo(() => analyzeText(cleanBody), [cleanBody]);
  const textId = useMemo(() => titleToSlug(title), [title]);
  const [expandedBookId, setExpandedBookId] = useState(null);
  const editingExisting = useMemo(() => corpusTexts.find(t => t.id === (editingTextId || textId)), [corpusTexts, editingTextId, textId]);

  const bookChapters = useMemo(() => {
    const map = {};
    books.forEach(b => { map[b.id] = []; });
    const standalone = [];
    corpusTexts.forEach(t => {
      if (t.bookId && map[t.bookId]) {
        map[t.bookId].push(t);
      } else {
        standalone.push(t);
      }
    });
    Object.values(map).forEach(chs => chs.sort((a, b) => (a.chapterOrder || 0) - (b.chapterOrder || 0)));
    return { map, standalone };
  }, [books, corpusTexts]);

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
    const book = books.find(b => b.id === id);
    const chapterCount = corpusTexts.filter(t => t.bookId === id).length;
    const msg = chapterCount > 0
      ? `Delete book "${book?.title || id}"?\n\n${chapterCount} chapter(s) will be unlinked (not deleted). This cannot be undone.`
      : `Delete book "${book?.title || id}"?\n\nThis cannot be undone.`;
    if (!window.confirm(msg)) return;
    try {
      await supabase.from('curated_texts').update({ book_id: null, chapter_order: null }).eq('book_id', id);
      await supabase.from('books').delete().eq('id', id);
      if (expandedBookId === id) setExpandedBookId(null);
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

  const recordId = editingTextId || textId;

  async function handleGenerateAudio() {
    if (!cleanBody || !selectedVoice) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const data = await generateAudio(cleanBody, selectedVoice, {
        modelId: selectedModel,
        stability: audioStability,
        speed: audioSpeed,
      });
      setAudioData(data);

      if (data.audioBlob) {
        const storagePath = `${recordId}.mp3`;
        const { error: uploadError } = await supabase.storage
          .from('curated-text-audio')
          .upload(storagePath, data.audioBlob, {
            contentType: 'audio/mpeg',
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const existing = corpusTexts.find(t => t.id === recordId);
        if (existing) {
          await supabase
            .from('curated_texts')
            .update({
              audio_urls: { mp3: storagePath },
              audio_timestamps: data.audioTimestamps,
              audio_voice_ids: [selectedVoice],
              audio_generated_at: new Date().toISOString(),
            })
            .eq('id', recordId);
          await loadCorpus();
        }
      }
    } catch (err) {
      setGenerateError(err.message);
    }
    setGenerating(false);
  }

  async function handleSaveChanges() {
    if (!editingTextId || !title) return;
    setSaving(true);
    try {
      const updates = {
        title,
        author,
        cefr_estimate: cefrEstimate,
        book_id: bookId || null,
        chapter_order: chapterOrder ? Number(chapterOrder) : null,
        body: cleanBody,
        analysis: textAnalysis || null,
        word_count: analysis?.wordCount || 0,
      };
      const { error } = await supabase
        .from('curated_texts')
        .update(updates)
        .eq('id', editingTextId);
      if (error) throw error;
      await loadCorpus();
      handleReset();
    } catch (err) {
      setGenerateError(err.message);
    }
    setSaving(false);
  }

  async function handlePublish() {
    if (!title || !cleanBody) return;
    setPublishing(true);
    try {
      const existing = corpusTexts.find(t => t.id === recordId);

      let audioUrls = existing?.hasAudio ? { mp3: `${existing.id}.mp3` } : null;
      if (audioData?.audioBlob) {
        const storagePath = `${recordId}.mp3`;
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
        const coverPath = `${recordId}.${ext}`;
        const { error: coverError } = await supabase.storage
          .from('text-covers')
          .upload(coverPath, coverFile, { contentType: coverFile.type, upsert: true });
        if (coverError) throw coverError;
        const { data: urlData } = supabase.storage.from('text-covers').getPublicUrl(coverPath);
        coverImageUrl = urlData.publicUrl;
      }

      let imagesToStore = [...existingImages];
      if (parsedImages.length > 0) {
        for (const img of parsedImages) {
          const file = imageFiles.find(f => f.name === img.filename);
          if (file) {
            const storagePath = `${recordId}/${img.filename}`;
            const { error: imgError } = await supabase.storage
              .from('chapter-images')
              .upload(storagePath, file, { contentType: file.type, upsert: true });
            if (imgError) throw imgError;
            const { data: imgUrlData } = supabase.storage.from('chapter-images').getPublicUrl(storagePath);
            const entry = {
              filename: img.filename,
              alt: img.alt,
              afterParagraph: img.afterParagraph,
              publicUrl: imgUrlData.publicUrl,
            };
            const existingIdx = imagesToStore.findIndex(e => e.filename === img.filename);
            if (existingIdx >= 0) {
              imagesToStore[existingIdx] = entry;
            } else {
              imagesToStore.push(entry);
            }
          }
        }
      }

      const record = {
        id: recordId,
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
    setEditingTextId(text.id);
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
    setShowWizard(true);
    setTimeout(() => document.getElementById('chapter-wizard')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  async function handleDeleteText(id) {
    const text = corpusTexts.find(t => t.id === id);
    const msg = text?.hasAudio
      ? `Delete "${text?.title || id}"?\n\nThe associated audio file will also be deleted. This cannot be undone.`
      : `Delete "${text?.title || id}"?\n\nThis cannot be undone.`;
    if (!window.confirm(msg)) return;
    try {
      await supabase.storage.from('curated-text-audio').remove([`${id}.mp3`]);
      await supabase.from('curated_texts').delete().eq('id', id);
      await loadCorpus();
    } catch {}
  }

  function handleReset() {
    setStep(1);
    setEditingTextId(null);
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
    setShowWizard(false);
  }

  function handleAddChapterToBook(book) {
    handleReset();
    setShowWizard(true);
    setBookId(book.id);
    setAuthor(book.author || '');
    setCefrEstimate(book.cefr_estimate || 'B1');
    const chapters = corpusTexts.filter(t => t.bookId === book.id);
    const maxOrder = chapters.reduce((max, t) => Math.max(max, t.chapterOrder || 0), 0);
    setChapterOrder(String(maxOrder + 1));
    setTimeout(() => document.getElementById('chapter-wizard')?.scrollIntoView({ behavior: 'smooth' }), 50);
  }

  const canAdvance = title.trim() && rawText.trim();

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Panel</h1>

      {/* Library */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Library</h2>
          <button
            onClick={() => { resetBookForm(); setShowBookForm(true); setTimeout(() => document.getElementById('book-form')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + New Book
          </button>
        </div>

        {books.length > 0 && (
          <div className="space-y-3">
            {books.map(book => {
              const chapters = bookChapters.map[book.id] || [];
              const isExpanded = expandedBookId === book.id;
              return (
                <div key={book.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
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
                      <span className="text-xs text-gray-400">{chapters.length} ch.</span>
                      {book.vocabulary_manifest && (
                        <span className="text-xs text-green-600" title={`${Object.keys(book.vocabulary_manifest.entries || {}).length} manifest entries`}>manifest</span>
                      )}
                      {book.syntax_glosses && (
                        <span className="text-xs text-purple-600" title={`${Object.values(book.syntax_glosses.chapters || {}).reduce((s, ch) => s + ch.length, 0)} syntax glosses`}>glosses</span>
                      )}
                    </div>
                    <span className="text-gray-400 text-xs ml-2">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                      {chapters.length > 0 ? (
                        <div className="space-y-1.5">
                          {chapters.map(text => (
                            <div key={text.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-6 text-right font-mono">{text.chapterOrder}.</span>
                                <span className="text-sm text-gray-900">{text.title}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{text.wordCount} words</span>
                                {text.hasAudio && <span className="text-xs text-green-600">audio</span>}
                                {text.textAnalysis && <span className="text-xs text-blue-600">analyzed</span>}
                                <button onClick={() => handleEditText(text)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                                <button onClick={() => handleDeleteText(text.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 py-2">No chapters yet</p>
                      )}
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleAddChapterToBook(book)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          + Add Chapter
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => { handleEditBook(book); setTimeout(() => document.getElementById('book-form')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Edit Book
                        </button>
                        <button
                          onClick={() => handleDeleteBook(book.id)}
                          className="text-xs text-red-400 hover:text-red-600"
                        >
                          Delete Book
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {bookChapters.standalone.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Standalone Texts</h3>
            <div className="space-y-1.5">
              {bookChapters.standalone.map(text => (
                <div key={text.id} className="flex items-center justify-between py-2.5 px-4 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: (CEFR_COLORS[text.cefrEstimate] || '#6b7280') + '20',
                        color: CEFR_COLORS[text.cefrEstimate] || '#6b7280',
                      }}
                    >
                      {text.cefrEstimate}
                    </span>
                    <span className="text-sm font-medium text-gray-900">{text.title}</span>
                    {text.author && <span className="text-xs text-gray-400">{text.author}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{text.wordCount} words</span>
                    {text.hasAudio && <span className="text-xs text-green-600">audio</span>}
                    {text.textAnalysis && <span className="text-xs text-blue-600">analyzed</span>}
                    <button onClick={() => handleEditText(text)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Edit</button>
                    <button onClick={() => handleDeleteText(text.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {books.length === 0 && bookChapters.standalone.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No content yet. Create a book to get started.</p>
        )}
      </div>

      {/* Book form (shown when creating/editing a book — triggered from Library) */}
      <div id="book-form">
      {showBookForm && (
        <div className="mb-8 border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">
            {editingBookId ? 'Edit Book' : 'New Book'}
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
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
        </div>
      )}
      </div>

      {/* Chapter wizard (shown when adding/editing a chapter) */}
      {showWizard && (
        <div id="chapter-wizard" className="border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              {editingTextId
                ? (bookId ? `Edit Chapter — ${books.find(b => b.id === bookId)?.title || bookId}` : 'Edit Text')
                : (bookId ? `New Chapter — ${books.find(b => b.id === bookId)?.title || bookId}` : 'New Text')
              }
            </h2>
            <button
              onClick={handleReset}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Cancel
            </button>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1 mb-6">
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
            {/* Book context banner */}
            {bookId && books.find(b => b.id === bookId) && (
              <div className="flex items-center justify-between bg-blue-50 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-blue-700">Chapter in</span>
                  <span className="font-semibold text-blue-900">{books.find(b => b.id === bookId)?.title}</span>
                  <span className="text-blue-400">({cefrEstimate})</span>
                </div>
                <button
                  onClick={() => { setBookId(''); setChapterOrder(''); }}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  Detach from book
                </button>
              </div>
            )}

            {/* Audio exists banner */}
            {editingExisting?.hasAudio && !audioData && (
              <div className="flex items-center gap-2 bg-green-50 px-4 py-3 rounded-lg">
                <span className="text-sm text-green-700">Audio exists for this chapter and will be preserved on publish.</span>
              </div>
            )}

            {bookId ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Chapter Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Chapter 1 — The Beginning"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  {textId && <p className="text-xs text-gray-400 mt-1">ID: {textId}</p>}
                </div>
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
              </div>
            ) : (
              <>
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
                <div className="grid grid-cols-2 gap-4">
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
                </div>
              </>
            )}

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
                {existingImages.length > 0 && (
                  <div className="space-y-1 mb-3">
                    <p className="text-xs text-gray-500 mb-1">Stored images</p>
                    {existingImages.map((img, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">stored</span>
                        <span className="font-mono text-gray-600">{img.filename}</span>
                        <span className="text-gray-400">after paragraph {(img.afterParagraph ?? 0) + 1}</span>
                        <button
                          type="button"
                          onClick={() => setExistingImages(prev => prev.filter((_, j) => j !== i))}
                          className="text-red-400 hover:text-red-600 ml-1"
                        >
                          remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {parsedImages.length > 0 && (
                  <>
                    {existingImages.length > 0 && (
                      <p className="text-xs text-gray-500 mb-1">New images from text</p>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        setImageFiles(prev => {
                          const merged = [...prev];
                          for (const f of newFiles) {
                            const idx = merged.findIndex(ex => ex.name === f.name);
                            if (idx >= 0) merged[idx] = f;
                            else merged.push(f);
                          }
                          return merged;
                        });
                      }}
                      className="text-sm text-gray-500 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-gray-300 file:text-sm file:font-medium file:bg-white file:text-gray-700 hover:file:bg-gray-50"
                    />
                    <div className="mt-2 space-y-1">
                      {parsedImages.map((img, i) => {
                        const hasFile = imageFiles.some(f => f.name === img.filename);
                        const isStored = existingImages.some(e => e.filename === img.filename);
                        return (
                          <div key={i} className="flex items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded ${
                              hasFile ? 'bg-green-100 text-green-700'
                                : isStored ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {hasFile ? 'ready' : isStored ? 'stored' : 'needs file'}
                            </span>
                            <span className="font-mono text-gray-600">{img.filename}</span>
                            <span className="text-gray-400">after paragraph {img.afterParagraph + 1}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-center gap-3">
              {editingTextId && (
                <button
                  onClick={handleSaveChanges}
                  disabled={saving || !title.trim()}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    saving || !title.trim()
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-green-700 text-white hover:bg-green-600'
                  }`}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
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
                {editingTextId ? 'Audio & Publish' : 'Skip to Publish'}
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
                Back to Library
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Voice</label>
                        <select
                          value={selectedVoice}
                          onChange={(e) => setSelectedVoice(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {voices.map(v => (
                            <option key={v.id} value={v.id}>{v.name} ({v.id.slice(0, 8)}...)</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Model</label>
                        <select
                          value={selectedModel}
                          onChange={(e) => setSelectedModel(e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                        >
                          {ELEVENLABS_MODELS.map(m => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Stability — {audioStability.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={audioStability}
                          onChange={(e) => setAudioStability(Number(e.target.value))}
                          className="w-full accent-gray-900"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>More expressive</span>
                          <span>More consistent</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                          Speed — {audioSpeed.toFixed(2)}
                        </label>
                        <input
                          type="range"
                          min="0.7"
                          max="1.2"
                          step="0.01"
                          value={audioSpeed}
                          onChange={(e) => setAudioSpeed(Number(e.target.value))}
                          className="w-full accent-gray-900"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>Slower</span>
                          <span>Faster</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerateAudio}
                        disabled={generating || !rawText}
                        className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                          generating || !rawText
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : editingExisting?.hasAudio && !audioData
                              ? 'bg-amber-600 text-white hover:bg-amber-500'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {generating ? 'Generating...' : editingExisting?.hasAudio && !audioData ? 'Replace Existing Audio' : 'Generate Audio'}
                      </button>
                    </div>

                    {editingExisting?.hasAudio && !audioData && (
                      <p className="text-xs text-amber-600">Generating new audio will replace the existing file and cost ElevenLabs credits.</p>
                    )}

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
                  <Stat label="Audio" value={audioData ? 'New audio' : editingExisting?.hasAudio ? 'Existing (preserved)' : 'None'} />
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
                {!audioData && !editingExisting?.hasAudio && (
                  <span className="text-xs text-gray-400">Publishing without audio — you can generate it later</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

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
