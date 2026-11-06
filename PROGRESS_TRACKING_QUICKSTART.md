# Progress Tracking - Quick Start Guide

## What's Been Implemented

### Backend (FastAPI)
✅ 4 new API endpoints for Progress Tracking component:
- `GET /api/progress/overview?period={week|month|3months|year}` - Overview stats
- `GET /api/progress/workouts?period={week|month|3months|year}` - Workout history
- `GET /api/progress/nutrition?period={week|month|3months|year}` - Nutrition data
- `GET /api/progress/body-metrics?period={week|month|3months|year}` - Body metrics

✅ Updated achievements endpoint to return 11 achievements matching frontend

### Frontend (React + Vite)
✅ New `ProgressTracking.jsx` component with 5 tabs
✅ Updated `Progress.jsx` page to use new component
✅ Updated `api.js` with new API methods
✅ Responsive design with Tailwind CSS
✅ Charts using Recharts library

## How to Run

### 1. Start Backend
```bash
cd ArogyaMitra/backend
python main.py
```
Backend will run on: `http://localhost:8000`

### 2. Start Frontend
```bash
cd ArogyaMitra/frontend
npm run dev
```
Frontend will run on: `http://localhost:5173` (or the port shown in terminal)

### 3. Access Progress Tracking
1. Open browser to frontend URL
2. Login with your credentials
3. Click "Progress" in the sidebar
4. Explore the 5 tabs:
   - Overview
   - Workouts
   - Nutrition
   - Body Metrics
   - Achievements

## API Testing

### Swagger UI
Open `http://localhost:8000/docs` to test all endpoints interactively.

### Example API Calls

#### Get Overview
```bash
curl -X GET "http://localhost:8000/api/progress/overview?period=week" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Workouts
```bash
curl -X GET "http://localhost:8000/api/progress/workouts?period=month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Achievements
```bash
curl -X GET "http://localhost:8000/api/progress/achievements" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Log Progress
```bash
curl -X POST "http://localhost:8000/api/progress/log" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calories_burned": 250,
    "workout_completed": true,
    "meal_tracked": true,
    "weight": 75.5,
    "notes": "Morning run"
  }'
```

## Features

### Period Selection
Switch between Week, Month, 3 Months, and Year views

### Overview Tab
- Total workouts count
- Total calories burned
- Current streak
- Weekly goal progress
- Workout activity chart

### Workouts Tab
- Workout history list
- Calories burned chart

### Nutrition Tab
- Nutrition adherence chart
- Average calories, protein, adherence

### Body Metrics Tab
- Weight trend chart
- Current weight, weight change, BMI

### Achievements Tab
- 11 achievements with unlock status
- Progress bar showing completion

## Troubleshooting

### No Data Showing?
You need to log some progress first:
1. Complete a workout
2. Use the `/api/progress/log` endpoint to record it
3. Refresh the Progress page

### API Errors?
- Make sure backend is running on port 8000
- Check you're logged in (token in localStorage)
- Verify CORS settings in backend `.env`

### Frontend Not Loading?
- Check `npm run dev` output for errors
- Verify all dependencies are installed: `npm install`
- Clear browser cache and reload

## Next Steps

1. Log some workout data to see charts populate
2. Track meals to see nutrition metrics
3. Log weight to see body metrics trend
4. Complete workouts to unlock achievements

## Links

- Backend API Docs: http://localhost:8000/docs
- Frontend App: http://localhost:5173
- Progress Page: http://localhost:5173/progress (after login)
