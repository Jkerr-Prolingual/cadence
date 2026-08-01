import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/shared/Layout';
import ReadingView from './components/reading/ReadingView';
import FlashcardPage from './components/flashcards/FlashcardPage';
import ShadowingView from './components/shadowing/ShadowingView';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import AdminPanel from './components/admin/AdminPanel';
import WorkshopView from './components/workshop/WorkshopView';
import ExercisesPage from './components/exercises/ExercisesPage';
import LibraryPage from './components/library/LibraryPage';
import BookChaptersPage from './components/library/BookChaptersPage';
import LoginPage from './components/shared/LoginPage';
import ResetPasswordPage from './components/shared/ResetPasswordPage';
import LandingPage from './components/landing/LandingPage';
import ApproachPage from './components/landing/ApproachPage';

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
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {user ? (
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<LibraryPage />} />
          <Route path="book/:bookId" element={<BookChaptersPage />} />
          <Route path="read" element={<ReadingView />} />
          <Route path="flashcards" element={<FlashcardPage />} />
          <Route path="exercises" element={<ExercisesPage />} />
          <Route path="workshop" element={<WorkshopView />} />
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="admin" element={<ProtectedRoute requireAdmin><AdminPanel /></ProtectedRoute>} />
        </Route>
      ) : (
        <>
          <Route index element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      <Route path="/landing" element={<LandingPage />} />
      <Route path="/approach" element={<ApproachPage />} />
      <Route path="/shadow/:textId" element={
        <ProtectedRoute><ShadowingView /></ProtectedRoute>
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
