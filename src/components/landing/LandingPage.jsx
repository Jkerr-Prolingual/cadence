import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const FEATURES = [
  {
    title: 'Leer y escuchar',
    description: 'Sigue historias narradas profesionalmente. Cada palabra se resalta mientras se pronuncia, con velocidad ajustable y repetición oración por oración.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: 'Toca para traducir',
    description: 'Toca cualquier palabra para ver su traducción al español, definición en inglés y nivel CEFR. Las frases como "pick up" se reconocen como una sola unidad.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: 'Modo traducción',
    description: 'Activa traducciones frase por frase sobre todo el texto. Observa cómo las oraciones en inglés se conectan con la estructura del español — no palabra por palabra, sino frase por frase.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
      </svg>
    ),
  },
  {
    title: 'Tarjetas de vocabulario',
    description: 'Repasa vocabulario con repetición espaciada. Las tarjetas reaparecen justo cuando estás por olvidar, construyendo retención a largo plazo.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    title: 'Lectura en sombra',
    description: 'Practica la pronunciación leyendo en voz alta junto con el narrador. Repite oraciones individuales hasta que se sientan naturales, y luego grábate para comparar.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
  },
  {
    title: 'Seguimiento de vocabulario',
    description: 'Cada palabra que encuentras se rastrea en cinco niveles de profundidad — desde la primera pronunciación hasta el reconocimiento en textos nuevos. Observa cómo crece tu vocabulario.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    number: '1', title: 'Lee una historia', description: 'Elige entre lecturas graduadas seleccionadas para tu nivel.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    number: '2', title: 'Busca palabras', description: 'Toca cualquier palabra que no conozcas para ver su traducción al instante.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
  {
    number: '3', title: 'Escucha y repite', description: 'Imita al narrador para ganar confianza en tu pronunciación.',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z" />
      </svg>
    ),
  },
  {
    number: '4', title: 'Repasa y avanza', description: 'Las tarjetas y la relectura consolidan lo que aprendiste.',
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
        <p className="text-sm font-medium text-green-800">¡Mensaje enviado! Te responderé pronto.</p>
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
          placeholder="Tu nombre"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo electrónico"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Tu mensaje..."
        required
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? '...' : 'Enviar mensaje'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500">Hubo un error. Intenta de nuevo.</p>
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
        <p className="text-sm font-medium text-gray-900">¡Listo! Te avisaremos cuando publiquemos nuevos títulos.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Tu correo electrónico"
        required
        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-6 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {status === 'loading' ? '...' : 'Suscribirme'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-500 sm:absolute sm:bottom-0 sm:translate-y-full sm:mt-1">Hubo un error. Intenta de nuevo.</p>
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
              Iniciar sesión
            </Link>
            <Link
              to="/login?mode=signup"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-4 py-1.5 rounded-lg transition-colors"
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight">
              Aprende inglés{' '}
              <span className="text-violet-600">leyendo historias</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 leading-relaxed max-w-lg">
              Relato te ayuda a aprender inglés a través de la lectura extensiva — historias
              reales con audio, traducciones instantáneas y seguimiento de vocabulario que se
              adapta a lo que ya sabes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/login?mode=signup"
                className="inline-flex items-center px-6 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Empieza a leer gratis
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium hover:border-gray-400 transition-colors"
              >
                Descubre cómo funciona
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">Gratis para estudiantes. Sin tarjeta de crédito.</p>
          </div>

          <div className="hidden lg:block">
            <img
              src="/images/pexels-raul-sotomayor-2154397849-33265595.jpg"
              alt="Joven leyendo un libro"
              className="rounded-2xl shadow-2xl object-cover object-bottom w-full aspect-[3/2]"
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">Cómo funciona</h3>
            <p className="mt-3 text-gray-500 max-w-md mx-auto">
              La forma más efectiva de aprender un idioma es también la más sencilla: leer mucho.
            </p>
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
                  <p className="text-sm text-gray-500 mt-1">palabras por historia — lecturas reales y completas</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">&lt; 300</p>
                  <p className="text-sm text-gray-500 mt-1">palabras únicas por libro — vocabulario controlado para tu nivel</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">A1–C1</p>
                  <p className="text-sm text-gray-500 mt-1">niveles desde principiante hasta avanzado</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-700">5</p>
                  <p className="text-sm text-gray-500 mt-1">niveles de profundidad de vocabulario</p>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Por qué funciona la lectura extensiva
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Las investigaciones demuestran consistentemente que la lectura extensiva —
              leer grandes cantidades de texto comprensible por placer — es uno de los
              métodos más poderosos para la adquisición de un segundo idioma.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Cuando lees historias a tu nivel, encuentras vocabulario de forma natural,
              en contexto, una y otra vez. Cada encuentro profundiza tu conocimiento —
              desde reconocer una palabra hasta comprenderla y usarla con fluidez.
            </p>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Relato rastrea este recorrido para cada palabra que encuentras, para que
              puedas ver tu progreso y enfocar tu práctica donde más importa.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">Todo lo que necesitas para aprender</h3>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              Desde tu primera historia A1 hasta textos avanzados B2, Relato crece contigo.
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

      {/* Print books */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 mb-6">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-sm font-medium text-amber-800">También en papel</span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight text-gray-900">
            Lleva tus lecturas a donde quieras
          </h3>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto leading-relaxed">
            Todas nuestras lecturas graduadas están disponibles en formato impreso en Amazon.
            Lee en papel y usa Relato en tu teléfono para escuchar el audio, buscar palabras y
            seguir tu progreso.
          </p>
          <a
            href="#"
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M.045 18.02c.07-.116.36-.31.65-.32.39 0 .77.03 1.15.1 1.15.2 2.24.63 3.28 1.18.2.1.39.22.56.35-.02.04-.04.07-.07.1-.27.38-.56.74-.87 1.08-.36.39-.75.75-1.18 1.06-.4.29-.84.53-1.3.7-.46.17-.95.28-1.44.28-.1 0-.2 0-.3-.02.12-.31.28-.6.44-.89.42-.72.87-1.42 1.33-2.1.22-.32.44-.64.67-.95-.28-.03-.57-.07-.85-.12-.14-.02-.27-.05-.4-.08.06-.13.12-.26.2-.37zm23.86 1.96c-.07.12-.36.31-.65.32-.39 0-.77-.03-1.15-.1-1.15-.2-2.24-.63-3.28-1.18-.2-.1-.39-.22-.56-.35.02-.04.04-.07.07-.1.27-.38.56-.74.87-1.08.36-.39.75-.75 1.18-1.06.4-.29.84-.53 1.3-.7.46-.17.95-.28 1.44-.28.1 0 .2 0 .3.02-.12.31-.28.6-.44.89-.42.72-.87 1.42-1.33 2.1-.22.32-.44.64-.67.95.28.03.57.07.85.12.14.02.27.05.4.08-.06.13-.12.26-.2.37zM12 0C5.37 0 0 5.37 0 12c0 2.62.85 5.05 2.28 7.02.05-.04.1-.08.15-.13.44-.4.86-.83 1.25-1.28.48-.55.92-1.14 1.28-1.78.04-.07.08-.14.11-.22-.3-.2-.58-.42-.84-.66C2.83 13.7 2 12.91 2 12c0-5.52 4.48-10 10-10s10 4.48 10 10c0 .91-.83 1.7-2.23 2.95-.26.24-.54.46-.84.66.03.08.07.15.11.22.36.64.8 1.23 1.28 1.78.39.45.81.88 1.25 1.28.05.05.1.09.15.13C23.15 17.05 24 14.62 24 12 24 5.37 18.63 0 12 0z"/>
            </svg>
            Ver en Amazon
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
            Recibe noticias de nuevos títulos
          </h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto mb-6">
            Suscríbete para saber cuándo publicamos nuevas lecturas graduadas.
            Sin spam — solo títulos nuevos.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* For teachers */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-medium text-violet-600 mb-3">Para educadores</p>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">
              Diseñado para el aula
            </h3>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Relato les da a los maestros de ESL visibilidad sobre lo que leen sus
              estudiantes, con qué palabras tienen dificultades y cómo se desarrolla
              su pronunciación — sin agregar más trabajo de calificación.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Crea clases con códigos de acceso simples',
                'Visualiza el progreso de lectura de cada estudiante',
                'Revisa grabaciones con problemas de pronunciación señalados por IA',
                'Identifica puntos ciegos — palabras que los estudiantes no saben que pronuncian mal',
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
              Crear una cuenta de maestro
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h4 className="text-sm font-semibold text-gray-900">Progreso de estudiantes</h4>
              </div>
              <div className="divide-y divide-gray-50">
                {[
                  { name: 'María G.', words: 342, level: 'A2', progress: 65, color: 'bg-blue-400' },
                  { name: 'Carlos R.', words: 518, level: 'B1', progress: 78, color: 'bg-purple-400' },
                  { name: 'Ana L.', words: 203, level: 'A1', progress: 42, color: 'bg-green-400' },
                  { name: 'Diego M.', words: 467, level: 'A2', progress: 71, color: 'bg-blue-400' },
                ].map((student) => (
                  <div key={student.name} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{student.name}</span>
                        <span className="text-xs text-gray-400">{student.words} palabras</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${student.color} rounded-full`} style={{ width: `${student.progress}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-600">{student.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl px-6 py-12 sm:px-12 sm:py-16">
          <h3 className="text-3xl font-bold tracking-tight text-white">
            Empieza a leer hoy
          </h3>
          <p className="mt-3 text-violet-200 max-w-md mx-auto">
            Únete a Relato y descubre cómo leer historias reales transforma tu inglés — una página a la vez.
          </p>
          <Link
            to="/login?mode=signup"
            className="mt-8 inline-flex items-center px-8 py-3 bg-white text-violet-700 rounded-lg text-sm font-semibold hover:bg-violet-50 transition-colors"
          >
            Crea tu cuenta gratis
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* About */}
      <section id="contacto" className="py-16 sm:py-24 bg-gray-50 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-8 items-start">
            <div className="w-16 h-16 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-gray-900 mb-4">Sobre el autor</h3>
              <div className="space-y-3 text-gray-500 leading-relaxed">
                <p>
                  John empezó a escribir lecturas graduadas a partir de su propia experiencia
                  como estudiante de idiomas. Mientras aprendía mandarín, descubrió la lectura
                  extensiva — y todo cambió. No ejercicios de repetición, no tablas gramaticales,
                  sino tiempo pasado con historias al nivel adecuado. El tipo de lectura en la
                  que uno deja de notar el esfuerzo y empieza a notar el significado.
                </p>
                <p>
                  Buscó lo mismo para sus propios estudiantes de inglés. No encontró suficiente.
                  Así que lo escribió él mismo.
                </p>
                <p className="font-medium text-gray-700">
                  La serie Relato está construida sobre una investigación rigurosa del vocabulario
                  e historias que realmente vale la pena terminar. Para estudiantes que están
                  listos para avanzar leyendo.
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
            <span className="text-xs text-gray-400">leer, escuchar, y aprender inglés</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <a href="#contacto" className="hover:text-gray-600">Contacto</a>
            <Link to="/login" className="hover:text-gray-600">Iniciar sesión</Link>
            <Link to="/login?mode=signup" className="hover:text-gray-600">Crear cuenta</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
