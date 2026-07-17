export const L1_LOCALES = {
  es: { code: 'es', label: 'Español', englishLabel: 'Spanish' },
  zh: { code: 'zh', label: '中文', englishLabel: 'Mandarin' },
  ja: { code: 'ja', label: '日本語', englishLabel: 'Japanese' },
  ko: { code: 'ko', label: '한국어', englishLabel: 'Korean' },
};

export const DEFAULT_L1 = 'es';

export function getL1Label(code) {
  return L1_LOCALES[code]?.label || code.toUpperCase();
}

export function getL1EnglishLabel(code) {
  return L1_LOCALES[code]?.englishLabel || code.toUpperCase();
}
