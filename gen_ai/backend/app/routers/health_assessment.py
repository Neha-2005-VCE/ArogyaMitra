from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.models.user import User, HealthAssessment, WorkoutPlan, NutritionPlan
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent
import json
from datetime import date, timedelta

router = APIRouter()

class AssessmentRequest(BaseModel):
    age: int
    gender: str
    height: float
    weight: float
    fitness_level: str
    fitness_goal: str
    workout_preference: str
    workout_time_preference: str
    medical_history: Optional[str] = ""
    health_conditions: Optional[str] = ""
    injuries: Optional[str] = ""
    allergies: Optional[str] = ""
    medications: Optional[str] = ""
    calendar_sync: Optional[bool] = False

@router.post("/assessment/submit")
def submit_assessment(
    data: AssessmentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    bmi = round(data.weight / ((data.height / 100) ** 2), 1)

    assessment = HealthAssessment(
        user_id=current_user.id,
        age=data.age,
        gender=data.gender,
        height=data.height,
        weight=data.weight,
        bmi=bmi,
        medical_history=data.medical_history,
        injuries=data.injuries,
        allergies=data.allergies,
        medications=data.medications,
        health_conditions=data.health_conditions,
        fitness_level=data.fitness_level,
        fitness_goal=data.fitness_goal,
        workout_preference=data.workout_preference,
        workout_time_preference=data.workout_time_preference,
        calendar_sync=data.calendar_sync,
    )
    db.add(assessment)

    # update user profile too
    current_user.age = data.age
    current_user.gender = data.gender
    current_user.height = data.height
    current_user.weight = data.weight
    current_user.fitness_level = data.fitness_level
    current_user.fitness_goal = data.fitness_goal
    current_user.workout_preference = data.workout_preference

    db.commit()
    db.refresh(assessment)

    # Simplified BMR Calculation (Harris-Benedict)
    weight = data.weight
    height = data.height
    age = data.age
    if data.gender.lower() == 'male':
        bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age)
    
    # Simple TDEE multiplier (sedentary/moderate)
    calorie_target = int(bmr * 1.4)

    # Automatically generate initial plans using Groq AI
    try:
        user_data = {
            "age": data.age,
            "gender": data.gender,
            "height": data.height,
            "weight": data.weight,
            "fitness_level": data.fitness_level,
            "fitness_goal": data.fitness_goal,
            "workout_preference": data.workout_preference,
            "diet_preference": "vegetarian", # Default or fetch from user
            "calorie_target": calorie_target
        }
        
        # 1. Generate Workout Plan
        workout_json = ai_agent.generate_workout_plan(user_data)
        new_workout = WorkoutPlan(
            user_id=current_user.id,
            plan_data=json.dumps(workout_json),
            week_start=date.today(),
            week_end=date.today() + timedelta(days=6),
            fitness_goal=data.fitness_goal,
            is_active=True
        )
        db.add(new_workout)

        # 2. Generate Nutrition Plan
        nutrition_json = ai_agent.generate_nutrition_plan(user_data, {})
        new_nutrition = NutritionPlan(
            user_id=current_user.id,
            plan_data=json.dumps(nutrition_json),
            week_start=date.today(),
            week_end=date.today() + timedelta(days=6),
            is_active=True
        )
        db.add(new_nutrition)
        
        db.commit()
    except Exception as e:
        print(f"Initial AI generation error: {e}")

    return {"success": True, "bmi": bmi, "assessment_id": assessment.id}


@router.get("/assessment/latest")
def get_latest_assessment(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()

    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found")

    return {
        "id": assessment.id,
        "bmi": assessment.bmi,
        "age": assessment.age,
        "gender": assessment.gender,
        "height": assessment.height,
        "weight": assessment.weight,
        "fitness_level": assessment.fitness_level,
        "fitness_goal": assessment.fitness_goal,
        "workout_preference": assessment.workout_preference,
        "health_conditions": assessment.health_conditions,
        "injuries": assessment.injuries,
        "allergies": assessment.allergies,
    }

