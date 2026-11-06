"""
Goal-Based Indian Meal Plans
Complete 7-day meal plans for 4 fitness goals: Weight Loss, Weight Gain, Balanced Diet, Muscle Gain
"""

def get_goal_based_meal_plan(goal: str, calorie_target: int = 2000, diet_type: str = "vegetarian"):
    """
    Get a complete 7-day meal plan based on fitness goal
    
    Args:
        goal: "loss", "gain", "balance", or "muscle"
        calorie_target: Target daily calories (optional, uses goal defaults)
        diet_type: "vegetarian" or "non-vegetarian"
    
    Returns:
        dict: Complete 7-day meal plan with macros and BigBasket links
    """
    
    goal = goal.lower()
    is_veg = diet_type.lower() in ["vegetarian", "vegan"]
    
    # Goal-specific configurations
    goal_configs = {
        "loss": {
            "label": "Weight Loss Plan",
            "color": "#22d3a4",
            "calories": 1400,
            "protein": 60,
            "carbs": 150,
            "fat": 35
        },
        "gain": {
            "label": "Weight Gain Plan",
            "color": "#f97316",
            "calories": 2800,
            "protein": 90,
            "carbs": 380,
            "fat": 80
        },
        "balance": {
            "label": "Balanced Diet Plan",
            "color": "#818cf8",
            "calories": 2000,
            "protein": 75,
            "carbs": 250,
            "fat": 55
        },
        "muscle": {
            "label": "Muscle Gain Plan",
            "color": "#facc15",
            "calories": 2600,
            "protein": 160,
            "carbs": 300,
            "fat": 65
        }
    }
    
    config = goal_configs.get(goal, goal_configs["balance"])
    
    # Get meal plan data based on goal
    if goal == "loss":
        days_data = get_weight_loss_plan(is_veg)
    elif goal == "gain":
        days_data = get_weight_gain_plan(is_veg)
    elif goal == "muscle":
        days_data = get_muscle_gain_plan(is_veg)
    else:  # balance
        days_data = get_balanced_diet_plan(is_veg)
    
    # Normalize days_data to both list and dict formats
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    week_dict = {}
    if isinstance(days_data, list):
        for d in days_data:
            week_dict[d.get("day", "Monday")] = d
    elif isinstance(days_data, dict):
        week_dict = days_data
        days_data = [days_data[d] for d in day_names if d in days_data]

    return {
        "goal": goal,
        "label": config["label"],
        "color": config["color"],
        "summary": {
            "calories": config["calories"],
            "protein": config["protein"],
            "carbs": config["carbs"],
            "fat": config["fat"]
        },
        "days": days_data,
        "week": week_dict,
        "source": "goal_based_indian_meals"
    }


