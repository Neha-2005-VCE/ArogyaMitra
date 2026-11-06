# app/services/spoonacular_service.py
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_BASE = "https://api.spoonacular.com"


def _key() -> str:
    return os.getenv("SPOONACULAR_API_KEY", "")


# ─── 1. Generate 7-Day Meal Plan ─────────────────────────────
async def generate_meal_plan(
    calories: int = 2000,
    diet: str = "vegetarian",        # vegetarian, vegan, keto, paleo, etc.
    exclude: str = "",               # comma-separated allergies e.g. "peanuts,dairy"
    time_frame: str = "week",        # "day" or "week"
) -> dict:
    """
    Generate a full 7-day meal plan via Spoonacular.
    Called when user submits health assessment and wants a nutrition plan.
    """
    if not _key():
        print("⚠️  SPOONACULAR_API_KEY not set in .env - using fallback")
        return get_weekly_indian_meal_plan(calories, diet)
    
    params = {
        "apiKey":        _key(),
        "timeFrame":     time_frame,
        "targetCalories": calories,
        "diet":          diet,
    }
    if exclude:
        params["exclude"] = exclude
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{SPOONACULAR_BASE}/mealplanner/generate", 
                params=params
            )
            resp.raise_for_status()
            data = resp.json()
            print(f"✅ Spoonacular: meal plan generated ({time_frame}, {calories} cal, {diet})")
            return data
    except Exception as e:
        print(f"❌ Spoonacular meal plan error: {e}")
        return get_weekly_indian_meal_plan(calories, diet)


# ─── 2. Get Recipe Details ────────────────────────────────────
async def get_recipe_details(recipe_id: int) -> dict:
    """
    Fetch full recipe details: ingredients, steps, macros, image.
    Used when user clicks on a meal to see the recipe.
    """
    if not _key():
        return {}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{SPOONACULAR_BASE}/recipes/{recipe_id}/information",
                params={"apiKey": _key(), "includeNutrition": True},
            )
            resp.raise_for_status()
            data = resp.json()
            
            # Extract only what ArogyaMitra needs
            return {
                "id":           data.get("id"),
                "title":        data.get("title"),
                "image":        data.get("image"),
                "readyInMinutes": data.get("readyInMinutes"),
                "servings":     data.get("servings"),
                "sourceUrl":    data.get("sourceUrl"),
                "ingredients":  [
                    {
                        "name":   ing["name"],
                        "amount": ing["amount"],
                        "unit":   ing["unit"],
                    }
                    for ing in data.get("extendedIngredients", [])
                ],
                "instructions": data.get("instructions", ""),
                "nutrition": {
                    "calories":  _get_nutrient(data, "Calories"),
                    "protein":   _get_nutrient(data, "Protein"),
                    "carbs":     _get_nutrient(data, "Carbohydrates"),
                    "fat":       _get_nutrient(data, "Fat"),
                    "fiber":     _get_nutrient(data, "Fiber"),
                },
            }
    except Exception as e:
        print(f"❌ Spoonacular recipe details error (id={recipe_id}): {e}")
        return {}


def _get_nutrient(data: dict, name: str) -> str:
    """Extract a specific nutrient value from recipe nutrition data."""
    try:
        nutrients = data["nutrition"]["nutrients"]
        for n in nutrients:
            if n["name"] == name:
                return f"{round(n['amount'], 1)}{n['unit']}"
    except (KeyError, TypeError):
        pass
    return "N/A"


# ─── 3. Search Recipes ────────────────────────────────────────
async def search_recipes(
    query: str,
    diet: str = "",
    intolerances: str = "",   # e.g. "gluten,dairy"
    max_calories: int = 0,
    number: int = 10,
) -> list[dict]:
    """
    Search for recipes by keyword + dietary filters.
    Used for custom meal suggestions.
    """
    if not _key():
        return []
    
    params = {
        "apiKey":       _key(),
        "query":        query,
        "number":       number,
        "addRecipeNutrition": True,
        "fillIngredients": True,
    }
    if diet:
        params["diet"] = diet
    if intolerances:
        params["intolerances"] = intolerances
    if max_calories:
        params["maxCalories"] = max_calories
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{SPOONACULAR_BASE}/recipes/complexSearch", 
                params=params
            )
            resp.raise_for_status()
            results = resp.json().get("results", [])
            
            return [
                {
                    "id":       r.get("id"),
                    "title":    r.get("title"),
                    "image":    r.get("image"),
                    "calories": _get_nutrient(r, "Calories"),
                    "protein":  _get_nutrient(r, "Protein"),
                    "carbs":    _get_nutrient(r, "Carbohydrates"),
                    "fat":      _get_nutrient(r, "Fat"),
                }
                for r in results
            ]
    except Exception as e:
        print(f"❌ Spoonacular search error: {e}")
        return []


