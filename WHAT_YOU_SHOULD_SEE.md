# 👀 What You Should See - Camera Integration

## 🎯 Expected Behavior

When you navigate to the Workout Session page, here's EXACTLY what should happen:

### Step 1: Page Loads
```
┌─────────────────────────────────────┐
│  Workout Session              [X]   │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Exercise 1 of 5                    │
└─────────────────────────────────────┘
```

### Step 2: Camera Permission Popup (First Time Only)
```
┌─────────────────────────────────────┐
│  localhost wants to:                │
│  • Use your camera                  │
│                                     │
│  [Block]  [Allow]                   │
└─────────────────────────────────────┘
```
**Click "Allow"**

### Step 3: Camera Starts (Within 1-2 seconds)
```
┌─────────────────────────────────────┬──────────────┐
│  ┌─────────────────────────────┐   │              │
│  │ [LIVE] 🔴                   │   │  00:00       │
│  │                             │   │              │
│  │    YOUR CAMERA FEED         │   │  Sets: 0     │
│  │    (You should see          │   │  Reps: 0     │
│  │     yourself here!)         │   │  Cal: 0      │
│  │                             │   │              │
│  │                        [0]  │   │  [▶ Start]   │
│  │                       Reps  │   │              │
│  └─────────────────────────────┘   │  [🎯 Enable  │
│                                     │   Tracking]  │
│  ┌──────────┐  ┌──────────────┐   │              │
│  │ YouTube  │  │ Exercise Info│   │  ✓ Camera    │
│  │ Video    │  │ 3 Sets       │   │  Connected   │
│  └──────────┘  └──────────────┘   │              │
└─────────────────────────────────────┴──────────────┘
```

## 🔍 Key Visual Elements

### 1. Large Camera Feed (Top Left)
- **Size**: Large, main focus area
- **Content**: Live video from your webcam
- **Background**: Black
- **Border**: Rounded corners with border

### 2. LIVE Badge (Top-Left of Camera)
- **Color**: Red background
- **Text**: "LIVE" in white
- **Icon**: Pulsing white dot
- **Position**: Top-left corner of camera feed

### 3. Rep Counter (Bottom-Left of Camera)
- **Appears**: When workout is playing
- **Shows**: Current rep count (0, 1, 2, etc.)
- **Style**: Large white number on dark background
- **Position**: Bottom-left corner of camera feed

### 4. Tracking Badge (Top-Right of Camera)
- **Appears**: When auto-tracking is enabled
- **Color**: Green background
- **Text**: "Tracking" with activity icon
- **Animation**: Pulsing icon

### 5. YouTube Video (Below Camera)
- **Size**: Smaller than camera
- **Position**: Bottom-left area
- **Label**: "Reference Video"

### 6. Camera Status Card (Right Side)
- **When Ready**: Green border, "✓ Camera connected and ready"
- **When Not Ready**: Red border, "⚠ Waiting for camera access..."

## 🚫 What If Camera Doesn't Start?

You'll see this instead:
```
┌─────────────────────────────────────┐
│  ┌─────────────────────────────┐   │
│  │         📹                  │   │
│  │   Starting camera...        │   │
│  │                             │   │
│  │  [Retry Camera Access]      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

**Click "Retry Camera Access"** to try again.

## ✅ Success Indicators

You know it's working when you see:

1. ✅ **Your face/body** in the large video feed
2. ✅ **Red "LIVE" badge** in top-left corner
3. ✅ **Green camera status** card saying "Camera connected and ready"
4. ✅ **"Enable Auto-Tracking" button** is clickable (not grayed out)
5. ✅ **Toast notification**: "Camera connected! 📹"

## ❌ Problem Indicators

Something's wrong if you see:

1. ❌ Gray/black screen with camera icon
2. ❌ "Starting camera..." message stays forever
3. ❌ Red camera status card
4. ❌ Toast error: "Please allow camera access"
5. ❌ No "LIVE" badge appears

## 🔧 Quick Fixes

### If you see gray screen:
1. **Hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check permissions**: Click lock icon → Camera → Allow
3. **Close other apps**: Zoom, Teams, etc.

### If permission popup doesn't appear:
1. **Check URL**: Must be localhost or https://
2. **Reset permissions**: Browser settings → Site settings → Camera → Reset
3. **Try different browser**: Chrome, Firefox, Edge

### If "Retry Camera Access" button doesn't work:
1. **Open browser console** (F12)
2. **Look for errors** (red text)
3. **Check camera in other apps** (Windows Camera app, Photo Booth on Mac)

## 🎬 Full Workflow

1. **Navigate**: Workouts → Start Workout
2. **Permission**: Click "Allow" on camera popup
3. **Wait**: 1-2 seconds for camera to start
4. **Verify**: See yourself in large video feed
5. **Start**: Click "▶ Start Exercise" button
6. **Track**: Click "Enable Auto-Tracking"
7. **Watch**: Rep counter increases automatically
8. **Complete**: Sets auto-complete when target reached

## 📱 Mobile vs Desktop

### Desktop (Recommended)
- Large camera feed
- Side-by-side layout
- Better tracking accuracy

### Mobile
- Stacked layout
- Camera on top
- YouTube below
- May need to allow camera in mobile browser settings

## 🎯 Test Checklist

- [ ] Page loads without errors
- [ ] Camera permission popup appears
- [ ] Click "Allow" on permission
- [ ] Camera feed shows within 2 seconds
- [ ] See yourself in the video
- [ ] "LIVE" badge appears (red)
- [ ] Camera status shows green checkmark
- [ ] YouTube video loads below
- [ ] Click "Start Exercise" - timer starts
- [ ] Click "Enable Auto-Tracking" - green badge appears
- [ ] Rep counter shows on video
- [ ] Reps increase automatically

## 🔗 Direct Links

- **Main App**: http://localhost:5173
- **Workout Plans**: http://localhost:5173/workouts
- **Camera Test**: Open `camera-test.html` in browser

## 💡 Pro Tips

1. **Good lighting** helps with motion detection
2. **Position yourself** so full body is visible
3. **Stable camera** (laptop on desk, not handheld)
4. **Clear background** for better tracking
5. **Wear contrasting colors** (not same as background)

## 🆘 Still Not Working?

1. Open `camera-test.html` in browser
2. Click "Start Camera"
3. If it works there → App issue (hard refresh)
4. If it doesn't work → Browser/camera issue (check permissions)

## 📞 Debug Info to Check

Open browser console (F12) and look for:
```
🎥 Attempting to start camera...
📹 Requesting camera permissions...
✅ Camera stream obtained: MediaStream {...}
✅ Camera connected to video element
```

If you see these logs, camera is working! Just need to see it on screen (hard refresh).

---

**Remember**: The camera integration IS implemented and working. If you don't see it, it's a browser cache or permission issue, not a code issue. Do a hard refresh first!
