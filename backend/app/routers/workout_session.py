from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, timedelta
import json

from app.database import get_db
from app.models.user import User, WorkoutPlan
from app.models.workout_session import WorkoutSession, ExerciseLog
from app.routers.auth import get_current_user
from app.services.youtube_service import youtube_service
from app.services.motion_detection_service import motion_detection_service

router = APIRouter()

# ── Pydantic Schemas ───────────────────────────────

class StartSessionRequest(BaseModel):
    workout_plan_id: Optional[int] = None
    day_name: Optional[str] = None
    workout_plan: Optional[dict] = None
    exercises: Optional[List[dict]] = None

class UpdateSessionRequest(BaseModel):
    elapsed_seconds: Optional[int] = None
    status: Optional[str] = None  # in_progress, paused, completed, abandoned
    calories_burned: Optional[float] = None
    notes: Optional[str] = None

class CompleteExerciseRequest(BaseModel):
    exercise_index: int
    completed_sets: int
    actual_reps: Optional[str] = None
    time_spent_seconds: Optional[int] = None
    difficulty_rating: Optional[int] = None
    form_rating: Optional[int] = None
    notes: Optional[str] = None

class SkipExerciseRequest(BaseModel):
    exercise_index: int
    reason: Optional[str] = None

class MotionDataRequest(BaseModel):
    motion_intensity: float  # 0.0 - 1.0
    camera_active: bool = True

class RepCountRequest(BaseModel):
    exercise_name: str
    current_angle: Optional[float] = None
    movement_phase: str = "down"  # up/down

class FormAnalysisRequest(BaseModel):
    exercise_name: str
    frame_data: Optional[dict] = None
    pose_landmarks: Optional[List] = None

# ── Session Management Endpoints ───────────────────

