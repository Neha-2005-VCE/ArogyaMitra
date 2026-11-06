# 📅 Google Calendar API - Usage Guide

## ✅ Updated Calendar Router

The calendar router has been updated with a cleaner structure and in-memory token storage.

---

## 🔌 10 Available Endpoints

### 1. GET `/api/calendar/test`
Test if Google Calendar credentials are configured (no auth)

### 2. GET `/api/calendar/connect`
Get Google OAuth authorization URL (requires auth)

### 3. GET `/api/calendar/callback`
OAuth callback - Google redirects here (no auth)

### 4. POST `/api/calendar/save-tokens`
Link pending tokens to logged-in user (requires auth)

### 5. GET `/api/calendar/status`
Check if user has connected calendar (requires auth)

### 6. POST `/api/calendar/sync-workout`
Sync 7-day workout plan (requires auth)

### 7. POST `/api/calendar/sync-meals`
Sync 7-day meal plan (requires auth)

### 8. POST `/api/calendar/sync-full-plan`
Sync both workout + meals (requires auth)

### 9. POST `/api/calendar/clear`
Delete all ArogyaMitra events (requires auth)

### 10. DELETE `/api/calendar/disconnect`
Disconnect calendar (requires auth)

---

## 🔄 Complete Flow

### Step 1: Connect Calendar
```javascript
// Frontend: Get auth URL
const response = await fetch('/api/calendar/connect', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { auth_url } = await response.json();

// Open in popup
window.open(auth_url, 'Google Calendar', 'width=600,height=700');
```

### Step 2: OAuth Callback (Automatic)
Google redirects to `/api/calendar/callback?code=...`
- Backend exchanges code for tokens
- Stores as "pending"
- Redirects to frontend: `/dashboard?calendar=connected`

