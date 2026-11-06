import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Utensils, 
    Check, 
    ShoppingCart, 
    ExternalLink, 
    ChevronDown, 
    ChevronUp, 
    Loader2, 
    X, 
    Sparkles, 
    Clock, 
    Flame, 
    RotateCcw,
    CheckCircle2,
    Info,
    CalendarDays
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import useSidebarStore from '../stores/sidebarStore';
import useWellnessStore from '../stores/wellnessStore';
import { mealImages, resolveMealImage } from '../utils/mealImages';
import { nutritionApi, calendarApi } from '../services/api';
import toast from 'react-hot-toast';

const GOAL_MEALS = {
    loss: {
        breakfast: { name: 'Idli with Sambar', calories: 280, protein_g: 10, carbs_g: 48, fat_g: 4, time: '8:00 AM', description: 'Steamed idli with a bowl of sambar.', ingredients: ['Idli', 'Sambar', 'Coconut chutney'] },
        lunch: { name: 'Saag Aloo & Whole Wheat Roti', calories: 390, protein_g: 16, carbs_g: 48, fat_g: 12, time: '1:00 PM', description: 'Spinach saag with potato and two rotis.', ingredients: ['Spinach', 'Potato', 'Roti'] },
        snacks: { name: 'Roasted Makhana', calories: 90, protein_g: 3, carbs_g: 12, fat_g: 2, time: '4:30 PM', description: 'Light roasted fox nuts with a pinch of salt.', ingredients: ['Makhana', 'Salt', 'Pepper'] },
        dinner: { name: 'Tofu Tikka Masala & Jeera Brown Rice', calories: 360, protein_g: 24, carbs_g: 40, fat_g: 10, time: '8:00 PM', description: 'Tofu in tikka masala gravy with cumin rice.', ingredients: ['Tofu', 'Tomato gravy', 'Brown rice'] },
    },
    gain: {
        breakfast: { name: 'Puri with Potato Curry', calories: 520, protein_g: 12, carbs_g: 68, fat_g: 20, time: '8:00 AM', description: 'Puffed puris with a bowl of potato curry.', ingredients: ['Puri', 'Potato', 'Spices'] },
        lunch: { name: 'Saag Aloo & Whole Wheat Roti', calories: 640, protein_g: 20, carbs_g: 78, fat_g: 22, time: '1:00 PM', description: 'A larger plate of saag, potato, and roti.', ingredients: ['Spinach', 'Potato', 'Roti', 'Ghee'] },
        snacks: { name: 'Banana Peanut Shake', calories: 320, protein_g: 12, carbs_g: 42, fat_g: 12, time: '4:30 PM', description: 'Banana blended with milk and peanut butter.', ingredients: ['Banana', 'Milk', 'Peanut butter'] },
        dinner: { name: 'Tofu Tikka Masala & Jeera Brown Rice', calories: 620, protein_g: 30, carbs_g: 72, fat_g: 18, time: '8:00 PM', description: 'Tikka masala with an extra serving of jeera rice.', ingredients: ['Tofu', 'Tomato gravy', 'Rice'] },
    },
    balance: {
        breakfast: { name: 'Puri with Potato Curry', calories: 340, protein_g: 10, carbs_g: 52, fat_g: 11, time: '8:30 AM', description: 'Puris with a modest bowl of potato curry.', ingredients: ['Puri', 'Potato', 'Spices'] },
        lunch: { name: 'Saag Aloo & Whole Wheat Roti', calories: 440, protein_g: 18, carbs_g: 52, fat_g: 14, time: '1:00 PM', description: 'Spinach saag, potato, and whole wheat roti.', ingredients: ['Spinach', 'Potato', 'Roti'] },
        snacks: { name: 'Sprouted Moong Chaat', calories: 140, protein_g: 8, carbs_g: 22, fat_g: 2, time: '4:30 PM', description: 'Sprouted moong with onion, cucumber, and lemon.', ingredients: ['Sprouted moong', 'Onion', 'Cucumber', 'Lemon'] },
        dinner: { name: 'Tofu Tikka Masala & Jeera Brown Rice', calories: 390, protein_g: 26, carbs_g: 44, fat_g: 12, time: '8:00 PM', description: 'Tofu tikka masala with jeera rice.', ingredients: ['Tofu', 'Tomato gravy', 'Brown rice'] },
    },
    muscle: {
        breakfast: { name: 'Idli with Sambar', calories: 360, protein_g: 16, carbs_g: 54, fat_g: 6, time: '8:00 AM', description: 'Idli and sambar with extra dal for protein.', ingredients: ['Idli', 'Sambar', 'Dal'] },
        lunch: { name: 'Saag Aloo & Whole Wheat Roti', calories: 520, protein_g: 28, carbs_g: 55, fat_g: 16, time: '1:00 PM', description: 'Saag and roti with a side of curd.', ingredients: ['Spinach', 'Roti', 'Curd'] },
        snacks: { name: 'Hung Curd with Almonds', calories: 220, protein_g: 18, carbs_g: 10, fat_g: 12, time: '4:30 PM', description: 'Strained curd topped with chopped almonds.', ingredients: ['Hung curd', 'Almonds', 'Cinnamon'] },
        dinner: { name: 'Tofu Tikka Masala & Jeera Brown Rice', calories: 480, protein_g: 36, carbs_g: 46, fat_g: 14, time: '8:00 PM', description: 'High-protein tofu tikka masala with rice.', ingredients: ['Tofu', 'Tomato gravy', 'Rice'] },
    },
};

