import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : 'https://arogyamitra-api-12n2.onrender.com');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
    try {
        const stored = localStorage.getItem('arogyamitra-auth');
        if (stored) {
            const { state } = JSON.parse(stored);
            if (state?.token) {
                config.headers.Authorization = `Bearer ${state.token}`;
            }
        }
    } catch { }
    return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('arogyamitra-auth');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ── Auth API ──
export const authApi = {
    register: (data) => api.post('/api/auth/register', data),
    login: (credentials) => api.post('/api/auth/login', credentials),
    getMe: () => api.get('/api/auth/me'),
    updateProfile: (data) => api.put('/api/auth/profile', data),
};

// ── Workout API ──
export const workoutApi = {
    generate: () => api.post('/api/workouts/generate'),
    getCurrent: () => api.get('/api/workouts/current'),
    getToday: () => api.get('/api/workouts/today'),
    complete: (data) => api.post('/api/workouts/complete', data),
    getHistory: () => api.get('/api/workouts/history'),
};

// ── Nutrition API ──
export const nutritionApi = {
    generate: (data) => api.post('/api/nutrition/generate', data),
    getCurrent: () => api.get('/api/nutrition/current'),
    getToday: () => api.get('/api/nutrition/today'),
    completeMeal: (data) => api.post('/api/nutrition/meal/complete', data),
    getShoppingList: () => api.get('/api/nutrition/shopping-list'),
};

// ── Progress API ──
export const progressApi = {
    getSummary: () => api.get('/api/progress/summary'),
    getHistory: (period) => api.get(`/api/progress/history${period ? `?period=${period}` : ''}`),
    log: (data) => api.post('/api/progress/log', data),
    getAchievements: () => api.get('/api/progress/achievements'),
    getCharts: () => api.get('/api/progress/charts'),
    // New endpoints for ProgressTracking component
    getProgressOverview: (period = 'week') => api.get(`/api/progress/overview?period=${period}`),
    getWorkoutHistory: (period = 'week') => api.get(`/api/progress/workouts?period=${period}`),
    getNutritionHistory: (period = 'week') => api.get(`/api/progress/nutrition?period=${period}`),
    getBodyMetrics: (period = 'week') => api.get(`/api/progress/body-metrics?period=${period}`),
};

// ── AI Chat API ──
export const chatApi = {
    send: (data) => api.post('/api/aromi-chat', data),
    adjustPlan: (data) => api.post('/api/adjust-plan', data),
    getHistory: () => api.get('/api/chat-history'),
};

// ── Workout Session API ──
export const workoutSessionApi = {
    start: (data) => api.post('/api/workout-session/start', data),
    getCurrent: () => api.get('/api/workout-session/current'),
    update: (data) => api.put('/api/workout-session/update', data),
    completeExercise: (data) => api.post('/api/workout-session/complete-exercise', data),
    skipExercise: (data) => api.post('/api/workout-session/skip-exercise', data),
    getHistory: () => api.get('/api/workout-session/history'),
    abandon: () => api.post('/api/workout-session/abandon'),
};

// ── Health Assessment API ──
export const healthApi = {
    submit: (data) => api.post('/api/health-assessment/assessment/submit', data),
    getLatest: () => api.get('/api/health-assessment/assessment/latest'),
    analyze: (data) => api.post('/api/health-analysis/analyze', data),
};

// ── Calendar API ──
export const calendarApi = {
    getAuthUrl: () => api.get('/api/calendar/connect'),
    getStatus: () => api.get('/api/calendar/status'),
    syncWorkout: (data) => api.post('/api/calendar/sync-workout', data),
    syncMeals: (data) => api.post('/api/calendar/sync-meals', data),
    syncFullPlan: (data) => api.post('/api/calendar/sync-full-plan', data),
    syncToday: () => api.post('/api/calendar/sync-today'),
    clearEvents: (data) => api.post('/api/calendar/clear', data),
    disconnect: () => api.delete('/api/calendar/disconnect'),
};

export default api;