def get_weight_loss_plan(is_veg=True):
    """7-day weight loss meal plan (1400 cal/day)"""
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    meals_data = [
        # Monday
        {
            "breakfast": {"name": "Moong Dal Chilla with Mint Chutney", "calories": 280, "protein_g": 18, "carbs_g": 32, "fat_g": 6, "ingredients": ["Moong Dal", "Mint", "Green Chilli", "Ginger", "Cumin"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "Brown Rice with Palak Dal", "calories": 350, "protein_g": 15, "carbs_g": 58, "fat_g": 5, "ingredients": ["Brown Rice", "Spinach", "Masoor Dal", "Turmeric", "Garlic"], "time": "12:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Roasted Makhana & Green Tea", "calories": 90, "protein_g": 3, "carbs_g": 12, "fat_g": 2}],
            "dinner": {"name": "Grilled Tandoori Chicken Tikka & Salad" if not is_veg else "Grilled Paneer Tikka & Salad", "calories": 320, "protein_g": 38, "carbs_g": 10, "fat_g": 8, "ingredients": ["Chicken Breast" if not is_veg else "Paneer", "Curd", "Tandoori Masala", "Lemon", "Onion", "Cucumber"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Tuesday
        {
            "breakfast": {"name": "Idli with Sambar & Coconut Chutney", "calories": 300, "protein_g": 10, "carbs_g": 52, "fat_g": 5, "ingredients": ["Idli Batter", "Toor Dal", "Coconut", "Curry Leaves", "Mustard Seeds"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "Whole Wheat Roti with Rajma", "calories": 390, "protein_g": 16, "carbs_g": 65, "fat_g": 7, "ingredients": ["Whole Wheat Flour", "Rajma", "Tomato", "Onion", "Coriander"], "time": "12:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Cucumber Tomato Salad with Chaat Masala", "calories": 50, "protein_g": 2, "carbs_g": 8, "fat_g": 1}],
            "dinner": {"name": "Grilled Fish with Steamed Vegetables" if not is_veg else "Tofu Stir-fry with Vegetables", "calories": 360, "protein_g": 40, "carbs_g": 14, "fat_g": 9, "ingredients": ["Rohu Fish" if not is_veg else "Tofu", "Broccoli", "Carrots", "Cumin", "Coriander"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Wednesday
        {
            "breakfast": {"name": "Dosa with Sambar & Coconut Chutney", "calories": 320, "protein_g": 9, "carbs_g": 55, "fat_g": 7, "ingredients": ["Dosa Batter", "Sambar Powder", "Coconut", "Chana Dal"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "Bajra Roti with Methi Sabzi", "calories": 310, "protein_g": 12, "carbs_g": 48, "fat_g": 6, "ingredients": ["Bajra Flour", "Fenugreek Leaves", "Garlic", "Chilli"], "time": "12:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Sprouts Chaat", "calories": 95, "protein_g": 7, "carbs_g": 14, "fat_g": 1}],
            "dinner": {"name": "Quinoa Khichdi with Raita", "calories": 330, "protein_g": 14, "carbs_g": 50, "fat_g": 7, "ingredients": ["Quinoa", "Moong Dal", "Curd", "Cumin", "Turmeric"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Thursday
        {
            "breakfast": {"name": "Oats Upma with Vegetables", "calories": 290, "protein_g": 11, "carbs_g": 44, "fat_g": 6, "ingredients": ["Rolled Oats", "Carrot", "Peas", "Mustard Seeds", "Curry Leaves"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "Missi Roti with Low-fat Paneer Bhurji", "calories": 370, "protein_g": 20, "carbs_g": 44, "fat_g": 9, "ingredients": ["Besan", "Whole Wheat Flour", "Low Fat Paneer", "Capsicum", "Tomato"], "time": "12:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Buttermilk (Chaas)", "calories": 40, "protein_g": 3, "carbs_g": 4, "fat_g": 1}],
            "dinner": {"name": "Dal Soup with Multigrain Bread", "calories": 290, "protein_g": 16, "carbs_g": 40, "fat_g": 5, "ingredients": ["Moong Dal", "Garlic", "Tomato", "Multigrain Bread"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Friday
        {
            "breakfast": {"name": "Poha with Peas and Peanuts", "calories": 310, "protein_g": 9, "carbs_g": 52, "fat_g": 7, "ingredients": ["Poha", "Peanuts", "Green Peas", "Mustard Seeds", "Turmeric"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "Chana Masala with Brown Rice", "calories": 380, "protein_g": 18, "carbs_g": 60, "fat_g": 7, "ingredients": ["Chickpeas", "Brown Rice", "Tomato", "Onion", "Chana Masala"], "time": "12:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Apple with Peanut Butter", "calories": 110, "protein_g": 4, "carbs_g": 16, "fat_g": 4}],
            "dinner": {"name": "Palak Soup & Egg White Omelette" if not is_veg else "Palak Soup & Tofu Scramble", "calories": 220, "protein_g": 22, "carbs_g": 12, "fat_g": 4, "ingredients": ["Spinach", "Egg Whites" if not is_veg else "Tofu", "Onion", "Garlic", "Pepper"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Saturday
        {
            "breakfast": {"name": "Vegetable Uttapam", "calories": 330, "protein_g": 10, "carbs_g": 54, "fat_g": 7, "ingredients": ["Dosa Batter", "Tomato", "Capsicum", "Carrot", "Onion"], "time": "8:00 AM", "emoji": "🌅"},
            "lunch": {"name": "Jowar Roti with Mixed Vegetable Dal", "calories": 350, "protein_g": 14, "carbs_g": 55, "fat_g": 6, "ingredients": ["Jowar Flour", "Toor Dal", "Mixed Vegetables", "Cumin"], "time": "1:00 PM", "emoji": "☀️"},
            "snacks": [{"name": "Roasted Chana", "calories": 100, "protein_g": 6, "carbs_g": 14, "fat_g": 2}],
            "dinner": {"name": "Grilled Prawns with Garlic & Salad" if not is_veg else "Grilled Mushrooms with Salad", "calories": 280, "protein_g": 36, "carbs_g": 6, "fat_g": 8, "ingredients": ["Prawns" if not is_veg else "Mushrooms", "Garlic", "Lemon", "Lettuce", "Cucumber"], "time": "7:30 PM", "emoji": "🌙"},
        },
        # Sunday
        {
            "breakfast": {"name": "Besan Cheela with Low-fat Paneer", "calories": 300, "protein_g": 18, "carbs_g": 28, "fat_g": 10, "ingredients": ["Besan", "Low Fat Paneer", "Ginger", "Green Chilli", "Coriander"], "time": "9:00 AM", "emoji": "🌅"},
            "lunch": {"name": "Lauki Dal & Whole Wheat Roti", "calories": 340, "protein_g": 14, "carbs_g": 54, "fat_g": 6, "ingredients": ["Bottle Gourd", "Moong Dal", "Whole Wheat Flour", "Turmeric"], "time": "1:30 PM", "emoji": "☀️"},
            "snacks": [{"name": "Mixed Fruit Bowl", "calories": 90, "protein_g": 1, "carbs_g": 22, "fat_g": 0}],
            "dinner": {"name": "Tofu & Spinach Stir-fry with Brown Rice", "calories": 310, "protein_g": 18, "carbs_g": 40, "fat_g": 8, "ingredients": ["Tofu", "Spinach", "Brown Rice", "Sesame Oil", "Ginger"], "time": "7:30 PM", "emoji": "🌙"},
        },
    ]
    
    # Format with day names and calculate totals
    formatted_days = []
    for i, day_name in enumerate(day_names):
        day_meals = meals_data[i]
        total_cal = (day_meals["breakfast"]["calories"] + 
                    day_meals["lunch"]["calories"] + 
                    day_meals["dinner"]["calories"] + 
                    sum(s["calories"] for s in day_meals["snacks"]))
        
        day_meals["day"] = day_name
        day_meals["total_calories"] = total_cal
        formatted_days.append(day_meals)
    
    return formatted_days


def get_weight_gain_plan(is_veg=True):
    """7-day weight gain meal plan (2800 cal/day) - Simplified version"""
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Using Spoonacular fallback data adapted for weight gain
    meals_data = []
    for day in day_names:
        meals_data.append({
            "day": day,
            "breakfast": {"name": "Aloo Paratha with Curd & Butter", "calories": 620, "protein_g": 16, "carbs_g": 85, "fat_g": 22, "ingredients": ["Whole Wheat Flour", "Potato", "Butter", "Curd", "Ajwain"], "time": "7:30 AM", "emoji": "🌅"},
            "lunch": {"name": "White Rice with Dal Makhani & Roti", "calories": 720, "protein_g": 24, "carbs_g": 110, "fat_g": 18, "ingredients": ["White Rice", "Black Lentils", "Butter", "Cream", "Whole Wheat Flour"], "time": "1:00 PM", "emoji": "☀️"},
            "snacks": [{"name": "Dry Fruit Ladoo", "calories": 200, "protein_g": 5, "carbs_g": 22, "fat_g": 10}, {"name": "Banana Milkshake", "calories": 320, "protein_g": 10, "carbs_g": 52, "fat_g": 9}],
            "dinner": {"name": "Chicken Biryani with Raita" if not is_veg else "Paneer Butter Masala with Naan", "calories": 780, "protein_g": 42, "carbs_g": 90, "fat_g": 22, "ingredients": ["Basmati Rice", "Chicken" if not is_veg else "Paneer", "Biryani Masala", "Saffron", "Curd"], "time": "8:00 PM", "emoji": "🌙"},
            "total_calories": 2640
        })
    
    return meals_data


def get_balanced_diet_plan(is_veg=True):
    """7-day balanced diet plan (2000 cal/day) - Using Spoonacular fallback"""
    return spoonacular_service.get_weekly_indian_meal_plan(2000, "vegetarian" if is_veg else "balanced")["week"]


def get_muscle_gain_plan(is_veg=True):
    """7-day muscle gain plan (2600 cal/day, high protein)"""
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    meals_data = []
    for day in day_names:
        meals_data.append({
            "day": day,
            "breakfast": {"name": "High-Protein Egg White Bhurji with Roti" if not is_veg else "Paneer Bhurji with Roti", "calories": 460, "protein_g": 36, "carbs_g": 42, "fat_g": 12, "ingredients": ["Egg Whites" if not is_veg else "Paneer", "Whole Wheat Flour", "Spinach", "Onion"], "time": "7:00 AM", "emoji": "🌅"},
            "lunch": {"name": "Grilled Chicken with Brown Rice & Dal" if not is_veg else "Soya Chunks with Brown Rice & Dal", "calories": 620, "protein_g": 52, "carbs_g": 68, "fat_g": 12, "ingredients": ["Chicken Breast" if not is_veg else "Soya Chunks", "Brown Rice", "Moong Dal", "Broccoli", "Garlic"], "time": "1:00 PM", "emoji": "☀️"},
            "snacks": [{"name": "Greek Yogurt with Banana & Almonds", "calories": 280, "protein_g": 18, "carbs_g": 32, "fat_g": 8}, {"name": "Peanut Butter Toast with Milk", "calories": 360, "protein_g": 18, "carbs_g": 38, "fat_g": 12}],
            "dinner": {"name": "Paneer Bhurji with Quinoa & Salad", "calories": 540, "protein_g": 38, "carbs_g": 44, "fat_g": 20, "ingredients": ["Paneer", "Quinoa", "Capsicum", "Tomato", "Spinach"], "time": "8:00 PM", "emoji": "🌙"},
            "total_calories": 2260
        })
    
    return meals_data


# Import spoonacular service for fallback
from app.services.spoonacular_service import spoonacular_service
