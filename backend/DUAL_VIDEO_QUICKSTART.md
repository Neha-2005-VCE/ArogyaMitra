# 🎥 Dual Video Display - Quick Start Guide

## ✅ Backend is Already Ready!

The backend fully supports dual video display (YouTube + User Camera). All necessary endpoints are implemented and running.

---

## 🎯 What You Need to Do (Frontend Only)

### Step 1: Create the Component

```jsx
import React, { useState, useEffect, useRef } from 'react';

const DualVideoPlayer = ({ exercise }) => {
  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  
  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      userStreamRef.current = stream;
      userVideoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };
  
  useEffect(() => {
    return () => stopCamera();
  }, []);
  
  return (
    <div className="dual-video-container">
      {/* YouTube Video */}
      <div className="youtube-video">
        <iframe
          src={exercise.video.embed_url}
          width="100%"
          height="100%"
          frameBorder="0"
          allowFullScreen
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
              style={{ transform: 'scaleX(-1)' }} // Mirror effect
            />
            <div className="video-label">You</div>
          </>
        ) : (
          <button onClick={startCamera}>
            Enable Camera
          </button>
        )}
      </div>
    </div>
  );
};

export default DualVideoPlayer;
```

---

### Step 2: Add CSS

```css
.dual-video-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 100vh;
  padding: 20px;
  background: #1a1a1a;
}

.youtube-video,
.user-camera {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
}

.youtube-video iframe {
  width: 100%;
  height: 100%;
}

.user-camera video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-label {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
}
```

---

### Step 3: Add Motion Detection (Optional)

```jsx
// Add this to your component
const [motionIntensity, setMotionIntensity] = useState(0);

useEffect(() => {
  if (!cameraActive) return;
  
  const interval = setInterval(async () => {
    // Calculate motion from video frames
    const intensity = calculateMotion(); // Your logic here
    
    // Send to backend
    const response = await fetch('/api/workout-session/motion/detect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        motion_intensity: intensity,
        camera_active: true
      })
    });
    
    const data = await response.json();
    console.log('Activity:', data.message);
  }, 1000);
  
  return () => clearInterval(interval);
}, [cameraActive]);
```

---

## 🎨 Layout Options

### Option 1: Side-by-Side (Default)
```css
.dual-video-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
```

### Option 2: Picture-in-Picture
```css
.dual-video-container {
  position: relative;
}

.youtube-video {
  width: 100%;
  height: 100%;
}

.user-camera {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 240px;
  border: 3px solid #00ff88;
}
```

### Option 3: Stacked (Mobile)
```css
.dual-video-container {
  display: flex;
  flex-direction: column;
}
```

---

## 🔌 Backend Endpoints (Already Available)

### Motion Detection
```javascript
POST /api/workout-session/motion/detect
{
  "motion_intensity": 0.75,
  "camera_active": true
}
```

### Rep Counting
```javascript
POST /api/workout-session/motion/count-rep
{
  "exercise_name": "Push Ups",
  "current_angle": 85
}
```

### Form Analysis
```javascript
POST /api/workout-session/motion/analyze-form
{
  "exercise_name": "Push Ups"
}
```

### Real-time Stats
```javascript
GET /api/workout-session/{session_id}/real-time-stats
```

---

## 📱 Complete Example

```jsx
import React, { useState, useEffect, useRef } from 'react';
import './DualVideo.css';

const DualVideoPlayer = ({ exercise, sessionId }) => {
  const userVideoRef = useRef(null);
  const userStreamRef = useRef(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [detectedActivity, setDetectedActivity] = useState('Idle');
  const [repsDetected, setRepsDetected] = useState(0);
  
  // Camera management
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 }
      });
      userStreamRef.current = stream;
      userVideoRef.current.srcObject = stream;
      setCameraActive(true);
    } catch (error) {
      alert('Camera access denied');
    }
  };
  
  const stopCamera = () => {
    if (userStreamRef.current) {
      userStreamRef.current.getTracks().forEach(t => t.stop());
    }
  };
  
  // Motion detection loop
  useEffect(() => {
    if (!cameraActive) return;
    
    const interval = setInterval(async () => {
      const intensity = Math.random() * 0.5 + 0.3; // Replace with real calculation
      
      const res = await fetch('/api/workout-session/motion/detect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          motion_intensity: intensity,
          camera_active: true
        })
      });
      
      const data = await res.json();
      setDetectedActivity(data.message);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [cameraActive]);
  
  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);
  
  return (
    <div className="dual-video-player">
      <div className="video-grid">
        {/* YouTube Video */}
        <div className="video-panel youtube">
          <iframe
            src={exercise.video.embed_url}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          <div className="label">Instructor</div>
        </div>
        
        {/* User Camera */}
        <div className="video-panel camera">
          {cameraActive ? (
            <>
              <video
                ref={userVideoRef}
                autoPlay
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
              />
              <div className="label">You</div>
              <div className="activity-badge">{detectedActivity}</div>
            </>
          ) : (
            <div className="camera-off">
              <button onClick={startCamera}>
                📷 Enable Camera
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div className="stats-bar">
        <div className="stat">
          <span>Exercise:</span>
          <strong>{exercise.name}</strong>
        </div>
        <div className="stat">
          <span>Reps Detected:</span>
          <strong>{repsDetected}</strong>
        </div>
        <div className="stat">
          <span>Activity:</span>
          <strong>{detectedActivity}</strong>
        </div>
      </div>
    </div>
  );
};

export default DualVideoPlayer;
```

---

## 🎨 CSS

```css
.dual-video-player {
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
}

.video-panel {
  position: relative;
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.video-panel iframe,
.video-panel video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.label {
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  backdrop-filter: blur(10px);
}

.activity-badge {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  background: rgba(0, 255, 136, 0.9);
  padding: 12px;
  border-radius: 8px;
  color: #000;
  font-weight: 600;
  text-align: center;
}

.camera-off {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
}

.camera-off button {
  padding: 16px 32px;
  background: #00ff88;
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.camera-off button:hover {
  background: #00dd77;
  transform: translateY(-2px);
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: #2a2a2a;
  border-top: 2px solid #00ff88;
}

.stat {
  text-align: center;
  color: white;
}

.stat span {
  display: block;
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
}

.stat strong {
  font-size: 20px;
  color: #00ff88;
}

/* Responsive */
@media (max-width: 768px) {
  .video-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## ✅ That's It!

The backend is already complete. Just:
1. Copy the React component
2. Add the CSS
3. Use it in your app

**Backend endpoints are ready and waiting!** 🚀

---

## 📖 Full Documentation

For complete implementation details, see:
- `DUAL_VIDEO_IMPLEMENTATION.md` - Complete guide
- `EXERCISE_PLAYER_API.md` - All API endpoints
- `EXERCISE_PLAYER_COMPLETE.md` - Full features list

---

## 🎯 Backend Status

✅ Motion detection API - Ready
✅ Activity tracking - Ready
✅ Rep counting - Ready
✅ Form analysis - Ready
✅ Real-time stats - Ready
✅ Camera support - Ready

**Server:** http://localhost:8000
**Docs:** http://localhost:8000/docs

Everything is ready on the backend side! 🎉
