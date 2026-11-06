# 🏋️ Workout Session API Documentation

## Overview
This API enables real-time workout tracking with video demonstrations, progress monitoring, and exercise completion tracking - exactly like the UI shown in your screenshots.

---

## 🎯 Key Features

1. **Real-time Session Tracking** - Start, pause, resume, complete workouts
2. **Exercise-by-Exercise Progress** - Track each exercise with sets, reps, time
3. **YouTube Video Integration** - Automatic video embedding for each exercise
4. **Timer Management** - Track elapsed time and remaining time
5. **Performance Metrics** - Calories burned, difficulty ratings, form ratings
6. **Session History** - View past workout sessions

---

## 📡 API Endpoints

### 1. Start Workout Session
**POST** `/api/workout-session/start`

Starts a new workout session or resumes an existing one.

**Request Body:**
```json
{
  "workout_plan_id": 1,  // Optional: specific plan ID
  "day_name": "Monday"   // Optional: specific day
}
```

**Response:**
```json
{
  "session_id": 123,
  "status": "started",
  "workout": {
    "day": "Monday",
    "focus_area": "Chest & Triceps",
    "duration_minutes": 45,
    "warmup": "5 min light cardio",
    "cool_down": "5 min stretching",
    "daily_tip": "Stay hydrated!",
    "total_exercises": 5
  }
}
```

---

### 2. Get Current Session
**GET** `/api/workout-session/current`

Gets the active workout session with all exercises and progress.

**Response:**
```json
{
  "session": {
    "id": 123,
    "day_name": "Monday",
    "focus_area": "Chest & Triceps",
    "status": "in_progress",
    "started_at": "2024-02-27T10:00:00",
    "elapsed_seconds": 600,
    "total_duration_minutes": 45,
    "total_exercises": 5,
    "completed_exercises": 2,
    "current_exercise_index": 2,
    "calories_burned": 50.5,
    "progress_percentage": 40.0
  },
  "exercises": [
    {
      "id": 1,
      "index": 0,
      "name": "Push Ups",
      "planned_sets": 3,
      "completed_sets": 3,
      "planned_reps": "12",
      "actual_reps": "12",
      "rest_seconds": 60,
      "time_spent_seconds": 180,
      "status": "completed",
      "video": {
        "video_id": "abc123",
        "embed_url": "https://www.youtube.com/embed/abc123?autoplay=0&rel=0&modestbranding=1",
        "watch_url": "https://www.youtube.com/watch?v=abc123"
      },
      "difficulty_rating": 3,
      "form_rating": 4
    },
    {
      "id": 2,
      "index": 1,
      "name": "Bench Press",
      "planned_sets": 4,
      "completed_sets": 0,
      "planned_reps": "10",
      "rest_seconds": 90,
      "status": "in_progress",
      "video": {
        "embed_url": "https://www.youtube.com/embed/xyz789?autoplay=0&rel=0&modestbranding=1"
      }
    }
  ]
}
```

---

### 3. Update Session (Pause/Resume)
**PUT** `/api/workout-session/{session_id}`

Update session status, time, or calories.

**Request Body:**
```json
{
  "status": "paused",           // Optional: in_progress, paused, completed, abandoned
  "elapsed_seconds": 600,       // Optional: update time
  "calories_burned": 75.5,      // Optional: update calories
  "notes": "Felt great today!"  // Optional: add notes
}
```

**Response:**
```json
{
  "message": "Session updated",
  "status": "paused"
}
```

---

### 4. Complete Exercise
**POST** `/api/workout-session/{session_id}/exercise/complete`

Mark an exercise as completed with performance data.

**Request Body:**
```json
{
  "exercise_index": 0,
  "completed_sets": 3,
  "actual_reps": "12",
  "time_spent_seconds": 180,
  "difficulty_rating": 3,      // Optional: 1-5 scale
  "form_rating": 4,            // Optional: 1-5 scale
  "notes": "Good form today"   // Optional
}
```

**Response:**
```json
{
  "message": "Exercise completed!",
  "session_completed": false,
  "completed_exercises": 1,
  "total_exercises": 5,
  "next_exercise_index": 1
}
```

**When all exercises are done:**
```json
{
  "message": "🎉 Workout completed! Great job!",
  "session_completed": true,
  "total_exercises": 5,
  "calories_burned": 125.5
}
```

---

### 5. Skip Exercise
**POST** `/api/workout-session/{session_id}/exercise/skip`

Skip an exercise (injury, equipment unavailable, etc.)

**Request Body:**
```json
{
  "exercise_index": 2,
  "reason": "Shoulder pain"  // Optional
}
```

**Response:**
```json
{
  "message": "Exercise skipped",
  "next_exercise_index": 3
}
```

---

### 6. Get Session History
**GET** `/api/workout-session/history?limit=10`

Get past workout sessions.

**Response:**
```json
{
  "sessions": [
    {
      "id": 123,
      "day_name": "Monday",
      "focus_area": "Chest & Triceps",
      "status": "completed",
      "session_date": "2024-02-27T10:00:00",
      "elapsed_seconds": 2700,
      "completed_exercises": 5,
      "total_exercises": 5,
      "calories_burned": 125.5
    }
  ]
}
```

---

### 7. Abandon Session
**DELETE** `/api/workout-session/{session_id}`

Cancel/abandon a workout session.

**Response:**
```json
{
  "message": "Workout session abandoned"
}
```

---

## 🎬 Frontend Implementation Guide

### Step 1: Start Workout
```javascript
// When user clicks "Start Workout"
const response = await fetch('/api/workout-session/start', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});

const { session_id, workout } = await response.json();
```

