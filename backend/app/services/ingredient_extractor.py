"""
Ingredient Extraction Service
Parses meal names and extracts grocery ingredients with quantities
"""

from typing import List, Dict
from collections import defaultdict

class IngredientExtractor:
    """Extract and deduplicate ingredients from meal plans"""
    
    # Comprehensive meal-to-ingredient mapping
    MEAL_INGREDIENTS = {
        # Breakfast Items
        "upma": ["Semolina (Rava)", "Mixed Vegetables", "Coconut", "Mustard Seeds", "Curry Leaves", "Oil", "Salt"],
        "dosa": ["Dosa Batter (Rice + Urad Dal)", "Oil"],
        "idli": ["Idli Batter (Rice + Urad Dal)"],
        "oatmeal": ["Rolled Oats", "Milk"],
        "poha": ["Flattened Rice (Poha)", "Peanuts", "Curry Leaves", "Mustard Seeds", "Turmeric"],
        "paratha": ["Whole Wheat Flour", "Oil", "Salt"],
        
        # Rice & Grains
        "brown rice": ["Brown Rice"],
        "white rice": ["White Rice"],
        "quinoa": ["Quinoa"],
        "roti": ["Whole Wheat Flour", "Oil", "Salt"],
        "chapati": ["Whole Wheat Flour", "Oil", "Salt"],
        
        # Proteins
        "chicken": ["Chicken Breast"],
        "grilled chicken": ["Chicken Breast", "Olive Oil", "Herbs", "Spices"],
        "fish": ["Fish Fillet"],
        "grilled fish": ["Fish Fillet", "Lemon", "Herbs"],
        "paneer": ["Paneer (Cottage Cheese)"],
        "tofu": ["Tofu"],
        "egg": ["Eggs"],
        
        # Dals & Legumes
        "chole": ["Chickpeas (Kabuli Chana)", "Onion", "Tomato", "Ginger-Garlic Paste", "Spices"],
        "chana": ["Chickpeas (Kabuli Chana)"],
        "rajma": ["Kidney Beans (Rajma)", "Onion", "Tomato", "Spices"],
        "dal": ["Toor Dal", "Turmeric", "Salt"],
        "moong dal": ["Moong Dal", "Turmeric", "Salt"],
        "masoor dal": ["Masoor Dal", "Turmeric", "Salt"],
        
        # Vegetables
        "vegetables": ["Mixed Vegetables (Carrot, Beans, Peas)"],
        "veg": ["Mixed Vegetables"],
        "roasted vegetables": ["Bell Peppers", "Zucchini", "Broccoli", "Olive Oil"],
        "steamed vegetables": ["Broccoli", "Carrots", "Green Beans"],
        "mixed veg": ["Carrot", "Beans", "Peas", "Cauliflower"],
        
        # Accompaniments
        "sambar": ["Toor Dal", "Tamarind", "Sambar Powder", "Vegetables", "Curry Leaves"],
        "coconut chutney": ["Coconut", "Green Chilli", "Roasted Chana Dal", "Curry Leaves"],
        "raita": ["Yogurt", "Cucumber", "Cumin Powder", "Salt"],
        
        # Snacks
        "roasted moong dal": ["Moong Dal", "Salt", "Spices"],
        "roasted makhana": ["Makhana (Fox Nuts)", "Ghee", "Salt"],
        "roasted chana": ["Roasted Chickpeas"],
        "fruit salad": ["Apple", "Banana", "Orange", "Grapes", "Pomegranate"],
        "fruit juice": ["Fresh Fruits (Seasonal)"],
        "cucumber tomato salad": ["Cucumber", "Tomato", "Lemon", "Salt"],
        
        # Sweeteners & Additions
        "honey": ["Honey"],
        "banana": ["Banana"],
        "coconut": ["Fresh Coconut"],
    }
    
    # Quantity estimation per serving (for 7 days)
    QUANTITY_ESTIMATES = {
        # Grains (in kg)
        "Brown Rice": {"quantity": 2, "unit": "kg"},
        "White Rice": {"quantity": 2, "unit": "kg"},
        "Quinoa": {"quantity": 0.5, "unit": "kg"},
        "Whole Wheat Flour": {"quantity": 2, "unit": "kg"},
        "Semolina (Rava)": {"quantity": 0.5, "unit": "kg"},
        "Rolled Oats": {"quantity": 0.5, "unit": "kg"},
        "Flattened Rice (Poha)": {"quantity": 0.5, "unit": "kg"},
        
        # Proteins (in kg/dozen)
        "Chicken Breast": {"quantity": 1.5, "unit": "kg"},
        "Fish Fillet": {"quantity": 1, "unit": "kg"},
        "Paneer (Cottage Cheese)": {"quantity": 1, "unit": "kg"},
        "Tofu": {"quantity": 0.5, "unit": "kg"},
        "Eggs": {"quantity": 12, "unit": "pieces"},
        
        # Dals & Legumes (in kg)
        "Chickpeas (Kabuli Chana)": {"quantity": 1, "unit": "kg"},
        "Kidney Beans (Rajma)": {"quantity": 0.5, "unit": "kg"},
        "Toor Dal": {"quantity": 1, "unit": "kg"},
        "Moong Dal": {"quantity": 0.5, "unit": "kg"},
        "Masoor Dal": {"quantity": 0.5, "unit": "kg"},
        "Roasted Chickpeas": {"quantity": 0.25, "unit": "kg"},
        
        # Vegetables (in kg)
        "Mixed Vegetables": {"quantity": 2, "unit": "kg"},
        "Bell Peppers": {"quantity": 0.5, "unit": "kg"},
        "Broccoli": {"quantity": 0.5, "unit": "kg"},
        "Carrot": {"quantity": 1, "unit": "kg"},
        "Cucumber": {"quantity": 1, "unit": "kg"},
        "Tomato": {"quantity": 1, "unit": "kg"},
        "Onion": {"quantity": 1, "unit": "kg"},
        "Green Beans": {"quantity": 0.5, "unit": "kg"},
        "Zucchini": {"quantity": 0.5, "unit": "kg"},
        "Cauliflower": {"quantity": 1, "unit": "piece"},
        
        # Dairy (in liters/kg)
        "Milk": {"quantity": 2, "unit": "liters"},
        "Yogurt": {"quantity": 1, "unit": "kg"},
        
        # Fruits (in kg/dozen)
        "Banana": {"quantity": 12, "unit": "pieces"},
        "Apple": {"quantity": 1, "unit": "kg"},
        "Orange": {"quantity": 1, "unit": "kg"},
        "Grapes": {"quantity": 0.5, "unit": "kg"},
        "Pomegranate": {"quantity": 4, "unit": "pieces"},
        "Fresh Fruits (Seasonal)": {"quantity": 2, "unit": "kg"},
        
        # Condiments & Spices (in grams/pieces)
        "Fresh Coconut": {"quantity": 2, "unit": "pieces"},
        "Coconut": {"quantity": 2, "unit": "pieces"},
        "Ginger-Garlic Paste": {"quantity": 200, "unit": "grams"},
        "Green Chilli": {"quantity": 100, "unit": "grams"},
        "Curry Leaves": {"quantity": 2, "unit": "bunches"},
        "Lemon": {"quantity": 6, "unit": "pieces"},
        "Tamarind": {"quantity": 100, "unit": "grams"},
        "Honey": {"quantity": 250, "unit": "grams"},
        
        # Oils & Fats (in liters)
        "Oil": {"quantity": 1, "unit": "liter"},
        "Olive Oil": {"quantity": 0.5, "unit": "liter"},
        "Ghee": {"quantity": 0.5, "unit": "kg"},
        
        # Spices & Powders (in grams)
        "Spices": {"quantity": 200, "unit": "grams"},
        "Turmeric": {"quantity": 50, "unit": "grams"},
        "Salt": {"quantity": 500, "unit": "grams"},
        "Cumin Powder": {"quantity": 50, "unit": "grams"},
        "Sambar Powder": {"quantity": 100, "unit": "grams"},
        "Mustard Seeds": {"quantity": 50, "unit": "grams"},
        "Herbs": {"quantity": 50, "unit": "grams"},
        
        # Batters & Ready-made
        "Dosa Batter (Rice + Urad Dal)": {"quantity": 1, "unit": "kg"},
        "Idli Batter (Rice + Urad Dal)": {"quantity": 1, "unit": "kg"},
        
        # Snacks
        "Makhana (Fox Nuts)": {"quantity": 200, "unit": "grams"},
        "Peanuts": {"quantity": 250, "unit": "grams"},
        "Roasted Chana Dal": {"quantity": 100, "unit": "grams"},
    }
    
    # Category mapping for grouping
    CATEGORIES = {
        "Grains & Rice": ["Brown Rice", "White Rice", "Quinoa", "Whole Wheat Flour", "Semolina (Rava)", "Rolled Oats", "Flattened Rice (Poha)"],
        "Proteins": ["Chicken Breast", "Fish Fillet", "Paneer (Cottage Cheese)", "Tofu", "Eggs"],
        "Dals & Legumes": ["Chickpeas (Kabuli Chana)", "Kidney Beans (Rajma)", "Toor Dal", "Moong Dal", "Masoor Dal", "Roasted Chickpeas"],
        "Vegetables": ["Mixed Vegetables", "Bell Peppers", "Broccoli", "Carrot", "Cucumber", "Tomato", "Onion", "Green Beans", "Zucchini", "Cauliflower"],
        "Dairy": ["Milk", "Yogurt"],
        "Fruits": ["Banana", "Apple", "Orange", "Grapes", "Pomegranate", "Fresh Fruits (Seasonal)"],
        "Spices & Condiments": ["Fresh Coconut", "Coconut", "Ginger-Garlic Paste", "Green Chilli", "Curry Leaves", "Lemon", "Tamarind", "Honey", "Spices", "Turmeric", "Salt", "Cumin Powder", "Sambar Powder", "Mustard Seeds", "Herbs"],
        "Oils & Fats": ["Oil", "Olive Oil", "Ghee"],
        "Snacks": ["Makhana (Fox Nuts)", "Peanuts", "Roasted Chana Dal"],
        "Ready-made": ["Dosa Batter (Rice + Urad Dal)", "Idli Batter (Rice + Urad Dal)"],
    }
    
    def extract_ingredients(self, week_plan: List[Dict]) -> Dict:
        """
        Extract and deduplicate ingredients from weekly meal plan
        
        Args:
            week_plan: List of day objects with meals
            
        Returns:
            Dict with ingredients list and metadata
        """
        ingredient_counts = defaultdict(int)
        all_ingredients = []
        
        # Parse each day and meal
        for day in week_plan:
            for meal_type in ['breakfast', 'lunch', 'dinner', 'snacks']:
                meal = day.get(meal_type)
                if not meal:
                    continue
                    
                meal_name = meal if isinstance(meal, str) else meal.get('name', '')
                if not meal_name:
                    continue
                
                # Extract ingredients from meal name
                ingredients = self._parse_meal_name(meal_name.lower())
                for ingredient in ingredients:
                    ingredient_counts[ingredient] += 1
                    
        # Build deduplicated shopping list with quantities
        shopping_list = []
        for ingredient, count in ingredient_counts.items():
            quantity_info = self.QUANTITY_ESTIMATES.get(ingredient, {"quantity": 1, "unit": "unit"})
            category = self._get_category(ingredient)
            
            shopping_list.append({
                "name": ingredient,
                "quantity": quantity_info["quantity"],
                "unit": quantity_info["unit"],
                "occurrences": count,
                "category": category,
                "bigbasket_url": f"https://www.bigbasket.com/ps/?q={ingredient.replace(' ', '+')}"
            })
        
        # Sort by category
        shopping_list.sort(key=lambda x: (x['category'], x['name']))
        
        return {
            "ingredients": shopping_list,
            "total_items": len(shopping_list),
            "categories": self._group_by_category(shopping_list)
        }
    
    def _parse_meal_name(self, meal_name: str) -> List[str]:
        """Parse meal name and extract ingredient list"""
        ingredients = set()
        
        # Check each known meal pattern
        for meal_key, meal_ingredients in self.MEAL_INGREDIENTS.items():
            if meal_key in meal_name:
                ingredients.update(meal_ingredients)
        
        return list(ingredients)
    
    def _get_category(self, ingredient: str) -> str:
        """Get category for an ingredient"""
        for category, items in self.CATEGORIES.items():
            if ingredient in items:
                return category
        return "Other"
    
    def _group_by_category(self, shopping_list: List[Dict]) -> Dict:
        """Group ingredients by category"""
        grouped = defaultdict(list)
        for item in shopping_list:
            grouped[item['category']].append(item)
        return dict(grouped)


# Singleton instance
ingredient_extractor = IngredientExtractor()
