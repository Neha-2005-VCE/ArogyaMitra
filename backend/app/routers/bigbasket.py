"""
BigBasket Integration Router
Handles ingredient extraction and BigBasket cart integration
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.services.ingredient_extractor import ingredient_extractor

router = APIRouter(prefix="/api/bigbasket", tags=["BigBasket"])


class MealItem(BaseModel):
    name: str
    calories: Optional[int] = 0
    protein: Optional[int] = 0


class DayPlan(BaseModel):
    day: str
    breakfast: Optional[MealItem | str] = None
    lunch: Optional[MealItem | str] = None
    dinner: Optional[MealItem | str] = None
    snacks: Optional[MealItem | str] = None


class ExtractIngredientsRequest(BaseModel):
    week_plan: List[DayPlan]


@router.post("/extract-ingredients")
async def extract_ingredients(
    data: ExtractIngredientsRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Extract ingredients from weekly meal plan
    
    Takes the full weekly meal plan and returns a deduplicated shopping list
    with quantities and BigBasket URLs
    """
    try:
        # Convert to dict format
        week_plan_dict = [day.dict() for day in data.week_plan]
        
        # Extract ingredients
        result = ingredient_extractor.extract_ingredients(week_plan_dict)
        
        return {
            "success": True,
            "ingredients": result["ingredients"],
            "total_items": result["total_items"],
            "categories": result["categories"],
            "message": f"Found {result['total_items']} unique ingredients"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract ingredients: {str(e)}")


@router.get("/shopping-list")
async def get_shopping_list(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get shopping list from user's current nutrition plan
    """
    try:
        from app.models.user import NutritionPlan
        import json
        
        # Get active nutrition plan
        plan = db.query(NutritionPlan).filter(
            NutritionPlan.user_id == current_user.id,
            NutritionPlan.is_active == True
        ).order_by(NutritionPlan.created_at.desc()).first()
        
        if not plan:
            raise HTTPException(status_code=404, detail="No active nutrition plan found")
        
        # Parse plan data
        plan_data = json.loads(plan.plan_data) if isinstance(plan.plan_data, str) else plan.plan_data
        days = plan_data.get('days', plan_data.get('week', []))
        
        # Extract ingredients
        result = ingredient_extractor.extract_ingredients(days)
        
        return {
            "success": True,
            "ingredients": result["ingredients"],
            "total_items": result["total_items"],
            "categories": result["categories"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get shopping list: {str(e)}")


@router.post("/generate-bigbasket-urls")
async def generate_bigbasket_urls(
    data: Dict,
    current_user: User = Depends(get_current_user)
):
    """
    Generate BigBasket search URLs for a list of ingredients
    """
    try:
        ingredients = data.get('ingredients', [])
        
        urls = []
        for ingredient in ingredients:
            name = ingredient if isinstance(ingredient, str) else ingredient.get('name', '')
            urls.append({
                "ingredient": name,
                "url": f"https://www.bigbasket.com/ps/?q={name.replace(' ', '+')}"
            })
        
        return {
            "success": True,
            "urls": urls,
            "total": len(urls)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate URLs: {str(e)}")
