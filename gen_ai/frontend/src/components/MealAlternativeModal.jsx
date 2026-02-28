import { motion } from 'framer-motion'
import { X, Check } from 'lucide-react'

const alternativesPool = {
    weight_loss: {
        Breakfast: [
            { name: "Poha with Peanuts", calories: "300", protein_g: "6", carbs_g: "45", fat_g: "10", ingredients: ["Poha", "Peanuts", "Onions", "Curry Leaves"] },
            { name: "Moong Dal Chilla", calories: "250", protein_g: "12", carbs_g: "30", fat_g: "8", ingredients: ["Moong Dal", "Onions", "Green Chilies"] },
            { name: "Oats Upma", calories: "280", protein_g: "8", carbs_g: "40", fat_g: "8", ingredients: ["Oats", "Mustard Seeds", "Curry Leaves", "Carrots"] }
        ],
        Lunch: [
            { name: "Roti with Palak Paneer", calories: "400", protein_g: "15", carbs_g: "45", fat_g: "15", ingredients: ["Whole Wheat Flour", "Spinach", "Paneer"] },
            { name: "Quinoa Pulao", calories: "350", protein_g: "10", carbs_g: "50", fat_g: "10", ingredients: ["Quinoa", "Peas", "Carrots", "Beans"] },
            { name: "Masoor Dal with Brown Rice", calories: "380", protein_g: "14", carbs_g: "55", fat_g: "8", ingredients: ["Masoor Dal", "Brown Rice", "Ghee"] }
        ],
        Dinner: [
            { name: "Vegetable Khichdi", calories: "300", protein_g: "10", carbs_g: "45", fat_g: "8", ingredients: ["Rice", "Moong Dal", "Mixed Veggies"] },
            { name: "Grilled Chicken Tikka", calories: "320", protein_g: "35", carbs_g: "10", fat_g: "12", ingredients: ["Chicken Breast", "Yogurt", "Tikka Masala"] },
            { name: "Tofu Stir Fry with Capsicum", calories: "280", protein_g: "18", carbs_g: "20", fat_g: "12", ingredients: ["Tofu", "Capsicum", "Soy Sauce"] }
        ],
        Snacks: [
            { name: "Roasted Makhana", calories: "120", protein_g: "3", carbs_g: "20", fat_g: "4", ingredients: ["Fox Nuts", "Ghee", "Black Pepper"] },
            { name: "Sprouts Chaat", calories: "150", protein_g: "8", carbs_g: "25", fat_g: "2", ingredients: ["Moong Sprouts", "Tomatoes", "Onions", "Lemon"] },
            { name: "Boiled Egg Whites", calories: "100", protein_g: "22", carbs_g: "0", fat_g: "0", ingredients: ["Egg Whites", "Salt", "Pepper"] }
        ]
    },
    weight_gain: {
        Breakfast: [
            { name: "Aloo Paratha with Curd", calories: "550", protein_g: "12", carbs_g: "65", fat_g: "25", ingredients: ["Wheat Flour", "Potatoes", "Ghee", "Yogurt"] },
            { name: "Paneer Bhurji with Toast", calories: "500", protein_g: "20", carbs_g: "40", fat_g: "28", ingredients: ["Paneer", "Onions", "Bread", "Butter"] },
            { name: "Banana Peanut Butter Smoothie", calories: "600", protein_g: "25", carbs_g: "70", fat_g: "30", ingredients: ["Bananas", "Peanut Butter", "Milk", "Whey Protein"] }
        ],
        Lunch: [
            { name: "Rajma Chawal with Ghee", calories: "650", protein_g: "18", carbs_g: "90", fat_g: "20", ingredients: ["Kidney Beans", "Rice", "Ghee", "Spices"] },
            { name: "Chicken Biryani", calories: "700", protein_g: "35", carbs_g: "75", fat_g: "25", ingredients: ["Basmati Rice", "Chicken", "Ghee", "Biryani Masala"] },
            { name: "Dal Makhani with Naan", calories: "680", protein_g: "16", carbs_g: "85", fat_g: "30", ingredients: ["Urad Dal", "Butter", "Cream", "Flour"] }
        ],
        Dinner: [
            { name: "Butter Chicken with Roti", calories: "700", protein_g: "38", carbs_g: "50", fat_g: "35", ingredients: ["Chicken", "Butter", "Rich Tomato Gravy", "Wheat Flour"] },
            { name: "Shahi Paneer with Jeera Rice", calories: "650", protein_g: "18", carbs_g: "70", fat_g: "32", ingredients: ["Paneer", "Cashews", "Rice", "Jeera"] },
            { name: "Mutton Rogan Josh with Rice", calories: "750", protein_g: "40", carbs_g: "60", fat_g: "38", ingredients: ["Mutton", "Spices", "Rice", "Oil"] }
        ],
        Snacks: [
            { name: "Mixed Nuts & Dates", calories: "350", protein_g: "10", carbs_g: "40", fat_g: "20", ingredients: ["Almonds", "Cashews", "Dates", "Walnuts"] },
            { name: "Besan Ladoo", calories: "300", protein_g: "6", carbs_g: "35", fat_g: "18", ingredients: ["Gram Flour", "Ghee", "Sugar"] },
            { name: "Cheese Sandwich", calories: "400", protein_g: "15", carbs_g: "45", fat_g: "18", ingredients: ["Cheese", "Bread", "Butter"] }
        ]
    },
    muscle_gain: {
        Breakfast: [
            { name: "Scrambled Eggs with Multigrain Roti", calories: "450", protein_g: "25", carbs_g: "45", fat_g: "18", ingredients: ["Whole Eggs", "Wheat Flour", "Onions", "Olive Oil"] },
            { name: "Protein Oats with Dry Fruits", calories: "500", protein_g: "30", carbs_g: "60", fat_g: "15", ingredients: ["Oats", "Whey Protein", "Almonds", "Milk"] },
            { name: "Soya Chunks Poha", calories: "400", protein_g: "22", carbs_g: "55", fat_g: "10", ingredients: ["Poha", "Soya Chunks", "Peanuts", "Spices"] }
        ],
        Lunch: [
            { name: "Grilled Fish with Sweet Potato", calories: "550", protein_g: "40", carbs_g: "60", fat_g: "15", ingredients: ["Fish Fillet", "Sweet Potato", "Broccoli", "Olive Oil"] },
            { name: "Soya Keema Matar with Brown Rice", calories: "600", protein_g: "35", carbs_g: "75", fat_g: "18", ingredients: ["Soya Granules", "Peas", "Brown Rice", "Tomatoes"] },
            { name: "Kadai Paneer with Multigrain Roti", calories: "650", protein_g: "28", carbs_g: "60", fat_g: "35", ingredients: ["Paneer", "Capsicum", "Multigrain Flour", "Spices"] }
        ],
        Dinner: [
            { name: "Chicken Curry with Quinoa", calories: "550", protein_g: "45", carbs_g: "50", fat_g: "16", ingredients: ["Chicken Breast", "Quinoa", "Tomato Gravy"] },
            { name: "Egg Curry with Two Roti", calories: "500", protein_g: "24", carbs_g: "45", fat_g: "22", ingredients: ["Boiled Eggs", "Onion-Tomato Gravy", "Wheat Flour"] },
            { name: "Lentil Soup with Tofu Salad", calories: "450", protein_g: "30", carbs_g: "50", fat_g: "15", ingredients: ["Mixed Dals", "Tofu", "Cucumber", "Tomatoes"] }
        ],
        Snacks: [
            { name: "Whey Protein Shake", calories: "200", protein_g: "24", carbs_g: "4", fat_g: "2", ingredients: ["Whey Protein Isolate", "Water/Milk"] },
            { name: "Boiled Chana Salad", calories: "250", protein_g: "12", carbs_g: "40", fat_g: "5", ingredients: ["Black Chickpeas", "Onions", "Tomatoes", "Lemon"] },
            { name: "Peanut Butter Rice Cakes", calories: "300", protein_g: "10", carbs_g: "45", fat_g: "14", ingredients: ["Rice Cakes", "Peanut Butter"] }
        ]
    },
    maintenance: {
        Breakfast: [
            { name: "Vegetable Upma", calories: "320", protein_g: "8", carbs_g: "55", fat_g: "10", ingredients: ["Semolina", "Carrots", "Peas", "Curry Leaves"] },
            { name: "Idli with Sambar", calories: "350", protein_g: "10", carbs_g: "65", fat_g: "5", ingredients: ["Rice Batter", "Toor Dal", "Mixed Veggies"] },
            { name: "Avocado Toast on Multigrain", calories: "380", protein_g: "12", carbs_g: "45", fat_g: "18", ingredients: ["Multigrain Bread", "Avocado", "Chili Flakes", "Eggs (Optional)"] }
        ],
        Lunch: [
            { name: "Dal Tadka with Jeera Rice", calories: "450", protein_g: "15", carbs_g: "75", fat_g: "12", ingredients: ["Yellow Dal", "Jeera Rice", "Ghee", "Garlic"] },
            { name: "Roti with Mixed Veg Curry", calories: "400", protein_g: "12", carbs_g: "60", fat_g: "15", ingredients: ["Wheat Roti", "Carrots", "Beans", "Potatoes"] },
            { name: "Chole with Rice", calories: "480", protein_g: "14", carbs_g: "80", fat_g: "14", ingredients: ["Chickpeas", "Basmati Rice", "Spices", "Onions"] }
        ],
        Dinner: [
            { name: "Aloo Gobi with Roti", calories: "380", protein_g: "10", carbs_g: "60", fat_g: "12", ingredients: ["Potatoes", "Cauliflower", "Wheat Roti", "Spices"] },
            { name: "Bhindi Masala with Dal", calories: "420", protein_g: "14", carbs_g: "65", fat_g: "14", ingredients: ["Okra", "Toor Dal", "Onions", "Spices"] },
            { name: "Fish Curry with Rice", calories: "450", protein_g: "25", carbs_g: "55", fat_g: "15", ingredients: ["Fish", "Coconut Milk", "Rice", "Spices"] }
        ],
        Snacks: [
            { name: "Bhel Puri (Light)", calories: "200", protein_g: "4", carbs_g: "40", fat_g: "6", ingredients: ["Puffed Rice", "Onions", "Tomatoes", "Mint Chutney"] },
            { name: "Roasted Chana", calories: "180", protein_g: "9", carbs_g: "28", fat_g: "4", ingredients: ["Bengal Gram", "Salt", "Spices"] },
            { name: "Fruit Bowl", calories: "150", protein_g: "2", carbs_g: "38", fat_g: "0", ingredients: ["Apple", "Papaya", "Banana", "Grapes"] }
        ]
    }
}

