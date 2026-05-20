import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Read' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/workshop', label: 'Workshop' },
];

export default function Layout() {
  const { user, profile, signOut, isTeacher } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-semibold tracking-tight text-gray-900">Cadence</h1>
          <span className="text-xs text-gray-400 hidden sm:inline">
            extensive reading, intensive practice
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
          <span className="text-sm text-gray-500">
            {profile?.display_name || user?.email}
          </span>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Sign out
          </button>
        </div>
      </header>

      <nav className="border-b border-gray-100 px-4">
        <div className="flex gap-1">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
