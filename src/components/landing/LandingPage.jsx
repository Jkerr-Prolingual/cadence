import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const FEATURES = [
  {
    title: 'Read & Listen',
    description: 'Students follow professionally narrated stories with synchronized word highlighting, adjustable speed, and sentence-by-sentence repetition.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Tap to Translate',
    description: 'Tap any word for an instant L1 translation, English definition, and CEFR level. Multi-word expressions like "pick up" are recognized as single units.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: 'Translation Mode',
    description: 'Toggle phrase-level L1 translations over the full text. Students see how English syntax maps to their native language — phrase by phrase, not word by word.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    title: 'Spaced-Repetition Flashcards',
    description: 'Five-box Leitner system with intervals from immediate to two weeks. Cards reappear just as students are about to forget, building long-term retention.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Shadow Reading',
    description: 'Students shadow the narrator sentence by sentence, building phonological fluency. Loop individual sentences until they feel natural, then record and compare.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Multi-L1 Support',
    description: 'Supports Spanish, Mandarin, Japanese, and Korean speakers. Translations, syntax glosses, and vocabulary lookups adapt to each student\'s native language.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    number: '1', title: 'Read a story', description: 'Students choose from graded readers matched to their CEFR level.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    number: '2', title: 'Look up words', description: 'Tap any unknown word for an instant translation in their native language.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: '3', title: 'Shadow & record', description: 'Listen, repeat, and record. AI pronunciation assessment gives phoneme-level feedback.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" />
      </svg>
    ),
  },
  {
    number: '4', title: 'Review & advance', description: 'Flashcards and re-reading consolidate vocabulary. Teachers track it all from their dashboard.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
];

