# app/routers/spoonacular.py
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from app.services.spoonacular_service import (
    generate_meal_plan,
    get_recipe_details,
    search_recipes,
    get_grocery_list,
    get_nutrition_summary,
)

router = APIRouter(prefix="/api/nutrition", tags=["Nutrition - Spoonacular"])


# ── 1. Generate 7-Day Meal Plan ───────────────────────────────
# POST /api/nutrition/meal-plan

class MealPlanRequest(BaseModel):
    calories:   int = 2000
    diet:       str = "vegetarian"   # vegetarian | vegan | keto | paleo
    exclude:    str = ""             # "peanuts,dairy,gluten"
    time_frame: str = "week"         # "day" or "week"


@router.post("/meal-plan")
async def create_meal_plan(request: MealPlanRequest):
    """
    Generate a 7-day personalized meal plan.
    Called after health assessment is completed.
    """
    plan = await generate_meal_plan(
        calories=request.calories,
        diet=request.diet,
        exclude=request.exclude,
        time_frame=request.time_frame,
    )
    
    if not plan:
        raise HTTPException(
            status_code=503, 
            detail="Spoonacular API unavailable or key missing"
        )
    
    return {"status": "success", "plan": plan}


# ── 2. Get Recipe Details ─────────────────────────────────────
# GET /api/nutrition/recipe/716429

@router.get("/recipe/{recipe_id}")
async def recipe_details(recipe_id: int):
    """
    Get full recipe: ingredients, steps, macros.
    Called when user clicks a meal in the nutrition plan.
    """
    details = await get_recipe_details(recipe_id)
    
    if not details:
        raise HTTPException(
            status_code=404, 
            detail=f"Recipe {recipe_id} not found"
        )
    
    return details


# ── 3. Search Recipes ─────────────────────────────────────────
# GET /api/nutrition/search?query=dal&diet=vegetarian&intolerances=gluten

@router.get("/search")
async def search(
    query:        str = Query(..., description="Search keyword e.g. 'dal', 'chicken'"),
    diet:         str = Query("", description="vegetarian | vegan | keto | paleo"),
    intolerances: str = Query("", description="Comma-separated: gluten,dairy,peanut"),
    max_calories: int = Query(0,  description="Max calories per serving (0 = no limit)"),
    number:       int = Query(10, description="Number of results"),
):
    """Search Spoonacular recipes with dietary filters."""
    results = await search_recipes(
        query=query,
        diet=diet,
        intolerances=intolerances,
        max_calories=max_calories,
        number=number,
    )
    
    return {"query": query, "count": len(results), "results": results}


# ── 4. Grocery / Shopping List ────────────────────────────────
# POST /api/nutrition/grocery-list

class GroceryRequest(BaseModel):
    recipe_ids: list[int]


@router.post("/grocery-list")
async def grocery_list(request: GroceryRequest):
    """
    Aggregate ingredients from multiple recipes into a shopping list.
    Used in the 'Shopping List' tab of the Nutrition module.
    """
    if not request.recipe_ids:
        raise HTTPException(
            status_code=400, 
            detail="Provide at least one recipe_id"
        )
    
    items = await get_grocery_list(request.recipe_ids)
    
    return {"count": len(items), "items": items}


# ── 5. Nutrition Summary ──────────────────────────────────────
# GET /api/nutrition/summary/716429

@router.get("/summary/{recipe_id}")
async def nutrition_summary(recipe_id: int):
    """
    Get quick macro/calorie label for a recipe.
    Used on meal cards in the nutrition plan.
    """
    summary = await get_nutrition_summary(recipe_id)
    
    if not summary:
        raise HTTPException(
            status_code=404, 
            detail=f"Nutrition data not found for {recipe_id}"
        )
    
    return summary
