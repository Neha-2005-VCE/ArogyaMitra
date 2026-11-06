import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, ExternalLink, Loader2, Sparkles } from 'lucide-react';
import { nutritionApi } from '../services/api';
import toast from 'react-hot-toast';

const goals = [
    { id: 'loss', icon: '🔥', name: 'Weight Loss', desc: 'Low-calorie, high-fiber meals', color: '#22d3a4', calories: 1400 },
    { id: 'gain', icon: '📈', name: 'Weight Gain', desc: 'Calorie-dense, nourishing food', color: '#f97316', calories: 2800 },
    { id: 'balance', icon: '⚖️', name: 'Balanced Diet', desc: 'Maintain weight, balanced macros', color: '#818cf8', calories: 2000 },
    { id: 'muscle', icon: '💪', name: 'Muscle Gain', desc: 'High-protein, muscle-building', color: '#facc15', calories: 2600 },
];

const mealEmojis = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function NutritionPlansEnhanced() {
    const [selectedGoal, setSelectedGoal] = useState('balance');
    const [selectedDay, setSelectedDay] = useState(0);
    const [showShoppingList, setShowShoppingList] = useState(false);
    const qc = useQueryClient();

    const { data: plan, isLoading } = useQuery({ 
        queryKey: ['nutritionPlan'], 
        queryFn: () => nutritionApi.getCurrent().then(r => r.data), 
        retry: false 
    });

    const { data: shoppingList } = useQuery({ 
        queryKey: ['shoppingList'], 
        queryFn: () => nutritionApi.getShoppingList().then(r => r.data).catch(() => []), 
        enabled: showShoppingList,
        retry: false 
    });

    const genMut = useMutation({ 
        mutationFn: () => nutritionApi.generate({ 
            goal: selectedGoal, 
            calorie_target: goals.find(g => g.id === selectedGoal)?.calories || 2000,
            diet_type: 'vegetarian', 
            allergies: '' 
        }), 
        onSuccess: () => { 
            qc.invalidateQueries(['nutritionPlan']); 
            toast.success('Meal plan generated! 🎉'); 
        } 
    });

    const planData = plan?.plan_data ? (typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data) : null;
    const days = planData?.days || [];
    const currentDay = days[selectedDay] || {};
    const goalColor = goals.find(g => g.id === (planData?.goal || selectedGoal))?.color || '#818cf8';

    return (
        <div className="min-h-screen bg-[#0A0A0F] text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/20 via-transparent to-transparent border-b border-white/5">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                        <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 mb-4">
                            <Sparkles size={16} className="text-purple-400" />
                            <span className="text-sm text-gray-300">AI-Powered Indian Meal Planner</span>
                        </div>
                        <h1 className="font-display text-5xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
                            NutriPath
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Personalized 7-day Indian meal plans tailored to your fitness goals
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Goal Selector */}
                <div className="mb-8">
                    <h2 className="text-sm uppercase tracking-wider text-gray-500 mb-4">Choose Your Fitness Goal</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {goals.map(goal => (
                            <motion.button
                                key={goal.id}
                                onClick={() => setSelectedGoal(goal.id)}
                                whileHover={{ y: -4 }}
                                className={`relative p-6 rounded-2xl backdrop-blur-xl border-2 transition-all text-left ${
                                    selectedGoal === goal.id
                                        ? 'bg-white/10 border-white/20 shadow-lg'
                                        : 'bg-white/5 border-white/5 hover:border-white/10'
                                }`}
                                style={selectedGoal === goal.id ? { borderColor: goal.color, boxShadow: `0 0 30px ${goal.color}40` } : {}}
                            >
                                <div className="text-4xl mb-3">{goal.icon}</div>
                                <h3 className="font-display font-bold text-lg mb-1">{goal.name}</h3>
                                <p className="text-sm text-gray-400 mb-3">{goal.desc}</p>
                                <div className="text-xs text-gray-500">{goal.calories} cal/day</div>
                                {selectedGoal === goal.id && (
                                    <motion.div
                                        layoutId="goalIndicator"
                                        className="absolute inset-0 rounded-2xl border-2"
                                        style={{ borderColor: goal.color }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => genMut.mutate()}
                        disabled={genMut.isPending}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold px-8 py-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/30"
                    >
                        {genMut.isPending ? (
                            <span className="flex items-center gap-2">
                                <Loader2 size={18} className="animate-spin" />
                                Generating Your Plan...
                            </span>
                        ) : (
                            'Generate Meal Plan'
                        )}
                    </button>
                </div>

                {/* Meal Plan Display */}
                {isLoading && (
                    <div className="text-center py-20 text-gray-500">
                        <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                        Loading your nutrition plan...
                    </div>
                )}

                {!isLoading && !planData && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🍽️</div>
                        <h3 className="font-display text-xl font-semibold mb-2">No Meal Plan Yet</h3>
                        <p className="text-gray-500">Select your goal and generate a personalized plan</p>
                    </div>
                )}

                {!isLoading && planData && (
                    <>
                        {/* Summary Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
                        >
                            <div className="flex flex-wrap items-center justify-around gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-1" style={{ color: goalColor }}>
                                        {planData.summary?.calories || currentDay.total_calories || '—'}
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500">Calories</div>
                                </div>
                                <div className="h-12 w-px bg-white/10" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-1" style={{ color: goalColor }}>
                                        {planData.summary?.protein || '—'}g
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500">Protein</div>
                                </div>
                                <div className="h-12 w-px bg-white/10" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-1" style={{ color: goalColor }}>
                                        {planData.summary?.carbs || '—'}g
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500">Carbs</div>
                                </div>
                                <div className="h-12 w-px bg-white/10" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold mb-1" style={{ color: goalColor }}>
                                        {planData.summary?.fat || '—'}g
                                    </div>
                                    <div className="text-xs uppercase tracking-wider text-gray-500">Fat</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Day Tabs */}
                        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                            {dayNames.map((day, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDay(idx)}
                                    className={`px-5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                                        selectedDay === idx
                                            ? 'text-white shadow-lg'
                                            : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                                    style={selectedDay === idx ? { backgroundColor: goalColor } : {}}
                                >
                                    {day}
                                </button>
                            ))}
                            <button
                                onClick={() => setShowShoppingList(true)}
                                className="ml-auto px-5 py-2 rounded-xl text-sm font-medium bg-green-600/20 text-green-400 border border-green-500/20 hover:bg-green-600/30 transition flex items-center gap-2 whitespace-nowrap"
                            >
                                <ShoppingCart size={16} />
                                Shopping List
                            </button>
                        </div>

                        {/* Meals Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealType) => {
                                const meal = currentDay[mealType];
                                if (!meal) return null;

                                const meals = Array.isArray(meal) ? meal : [meal];
                                
                                return meals.map((m, idx) => (
                                    <motion.div
                                        key={`${mealType}-${idx}`}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ y: -4 }}
                                        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                                    >
                                        {/* Header */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-3xl">{mealEmojis[mealType]}</div>
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider text-gray-500">{mealType}</div>
                                                    <div className="text-xs text-gray-600">{m.time || '—'}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meal Name */}
                                        <h3 className="font-display text-lg font-semibold mb-4">{m.name || m.meal_name || 'Meal'}</h3>

                                        {/* Macros */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="text-xs bg-orange-600/20 text-orange-300 px-3 py-1 rounded-full">
                                                {m.calories || 0} cal
                                            </span>
                                            <span className="text-xs bg-purple-600/20 text-purple-300 px-3 py-1 rounded-full">
                                                P: {m.protein_g || m.protein || 0}g
                                            </span>
                                            <span className="text-xs bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full">
                                                C: {m.carbs_g || m.carbs || 0}g
                                            </span>
                                            <span className="text-xs bg-yellow-600/20 text-yellow-300 px-3 py-1 rounded-full">
                                                F: {m.fat_g || m.fat || 0}g
                                            </span>
                                        </div>

                                        {/* Ingredients */}
                                        {m.ingredients && m.ingredients.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-xs text-gray-500 mb-2">Ingredients:</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {m.ingredients.slice(0, 5).map((ing, i) => (
                                                        <span key={i} className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-lg">
                                                            {ing}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* BigBasket Button */}
                                        <a
                                            href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(m.name || m.meal_name || '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-sm bg-[#84c225] hover:bg-[#6fa01d] text-white font-medium px-4 py-2 rounded-lg transition"
                                        >
                                            Order on BigBasket
                                            <ExternalLink size={14} />
                                        </a>
                                    </motion.div>
                                ));
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Shopping List Drawer */}
            <AnimatePresence>
                {showShoppingList && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowShoppingList(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0A0A0F] border-l border-white/10 z-50 overflow-y-auto"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="font-display text-2xl font-bold">Shopping List</h2>
                                    <button
                                        onClick={() => setShowShoppingList(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {shoppingList && shoppingList.length > 0 ? (
                                    <div className="space-y-3">
                                        {shoppingList.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                                                <div className="flex-1">
                                                    <div className="text-sm text-white">{item.name || item.ingredient || item}</div>
                                                    {item.count && <div className="text-xs text-gray-500">×{item.count}</div>}
                                                </div>
                                                <a
                                                    href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(item.name || item.ingredient || item)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs bg-[#84c225] hover:bg-[#6fa01d] text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                                                >
                                                    Buy <ExternalLink size={10} />
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>No shopping list available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
