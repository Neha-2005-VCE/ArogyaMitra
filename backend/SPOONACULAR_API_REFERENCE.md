# 🍽️ Spoonacular API Reference

Quick reference for all Spoonacular nutrition endpoints in ArogyaMitra.

---

## Base URL
```
http://localhost:8000/api/nutrition
```

---

## 1️⃣ Generate Meal Plan

**Endpoint:** `POST /api/nutrition/meal-plan`

**Description:** Generate a personalized meal plan (daily or weekly)

**Request Body:**
```json
{
  "calories": 2000,
  "diet": "vegetarian",
  "exclude": "peanuts,dairy",
  "time_frame": "week"
}
```

**Parameters:**
- `calories` (int): Target daily calories (default: 2000)
- `diet` (string): Diet type - vegetarian, vegan, keto, paleo, etc.
- `exclude` (string): Comma-separated allergens to exclude
- `time_frame` (string): "day" or "week" (default: "week")

**Response:**
```json
{
  "status": "success",
  "plan": {
    "week": {
      "Monday": { "breakfast": {...}, "lunch": {...}, "dinner": {...} },
      "Tuesday": {...},
      ...
    }
  }
}
```

**Use Case:** Called after health assessment to generate nutrition plan

---

## 2️⃣ Get Recipe Details

**Endpoint:** `GET /api/nutrition/recipe/{recipe_id}`

**Description:** Get full recipe with ingredients, steps, and nutrition

**Example:**
```
GET /api/nutrition/recipe/716429
```

**Response:**
```json
{
  "id": 716429,
  "title": "Paneer Butter Masala",
  "image": "https://...",
  "readyInMinutes": 30,
  "servings": 4,
  "sourceUrl": "https://...",
  "ingredients": [
    {"name": "paneer", "amount": 200, "unit": "g"},
    {"name": "tomatoes", "amount": 3, "unit": ""}
  ],
  "instructions": "Step 1: ...",
  "nutrition": {
    "calories": "350kcal",
    "protein": "15g",
    "carbs": "25g",
    "fat": "20g",
    "fiber": "5g"
  }
}
```

**Use Case:** When user clicks a meal card to see recipe details

---

## 3️⃣ Search Recipes

**Endpoint:** `GET /api/nutrition/search`

**Description:** Search recipes with dietary filters

**Query Parameters:**
- `query` (required): Search keyword (e.g., "dal", "chicken curry")
- `diet` (optional): vegetarian, vegan, keto, paleo
- `intolerances` (optional): Comma-separated (e.g., "gluten,dairy")
- `max_calories` (optional): Maximum calories per serving (0 = no limit)
- `number` (optional): Number of results (default: 10)

**Example:**
```
GET /api/nutrition/search?query=dal&diet=vegetarian&intolerances=gluten&max_calories=500&number=10
```

**Response:**
```json
{
  "query": "dal",
  "count": 10,
  "results": [
    {
      "id": 123,
      "title": "Dal Tadka",
      "image": "https://...",
      "calories": "280kcal",
      "protein": "12g",
      "carbs": "45g",
      "fat": "8g"
    },
    ...
  ]
}
```

**Use Case:** Custom meal search, recipe discovery

---

## 4️⃣ Generate Grocery List

**Endpoint:** `POST /api/nutrition/grocery-list`

**Description:** Aggregate ingredients from multiple recipes into shopping list

**Request Body:**
```json
{
  "recipe_ids": [716429, 654959, 782585]
}
```

**Response:**
```json
{
  "count": 15,
  "items": [
    {
      "name": "tomatoes",
      "amount": 6,
      "unit": "",
      "count": 3
    },
    {
      "name": "paneer",
      "amount": 400,
      "unit": "g",
      "count": 2
    },
    ...
  ]
}
```

**Use Case:** Shopping List tab in nutrition module

---

## 5️⃣ Get Nutrition Summary

**Endpoint:** `GET /api/nutrition/summary/{recipe_id}`

**Description:** Quick nutrition widget/label for a recipe

**Example:**
```
GET /api/nutrition/summary/716429
```

**Response:**
```json
{
  "calories": "350",
  "carbs": "25g",
  "fat": "20g",
  "protein": "15g",
  "bad": [...],
  "good": [...]
}
```

**Use Case:** Display nutrition info on meal cards

---

## 🔑 Environment Setup

Add to `.env`:
```env
SPOONACULAR_API_KEY=your_api_key_here
```

Get your free API key at: https://spoonacular.com/food-api

---

## 🛡️ Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK` - Success
- `400 Bad Request` - Invalid parameters (e.g., empty recipe_ids)
- `404 Not Found` - Recipe not found
- `503 Service Unavailable` - API key missing or Spoonacular API down

**Fallback:** When API unavailable, meal plan endpoint automatically returns hardcoded Indian meals

---

## 💡 Tips

1. **Meal Plan Generation**: Use `time_frame="week"` for full 7-day plans
2. **Search**: Combine `diet` and `intolerances` for precise filtering
3. **Grocery List**: Pass all recipe IDs from a weekly plan for complete shopping list
4. **Caching**: Recipe details are fetched fresh each time (consider caching in frontend)
5. **Fallback**: Indian meal fallback works without API key for testing

---

## 🧪 Quick Test

```bash
# Test meal plan generation
curl -X POST http://localhost:8000/api/nutrition/meal-plan \
  -H "Content-Type: application/json" \
  -d '{"calories": 2000, "diet": "vegetarian", "time_frame": "week"}'

# Search recipes
curl "http://localhost:8000/api/nutrition/search?query=dal&diet=vegetarian&number=5"

# Get recipe details
curl http://localhost:8000/api/nutrition/recipe/716429

# Generate grocery list
curl -X POST http://localhost:8000/api/nutrition/grocery-list \
  -H "Content-Type: application/json" \
  -d '{"recipe_ids": [716429, 654959]}'

# Get nutrition summary
curl http://localhost:8000/api/nutrition/summary/716429
```

---

## 📚 Related Documentation

- `SPOONACULAR_ENHANCED.md` - Implementation details
- `NUTRITION_FRONTEND_INTEGRATION.md` - Frontend integration guide
- Spoonacular API Docs: https://spoonacular.com/food-api/docs