@router.post("/start")
async def start_workout_session(
    data: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new workout session"""
    from app.routers.workouts import get_fallback_plan
    
    # 1. Check if direct workout plan object was provided
    custom_plan = data.workout_plan
    exercises = []
    day_name = data.day_name or "Custom Workout"
    focus_area = "Full Body"
    duration_mins = 30
    
    plan_id = data.workout_plan_id
    if not plan_id:
        active_plan = db.query(WorkoutPlan).filter(
            WorkoutPlan.user_id == current_user.id,
            WorkoutPlan.is_active == True
        ).order_by(WorkoutPlan.created_at.desc()).first()
        
        if not active_plan:
            fb = get_fallback_plan()
            today = date.today()
            active_plan = WorkoutPlan(
                user_id=current_user.id,
                plan_data=json.dumps(fb),
                week_start=today,
                week_end=today + timedelta(days=6),
                fitness_goal="maintenance",
                is_active=True
            )
            db.add(active_plan)
            db.commit()
            db.refresh(active_plan)
        
        plan_id = active_plan.id
        plan_data = json.loads(active_plan.plan_data)
        days = plan_data.get("days", [])
        
        if custom_plan and isinstance(custom_plan, dict):
            day_name = custom_plan.get("day", day_name)
            focus_area = custom_plan.get("focus_area", focus_area)
            duration_mins = custom_plan.get("duration_minutes", duration_mins)
            exercises = custom_plan.get("exercises", [])
        elif data.day_name:
            day_workout = next((d for d in days if d.get("day", "").lower() == data.day_name.lower()), None)
            if day_workout:
                day_name = day_workout.get("day", day_name)
                focus_area = day_workout.get("focus_area", focus_area)
                duration_mins = day_workout.get("duration_minutes", duration_mins)
                exercises = day_workout.get("exercises", [])
        else:
            day_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
            today_name = day_names[date.today().weekday()]
            day_workout = next((d for d in days if d.get("day", "").lower() == today_name.lower()), None)
            if not day_workout and days:
                day_workout = days[0]
            if day_workout:
                day_name = day_workout.get("day", today_name)
                focus_area = day_workout.get("focus_area", focus_area)
                duration_mins = day_workout.get("duration_minutes", duration_mins)
                exercises = day_workout.get("exercises", [])
    
    # If rest day or exercises empty, supply active recovery exercises so workout always works
    if not exercises:
        focus_area = "Active Recovery & Mobility"
        exercises = [
            {"name": "Full Body Mobility Flow", "sets": 3, "reps": "10 reps", "rest_seconds": 30, "description": "Gentle dynamic flow for joints and spine."},
            {"name": "Cat-Cow Spine Release", "sets": 3, "reps": "10 reps", "rest_seconds": 30, "description": "Spinal mobility and diaphragmatic breathing."},
            {"name": "Hamstring & Hip Release", "sets": 2, "reps": "30s hold", "rest_seconds": 30, "description": "Restorative lower body release."}
        ]

    # Check if there's already an active session
    existing_session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).first()
    
    if existing_session:
        # Check existing exercise logs
        existing_logs = db.query(ExerciseLog).filter(ExerciseLog.session_id == existing_session.id).count()
        if existing_logs > 0:
            existing_session.status = "in_progress"
            existing_session.started_at = datetime.utcnow()
            db.commit()
            db.refresh(existing_session)
            return {
                "session_id": existing_session.id,
                "status": "resumed",
                "message": "Resumed existing workout session"
            }
        else:
            db.delete(existing_session)
            db.commit()
    
    # Create new session
    session = WorkoutSession(
        user_id=current_user.id,
        workout_plan_id=plan_id,
        day_name=day_name,
        focus_area=focus_area,
        total_duration_minutes=duration_mins,
        total_exercises=len(exercises),
        status="in_progress",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.flush()  # Get session.id
    
    # Create exercise logs with YouTube videos
    for idx, exercise in enumerate(exercises):
        exercise_name = exercise.get("name", "")
        
        # Get YouTube video
        try:
            video_data = await youtube_service.search_exercise_video(exercise_name)
        except:
            video_data = {}
        
        exercise_log = ExerciseLog(
            session_id=session.id,
            exercise_name=exercise_name,
            exercise_index=idx,
            planned_sets=exercise.get("sets", 3),
            planned_reps=str(exercise.get("reps", "12")),
            rest_seconds=exercise.get("rest_seconds", 60),
            video_id=video_data.get("video_id"),
            video_url=video_data.get("watch_url"),
            embed_url=video_data.get("embed_url"),
            status="pending"
        )
        db.add(exercise_log)
    
    db.commit()
    db.refresh(session)
    
    return {
        "session_id": session.id,
        "status": "started",
        "workout": {
            "day": day_workout.get("day"),
            "focus_area": day_workout.get("focus_area"),
            "duration_minutes": day_workout.get("duration_minutes"),
            "warmup": day_workout.get("warmup"),
            "cool_down": day_workout.get("cool_down"),
            "daily_tip": day_workout.get("daily_tip"),
            "total_exercises": len(exercises)
        }
    }


@router.get("/current")
def get_current_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the current active workout session"""
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).order_by(WorkoutSession.created_at.desc()).first()
    
    if not session:
        return {"session": None, "message": "No active workout session"}
    
    # Get all exercise logs
    exercises = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session.id
    ).order_by(ExerciseLog.exercise_index).all()
    
    # Calculate progress
    elapsed = 0
    if session.started_at:
        if session.status == "completed":
            elapsed = int((session.completed_at - session.started_at).total_seconds())
        elif session.status == "paused":
            elapsed = session.elapsed_seconds or 0
        else:
            elapsed = int((datetime.utcnow() - session.started_at).total_seconds())
    
    return {
        "session": {
            "id": session.id,
            "day_name": session.day_name,
            "focus_area": session.focus_area,
            "status": session.status,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "elapsed_seconds": elapsed,
            "total_duration_minutes": session.total_duration_minutes,
            "total_exercises": session.total_exercises,
            "completed_exercises": session.completed_exercises,
            "current_exercise_index": session.current_exercise_index,
            "calories_burned": session.calories_burned,
            "progress_percentage": round((session.completed_exercises / session.total_exercises * 100) if session.total_exercises > 0 else 0, 1)
        },
        "exercises": [
            {
                "id": ex.id,
                "index": ex.exercise_index,
                "name": ex.exercise_name,
                "sets": ex.planned_sets,
                "reps": ex.planned_reps,
                "planned_sets": ex.planned_sets,
                "completed_sets": ex.completed_sets,
                "planned_reps": ex.planned_reps,
                "actual_reps": ex.actual_reps,
                "rest_seconds": ex.rest_seconds,
                "time_spent_seconds": ex.time_spent_seconds,
                "status": ex.status,
                "completed": (ex.status == "completed"),
                "embed_url": ex.embed_url,
                "video": {
                    "video_id": ex.video_id,
                    "embed_url": ex.embed_url,
                    "watch_url": ex.video_url
                },
                "difficulty_rating": ex.difficulty_rating,
                "form_rating": ex.form_rating
            }
            for ex in exercises
        ]
    }


