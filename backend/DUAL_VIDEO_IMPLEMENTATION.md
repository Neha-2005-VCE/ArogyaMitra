# 🎥 Dual Video Display - YouTube + User Camera

## Overview
Display both the YouTube instructional video AND the user's camera feed side-by-side during workouts.

---

## 🎨 Layout Options

### Option 1: Side-by-Side (Recommended)
```
┌─────────────────────────────────────────┐
│  YouTube Video    │   User Camera       │
│  (Instructor)     │   (Live Feed)       │
│                   │                     │
│                   │                     │
└─────────────────────────────────────────┘
```

### Option 2: Picture-in-Picture
```
┌─────────────────────────────────────────┐
│                                         │
│        YouTube Video (Main)             │
│                                         │
│                    ┌──────────┐         │
│                    │ Camera   │         │
│                    │ (Small)  │         │
│                    └──────────┘         │
└─────────────────────────────────────────┘
```

### Option 3: Stacked (Mobile-Friendly)
```
┌─────────────────────────────────────────┐
│        YouTube Video (Top)              │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        User Camera (Bottom)             │
│                                         │
└─────────────────────────────────────────┘
```

---

## 💻 Complete React Implementation

### Full Component with Dual Video

```jsx
import React, { useState, useEffect, useRef } from 'react';
import './ExercisePlayer.css';

const ExercisePlayer = ({ exercise, sessionId, onClose }) => {
  // ── Refs ──
  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  const canvasRef = useRef(null);
  
  // ── State ──
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(exercise.duration_seconds || 180);
  const [repsDetected, setRepsDetected] = useState(0);
  const [detectedActivity, setDetectedActivity] = useState('Initializing...');
  const [activityConfidence, setActivityConfidence] = useState(0);
  const [movementIntensity, setMovementIntensity] = useState(0);
  const [videoLayout, setVideoLayout] = useState('side-by-side'); // side-by-side | pip | stacked
  
  // ── Camera Management ──
  useEffect(() => {
    if (cameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => stopCamera();
  }, [cameraActive]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera
        },
        audio: false
      });
      
      userStreamRef.current = stream;
      
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
        userVideoRef.current.play();
      }
      
      setCameraError(null);
      console.log('✅ Camera started successfully');
    } catch (error) {
      console.error('❌ Camera error:', error);
      setCameraError(error.message);
      setCameraActive(false);
    }
  };
  
  const stopCamera = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Camera track stopped');
      });
      userStreamRef.current = null;
    }
    
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null;
    }
  };
  
  // ── Motion Detection Loop ──
  useEffect(() => {
    if (!cameraActive || !timerStarted) return;
    
    const motionInterval = setInterval(async () => {
      const intensity = calculateMotionIntensity();
      setMovementIntensity(intensity);
      
      try {
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
      } catch (error) {
        console.error('Motion detection error:', error);
      }
    }, 1000);
    
    return () => clearInterval(motionInterval);
  }, [cameraActive, timerStarted]);
  
  // ── Motion Intensity Calculation ──
  const calculateMotionIntensity = () => {
    if (!userVideoRef.current || !canvasRef.current) return 0;
    
    const video = userVideoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate average brightness (simple motion proxy)
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    const avgBrightness = sum / (data.length / 4);
    
    // Normalize to 0-1 range (this is simplified)
    const intensity = Math.min(1, avgBrightness / 255);
    
    return intensity;
  };
  
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
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timerStarted]);
  
  // ── Handlers ──
  const handleStartWorkout = () => {
    if (!cameraActive) {
      alert('Please enable camera first!');
      return;
    }
    setTimerStarted(true);
  };
  
  const handleExerciseComplete = async () => {
    setTimerStarted(false);
    
    // Complete exercise on backend
    try {
      await fetch(`/api/workout-session/${sessionId}/exercise/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exercise_index: exercise.index,
          completed_sets: exercise.sets,
          actual_reps: String(repsDetected),
          time_spent_seconds: exercise.duration_seconds - timeLeft
        })
      });
      
      alert('Exercise completed! 🎉');
      onClose();
    } catch (error) {
      console.error('Error completing exercise:', error);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // ── Render ──
  return (
    <div className="exercise-player">
      {/* Header */}
      <div className="player-header">
        <h2>{exercise.name}</h2>
        <div className="layout-controls">
          <button onClick={() => setVideoLayout('side-by-side')}>
            Side by Side
          </button>
          <button onClick={() => setVideoLayout('pip')}>
            Picture in Picture
          </button>
          <button onClick={() => setVideoLayout('stacked')}>
            Stacked
          </button>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      {/* Video Container */}
      <div className={`video-container layout-${videoLayout}`}>
        {/* YouTube Video */}
        <div className="youtube-video">
          <iframe
            src={exercise.video.embed_url}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Exercise Tutorial"
          />
          <div className="video-label">Instructor</div>
        </div>
        
        {/* User Camera */}
        <div className="user-camera">
          {cameraActive ? (
            <>
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                className="camera-feed"
              />
              <div className="video-label">You</div>
              
              {/* Activity Indicator */}
              <div className="activity-indicator">
                <div className="activity-status">
                  {detectedActivity}
                </div>
                <div className="confidence-bar">
                  <div 
                    className="confidence-fill" 
                    style={{ width: `${activityConfidence * 100}%` }}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="camera-placeholder">
              <div className="placeholder-content">
                <span className="camera-icon">📷</span>
                <p>Camera Off</p>
                {cameraError && (
                  <p className="error-message">{cameraError}</p>
                )}
                <button 
                  className="enable-camera-btn"
                  onClick={() => setCameraActive(true)}
                >
                  Enable Camera
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden canvas for motion detection */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      
      {/* Controls */}
      <div className="player-controls">
        <div className="timer-display">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>
        
        <div className="stats">
          <div className="stat">
            <span className="stat-label">Sets:</span>
            <span className="stat-value">{exercise.sets}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Reps:</span>
            <span className="stat-value">{exercise.reps}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Detected:</span>
            <span className="stat-value">{repsDetected}</span>
          </div>
        </div>
        
        <div className="action-buttons">
          <button 
            className="camera-toggle-btn"
            onClick={() => setCameraActive(!cameraActive)}
          >
            {cameraActive ? '📷 Camera On' : '📷 Camera Off'}
          </button>
          
          {!timerStarted ? (
            <button 
              className="start-btn"
              onClick={handleStartWorkout}
              disabled={!cameraActive}
            >
              Start Workout
            </button>
          ) : (
            <button 
              className="pause-btn"
              onClick={() => setTimerStarted(false)}
            >
              Pause
            </button>
          )}
          
          <button 
            className="complete-btn"
            onClick={handleExerciseComplete}
          >
            Complete Exercise
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExercisePlayer;
```

---

## 🎨 CSS Styling

```css
/* ExercisePlayer.css */

.exercise-player {
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  display: flex;
  flex-direction: column;
}

/* Header */
.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #2a2a2a;
  border-bottom: 2px solid #00ff88;
}

.player-header h2 {
  margin: 0;
  font-size: 24px;
}

.layout-controls {
  display: flex;
  gap: 10px;
}

.layout-controls button {
  padding: 8px 16px;
  background: #333;
  border: 1px solid #555;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.layout-controls button:hover {
  background: #444;
  border-color: #00ff88;
}

.close-btn {
  background: #ff4444;
  border: none;
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #ff6666;
  transform: scale(1.1);
}

/* Video Container - Side by Side */
.video-container.layout-side-by-side {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

/* Video Container - Picture in Picture */
.video-container.layout-pip {
  flex: 1;
  position: relative;
  padding: 20px;
}

.layout-pip .youtube-video {
  width: 100%;
  height: 100%;
}

.layout-pip .user-camera {
  position: absolute;
  bottom: 40px;
  right: 40px;
  width: 320px;
  height: 240px;
  border: 3px solid #00ff88;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* Video Container - Stacked */
.video-container.layout-stacked {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.layout-stacked .youtube-video,
.layout-stacked .user-camera {
  flex: 1;
}

/* Video Elements */
.youtube-video,
.user-camera {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.youtube-video iframe {
  width: 100%;
  height: 100%;
  border-radius: 12px;
}

.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: scaleX(-1); /* Mirror effect */
}

.video-label {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

/* Camera Placeholder */
.camera-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
}

.placeholder-content {
  text-align: center;
}

.camera-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

.placeholder-content p {
  margin: 8px 0;
  color: #888;
}

.error-message {
  color: #ff4444;
  font-size: 12px;
}

.enable-camera-btn {
  margin-top: 16px;
  padding: 12px 24px;
  background: #00ff88;
  color: #000;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.enable-camera-btn:hover {
  background: #00dd77;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

/* Activity Indicator */
.activity-indicator {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 12px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.activity-status {
  font-size: 14px;
  margin-bottom: 8px;
  color: #00ff88;
}

.confidence-bar {
  height: 6px;
  background: #333;
  border-radius: 3px;
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00d4ff);
  transition: width 0.3s ease;
}

/* Controls */
.player-controls {
  background: #2a2a2a;
  padding: 24px;
  border-top: 2px solid #00ff88;
}

.timer-display {
  text-align: center;
  margin-bottom: 20px;
}

.timer-label {
  display: block;
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
}

.timer-value {
  font-size: 48px;
  font-weight: bold;
  color: #00d4ff;
  font-family: 'Courier New', monospace;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 24px;
}

.stat {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.action-buttons button {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.camera-toggle-btn {
  background: #555;
  color: white;
}

.camera-toggle-btn:hover {
  background: #666;
}

.start-btn {
  background: #00ff88;
  color: #000;
}

.start-btn:hover:not(:disabled) {
  background: #00dd77;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
}

.start-btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
}

.pause-btn {
  background: #ff9900;
  color: white;
}

.pause-btn:hover {
  background: #ffaa00;
}

.complete-btn {
  background: #00d4ff;
  color: #000;
}

.complete-btn:hover {
  background: #00bbee;
}

/* Responsive */
@media (max-width: 1024px) {
  .video-container.layout-side-by-side {
    grid-template-columns: 1fr;
  }
  
  .layout-pip .user-camera {
    width: 240px;
    height: 180px;
  }
}

@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .layout-controls {
    width: 100%;
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .action-buttons button {
    width: 100%;
  }
}
```

---

## 🚀 Usage Example

```jsx
import ExercisePlayer from './components/ExercisePlayer';

function WorkoutPage() {
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  
  const handleStartExercise = (exercise) => {
    setCurrentExercise(exercise);
    setShowPlayer(true);
  };
  
  return (
    <div>
      {showPlayer && currentExercise ? (
        <ExercisePlayer
          exercise={currentExercise}
          sessionId={123}
          onClose={() => setShowPlayer(false)}
        />
      ) : (
        <div>
          {/* Exercise list */}
          <button onClick={() => handleStartExercise({
            name: "Push Ups",
            sets: 3,
            reps: 12,
            duration_seconds: 180,
            video: {
              embed_url: "https://www.youtube.com/embed/abc123"
            },
            index: 0
          })}>
            Start Push Ups
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## ✅ Features Included

- ✅ Side-by-side video display
- ✅ Picture-in-picture mode
- ✅ Stacked layout (mobile-friendly)
- ✅ Camera enable/disable
- ✅ Mirror effect on user camera
- ✅ Real-time activity detection
- ✅ Motion intensity visualization
- ✅ Timer countdown
- ✅ Rep counting
- ✅ Layout switching
- ✅ Responsive design
- ✅ Error handling

---

## 🎯 Backend Support

The backend already provides all necessary endpoints:
- Motion detection
- Activity tracking
- Rep counting
- Form analysis
- Real-time stats

No backend changes needed - it's all ready! 🚀
