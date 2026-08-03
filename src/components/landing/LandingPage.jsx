import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import ContactForm from './ContactForm';
import RelatoLogo from '../shared/RelatoLogo';

const FEATURES = [
  {
    title: 'Read & Listen',
    description: 'Students follow along with high-quality narration, synchronized word highlighting, adjustable speed, and sentence-by-sentence repetition.',
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
    title: 'Syntax Glosses',
    description: 'Full-text phrase-level translations show how English syntax maps to the student\'s native language — from single words to full sentences.',
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
    title: 'Shadow Reading & Pronunciation',
    description: 'Students shadow the narrator sentence by sentence, then record and get per-phoneme IPA feedback with mouth diagrams showing exactly how to shape each sound.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Teacher Dashboard',
    description: 'Teachers create classes, track reading progress, and review student recordings with AI-generated pronunciation flags highlighting where to focus.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
    number: '3', title: 'Shadow & record', description: 'Listen, repeat, and record. Practice pronunciation with immediate playback and AI feedback.',
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
          <div className="flex items-center gap-2">
            <RelatoLogo size={26} />
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">Relato</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/approach"
              className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5"
            >
              Our Approach
            </Link>
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
              Students who read extensively{' '}
              <span className="text-violet-600">acquire English faster</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
              Relato is an extensive reading platform built for ESL and EFL programs.
              Graded readers with audio, native-language support, phrase-level L1 translations,
              shadow reading, and AI pronunciation assessment — with a teacher
              dashboard that makes it all visible.
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
            <p className="mt-2 text-xs text-gray-400">
              Supports Spanish, Mandarin, Japanese, and Korean speakers.
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

      {/* Nation quote */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl sm:text-2xl font-medium text-gray-800 italic leading-relaxed">
            "Adding an extensive reading program to a language course is the most important improvement a teacher can make."
          </blockquote>
          <p className="mt-3 text-sm text-gray-500">
            — Paul Nation, <em>What Every EFL Teacher Should Know</em>
          </p>
          <p className="mt-4 text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Nation's research shows that reading-centered activities — comprehension, vocabulary practice, fluency building — should occupy roughly half of a balanced language program. Relato makes that practical.
          </p>
        </div>
      </section>

      {/* Reading experience showcase */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-violet-600 mb-3">The reading experience</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Read with the support that makes input comprehensible
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Students read graded stories while listening to high-quality narration.
              Every word is clickable for instant L1 translation and CEFR level.
              Toggle phrase-level translations to see how English phrases map to structures
              in their native language — from single words to full sentences.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Tap any word for L1 translation, English definition, and CEFR level',
                'Phrasal verbs and multi-word expressions translate as a whole phrase — then drill into each word',
                'Phrase-level translations compare English structure to L1 — from single words to full sentences',
                'Drill into gloss constituents to see how each piece translates in context',
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

          {/* Syntax gloss mock UI */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Reading View</h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">Translation mode ON</span>
              </div>
              <div className="px-4 py-4 space-y-4">
                {/* Sentence with syntax gloss */}
                <div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <span className="border-b border-violet-200 pb-0.5">She walked to</span>{' '}
                    <span className="border-b-2 border-violet-400 pb-0.5 font-medium">the library without saying a word.</span>
                  </div>
                  <div className="mt-1.5 text-xs text-violet-600 leading-relaxed">
                    <span className="opacity-60">Ella caminó a</span>{' '}
                    <span className="font-medium">la biblioteca sin decir una palabra.</span>
                  </div>
                  <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-violet-50 text-violet-500">prepositional phrase — complex</span>
                </div>

                {/* Expanded constituent drill-down */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">Constituent breakdown</p>
                  <div className="space-y-1.5">
                    {[
                      { en: 'the library', l1: 'la biblioteca' },
                      { en: 'without saying', l1: 'sin decir' },
                      { en: 'a word', l1: 'una palabra' },
                    ].map((c, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="text-gray-700 font-medium min-w-[120px]">{c.en}</span>
                        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                        <span className="text-violet-600">{c.l1}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Second sentence — simple */}
                <div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <span className="border-b border-gray-200 pb-0.5">Leo was already there.</span>
                  </div>
                  <div className="mt-1.5 text-xs text-violet-600 opacity-60 leading-relaxed">
                    Leo ya estaba ahí.
                  </div>
                  <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-400">simple clause</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shadow reading showcase */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Shadow reading mock UI */}
          <div className="order-2 lg:order-1 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Shadow Reading</h4>
                <p className="text-xs text-gray-400 mt-0.5">Sentence loop — listen, then repeat</p>
              </div>
              <div className="px-4 py-4">
                {/* Highlighted sentence */}
                <div className="text-sm text-gray-700 leading-relaxed bg-violet-50 rounded-lg px-3 py-2.5 border border-violet-100">
                  <span className="text-violet-700 font-medium">She walked to the library without saying a word.</span>
                </div>

                {/* Transport controls mock */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>
                  <button className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </button>
                  <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </button>
                </div>

                {/* Speed + record controls */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">0.75x</span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-red-500 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-white" />
                    </div>
                    <span className="text-[10px] text-gray-400">Record yourself</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-medium text-violet-600 mb-3">From input to output</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Shadow reading builds spoken fluency
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              After reading a chapter, students loop individual sentences and shadow
              the narrator — listening, then repeating. Speed control lets them slow
              down difficult passages. They record themselves and listen back
              immediately, building awareness of their own pronunciation.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              This is the bridge between comprehensible input and spoken production.
              Students practice in the context of stories they've already understood,
              not isolated drill sentences.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'Sentence-by-sentence loop with adjustable speed (0.5x–1.25x)',
                'Record and immediately play back for self-assessment',
                'Vocabulary popups remain available during shadow practice',
                'AI pronunciation scoring with phoneme-level IPA feedback',
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
        </div>
      </section>

      {/* Teacher dashboard showcase */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-violet-600 mb-3">For educators</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              See what your students are reading — and how they sound
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Relato gives ESL/EFL teachers visibility into reading progress,
              vocabulary growth, and pronunciation development. When students record themselves, AI flags words that
              need attention and scores pronunciation down to the phoneme.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Create classes with simple join codes',
                'See reading progress and chapter completion per student',
                'Review recordings with AI-flagged pronunciation issues',
                'Identify blind spots — words students don\'t know they\'re mispronouncing',
                'Phoneme-level IPA data for targeted intervention',
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

          {/* Teacher dashboard screenshot */}
          <div>
            <img
              src="/images/teacher-dashboard.png"
              alt="Teacher dashboard showing student pronunciation assessment with accuracy, fluency, and prosody scores"
              className="rounded-2xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">How it works</h3>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              The most effective way to acquire a language is also the simplest: read a lot.
              Relato makes extensive reading measurable.
            </p>
          </div>

          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-lg aspect-video">
              <iframe
                src="https://www.youtube.com/embed/DMb_USZ9ayQ"
                title="How Relato works"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
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
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-3xl font-bold tracking-tight text-gray-900 text-center">
            The bridge to extensive reading
          </h3>
          <p className="mt-6 text-gray-500 leading-relaxed">
            Research consistently shows that extensive reading is one of the most powerful
            methods for second language acquisition — especially for students who already
            have literacy in their first language. But extensive reading only works when the text is actually
            comprehensible. For English learners stuck at A1–A2,
            the gap between "I can read in my language" and "I can read enough English to
            start acquiring through reading" is where most programs stall.
          </p>
          <p className="mt-3 text-gray-500 leading-relaxed">
            Relato is built to bridge that gap. Phrase-level translations let students leverage their
            L1 reading skills to parse English structure. Tap-to-translate keeps vocabulary
            from blocking comprehension. Controlled vocabulary and CEFR-graded texts keep
            cognitive load manageable. The scaffolding makes A1-level English texts
            comprehensible enough to read extensively — and as proficiency grows, students
            rely on it less.
          </p>
          <p className="mt-3 text-gray-500 leading-relaxed">
            Once students cross that bridge, extensive reading does what decades of research
            says it does — building vocabulary, internalizing grammar, developing listening
            comprehension, and strengthening spoken fluency. Relato supports acquisition
            across all four language domains, starting from the very first story.
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
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
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-medium text-violet-600 mb-3">For independent learners</p>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">
            Learning on your own? Relato works for you too.
          </h3>
          <p className="mt-4 text-gray-500 max-w-2xl mx-auto leading-relaxed">
            You don't need a class to use Relato. Read graded stories with audio,
            look up words in your native language, compare English syntax to your
            own, practice pronunciation with instant feedback, and build vocabulary
            with spaced-repetition flashcards — all at your own pace.
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
      <section className="py-16 sm:py-24 px-4 sm:px-6">
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
      <section className="py-16 sm:py-20 bg-gray-50 px-4 sm:px-6">
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

      {/* Contact */}
      <section id="contact" className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-2">
            Get in touch
          </h3>
          <p className="text-gray-500">
            Questions about Relato, partnership inquiries, or feedback? I'd love to hear from you.
          </p>
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RelatoLogo size={22} />
            <span className="text-lg font-semibold tracking-tight text-gray-900">Relato</span>
            <span className="text-xs text-gray-400">read, listen, and learn English</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link to="/approach" className="hover:text-gray-600">Our Approach</Link>
            <a href="#contact" className="hover:text-gray-600">Contact</a>
            <Link to="/login" className="hover:text-gray-600">Log in</Link>
            <Link to="/login?mode=signup" className="hover:text-gray-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