function asDish(value) {
    if (!value) return null;
    const item = Array.isArray(value) ? value.find((entry) => entry && (entry.name || entry.meal_name || typeof entry === 'string')) : value;
    if (!item) return null;
    if (typeof item === 'string') return { name: item };
    return { ...item, name: item.name || item.meal_name || '' };
}

const mealEmojis = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' };

// High-End Culinary Image with Skeleton Loading State
function MealThumbnailImage({ src, alt, isCompleted }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className="relative w-full h-32 sm:h-36 overflow-hidden bg-slate-950 rounded-t-xl">
            {/* Shimmer Skeleton placeholder */}
            {!loaded && (
                <div className="absolute inset-0 skeleton-shimmer" />
            )}

            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={`h-32 sm:h-36 w-full object-cover rounded-t-xl transition-all duration-500 ${
                    loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                } ${isCompleted ? 'filter saturate-75 brightness-75' : 'group-hover:scale-105'}`}
                loading="lazy"
            />
        </div>
    );
}

// Apple Fitness Inspired Macro Progress Ring
function CircularMacroRing({ label, consumed, target, unit = 'g', color, glowColor }) {
    const radius = 34;
    const stroke = 5;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const percentage = Math.min(100, Math.round((consumed / Math.max(target, 1)) * 100));
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center bg-[#FFFDF4] border border-[#EFE6B4] p-6 rounded-3xl">
            <div className="relative w-24 h-24 flex items-center justify-center my-1">
                <svg height={radius * 2 + 10} width={radius * 2 + 10} className="transform -rotate-90">
                    <circle
                        stroke="#EFE6B4"
                        fill="transparent"
                        strokeWidth={stroke}
                        r={normalizedRadius}
                        cx={radius + 5}
                        cy={radius + 5}
                    />
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeWidth={stroke}
                        strokeDasharray={`${circumference} ${circumference}`}
                        style={{
                            strokeDashoffset,
                            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                            filter: `drop-shadow(0 0 6px ${glowColor})`,
                        }}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={radius + 5}
                        cy={radius + 5}
                    />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-base font-bold text-[#243016] font-mono leading-none">
                        {percentage}%
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                        met
                    </span>
                </div>
            </div>

            <div className="text-center mt-2 space-y-0.5">
                <div className="text-xs font-semibold text-[#243016]">{label}</div>
                <div className="text-[11px] font-mono text-[#5C6B32]">
                    <strong style={{ color }} className="font-semibold">{consumed}</strong> / {target}{unit}
                </div>
            </div>
        </div>
    );
}

export default function NutritionPlans() {
    const [tab, setTab] = useState('today');
    const [expanded, setExpanded] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState('balance');
    const [showShoppingDrawer, setShowShoppingDrawer] = useState(false);
    const [activeRecipeModal, setActiveRecipeModal] = useState(null);

    const { isCollapsed } = useSidebarStore();
    const qc = useQueryClient();

    // Persistent Wellness Store for Optimistic Meal Toggles & Live Dynamic Macros
    const isMealCompleted = useWellnessStore((s) => s.isMealCompleted);
    const toggleMealInStore = useWellnessStore((s) => s.toggleMeal);
    const getDynamicDailyMacros = useWellnessStore((s) => s.getDynamicDailyMacros);

    const goals = [
        { id: 'loss', icon: '🔥', name: 'Weight Loss', desc: 'High-fiber, calibrated Indian meals', calories: 1400, protein: 60, carbs: 150, fat: 35 },
        { id: 'gain', icon: '📈', name: 'Weight Gain', desc: 'Calorie-dense, nourishing whole foods', calories: 2800, protein: 90, carbs: 380, fat: 80 },
        { id: 'balance', icon: '⚖️', name: 'Balanced', desc: 'Maintain body composition and energy', calories: 2000, protein: 75, carbs: 250, fat: 55 },
        { id: 'muscle', icon: '💪', name: 'Muscle Gain', desc: 'High-protein, muscle synthesis focus', calories: 2600, protein: 160, carbs: 300, fat: 65 },
    ];

    const currentGoalConfig = goals.find((g) => g.id === selectedGoal) || goals[2];

    const { data: plan, isLoading } = useQuery({ 
        queryKey: ['nutritionPlan'], 
        queryFn: () => nutritionApi.getCurrent().then((r) => r.data), 
        retry: false 
    });
    
    const { data: todayMeals } = useQuery({ 
        queryKey: ['todayMeals'], 
        queryFn: () => nutritionApi.getToday().then((r) => r.data).catch(() => null), 
        retry: false 
    });
    
    const { data: shoppingList } = useQuery({ 
        queryKey: ['shoppingList'], 
        queryFn: () => nutritionApi.getShoppingList().then((r) => r.data).catch(() => []), 
        enabled: showShoppingDrawer || tab === 'shopping',
        retry: false 
    });

    const genMut = useMutation({ 
        mutationFn: () => nutritionApi.generate({ 
            goal: selectedGoal, 
            calorie_target: currentGoalConfig.calories,
            diet_type: 'vegetarian', 
            allergies: '' 
        }), 
        onSuccess: () => { 
            qc.invalidateQueries(['nutritionPlan', 'todayMeals']); 
            toast.success('Your personalized Indian meal architecture is ready! 🥗', {
                style: {
                    background: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                }
            }); 
        },
        onError: () => {
            qc.invalidateQueries(['nutritionPlan', 'todayMeals']);
            toast.error('Failed to regenerate diet plan. Please try again.', {
                style: {
                    background: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                }
            });
        }
    });

    const syncCalendarMut = useMutation({
        mutationFn: () => calendarApi.syncToday(),
        onSuccess: (res) => {
            toast.success(res.data?.message || 'Meals & schedule synced with Google Calendar! 📅', {
                style: {
                    background: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                }
            });
        },
        onError: (err) => {
            toast.error(err.response?.data?.detail || 'Failed to sync with Google Calendar', {
                style: {
                    background: '#0F172A',
                    color: '#F8FAFC',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                }
            });
        }
    });

    const completeMut = useMutation({ 
        mutationFn: (data) => nutritionApi.completeMeal(data), 
    });

    const planData = useMemo(() => {
        if (!plan?.plan_data) return null;
        return typeof plan.plan_data === 'string' ? JSON.parse(plan.plan_data) : plan.plan_data;
    }, [plan]);

    const weekPlan = useMemo(() => {
        if (!planData) return [];
        if (Array.isArray(planData.days)) return planData.days;
        if (typeof planData.days === 'object' && planData.days) return Object.values(planData.days);
        if (Array.isArray(planData.week)) return planData.week;
        if (typeof planData.week === 'object' && planData.week) return Object.values(planData.week);
        return [];
    }, [planData]);

    // Accurate Indian Culinary Fallbacks (matches prompt examples explicitly!)
    const fallbackMeals = useMemo(() => ({
        breakfast: {
            name: "Puri with Potato Curry & Spiced Chana",
            calories: 340,
            protein_g: 10,
            carbs_g: 52,
            fat_g: 11,
            time: "8:30 AM",
            ingredients: ["Whole Wheat Puri", "Spiced Potatoes", "Mustard Seeds", "Curry Leaves", "Turmeric"],
            description: "Freshly made golden puffed puris paired with fragrant tempered potato masala and mint chutney."
        },
        lunch: {
            name: "Saag Aloo & Whole Wheat Roti",
            calories: 440,
            protein_g: 18,
            carbs_g: 52,
            fat_g: 14,
            time: "1:00 PM",
            ingredients: ["Fresh Spinach", "Potatoes", "Whole Wheat Roti", "Garlic", "Cumin", "Ghee"],
            description: "Slow-simmered rich green spinach saag with tender potato chunks and artisanal phulkas."
        },
        snacks: {
            name: "Sprouted Moong Chaat with Pomegranate",
            calories: 140,
            protein_g: 8,
            carbs_g: 24,
            fat_g: 2,
            time: "4:30 PM",
            ingredients: ["Sprouted Moong Beans", "Fresh Pomegranate", "Rock Salt", "Lemon Juice", "Cucumber"],
            description: "Enzyme-rich sprouted lentils tossed with sweet ruby pomegranate seeds, lime, and chaat masala."
        },
        dinner: {
            name: "Tofu Tikka Masala & Jeera Brown Rice",
            calories: 390,
            protein_g: 26,
            carbs_g: 44,
            fat_g: 12,
            time: "8:00 PM",
            ingredients: ["High-Protein Tofu", "Roasted Tomato Gravy", "Tandoori Spices", "Jeera", "Brown Rice"],
            description: "Smoky char-grilled tofu in a creamy spiced tomato sauce paired with cumin-infused brown rice."
        }
    }), []);

    const goalMeals = GOAL_MEALS[selectedGoal] || GOAL_MEALS.balance;
    const rawTodayMeals = todayMeals?.meals || todayMeals;
    const apiGoal = todayMeals?.goal || plan?.goal;
    const apiMatchesGoal = apiGoal === selectedGoal && rawTodayMeals && !Array.isArray(rawTodayMeals);
    const meals = {
        breakfast: (apiMatchesGoal && asDish(rawTodayMeals.breakfast)) || goalMeals.breakfast,
        lunch: (apiMatchesGoal && asDish(rawTodayMeals.lunch)) || goalMeals.lunch,
        snacks: (apiMatchesGoal && asDish(rawTodayMeals.snacks)) || goalMeals.snacks,
        dinner: (apiMatchesGoal && asDish(rawTodayMeals.dinner)) || goalMeals.dinner,
    };

    // Dynamically calculate macros whenever checked meals change!
    const targetMacros = {
        calories: planData?.summary?.calories || currentGoalConfig.calories,
        protein: planData?.summary?.protein || currentGoalConfig.protein,
        carbs: planData?.summary?.carbs || currentGoalConfig.carbs,
        fat: planData?.summary?.fat || currentGoalConfig.fat,
    };

    const dynamicMacros = getDynamicDailyMacros(targetMacros);

    const handleToggleMeal = (mealType, mealData) => {
        const isNowDone = toggleMealInStore(mealType, mealData);
        if (isNowDone) {
            toast.success(`Logged ${mealData?.name || mealType}! +25 XP & charity meal funded 💚`);
        } else {
            toast(`Unchecked ${mealData?.name || mealType}`);
        }
        completeMut.mutate({ meal_id: mealType, meal_type: mealType });
    };

    // Render Clean, Vertical Stack Indian Meal Card
    const renderMealCard = (meal, mealType, idx) => {
        if (!meal) return null;
        const isCompleted = isMealCompleted(mealType);
        const imageUrl = resolveMealImage(meal.name, mealType);

        return (
            <motion.div 
                key={mealType || idx}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 24, bounce: 0.2 }}
                className={`group rounded-[24px] overflow-hidden border transition-all duration-300 flex flex-col justify-between bg-white ${
                    isCompleted
                        ? 'border-[#8AA84A] shadow-lg'
                        : 'border-[#E7E1C4] hover:shadow-md'
                }`}
            >
                <div className="relative h-56 w-full overflow-hidden bg-[#F4E7A4]">
                    <img 
                        src={imageUrl} 
                        alt={meal.name} 
                        className={`h-56 w-full object-cover transition-all duration-500 ${
                            isCompleted ? 'filter saturate-75 brightness-90' : 'group-hover:scale-[1.03]'
                        }`}
                        loading="lazy"
                    />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-full bg-white/95 text-[#243016] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                            <span>{mealEmojis[mealType] || '🍽️'}</span>
                            <span>{mealType}</span>
                        </span>
                        {meal.time && (
                            <span className="px-3 py-1.5 rounded-full bg-white/95 text-[11px] font-medium text-[#3E4C22] flex items-center gap-1 shadow-sm">
                                <Clock size={11} />
                                <span>{meal.time}</span>
                            </span>
                        )}
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-7 space-y-5 flex-1 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                            <h3 className={`font-bold text-lg sm:text-xl leading-snug transition-all ${
                                isCompleted ? 'line-through text-[#8A9378]' : 'text-[#243016]'
                            }`}>
                                {meal.name || meal.meal_name || 'Indian Balanced Meal'}
                            </h3>
                            <div className="flex items-center gap-2 mt-2 text-sm text-[#5C6B32]">
                                <span className="font-mono text-[#3E4C22] font-semibold">{meal.calories || 0} kcal</span>
                                {isCompleted && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium border border-emerald-500/30">
                                        Logged
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Prominent, Tactile Green Checkmark Toggle on Right */}
                        <motion.button 
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => handleToggleMeal(mealType, meal)} 
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                                isCompleted
                                    ? 'bg-[#3E4C22] text-[#F6DE45] font-bold'
                                    : 'bg-[#FFF8D0] text-[#5C6B32] border border-[#E7E1C4] hover:border-[#3E4C22]'
                            }`}
                            title={isCompleted ? "Uncheck meal" : "Mark as eaten"}
                        >
                            <Check size={20} className={isCompleted ? 'stroke-[3]' : 'stroke-2'} />
                        </motion.button>
                    </div>

                    {meal.description && (
                        <p className="text-sm text-[#4E5C34] leading-7 line-clamp-3">
                            {meal.description}
                        </p>
                    )}

                    {/* Clean Horizontal Macro Pill List with Soft Dividers */}
                    <div className="flex items-center justify-between divide-x divide-[#EFE6B4] bg-[#FFFDF4] border border-[#EFE6B4] rounded-2xl px-2 py-3 text-sm">
                        <div className="flex-1 text-center">
                            <span className="text-[10px] uppercase font-semibold text-[#8A9378] block">Protein</span>
                            <span className="font-semibold text-[#243016] font-mono mt-1 block">{meal.protein_g || meal.protein || 0}g</span>
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-[10px] uppercase font-semibold text-[#8A9378] block">Carbs</span>
                            <span className="font-semibold text-[#243016] font-mono mt-1 block">{meal.carbs_g || meal.carbs || 0}g</span>
                        </div>
                        <div className="flex-1 text-center">
                            <span className="text-[10px] uppercase font-semibold text-[#8A9378] block">Fats</span>
                            <span className="font-semibold text-[#243016] font-mono mt-1 block">{meal.fat_g || meal.fat || 0}g</span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#EFE6B4] text-sm">
                        <button
                            onClick={() => setActiveRecipeModal(meal)}
                            className="text-[#5C6B32] hover:text-[#243016] transition font-medium flex items-center gap-1.5"
                        >
                            <Info size={14} className="text-slate-500" />
                            <span>Pantry Ingredients</span>
                        </button>

                        <a
                            href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(meal.name || 'groceries')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#3E4C22] hover:text-[#243016] font-semibold flex items-center gap-1 transition"
                        >
                            <span>BigBasket</span>
                            <ExternalLink size={12} />
                        </a>
                    </div>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#FFF6C4] text-[#243016] font-['Inter',sans-serif]">
            <Sidebar />

            <main className="flex-1 min-w-0 p-6 sm:p-8 lg:p-12 min-h-screen overflow-x-hidden flex flex-col items-center">
                <div className="w-full max-w-6xl space-y-12">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-10 border-b border-[#E4D56A]">
                        <div className="space-y-4 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D7F08A] text-[#243016] text-xs font-semibold">
                                <Sparkles size={14} />
                                <span>Personalised Indian meals</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#243016] font-['Plus_Jakarta_Sans',sans-serif]">
                                Today’s balanced plate
                            </h1>
                            <p className="text-base text-[#3E4C22] max-w-xl leading-8">
                                Breakfast, lunch, snack, and dinner with a photograph of the dish named on the card.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button 
                                onClick={() => syncCalendarMut.mutate()} 
                                disabled={syncCalendarMut.isPending} 
                                className="px-5 py-3 text-sm font-semibold flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-500/30 dark:hover:bg-sky-900/50 transition-all shadow-sm"
                                title="Sync today's meals and schedule to Google Calendar"
                            >
                                {syncCalendarMut.isPending ? (
                                    <>
                                        <Loader2 size={16} className="spinner" /> Syncing Calendar...
                                    </>
                                ) : (
                                    <>
                                        <CalendarDays size={16} className="text-sky-500" /> Sync with Calendar
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={() => genMut.mutate()} 
                                disabled={genMut.isPending} 
                                className="btn btn-primary px-6 py-3 text-sm font-semibold flex items-center gap-2 rounded-full shadow-lg"
                            >
                                {genMut.isPending ? (
                                    <>
                                        <Loader2 size={16} className="spinner" /> Calibrating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} /> Regenerate Diet Plan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Apple Health Inspired Dynamic Macro Rings Dashboard */}
                    <div className="bg-white border border-[#EFE6B4] rounded-[28px] p-8 sm:p-10 shadow-sm space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl font-bold tracking-tight text-[#243016]">
                                    Daily macros
                                </h3>
                                <p className="text-sm text-[#5C6B32] mt-2 leading-7">
                                    Checking a meal updates what you have eaten and what is still left today.
                                </p>
                            </div>

                            <div className="px-4 py-2 rounded-full bg-[#FFF8D0] border border-[#E7E1C4] text-sm text-[#243016] font-medium self-start sm:self-auto">
                                <strong className="text-emerald-400 font-semibold">{dynamicMacros.completedCount}</strong> of 4 meals logged
                            </div>
                        </div>

                        {/* 4 Spacious Circular Macro Rings */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-2">
                            <CircularMacroRing
                                label="Total Calories"
                                consumed={dynamicMacros.consumed.calories}
                                target={dynamicMacros.targets.calories}
                                unit=" kcal"
                                color="#FF6B6B"
                                glowColor="rgba(255, 107, 107, 0.3)"
                            />
                            <CircularMacroRing
                                label="Protein Target"
                                consumed={dynamicMacros.consumed.protein}
                                target={dynamicMacros.targets.protein}
                                unit="g"
                                color="#10B981"
                                glowColor="rgba(16, 185, 129, 0.3)"
                            />
                            <CircularMacroRing
                                label="Carbohydrates"
                                consumed={dynamicMacros.consumed.carbs}
                                target={dynamicMacros.targets.carbs}
                                unit="g"
                                color="#0EA5E9"
                                glowColor="rgba(14, 165, 233, 0.3)"
                            />
                            <CircularMacroRing
                                label="Healthy Fats"
                                consumed={dynamicMacros.consumed.fat}
                                target={dynamicMacros.targets.fat}
                                unit="g"
                                color="#F59E0B"
                                glowColor="rgba(245, 158, 11, 0.3)"
                            />
                        </div>
                    </div>

                    {/* Target Metabolic Focus Goal Selector */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5C6B32]">
                                Choose a goal
                            </span>
                            <span className="text-sm font-mono text-[#3E4C22]">
                                {currentGoalConfig.calories} kcal/day
                            </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                            {goals.map((goal) => {
                                const isSelected = selectedGoal === goal.id;
                                return (
                                    <button
                                        key={goal.id}
                                        onClick={() => setSelectedGoal(goal.id)}
                                        className={`p-6 rounded-[24px] border transition-all duration-200 text-left relative overflow-hidden ${
                                            isSelected
                                                ? 'bg-[#3E4C22] border-[#3E4C22] text-[#F7F3D8]'
                                                : 'bg-white border-[#E7E1C4] text-[#243016] hover:border-[#3E4C22]'
                                        }`}
                                    >
                                        <div className="text-3xl mb-4">{goal.icon}</div>
                                        <h4 className="font-semibold text-base mb-2">
                                            {goal.name}
                                        </h4>
                                        <p className={`text-sm mb-4 leading-6 ${isSelected ? 'text-[#E7E2C4]' : 'text-[#5C6B32]'}`}>{goal.desc}</p>
                                        <div className="text-sm font-mono font-medium">
                                            {goal.calories} <span className="text-xs opacity-70">cal/day</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tabs & Shopping Cart Navigation */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setTab('today')} 
                                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                                    tab === 'today' 
                                        ? 'bg-[#3E4C22] text-[#F6DE45]' 
                                        : 'bg-white text-[#3E4C22] border border-[#E7E1C4]'
                                }`}
                            >
                                Today's Indian Meals
                            </button>
                            <button 
                                onClick={() => setTab('week')} 
                                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all ${
                                    tab === 'week' 
                                        ? 'bg-[#3E4C22] text-[#F6DE45]' 
                                        : 'bg-white text-[#3E4C22] border border-[#E7E1C4]'
                                }`}
                            >
                                7-Day Plan
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowShoppingDrawer(true)}
                            className="btn btn-secondary px-5 py-2.5 text-xs rounded-full flex items-center gap-2"
                        >
                            <ShoppingCart size={14} />
                            <span>Shopping List</span>
                        </button>
                    </div>

                    {/* Loading State */}
                    {isLoading && (
                        <div className="text-center py-24 text-sm text-slate-400">
                            <Loader2 size={24} className="spinner mx-auto mb-3 text-emerald-400" />
                            Loading your meal plan...
                        </div>
                    )}

                    {/* TODAY'S MEALS GRID: Breathable 2-Column Food Cards */}
                    {tab === 'today' && meals && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {['breakfast', 'lunch', 'dinner', 'snacks'].map((type, i) => {
                                const meal = meals[type] || (Array.isArray(meals) ? meals[i] : null);
                                return meal ? renderMealCard(meal, type, i) : null;
                            })}
                        </div>
                    )}

                    {/* WEEK VIEW: Clean Minimalist Expansion */}
                    {tab === 'week' && Array.isArray(weekPlan) && (
                        <div className="space-y-4">
                            {weekPlan.map((day, i) => (
                                <div key={i} className="bg-white border border-[#EFE6B4] rounded-3xl p-6">
                                    <button 
                                        onClick={() => setExpanded(expanded === i ? null : i)} 
                                        className="w-full flex items-center justify-between text-left"
                                    >
                                        <span className="font-semibold text-base text-[#243016]">{day.day || `Day ${i + 1}`}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-mono text-emerald-400">{day.total_calories || '2000'} cal</span>
                                            {expanded === i ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                                        </div>
                                    </button>
                                    {expanded === i && (
                                        <div className="pt-6 mt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {['breakfast', 'lunch', 'dinner', 'snacks'].map((type) => {
                                                const meal = day[type];
                                                if (!meal) return null;
                                                return (
                                                    <div key={type} className="bg-[#FFFDF4] border border-[#EFE6B4] rounded-2xl p-4 space-y-1">
                                                        <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                                                            <span>{mealEmojis[type]}</span>
                                                            <span>{type}</span>
                                                        </div>
                                                        <div className="text-sm font-semibold text-[#243016]">
                                                            {typeof meal === 'string' ? meal : meal.name || 'Meal'}
                                                        </div>
                                                        {meal.calories && (
                                                            <div className="text-[11px] font-mono text-slate-400">{meal.calories} cal</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Pantry & Recipe Ingredients Modal */}
            <AnimatePresence>
                {activeRecipeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            className="bg-[#0B0F19] border border-white/10 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                                <div>
                                    <h3 className="font-semibold text-xl text-white">
                                        {activeRecipeModal.name}
                                    </h3>
                                    <span className="text-xs text-emerald-400 font-mono font-medium">
                                        {activeRecipeModal.calories} kcal • Indian Culinary Architecture
                                    </span>
                                </div>
                                <button 
                                    onClick={() => setActiveRecipeModal(null)}
                                    className="p-2 rounded-full bg-white/[0.05] text-slate-400 hover:text-white transition"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                                        Ingredients & Fresh Herbs
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(activeRecipeModal.ingredients || ["Whole Wheat Atta", "Turmeric", "Cumin", "Himalayan Pink Salt", "Fresh Coriander"]).map((ing, idx) => (
                                            <span 
                                                key={idx}
                                                className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-slate-200"
                                            >
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Nutritional & Ayurvedic Context
                                    </h4>
                                    <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]">
                                        Balances Agni (digestive fire), rich in bio-available proteins and micronutrients, supporting metabolic recovery without sluggish glycemic spikes.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <a
                                        href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(activeRecipeModal.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary w-full text-xs sm:text-sm py-3.5 rounded-full font-semibold flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={16} />
                                        <span>Order Ingredients on BigBasket</span>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shopping List Drawer */}
            <AnimatePresence>
                {showShoppingDrawer && (
                    <>
                        <div
                            onClick={() => setShowShoppingDrawer(false)}
                            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:ml-64"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#0B0F19] border-l border-white/[0.08] z-50 p-8 overflow-y-auto shadow-2xl space-y-6"
                        >
                            <div className="flex items-center justify-between pb-5 border-b border-white/[0.06]">
                                <div>
                                    <h2 className="text-xl font-semibold text-white">Weekly Shopping List</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Consolidated fresh produce & pantry spices</p>
                                </div>
                                <button
                                    onClick={() => setShowShoppingDrawer(false)}
                                    className="text-slate-400 hover:text-white transition p-2 rounded-full bg-white/[0.04]"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {(shoppingList && shoppingList.length > 0 ? shoppingList : [
                                    "Whole Wheat Atta (5kg)", "Artisanal Paneer (400g)", "Fresh Palak/Spinach", 
                                    "Organic Moong Dal Sprouts", "Brown Rice (1kg)", "Roasted Foxnuts / Makhana"
                                ]).map((item, idx) => {
                                    const itemName = typeof item === 'string' ? item : item.name || item.ingredient || 'Item';
                                    return (
                                        <div 
                                            key={idx}
                                            className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 rounded-md bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                                                    <Check size={12} />
                                                </div>
                                                <span className="text-xs sm:text-sm font-medium text-slate-200">{itemName}</span>
                                            </div>
                                            <a
                                                href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(itemName)}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-secondary text-xs py-1.5 px-3 rounded-full flex items-center gap-1"
                                            >
                                                <span>Buy</span>
                                                <ExternalLink size={10} />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
