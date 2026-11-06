# 🍽️ Spoonacular Service - Enhanced Implementation

## ✅ What Was Updated

The Spoonacular service has been completely refactored with 5 powerful new methods while maintaining full backward compatibility.

---

## 📦 New Methods Available

### 1. `generate_meal_plan(calories, diet, exclude, time_frame)`
- Generate daily or weekly meal plans
- Supports all diet types (vegetarian, vegan, keto, paleo, etc.)
- Exclude specific allergens
- Auto-fallback to Indian meals if API unavailable

### 2. `get_recipe_details(recipe_id)`
- Full recipe information with ingredients, steps, nutrition
- Structured data extraction for ArogyaMitra needs
- Returns: title, image, cooking time, servings, ingredients list, instructions, macros

### 3. `search_recipes(query, diet, intolerances, max_calories, number)`
- Advanced recipe search with dietary filters
- Filter by intolerances (gluten, dairy, etc.)
- Calorie limits
- Returns recipes with nutrition info

### 4. `get_grocery_list(recipe_ids)`
- Aggregate ingredients from multiple recipes
- Smart deduplication (same ingredient counted together)
- Perfect for shopping list generation
- Returns: name, amount, unit, count

### 5. `get_nutrition_summary(recipe_id)`
- Quick nutrition widget/label for any recipe
- Calories, protein, carbs, fat, fiber
- Formatted for display

---

## 🔌 API Endpoints

### 1. POST `/api/nutrition/meal-plan`
Generate a 7-day personalized meal plan
```json
{
  "calories": 2000,
  "diet": "vegetarian",
  "exclude": "peanuts,dairy",
  "time_frame": "week"
}
```

### 2. GET `/api/nutrition/recipe/{recipe_id}`
Get full recipe details with ingredients, steps, and macros
```
GET /api/nutrition/recipe/716429
```

### 3. GET `/api/nutrition/search`
Search recipes with dietary filters
```
GET /api/nutrition/search?query=dal&diet=vegetarian&intolerances=gluten&max_calories=500&number=10
```

### 4. POST `/api/nutrition/grocery-list`
Generate shopping list from multiple recipes
```json
{
  "recipe_ids": [123, 456, 789]
}
```

### 5. GET `/api/nutrition/summary/{recipe_id}`
Get quick nutrition summary widget
```
GET /api/nutrition/summary/716429
```

---

## 🔄 Backward Compatibility

The old `SpoonacularService` class is still available:
- `spoonacular_service.get_meal_plan()` ✅
- `spoonacular_service.get_recipe_information()` ✅
- `spoonacular_service.search_recipes()` ✅
- `spoonacular_service.get_weekly_indian_meal_plan()` ✅

All existing code continues to work without changes!

---

## 🏗️ Architecture Changes

### Before:
```python
class SpoonacularService:
    async def get_meal_plan(...)
    async def get_recipe_information(...)
    async def search_recipes(...)
```

### After:
```python
# New: Standalone async functions (recommended)
async def generate_meal_plan(...)
async def get_recipe_details(...)
async def search_recipes(...)
async def get_grocery_list(...)
async def get_nutrition_summary(...)

# Legacy: Class wrapper (backward compatible)
class SpoonacularService:
    # Wraps new functions for compatibility
```

---

## 🎯 Key Features

1. **Fallback System**: Automatically uses hardcoded Indian meals if API unavailable
2. **Smart Nutrient Extraction**: Helper function `_get_nutrient()` for consistent data
3. **Error Handling**: Graceful degradation on API failures
4. **Ingredient Aggregation**: Smart deduplication in grocery lists
5. **Dietary Filters**: Support for all major diets and intolerances

---

## 🧪 Testing

Test the API at: `http://localhost:8000/docs`

Look for the "Nutrition - Spoonacular" section with 5 endpoints:
1. POST `/api/nutrition/meal-plan` - Generate meal plan
2. GET `/api/nutrition/recipe/{recipe_id}` - Recipe details
3. GET `/api/nutrition/search` - Search recipes
4. POST `/api/nutrition/grocery-list` - Shopping list
5. GET `/api/nutrition/summary/{recipe_id}` - Nutrition summary

---

## 📝 Example Usage

### Generate Weekly Meal Plan
```python
from app.services.spoonacular_service import generate_meal_plan

plan = await generate_meal_plan(
    calories=2000,
    diet="vegetarian",
    exclude="peanuts",
    time_frame="week"
)
```

### Get Grocery List
```python
from app.services.spoonacular_service import get_grocery_list

shopping_list = await get_grocery_list([123, 456, 789])
# Returns: [{"name": "tomatoes", "amount": 3, "unit": "cups", "count": 2}, ...]
```

### Search Recipes
```python
from app.services.spoonacular_service import search_recipes

recipes = await search_recipes(
    query="paneer curry",
    diet="vegetarian",
    intolerances="gluten,dairy",
    max_calories=500,
    number=10
)
```

---

## ✨ What's Next?

The enhanced Spoonacular service is now ready for:
- Frontend integration with meal planning UI
- Shopping list generation
- Recipe browsing and search
- Nutrition tracking
- Dietary preference management

All methods include proper error handling and fallback to Indian meals when needed!
