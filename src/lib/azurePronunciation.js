let sdk = null;

async function getSDK() {
  if (!sdk) {
    sdk = await import('microsoft-cognitiveservices-speech-sdk');
  }
  return sdk;
}

export async function fetchSpeechToken() {
  const res = await fetch('/.netlify/functions/speech-token');
  const data = await res.json();
  if (data.error) throw new Error(`Speech token error: ${data.error}`);
  return data;
}

export async function assessFullRecording({ token, region, referenceText, audioBlob, onProgress }) {
  const SpeechSDK = await getSDK();

  const wavBlob = await audioToWav(audioBlob);
  const wavArrayBuffer = await wavBlob.arrayBuffer();

  const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
  speechConfig.speechRecognitionLanguage = 'en-US';
  speechConfig.outputFormat = SpeechSDK.OutputFormat.Detailed;

  const cleanRef = referenceText.replace(/[\r\n]+/g, ' ').trim();
  const paConfig = new SpeechSDK.PronunciationAssessmentConfig(
    cleanRef,
    SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
    SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
    true
  );
  paConfig.phonemeAlphabet = 'IPA';
  paConfig.enableMiscue = true;

  const pushStream = SpeechSDK.AudioInputStream.createPushStream(
    SpeechSDK.AudioStreamFormat.getWaveFormatPCM(16000, 16, 1)
  );

  const audioConfig = SpeechSDK.AudioConfig.fromStreamInput(pushStream);

  const allWords = [];
  const fluencyScores = [];
  const prosodyScores = [];
  const completenessScores = [];
  const totalBytes = wavArrayBuffer.byteLength;

  return new Promise((resolve, reject) => {
    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    paConfig.applyTo(recognizer);

    recognizer.recognized = (_, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        try {
          const detailJson = e.result.properties.getProperty(
            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
          );

          if (detailJson) {
            const detail = JSON.parse(detailJson);
            const nBest = detail.NBest?.[0];
            if (nBest?.Words) {
              for (const w of nBest.Words) {
                allWords.push({
                  word: w.Word,
                  accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? null,
                  errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                  phonemes: (w.Phonemes || []).map(p => ({
                    phoneme: p.Phoneme,
                    accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? null,
                  })),
                });
              }
            }
            const pa = nBest?.PronunciationAssessment || {};
            if (pa.FluencyScore != null) fluencyScores.push(pa.FluencyScore);
            if (pa.ProsodyScore != null) prosodyScores.push(pa.ProsodyScore);
            if (pa.CompletenessScore != null) completenessScores.push(pa.CompletenessScore);
          }
        } catch (err) {
          console.warn('[azurePronunciation] Error parsing recognized result:', err);
        }
      }
    };

    recognizer.canceled = (_, e) => {
      if (e.reason === SpeechSDK.CancellationReason.Error) {
        recognizer.close();
        reject(new Error(`Azure Speech error: ${e.errorDetails}`));
      } else {
        recognizer.stopContinuousRecognitionAsync(
          () => recognizer.close(),
          () => recognizer.close()
        );
      }
    };

    let resolved = false;
    const finalize = () => {
      if (resolved) return;
      resolved = true;
      recognizer.close();
      const avg = arr => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;
      resolve({
        words: allWords,
        fluencyScore: avg(fluencyScores),
        prosodyScore: avg(prosodyScores),
        completenessScore: avg(completenessScores),
      });
    };

    recognizer.sessionStopped = finalize;

    recognizer.startContinuousRecognitionAsync(
      () => {
        streamAudioToSDK(wavArrayBuffer, pushStream, totalBytes, onProgress, () => {
          setTimeout(() => {
            recognizer.stopContinuousRecognitionAsync(() => {}, () => {});
          }, 5000);

          setTimeout(() => { finalize(); }, 30000);
        });
      },
      (err) => {
        recognizer.close();
        reject(new Error(`Failed to start recognition: ${err}`));
      }
    );
  });
}

function streamAudioToSDK(wavArrayBuffer, pushStream, totalBytes, onProgress, onDone) {
  const HEADER_SIZE = 44;
  const CHUNK_SIZE = 32000;
  let offset = HEADER_SIZE;
  let bytesSent = 0;
  const dataBytes = totalBytes - HEADER_SIZE;

  function sendNextChunk() {
    if (offset >= totalBytes) {
      pushStream.close();
      if (onProgress) onProgress(1);
      if (onDone) onDone();
      return;
    }

    const end = Math.min(offset + CHUNK_SIZE, totalBytes);
    const chunk = new Uint8Array(wavArrayBuffer, offset, end - offset);
    pushStream.write(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
    bytesSent += chunk.byteLength;
    offset = end;

    if (onProgress && dataBytes > 0) {
      onProgress(Math.min(bytesSent / dataBytes, 0.95));
    }

    setTimeout(sendNextChunk, 20);
  }

  sendNextChunk();
}

async function audioToWav(audioBlob) {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const decoded = await audioCtx.decodeAudioData(arrayBuffer);
  await audioCtx.close();

  const sampleRate = 16000;
  const offlineCtx = new OfflineAudioContext(1, decoded.duration * sampleRate, sampleRate);
  const source = offlineCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(offlineCtx.destination);
  source.start();
  const rendered = await offlineCtx.startRendering();

  const pcm = rendered.getChannelData(0);
  const numSamples = pcm.length;
  const dataBytes = numSamples * 2;
  const buffer = new ArrayBuffer(44 + dataBytes);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(44 + i * 2, clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function writeString(view, offset, str) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