### Step 3: Save Tokens
```javascript
// Frontend: After redirect, link tokens to user
await fetch('/api/calendar/save-tokens', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

### Step 4: Sync Plans
```javascript
// Sync full plan (workout + meals)
await fetch('/api/calendar/sync-full-plan', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    workout_plan: {
      weekly_schedule: [
        {
          day: "Monday",
          focus: "Upper Body Strength",
          duration_minutes: 45,
          exercises: [
            { name: "Push-ups", sets: "3", reps: "12" },
            { name: "Dumbbell Press", sets: "4", reps: "10" }
          ],
          warmup: "5 min dynamic stretching",
          tips: "Focus on form over speed"
        },
        // ... more days
      ]
    },
    nutrition_plan: {
      weekly_plan: [
        {
          meals: [
            {
              meal_type: "Breakfast",
              name: "Poha with Peanuts",
              calories: "320",
              protein: "8g",
              carbs: "55g",
              fat: "7g"
            },
            // ... more meals
          ]
        },
        // ... more days
      ]
    },
    start_date: "2024-11-01",
    preferred_time: "06:00"
  })
});
```

---

## 📊 Request/Response Examples

### Sync Workout Only

**Request:**
```json
POST /api/calendar/sync-workout
{
  "workout_plan": {
    "weekly_schedule": [
      {
        "day": "Monday",
        "focus": "Upper Body",
        "duration_minutes": 45,
        "exercises": [
          { "name": "Push-ups", "sets": "3", "reps": "12" }
        ],
        "warmup": "5 min stretching",
        "tips": "Focus on form"
      }
    ]
  },
  "start_date": "2024-11-01",
  "preferred_time": "06:00"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "✅ 5 workout events added to your Google Calendar!",
  "details": {
    "created": 5,
    "failed": 0,
    "events": [
      { "day": "Monday", "date": "2024-11-01", "event_id": "abc123" }
    ],
    "errors": []
  }
}
```

---

### Sync Meals Only

**Request:**
```json
POST /api/calendar/sync-meals
{
  "nutrition_plan": {
    "weekly_plan": [
      {
        "meals": [
          {
            "meal_type": "Breakfast",
            "name": "Poha",
            "calories": "320",
            "protein": "8g",
            "carbs": "55g",
            "fat": "7g"
          }
        ]
      }
    ]
  },
  "start_date": "2024-11-01"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "✅ 21 meal reminders added to your Google Calendar!",
  "details": {
    "created": 21,
    "events": [
      { "date": "2024-11-01", "meal": "Breakfast" }
    ]
  }
}
```

---

### Sync Full Plan

**Request:**
```json
POST /api/calendar/sync-full-plan
{
  "workout_plan": { /* ... */ },
  "nutrition_plan": { /* ... */ },
  "start_date": "2024-11-01",
  "preferred_time": "06:00"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "✅ 26 events added to your Google Calendar!",
  "workouts_synced": 5,
  "meals_synced": 21
}
```

---

### Clear Events

**Request:**
```json
POST /api/calendar/clear
{
  "days_ahead": 30
}
```

**Response:**
```json
{
  "status": "success",
  "message": "🗑️ 26 ArogyaMitra events removed from your calendar."
}
```

---

## 🎯 What Gets Created in Google Calendar

### Workout Events:
- **Title:** `🏋️ Upper Body Strength — ArogyaMitra`
- **Time:** 6:00 AM - 6:45 AM (customizable)
- **Color:** Blue (Cardio = Orange, Strength = Lavender)
- **Description:**
  ```
  🏋️ ArogyaMitra Workout — Upper Body Strength
  
  ⏱ Duration: 45 minutes
  
  🔥 Warm-up: 5 min dynamic stretching
  
  💪 Exercises:
  • Push-ups — 3 sets × 12 reps
  • Dumbbell Press — 4 sets × 10 reps
  
  💡 Tip: Focus on form over speed
  
  Generated by ArogyaMitra - Your AI Fitness Companion
  ```
- **Reminders:** 10 min and 30 min before

### Meal Events:
- **Title:** `🥗 Breakfast: Poha with Peanuts — ArogyaMitra`
- **Time:** 7:00 AM - 7:30 AM
- **Color:** Yellow
- **Description:**
  ```
  🥗 ArogyaMitra Meal — Breakfast
  
  🍽️ Poha with Peanuts
  
  📊 Nutrition:
    • Calories: 320
    • Protein:  8g
    • Carbs:    55g
    • Fat:      7g
  
  Generated by ArogyaMitra - Your AI Fitness Companion
  ```
- **Reminder:** 15 min before

---

## 🔐 Token Storage

**Current Implementation:**
- In-memory dictionary: `_token_store[user_id] = tokens`
- Tokens stored temporarily during session
- "pending" key used between OAuth callback and user login

**Production Recommendation:**
- Store tokens in database (User model already has fields)
- Encrypt tokens before storage
- Implement token refresh logic
- Add token expiry handling

---

## ⚠️ Important Notes

1. **Token Persistence:** Current implementation uses in-memory storage. Tokens are lost on server restart. For production, store in database.

2. **Redirect URI:** Must match exactly in:
   - `.env` file
   - Google Cloud Console
   - Calendar service configuration

3. **CORS Origins:** Update `CORS_ORIGINS` in `.env` to match your frontend URL

4. **Timezone:** Events use `Asia/Kolkata` timezone. Adjust in `calendar_service.py` if needed.

5. **Event Limits:** Google Calendar API has rate limits. The service handles this gracefully.

---

## 🧪 Testing

### 1. Test Configuration
```bash
curl http://localhost:8000/api/calendar/test
```

### 2. Connect Calendar
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/calendar/connect
```

### 3. Check Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/calendar/status
```

### 4. Sync Full Plan
```bash
curl -X POST http://localhost:8000/api/calendar/sync-full-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d @full_plan.json
```

---

## 🎉 Result

After syncing, your Google Calendar will show:
- ✅ 5-7 workout events (skips rest days)
- ✅ 21 meal reminders (3 per day × 7 days)
- ✅ Color-coded for easy identification
- ✅ Detailed descriptions with exercises and nutrition
- ✅ Timely reminders
- ✅ Syncs across all devices

**Your calendar will look exactly like the screenshots you provided!** 📅
