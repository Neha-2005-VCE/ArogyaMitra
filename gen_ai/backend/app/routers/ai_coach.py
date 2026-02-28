from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import json

from app.database import get_db
from app.models.user import User, WorkoutPlan, NutritionPlan, ChatSession
from app.routers.auth import get_current_user
from app.services.ai_agent import ai_agent

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = []

class AdjustPlanRequest(BaseModel):
    reason: str
    duration_days: Optional[int] = 3

@router.post("/aromi-chat")
async def aromi_chat(
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch allergies from the latest health assessment (not on User model)
    from app.models.user import HealthAssessment
    latest_assessment = db.query(HealthAssessment).filter(
        HealthAssessment.user_id == current_user.id
    ).order_by(HealthAssessment.created_at.desc()).first()

    user_data = {
        "name": current_user.full_name,
        "age": current_user.age,
        "weight": current_user.weight,
        "height": current_user.height,
        "fitness_goal": str(current_user.fitness_goal or "maintenance"),
        "fitness_level": str(current_user.fitness_level or "beginner"),
        "diet_preference": str(current_user.diet_preference or "none"),
        "allergies": str(latest_assessment.allergies if latest_assessment and latest_assessment.allergies else "none"),
    }

    # 1. Detect Intent
    intent = ai_agent.detect_intent(data.message)
    plan_updated = False

    if intent.get("adjustment_needed"):
        try:
            # Get current plan
            current_plan_record = db.query(WorkoutPlan).filter(
                WorkoutPlan.user_id == current_user.id,
                WorkoutPlan.is_active == True
            ).order_by(WorkoutPlan.created_at.desc()).first()

            if current_plan_record:
                current_plan = json.loads(current_plan_record.plan_data)
                adjusted = ai_agent.adjust_plan_dynamically(
                    intent["reason"], intent.get("duration_days", 3), current_plan, user_data
                )

                from datetime import date, timedelta
                new_plan = WorkoutPlan(
                    user_id=current_user.id,
                    plan_data=json.dumps(adjusted),
                    week_start=date.today(),
                    week_end=date.today() + timedelta(days=6),
                    fitness_goal=user_data["fitness_goal"],
                    is_active=True
                )
                current_plan_record.is_active = False
                db.add(new_plan)
                plan_updated = True
        except Exception as e:
            print(f"Auto-adjustment error: {e}")

    # 2. Get AI Response
    response = await ai_agent.aromi_coach_chat(
        message=data.message,
        user_data=user_data,
        conversation_history=data.conversation_history
    )

    chat = ChatSession(
        user_id=current_user.id,
        message=data.message,
        response=response,
        session_type="aromi"
    )
    db.add(chat)
    db.commit()

    return {
        "response": response, 
        "timestamp": datetime.utcnow().isoformat(),
        "plan_updated": plan_updated
    }


@router.post("/adjust-plan")
def adjust_plan(
    data: AdjustPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_plan_record = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).order_by(WorkoutPlan.created_at.desc()).first()

    if not current_plan_record:
        raise HTTPException(status_code=404, detail="No active workout plan")

    current_plan = json.loads(current_plan_record.plan_data)
    user_data = {
        "fitness_level": str(current_user.fitness_level or "beginner")
    }

    adjusted = ai_agent.adjust_plan_dynamically(
        data.reason, data.duration_days, current_plan, user_data
    )

    from datetime import date, timedelta
    new_plan = WorkoutPlan(
        user_id=current_user.id,
        plan_data=json.dumps(adjusted),
        week_start=date.today(),
        week_end=date.today() + timedelta(days=6),
        fitness_goal=str(current_user.fitness_goal or "maintenance"),
        is_active=True
    )
    current_plan_record.is_active = False
    db.add(new_plan)
    db.commit()

    return {"message": f"Plan adjusted for {data.reason}", "plan": adjusted}


@router.get("/chat-history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    chats = db.query(ChatSession).filter(
        ChatSession.user_id == current_user.id
    ).order_by(ChatSession.created_at.desc()).limit(20).all()

    return {"history": [
        {
            "message": c.message,
            "response": c.response,
            "timestamp": str(c.created_at)
        }
        for c in chats
    ]}

from datetime import date
from enum import Enum
from app.models.user import ProgressRecord

class MoodLevel(str, Enum):
    ENERGIZED = "energized"
    NORMAL = "normal"  
    TIRED = "tired"
    STRESSED = "stressed"
    SICK = "sick"

class MoodCheckinData(BaseModel):
    mood: str = "normal"
    energy_level: int = 5
    sleep_hours: float = 7.0
    notes: str = ""

@router.post("/mood-checkin")
async def mood_checkin(
    mood_data: MoodCheckinData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Smart mood check-in that auto-adjusts today's workout.
    """
    mood = mood_data.mood
    energy = mood_data.energy_level
    sleep = mood_data.sleep_hours
    notes = mood_data.notes
    
    # Get current workout plan
    workout_plan = db.query(WorkoutPlan).filter(
        WorkoutPlan.user_id == current_user.id,
        WorkoutPlan.is_active == True
    ).first()
    
    today = date.today().strftime("%A")  # Monday, Tuesday, etc.
    
    adjusted_plan = None
    adjustment_reason = ""
    
    if mood in ["tired", "stressed", "sick"] or energy <= 3 or sleep < 5:
        # Auto-adjust via AI
        current_plan_data = json.loads(workout_plan.plan_data) if workout_plan and workout_plan.plan_data else {}
        
        prompt = f"""
        User's today mood: {mood}, energy: {energy}/10, sleep: {sleep}hrs
        Notes: {notes}
        Today is {today}.
        Current workout: {json.dumps(current_plan_data.get(today, {}), indent=2)}
        
        Create a MODIFIED version of today's workout that:
        - If tired/low energy: Replace intense exercises with lighter alternatives (yoga, stretching, walking)
        - If stressed: Add breathing exercises and mindfulness activities  
        - If sick: Suggest complete rest or very gentle movement only
        - Keep the same time slot and structure
        - Return ONLY valid JSON matching the same exercise structure
        """
        
        from app.services.ai_agent import ai_agent
        adjusted = ai_agent._call_groq(
            "You are a fitness coach. Return only valid JSON.",
            prompt,
            max_tokens=1000
        )
        
        try:
            import re
            json_match = re.search(r'\{.*\}', adjusted, re.DOTALL)
            adjusted_plan = json.loads(json_match.group()) if json_match else None
            adjustment_reason = f"Plan adjusted for {mood} mood and {energy}/10 energy level"
        except:
            adjusted_plan = None
    
    # Save mood to progress record
    today_progress = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date == date.today()
    ).first()
    
    if today_progress:
        today_progress.notes = f"Mood: {mood} | Energy: {energy}/10 | Sleep: {sleep}hrs | {notes}"
    else:
        today_progress = ProgressRecord(
            user_id=current_user.id,
            date=date.today(),
            notes=f"Mood: {mood} | Energy: {energy}/10 | Sleep: {sleep}hrs | {notes}"
        )
        db.add(today_progress)
    db.commit()
    
    return {
        "mood": mood,
        "energy_level": energy,
        "plan_adjusted": adjusted_plan is not None,
        "adjustment_reason": adjustment_reason,
        "adjusted_workout": adjusted_plan,
        "message": _get_mood_message(mood, energy),
        "recommendations": _get_mood_recommendations(mood, energy, sleep)
    }

def _get_mood_message(mood: str, energy: int) -> str:
    messages = {
        "energized": "🔥 You're on fire today! Let's crush this workout!",
        "normal": "💪 Feeling balanced — perfect day for your planned workout!",
        "tired": "😴 Rest is part of the journey. I've adjusted today's plan for you.",
        "stressed": "🧘 Let's use exercise to melt that stress away. Modified plan ready!",
        "sick": "🤒 Your body needs rest today. Take it easy — I'll be here when you're back!"
    }
    return messages.get(mood, "Let's make today count!")

def _get_mood_recommendations(mood: str, energy: int, sleep: float) -> list:
    recs = []
    if sleep < 6:
        recs.append("💤 Try to get 7-8 hours tonight — recovery happens during sleep!")
    if mood == "stressed":
        recs.append("🫁 Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s")
        recs.append("📵 Consider a 30-min phone-free zone before bed")
    if energy <= 3:
        recs.append("🍌 Eat a banana + peanut butter for a quick energy boost")
        recs.append("💧 Dehydration causes fatigue — drink 500ml water now")
    return recs