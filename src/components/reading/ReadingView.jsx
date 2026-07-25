import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import TextSelector from './TextSelector';
import TextDisplay from './TextDisplay';
import WordPopup from './WordPopup';
import CardCreator from './CardCreator';
import ToolSetSelector from './ToolSetSelector';
import ListenReadStrip from './ListenReadStrip';
import ShadowReadStrip from './ShadowReadStrip';
import RecordReviewStrip from './RecordReviewStrip';
import TimedReadStrip from './TimedReadStrip';
import AssignmentChecklist from './AssignmentChecklist';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import { sampleTexts } from '../../data/sampleTexts';
import { supabase } from '../../lib/supabase';
import { cleanToken } from '../../lib/wordUtils';
import { findCurrentWord, findCurrentSentence, detectSentences, findSentenceForWord } from '../../lib/audioUtils';
import { completeTaskForText } from '../../lib/assignments';
import { logFluencySession, getFluencySessionsForText } from '../../lib/fluency';
import { runPronunciationAssessment, buildWordAssessmentMap, assessSentencePronunciation, getWordPositions, extractChunkText } from '../../lib/pronunciation';
import { resetChapterRecording, resetChapterWpm } from '../../lib/resetProgress';
import { useAuth } from '../../context/AuthContext';

export default function ReadingView() {
  const { user, isTeacher, l1, textSize } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [curatedTexts, setCuratedTexts] = useState([]);

  const [selectedTextId, setSelectedTextId] = useState(null);

  const allTexts = useMemo(() => {
    const curated = curatedTexts.map(t => ({
      ...t,
      cefr: t.cefr_estimate || t.cefr,
    }));
    return [...sampleTexts, ...curated];
  }, [curatedTexts]);

  const selectorTexts = useMemo(() => {
    const text = allTexts.find(t => t.id === selectedTextId);
    if (text?.book_id) {
      return allTexts
        .filter(t => t.book_id === text.book_id)
        .sort((a, b) => (a.chapter_order ?? 0) - (b.chapter_order ?? 0));
    }
    return allTexts.filter(t => !t.book_id);
  }, [allTexts, selectedTextId]);

  const chapterNav = useMemo(() => {
    const text = allTexts.find(t => t.id === selectedTextId);
    if (!text?.book_id) return null;
    const siblings = selectorTexts;
    const idx = siblings.findIndex(t => t.id === selectedTextId);
    if (idx === -1) return null;
    return {
      prev: idx > 0 ? siblings[idx - 1] : null,
      next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
      current: idx + 1,
      total: siblings.length,
      bookId: text.book_id,
    };
  }, [allTexts, selectorTexts, selectedTextId]);
  const [popup, setPopup] = useState(null);
  const [cardCreator, setCardCreator] = useState(null);
  const [encounters, setEncounters] = useState({});
  const [bookManifest, setBookManifest] = useState(null);
  const [syntaxGlosses, setSyntaxGlosses] = useState(null);
  const [translationMode, setTranslationMode] = useState(false);
  const [showStructures, setShowStructures] = useState(false);
  const [checklistKey, setChecklistKey] = useState(0);
  const selectedTextIdRef = useRef(selectedTextId);
  selectedTextIdRef.current = selectedTextId;

  // Tool set state — resets on text change
  const [toolSet, setToolSet] = useState('listen');

  const scrollContainerRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(-1);
  const [loopSentenceIdx, setLoopSentenceIdx] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Full-text recording (Record & Review tool set)
  const recorder = useAudioRecorder();
  const [recordingMode, setRecordingMode] = useState('idle');
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const elapsedTimerRef = useRef(null);
  const playbackRef = useRef(null);

  // Sentence-loop ephemeral recording (Shadow Read tool set)
  const loopRecorder = useAudioRecorder();
  const [loopRecordingMode, setLoopRecordingMode] = useState('idle');
  const loopPlaybackRef = useRef(null);

  // Shadow reading sentence tracking
  const shadowedSentencesRef = useRef(new Set());

  // Pronunciation assessment
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [assessmentError, setAssessmentError] = useState(null);
  const [assessmentData, setAssessmentData] = useState(null);
  const [wordAssessmentMap, setWordAssessmentMap] = useState(null);
  const [hasRecording, setHasRecording] = useState(false);

  // Shadow read pronunciation feedback (per-sentence, client-side only)
  const [shadowFeedbackMap, setShadowFeedbackMap] = useState(new Map());
  const [shadowFeedbackLoading, setShadowFeedbackLoading] = useState(false);

  // Timed reading
  const [timedMode, setTimedMode] = useState('idle');
  const [timedStart, setTimedStart] = useState(null);
  const [timedElapsed, setTimedElapsed] = useState(0);
  const [timedResult, setTimedResult] = useState(null);
  const [wpmHistory, setWpmHistory] = useState([]);
  const timedIntervalRef = useRef(null);

  const selectedText = allTexts.find((t) => t.id === selectedTextId);
  const hasAudio = !!(selectedText?.audioUrl && selectedText?.audioTimestamps);

  const sentences = useMemo(() => {
    if (!selectedText?.body) return [];
    return detectSentences(selectedText.body, hasAudio ? selectedText.audioTimestamps : null);
  }, [selectedText, hasAudio]);

  // Reset state on text change
  useEffect(() => {
    shadowedSentencesRef.current = new Set();
    setIsPlaying(false);
    setCurrentWordIdx(-1);
    setCurrentSentenceIdx(-1);
    setLoopSentenceIdx(null);
    setCurrentTime(0);
    setDuration(0);
    setPopup(null);
    setToolSet('listen');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (recordingMode !== 'idle') {
      recorder.stopRecording();
      recorder.clearRecording();
      setRecordingMode('idle');
      if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
    }
    if (timedIntervalRef.current) { clearInterval(timedIntervalRef.current); timedIntervalRef.current = null; }
    setTimedMode('idle');
    setTimedStart(null);
    setTimedElapsed(0);
    setTimedResult(null);
    setAssessmentStatus(null);
    setAssessmentError(null);
    setAssessmentData(null);
    setWordAssessmentMap(null);
    setHasRecording(false);
    setShadowFeedbackMap(new Map());
    setShadowFeedbackLoading(false);
  }, [selectedTextId]);

  // Load existing assessment + recording state when text changes
  useEffect(() => {
    if (!user?.id || !selectedTextId) return;
    let cancelled = false;

    (async () => {
      const [{ data: assessment }, { data: rec }] = await Promise.all([
        supabase
          .from('pronunciation_assessments')
          .select('*')
          .eq('user_id', user.id)
          .eq('text_id', selectedTextId)
          .maybeSingle(),
        supabase
          .from('student_recordings')
          .select('assessment_status, assessment_error')
          .eq('user_id', user.id)
          .eq('text_id', selectedTextId)
          .maybeSingle(),
      ]);
      if (cancelled) return;

      setHasRecording(!!rec);

      if (assessment) {
        setAssessmentData(assessment);
        setWordAssessmentMap(buildWordAssessmentMap(assessment, sentences));
        setAssessmentStatus('complete');
      } else if (rec) {
        setAssessmentStatus(rec.assessment_status || null);
        setAssessmentError(rec.assessment_error || null);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTextId, user?.id]);

  // Reset tool-specific state when switching tool sets
  useEffect(() => {
    shadowedSentencesRef.current = new Set();
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setLoopSentenceIdx(null);
    if (recordingMode !== 'idle') {
      recorder.stopRecording();
      recorder.clearRecording();
      setRecordingMode('idle');
      if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
    }
    if (timedMode !== 'idle' && timedMode !== 'result') {
      if (timedIntervalRef.current) { clearInterval(timedIntervalRef.current); timedIntervalRef.current = null; }
      setTimedMode('idle');
      setTimedStart(null);
      setTimedElapsed(0);
    }
  }, [toolSet]);

  useEffect(() => {
    const requestedId = searchParams.get('text');
    if (requestedId && allTexts.find(t => t.id === requestedId)) {
      setSelectedTextId(requestedId);
      setSearchParams({}, { replace: true });
    } else if (!selectedTextId && allTexts.length > 0) {
      setSelectedTextId(allTexts[0].id);
    }
  }, [allTexts]);

  useEffect(() => {
    loadCuratedTexts();
    loadEncounters();
    return () => {
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
      if (timedIntervalRef.current) clearInterval(timedIntervalRef.current);
    };
  }, []);

  async function loadCuratedTexts() {
    try {
      const { data, error } = await supabase
        .from('curated_texts')
        .select('*')
        .eq('status', 'published');
      if (error) throw error;

      const textsWithAudio = await Promise.all((data || []).map(async (t) => {
        let audioUrl = null;
        if (t.audio_urls?.mp3) {
          const { data: signedData } = await supabase.storage
            .from('curated-text-audio')
            .createSignedUrl(t.audio_urls.mp3, 3600);
          if (signedData?.signedUrl) audioUrl = signedData.signedUrl;
        }
        return {
          id: t.id,
          title: t.title,
          author: t.author,
          body: t.body,
          cefr_estimate: t.cefr_estimate,
          cefr: t.cefr_estimate,
          audioUrl,
          audioTimestamps: t.audio_timestamps,
          book_id: t.book_id,
          chapter_order: t.chapter_order,
          images: t.images || [],
        };
      }));

      setCuratedTexts(textsWithAudio);
    } catch (e) {
      console.warn('Failed to load curated texts', e);
    }
  }

  const currentBookId = selectedText?.book_id;
  useEffect(() => {
    if (!currentBookId) { setBookManifest(null); setSyntaxGlosses(null); return; }
    let cancelled = false;
    supabase
      .from('books')
      .select('vocabulary_manifest, syntax_glosses')
      .eq('id', currentBookId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setBookManifest(data?.vocabulary_manifest || null);
          setSyntaxGlosses(data?.syntax_glosses || null);
        }
      });
    return () => { cancelled = true; };
  }, [currentBookId]);

  const chapterGlosses = useMemo(() => {
    if (!syntaxGlosses?.chapters || !selectedText) return null;
    const order = selectedText.chapter_order;
    if (order == null) return null;
    const key = `ch${String(order).padStart(2, '0')}`;
    return syntaxGlosses.chapters[key] || null;
  }, [syntaxGlosses, selectedText]);

  const hasSyntaxGlosses = !!chapterGlosses?.length;

  const manifestHasStructures = useMemo(() => {
    if (!bookManifest?.entries) return false;
    return Object.values(bookManifest.entries).some(e => e.type === 'structure');
  }, [bookManifest]);

  // useEffect(() => {
  //   setShowStructures(isTeacher && manifestHasStructures);
  // }, [manifestHasStructures, isTeacher]);

  // Timed reading: tick every second while active
  useEffect(() => {
    if (timedMode === 'active' && timedStart) {
      timedIntervalRef.current = setInterval(() => {
        setTimedElapsed(Math.floor((Date.now() - timedStart) / 1000));
      }, 1000);
    } else {
      if (timedIntervalRef.current) { clearInterval(timedIntervalRef.current); timedIntervalRef.current = null; }
    }
    return () => { if (timedIntervalRef.current) clearInterval(timedIntervalRef.current); };
  }, [timedMode, timedStart]);

  // Load WPM history when text changes
  useEffect(() => {
    if (selectedTextId) {
      getFluencySessionsForText(selectedTextId).then(sessions => {
        setWpmHistory(sessions.map(s => s.wpm));
      });
    } else {
      setWpmHistory([]);
    }
  }, [selectedTextId]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    if (currentSentenceIdx < 0) return;
    const el = document.querySelector(`[data-sidx="${currentSentenceIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [currentSentenceIdx]);

  async function loadEncounters() {
    try {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('encounters')
        .select('headword')
        .eq('user_id', user.id);
      if (error) throw error;
      const counts = {};
      for (const enc of (data || [])) {
        counts[enc.headword] = (counts[enc.headword] || 0) + 1;
      }
      setEncounters(counts);
    } catch {}
  }

  async function recordEncounter(token) {
    const headword = token.lemma || cleanToken(token.raw);
    if (!headword || !user?.id) return;
    try {
      await supabase.from('encounters').insert({
        user_id: user.id,
        headword,
        word: token.raw,
        cefr: token.cefr,
        text_id: selectedTextIdRef.current,
        type: 'lookup',
      });
      setEncounters((prev) => ({
        ...prev,
        [headword]: (prev[headword] || 0) + 1,
      }));
    } catch {}
  }

  // ── Audio playback ────────────────────────────────────────────────────────────

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio || !selectedText?.audioTimestamps) return;
    const ct = audio.currentTime;
    setCurrentTime(ct);

    const widx = findCurrentWord(selectedText.audioTimestamps, ct);
    setCurrentWordIdx(widx);
    setCurrentSentenceIdx(findCurrentSentence(sentences, ct));

    if (loopSentenceIdx != null) {
      const sentence = sentences[loopSentenceIdx];
      const loopEnd = sentence.endTime + 0.05;
      if (sentence?.endTime != null && ct >= loopEnd) {
        audio.currentTime = getLoopStart(loopSentenceIdx);
      }
    }
  }

  function handlePlayPause() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function handleSeek(time) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = time;
    setCurrentTime(time);
  }

  function handleSpeedChange(speed) {
    setPlaybackRate(speed);
  }

  function getLoopStart(sentenceIdx) {
    const sentence = sentences[sentenceIdx];
    return Math.max(0, sentence.startTime - 0.05);
  }

  function trackShadowedSentence(sentenceIdx) {
    if (toolSet !== 'shadow') return;
    if (shadowedSentencesRef.current.has(sentenceIdx)) return;
    shadowedSentencesRef.current.add(sentenceIdx);
    if (user?.id && selectedTextIdRef.current) {
      completeTaskForText(user.id, selectedTextIdRef.current, 'shadowReading', {
        done: true,
        sentencesLooped: shadowedSentencesRef.current.size,
        totalSentences: sentences.length,
      }).catch(() => {});
      setChecklistKey(k => k + 1);
    }
  }

  function handleSentenceLoop(wordIdx) {
    const sentence = findSentenceForWord(sentences, wordIdx);
    if (!sentence || !hasAudio) return;

    if (loopSentenceIdx === sentence.sentenceIdx) {
      setLoopSentenceIdx(null);
    } else {
      trackShadowedSentence(sentence.sentenceIdx);
      setLoopSentenceIdx(sentence.sentenceIdx);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = getLoopStart(sentence.sentenceIdx);
        audio.play();
        setIsPlaying(true);
      }
    }
  }

  function handleLoopByIndex(sentenceIdx) {
    const sentence = sentences[sentenceIdx];
    if (!sentence || !hasAudio) return;

    if (loopSentenceIdx === sentenceIdx) {
      setLoopSentenceIdx(null);
    } else {
      trackShadowedSentence(sentenceIdx);
      setLoopSentenceIdx(sentenceIdx);
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = getLoopStart(sentenceIdx);
        audio.play();
        setIsPlaying(true);
      }
    }
  }

  function handleClearLoop() {
    setLoopSentenceIdx(null);
  }

  // ── Full-text recording controls (Record & Review) ────────────────────────────

  async function handleStartRecording() {
    setSaveError(null);
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    await recorder.startRecording();
    setRecordingMode('recording');
    setRecordingElapsed(0);
    elapsedTimerRef.current = setInterval(() => {
      setRecordingElapsed(recorder.getElapsedSeconds());
    }, 500);
  }

  function handleStopRecording() {
    recorder.stopRecording();
    if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
    setRecordingMode('review');
    if (audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
  }

  function handleListenBack() {
    if (playbackRef.current) { playbackRef.current.pause(); playbackRef.current = null; }
    if (recorder.audioUrl) {
      const a = new Audio(recorder.audioUrl);
      playbackRef.current = a;
      a.play().catch(() => {});
    }
  }

  async function handleSaveRecording() {
    if (!recorder.audioBlob || !user?.id) return;
    setSaving(true);
    setSaveError(null);
    const textId = selectedTextIdRef.current;
    try {
      const storagePath = `${user.id}/${textId}.webm`;

      const { error: uploadError } = await supabase.storage
        .from('student-recordings')
        .upload(storagePath, recorder.audioBlob, {
          contentType: 'audio/webm',
          upsert: true,
        });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('student_recordings')
        .upsert({
          user_id: user.id,
          text_id: textId,
          storage_path: storagePath,
          duration_seconds: recordingElapsed,
          playback_rate: playbackRate,
        }, { onConflict: 'user_id,text_id' });
      if (dbError) throw dbError;
    } catch (err) {
      setSaveError('Save failed — try again');
      setSaving(false);
      return;
    }
    await completeTaskForText(user.id, textId, 'recordAudio').catch(() => {});
    setChecklistKey(k => k + 1);
    if (playbackRef.current) { playbackRef.current.pause(); playbackRef.current = null; }
    recorder.clearRecording();
    setRecordingMode('idle');
    setSaving(false);
    setHasRecording(true);
    setAssessmentStatus(null);
    setAssessmentError(null);
    setAssessmentData(null);
    setWordAssessmentMap(null);
  }

  async function handleAnalyzePronunciation() {
    if (!user?.id || !selectedText?.body) return;
    const textId = selectedTextIdRef.current;
    setAssessmentStatus('processing');
    setAssessmentError(null);

    const { data: rec } = await supabase
      .from('student_recordings')
      .select('storage_path')
      .eq('user_id', user.id)
      .eq('text_id', textId)
      .single();
    if (!rec) {
      setAssessmentStatus('error');
      setAssessmentError('No recording found');
      return;
    }

    const { data: blob } = await supabase.storage
      .from('student-recordings')
      .download(rec.storage_path);
    if (!blob) {
      setAssessmentStatus('error');
      setAssessmentError('Could not download recording');
      return;
    }

    const result = await runPronunciationAssessment({
      userId: user.id,
      textId,
      storagePath: rec.storage_path,
      referenceText: selectedText.body,
      audioBlob: blob,
      supabase,
    });

    if (result.success) {
      setAssessmentData(result.assessmentData);
      setWordAssessmentMap(buildWordAssessmentMap(result.assessmentData, sentences));
      setAssessmentStatus('complete');
      setAssessmentError(null);
    } else {
      setAssessmentStatus('error');
      setAssessmentError(result.error);
    }
  }

  function handleDiscardRecording() {
    if (playbackRef.current) { playbackRef.current.pause(); playbackRef.current = null; }
    recorder.clearRecording();
    setRecordingMode('idle');
    setSaveError(null);
  }

  // ── Sentence-loop ephemeral recording (Shadow Read) ───────────────────────────

  async function handleStartLoopRecording() {
    await loopRecorder.startRecording();
    setLoopRecordingMode('recording');
  }

  function handleStopLoopRecording() {
    loopRecorder.stopRecording();
    setLoopRecordingMode('playback');
  }

  function handlePlayLoopRecording() {
    if (loopPlaybackRef.current) { loopPlaybackRef.current.pause(); loopPlaybackRef.current = null; }
    if (loopRecorder.audioUrl) {
      const a = new Audio(loopRecorder.audioUrl);
      loopPlaybackRef.current = a;
      a.onended = () => { loopPlaybackRef.current = null; };
      a.play().catch(() => {});
    }
  }

  useEffect(() => {
    if (loopPlaybackRef.current) { loopPlaybackRef.current.pause(); loopPlaybackRef.current = null; }
    loopRecorder.clearRecording();
    setLoopRecordingMode('idle');
  }, [loopSentenceIdx]);

  // ── Shadow read pronunciation feedback ─────────────────────────────────────────

  function buildShadowWordAssessmentMap(feedbackMap) {
    const combined = new Map();
    for (const sentenceMap of feedbackMap.values()) {
      for (const [refIdx, assessment] of sentenceMap) {
        combined.set(refIdx, assessment);
      }
    }
    return combined;
  }

  async function handleRequestShadowFeedback() {
    const sentIdx = loopSentenceIdx;
    if (sentIdx == null || !loopRecorder.audioBlob || !selectedText?.body) return;
    const sentence = sentences[sentIdx];
    if (!sentence) return;

    setShadowFeedbackLoading(true);
    try {
      const wordPositions = getWordPositions(selectedText.body);
      const refText = extractChunkText(selectedText.body, wordPositions, sentence.firstWordIdx, sentence.lastWordIdx);
      const result = await assessSentencePronunciation({
        audioBlob: loopRecorder.audioBlob,
        referenceText: refText,
        firstWordIdx: sentence.firstWordIdx,
        lastWordIdx: sentence.lastWordIdx,
        supabase,
        userId: user?.id,
        textId: selectedTextId,
      });

      setShadowFeedbackMap(prev => {
        const next = new Map(prev);
        next.set(sentIdx, result.map);
        setWordAssessmentMap(buildShadowWordAssessmentMap(next));
        return next;
      });
    } catch (err) {
      console.error('Shadow feedback error:', err);
    } finally {
      setShadowFeedbackLoading(false);
    }
  }

  function handleClearShadowFeedback(sentIdx) {
    setShadowFeedbackMap(prev => {
      const next = new Map(prev);
      next.delete(sentIdx);
      setWordAssessmentMap(next.size > 0 ? buildShadowWordAssessmentMap(next) : null);
      return next;
    });
  }

  // ── Timed reading controls ────────────────────────────────────────────────────

  function countWords(text) {
    return (text.match(/[a-zA-ZÀ-ÿ'''-]+/g) || []).length;
  }

  function handleTimedStart() {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTimedStart(Date.now());
    setTimedElapsed(0);
    setTimedMode('active');
  }

  function handleTimedCancel() {
    if (timedIntervalRef.current) { clearInterval(timedIntervalRef.current); timedIntervalRef.current = null; }
    setTimedMode('idle');
    setTimedStart(null);
    setTimedElapsed(0);
    setTimedResult(null);
  }

  function handleTimedDone(wordsReadOverride) {
    const elapsed = Math.floor((Date.now() - timedStart) / 1000);
    if (elapsed < 5) {
      handleTimedCancel();
      return;
    }
    const wordsRead = wordsReadOverride ?? countWords(selectedText?.body || '');
    const wpm = elapsed > 0 ? Math.round((wordsRead / elapsed) * 60) : 0;
    setTimedResult({ textId: selectedTextId, wordsRead, elapsed, wpm });
    setTimedMode('result');
  }

  async function handleTimedSave() {
    if (!timedResult) return;
    await logFluencySession({
      userId: user?.id,
      textId: timedResult.textId,
      wordCount: timedResult.wordsRead,
      elapsedSeconds: timedResult.elapsed,
    });
    if (user?.id && timedResult.textId) {
      await completeTaskForText(user.id, timedResult.textId, 'timedReading').catch(() => {});
      setChecklistKey(k => k + 1);
    }
    const sessions = await getFluencySessionsForText(timedResult.textId);
    setWpmHistory(sessions.map(s => s.wpm));
    handleTimedCancel();
  }

  function handleTimedDiscard() {
    handleTimedCancel();
  }

  async function handleStartFresh() {
    if (!user?.id || !selectedTextId) return;
    await resetChapterRecording(user.id, selectedTextId);
    setHasRecording(false);
    setAssessmentStatus(null);
    setAssessmentError(null);
    setAssessmentData(null);
    setWordAssessmentMap(null);
  }

  async function handleClearWpmHistory() {
    if (!user?.id || !selectedTextId) return;
    await resetChapterWpm(user.id, selectedTextId);
    setWpmHistory([]);
  }

  // ── Word click / popup ────────────────────────────────────────────────────────

  const handleWordClick = useCallback((token, position) => {
    if (toolSet === 'timed' && timedMode === 'active') {
      handleTimedDone(token.wordIdx + 1);
      return;
    }
    if (audioRef.current && !audioRef.current.paused && hasAudio) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setPopup({ token, position });
    recordEncounter(token);
  }, [hasAudio, sentences, toolSet, timedMode]);

  function handleResumeAudio() {
    setPopup(null);
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }

  function handleOpenCardCreator() {
    if (!popup) return;
    const { token } = popup;
    if (token.structure) {
      const egp = token.structure.egp || {};
      setCardCreator({
        word: token.raw,
        lemma: token.lemma,
        cefr: token.structure.override_cefr || egp.level || token.cefr,
        sentence: token.sentence || '',
        isStructure: true,
        structureData: token.structure,
      });
    } else {
      setCardCreator({
        word: token.raw,
        lemma: token.lemma,
        cefr: token.cefr,
        sentence: token.sentence || '',
      });
    }
    setPopup(null);
  }

  // ── Render control strip for active tool set ──────────────────────────────────

  function renderControlStrip() {
    if (toolSet === 'listen' && hasAudio) {
      return (
        <ListenReadStrip
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
        />
      );
    }

    if (toolSet === 'shadow' && hasAudio) {
      return (
        <ShadowReadStrip
          isPlaying={isPlaying}
          playbackRate={playbackRate}
          loopSentenceIdx={loopSentenceIdx}
          currentSentenceIdx={currentSentenceIdx}
          sentences={sentences}
          onPlayPause={handlePlayPause}
          onSeek={handleSeek}
          onSpeedChange={handleSpeedChange}
          onLoopSentence={handleLoopByIndex}
          onClearLoop={handleClearLoop}
          loopRecordingMode={loopRecordingMode}
          loopRecorderAudioUrl={loopRecorder.audioUrl}
          onStartLoopRecording={handleStartLoopRecording}
          onStopLoopRecording={handleStopLoopRecording}
          onPlayLoopRecording={handlePlayLoopRecording}
          sentenceFeedback={(() => {
            const accMap = new Map();
            for (const [sIdx, sentMap] of shadowFeedbackMap) {
              const scores = [...sentMap.values()]
                .filter(a => a.accuracy != null && a.type !== 'omission')
                .map(a => a.accuracy);
              if (scores.length > 0) accMap.set(sIdx, Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
            }
            return accMap;
          })()}
          feedbackLoading={shadowFeedbackLoading}
          onRequestFeedback={handleRequestShadowFeedback}
          onClearFeedback={handleClearShadowFeedback}
        />
      );
    }

    if (toolSet === 'record') {
      return (
        <RecordReviewStrip
          recordingMode={recordingMode}
          recordingElapsed={recordingElapsed}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onListenBack={handleListenBack}
          onSaveRecording={handleSaveRecording}
          onDiscardRecording={handleDiscardRecording}
          saving={saving}
          saveError={saveError}
          recorderError={recorder.error}
          l1={l1}
        />
      );
    }

    if (toolSet === 'timed') {
      return (
        <TimedReadStrip
          mode={timedMode}
          elapsed={timedElapsed}
          result={timedResult}
          wpmHistory={wpmHistory}
          onStart={handleTimedStart}
          onCancel={handleTimedCancel}
          onDone={() => handleTimedDone()}
          onSave={handleTimedSave}
          onDiscard={handleTimedDiscard}
          onClearHistory={handleClearWpmHistory}
          l1={l1}
        />
      );
    }

    if (!hasAudio) {
      return (
        <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
          <span>{Object.keys(encounters).length} words encountered</span>
          <span>Click any word to look it up</span>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex flex-col h-full">
      <TextSelector
        texts={selectorTexts}
        selectedId={selectedTextId}
        onSelect={(id) => { setSelectedTextId(id); setPopup(null); }}
      />

      <AssignmentChecklist
        textId={selectedTextId}
        encounters={encounters}
        refreshKey={checklistKey}
        onSelectText={(id) => { setSelectedTextId(id); setPopup(null); }}
      />

      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {selectedText && (
            <>
              <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                    {selectedText.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedText.author} · {selectedText.cefr || selectedText.cefrEstimate}
                    {wpmHistory.length > 0 && (
                      <span className="ml-2 text-amber-600">
                        · {wpmHistory[wpmHistory.length - 1]} WPM (pass {wpmHistory.length})
                      </span>
                    )}
                  </p>
                </div>
                <ToolSetSelector
                  active={toolSet}
                  onSelect={(id) => {
                    if (id === 'translate') {
                      setTranslationMode(m => !m);
                    } else {
                      setToolSet(id);
                    }
                  }}
                  hasAudio={hasAudio}
                  hasSyntaxGlosses={hasSyntaxGlosses}
                  translationMode={translationMode}
                  l1={l1}
                />
              </div>

              <TextDisplay
                text={selectedText.body}
                onWordClick={handleWordClick}
                encounters={encounters}
                currentWordIdx={currentWordIdx}
                currentSentenceIdx={currentSentenceIdx}
                loopSentenceIdx={loopSentenceIdx}
                sentences={sentences}
                manifest={bookManifest}
                showStructures={showStructures}
                syntaxGlosses={chapterGlosses}
                translationMode={translationMode}
                images={selectedText.images}
                l1={l1}
                wordAssessmentMap={(toolSet === 'record' || toolSet === 'shadow') ? wordAssessmentMap : null}
                textSize={textSize}
              />

              {chapterNav && (
                <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    {chapterNav.prev ? (
                      <button
                        onClick={() => { setSelectedTextId(chapterNav.prev.id); setPopup(null); scrollContainerRef.current?.scrollTo(0, 0); }}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        <span>&larr;</span> {chapterNav.prev.title}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/book/${chapterNav.bookId}`)}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        <span>&larr;</span> All chapters
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {chapterNav.current} / {chapterNav.total}
                  </span>
                  <div>
                    {chapterNav.next ? (
                      <button
                        onClick={() => { setSelectedTextId(chapterNav.next.id); setPopup(null); scrollContainerRef.current?.scrollTo(0, 0); }}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        {chapterNav.next.title} <span>&rarr;</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/book/${chapterNav.bookId}`)}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
                      >
                        All chapters <span>&rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {hasAudio && (
        <audio
          ref={audioRef}
          src={selectedText.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentWordIdx(-1);
            setCurrentSentenceIdx(-1);
            if (user?.id && selectedTextIdRef.current) {
              completeTaskForText(user.id, selectedTextIdRef.current, 'readingPass')
                .then(() => setChecklistKey(k => k + 1));
            }
          }}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          preload="auto"
        />
      )}

      {renderControlStrip()}

      {popup && (
        <WordPopup
          word={popup.token.raw}
          cefr={popup.token.cefr}
          lemma={popup.token.lemma}
          via={popup.token.via}
          position={popup.position}
          onClose={() => setPopup(null)}
          onResumeAudio={hasAudio && audioRef.current && audioRef.current.paused ? handleResumeAudio : null}
          onAddFlashcard={handleOpenCardCreator}
          particle={popup.token.particle || null}
          structure={popup.token.structure || null}
          manifest={bookManifest}
          syntaxGloss={popup.token.syntaxGloss || null}
          l1={l1}
          assessmentInfo={(toolSet === 'record' || toolSet === 'shadow') ? (wordAssessmentMap?.get(popup.token.wordIdx) || null) : null}
        />
      )}

      {cardCreator && (
        <CardCreator
          word={cardCreator.word}
          lemma={cardCreator.lemma}
          cefr={cardCreator.cefr}
          sentence={cardCreator.sentence}
          textId={selectedTextId}
          textTitle={selectedText?.title}
          isStructure={cardCreator.isStructure || false}
          structureData={cardCreator.structureData || null}
          l1={l1}
          onClose={() => setCardCreator(null)}
          onCreated={() => {
            setCardCreator(null);
            if (user?.id && selectedTextId) {
              completeTaskForText(user.id, selectedTextId, 'flashcards')
                .then(() => setChecklistKey(k => k + 1));
            }
          }}
        />
      )}
    </div>
  );
}
