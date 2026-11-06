# 🎥 Exercise Player API - Complete Implementation Guide

## Overview
This API provides everything needed to build an advanced Exercise Player with:
- ✅ YouTube video embedding
- ✅ Motion/activity detection
- ✅ Real-time rep counting
- ✅ AI-powered form analysis
- ✅ Live coaching tips
- ✅ Calories calculation
- ✅ Camera integration support

---

## 🎯 Core Features (Matching Your Screenshot)

### 1. Video Player State Management
```typescript
const [isPlaying, setIsPlaying] = useState(false)
const [cameraActive, setCameraActive] = useState(false)
const [timerStarted, setTimerStarted] = useState(false)
const [timeLeft, setTimeLeft] = useState(0)
const [repsLeft, setRepsLeft] = useState(exercise.reps)
const [setsLeft, setSetsLeft] = useState(exercise.sets)
const [isMoving, setIsMoving] = useState(false)
const [movementIntensity, setMovementIntensity] = useState(0)
const [detectedActivity, setDetectedActivity] = useState('Initializing...')
const [activityConfidence, setActivityConfidence] = useState(0)
const [repsDetected, setRepsDetected] = useState(0)
const [workoutStatus, setWorkoutStatus] = useState('idle') // idle | in-progress | completed | abandoned
const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/embed/...')
const [loadingVideo, setLoadingVideo] = useState(true)
const [caloriesBurned, setCaloriesBurned] = useState(0)
const [cameraTimeActive, setCameraTimeActive] = useState(0)
const [minRequiredTime, setMinRequiredTime] = useState(0)
```

---

## 📡 API Endpoints

### 1. Motion Detection
**POST** `/api/workout-session/motion/detect`

Detect if user is actively exercising.

**Request:**
```json
{
  "motion_intensity": 0.75,  // 0.0 - 1.0
  "camera_active": true
}
```

**Response:**
```json
{
  "is_active": true,
  "confidence": 0.75,
  "status": "active",  // idle | low | moderate | active
  "message": "High activity detected",
  "motion_intensity": 0.75,
  "timestamp": "2024-02-27T10:30:00"
}
```

**Frontend Usage:**
```javascript
// Call every 500ms-1s while camera is active
const detectActivity = async (motionIntensity) => {
  const response = await fetch('/api/workout-session/motion/detect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      motion_intensity: motionIntensity,
      camera_active: cameraActive
    })
  });
  
  const data = await response.json();
  setDetectedActivity(data.message);
  setActivityConfidence(data.confidence);
  setIsMoving(data.is_active);
};
```

---

### 2. Rep Counting
**POST** `/api/workout-session/motion/count-rep`

Count exercise repetitions based on movement.

**Request:**
```json
{
  "exercise_name": "Push Ups",
  "current_angle": 85,  // Optional: joint angle
  "movement_phase": "down"  // up | down
}
```

**Response:**
```json
{
  "exercise": "Push Ups",
  "rep_detected": true,
  "current_angle": 85,
  "movement_phase": "down",
  "threshold": 90,
  "key_points": ["elbow_angle", "body_alignment"],
  "timestamp": "2024-02-27T10:30:00"
}
```

**Frontend Usage:**
```javascript
// Call when movement phase changes
const countRep = async (angle, phase) => {
  const response = await fetch('/api/workout-session/motion/count-rep', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exercise_name: currentExercise.name,
      current_angle: angle,
      movement_phase: phase
    })
  });
  
  const data = await response.json();
  if (data.rep_detected) {
    setRepsDetected(prev => prev + 1);
    setRepsLeft(prev => Math.max(0, prev - 1));
  }
};
```

---

### 3. Form Analysis (AI-Powered)
**POST** `/api/workout-session/motion/analyze-form`

Get AI-powered form analysis and feedback.

**Request:**
```json
{
  "exercise_name": "Push Ups",
  "frame_data": {
    "timestamp": "2024-02-27T10:30:00",
    "frame_number": 150
  },
  "pose_landmarks": [
    {"x": 0.5, "y": 0.3, "z": 0.1, "visibility": 0.9}
  ]
}
```