export default function MealAlternativeModal({ mealName, mealType, goal = "maintenance", onClose, onReplace }) {
    // Normalize goal (e.g., 'weight_loss', etc.)
    let normalizedGoal = 'maintenance'
    if (goal.includes('loss')) normalizedGoal = 'weight_loss'
    if (goal.includes('gain') && !goal.includes('muscle')) normalizedGoal = 'weight_gain'
    if (goal.includes('muscle')) normalizedGoal = 'muscle_gain'

    const options = alternativesPool[normalizedGoal]?.[mealType] || alternativesPool.maintenance[mealType] || []

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-6"
        >
            <motion.div
                initial={{ y: 50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.95 }}
                className="bg-[#0a0c0f] border border-white/10 rounded-3xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto font-sans shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-3xl font-black text-white mb-2 font-heading tracking-tight">You disliked {mealName} 👎</h2>
                <p className="text-gray-400 mb-8 font-medium">Here are 3 curated Indian alternatives perfectly tuned for your macros.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {options.map((alt, i) => (
                        <motion.div
                            key={i}
                            whileHover={{ y: -5 }}
                            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative flex flex-col justify-between hover:border-orange-500/50 hover:bg-white/[0.05] transition-all group"
                        >
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 line-clamp-2 min-h-[3.5rem] group-hover:text-orange-400 transition-colors font-heading leading-tight">{alt.name}</h3>

                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/20">{alt.calories} Cal</span>
                                    <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">{alt.protein_g}g Pro</span>
                                    <span className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">{alt.carbs_g}g Carb</span>
                                </div>

                                <div className="mb-6">
                                    <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Key Ingredients</h4>
                                    <div className="flex flex-wrap gap-1">
                                        {alt.ingredients.map((ing, idx) => (
                                            <span key={idx} className="text-xs text-gray-300 bg-white/5 px-2 py-1 rounded-md">{ing}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 mt-4">
                                <button
                                    onClick={() => onReplace(alt)}
                                    className="w-full py-3 bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                                >
                                    <Check className="w-4 h-4" /> Use This Meal
                                </button>
                                <a
                                    href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(alt.ingredients[0] || alt.name)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-2.5 bg-[#84c225]/10 hover:bg-[#84c225]/20 text-[#84c225] border border-[#84c225]/30 font-bold uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center transition-colors text-center"
                                >
                                    Order on BigBasket 🛒
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    )
}
