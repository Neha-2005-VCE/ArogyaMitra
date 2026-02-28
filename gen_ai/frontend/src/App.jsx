import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'

// Pages (we'll create these next)
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import HealthAssessment from './pages/HealthAssessment'
import Dashboard from './pages/Dashboard'
import WorkoutPlans from './pages/WorkoutPlans'
import NutritionPlans from './pages/NutritionPlans'
import ProgressTracking from './pages/ProgressTracking'
import AICoach from './pages/AICoach'
import UserProfile from './pages/UserProfile'
import BossBattle from './pages/BossBattle'

import GlobalChat from './components/GlobalChat'

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <GlobalChat>{children}</GlobalChat> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/health-assessment" element={<ProtectedRoute><HealthAssessment /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/workouts" element={<ProtectedRoute><WorkoutPlans /></ProtectedRoute>} />
      <Route path="/workouts/boss-battle" element={<ProtectedRoute><BossBattle /></ProtectedRoute>} />
      <Route path="/nutrition" element={<ProtectedRoute><NutritionPlans /></ProtectedRoute>} />
      <Route path="/progress" element={<ProtectedRoute><ProgressTracking /></ProtectedRoute>} />
      <Route path="/ai-coach" element={<ProtectedRoute><AICoach /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}