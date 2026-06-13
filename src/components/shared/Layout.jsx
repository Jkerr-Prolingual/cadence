import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const navItems = [
  { to: '/', label: 'Library' },
  { to: '/read', label: 'Read' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/workshop', label: 'Workshop' },
];

export default function Layout() {
  const { user, profile, signOut, refreshProfile, isTeacher, isAdmin, isStudent } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinStatus, setJoinStatus] = useState(null);
  const settingsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false);
      }
    }
    if (showSettings) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSettings]);

  async function handleJoinClass() {
    if (!joinCode.trim()) return;
    const name = joinName.trim();
    if (!name) { setJoinStatus('Please enter your name'); return; }
    setJoinStatus('loading');
    if (name !== (profile?.display_name || '')) {
      const { error: nameErr } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', user.id);
      if (nameErr) { setJoinStatus('Could not save name'); return; }
    }
    const { data, error } = await supabase.rpc('join_class_by_code', { code: joinCode.trim().toUpperCase() });
    if (error) {
      setJoinStatus(error.message);
    } else {
      await refreshProfile();
      setJoinStatus(`Joined ${data.class_name}!`);
      setJoinCode('');
      setJoinName('');
      setTimeout(() => { setShowJoin(false); setJoinStatus(null); }, 1500);
    }
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Relato</h1>
          <span className="text-xs text-gray-400 hidden sm:inline">
            leer, escuchar, y aprender inglés
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isTeacher && (
            <NavLink
              to="/teacher"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Teacher
            </NavLink>
          )}
          {isAdmin && (
            <NavLink
              to="/admin"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              Admin
            </NavLink>
          )}
          <div className="relative" ref={settingsRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
            >
              <span>{profile?.display_name || user?.email}</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-1 w-[calc(100vw-32px)] sm:w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{profile?.display_name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                  <p className="text-xs text-gray-400 capitalize">{profile?.role || 'student'}</p>
                </div>
                {!isAdmin && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    {!showJoin ? (
                      <button
                        onClick={() => { setShowJoin(true); setJoinName(profile?.display_name || ''); }}
                        className="text-sm text-gray-700 hover:text-gray-900"
                      >
                        Join a class
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={joinName}
                          onChange={e => setJoinName(e.target.value)}
                          placeholder="Your name (for your teacher)"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={joinCode}
                            onChange={e => setJoinCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoinClass()}
                            placeholder="Class code"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
                          />
                          <button onClick={handleJoinClass} disabled={joinStatus === 'loading'} className="px-2 py-1 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50">Join</button>
                        </div>
                        {joinStatus && joinStatus !== 'loading' && (
                          <p className={`text-xs ${joinStatus.startsWith('Joined') ? 'text-green-600' : 'text-red-500'}`}>
                            {joinStatus}
                          </p>
                        )}
                        <button onClick={() => { setShowJoin(false); setJoinStatus(null); setJoinName(''); }} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
                <div className="px-4 py-3">
                  <button
                    onClick={() => { setShowSettings(false); signOut(); }}
                    className="text-sm text-gray-500 hover:text-gray-900"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-100 px-4 overflow-x-auto scrollbar-none">
        <div className="flex gap-0.5 sm:gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700 active:text-gray-900'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1 min-h-0">
        <Outlet />
      </main>
    </div>
  );
}
