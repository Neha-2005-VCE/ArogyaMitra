# 📅 Google Calendar Integration - Complete Setup

## ✅ Implementation Status: COMPLETE

All Google Calendar endpoints are now live and ready to use!

---

## 🔌 Available Endpoints

### 1. GET `/api/calendar/test`
**Test configuration** (no auth required)
```bash
curl http://localhost:8000/api/calendar/test
```
Returns whether Google Calendar credentials are configured.

---

### 2. GET `/api/calendar/connect`
**Get OAuth URL** (requires auth)

Returns the Google authorization URL that users should visit.

**Response:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?...",
  "message": "Open this URL in your browser to authorize Google Calendar access",
  "user_id": 1
}
```

**Flow:**
1. User clicks "Connect Calendar" in your app
2. Frontend calls this endpoint
3. Frontend opens the `auth_url` in a new window
4. User authorizes on Google
5. Google redirects to `/api/calendar/callback`

---

### 3. GET `/api/calendar/callback`
**OAuth callback handler** (no auth required - called by Google)

Google redirects here after user authorizes.

**Query Parameters:**
- `code` - Authorization code from Google
- `state` - User ID (for CSRF protection)

**What it does:**
1. Exchanges code for access & refresh tokens
2. Stores tokens in user's database record
3. Returns success message

**Response:**
```json
{
  "success": true,
  "message": "✅ Google Calendar connected successfully!",
  "user_id": 1,
  "redirect": "You can close this window and return to the app"
}
```

---

### 4. POST `/api/calendar/save-tokens`
**Save tokens manually** (requires auth)

Alternative to callback - allows frontend to save tokens directly.

**Request Body:**
```json
{
  "access_token": "ya29.a0...",
  "refresh_token": "1//0g...",
  "token_uri": "https://oauth2.googleapis.com/token",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "expiry": "2024-12-31T23:59:59Z"
}
```

---

### 5. GET `/api/calendar/status`
**Check connection status** (requires auth)

Returns whether user has connected their Google Calendar.

**Response:**
```json
{
  "connected": true,
  "has_access_token": true,
  "has_refresh_token": true,
  "message": "Calendar connected"
}
```

---

### 6. POST `/api/calendar/disconnect`
**Disconnect calendar** (requires auth)

Removes stored tokens from user's account.

**Response:**
```json
{
  "success": true,
  "message": "Google Calendar disconnected"
}
```

---

### 7. POST `/api/calendar/sync-workout`
**Sync today's workout** (requires auth)

Creates a calendar event for the current workout plan.

**What it creates:**
- Event title: "💪 ArogyaMitra: [Focus Area]"
- Time: 7:00 AM - 8:00 AM (UTC)
- Description: Exercise list with sets/reps
- Color: Bold Green (#10)
- Reminder: 15 minutes before

**Response:**
```json
{
  "success": true,
  "message": "✅ Workout synced to Google Calendar!",
  "event_link": "https://calendar.google.com/calendar/event?eid=...",
  "workout_focus": "Upper Body Strength"
}
```

---

### 8. POST `/api/calendar/sync-full-plan`
**Sync workout + nutrition** (requires auth)

Syncs both workout and nutrition plans to Google Calendar.

**Response:**
```json
{
  "success": true,
  "message": "✅ Synced 2 items to Google Calendar!",
  "synced_events": [
    {
      "type": "workout",
      "title": "💪 Upper Body Strength",
      "link": "https://calendar.google.com/..."
    },
    {
      "type": "nutrition",
      "title": "🍽️ Meal Plan",
      "note": "Nutrition plan available in app"
    }
  ]
}
```

---

## 🔧 Configuration

### Environment Variables (`.env`)
```env
GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
GOOGLE_CALENDAR_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:8000/api/calendar/callback
```

### Get Google Calendar Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Calendar API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:8000/api/calendar/callback`
7. Copy Client ID and Client Secret to `.env`

---

## 🔄 Complete OAuth Flow

```
┌─────────────┐
│   User      │
│  clicks     │
│ "Connect"   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Frontend calls:                         │
│ GET /api/calendar/connect               │
│ → Returns auth_url                      │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Frontend opens auth_url in new window   │
│ User authorizes on Google               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ Google redirects to:                    │
│ GET /api/calendar/callback?code=...     │
│ → Exchanges code for tokens             │
│ → Saves tokens to user DB               │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│ User sees success message               │
│ Frontend checks status:                 │
│ GET /api/calendar/status                │
│ → { "connected": true }                 │
└─────────────────────────────────────────┘
```

---

## 🎯 Frontend Integration Example

```javascript
// 1. Connect Calendar
async function connectCalendar() {
  const response = await fetch('/api/calendar/connect', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  // Open Google auth in popup
  window.open(data.auth_url, 'Google Calendar', 'width=600,height=700');
}

// 2. Check Status
async function checkCalendarStatus() {
  const response = await fetch('/api/calendar/status', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data.connected;
}

// 3. Sync Workout
async function syncWorkout() {
  const response = await fetch('/api/calendar/sync-workout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log(data.message); // "✅ Workout synced to Google Calendar!"
}

// 4. Sync Full Plan
async function syncFullPlan() {
  const response = await fetch('/api/calendar/sync-full-plan', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log(data.synced_events);
}
```

---

## 🔐 Security Features

1. **CSRF Protection**: User ID passed as `state` parameter
2. **Token Refresh**: Automatic token refresh when expired
3. **Secure Storage**: Tokens stored in database, not exposed to frontend
4. **OAuth 2.0**: Industry-standard authorization flow
5. **Scopes**: Only requests `calendar.events` permission (minimal access)

---

## 🧪 Testing

### 1. Test Configuration
```bash
curl http://localhost:8000/api/calendar/test
```

### 2. Get Auth URL (with token)
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/calendar/connect
```

### 3. Check Status
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/calendar/status
```

### 4. Sync Workout
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:8000/api/calendar/sync-workout
```

---

## 📊 Database Schema

The User model includes these calendar fields:

```python
class User(Base):
    # ... other fields ...
    
    # Google Calendar Integration
    calendar_access_token = Column(String, nullable=True)
    calendar_refresh_token = Column(String, nullable=True)
    calendar_token_expiry = Column(String, nullable=True)
```

---

## ⚠️ Important Notes

1. **Redirect URI**: Must match exactly in Google Cloud Console and `.env`
2. **Token Refresh**: Tokens are automatically refreshed when expired
3. **Offline Access**: `access_type='offline'` ensures we get refresh token
4. **Prompt Consent**: `prompt='consent'` forces consent screen (ensures refresh token)
5. **State Parameter**: Contains user_id for CSRF protection

---

## 🎉 What's Synced to Calendar

### Workout Events:
- ✅ Event title with focus area
- ✅ Exercise list with sets/reps
- ✅ 7:00 AM - 8:00 AM time slot
- ✅ Bold green color
- ✅ 15-minute reminder
- ✅ Direct link to event

### Future Enhancements:
- Sync all 7 days of workout plan
- Sync meal times (breakfast, lunch, dinner)
- Custom event times based on user preference
- Recurring events for weekly plans

---

## 🚀 Ready to Use!

All 8 endpoints are live at `http://localhost:8000/docs`

Look for the **"Google Calendar"** section in the API documentation.

Test the flow:
1. `/api/calendar/test` - Check config
2. `/api/calendar/connect` - Get auth URL
3. Authorize on Google
4. `/api/calendar/status` - Verify connection
5. `/api/calendar/sync-workout` - Sync workout!

🎯 Your users can now sync their ArogyaMitra plans to Google Calendar!
