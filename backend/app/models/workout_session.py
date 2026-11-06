from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
from datetime import datetime

class WorkoutSession(Base):
    """Real-time workout session tracking"""
    __tablename__ = "workout_sessions"

    id                  = Column(Integer, primary_key=True, index=True)
    user_id             = Column(Integer, ForeignKey("users.id"), nullable=False)
    workout_plan_id     = Column(Integer, ForeignKey("workout_plans.id"), nullable=True)
    
    # Session details
    session_date        = Column(DateTime, default=datetime.utcnow)
    day_name            = Column(String)  # Monday, Tuesday, etc.
    focus_area          = Column(String)  # Chest & Triceps, etc.
    
    # Timing
    total_duration_minutes = Column(Integer, default=0)  # Planned duration
    elapsed_seconds     = Column(Integer, default=0)     # Actual time spent
    started_at          = Column(DateTime, nullable=True)
    completed_at        = Column(DateTime, nullable=True)
    paused_at           = Column(DateTime, nullable=True)
    
    # Status
    status              = Column(String, default="not_started")  # not_started, in_progress, paused, completed, abandoned
    is_active           = Column(Boolean, default=True)
    
    # Progress tracking
    total_exercises     = Column(Integer, default=0)
    completed_exercises = Column(Integer, default=0)
    current_exercise_index = Column(Integer, default=0)
    
    # Performance metrics
    calories_burned     = Column(Float, default=0.0)
    total_sets_completed = Column(Integer, default=0)
    total_reps_completed = Column(Integer, default=0)
    
    # Notes
    notes               = Column(Text)
    
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user                = relationship("User", back_populates="workout_sessions")
    exercise_logs       = relationship("ExerciseLog", back_populates="session", cascade="all, delete-orphan")


class ExerciseLog(Base):
    """Individual exercise completion tracking within a session"""
    __tablename__ = "exercise_logs"

    id                  = Column(Integer, primary_key=True, index=True)
    session_id          = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False)
    
    # Exercise details
    exercise_name       = Column(String, nullable=False)
    exercise_index      = Column(Integer)  # Order in the workout
    
    # Video info
    video_id            = Column(String)
    video_url           = Column(String)
    embed_url           = Column(String)
    
    # Planned vs Actual
    planned_sets        = Column(Integer)
    completed_sets      = Column(Integer, default=0)
    planned_reps        = Column(String)  # Can be "12" or "30 seconds"
    actual_reps         = Column(String)
    
    # Timing
    rest_seconds        = Column(Integer)
    time_spent_seconds  = Column(Integer, default=0)
    started_at          = Column(DateTime, nullable=True)
    completed_at        = Column(DateTime, nullable=True)
    
    # Status
    status              = Column(String, default="pending")  # pending, in_progress, completed, skipped
    
    # Performance
    difficulty_rating   = Column(Integer)  # 1-5 scale
    form_rating         = Column(Integer)  # 1-5 scale
    notes               = Column(Text)
    
    created_at          = Column(DateTime(timezone=True), server_default=func.now())
    updated_at          = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    session             = relationship("WorkoutSession", back_populates="exercise_logs")
