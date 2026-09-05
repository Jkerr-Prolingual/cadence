import { useState, useRef, useCallback, useEffect } from 'react';

// Tunable thresholds — adjust once real device/browser data is available
const CLIP_THRESHOLD = 0.98;
const QUIET_RMS_DBFS = -50;
const NOISE_FLOOR_CEILING_DBFS = -30;
const NO_SIGNAL_DBFS = -60;
const CALIBRATION_DURATION_MS = 3000;
const MONITOR_INTERVAL_MS = 100;

function rmsToDbfs(rms) {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

function analyseBuffer(analyser) {
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);
  let sumSq = 0;
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    sumSq += buf[i] * buf[i];
    const v = Math.abs(buf[i]);
    if (v > peak) peak = v;
  }
  return { rms: Math.sqrt(sumSq / buf.length), peak };
}

export const PRE_FLIGHT_MESSAGES = {
  'clipping':   'Your audio is peaking — move back slightly or lower your mic volume.',
  'too-quiet':  'We can barely hear you — move closer or check your mic isn\'t muted.',
  'noisy':      'There\'s a lot of background noise — try a quieter spot if you can.',
  'no-signal':  'No audio detected — check that your microphone is connected.',
};

export default function useAudioPreFlight() {
  const [status, setStatus] = useState('idle');
  const [condition, setCondition] = useState(null);
  const [level, setLevel] = useState(0);

  const monitorCtxRef = useRef(null);
  const monitorSourceRef = useRef(null);
  const monitorAnalyserRef = useRef(null);
  const monitorTimerRef = useRef(null);
  const noiseFloorRef = useRef(null);
  const calibrationCleanupRef = useRef(null);

  const detectCondition = useCallback((rms, peak) => {
    const dbfs = rmsToDbfs(rms);
    if (dbfs < NO_SIGNAL_DBFS) return 'no-signal';
    if (peak >= CLIP_THRESHOLD) return 'clipping';
    if (dbfs < QUIET_RMS_DBFS) return 'too-quiet';
    if (noiseFloorRef.current != null && rmsToDbfs(noiseFloorRef.current) > NOISE_FLOOR_CEILING_DBFS) return 'noisy';
    return null;
  }, []);

  const calibrate = useCallback(async () => {
    setStatus('calibrating');
    setCondition(null);
    setLevel(0);

    let stream, ctx, source, analyser;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
    } catch {
      setCondition('no-signal');
      setStatus('ready');
      return;
    }

    const samples = [];
    let cancelled = false;

    const cleanup = () => {
      cancelled = true;
      stream.getTracks().forEach(t => t.stop());
      source.disconnect();
      ctx.close().catch(() => {});
    };
    calibrationCleanupRef.current = cleanup;

    const interval = setInterval(() => {
      if (cancelled) return;
      const { rms } = analyseBuffer(analyser);
      samples.push(rms);
      setLevel(Math.min(1, rms * 8));
    }, MONITOR_INTERVAL_MS);

    await new Promise((resolve) => {
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, CALIBRATION_DURATION_MS);
    });

    cleanup();
    calibrationCleanupRef.current = null;

    if (cancelled && samples.length === 0) return;

    const avgRms = samples.length > 0
      ? samples.reduce((a, b) => a + b, 0) / samples.length
      : 0;
    noiseFloorRef.current = avgRms;

    const dbfs = rmsToDbfs(avgRms);
    if (dbfs < NO_SIGNAL_DBFS) {
      setCondition('no-signal');
    } else if (dbfs > NOISE_FLOOR_CEILING_DBFS) {
      setCondition('noisy');
    } else {
      setCondition(null);
    }
    setLevel(0);
    setStatus('ready');
  }, []);

  const attachStream = useCallback((stream) => {
    if (!stream) return;
    if (monitorSourceRef.current) {
      monitorSourceRef.current.disconnect();
    }
    if (monitorCtxRef.current) {
      monitorCtxRef.current.close().catch(() => {});
    }

    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    monitorCtxRef.current = ctx;
    monitorSourceRef.current = source;
    monitorAnalyserRef.current = analyser;
  }, []);

  const monitorLoop = useCallback(() => {
    const analyser = monitorAnalyserRef.current;
    if (!analyser) return;
    const { rms, peak } = analyseBuffer(analyser);
    setLevel(Math.min(1, rms * 8));
    setCondition(detectCondition(rms, peak));
    monitorTimerRef.current = setTimeout(monitorLoop, MONITOR_INTERVAL_MS);
  }, [detectCondition]);

  const startMonitoring = useCallback(() => {
    setStatus('monitoring');
    monitorLoop();
  }, [monitorLoop]);

  const stopMonitoring = useCallback(() => {
    if (monitorTimerRef.current) {
      clearTimeout(monitorTimerRef.current);
      monitorTimerRef.current = null;
    }
    setCondition(null);
    setLevel(0);
    setStatus('ready');
  }, []);

  const detach = useCallback(() => {
    stopMonitoring();
    if (monitorSourceRef.current) {
      monitorSourceRef.current.disconnect();
      monitorSourceRef.current = null;
    }
    monitorAnalyserRef.current = null;
    if (monitorCtxRef.current) {
      monitorCtxRef.current.close().catch(() => {});
      monitorCtxRef.current = null;
    }
  }, [stopMonitoring]);

  const reset = useCallback(() => {
    detach();
    if (calibrationCleanupRef.current) {
      calibrationCleanupRef.current();
      calibrationCleanupRef.current = null;
    }
    noiseFloorRef.current = null;
    setStatus('idle');
    setCondition(null);
    setLevel(0);
  }, [detach]);

  useEffect(() => {
    return () => {
      if (monitorTimerRef.current) clearTimeout(monitorTimerRef.current);
      if (monitorSourceRef.current) monitorSourceRef.current.disconnect();
      if (monitorCtxRef.current) monitorCtxRef.current.close().catch(() => {});
      if (calibrationCleanupRef.current) calibrationCleanupRef.current();
    };
  }, []);

  return {
    status,
    condition,
    level,
    calibrate,
    attachStream,
    startMonitoring,
    stopMonitoring,
    detach,
    reset,
  };
}