### Step 2: Load Current Session
```javascript
// Load session data and exercises
const response = await fetch('/api/workout-session/current', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const { session, exercises } = await response.json();

// Display:
// - session.focus_area (e.g., "Chest & Triceps")
// - session.elapsed_seconds (convert to MM:SS)
// - session.progress_percentage (for progress bar)
// - exercises[current_exercise_index] (current exercise)
```

### Step 3: Display Video Player
```javascript
// For current exercise
const currentExercise = exercises[session.current_exercise_index];

// Embed YouTube video
<iframe
  src={currentExercise.video.embed_url}
  width="100%"
  height="400px"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

### Step 4: Timer Implementation
```javascript
// Update timer every second
const [elapsedSeconds, setElapsedSeconds] = useState(session.elapsed_seconds);

useEffect(() => {
  if (session.status === 'in_progress') {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }
}, [session.status]);

// Display as MM:SS
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
```

### Step 5: Complete Exercise
```javascript
// When user completes an exercise
const completeExercise = async (exerciseIndex, sets, reps) => {
  const response = await fetch(
    `/api/workout-session/${session_id}/exercise/complete`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exercise_index: exerciseIndex,
        completed_sets: sets,
        actual_reps: reps,
        time_spent_seconds: elapsedSeconds,
        difficulty_rating: 3,
        form_rating: 4
      })
    }
  );

  const result = await response.json();
  
  if (result.session_completed) {
    // Show completion celebration
    showConfetti();
    navigate('/workout-summary');
  } else {
    // Move to next exercise
    loadNextExercise(result.next_exercise_index);
  }
};
```

### Step 6: Pause/Resume
```javascript
const pauseWorkout = async () => {
  await fetch(`/api/workout-session/${session_id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'paused',
      elapsed_seconds: elapsedSeconds
    })
  });
};

const resumeWorkout = async () => {
  await fetch(`/api/workout-session/${session_id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      status: 'in_progress'
    })
  });
};
```

---

## 📊 UI Components Mapping

Based on your screenshots, here's how the API data maps to UI:

### Left Panel (Video & Exercise Info):
- **Video Player**: `exercises[current_index].video.embed_url`
- **Exercise Name**: `exercises[current_index].name`
- **Sets/Reps**: `exercises[current_index].planned_sets` x `exercises[current_index].planned_reps`
- **Instructions**: `exercises[current_index].notes`

### Right Panel (Progress Tracking):
- **Workout Progress Title**: `session.focus_area`
- **Timer (00:00)**: `formatTime(session.elapsed_seconds)`
- **Time Remaining**: `(session.total_duration_minutes * 60) - session.elapsed_seconds`
- **Progress Bar**: `session.progress_percentage`
- **Exercise Counter**: `${session.completed_exercises} / ${session.total_exercises}`

### Bottom Section (Day Tips):
- **Tips**: From workout plan's `daily_tip` field

---

## 🔄 Real-time Updates

For live timer updates without constant API calls:

```javascript
// Poll every 30 seconds to sync with server
useEffect(() => {
  const syncInterval = setInterval(async () => {
    const response = await fetch('/api/workout-session/current');
    const { session } = await response.json();
    // Sync local state with server
    setElapsedSeconds(session.elapsed_seconds);
  }, 30000);
  
  return () => clearInterval(syncInterval);
}, []);
```

---

## 🎨 Status Colors

```javascript
const statusColors = {
  'pending': '#gray',
  'in_progress': '#blue',
  'completed': '#green',
  'skipped': '#yellow',
  'paused': '#orange'
};
```

---

## 🚀 Complete Workflow

1. User clicks "Start Workout" → `POST /start`
2. Load session data → `GET /current`
3. Display first exercise with video
4. User completes sets → `POST /exercise/complete`
5. Auto-advance to next exercise
6. Repeat until all exercises done
7. Show completion screen with stats

---

## 📱 Example: Complete React Component

```jsx
import React, { useState, useEffect } from 'react';

function WorkoutSession() {
  const [session, setSession] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (session?.status === 'in_progress') {
      const timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [session?.status]);

  const loadSession = async () => {
    const res = await fetch('/api/workout-session/current');
    const data = await res.json();
    setSession(data.session);
    setExercises(data.exercises);
    setCurrentIndex(data.session.current_exercise_index);
    setElapsedSeconds(data.session.elapsed_seconds);
  };

  const completeExercise = async () => {
    await fetch(`/api/workout-session/${session.id}/exercise/complete`, {
      method: 'POST',
      body: JSON.stringify({
        exercise_index: currentIndex,
        completed_sets: exercises[currentIndex].planned_sets,
        actual_reps: exercises[currentIndex].planned_reps
      })
    });
    loadSession();
  };

  const currentExercise = exercises[currentIndex];

  return (
    <div className="workout-session">
      <div className="video-panel">
        <iframe src={currentExercise?.video.embed_url} />
        <h2>{currentExercise?.name}</h2>
        <p>{currentExercise?.planned_sets} sets x {currentExercise?.planned_reps} reps</p>
        <button onClick={completeExercise}>Complete Exercise</button>
      </div>
      
      <div className="progress-panel">
        <h3>{session?.focus_area}</h3>
        <div className="timer">{formatTime(elapsedSeconds)}</div>
        <div className="progress-bar" style={{width: `${session?.progress_percentage}%`}} />
        <p>{session?.completed_exercises} / {session?.total_exercises} exercises</p>
      </div>
    </div>
  );
}
```

---

## ✅ Testing the API

Visit: **http://localhost:8000/docs#/Workout%20Session**

All endpoints are interactive and can be tested directly from the Swagger UI!

---

This API provides everything you need to build the exact workout tracking interface shown in your screenshots! 🎉
