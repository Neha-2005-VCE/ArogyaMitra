from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
import json

from sqlalchemy import func
from app.database import get_db
from app.models.user import User, ProgressRecord, HealthAssessment, UserAchievement
from app.models.workout_session import WorkoutSession, ExerciseLog
from app.routers.auth import get_current_user

router = APIRouter()

class LogProgressRequest(BaseModel):
    calories_burned: Optional[float] = 0
    workout_completed: Optional[bool] = False
    meal_tracked: Optional[bool] = False
    weight: Optional[float] = None
    notes: Optional[str] = None

@router.get("/summary")
def get_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id
    ).order_by(ProgressRecord.date.desc()).all()

    total_calories = sum(r.calories_burned or 0 for r in records)
    meals_tracked = sum(1 for r in records if r.meal_tracked)

    # calculate streak
    streak = 0
    check_date = date.today()
    for _ in range(365):
        found = any(r.date == check_date and r.workout_completed for r in records)
        if found:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # ── NEW: Persist streak to user model ──
    current_user.streak_points = streak
    db.commit()

    # get bmi
    latest_assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()
    bmi = latest_assessment.bmi if latest_assessment else None

    return {
        "total_workouts": current_user.total_workouts or 0,
        "total_calories_burned": round(total_calories, 1),
        "current_streak": streak,
        "meals_tracked": meals_tracked,
        "charity_donations": current_user.charity_donations or 0,
        "bmi": bmi,
        "weight_lost": 0,
    }


@router.get("/overview")
def get_overview(
    period: Optional[str] = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get progress overview for the React component"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= start_date
    ).order_by(ProgressRecord.date.desc()).all()

    total_workouts = sum(1 for r in records if r.workout_completed)
    total_calories = sum(r.calories_burned or 0 for r in records)

    # Calculate streak
    streak = 0
    check_date = date.today()
    for _ in range(365):
        found = any(r.date == check_date and r.workout_completed for r in records)
        if found:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Weekly goal (percentage of workouts completed vs expected)
    expected_workouts = min(days, 7) if period == "week" else days // 7 * 5
    weekly_goal = min(100, round((total_workouts / max(expected_workouts, 1)) * 100))

    return {
        "totalWorkouts": total_workouts,
        "totalCalories": round(total_calories, 1),
        "currentStreak": streak,
        "weeklyGoal": weekly_goal
    }


@router.get("/workouts")
def get_workout_history(
    period: Optional[str] = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workout history for charts"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= start_date,
        ProgressRecord.workout_completed == True
    ).order_by(ProgressRecord.date.asc()).all()

    return [
        {
            "date": str(r.date),
            "type": r.notes or "Workout",
            "duration": 30,  # Default duration
            "calories": round(r.calories_burned or 0, 1)
        }
        for r in records
    ]


@router.get("/nutrition")
def get_nutrition_history(
    period: Optional[str] = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get nutrition history for charts"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= start_date
    ).order_by(ProgressRecord.date.asc()).all()

    # Get user's target calories from health assessment
    latest_assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()
    
    target_calories = 2000  # Default
    if latest_assessment and hasattr(latest_assessment, 'daily_calorie_target'):
        target_calories = latest_assessment.daily_calorie_target

    return [
        {
            "date": str(r.date),
            "calories": target_calories if r.meal_tracked else 0,
            "protein": round(target_calories * 0.15 / 4) if r.meal_tracked else 0,  # 15% protein
            "adherence": 100 if r.meal_tracked else 0
        }
        for r in records
    ]


