# ArogyaMitra - Complete User Guide 🏋️‍♂️

## Quick Start (3 Steps)

### Step 1: Start Servers
```bash
# Terminal 1 - Backend
cd ArogyaMitra/backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd ArogyaMitra/frontend
npm run dev
```

### Step 2: Open Application
Open your browser and go to: **http://localhost:5173**

### Step 3: Create Account
1. Click "Get Started" or "Register"
2. Fill in your details
3. Click "Create Account"
4. You'll be redirected to Dashboard

---

## Complete Feature Walkthrough

### 1. Registration & Login ✅

**Register New Account:**
1. Go to http://localhost:5173/register
2. Enter:
   - Email (e.g., john@example.com)
   - Username (e.g., john123)
   - Password (min 6 characters)
   - Full Name (optional)
3. Click "Create Account"
4. Automatically logged in → Dashboard

**Login:**
1. Go to http://localhost:5173/login
2. Enter username/email and password
3. Click "Login"
4. Redirected to Dashboard

---

### 2. Health Assessment ✅

**Complete Your Profile:**
1. From Dashboard, click "Health Assessment" card
2. Fill out the form:
   - **Personal**: Age, Gender, Height (cm), Weight (kg)
   - **Fitness**: Current level (Beginner/Intermediate/Advanced)
   - **Goals**: Weight loss, Muscle gain, Maintenance, Endurance
   - **Preferences**: Home/Gym workouts, Workout time
   - **Medical**: Health conditions, injuries, allergies (optional)
3. Click "Submit Assessment"
4. See your BMI calculated automatically
5. Profile updated for personalized plans

**What Happens:**
- BMI = weight / (height/100)²
- Stored in database
- Used for AI workout/nutrition generation
- Updates your user profile

---

### 3. Workout Plans ✅

**Generate Your Workout Plan:**
1. Go to Dashboard → Click "Workouts" in sidebar
2. Click "Generate New Plan" button
3. Wait 5-10 seconds (AI is generating)
4. See your 7-day workout plan

**View Today's Workout:**
1. Click "Today" tab (default)
2. See:
   - Focus area (e.g., "Chest & Triceps")
   - Duration (e.g., 45 minutes)
   - Exercise list with sets/reps
   - Warmup and cool-down instructions

**Watch Exercise Videos:**
1. Click the Play ▶️ button on any exercise
2. YouTube video modal opens
3. Watch proper form demonstration
4. If video unavailable, click "Search on YouTube"

**Mark Exercise Complete:**
1. Click the ✓ button on exercise
2. Adds to your progress
3. Earns charity points (+5 per exercise)
4. Updates total workouts counter

**View Week Plan:**
1. Click "This Week" tab
2. See all 7 days
3. Click any day to expand
4. View exercises for that day

**Start Live Workout:**
1. Click "Start Workout" button
2. Goes to Workout Session page
3. Camera auto-starts (large view)
4. YouTube video plays (side reference)
5. Track reps and sets in real-time

---

### 4. Nutrition Plans ✅

**Generate Meal Plan:**
1. Go to "Nutrition" in sidebar
2. Click "Generate New Plan"
3. AI creates 7-day Indian meal plan
4. See breakfast, lunch, dinner, snacks

**View Today's Meals:**
1. Click "Today" tab
2. See 4 meal cards:
   - 🌅 Breakfast
   - ☀️ Lunch
   - 🌙 Dinner
   - 🍎 Snacks
3. Each shows:
   - Meal name
   - Calories
   - Protein, Carbs, Fat (macros)
   - Ingredients

**Log Meal:**
1. Click ✓ button on meal card
2. Marks meal as completed
3. Adds to nutrition tracking

**View Week Meals:**
1. Click "This Week" tab
2. See all 7 days
3. Click day to expand
4. View all meals for that day

**Shopping List:**
1. Click "Shopping List" tab
2. See all ingredients needed
3. Click "Buy" button on ingredient
4. Opens BigBasket with search

---

### 5. Google Calendar Integration ✅

**Connect Calendar:**
1. Go to Dashboard
2. Find "Google Calendar" card
3. Click "Connect Google Calendar"
4. New window opens with Google login
5. Select your Google account
6. Click "Allow" to grant permissions
7. Window closes automatically
8. See "✅ Calendar Connected"

**What It Does:**
- Syncs your workout schedule
- Creates events for each workout
- Sends reminders before workouts
- Updates automatically

**Create Workout Event:**
1. After connecting, workouts auto-sync
2. Or manually create via API
3. Events appear in Google Calendar
4. Get notifications on phone

---

### 6. Progress Tracking ✅

**View Progress:**
1. Go to "Progress" in sidebar
2. See 5 tabs:

**Overview Tab:**
- Total workouts completed
- Calories burned
- Current streak (days)
- Meals tracked
- Charity donations
- Weekly summary chart

**Workouts Tab:**
- Exercise history
- Workout duration
- Calories per workout
- Completion rate
- Bar chart visualization

**Nutrition Tab:**
- Meal logs
- Daily calorie intake
- Macro breakdown (P/C/F)
- Meal completion rate

**Body Metrics Tab:**
- Weight tracking over time
- BMI changes
- Body measurements
- Progress photos (coming soon)

**Achievements Tab:**
- 11 achievements to unlock:
  - First Workout
  - 7-Day Streak
  - 30-Day Streak
  - 100 Workouts
  - 1000 Calories Burned
  - Perfect Week
  - Early Bird
  - Nutrition Master
  - Charity Champion
  - Consistency King
  - Transformation
- Progress bars for each
- Unlock rewards

