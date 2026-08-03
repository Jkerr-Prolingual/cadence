import { Link } from 'react-router-dom';
import ContactForm from './ContactForm';
import RelatoLogo from '../shared/RelatoLogo';

export default function ApproachPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/landing" className="flex items-center gap-2">
              <RelatoLogo size={26} />
              <span className="text-xl font-semibold tracking-tight text-gray-900 hover:text-gray-700">Relato</span>
            </Link>
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
      <section className="pt-28 pb-12 sm:pt-36 sm:pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
            Our Approach
          </h2>
          <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
            I built Relato because I couldn't find what I needed for my own
            students. The research was clear. The tools weren't there.
          </p>
        </div>
      </section>

      {/* Why I Built This */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-6 mb-6">
            <img
              src="/images/john-kerr.png"
              alt="John Kerr"
              className="w-20 h-20 rounded-full object-cover object-top shrink-0 hidden sm:block"
            />
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                Why I Built This
              </h3>
              <p className="text-sm text-gray-400 mt-1">John Kerr — teacher, graded-reader author, and developer</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              In my early forties, I began learning Mandarin seriously. I'd
              already learned Spanish to a high level, so I knew adult language
              acquisition was possible — what I wanted to understand was the
              process itself: how a learner moves past the intermediate plateau
              toward real working proficiency.
            </p>
            <p>
              Over six years of study, extensive reading became the most
              productive use of my time — more than drills, grammar tables, or
              apps promising fluency in three months. Reading. The kind of
              reading where you stop noticing the effort and start noticing the
              meaning.
            </p>
            <p>
              I looked for the same thing for my own students — English learners
              who could already read in their first language but were stuck at
              the beginning levels. I couldn't find it. What existed was either
              poorly graded, written for young children, or beyond my students'
              reach. So I wrote my own graded readers and built Relato to deliver
              them.
            </p>
          </div>
        </div>
      </section>

      {/* Reading to Acquire Language */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            Reading to Acquire Language
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Acquiring a language requires an enormous volume of meaningful
              exposure — far more than drills, vocabulary lists, or test prep
              can provide on their own. Extensive reading is the most efficient
              way to supply that volume: sustained, fluent, enjoyable reading at
              a level where students understand enough to keep going, picking up
              new vocabulary and structure naturally along the way.
            </p>
            <p>
              This is different from <em>learning to read</em>, which requires
              explicit phonics instruction for pre-literate learners. Relato is
              built for students who can already read in their
              first language and need comprehensible English text to read
              extensively. That describes many adolescent and adult English
              learners. (Learners with emerging L1 literacy may also benefit
              from accessible English reading, but they generally need
              additional literacy support that Relato isn't designed to replace.)
            </p>

            <div className="bg-white rounded-xl p-6 border border-gray-200 my-8">
              <h4 className="font-semibold text-gray-900 mb-2">Why 98% coverage matters</h4>
              <p className="text-gray-500 leading-relaxed">
                Research generally places the lexical coverage needed for
                successful independent reading between 95% and 98%. For
                comfortable, fluent reading, 98% is a useful target — roughly
                one unfamiliar word in every fifty. As coverage falls below that
                range, comprehension becomes less reliable and reading grows
                laborious rather than acquisitive. For beginning English
                learners, almost no authentic text clears that bar — which is
                why graded readers exist.
              </p>
            </div>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Graded readers, not children's readers
            </h4>
            <p>
              Graded readers are distinct from the leveled readers used in early
              first-language literacy instruction. Leveled readers build
              foundational decoding skills in young children. Graded readers are
              for learners who can already read: controlled vocabulary, frequent
              recycling of words and structures, and stories written for the
              interests of adolescents and adults — not young children. As
              proficiency grows, learners move to more complex graded texts and
              eventually to authentic ones.
            </p>
            <p>
              In my own classroom, the pattern has been consistent: students who
              plateau are almost always the ones who don't read for pleasure. No
              sequence of isolated taps and drills substitutes for sustained
              contact with meaningful language — to move past the beginning
              levels, learners need to read and listen at volume.
            </p>
          </div>
        </div>
      </section>

      {/* The Research */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            The Research
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Extensive reading has a substantial international research base,
              led by researchers like Paul Nation and Stephen Krashen. It remains
              less visible in many US K–12 conversations about literacy and
              English-language development, which have often focused,
              appropriately, on foundational reading skills and close textual
              analysis. What gets less attention is the sustained volume of
              comprehensible reading that language growth also requires — and
              debates over reading instruction have sometimes obscured the fact
              that explicit foundational instruction and sustained meaningful
              reading serve different, complementary purposes.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 my-8">
              <h4 className="font-semibold text-gray-900 mb-3">
                A Balanced Language Program
              </h4>
              <p className="text-gray-500 leading-relaxed mb-4">
                Nation's framework for a balanced language program (Nation, 2007)
                identifies four strands of activity — not to be confused with the
                four language domains of reading, writing, speaking, and
                listening — each meant to receive roughly equal time:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    name: 'Meaning-focused input',
                    desc: 'Understanding messages through listening and reading',
                  },
                  {
                    name: 'Meaning-focused output',
                    desc: 'Producing messages through speaking and writing',
                  },
                  {
                    name: 'Language-focused learning',
                    desc: 'Deliberate study of vocabulary, grammar, pronunciation',
                  },
                  {
                    name: 'Fluency development',
                    desc: 'Getting faster and more automatic with language already known',
                  },
                ].map((strand) => (
                  <div key={strand.name} className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{strand.name}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{strand.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 leading-relaxed mt-4">
                Reading can contribute to several of these strands, depending on
                how it's used. Reading for meaning belongs to meaning-focused
                input; deliberate vocabulary or pronunciation work built from a
                text supports language-focused learning; and re-reading familiar
                material builds fluency. That versatility is what makes reading such a central component of
                a balanced program.
              </p>
            </div>

            <p>
              Krashen's comprehensible input hypothesis adds the key constraint:
              mere exposure isn't enough. Input has to be comprehensible enough
              for learners to follow the message and notice recurring language,
              or little gets acquired.
            </p>
          </div>
        </div>
      </section>

      {/* What Relato Supports */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            What Relato Supports
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Relato is built around three of Nation's four strands.
            </p>
          </div>

          <div className="mt-8 space-y-4">
            {[
              {
                strand: 'Meaning-focused input',
                color: 'bg-violet-100 text-violet-700',
                features: [
                  {
                    name: 'Graded readers with audio',
                    desc: 'Vocabulary-controlled texts with simultaneous listening support',
                  },
                  {
                    name: 'Tap-to-translate',
                    desc: 'Instant L1 definitions that keep students in the flow of the text',
                  },
                  {
                    name: 'Phrase and sentence translations',
                    desc: 'L1 translations that help students see how English structures map onto their home language',
                  },
                ],
              },
              {
                strand: 'Language-focused learning',
                color: 'bg-amber-100 text-amber-700',
                features: [
                  {
                    name: 'Pronunciation assessment',
                    desc: 'AI-scored per-phoneme feedback with IPA and mouth diagrams',
                  },
                  {
                    name: 'Spaced-repetition flashcards',
                    desc: 'A five-box Leitner system, populated from each student\'s reading',
                  },
                  {
                    name: 'Vocabulary checks',
                    desc: 'Brief meaning, cloze, and context items that help students retrieve vocabulary from the chapter and help teachers spot words that need more support',
                  },
                ],
              },
              {
                strand: 'Fluency development',
                color: 'bg-blue-100 text-blue-700',
                features: [
                  {
                    name: 'Shadow reading',
                    desc: 'Sentence-by-sentence shadowing of the narrator',
                  },
                  {
                    name: 'Re-reading and timed reading',
                    desc: 'Repeated exposure with words-per-minute tracking',
                  },
                  {
                    name: 'Speed-controlled audio',
                    desc: 'Adjustable playback from 0.5x–1.25x',
                  },
                ],
              },
            ].map((section) => (
              <div key={section.strand} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${section.color}`}>
                    {section.strand}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {section.features.map((f) => (
                    <div key={f.name} className="px-5 py-4">
                      <p className="text-sm font-semibold text-gray-900 mb-1">{f.name}</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-gray-500 leading-relaxed">
            The fourth strand, meaning-focused output, is best developed through
            classroom interaction, conversation, and writing for a real
            audience — not an app. A teacher dashboard ties the other three
            together: reading progress, pronunciation flags, exercise results,
            and fluency metrics in one place.
          </p>
        </div>
      </section>

      {/* How Our Readers Are Built */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            How Our Readers Are Built
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Vocabulary control isn't an afterthought in a Relato reader — it's
              a first-class engineering concern. AI assists at every step —
              drafting, vocabulary analysis, grammar checking, level
              calibration — but a human author reviews and revises every
              sentence against the constraint spec for narrative quality,
              natural language, and cultural fit.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Vocabulary classification
            </h4>
            <p>
              Every word is leveled against the CEFR scale using EFLLex (Dürlich
              & François, 2018), a lexical resource built from real EFL textbook
              corpora — over 15,000 entries, each assigned a level based on where
              it first appears with meaningful frequency.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Lexical units
            </h4>
            <p>
              Rather than counting headwords in isolation, Relato tracks{' '}
              <em>lexical units</em> (an internal system we call particles): the
              words and multi-word expressions — like "of course" or "pick
              up" — that a learner is likely to process as a single cognitive
              unit rather than as separate words. Units are further classified as
              compositional or non-compositional, which determines how they're
              budgeted and how the reader presents them. This follows research on
              formulaic language (Wray, 2002) and multi-word expressions
              (Martinez & Schmitt, 2012).
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Tiered vocabulary with recurrence targets
            </h4>
            <p>
              Repeated encounters improve the odds of incidental vocabulary
              learning, though no fixed number guarantees acquisition on its
              own — later encounters reinforce and deepen what earlier ones
              establish (Nation, 2001). Relato uses the following minimum design
              targets for each vocabulary tier:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              {[
                { tier: 'Baseline', desc: 'High-frequency vocabulary at or below A2; excluded from the book\'s vocabulary budget. Unrestricted encounters.' },
                { tier: 'Core', desc: 'Central to the story. Minimum 6 encounters per series.' },
                { tier: 'Thematic', desc: 'Important to the setting or topic. Minimum 4 encounters per series.' },
                { tier: 'Peripheral', desc: 'Present but skippable without losing the thread. Minimum 2 encounters per series.' },
              ].map((t) => (
                <div key={t.tier} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{t.tier}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Constraint specifications
            </h4>
            <p>
              Every book is authored against a written spec: target CEFR level,
              permitted and avoided grammar constructs, tense restrictions,
              sentence-length limits, chapter targets, and vocabulary budgets by
              tier. <strong>Every Relato reader has a paper trail.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* References */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            References
          </h3>
          <ul className="space-y-3 text-sm text-gray-500 leading-relaxed">
            <li>
              Dürlich, L. & François, T. (2018). EFLLex: A graded lexical resource for learners of English as a foreign language. <em>LREC 2018</em>.
            </li>
            <li>
              Hu, M. & Nation, I.S.P. (2000). Unknown vocabulary density and reading comprehension. <em>Reading in a Foreign Language</em>, 13(1), 403–430.
            </li>
            <li>
              Krashen, S. (2004). <em>The Power of Reading: Insights from the Research</em> (2nd ed.). Libraries Unlimited.
            </li>
            <li>
              Martinez, R. & Schmitt, N. (2012). A phrasal expressions list. <em>Applied Linguistics</em>, 33(3), 299–320.
            </li>
            <li>
              Nation, I.S.P. (2001). <em>Learning Vocabulary in Another Language</em>. Cambridge University Press.
            </li>
            <li>
              Nation, I.S.P. (2007). The four strands. <em>Innovation in Language Learning and Teaching</em>, 1(1), 2–13.
            </li>
            <li>
              Nation, I.S.P. & Macalister, J. (2010). <em>Language Curriculum Design</em>. Routledge.
            </li>
            <li>
              Wray, A. (2002). <em>Formulaic Language and the Lexicon</em>. Cambridge University Press.
            </li>
          </ul>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
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

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Bring extensive reading to your program
          </h3>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Set up a class in minutes. Students join with a code and start reading.
          </p>
          <Link
            to="/login?mode=signup"
            className="mt-6 inline-flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Get started
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
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
            <Link to="/landing" className="hover:text-gray-600">Home</Link>
            <Link to="/login" className="hover:text-gray-600">Log in</Link>
            <Link to="/login?mode=signup" className="hover:text-gray-600">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