# ─── 4. Get Grocery / Ingredient List ────────────────────────
async def get_grocery_list(recipe_ids: list[int]) -> list[dict]:
    """
    Aggregate ingredients from multiple recipes into a
    shopping/grocery list. Used in the Shopping List tab.
    """
    all_ingredients: dict[str, dict] = {}
    
    for rid in recipe_ids:
        details = await get_recipe_details(rid)
        for ing in details.get("ingredients", []):
            name = ing["name"].lower().strip()
            if name in all_ingredients:
                # accumulate amounts for same ingredient
                all_ingredients[name]["count"] += 1
            else:
                all_ingredients[name] = {
                    "name":   ing["name"],
                    "amount": ing["amount"],
                    "unit":   ing["unit"],
                    "count":  1,
                }
    
    return list(all_ingredients.values())


# ─── 5. Get Nutrition Summary for a Recipe ───────────────────
async def get_nutrition_summary(recipe_id: int) -> dict:
    """Get a quick nutrition label / widget summary for one recipe."""
    if not _key():
        return {}
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{SPOONACULAR_BASE}/recipes/{recipe_id}/nutritionWidget.json",
                params={"apiKey": _key()},
            )
            resp.raise_for_status()
            return resp.json()
    except Exception as e:
        print(f"❌ Spoonacular nutrition summary error: {e}")
        return {}


