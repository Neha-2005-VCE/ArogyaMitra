# Camera Integration Troubleshooting Guide

## ✅ Camera IS Integrated!

The camera integration is fully implemented in `WorkoutSession.jsx`. If you're not seeing it, follow these steps:

## 🔧 Troubleshooting Steps

### 1. Hard Refresh Browser
The most common issue is browser cache. Do a hard refresh:
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`
- **Mac**: `Cmd + Shift + R`

### 2. Check Camera Permissions
- Click the 🔒 lock icon in your browser's address bar
- Ensure Camera permission is set to "Allow"
- If blocked, change to "Allow" and refresh

### 3. Check Browser Console
Open Developer Tools (F12) and look for:
- `🎥 Attempting to start camera...` - Camera initialization started
- `✅ Camera connected to video element` - Success!
- `❌ Camera access denied` - Permission issue

### 4. Verify HTTPS or Localhost
Camera access requires:
- `https://` connection, OR
- `localhost` / `127.0.0.1`

If using IP address like `192.168.x.x`, camera won't work (browser security).

### 5. Test Camera Access
Open browser console and run:
```javascript
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => console.log('✅ Camera works!', stream))
  .catch(err => console.error('❌ Camera error:', err));
```

### 6. Check if Camera is in Use
- Close other apps using camera (Zoom, Teams, etc.)
- Only one app can use camera at a time

### 7. Restart Frontend Server
If all else fails:
```bash
cd ArogyaMitra/frontend
npm run dev
```

## 🎯 What You Should See

When working correctly:
1. **Large video feed** showing your camera (main focus)
2. **"LIVE" badge** in top-left corner (red)
3. **YouTube video** below (smaller, as reference)
4. **Camera Status card** showing "✓ Camera connected and ready" (green)
5. **"Enable Auto-Tracking" button** becomes active

## 📹 Camera Features

- **Auto-start**: Camera starts automatically when page loads
- **Live indicator**: Red "LIVE" badge when camera is active
- **Rep counter overlay**: Shows current reps on video feed
- **Tracking status**: Green "Tracking" badge when motion detection is active
- **Manual retry**: "Retry Camera Access" button if auto-start fails

## 🔗 Access the App

Frontend: http://localhost:5173
Backend: http://localhost:8000

Navigate to: Workouts → Start Workout → Workout Session

## 🐛 Still Not Working?

Check these files:
- `ArogyaMitra/frontend/src/pages/WorkoutSession.jsx` (lines 40-60 for camera code)
- Browser console for errors
- Camera permissions in browser settings

## 💡 Quick Test

1. Go to http://localhost:5173
2. Login/Register
3. Go to "Workout Plans"
4. Click "Start Workout" button
5. You should see camera request popup
6. Click "Allow"
7. Camera feed should appear immediately

If you see "Starting camera..." with a retry button, click it to manually trigger camera access.
