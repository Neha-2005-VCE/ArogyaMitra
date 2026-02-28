from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from app.services.spoonacular_service import spoonacular_service

router = APIRouter(prefix="/api/nutrition", tags=["Nutrition - Spoonacular"])

@router.post("/meal-plan")
async def get_meal_plan(
    calories: int = Query(2000, description="Target calories for the day"),
    diet: str = Query("vegetarian", description="Dietary preference (e.g. vegetarian, vegan, paleo)"),
    exclude: str = Query("", description="Ingredients to exclude")
):
    """
    Generate a 7-day meal plan using the Spoonacular API.
    """
    result = await spoonacular_service.generate_meal_plan(calories, diet, exclude)
    
    if not result:
        raise HTTPException(status_code=500, detail="Failed to generate meal plan from Spoonacular")
        
    return result

@router.get("/recipes/search")
async def search_recipes(
    query: str = Query(..., description="Search query"),
    diet: Optional[str] = Query(None, description="Dietary preference"),
    max_calories: int = Query(800, description="Max calories per serving")
):
    """
    Search for recipes based on query, diet, and calorie constraints.
    """
    results = await spoonacular_service.search_recipes(
        query=query,
        diet=diet or "",
        max_calories=max_calories
    )
    return {"results": results}

@router.get("/recipes/{recipe_id}")
async def get_recipe_details(recipe_id: int):
    """
    Get full details for a specific recipe.
    """
    details = await spoonacular_service.get_recipe_details(recipe_id)
    if not details:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return details
