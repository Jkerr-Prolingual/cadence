import { useState, useRef, useCallback, useEffect } from 'react';

const MAX_DURATION_MS = 5 * 60 * 1000;
const BITS_PER_SECOND = 32000;

export default function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob]     = useState(null);
  const [audioUrl, setAudioUrl]       = useState(null);
  const [error, setError]             = useState(null);

  const recorderRef  = useRef(null);
  const streamRef    = useRef(null);
  const timerRef     = useRef(null);
  const chunksRef    = useRef([]);
  const startTimeRef = useRef(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    startTimeRef.current = null;
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setError(null);
  }, [audioUrl]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    clearRecording();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, {
        mimeType,
        bitsPerSecond: BITS_PER_SECOND,
      });
      recorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setIsRecording(false);
        cleanup();
      };

      recorder.onerror = () => {
        setError('Recording failed');
        setIsRecording(false);
        cleanup();
      };

      recorder.start(1000);
      setIsRecording(true);

      timerRef.current = setTimeout(() => stopRecording(), MAX_DURATION_MS);
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone access denied'
        : 'Could not start recording';
      setError(msg);
      cleanup();
    }
  }, [clearRecording, cleanup, stopRecording]);

  const getElapsedSeconds = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    startRecording,
    stopRecording,
    isRecording,
    audioBlob,
    audioUrl,
    error,
    clearRecording,
    getElapsedSeconds,
  };
}