@router.put("/{session_id}")
def update_session(
    session_id: int,
    data: UpdateSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update workout session (pause, resume, update time)"""
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if data.status:
        session.status = data.status
        if data.status == "paused":
            session.paused_at = datetime.utcnow()
            if session.started_at:
                session.elapsed_seconds = int((datetime.utcnow() - session.started_at).total_seconds())
        elif data.status == "in_progress":
            session.paused_at = None
            session.started_at = datetime.utcnow()
        elif data.status == "completed":
            session.completed_at = datetime.utcnow()
            if session.started_at:
                session.elapsed_seconds = int((session.completed_at - session.started_at).total_seconds())
    
    if data.elapsed_seconds is not None:
        session.elapsed_seconds = data.elapsed_seconds
    
    if data.calories_burned is not None:
        session.calories_burned = data.calories_burned
    
    if data.notes:
        session.notes = data.notes
    
    db.commit()
    db.refresh(session)
    
    return {"message": "Session updated", "status": session.status}


@router.post("/{session_id}/exercise/complete")
def complete_exercise(
    session_id: int,
    data: CompleteExerciseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an exercise as completed"""
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    exercise = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session_id,
        ExerciseLog.exercise_index == data.exercise_index
    ).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    # Update exercise log
    exercise.status = "completed"
    exercise.completed_sets = data.completed_sets
    exercise.actual_reps = data.actual_reps
    exercise.time_spent_seconds = data.time_spent_seconds
    exercise.difficulty_rating = data.difficulty_rating
    exercise.form_rating = data.form_rating
    exercise.notes = data.notes
    exercise.completed_at = datetime.utcnow()
    
    # Update session progress
    session.completed_exercises = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session_id,
        ExerciseLog.status == "completed"
    ).count()
    
    session.current_exercise_index = data.exercise_index + 1
    session.total_sets_completed = (session.total_sets_completed or 0) + data.completed_sets
    
    # Estimate calories (rough estimate: 5 calories per set)
    session.calories_burned = (session.calories_burned or 0) + (data.completed_sets * 5)
    
    db.commit()
    
    # Check if all exercises are completed
    if session.completed_exercises >= session.total_exercises:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        
        return {
            "message": "🎉 Workout completed! Great job!",
            "session_completed": True,
            "total_exercises": session.total_exercises,
            "calories_burned": session.calories_burned
        }
    
    return {
        "message": "Exercise completed!",
        "session_completed": False,
        "completed_exercises": session.completed_exercises,
        "total_exercises": session.total_exercises,
        "next_exercise_index": session.current_exercise_index
    }