function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name: name.trim(), email: email.trim().toLowerCase(), message: message.trim() });
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setName('');
      setEmail('');
      setMessage('');
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mt-6">
        <p className="text-sm font-medium text-green-800">Message sent! I'll get back to you soon.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 text-left">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Your message..."
        required
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? '...' : 'Send message'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    const { error } = await supabase
      .from('email_subscribers')
      .upsert({ email: email.trim().toLowerCase(), name: name.trim() || null }, { onConflict: 'email' });
    if (error) {
      setStatus('error');
    } else {
      setStatus('success');
      setEmail('');
      setName('');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-900">You're in! We'll let you know when new titles are published.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        required
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 sm:absolute sm:bottom-0 sm:translate-y-full sm:mt-1">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Relato</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
            >
              Log in
            </Link>
            <Link
              to="/login?mode=signup"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-lg transition-colors"
            >
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              Students who read more{' '}
              <span className="text-violet-600">speak better</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
              Relato combines extensive reading with AI pronunciation assessment
              so teachers can see what students are reading, hear how they sound,
              and know exactly where they need help — down to the phoneme.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login?mode=signup"
                className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Start a class
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
              >
                See how it works
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              For ESL/EFL programs. Independent learners welcome too.
            </p>
          </div>

          <div>
            <img
              src="/images/pexels-raul-sotomayor-2154397849-33265595.jpg"
              alt="Student reading a book"
              className="rounded-2xl shadow-2xl object-cover object-bottom w-full max-h-64 sm:max-h-80 lg:max-h-none aspect-[3/2]"
            />
          </div>
        </div>
      </section>

      {/* Pronunciation assessment showcase */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-violet-600 mb-3">New</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Pronunciation data you can actually use
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              When students shadow read, Relato records and assesses their pronunciation
              automatically. Every word gets a color-coded accuracy score. Tap a word to
              see which phonemes are strong and which need work — with IPA symbols,
              mouth position diagrams, and example audio.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Per-word accuracy scoring on every recorded sentence',
                'Phoneme-level IPA breakdown with articulation guides',
                'Visual mouth diagrams showing tongue and lip position',
                'Color-coded overlay: purple (excellent) to red (needs work)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pronunciation mock UI */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Pronunciation Assessment</h4>
                <p className="text-xs text-gray-400 mt-0.5">Shadow read — sentence mode</p>
              </div>
              <div className="px-4 py-4">
                <div className="flex flex-wrap gap-x-1.5 gap-y-2 text-sm leading-relaxed">
                  {[
                    { word: 'She', color: 'border-purple-400', score: 92 },
                    { word: 'walked', color: 'border-purple-400', score: 88 },
                    { word: 'to', color: 'border-purple-400', score: 95 },
                    { word: 'the', color: 'border-green-400', score: 78 },
                    { word: 'library', color: 'border-yellow-400', score: 62 },
                    { word: 'without', color: 'border-purple-400', score: 86 },
                    { word: 'saying', color: 'border-green-400', score: 74 },
                    { word: 'a', color: 'border-purple-400', score: 90 },
                    { word: 'word.', color: 'border-orange-400', score: 45 },
                  ].map((w, i) => (
                    <span key={i} className={`border-b-2 ${w.color} pb-0.5 text-gray-700`}>
                      {w.word}
                    </span>
                  ))}
                </div>

                {/* Phoneme detail mock */}
                <div className="mt-4 bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">"library"</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">62%</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {[
                      { ipa: 'l', score: 88, color: 'text-purple-600 bg-purple-50' },
                      { ipa: 'aɪ', score: 75, color: 'text-green-600 bg-green-50' },
                      { ipa: 'b', score: 82, color: 'text-green-600 bg-green-50' },
                      { ipa: 'ɹ', score: 35, color: 'text-orange-600 bg-orange-50' },
                      { ipa: 'ɛ', score: 48, color: 'text-yellow-600 bg-yellow-50' },
                      { ipa: 'ɹ', score: 38, color: 'text-orange-600 bg-orange-50' },
                      { ipa: 'i', score: 70, color: 'text-green-600 bg-green-50' },
                    ].map((p, i) => (
                      <span key={i} className={`px-2 py-1 rounded font-mono font-medium ${p.color}`}>
                        {p.ipa}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">Tap a phoneme for articulation guide + mouth diagram</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Teacher dashboard showcase */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Teacher dashboard mock UI */}
          <div className="order-2 lg:order-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Class Dashboard</h4>
                <p className="text-xs text-gray-400 mt-0.5">Period 3 — ESL Intermediate</p>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { name: 'Maria G.', chapters: '4/6', accuracy: 73, flags: 2, level: 'A2', color: 'bg-green-400' },
                  { name: 'Wei L.', chapters: '6/6', accuracy: 81, flags: 0, level: 'B1', color: 'bg-purple-400' },
                  { name: 'Soo-Jin K.', chapters: '3/6', accuracy: 58, flags: 5, level: 'A2', color: 'bg-yellow-400' },
                  { name: 'Carlos R.', chapters: '5/6', accuracy: 69, flags: 3, level: 'A2', color: 'bg-green-400' },
                ].map((student) => (
                  <div key={student.name} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{student.name}</span>
                        <span className="text-xs text-gray-400">{student.chapters} chapters</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${student.color} rounded-full`} style={{ width: `${student.accuracy}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {student.flags > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-orange-50 text-orange-600">
                          {student.flags} flags
                        </span>
                      )}
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{student.level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium text-violet-600 mb-3">For educators</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              A teacher dashboard built for ESL
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Relato gives ESL/EFL teachers visibility into what students are reading,
              which words they struggle with, and how their pronunciation is developing
              — without adding grading work.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Create classes with simple join codes',
                'See reading progress and chapter completion per student',
                'Review recordings with AI-flagged pronunciation issues',
                'Identify blind spots — words students don\'t know they\'re mispronouncing',
                'Drill into phoneme-level data for targeted intervention',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg className="w-5 h-5 text-green-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/login?mode=signup"
              className="mt-8 inline-flex items-center text-sm font-medium text-violet-600 hover:text-violet-700"
            >
              Create a teacher account
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">How it works</h3>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              The most effective way to acquire a language is also the simplest: read a lot.
              Relato makes extensive reading measurable.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12 space-y-8">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2 text-center">In English</p>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/f5K0nHmQ2RI"
                  title="How Relato works — in English"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-2 text-center">En español</p>
              <div className="relative w-full rounded-2xl overflow-hidden shadow-lg aspect-video">
                <iframe
                  src="https://www.youtube.com/embed/KFnz_QGjomM"
                  title="How Relato works — in Spanish"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full"
                />
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="relative bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold">
                    {step.number}
                  </div>
                  <div className="text-violet-400">
                    {step.icon}
                  </div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extensive reading pitch */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <div className="bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl p-8 sm:p-10 border border-violet-100">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-3xl font-bold text-violet-700">6,000+</p>
                  <p className="text-sm text-gray-500 mt-1">words per story — full-length, authentic reads</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">&lt; 300</p>
                  <p className="text-sm text-gray-500 mt-1">unique words per book — controlled vocabulary at each CEFR level</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">A1–C1</p>
                  <p className="text-sm text-gray-500 mt-1">levels from beginning to advanced</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">4 L1s</p>
                  <p className="text-sm text-gray-500 mt-1">Spanish, Mandarin, Japanese, and Korean native language support</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Why extensive reading works
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Research consistently shows that extensive reading — reading large amounts
              of comprehensible text — is one of the most powerful methods for second
              language acquisition. Students encounter vocabulary naturally, in context,
              again and again.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Relato's graded readers are built on the EFLLex vocabulary framework with
              CEFR-classified word lists, controlled vocabulary density, and multi-word
              expression tracking. Every book is written to keep students reading — stories
              worth finishing at a level they can handle.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Combined with pronunciation assessment and teacher visibility, Relato closes
              the loop between reading input and spoken output — giving programs data
              they've never had before.
            </p>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">Everything students need to improve</h3>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              From first A1 stories to B2 texts, Relato grows with students.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Independent learners */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-violet-600 mb-3">For independent learners</p>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">
            Learning on your own? Relato works for you too.
          </h3>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto leading-relaxed">
            You don't need a class to use Relato. Read graded stories with audio,
            look up words in your native language, practice pronunciation with instant
            feedback, and build vocabulary with spaced-repetition flashcards — all at
            your own pace.
          </p>
          <Link
            to="/login?mode=signup"
            className="mt-8 inline-flex items-center px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
          >
            Try Relato as a learner
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Print books */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-medium text-amber-800">Also in print</span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">
            Real books, not just a screen
          </h3>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto leading-relaxed">
            All Relato graded readers are available in paperback on Amazon.
            Students read the print book and use Relato on their phone for
            audio, word lookup, and pronunciation practice.
          </p>
          <a
            href="https://www.amazon.com/dp/B0H89TNQ6Z?binding=paperback&ref=dbs_dp_sirpi"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.045 18.02c.07-.116.36-.31.65-.32.39 0 .77.03 1.15.1 1.15.2 2.24.63 3.28 1.18.2.1.39.22.56.35-.02.04-.04.07-.07.1-.27.38-.56.74-.87 1.08-.36.39-.75.75-1.18 1.06-.4.29-.84.53-1.3.7-.46.17-.95.28-1.44.28-.1 0-.2 0-.3-.02.12-.31.28-.6.44-.89.42-.72.87-1.42 1.33-2.1.22-.32.44-.64.67-.95-.28-.03-.57-.07-.85-.12-.14-.02-.27-.05-.4-.08.06-.13.12-.26.2-.37zm23.86 1.96c-.07.12-.36.31-.65.32-.39 0-.77-.03-1.15-.1-1.15-.2-2.24-.63-3.28-1.18-.2-.1-.39-.22-.56-.35.02-.04.04-.07.07-.1.27-.38.56-.74.87-1.08.36-.39.75-.75 1.18-1.06.4-.29.84-.53 1.3-.7.46-.17.95-.28 1.44-.28.1 0 .2 0 .3.02-.12.31-.28.6-.44.89-.42.72-.87 1.42-1.33 2.1-.22.32-.44.64-.67.95.28.03.57.07.85.12.14.02.27.05.4.08-.06.13-.12.26-.2.37zM12 0C5.37 0 0 5.37 0 12c0 2.62.85 5.05 2.28 7.02.05-.04.1-.08.15-.13.44-.4.86-.83 1.25-1.28.48-.55.92-1.14 1.28-1.78.04-.07.08-.14.11-.22-.3-.2-.58-.42-.84-.66C2.83 13.7 2 12.91 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10c0 .91-.83 1.7-2.23 2.95-.26.24-.54.46-.84.66.03.08.07.15.11.22.36.64.8 1.23 1.28 1.78.39.45.81.88 1.25 1.28.05.05.1.09.15.13C23.15 17.05 24 14.62 24 12 24 5.37 18.63 0 12 0z"/>
            </svg>
            View on Amazon
          </a>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 sm:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <svg className="w-6 h-6 text-violet-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Get notified about new titles
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto mb-6">
            Subscribe to hear when we publish new graded readers.
            No spam — just new titles.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl px-6 py-12 sm:px-12 sm:py-16">
          <h3 className="text-3xl font-bold tracking-tight text-white">
            Bring Relato to your program
          </h3>
          <p className="mt-3 text-violet-200 max-w-md mx-auto">
            Set up a class in minutes. Students join with a code, start reading,
            and you see everything from your dashboard.
          </p>
          <Link
            to="/login?mode=signup"
            className="mt-8 inline-flex items-center px-8 py-3 bg-white text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50 transition-colors"
          >
            Get started
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="contact" className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">About the author</h3>
              <div className="space-y-3 text-gray-500 leading-relaxed">
                <p>
                  John started writing graded readers from his own experience as a language
                  learner. While learning Mandarin, he discovered extensive reading — and
                  everything changed. Not drills, not grammar tables, but time spent with
                  stories at the right level. The kind of reading where you stop noticing the
                  effort and start noticing the meaning.
                </p>
                <p>
                  He looked for the same thing for his own English learners. He didn't find
                  enough. So he wrote it himself.
                </p>
                <p className="font-medium text-gray-700">
                  The Relato series is built on rigorous vocabulary research and stories
                  that are actually worth finishing — for students who are ready to move
                  forward by reading.
                </p>
              </div>
              <ContactForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight text-gray-900">Relato</span>
            <span className="text-xs text-gray-400">read, listen, and learn English</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#contact" className="hover:text-gray-600">Contact</a>
            <Link to="/login" className="hover:text-gray-600">Log in</Link>
            <Link to="/login?mode=signup" className="hover:text-gray-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
