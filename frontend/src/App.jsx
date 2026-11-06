import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import HealthAssessment from './pages/HealthAssessment';
import Dashboard from './pages/Dashboard';
import WorkoutPlans from './pages/WorkoutPlans';
import NutritionPlans from './pages/NutritionPlans';
import Progress from './pages/Progress';
import AiCoach from './pages/AiCoach';
import Profile from './pages/Profile';
import WorkoutSession from './pages/WorkoutSession';
import WorkoutComplete from './pages/WorkoutComplete';

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <div className="dark">
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workouts" element={<ProtectedRoute><WorkoutPlans /></ProtectedRoute>} />
          <Route path="/workout-session" element={<ProtectedRoute><WorkoutSession /></ProtectedRoute>} />
          <Route path="/workout-complete" element={<ProtectedRoute><WorkoutComplete /></ProtectedRoute>} />
          <Route path="/nutrition" element={<ProtectedRoute><NutritionPlans /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="/ai-coach" element={<ProtectedRoute><AiCoach /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}
