# ✅ Nutrition Plans Frontend Integration - Complete Guide

## 🎯 Backend Status: READY!

All API endpoints required by your React component are implemented and working!

---

## 📡 API Endpoints (All Available)

### 1. Get Current Plan
**GET** `/api/nutrition/current`

Returns the active nutrition plan or `null` if none exists.

**Response:**
```json
{
  "plan_data": "{...}",  // JSON string
  "plan_id": 123
}
```

**Frontend Usage:**
```javascript
const response = await axios.get('/api/nutrition/current');
const hasPlan = !!response.data;
```

---

### 2. Get Today's Meals
**GET** `/api/nutrition/today`

Returns today's meals or `null` if no plan exists.

**Response:**
```json
{
  "breakfast": {
    "id": "b1",
    "name": "Masala Oats with Vegetables",
    "calories": 320,
    "protein": 12,
    "carbs": 48,
    "fat": 8,
    "ingredients": ["Oats", "Onion", "Tomato", "Peas"]
  },
  "lunch": {...},
  "dinner": {...},
  "snacks": [
    {"id": "s1", "name": "Roasted Chana", "calories": 120},
    {"id": "s2", "name": "Banana", "calories": 89}
  ]
}
```

**Frontend Usage:**
```javascript
const response = await axios.get('/api/nutrition/today');
setToday(response.data ?? MOCK_TODAY);
```

---

### 3. Get Shopping List
**GET** `/api/nutrition/shopping-list`

Returns weekly shopping list or empty array.

**Response:**
```json
[
  {"name": "Onion", "count": 7},
  {"name": "Tomato", "count": 7},
  {"name": "Toor Dal", "count": 6}
]
```

**Frontend Usage:**
```javascript
const response = await axios.get('/api/nutrition/shopping-list');
setShop(response.data ?? MOCK_SHOPPING);
```

---

### 4. Complete Meal
**POST** `/api/nutrition/meal/complete`

Mark a meal as completed and earn charity points.

**Request:**
```json
{
  "meal_id": "b1",
  "meal_type": "breakfast"
}
```

**Response:**
```json
{
  "message": "Meal tracked! +2 charity points 💚"
}
```

**Frontend Usage:**
```javascript
await axios.post('/api/nutrition/meal/complete', {
  meal_id: meal.id,
  meal_type: 'breakfast'
});
```

---

### 5. Generate New Plan
**POST** `/api/nutrition/generate`

Generate a new AI-powered nutrition plan.

**Request:**
```json
{
  "calorie_target": 1800,
  "diet_type": "vegetarian",
  "allergies": ""
}
```

**Response:**
```json
{
  "plan": {...},
  "plan_id": 123
}
```

**Frontend Usage:**
```javascript
await axios.post('/api/nutrition/generate', {
  calorie_target: 1800,
  diet_type: user?.diet_preference ?? 'vegetarian',
  allergies: ''
});
```

---

## 🔧 Frontend Setup

### 1. Place Your React Component

```
src/
  pages/
    NutritionPlans.jsx  ← Your component here
```

### 2. Configure API Base URL

In `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 3. Add to Router

In `src/App.jsx` or your router file:

```javascript
import NutritionPlans from './pages/NutritionPlans';

// In your routes:
<Route path="/nutrition" element={<NutritionPlans />} />
```

---

## 📊 Data Flow

```
Component Mounts
    ↓
fetchAll() called
    ↓
GET /api/nutrition/current  → Check if plan exists
GET /api/nutrition/today    → Get today's meals
GET /api/nutrition/shopping-list → Get ingredients
    ↓
Display data or show "No plan yet"
    ↓
User clicks "Generate New Plan"
    ↓
POST /api/nutrition/generate
    ↓
fetchAll() called again
    ↓
Display new plan
```

---

## 🎨 Component Features (All Supported)

### Today Tab ✅
- ✅ Display breakfast, lunch, dinner cards
- ✅ Show nutrition info (calories, protein, carbs, fat)
- ✅ List ingredients
- ✅ Complete meal button
- ✅ Snacks section
- ✅ Charity points on completion

### Week Tab ✅
- ✅ Display 7-day meal plan
- ✅ Highlight today
- ✅ Show all meals per day
- ✅ Nutrition summary per meal

### Shopping List Tab ✅
- ✅ Display ingredients with counts
- ✅ Sort by frequency
- ✅ "Buy" button linking to BigBasket

### Generate Plan ✅
- ✅ AI-powered generation
- ✅ Uses user preferences
- ✅ Spoonacular fallback
- ✅ Indian meal fallback

---

## 🔄 API Response Formats

### Current Plan Response
```javascript
{
  plan_data: "{\"days\":[...]}",  // JSON string
  plan_id: 123
}
```

### Today's Meals Response
```javascript
{
  breakfast: {
    id: "b1",
    name: "Masala Oats",
    calories: 320,
    protein: 12,
    carbs: 48,
    fat: 8,
    ingredients: ["Oats", "Onion", "Tomato"]
  },
  lunch: {...},
  dinner: {...},
  snacks: [{id: "s1", name: "Banana", calories: 89}]
}
```

### Shopping List Response
```javascript
[
  {name: "Onion", count: 7},
  {name: "Tomato", count: 7},
  {name: "Toor Dal", count: 6}
]
```

---

## 🧪 Testing

### 1. Test API Connection

```bash
# Get current plan
curl http://localhost:8000/api/nutrition/current \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get today's meals
curl http://localhost:8000/api/nutrition/today \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get shopping list
curl http://localhost:8000/api/nutrition/shopping-list \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Test Plan Generation

```bash
curl -X POST http://localhost:8000/api/nutrition/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "calorie_target": 1800,
    "diet_type": "vegetarian",
    "allergies": ""
  }'
```

### 3. Test Meal Completion

```bash
curl -X POST http://localhost:8000/api/nutrition/meal/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "meal_id": "b1",
    "meal_type": "breakfast"
  }'
```

---

## 🎯 Component API Calls Mapping

| Component Action | API Endpoint | Method |
|-----------------|--------------|--------|
| Load data on mount | `/api/nutrition/current` | GET |
| | `/api/nutrition/today` | GET |
| | `/api/nutrition/shopping-list` | GET |
| Complete meal | `/api/nutrition/meal/complete` | POST |
| Generate new plan | `/api/nutrition/generate` | POST |

---

## ✅ Checklist

- ✅ All API endpoints implemented
- ✅ Response formats match frontend expectations
- ✅ Error handling (returns null/empty instead of errors)
- ✅ Authentication required on all endpoints
- ✅ Charity points system working
- ✅ Shopping list deduplication
- ✅ Week/day format compatibility
- ✅ AI + Spoonacular + Fallback chain

---

## 🚀 Ready to Use!

Your React component will work perfectly with the backend!

**Server:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

Just:
1. Place your component in the frontend
2. Configure axios base URL
3. Add to router
4. Start using!

The backend is 100% ready! 🎉