# ─── FALLBACK: Hardcoded Indian Meal Plan ────────────────────
def get_weekly_indian_meal_plan(calories: int, diet: str) -> dict:
    """
    Hardcoded fallback Indian meal plan for 7 days
    Used when Spoonacular API is unavailable
    """
    
    # Adjust meals based on diet preference
    is_veg = diet.lower() in ["vegetarian", "vegan"]
    
    weekly_meals = {
        "Monday": {
            "breakfast": {
                "name": "Poha with Peanuts",
                "calories": 320,
                "protein_g": 8,
                "carbs_g": 55,
                "fat_g": 7,
                "ingredients": ["poha", "peanuts", "curry leaves", "turmeric", "lemon"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Dal Tadka with Rice",
                "calories": 480,
                "protein_g": 18,
                "carbs_g": 78,
                "fat_g": 10,
                "ingredients": ["toor dal", "rice", "ghee", "cumin", "tomatoes"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Roti with Palak Paneer" if is_veg else "Roti with Chicken Curry",
                "calories": 420,
                "protein_g": 22,
                "carbs_g": 48,
                "fat_g": 14,
                "ingredients": ["whole wheat flour", "spinach", "paneer" if is_veg else "chicken", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Banana", "calories": 90},
                {"name": "Masala Chai", "calories": 50}
            ]
        },
        "Tuesday": {
            "breakfast": {
                "name": "Idli Sambar",
                "calories": 350,
                "protein_g": 12,
                "carbs_g": 60,
                "fat_g": 5,
                "ingredients": ["idli rice", "urad dal", "sambar", "coconut chutney"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Rajma Chawal",
                "calories": 500,
                "protein_g": 20,
                "carbs_g": 82,
                "fat_g": 8,
                "ingredients": ["kidney beans", "rice", "onions", "tomatoes", "spices"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Vegetable Pulao with Raita" if is_veg else "Biryani with Raita",
                "calories": 450,
                "protein_g": 15,
                "carbs_g": 70,
                "fat_g": 12,
                "ingredients": ["basmati rice", "mixed vegetables" if is_veg else "chicken", "yogurt", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Roasted Chana", "calories": 120},
                {"name": "Green Tea", "calories": 5}
            ]
        },
        "Wednesday": {
            "breakfast": {
                "name": "Upma",
                "calories": 310,
                "protein_g": 9,
                "carbs_g": 52,
                "fat_g": 8,
                "ingredients": ["semolina", "vegetables", "curry leaves", "mustard seeds"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Chole with Rice",
                "calories": 520,
                "protein_g": 22,
                "carbs_g": 85,
                "fat_g": 9,
                "ingredients": ["chickpeas", "rice", "onions", "tomatoes", "garam masala"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Roti with Mixed Dal",
                "calories": 400,
                "protein_g": 18,
                "carbs_g": 62,
                "fat_g": 8,
                "ingredients": ["whole wheat flour", "mixed lentils", "ghee", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Apple", "calories": 80},
                {"name": "Almonds (10)", "calories": 70}
            ]
        },
        "Thursday": {
            "breakfast": {
                "name": "Paratha with Curd",
                "calories": 380,
                "protein_g": 11,
                "carbs_g": 58,
                "fat_g": 12,
                "ingredients": ["whole wheat flour", "potato" if is_veg else "egg", "yogurt", "butter"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Paneer Butter Masala with Naan" if is_veg else "Butter Chicken with Naan",
                "calories": 550,
                "protein_g": 25,
                "carbs_g": 65,
                "fat_g": 20,
                "ingredients": ["paneer" if is_veg else "chicken", "tomatoes", "cream", "naan", "butter"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Khichdi with Kadhi",
                "calories": 420,
                "protein_g": 16,
                "carbs_g": 68,
                "fat_g": 9,
                "ingredients": ["rice", "moong dal", "yogurt", "besan", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Sprouts Salad", "calories": 100},
                {"name": "Buttermilk", "calories": 40}
            ]
        },
        "Friday": {
            "breakfast": {
                "name": "Dosa with Chutney",
                "calories": 340,
                "protein_g": 10,
                "carbs_g": 62,
                "fat_g": 6,
                "ingredients": ["rice", "urad dal", "coconut chutney", "sambar"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Vegetable Biryani" if is_veg else "Mutton Biryani",
                "calories": 580,
                "protein_g": 20,
                "carbs_g": 88,
                "fat_g": 16,
                "ingredients": ["basmati rice", "vegetables" if is_veg else "mutton", "yogurt", "spices"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Roti with Aloo Gobi",
                "calories": 390,
                "protein_g": 12,
                "carbs_g": 64,
                "fat_g": 10,
                "ingredients": ["whole wheat flour", "potato", "cauliflower", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Fruit Salad", "calories": 110},
                {"name": "Herbal Tea", "calories": 5}
            ]
        },
        "Saturday": {
            "breakfast": {
                "name": "Aloo Paratha with Pickle",
                "calories": 400,
                "protein_g": 10,
                "carbs_g": 65,
                "fat_g": 13,
                "ingredients": ["whole wheat flour", "potato", "ghee", "pickle"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Kadhi Pakora with Rice",
                "calories": 490,
                "protein_g": 16,
                "carbs_g": 75,
                "fat_g": 14,
                "ingredients": ["yogurt", "besan", "rice", "pakoras", "spices"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Roti with Baingan Bharta" if is_veg else "Roti with Fish Curry",
                "calories": 410,
                "protein_g": 18,
                "carbs_g": 58,
                "fat_g": 12,
                "ingredients": ["whole wheat flour", "eggplant" if is_veg else "fish", "tomatoes", "spices"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Roasted Makhana", "calories": 90},
                {"name": "Coconut Water", "calories": 45}
            ]
        },
        "Sunday": {
            "breakfast": {
                "name": "Puri Bhaji",
                "calories": 420,
                "protein_g": 11,
                "carbs_g": 68,
                "fat_g": 14,
                "ingredients": ["whole wheat flour", "potato", "oil", "spices"],
                "time": "7:00 AM"
            },
            "lunch": {
                "name": "Special Thali",
                "calories": 600,
                "protein_g": 24,
                "carbs_g": 90,
                "fat_g": 18,
                "ingredients": ["rice", "roti", "dal", "sabzi", "raita", "pickle"],
                "time": "1:00 PM"
            },
            "dinner": {
                "name": "Khichdi with Papad",
                "calories": 380,
                "protein_g": 14,
                "carbs_g": 65,
                "fat_g": 8,
                "ingredients": ["rice", "moong dal", "ghee", "papad"],
                "time": "7:30 PM"
            },
            "snacks": [
                {"name": "Dates (3)", "calories": 70},
                {"name": "Lassi", "calories": 120}
            ]
        }
    }
    
    # Calculate total calories for each day
    for day, meals in weekly_meals.items():
        total = (
            meals["breakfast"]["calories"] +
            meals["lunch"]["calories"] +
            meals["dinner"]["calories"] +
            sum(s["calories"] for s in meals["snacks"])
        )
        meals["total_calories"] = total
        meals["day"] = day
    
    return {
        "week": weekly_meals,
        "target_calories": calories,
        "diet_type": diet,
        "source": "fallback_indian_meals"
    }


# ─── BACKWARD COMPATIBILITY: Class-based wrapper ──────────────
class SpoonacularService:
    """
    Legacy class wrapper for backward compatibility.
    New code should use the async functions directly.
    """
    def __init__(self):
        self.api_key = _key()
        self.base_url = SPOONACULAR_BASE

    async def get_meal_plan(
        self, 
        calories: int = 1800, 
        diet: str = "vegetarian", 
        exclude: str = ""
    ) -> dict:
        """Backward compatible wrapper for generate_meal_plan"""
        return await generate_meal_plan(calories, diet, exclude, time_frame="day")

    async def get_recipe_information(self, recipe_id: int) -> dict:
        """Backward compatible wrapper for get_recipe_details"""
        result = await get_recipe_details(recipe_id)
        return result if result else {"error": "No API key configured"}

    async def search_recipes(
        self,
        query: str,
        cuisine: str = "indian",
        diet: str = "",
        number: int = 10
    ) -> dict:
        """Backward compatible wrapper for search_recipes"""
        results = await search_recipes(query, diet=diet, number=number)
        return {"results": results, "totalResults": len(results)}

    def get_weekly_indian_meal_plan(self, calories: int, diet: str) -> dict:
        """Direct access to fallback meal plan"""
        return get_weekly_indian_meal_plan(calories, diet)


# Singleton instance for backward compatibility
spoonacular_service = SpoonacularService()