**Refresh Data:**
- Click refresh button (top right)
- Updates all stats
- Fetches latest data

---

### 7. AI Coach (AROMI) ✅

**Chat with AROMI:**
1. Go to "AI Coach" in sidebar
2. See welcome message
3. Type your question or concern

**Quick Prompts:**
Click any scenario button:
- ✈️ Traveling tomorrow
- 🦵 Knee pain today
- 😴 Feeling fatigued
- ⏰ Busy week
- 💧 Hydration check
- 🍛 Meal swap

**Ask Anything:**
- "I'm traveling, what workout can I do?"
- "My knee hurts, what's safe?"
- "I'm too tired to workout today"
- "Give me a 15-minute routine"
- "What should I eat for protein?"
- "How much water should I drink?"

**AROMI Features:**
- Hinglish personality (Namaste, ji, bilkul)
- Context-aware responses
- Remembers conversation (last 12 messages)
- Suggests plan adjustments
- Provides motivation
- Answers health questions

**Plan Adjustment:**
1. AROMI may suggest updating your plan
2. Modal appears: "Update Your Plan?"
3. Click "Yes, update ✓"
4. Plan adjusts based on your situation
5. Check "Today" tab for new routine

---

### 8. Workout Session (Live Tracking) ✅

**Start Workout:**
1. Go to Workouts → Today
2. Click "Start Workout" button
3. Workout Session page loads

**Camera Setup:**
1. Browser asks for camera permission
2. Click "Allow"
3. Camera starts automatically
4. Large view (main focus)
5. See yourself in real-time

**YouTube Video:**
1. Exercise video plays automatically
2. Smaller view (side reference)
3. Watch proper form
4. Pause/play controls

**Track Progress:**
1. See current exercise name
2. Sets and reps displayed
3. Rest timer between sets
4. Complete set button
5. Skip exercise option

**Motion Detection:**
1. AI analyzes your form
2. Counts reps automatically
3. Provides feedback
4. Tracks calories burned

**Complete Workout:**
1. Finish all exercises
2. See summary screen
3. Total time, calories, exercises
4. Charity points earned
5. Save to progress

---

### 9. Profile Management ✅

**View Profile:**
1. Click profile icon (top right)
2. Or go to "Profile" in sidebar
3. See your stats:
   - Total workouts
   - Streak points
   - Charity donations

**Edit Profile:**
1. Update fields:
   - Full Name
   - Age, Gender
   - Height, Weight
   - Fitness Level
   - Fitness Goal
   - Bio
2. Click "Save Changes"
3. Profile updated

**Logout:**
1. Click "Logout" in sidebar
2. Redirected to login page
3. Session cleared

---

## Charity Impact 💚

**How It Works:**
- Every 10 calories burned = ₹1 donated
- Automatic calculation
- Tracks total donations
- See impact on Dashboard

**Example:**
- Burn 500 calories → ₹50 donated
- Complete 10 workouts → ₹50+ donated
- Your fitness helps others!

---

## Keyboard Shortcuts

**Chat (AROMI):**
- `Enter` - Send message
- `Shift + Enter` - New line

**Navigation:**
- Click sidebar links
- Or use browser back/forward

---

## Tips & Best Practices

### For Best Results:

**Workouts:**
1. Complete health assessment first
2. Generate plan based on your level
3. Watch videos for proper form
4. Track every exercise
5. Rest on rest days

**Nutrition:**
1. Log all meals
2. Follow macro targets
3. Use shopping list
4. Adjust for allergies
5. Stay hydrated

**Progress:**
1. Check daily
2. Celebrate achievements
3. Track weight weekly
4. Take progress photos
5. Stay consistent

**AI Coach:**
1. Be specific in questions
2. Mention injuries/limitations
3. Ask for modifications
4. Request meal swaps
5. Get motivation

---

## Troubleshooting

### Issue: Can't login
**Solution:** 
- Check username/password
- Try email instead of username
- Register if new user

### Issue: No workout plan
**Solution:**
- Click "Generate New Plan"
- Complete health assessment first
- Check internet connection

### Issue: YouTube video not loading
**Solution:**
- Check internet connection
- Click "Search on YouTube" fallback
- Try different exercise

### Issue: Camera not starting
**Solution:**
- Grant camera permission
- Use Chrome/Firefox
- Check camera not in use
- Reload page

### Issue: Google Calendar not connecting
**Solution:**
- Allow popup windows
- Complete OAuth flow
- Check Google account permissions
- Try again

### Issue: AROMI not responding
**Solution:**
- Check internet connection
- Wait a few seconds
- Refresh page
- Try again

---

## Data Privacy

**What We Store:**
- Your profile information
- Workout and nutrition plans
- Progress data
- Chat history with AROMI
- Google Calendar tokens (encrypted)

**What We Don't Store:**
- Credit card information
- Camera recordings
- Sensitive medical data
- Third-party credentials

**Security:**
- Passwords hashed with bcrypt
- JWT token authentication
- HTTPS recommended
- Data encrypted at rest

---

## Support

**Need Help?**
- Check this guide first
- Review troubleshooting section
- Check API documentation: http://localhost:8000/docs
- Contact support (if available)

**Report Bugs:**
- Note the page/feature
- Describe what happened
- Include error messages
- Share screenshots

---

## Conclusion

You now have everything you need to use ArogyaMitra! 🎉

**Remember:**
1. Complete health assessment
2. Generate workout and nutrition plans
3. Track your progress daily
4. Chat with AROMI for guidance
5. Stay consistent
6. Make an impact through charity

**Your fitness journey starts now!** 💪

---

**Quick Links:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
