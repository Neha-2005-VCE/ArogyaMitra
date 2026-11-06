from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
import json
import asyncio

from app.database import get_db
from app.models.user import User, WorkoutPlan, ProgressRecord
from app.routers.auth import get_current_user
from app.services.youtube_service import youtube_service

router = APIRouter()

class CompleteExerciseRequest(BaseModel):
    exercise_id: Optional[str] = None
    calories_burned: Optional[float] = 0
    duration_minutes: Optional[int] = 0

@router.post("/generate")
async def generate_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        from app.services.ai_agent import ai_agent
        user_data = {
            "age": current_user.age,
            "gender": current_user.gender,
            "fitness_level": str(current_user.fitness_level.value if current_user.fitness_level else "beginner"),
            "fitness_goal": str(current_user.fitness_goal.value if current_user.fitness_goal else "maintenance"),
            "workout_preference": str(current_user.workout_preference.value if current_user.workout_preference else "home"),
            "weight": current_user.weight,
            "height": current_user.height,
        }
        plan = ai_agent.generate_workout_plan(user_data)
    except Exception as e:
        print(f"AI error: {e}")
        plan = get_fallback_plan()

    # ── NEW: Add YouTube video links to exercises ──
    try:
        for day in plan.get("days", []):
            for exercise in day.get("exercises", []):
                exercise_name = exercise.get("name", "")
                if exercise_name:
                    video_data = await youtube_service.search_exercise_video(exercise_name)
                    exercise["video_url"] = video_data.get("watch_url")
                    exercise["embed_url"] = video_data.get("embed_url")
    except Exception as e:
        print(f"⚠️ YouTube integration error: {e}")

    # deactivate old plans
    db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).update({"is_active": False})

    today = date.today()
    workout_plan = WorkoutPlan(
        user_id=current_user.id,
        plan_data=json.dumps(plan),
        week_start=today,
        week_end=today + timedelta(days=6),
        fitness_goal=str(current_user.fitness_goal.value if current_user.fitness_goal else "maintenance"),
        is_active=True
    )
    db.add(workout_plan)
    db.commit()
    db.refresh(workout_plan)
    return {"plan": plan, "plan_id": workout_plan.id}


@router.get("/current")
def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()

    if not plan:
        # Auto-initialize fallback plan so user always has exercises
        fallback = get_fallback_plan()
        today = date.today()
        plan = WorkoutPlan(
            user_id=current_user.id,
            plan_data=json.dumps(fallback),
            week_start=today,
            week_end=today + timedelta(days=6),
            fitness_goal=str(current_user.fitness_goal.value if current_user.fitness_goal else "maintenance"),
            is_active=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    return {"plan": json.loads(plan.plan_data), "plan_id": plan.id}


@router.get("/today")
def get_today_workout(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()

    if not plan:
        fallback = get_fallback_plan()
        today = date.today()
        plan = WorkoutPlan(
            user_id=current_user.id,
            plan_data=json.dumps(fallback),
            week_start=today,
            week_end=today + timedelta(days=6),
            fitness_goal=str(current_user.fitness_goal.value if current_user.fitness_goal else "maintenance"),
            is_active=True
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

    plan_data = json.loads(plan.plan_data)
    days = plan_data.get("days", plan_data.get("weekly_plan", []))
    
    day_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    today_name = day_names[date.today().weekday()]

    today_workout = None
    for day in days:
        if day.get("day", "").lower() == today_name.lower():
            today_workout = day
            break

    if not today_workout and days:
        today_workout = days[0]

    return {"today": today_workout, "day_name": today_name}



@router.post("/complete")
def complete_exercise(
    data: CompleteExerciseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    record = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date == today
    ).first()

    if record:
        record.calories_burned = (record.calories_burned or 0) + (data.calories_burned or 0)
        record.workout_completed = True
        record.workout_duration = (record.workout_duration or 0) + (data.duration_minutes or 0)
    else:
        record = ProgressRecord(
            user_id=current_user.id,
            date=today,
            calories_burned=data.calories_burned or 0,
            workout_completed=True,
            workout_duration=data.duration_minutes or 0,
        )
        db.add(record)

    current_user.total_workouts = (current_user.total_workouts or 0) + 1
    current_user.charity_donations = (current_user.charity_donations or 0) + 5
    db.commit()
    return {"message": "Exercise completed! +5 charity points 💚", "total_workouts": current_user.total_workouts}


@router.get("/history")
def get_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plans = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id
    ).order_by(WorkoutPlan.created_at.desc()).all()
    return {"history": [{"id": p.id, "week_start": str(p.week_start), "is_active": p.is_active} for p in plans]}


@router.get("/exercise/video/{exercise_name}")
async def get_exercise_video(exercise_name: str):
    """Get YouTube video for a specific exercise."""
    try:
        video_data = await youtube_service.search_exercise_video(exercise_name)
        return video_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch video: {str(e)}")


def get_fallback_plan():
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    focuses = ["Chest & Triceps","Back & Biceps","Legs","Shoulders","Core","Full Body","Rest"]
    plan = {"days": []}
    for i, day in enumerate(days):
        if i == 6:
            plan["days"].append({
                "day": day,
                "focus_area": "Rest & Active Recovery",
                "rest_day": True,
                "duration_minutes": 20,
                "warmup": "5 min light deep breathing",
                "cool_down": "5 min mindful stretching",
                "daily_tip": "Active recovery stimulates blood flow and accelerates muscle repair.",
                "exercises": [
                    {"name": "Full Body Mobility Flow", "sets": 3, "reps": "10 reps", "rest_seconds": 30, "description": "Gentle dynamic movement for joints and hips.", "youtube_search_query": "full body mobility flow"},
                    {"name": "Cat-Cow Stretch", "sets": 3, "reps": "10 reps", "rest_seconds": 30, "description": "Spinal decompression and breathing rhythm.", "youtube_search_query": "cat cow stretch proper form"},
                    {"name": "Hamstring & Hip Release", "sets": 2, "reps": "30 seconds", "rest_seconds": 30, "description": "Restorative lower body stretch.", "youtube_search_query": "hamstring hip mobility stretch"}
                ]
            })
        else:
            plan["days"].append({
                "day": day,
                "focus_area": focuses[i],
                "rest_day": False,
                "duration_minutes": 45,
                "warmup": "5 min light cardio",
                "cool_down": "5 min stretching",
                "daily_tip": "Stay hydrated!",
                "exercises": [
                    {"name": "Push Ups", "sets": 3, "reps": "12", "rest_seconds": 60, "description": "Classic push up", "youtube_search_query": "push ups proper form"},
                    {"name": "Squats", "sets": 3, "reps": "15", "rest_seconds": 60, "description": "Bodyweight squat", "youtube_search_query": "squat proper form"},
                    {"name": "Plank", "sets": 3, "reps": "30 seconds", "rest_seconds": 45, "description": "Core plank hold", "youtube_search_query": "plank exercise form"},
                ]
            })
    return plan