@router.get("/body-metrics")
def get_body_metrics(
    period: Optional[str] = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get body metrics history"""
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= start_date,
        ProgressRecord.weight.isnot(None)
    ).order_by(ProgressRecord.date.asc()).all()

    # Get user's height for BMI calculation
    latest_assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()
    
    height = latest_assessment.height if latest_assessment else 170  # Default height in cm

    return [
        {
            "date": str(r.date),
            "weight": round(r.weight, 1),
            "bmi": round(r.weight / ((height / 100) ** 2), 1)
        }
        for r in records
    ]


@router.get("/history")
def get_history(
    period: Optional[str] = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    days_map = {"week": 7, "month": 30, "3months": 90, "year": 365}
    days = days_map.get(period, 7)
    start_date = date.today() - timedelta(days=days)

    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= start_date
    ).order_by(ProgressRecord.date.desc()).all()

    return {"history": [
        {"date": str(r.date), "calories_burned": r.calories_burned,
         "workout_completed": r.workout_completed, "meal_tracked": r.meal_tracked,
         "weight": r.weight, "notes": r.notes}
        for r in records
    ]}


@router.post("/log")
def log_progress(
    data: LogProgressRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    record = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date == today
    ).first()

    if record:
        if data.calories_burned: record.calories_burned = (record.calories_burned or 0) + data.calories_burned
        if data.workout_completed: record.workout_completed = True
        if data.meal_tracked: record.meal_tracked = True
        if data.weight: record.weight = data.weight
        if data.notes: record.notes = data.notes
    else:
        record = ProgressRecord(
            user_id=current_user.id,
            date=today,
            calories_burned=data.calories_burned or 0,
            workout_completed=data.workout_completed or False,
            meal_tracked=data.meal_tracked or False,
            weight=data.weight,
            notes=data.notes,
        )
        db.add(record)

    if data.calories_burned:
        current_user.charity_donations = (current_user.charity_donations or 0) + (data.calories_burned // 10)

    db.commit()
    return {"message": "Progress logged ✅"}


@router.get("/achievements")
def get_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get achievements with real user progress and database persistence.
    Tracks workouts, streak, meals, calories, exercises, and weight transformation.
    """
    records = db.query(ProgressRecord).filter(ProgressRecord.user_id == current_user.id).all()
    
    # 1. Total workouts
    workout_sessions_count = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status == "completed"
    ).count()
    records_workouts = sum(1 for r in records if r.workout_completed)
    total_workouts = max(current_user.total_workouts or 0, workout_sessions_count, records_workouts)

    # 2. Meals tracked
    meals_tracked = sum(1 for r in records if r.meal_tracked)

    # 3. Exercises completed
    ex_logs = db.query(ExerciseLog).join(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        (ExerciseLog.status == "completed") | (ExerciseLog.completed_at.isnot(None))
    ).count()
    exercises_completed = max(ex_logs, total_workouts * 4)

    # 4. Calories burned
    records_cals = int(sum(r.calories_burned or 0 for r in records))
    session_cals = db.query(func.sum(WorkoutSession.calories_burned)).filter(
        WorkoutSession.user_id == current_user.id
    ).scalar() or 0
    total_calories = max(records_cals, int(session_cals))

    # 5. Streak
    streak = current_user.streak_points or 0
    if streak == 0:
        check_date = date.today()
        for _ in range(365):
            found = any(r.date == check_date and r.workout_completed for r in records)
            if found:
                streak += 1
                check_date -= timedelta(days=1)
            else:
                break

    # 6. Weight loss
    weight_lost = 0.0
    weights = [r.weight for r in records if r.weight is not None]
    if weights and current_user.weight:
        initial_weight = current_user.weight
        weight_lost = max(0.0, round(float(initial_weight - weights[-1]), 1))

    # Load existing unlocked achievements from DB
    existing_unlocked = {
        ua.achievement_id: ua 
        for ua in db.query(UserAchievement).filter(UserAchievement.user_id == current_user.id).all()
    }

    definitions = [
        {"id": "first_step", "icon": "👟", "title": "First Step", "desc": "Complete your first workout", "category": "Workouts", "target": 1, "pts": "+50 pts", "color": "#F59E0B", "featured": True, "progress": total_workouts},
        {"id": "workout_warrior", "icon": "⚔️", "title": "Workout Warrior", "desc": "Complete 5 workouts", "category": "Workouts", "target": 5, "pts": "+100 pts", "color": "#6366F1", "featured": False, "progress": total_workouts},
        {"id": "beast_mode", "icon": "🦁", "title": "Beast Mode", "desc": "Complete 10 workouts", "category": "Workouts", "target": 10, "pts": "+200 pts", "color": "#EF4444", "featured": False, "progress": total_workouts},
        {"id": "nutrition_ninja", "icon": "🥷", "title": "Nutrition Ninja", "desc": "Track 5 meals", "category": "Nutrition", "target": 5, "pts": "+75 pts", "color": "#22C55E", "featured": False, "progress": meals_tracked},
        {"id": "exercise_excellence", "icon": "⭐", "title": "Exercise Excellence", "desc": "Complete 25 exercises", "category": "Workouts", "target": 25, "pts": "+150 pts", "color": "#3B82F6", "featured": False, "progress": exercises_completed},
        {"id": "fire_starter", "icon": "🔥", "title": "Fire Starter", "desc": "Burn 500 calories", "category": "Calories", "target": 500, "pts": "+100 pts", "color": "#F97316", "featured": False, "progress": total_calories},
        {"id": "fire_master", "icon": "🔥", "title": "Fire Master", "desc": "Burn 1000 calories", "category": "Calories", "target": 1000, "pts": "+200 pts", "color": "#EF4444", "featured": False, "progress": total_calories},
        {"id": "consistency_counts", "icon": "📅", "title": "Consistency Counts", "desc": "Achieve 3-day streak", "category": "Streaks", "target": 3, "pts": "+100 pts", "color": "#06B6D4", "featured": False, "progress": streak},
        {"id": "streak_king", "icon": "👑", "title": "Streak King", "desc": "Achieve 7-day streak", "category": "Streaks", "target": 7, "pts": "+250 pts", "color": "#FBBF24", "featured": False, "progress": streak},
        {"id": "weight_loss_winner", "icon": "🎯", "title": "Weight Loss Winner", "desc": "Lose 2kg", "category": "Transformation", "target": 2, "pts": "+300 pts", "color": "#22C55E", "featured": False, "progress": weight_lost},
        {"id": "major_transformation", "icon": "💎", "title": "Major Transformation", "desc": "Lose 5kg", "category": "Transformation", "target": 5, "pts": "+500 pts", "color": "#A855F7", "featured": False, "progress": weight_lost},
    ]

    has_new_unlock = False
    achievements_list = []

    for d in definitions:
        ach_id = d["id"]
        cur_progress = d["progress"]
        target = d["target"]
        is_unlocked = cur_progress >= target or ach_id in existing_unlocked
        unlocked_at = None

        if is_unlocked and ach_id not in existing_unlocked:
            new_ua = UserAchievement(
                user_id=current_user.id,
                achievement_id=ach_id,
                progress_value=float(cur_progress)
            )
            db.add(new_ua)
            existing_unlocked[ach_id] = new_ua
            has_new_unlock = True
            unlocked_at = str(date.today())
        elif ach_id in existing_unlocked:
            unlocked_at = str(existing_unlocked[ach_id].unlocked_at) if existing_unlocked[ach_id].unlocked_at else str(date.today())

        pct = min(100, int((cur_progress / target) * 100)) if target > 0 else 0

        achievements_list.append({
            "id": ach_id,
            "achievement_id": ach_id,
            "title": d["title"],
            "name": d["title"],
            "desc": d["desc"],
            "description": d["desc"],
            "icon": d["icon"],
            "category": d["category"],
            "target": target,
            "progress": cur_progress,
            "current_value": cur_progress,
            "value": cur_progress,
            "percentage": pct,
            "unlocked": is_unlocked,
            "completed": is_unlocked,
            "is_completed": is_unlocked,
            "unlocked_at": unlocked_at,
            "pts": d["pts"],
            "color": d["color"],
            "featured": d["featured"]
        })

    if has_new_unlock:
        db.commit()

    return achievements_list


@router.get("/charts")
def get_charts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    last_7 = [date.today() - timedelta(days=i) for i in range(6, -1, -1)]
    records = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date >= last_7[0]
    ).all()

    records_by_date = {r.date: r for r in records}
    calories_chart = [
        {"date": str(d), "calories": records_by_date.get(d, ProgressRecord(calories_burned=0)).calories_burned or 0}
        for d in last_7
    ]
    streak_chart = [
        {"day": d.strftime("%a"), "completed": 1 if (records_by_date.get(d) and records_by_date[d].workout_completed) else 0}
        for d in last_7
    ]

    return {"calories_chart": calories_chart, "streak_chart": streak_chart}