import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { L1_LOCALES, DEFAULT_L1 } from '../../lib/locales';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('student');
  const [l1, setL1] = useState(DEFAULT_L1);
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'login');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError(authError.message);
    } else {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim() || email.split('@')[0],
            role,
            l1,
          },
        },
      });
      if (authError) {
        setError(authError.message);
      } else {
        setSignupDone(true);
      }
    }
    setLoading(false);
  }

  if (signupDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">Relato</h1>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <p className="text-sm text-gray-700 font-medium">Revisa tu correo</p>
            <p className="text-sm text-gray-500 mt-2">
              Enviamos un enlace de confirmación a <strong>{email}</strong>.
              Haz clic en él para activar tu cuenta.
            </p>
            <button
              onClick={() => { setSignupDone(false); setMode('login'); }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              Volver a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">Relato</h1>
          <p className="text-sm text-gray-500 mt-1">leer, escuchar, y aprender inglés</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre para mostrar</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={email ? email.split('@')[0] : ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Soy...</label>
                <div className="flex gap-2">
                  {[{ value: 'student', label: 'Estudiante' }, { value: 'teacher', label: 'Maestro/a' }].map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`flex-1 py-2 rounded-md text-sm font-medium border transition-colors ${
                        role === r.value
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mi idioma / My language</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(L1_LOCALES).map((loc) => (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => setL1(loc.code)}
                      className={`py-2 rounded-md text-sm font-medium border transition-colors ${
                        l1 === loc.code
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? '...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>

          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
