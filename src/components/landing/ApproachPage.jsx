import { Link } from 'react-router-dom';
import ContactForm from './ContactForm';

export default function ApproachPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/landing" className="text-xl font-semibold tracking-tight text-gray-900 hover:text-gray-700">
              Relato
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
              <p className="text-sm text-gray-400 mt-1">John Kerr — teacher, author, developer</p>
            </div>
          </div>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              After turning 40, I committed to learning Mandarin Chinese. I was
              already bilingual with near-native Spanish, so I knew language
              acquisition was possible. What I wanted to understand was the
              process itself — specifically, how to break through the intermediate
              level to reach a professional working proficiency.
            </p>
            <p>
              Six years of learning taught me that extensive reading is the most
              powerful approach and the most effective use of my time. Not drills,
              not grammar tables, not apps that promise fluency in three months.
              Reading. The kind of reading where you stop noticing the effort and
              start noticing the meaning.
            </p>
            <p>
              I looked for the same thing for my own English learners — adolescents
              and young adults who could already read in their first language but
              were stuck at the beginning levels of English. I didn't find enough.
              The materials that existed were either poorly graded, written for
              young children, or beyond my students' level. So I wrote my own
              graded readers and built Relato to deliver them.
            </p>
          </div>
        </div>
      </section>

      {/* Reading to Acquire */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            Reading to Acquire
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              Acquiring a language requires thousands of hours of exposure to tens
              of thousands of words in meaningful context. Drills, grammar tables,
              vocabulary lists, and test prep all have their place, but the volume
              of language a student needs to acquire is far too vast to accomplish
              with these tools alone. Extensive reading is the most powerful tool
              available — the difference between moving earth with a shovel and
              moving it with a bulldozer.
            </p>
            <p>
              Extensive reading is sustained, fluent, enjoyable reading for the
              purpose of building language. It is not close reading, not annotation
              exercises, and not reading-then-answering-comprehension-questions. It
              is reading at a level where the student understands enough to keep
              going, encountering new vocabulary and structures naturally along the
              way. The brain prioritizes patterns it sees frequently, and the more a
              student reads, the more reading itself becomes a natural spaced
              repetition system.
            </p>
            <p>
              There is a critical distinction between <em>learning to read</em> and{' '}
              <em>reading to acquire</em>. Learning to read is a foundational skill
              that requires explicit instruction in decoding and phonics. Reading to
              acquire is what happens after a learner already has literacy in their
              first language. For these learners, reading is the most effective
              vehicle for vocabulary acquisition, grammar internalization, and
              overall language development. Relato is built for the second group:
              students who can already read in their L1 and need comprehensible
              English text to read extensively.
            </p>

            <div className="bg-white rounded-xl p-6 border border-gray-200 my-8">
              <h4 className="font-semibold text-gray-900 mb-2">The 98% threshold</h4>
              <p className="text-gray-500 leading-relaxed">
                Research indicates that readers need to know approximately 98% of
                the words in a text to read fluently and acquire new vocabulary
                from context. That means only 1 word in 50 should be unknown.
                Below this threshold, comprehension breaks down and reading becomes
                laborious rather than acquisitive. For beginning English learners,
                almost no authentic text meets this bar. This is why graded readers
                exist.
              </p>
            </div>

            <p>
              Graded readers are distinct from the leveled readers used in early
              reading instruction. Leveled readers help young children build
              foundational literacy skills in their first language. Graded readers
              are designed for language learners who can already read: they use a
              controlled vocabulary with frequent recycling of words and structures,
              careful introduction of new language, and stories written for
              adolescents and adults rather than young children. As proficiency
              grows, learners transition to more complex graded texts, and
              eventually to authentic texts not specifically tailored for language
              learners.
            </p>
            <p>
              As a teacher, I have consistently observed that students who show
              limited progress in language development share a common trait: they
              rarely engage in reading for pleasure. I have observed the same
              pattern in adults who want to improve their proficiency in a new or
              heritage language but have become stuck at the low-intermediate level.
              You will not click your way to fluency using an app. The most
              effective way to level up is through extensive reading.
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
              Extensive reading is backed by decades of research, most of it from
              the English as a Foreign Language (EFL) community. Paul Nation and
              Stephen Krashen are among the most prominent researchers to champion
              this approach. US educators are largely unaware of this body of work
              because foreign language programs are a lower priority domestically
              than in the rest of the world, and because the longstanding "Reading
              Wars" have created a false dichotomy between systematic phonics
              instruction and authentic reading experiences. The Common Core
              movement's emphasis on close reading and text-dependent questioning
              has further crowded out the kind of sustained, enjoyable reading
              that builds language. For English learners in particular, the most
              powerful practice available to them is often the one with the least
              time allocated in the school day.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 my-8">
              <h4 className="font-semibold text-gray-900 mb-3">
                Nation's Four Strands
              </h4>
              <p className="text-gray-500 leading-relaxed mb-4">
                Paul Nation's framework for a balanced language program identifies
                four strands, each of which should receive roughly equal time.
                These are strands of activity, not language domains. A common
                misconception in K-12 language education is to organize programs
                around the four domains (reading, writing, speaking, listening).
                Nation's strands cut across domains:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  {
                    name: 'Meaning-focused input',
                    desc: 'Learning through listening and reading where the focus is on understanding the message. The input must be comprehensible.',
                  },
                  {
                    name: 'Meaning-focused output',
                    desc: 'Learning through speaking and writing where the focus is on conveying a message. The learner produces language to communicate.',
                  },
                  {
                    name: 'Language-focused learning',
                    desc: 'Deliberate study of language features: vocabulary, grammar, pronunciation, spelling. Intentional and focused.',
                  },
                  {
                    name: 'Fluency development',
                    desc: 'Becoming faster and more fluent with what is already known. Activities use familiar language at speed.',
                  },
                ].map((strand) => (
                  <div key={strand.name} className="bg-white rounded-lg p-4 border border-gray-100">
                    <p className="text-sm font-semibold text-gray-900 mb-1">{strand.name}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{strand.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 leading-relaxed mt-4">
                When you trace reading's role across the strands, it appears in
                three of four: it is the primary vehicle for meaning-focused input,
                it supports language-focused learning (vocabulary study,
                pronunciation practice from text), and it drives fluency
                development through re-reading and timed reading. Nation's research
                suggests that reading-centered activities should occupy roughly
                half of a balanced language program.
              </p>
            </div>

            <p>
              Krashen's comprehensible input hypothesis complements Nation's
              framework: language is acquired when learners understand messages
              that contain structures just beyond their current level. The key
              implication is that input must be comprehensible, not just available.
              A student surrounded by English they cannot understand acquires very
              little. A student reading English at the right level, with support
              for the words and structures they don't yet know, acquires a great
              deal.
            </p>
            <p>
              My hope is that the science of reading movement, which has done
              important work improving foundational literacy for young children,
              will also embrace practices that enable students — especially
              English learners — to continue experiencing the power of reading
              beyond the early grades. Relato is my attempt to make that practical.
            </p>
          </div>
        </div>
      </section>

      {/* How Relato Maps to the Research */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            How Relato Maps to the Research
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              I designed Relato's features around Nation's four strands, not as a
              grab bag of tools but as a coherent system that supports each
              dimension of a balanced language program.
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
                    desc: 'Vocabulary-controlled texts at the right level ensure that input is comprehensible. Students read and listen simultaneously, reinforcing both decoding and listening comprehension.',
                  },
                  {
                    name: 'Tap-to-translate',
                    desc: 'Instant L1 translations keep unknown words from blocking comprehension. The reader stays in the flow of the text rather than stopping to consult a dictionary.',
                  },
                  {
                    name: 'Syntax glosses',
                    desc: 'Phrase-level L1 translations help students parse English syntax by comparing it to structures in their native language, from single words to full sentences.',
                  },
                ],
              },
              {
                strand: 'Meaning-focused output',
                color: 'bg-green-100 text-green-700',
                features: [
                  {
                    name: 'Shadow reading',
                    desc: 'Students shadow the narrator sentence by sentence, producing spoken English in the context of stories they have already understood. Output is grounded in comprehended input.',
                  },
                  {
                    name: 'Student recordings',
                    desc: 'Full-text oral read-alouds that students save for teacher review. Speaking practice tied directly to the reading experience.',
                  },
                ],
              },
              {
                strand: 'Language-focused learning',
                color: 'bg-amber-100 text-amber-700',
                features: [
                  {
                    name: 'Pronunciation assessment',
                    desc: 'AI-powered per-word and per-phoneme feedback with IPA detail and mouth diagrams. Deliberate attention to specific sounds the student is struggling with.',
                  },
                  {
                    name: 'Spaced-repetition flashcards',
                    desc: 'Five-box Leitner system for deliberate vocabulary study. Cards are recommended from reading and exercises, keeping study connected to the texts.',
                  },
                  {
                    name: 'Comprehension exercises',
                    desc: 'Per-chapter vocabulary probes (meaning, cloze, and context questions) that verify comprehension of vocabulary encountered during reading.',
                  },
                ],
              },
              {
                strand: 'Fluency development',
                color: 'bg-blue-100 text-blue-700',
                features: [
                  {
                    name: 'Re-reading and timed reading',
                    desc: 'Students re-read texts they have already understood, building automatic recognition of vocabulary and structures. Timed reading tracks words per minute over time.',
                  },
                  {
                    name: 'Speed-controlled audio',
                    desc: 'Adjustable playback speed (0.5x to 1.25x) lets students practice fluent listening at a pace that challenges without overwhelming.',
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
            The teacher dashboard ties it all together, giving educators visibility
            into reading progress, recording reviews with AI pronunciation flags,
            exercise results, and fluency metrics across all four strands.
          </p>
        </div>
      </section>

      {/* How the Graded Readers Are Built */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-6">
            How the Graded Readers Are Built
          </h3>
          <div className="space-y-4 text-gray-500 leading-relaxed">
            <p>
              The quality of an extensive reading program depends on the quality
              of its texts. I've read graded readers in Mandarin that were
              beautifully crafted — the Mandarin Companion series set the standard
              for what vocabulary-controlled fiction can be. I've also read graded
              readers that introduced too much vocabulary too quickly, failed to
              recycle words enough for acquisition, or read like a vocabulary list
              with a plot stapled to it. I wanted Relato's readers to be the former,
              so I built a methodology that treats vocabulary control as a
              first-class engineering problem.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Vocabulary classification: EFLLex
            </h4>
            <p>
              Every word in a Relato graded reader is classified by CEFR level
              using EFLLex (Durlich & Francois, 2018), a graded lexical resource
              derived from the frequency profiles of actual EFL textbook corpora.
              Unlike simple frequency lists, EFLLex captures which words are
              typically taught at which proficiency level. Relato's dataset
              contains over 15,000 entries, each assigned a CEFR level based on
              where the word first appears with meaningful frequency in the
              corpus.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              The particle model
            </h4>
            <p>
              Traditional graded reader practice counts headwords: individual
              vocabulary items like "run," "take," and "up." But language learners
              don't process language one word at a time. A student who encounters
              "of course" is processing one cognitive unit, not two. A student who
              reads "pick up" needs to understand the phrasal verb as a whole, not
              its parts separately.
            </p>
            <p>
              Relato adopts the <em>particle</em> as the unit of vocabulary
              tracking. A particle is a vocabulary item the learner processes as
              a single cognitive unit, whether it is a single word or a multi-word
              chunk. This is grounded in research on formulaic language (Wray, 2002)
              and high-frequency multi-word expressions (Martinez & Schmitt, 2012).
              Multi-word particles are further classified as <em>compositional</em>{' '}
              (meaning derivable from parts, like "bus stop") or{' '}
              <em>non-compositional</em> (meaning not derivable from parts, like
              "of course"). This classification drives how vocabulary budgets are
              counted and how the reading view presents these expressions to
              students.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Tiered vocabulary with encounter floors
            </h4>
            <p>
              Each particle in a graded reader is assigned to one of four tiers:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 my-4">
              {[
                { tier: 'Tier 0 — Pre-known', desc: 'High-frequency items at or below A2 that are exempt from the vocabulary budget. Used freely.' },
                { tier: 'Tier 1 — Core', desc: 'Central to the story. Minimum 6 encounters per series to support incidental acquisition.' },
                { tier: 'Tier 2 — Thematic', desc: 'Important to the setting or topic. Minimum 4 encounters per series.' },
                { tier: 'Tier 3 — Peripheral', desc: 'Appears but is not central. Minimum 2 encounters. The text remains comprehensible if a reader skips it.' },
              ].map((t) => (
                <div key={t.tier} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-1">{t.tier}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              ))}
            </div>
            <p>
              The encounter floors are anchored to Nation's (2001) research on the
              number of exposures required for incidental vocabulary acquisition.
              A word that appears once in a text is unlikely to be acquired; a word
              that appears six or more times across meaningful contexts has a much
              higher chance. The tiered system ensures that the most important
              vocabulary gets the most exposure.
            </p>

            <h4 className="text-lg font-semibold text-gray-900 pt-4">
              Constraint specifications
            </h4>
            <p>
              Every book is authored against a written constraint specification
              that documents the target CEFR level, permitted and avoided
              grammatical structures (referenced by English Grammar Profile
              construct IDs), verb tense restrictions, sentence length limits,
              chapter length targets, and vocabulary tier budgets. These
              specifications make the authoring standards explicit, repeatable,
              and auditable.
            </p>
            <p>
              This is not how most graded readers are made. Most are approximately
              leveled by an editor's intuition. Every Relato reader has a
              paper trail.
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
              Durlich, L. & Francois, T. (2018). EFLLex: A graded lexical resource for learners of English as a foreign language. <em>LREC 2018</em>.
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
              Nation, I.S.P. (2013). <em>What Should Every EFL Teacher Know?</em> Compass Publishing.
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
          <div className="flex items-center gap-3">
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