@router.post("/{session_id}/exercise/skip")
def skip_exercise(
    session_id: int,
    data: SkipExerciseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Skip an exercise"""
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    exercise = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session_id,
        ExerciseLog.exercise_index == data.exercise_index
    ).first()
    
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    
    exercise.status = "skipped"
    exercise.notes = data.reason
    session.current_exercise_index = data.exercise_index + 1
    
    db.commit()
    
    return {
        "message": "Exercise skipped",
        "next_exercise_index": session.current_exercise_index
    }


@router.get("/history")
def get_session_history(
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get workout session history"""
    
    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id
    ).order_by(WorkoutSession.created_at.desc()).limit(limit).all()
    
    return {
        "sessions": [
            {
                "id": s.id,
                "day_name": s.day_name,
                "focus_area": s.focus_area,
                "status": s.status,
                "session_date": s.session_date.isoformat() if s.session_date else None,
                "elapsed_seconds": s.elapsed_seconds,
                "completed_exercises": s.completed_exercises,
                "total_exercises": s.total_exercises,
                "calories_burned": s.calories_burned
            }
            for s in sessions
        ]
    }


@router.delete("/{session_id}")
def abandon_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Abandon/cancel a workout session"""
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.status = "abandoned"
    session.is_active = False
    db.commit()
    
    return {"message": "Workout session abandoned"}


@router.put("/update")
def update_current_session(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).order_by(WorkoutSession.created_at.desc()).first()
    
    if not session:
        return {"message": "No active session to update"}
        
    if "status" in data:
        session.status = data["status"]
        if data["status"] == "completed":
            session.completed_at = datetime.utcnow()
    if "total_calories" in data:
        session.calories_burned = data["total_calories"]
    elif "calories_burned" in data:
        session.calories_burned = (session.calories_burned or 0) + data["calories_burned"]
    if "elapsed_seconds" in data:
        session.elapsed_seconds = data["elapsed_seconds"]
        
    db.commit()
    return {"message": "Session updated", "status": session.status}


@router.post("/complete-exercise")
def complete_active_exercise(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).order_by(WorkoutSession.created_at.desc()).first()
    
    if not session:
        return {"message": "No active session"}
        
    exercise_name = data.get("exercise_name")
    exercise = None
    if exercise_name:
        exercise = db.query(ExerciseLog).filter(
            ExerciseLog.session_id == session.id,
            ExerciseLog.exercise_name.ilike(f"%{exercise_name}%")
        ).first()
        
    if not exercise:
        exercise = db.query(ExerciseLog).filter(
            ExerciseLog.session_id == session.id,
            ExerciseLog.status == "pending"
        ).order_by(ExerciseLog.exercise_index).first()
        
    if exercise:
        exercise.status = "completed"
        exercise.completed_sets = data.get("sets", exercise.planned_sets)
        exercise.completed_at = datetime.utcnow()
        session.completed_exercises = (session.completed_exercises or 0) + 1
        session.current_exercise_index = (session.current_exercise_index or 0) + 1
        
    calories = data.get("calories", 5)
    session.calories_burned = (session.calories_burned or 0) + calories
    current_user.total_workouts = (current_user.total_workouts or 0) + 1
    current_user.charity_donations = (current_user.charity_donations or 0) + 5
    db.commit()
    return {"message": "Exercise completed! +5 charity points 💚"}


@router.post("/skip-exercise")
def skip_active_exercise(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).order_by(WorkoutSession.created_at.desc()).first()
    
    if not session:
        return {"message": "No active session"}
        
    session.current_exercise_index = (session.current_exercise_index or 0) + 1
    db.commit()
    return {"message": "Exercise skipped", "next_index": session.current_exercise_index}


@router.post("/abandon")
def abandon_active_session(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == current_user.id,
        WorkoutSession.status.in_(["not_started", "in_progress", "paused"])
    ).order_by(WorkoutSession.created_at.desc()).first()
    
    if session:
        session.status = "abandoned"
        session.is_active = False
        db.commit()
        return {"message": "Session abandoned"}
    return {"message": "No active session to abandon"}


# ── Motion Detection & Form Analysis Endpoints ────

@router.post("/motion/detect")
async def detect_motion_activity(
    data: MotionDataRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Detect if user is actively exercising based on motion data
    Used for real-time activity tracking
    """
    
    result = motion_detection_service.detect_activity(
        motion_intensity=data.motion_intensity,
        camera_active=data.camera_active
    )
    
    return result


