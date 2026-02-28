🩺 ArogyaMitra
AI-Powered Fitness & Wellness Platform

ArogyaMitra is a full-stack AI-powered fitness and wellness platform that provides personalized workout plans, Indian nutrition guidance, progress tracking, and an intelligent chatbot coach — all in one place.

🚀 Live Features

🏋️ Personalized 7-Day Workout Plans

🥗 Custom Indian Nutrition Plans

📊 Progress Tracking & Analytics

🤖 AI Chatbot Coach (ARO-mi)

🎯 Charity Points Reward System

📅 Optional Calendar Sync

🛒 Smart Shopping List Generation

🏆 Achievement & Streak Tracking

🧠 How It Works
User Registration
        ↓
Health Assessment (14 Questions)
        ↓
AI Generates:
   → 7-Day Workout Plan
   → 7-Day Nutrition Plan
        ↓
Dashboard Overview
        ↓
User Completes Workouts & Logs Meals
        ↓
Points + Stats Update
        ↓
Chat with ARO-mi for Guidance
📱 Complete User Journey
1️⃣ Registration & Login
New User

Visit: http://localhost:5173/

Register with name, email, username, password

Redirected to Health Assessment

Existing User

Visit: /login

Login with credentials

Redirected to Dashboard

2️⃣ Health Assessment (First-Time Setup)

📍 Route: /health-assessment

Users answer 14 questions including:

Age, Gender

Height, Weight

Fitness Level

Fitness Goal

Workout Preference

Medical Conditions

Allergies

Medications

Calendar Sync

After Submission:

Assessment saved

AI generates 7-day workout plan

AI generates 7-day nutrition plan

Redirect to Dashboard

3️⃣ Dashboard (/dashboard)
Displays:

Workouts Completed

Calories Burned

Current Streak

Charity Points

Features:

Today's Workout

Today's Nutrition

AI Chat Button (ARO-mi)

If no assessment → Prompt to complete setup.

4️⃣ Workouts Page (/workouts)

7-day AI-generated workout plan

Focus area per day

Exercise list (sets & reps)

Estimated calories

Mark workout as completed

Rewards:

+5 Charity Points per workout

5️⃣ Nutrition Page (/nutrition)

7-day AI-generated Indian meal plan

Calories, Protein, Carbs, Fats

Ingredients list

Weekly shopping list

Rewards:

+2 Charity Points per logged meal

6️⃣ Progress Page (/progress)

Total workouts

Total calories burned

Current streak

Weight tracking

Body fat tracking

Achievement badges

7️⃣ 🤖 ARO-mi AI Coach

Accessible from Dashboard.

Ask questions like:

“Best breakfast for weight loss?”

“Correct push-up form?”

“Adjust my plan for travel”

“Post-workout meal ideas?”

Powered by Llama 3.3 70B via Groq.

🎁 Charity Points System
Action	Points
Complete Workout	+5
Log Meal	+2
Burn 10 Calories	+1

Points motivate consistency and contribute toward donation-based initiatives.

🛠 Tech Stack
Frontend

React

Vite

Tailwind CSS

Backend

FastAPI

SQLite

Groq AI (Llama 3.3 70B)

Authentication

JWT-based authentication

📂 Project Structure
gen_ai/
│
├── backend/
│   ├── main.py
│   ├── models/
│   ├── routes/
│   ├── database.py
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   └── ...
│
└── USER_WORKFLOW.md
⚙️ Setup Instructions
1️⃣ Clone Repository
git clone https://github.com/Neha-2005-VCE/ArogyaMitra.git
cd ArogyaMitra
2️⃣ Backend Setup
cd gen_ai/backend
pip install -r requirements.txt

Create .env file:

GROQ_API_KEY=your_new_key_here
GOOGLE_CLIENT_ID=your_id_here
GOOGLE_CLIENT_SECRET=your_secret_here

Run backend:

uvicorn main:app --reload
3️⃣ Frontend Setup
cd gen_ai/frontend
npm install
npm run dev

Open:

http://localhost:5173
🔐 Environment Variables

Create .env in backend and frontend (if required).

Example:

GROQ_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
JWT_SECRET=

⚠️ Never commit .env to GitHub.

📊 Key Features

✅ AI-powered personalization
✅ Indian diet customization
✅ Real-time stats tracking
✅ Achievement & streak system
✅ AI chatbot integration
✅ Secure JWT authentication
✅ Clean modular architecture

🧩 Troubleshooting
Workout/Nutrition not generating

Ensure health assessment completed

Verify GROQ_API_KEY is valid

Check backend logs

AI not responding

Confirm backend running

Check .env configuration

🌟 Future Improvements

Mobile App (React Native)

Payment integration

Donation tracking dashboard

Community challenges

Wearable device integration

👩‍💻 Author

Neha
B.Tech Student | AI & Full-Stack Developer
GitHub: Neha-2005-VCE

📌 License

This project is for educational and development purposes.
