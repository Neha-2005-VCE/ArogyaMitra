from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, timedelta
import json

from app.database import get_db
from app.models.user import User, NutritionPlan, ProgressRecord
from app.routers.auth import get_current_user
from app.services.spoonacular_service import spoonacular_service
from app.services.goal_meal_plans import get_goal_based_meal_plan

router = APIRouter()

class GenerateNutritionRequest(BaseModel):
    calorie_target: Optional[int] = 1800
    diet_type: Optional[str] = "vegetarian"
    allergies: Optional[str] = ""
    goal: Optional[str] = "balance"  # loss, gain, balance, muscle

class CompleteMealRequest(BaseModel):
    meal_id: Optional[str] = None
    meal_type: Optional[str] = "lunch"

@router.post("/generate")
async def generate_nutrition(
    data: GenerateNutritionRequest = GenerateNutritionRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get goal-based meal plan
    goal = data.goal or "balance"
    plan = get_goal_based_meal_plan(goal, data.calorie_target, data.diet_type)

    db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).update({"is_active": False})

    today = date.today()
    nutrition_plan = NutritionPlan(
        user_id=current_user.id,
        plan_data=json.dumps(plan),
        week_start=today,
        week_end=today + timedelta(days=6),
        calorie_target=data.calorie_target,
        diet_type=data.diet_type,
        allergies=data.allergies,
        is_active=True
    )
    db.add(nutrition_plan)
    db.commit()
    return {"plan": plan, "plan_id": nutrition_plan.id}


@router.get("/current")
def get_current_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()

    if not plan:
        return None  # Return None instead of raising error for frontend compatibility

    return {"plan_data": plan.plan_data, "plan_id": plan.id}


@router.get("/today")
def get_today_nutrition(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()

    if not plan:
        return None  # Return None for frontend compatibility

    try:
        plan_data = json.loads(plan.plan_data) if isinstance(plan.plan_data, str) else (plan.plan_data or {})
    except Exception:
        return None

    # Handle both "days" array and "week" object formats
    days = plan_data.get("days", [])
    if isinstance(days, dict):
        days = list(days.values())
    elif not days and "week" in plan_data:
        week = plan_data["week"]
        if isinstance(week, dict):
            days = [week[day] for day in ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"] if day in week]
        elif isinstance(week, list):
            days = week

    if not isinstance(days, list):
        days = []

    day_names = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    today_name = day_names[date.today().weekday()]

    today_meals = None
    for day in days:
        if isinstance(day, dict) and day.get("day", "").lower() == today_name.lower():
            today_meals = day
            break

    if not today_meals and days and isinstance(days[0], dict):
        today_meals = days[0]

    # Format response to match frontend expectations
    if today_meals and isinstance(today_meals, dict):
        return {
            "day": today_meals.get("day", today_name),
            "total_calories": today_meals.get("total_calories"),
            "breakfast": today_meals.get("breakfast"),
            "lunch": today_meals.get("lunch"),
            "dinner": today_meals.get("dinner"),
            "snacks": today_meals.get("snacks", [])
        }
    
    return None


@router.post("/meal/complete")
def complete_meal(
    data: CompleteMealRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    record = db.query(ProgressRecord).filter(
        ProgressRecord.user_id == current_user.id,
        ProgressRecord.date == today
    ).first()

    if record:
        record.meal_tracked = True
    else:
        record = ProgressRecord(
            user_id=current_user.id,
            date=today,
            meal_tracked=True,
        )
        db.add(record)

    current_user.charity_donations = (current_user.charity_donations or 0) + 2
    db.commit()
    return {"message": "Meal tracked! +2 charity points 💚"}


@router.get("/shopping-list")
def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    plan = db.query(NutritionPlan).filter(
        NutritionPlan.user_id == current_user.id,
        NutritionPlan.is_active == True
    ).order_by(NutritionPlan.created_at.desc()).first()

    if not plan:
        return []  # Return empty array instead of error

    plan_data = json.loads(plan.plan_data)
    ingredient_count = {}

    # Handle both "days" array and "week" object formats
    days = plan_data.get("days", [])
    if not days and "week" in plan_data:
        week = plan_data["week"]
        days = [week[day] for day in week.keys()]

    for day in days:
        for meal_type in ["breakfast", "lunch", "dinner"]:
            meal = day.get(meal_type, {})
            for ing in meal.get("ingredients", []):
                ing = ing.strip().lower()
                if ing:
                    ingredient_count[ing] = ingredient_count.get(ing, 0) + 1

    # Format as array of objects with name and count
    shopping_list = [{"name": k.title(), "count": v} for k, v in sorted(ingredient_count.items(), key=lambda x: -x[1])]
    return shopping_list


@router.get("/grocery-redirect/{ingredient}")
def grocery_redirect(ingredient: str):
    return {"url": f"https://www.bigbasket.com/ps/?q={ingredient}"}


def get_fallback_nutrition_plan():
    days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    plan = {"days": []}
    meals = [
        {"breakfast": {"name":"Idli Sambar","calories":350,"protein_g":12,"carbs_g":60,"fat_g":5,"ingredients":["idli","sambar","coconut chutney"],"time":"7:00 AM"},
         "lunch": {"name":"Dal Rice","calories":450,"protein_g":18,"carbs_g":75,"fat_g":8,"ingredients":["dal","rice","ghee","pickle"],"time":"1:00 PM"},
         "dinner": {"name":"Roti Sabzi","calories":400,"protein_g":14,"carbs_g":65,"fat_g":9,"ingredients":["roti","mixed vegetable sabzi","curd"],"time":"7:30 PM"},
         "snacks": [{"name":"Banana","calories":90},{"name":"Green Tea","calories":5}],
         "total_calories": 1295},
    ]
    for i, day in enumerate(days):
        meal = meals[i % len(meals)].copy()
        meal["day"] = day
        plan["days"].append(meal)
    return plan