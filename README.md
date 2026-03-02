🩺 ArogyaMitra – AI-Powered Fitness & Wellness Platform

ArogyaMitra is a full-stack AI-powered fitness and wellness platform that delivers personalized workout plans, Indian nutrition guidance, intelligent progress tracking, and an AI chatbot coach — all in one integrated system.

Built with React + FastAPI + Groq (Llama 3.3 70B), the platform provides a complete digital wellness experience with gamification and charity-driven motivation.

🚀 Live Features

🏋️ AI-Generated 7-Day Workout Plans

🥗 AI-Customized Indian Nutrition Plans

📊 Real-Time Progress Tracking & Analytics

🤖 AI Chatbot Coach (ARO-mi)

🎯 Charity Points Reward System

📅 Optional Google Calendar Sync

🛒 Smart Weekly Shopping List Generator

🏆 Streaks & Achievement Badges

🔐 Secure JWT Authentication

🧠 How It Works
User Flow

Registration/Login
        ↓
Health Assessment (14 Questions)
        ↓
AI Generates:
   → 7-Day Workout Plan
   → 7-Day Nutrition Plan
        ↓
Dashboard Overview
        ↓
User Logs Workouts & Meals
        ↓
Stats + Charity Points Update
        ↓
Chat with ARO-mi for Guidance

🛠 Tech Stack

Frontend: React, Vite, Tailwind CSS
Backend: FastAPI, SQLite
AI: Groq (Llama 3.3 70B)
Auth: JWT

📂 Project Structure

ArogyaMitra/
│
├── gen_ai/
│   ├── backend/
│   └── frontend/
│
└── README.md

⚙️ Setup Guide
1️⃣ Clone Repository

git clone https://github.com/Neha-2005-VCE/ArogyaMitra.git
cd ArogyaMitra

2️⃣ Backend Setup
cd gen_ai/backend
pip install -r requirements.txt

Create .env inside backend:

GROQ_API_KEY=your_key
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
JWT_SECRET=your_secret

Run backend:

uvicorn main:app --reload

Runs at: http://127.0.0.1:8000

3️⃣ Frontend Setup
cd gen_ai/frontend
npm install
npm run dev

Runs at: http://localhost:5173

🧩 Troubleshooting

Ensure health assessment is completed.

Verify GROQ_API_KEY is valid.

Check backend logs if AI doesn’t respond.
