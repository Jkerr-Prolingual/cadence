import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import ReadingView from './components/reading/ReadingView';
import FlashcardPage from './components/flashcards/FlashcardPage';
import ShadowingView from './components/shadowing/ShadowingView';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import AdminPanel from './components/admin/AdminPanel';
import WorkshopView from './components/workshop/WorkshopView';
import LoginPage from './components/shared/LoginPage';

function ProtectedRoute({ children, requireTeacher, requireAdmin }) {
  const { user, loading, isTeacher, isAdmin } = useAuth();

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" />;
  if (requireTeacher && !isTeacher) return <Navigate to="/" />;

  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<ReadingView />} />
        <Route path="flashcards" element={<FlashcardPage />} />
        <Route path="workshop" element={<WorkshopView />} />
      </Route>

      <Route path="/shadow/:textId" element={
        <ProtectedRoute><ShadowingView /></ProtectedRoute>
      } />

      <Route path="/teacher" element={
        <ProtectedRoute requireTeacher><TeacherDashboard /></ProtectedRoute>
      } />

      <Route path="/admin" element={
        <ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