@router.post("/motion/count-rep")
async def count_exercise_rep(
    data: RepCountRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Count exercise repetitions based on movement patterns
    Returns whether a rep was detected
    """
    
    result = motion_detection_service.count_reps(
        exercise_name=data.exercise_name,
        current_angle=data.current_angle,
        movement_phase=data.movement_phase
    )
    
    return result


@router.post("/motion/analyze-form")
async def analyze_exercise_form(
    data: FormAnalysisRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Analyze exercise form using AI
    Provides feedback, corrections, and form score
    """
    
    analysis = await motion_detection_service.analyze_exercise_form(
        exercise_name=data.exercise_name,
        frame_data=data.frame_data,
        pose_landmarks=data.pose_landmarks
    )
    
    return analysis


@router.get("/motion/coaching-tips/{exercise_name}/{current_rep}")
async def get_coaching_tips(
    exercise_name: str,
    current_rep: int,
    current_user: User = Depends(get_current_user)
):
    """
    Get real-time coaching tips during exercise
    Provides motivation and form reminders
    """
    
    tips = motion_detection_service.get_exercise_coaching_tips(
        exercise_name=exercise_name,
        current_rep=current_rep
    )
    
    return tips


@router.post("/{session_id}/calculate-calories")
async def calculate_session_calories(
    session_id: int,
    intensity: float = 0.7,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Calculate calories burned for current session
    Based on exercise type, duration, and intensity
    """
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Get completed exercises
    exercises = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session_id,
        ExerciseLog.status == "completed"
    ).all()
    
    total_calories = 0.0
    user_weight = current_user.weight or 70  # Default 70kg
    
    for exercise in exercises:
        calories = motion_detection_service.calculate_calories_burned(
            exercise_name=exercise.exercise_name,
            duration_seconds=exercise.time_spent_seconds or 0,
            intensity=intensity,
            user_weight_kg=user_weight
        )
        total_calories += calories
    
    # Update session
    session.calories_burned = total_calories
    db.commit()
    
    return {
        "session_id": session_id,
        "total_calories": round(total_calories, 2),
        "exercises_analyzed": len(exercises),
        "intensity": intensity
    }


@router.get("/{session_id}/real-time-stats")
async def get_realtime_stats(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get real-time workout statistics
    Optimized for frequent polling (every 1-2 seconds)
    """
    
    session = db.query(WorkoutSession).filter(
        WorkoutSession.id == session_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Calculate elapsed time
    elapsed = 0
    if session.started_at:
        if session.status == "completed":
            elapsed = int((session.completed_at - session.started_at).total_seconds())
        elif session.status == "paused":
            elapsed = session.elapsed_seconds or 0
        else:
            elapsed = int((datetime.utcnow() - session.started_at).total_seconds())
    
    # Get current exercise
    current_exercise = db.query(ExerciseLog).filter(
        ExerciseLog.session_id == session_id,
        ExerciseLog.exercise_index == session.current_exercise_index
    ).first()
    
    return {
        "session_id": session_id,
        "status": session.status,
        "elapsed_seconds": elapsed,
        "total_duration_minutes": session.total_duration_minutes,
        "remaining_seconds": (session.total_duration_minutes * 60) - elapsed,
        "completed_exercises": session.completed_exercises,
        "total_exercises": session.total_exercises,
        "progress_percentage": round((session.completed_exercises / session.total_exercises * 100) if session.total_exercises > 0 else 0, 1),
        "calories_burned": session.calories_burned or 0,
        "current_exercise": {
            "name": current_exercise.exercise_name if current_exercise else None,
            "index": session.current_exercise_index,
            "status": current_exercise.status if current_exercise else None,
            "completed_sets": current_exercise.completed_sets if current_exercise else 0,
            "planned_sets": current_exercise.planned_sets if current_exercise else 0
        } if current_exercise else None
    }