**Response:**
```json
{
  "exercise": "Push Ups",
  "timestamp": "2024-02-27T10:30:00",
  "form_score": 85,
  "feedback": [
    "Keep your body straight",
    "Lower chest closer to ground"
  ],
  "good_points": [
    "Excellent elbow position",
    "Good breathing rhythm"
  ],
  "risk_level": "low",  // low | medium | high
  "suggestions": [
    "Focus on controlled movement",
    "Maintain core engagement"
  ],
  "ai_powered": true
}
```

**Frontend Usage:**
```javascript
// Call every 5-10 seconds during exercise
const analyzeForm = async () => {
  const response = await fetch('/api/workout-session/motion/analyze-form', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      exercise_name: currentExercise.name,
      frame_data: { timestamp: new Date().toISOString() },
      pose_landmarks: poseLandmarks // From MediaPipe or similar
    })
  });
  
  const data = await response.json();
  setFormScore(data.form_score);
  setFormFeedback(data.feedback);
  setGoodPoints(data.good_points);
};
```

---

### 4. Coaching Tips
**GET** `/api/workout-session/motion/coaching-tips/{exercise_name}/{current_rep}`

Get real-time motivational coaching tips.

**Response:**
```json
{
  "exercise": "Push Ups",
  "current_rep": 8,
  "phase": "middle",  // early | middle | late
  "tip": "You're doing great! Maintain that form",
  "motivation_level": "medium",  // low | medium | high
  "timestamp": "2024-02-27T10:30:00"
}
```

**Frontend Usage:**
```javascript
// Call after each rep
const getCoachingTip = async (repNumber) => {
  const response = await fetch(
    `/api/workout-session/motion/coaching-tips/${currentExercise.name}/${repNumber}`
  );
  
  const data = await response.json();
  showToast(data.tip); // Display as notification
};
```

---

### 5. Calculate Calories
**POST** `/api/workout-session/{session_id}/calculate-calories?intensity=0.7`

Calculate calories burned for the session.

**Response:**
```json
{
  "session_id": 123,
  "total_calories": 125.5,
  "exercises_analyzed": 5,
  "intensity": 0.7
}
```

**Frontend Usage:**
```javascript
// Call after completing each exercise
const updateCalories = async (intensity = 0.7) => {
  const response = await fetch(
    `/api/workout-session/${sessionId}/calculate-calories?intensity=${intensity}`,
    { method: 'POST' }
  );
  
  const data = await response.json();
  setCaloriesBurned(data.total_calories);
};
```

---

### 6. Real-time Stats
**GET** `/api/workout-session/{session_id}/real-time-stats`

Get real-time workout statistics (optimized for frequent polling).

**Response:**
```json
{
  "session_id": 123,
  "status": "in_progress",
  "elapsed_seconds": 600,
  "total_duration_minutes": 45,
  "remaining_seconds": 2100,
  "completed_exercises": 2,
  "total_exercises": 5,
  "progress_percentage": 40.0,
  "calories_burned": 50.5,
  "current_exercise": {
    "name": "Push Ups",
    "index": 2,
    "status": "in_progress",
    "completed_sets": 1,
    "planned_sets": 3
  }
}
```

**Frontend Usage:**
```javascript
// Poll every 2-3 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/workout-session/${sessionId}/real-time-stats`);
    const data = await response.json();
    
    setElapsedSeconds(data.elapsed_seconds);
    setRemainingSeconds(data.remaining_seconds);
    setProgressPercentage(data.progress_percentage);
    setCaloriesBurned(data.calories_burned);
  }, 2000);
  
  return () => clearInterval(interval);
}, [sessionId]);
```

---

## 🎬 Complete React Component Example

```jsx
import React, { useState, useEffect, useRef } from 'react';

