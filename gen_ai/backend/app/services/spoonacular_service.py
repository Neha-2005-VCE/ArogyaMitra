# app/services/spoonacular_service.py
import os
import httpx
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv

load_dotenv()

SPOONACULAR_BASE = "https://api.spoonacular.com"

class SpoonacularService:
    def _key(self) -> str:
        key = os.getenv("SPOONACULAR_API_KEY", "")
        if key == "SPOONACULAR_API_KEY":
            return ""
        return key

    async def generate_meal_plan(
        self,
        calories: int = 2000,
        diet: str = "vegetarian",
        exclude: str = "",
        time_frame: str = "week",
    ) -> Dict[str, Any]:
        """Generate a full 7-day meal plan via Spoonacular."""
        if not self._key():
            print("⚠️  SPOONACULAR_API_KEY not set in .env")
            return {}

        params = {
            "apiKey":        self._key(),
            "timeFrame":     time_frame,
            "targetCalories": calories,
            "diet":          diet,
        }
        if exclude:
            params["exclude"] = exclude

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{SPOONACULAR_BASE}/mealplanner/generate", params=params
                )
                resp.raise_for_status()
                data = resp.json()
                print(f"✅ Spoonacular: meal plan generated ({time_frame}, {calories} cal, {diet})")
                return data
        except Exception as e:
            print(f"❌ Spoonacular Error (generate_meal_plan): {e}")
            return {}

    async def get_recipe_details(self, recipe_id: int) -> Dict[str, Any]:
        """Fetch full recipe details: ingredients, steps, macros, image."""
        if not self._key():
            return {}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{SPOONACULAR_BASE}/recipes/{recipe_id}/information",
                    params={"apiKey": self._key(), "includeNutrition": True},
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
                        "calories":  self._get_nutrient(data, "Calories"),
                        "protein":   self._get_nutrient(data, "Protein"),
                        "carbs":     self._get_nutrient(data, "Carbohydrates"),
                        "fat":       self._get_nutrient(data, "Fat"),
                        "fiber":     self._get_nutrient(data, "Fiber"),
                    },
                }
        except Exception as e:
            print(f"❌ Spoonacular recipe details error (id={recipe_id}): {e}")
            return {}

    def _get_nutrient(self, data: Dict[str, Any], name: str) -> str:
        """Extract a specific nutrient value from recipe nutrition data."""
        try:
            nutrients = data.get("nutrition", {}).get("nutrients", [])
            for n in nutrients:
                if n.get("name") == name:
                    val = n.get("amount", 0)
                    unit = n.get("unit", "")
                    return f"{val:.1f}{unit}"
        except (AttributeError, TypeError):
            pass
        return "N/A"

    async def search_recipes(
        self,
        query: str,
        diet: str = "",
        intolerances: str = "",
        max_calories: int = 0,
        number: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search for recipes by keyword + dietary filters."""
        if not self._key():
            return []

        params = {
            "apiKey":       self._key(),
            "query":        query,
            "number":       number,
            "addRecipeNutrition": True,
            "fillIngredients": True,
            "addRecipeInformation": True,
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
                    f"{SPOONACULAR_BASE}/recipes/complexSearch", params=params
                )
                resp.raise_for_status()
                results = resp.json().get("results", [])
                return [
                    {
                        "id":       r.get("id"),
                        "title":    r.get("title"),
                        "image":    r.get("image"),
                        "sourceUrl": r.get("sourceUrl"),
                        "calories": self._get_nutrient(r, "Calories"),
                        "protein":  self._get_nutrient(r, "Protein"),
                        "carbs":    self._get_nutrient(r, "Carbohydrates"),
                        "fat":      self._get_nutrient(r, "Fat"),
                    }
                    for r in results
                ]
        except Exception as e:
            print(f"❌ Spoonacular Error (search_recipes): {e}")
            return []

    async def get_recommended_recipes(self, diet: str = "", calories: int = 0) -> List[Dict[str, Any]]:
        """Helper for AI enrichment - finds healthy recipes matching diet and calorie targets."""
        return await self.search_recipes(
            query="healthy",
            diet=diet,
            max_calories=calories or 800,
            number=7
        )

    async def get_grocery_list(self, recipe_ids: List[int]) -> List[Dict[str, Any]]:
        """Aggregate ingredients from multiple recipes into a shopping list."""
        all_ingredients = {} # Simplified type to avoid linter confusion

        for rid in recipe_ids:
            details = await self.get_recipe_details(rid)
            ingredients = details.get("ingredients", [])
            for ing in ingredients:
                name = ing.get("name", "").lower().strip()
                if not name:
                    continue
                if name in all_ingredients:
                    target = all_ingredients[name]
                    target["count"] = target.get("count", 1) + 1
                else:
                    all_ingredients[name] = {
                        "name":   ing.get("name"),
                        "amount": ing.get("amount"),
                        "unit":   ing.get("unit"),
                        "count":  1,
                    }

        return list(all_ingredients.values())

    async def get_nutrition_summary(self, recipe_id: int) -> Dict[str, Any]:
        """Get a quick nutrition label / widget summary for one recipe."""
        if not self._key():
            print("⚠️  SPOONACULAR_API_KEY not set in .env")
            return {}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(
                    f"{SPOONACULAR_BASE}/recipes/{recipe_id}/nutritionWidget.json",
                    params={"apiKey": self._key()},
                )
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            print(f"❌ Spoonacular Error (get_nutrition_summary): {e}")
            return {}

spoonacular_service = SpoonacularService()
