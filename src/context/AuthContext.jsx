import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(DEV_MODE ? { id: 'dev-user', email: 'dev@relato.local' } : null);
  const [profile, setProfile] = useState(DEV_MODE ? { role: 'admin', display_name: 'Dev User' } : null);
  const [loading, setLoading] = useState(!DEV_MODE);

  useEffect(() => {
    if (DEV_MODE) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
    setLoading(false);
  }

  async function signOut() {
    if (DEV_MODE) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }

  async function refreshProfile() {
    if (user?.id) await fetchProfile(user.id);
  }

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    isTeacher: profile?.role === 'teacher' || profile?.role === 'admin',
    isAdmin: profile?.role === 'admin',
    isStudent: profile?.role === 'student',
    devMode: DEV_MODE,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