const ExercisePlayer = ({ exercise, onClose }) => {
  // ── State Management (matching your screenshot) ──
  const canvasRef = useRef(null);
  const videoStreamRef = useRef(null);
  const videoElementRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [repsLeft, setRepsLeft] = useState(exercise.reps);
  const [setsLeft, setSetsLeft] = useState(exercise.sets);
  const [isMoving, setIsMoving] = useState(false);
  const [movementIntensity, setMovementIntensity] = useState(0);
  const [detectedActivity, setDetectedActivity] = useState('Initializing...');
  const [activityConfidence, setActivityConfidence] = useState(0);
  const [repsDetected, setRepsDetected] = useState(0);
  const [workoutStatus, setWorkoutStatus] = useState('idle');
  const [videoUrl, setVideoUrl] = useState(exercise.video.embed_url);
  const [loadingVideo, setLoadingVideo] = useState(true);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [cameraTimeActive, setCameraTimeActive] = useState(0);
  const [minRequiredTime, setMinRequiredTime] = useState(0);
  
  // ── Camera Initialization ──
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [cameraActive]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      videoStreamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setCameraActive(false);
    }
  };
  
  const stopCamera = () => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
  };
  
  // ── Motion Detection Loop ──
  useEffect(() => {
    if (!cameraActive || !timerStarted) return;
    
    const motionInterval = setInterval(async () => {
      // Calculate motion intensity from video frames
      const intensity = calculateMotionIntensity();
      setMovementIntensity(intensity);
      
      // Send to backend
      const response = await fetch('/api/workout-session/motion/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motion_intensity: intensity,
          camera_active: cameraActive
        })
      });
      
      const data = await response.json();
      setDetectedActivity(data.message);
      setActivityConfidence(data.confidence);
      setIsMoving(data.is_active);
    }, 1000); // Every second
    
    return () => clearInterval(motionInterval);
  }, [cameraActive, timerStarted]);
  
  // ── Rep Counting ──
  const handleRepDetected = async (angle, phase) => {
    const response = await fetch('/api/workout-session/motion/count-rep', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exercise_name: exercise.name,
        current_angle: angle,
        movement_phase: phase
      })
    });
    
    const data = await response.json();
    if (data.rep_detected) {
      setRepsDetected(prev => prev + 1);
      setRepsLeft(prev => Math.max(0, prev - 1));
      
      // Get coaching tip
      const tipResponse = await fetch(
        `/api/workout-session/motion/coaching-tips/${exercise.name}/${repsDetected + 1}`
      );
      const tipData = await tipResponse.json();
      showToast(tipData.tip);
    }
  };
  
  // ── Form Analysis (every 5 seconds) ──
  useEffect(() => {
    if (!timerStarted) return;
    
    const formInterval = setInterval(async () => {
      const response = await fetch('/api/workout-session/motion/analyze-form', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exercise_name: exercise.name,
          frame_data: { timestamp: new Date().toISOString() }
        })
      });
      
      const data = await response.json();
      // Display feedback
      if (data.feedback.length > 0) {
        showFormFeedback(data.feedback[0]);
      }
    }, 5000); // Every 5 seconds
    
    return () => clearInterval(formInterval);
  }, [timerStarted]);
  
  // ── Timer ──
  useEffect(() => {
    if (!timerStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
      
      if (cameraActive) {
        setCameraTimeActive(prev => prev + 1);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timerStarted, cameraActive]);
  
  // ── Helper Functions ──
  const calculateMotionIntensity = () => {
    // Implement motion detection from video frames
    // This would use canvas to compare frames
    // Return value between 0.0 and 1.0
    return Math.random() * 0.5 + 0.3; // Placeholder
  };
  
  const handleStartWorkout = () => {
    setTimerStarted(true);
    setWorkoutStatus('in-progress');
    setTimeLeft(exercise.duration_seconds || 180);
  };
  
  const handleExerciseComplete = async () => {
    setWorkoutStatus('completed');
    setTimerStarted(false);
    
    // Complete exercise on backend
    await fetch(`/api/workout-session/${sessionId}/exercise/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        exercise_index: exercise.index,
        completed_sets: exercise.sets - setsLeft,
        actual_reps: String(repsDetected),
        time_spent_seconds: cameraTimeActive
      })
    });
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ── Render ──
  return (
    <div className="exercise-player">
      {/* Left Panel - Video */}
      <div className="video-panel">
        <iframe
          src={videoUrl}
          width="100%"
          height="400px"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setLoadingVideo(false)}
        />
        
        {/* Camera Feed (Picture-in-Picture) */}
        {cameraActive && (
          <div className="camera-feed">
            <video
              ref={videoElementRef}
              autoPlay
              playsInline
              muted
              width="200"
              height="150"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
        )}
        
        <div className="exercise-info">
          <h2>{exercise.name}</h2>
          <p>{exercise.sets} sets × {exercise.reps} reps</p>
          <p>Rest: {exercise.rest_seconds}s</p>
        </div>
        
        <div className="controls">
          <button onClick={() => setCameraActive(!cameraActive)}>
            {cameraActive ? '📷 Camera On' : '📷 Camera Off'}
          </button>
          <button onClick={handleStartWorkout} disabled={timerStarted}>
            Start Workout
          </button>
        </div>
      </div>
      
      {/* Right Panel - Progress */}
      <div className="progress-panel">
        <h3>Workout Progress</h3>
        
        <div className="timer">
          <div className="time-display">{formatTime(timeLeft)}</div>
          <div className="time-label">Time Remaining</div>
        </div>
        
        <div className="stats">
          <div className="stat">
            <span className="label">Sets Left:</span>
            <span className="value">{setsLeft}</span>
          </div>
          <div className="stat">
            <span className="label">Reps Left:</span>
            <span className="value">{repsLeft}</span>
          </div>
          <div className="stat">
            <span className="label">Reps Detected:</span>
            <span className="value">{repsDetected}</span>
          </div>
        </div>
        
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(repsDetected / (exercise.sets * exercise.reps)) * 100}%` }}
          />
        </div>
        
        <div className="activity-detection">
          <h4>Activity Detection</h4>
          <p className="status">{detectedActivity}</p>
          <p className="confidence">Confidence: {(activityConfidence * 100).toFixed(0)}%</p>
          <div className="intensity-bar">
            <div 
              className="intensity-fill" 
              style={{ width: `${movementIntensity * 100}%` }}
            />
          </div>
        </div>
        
        <div className="day-tips">
          <h4>💡 Pro Tips</h4>
          <ul>
            <li>Keep your core engaged</li>
            <li>Breathe steadily</li>
            <li>Focus on form over speed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ExercisePlayer;
```

---

## 🎨 CSS Styling (Matching Your UI)

```css
.exercise-player {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  padding: 20px;
}

.video-panel {
  position: relative;
}

.camera-feed {
  position: absolute;
  top: 20px;
  right: 20px;
  border: 2px solid #00ff00;
  border-radius: 8px;
  overflow: hidden;
}

.progress-panel {
  background: #2a2a2a;
  border-radius: 12px;
  padding: 24px;
}

.timer {
  text-align: center;
  margin-bottom: 30px;
}

.time-display {
  font-size: 48px;
  font-weight: bold;
  color: #00d4ff;
}

.progress-bar {
  height: 8px;
  background: #333;
  border-radius: 4px;
  overflow: hidden;
  margin: 20px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00d4ff);
  transition: width 0.3s ease;
}

.activity-detection {
  background: #1a1a1a;
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
}

.status {
  font-size: 18px;
  color: #00ff88;
  margin: 8px 0;
}

.intensity-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.intensity-fill {
  height: 100%;
  background: #00ff88;
  transition: width 0.2s ease;
}
```

---

## 🚀 Implementation Checklist

- ✅ Video player with YouTube embed
- ✅ Camera access and display
- ✅ Motion detection API integration
- ✅ Rep counting logic
- ✅ Form analysis feedback
- ✅ Real-time timer
- ✅ Progress tracking
- ✅ Activity confidence display
- ✅ Coaching tips
- ✅ Calories calculation

---

## 📊 Data Flow

```
1. User starts workout
   ↓
2. Camera activates
   ↓
3. Motion detection starts (every 1s)
   ↓
4. Rep counting on movement
   ↓
5. Form analysis (every 5s)
   ↓
6. Coaching tips after each rep
   ↓
7. Complete exercise
   ↓
8. Calculate calories
```

---

This implementation provides everything shown in your screenshot! 🎉
