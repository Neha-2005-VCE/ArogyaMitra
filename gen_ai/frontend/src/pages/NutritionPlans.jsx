import { useEffect, useState } from 'react'
import { Check, ShoppingCart, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '../components/Navbar'
import { nutritionApi } from '../services/api'
import { generateCalendarUrl } from '../utils/calendar'
import toast from 'react-hot-toast'
import useAuthStore from '../stores/authStore'
import MealAlternativeModal from '../components/MealAlternativeModal'

const mealColors = {
  Breakfast: { bg: 'bg-orange-600/15', border: 'border-orange-600/30', text: 'text-orange-400', icon: '🌅' },
  Lunch: { bg: 'bg-yellow-600/15', border: 'border-yellow-600/30', text: 'text-yellow-400', icon: '☀️' },
  Dinner: { bg: 'bg-blue-600/15', border: 'border-blue-600/30', text: 'text-blue-400', icon: '🌙' },
  Snacks: { bg: 'bg-green-600/15', border: 'border-green-600/30', text: 'text-green-400', icon: '🍎' },
}

export default function NutritionPlans() {
  const { user } = useAuthStore()
  const [plan, setPlan] = useState(null)
  const [todayMeals, setTodayMeals] = useState(null)
  const [todayName, setTodayName] = useState('')
  const [shoppingList, setShoppingList] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const [completedMeals, setCompletedMeals] = useState(new Set())
  const [expandedDay, setExpandedDay] = useState(null)

  useEffect(() => {
    loadNutrition()
  }, [])

  const loadNutrition = async () => {
    try {
      const [planRes, todayRes, shoppingRes] = await Promise.all([
        nutritionApi.getCurrent().catch(() => ({ data: null })),
        nutritionApi.getToday().catch(() => ({ data: { today: null, day_name: '' } })),
        nutritionApi.getShoppingList().catch(() => ({ data: { shopping_list: [] } }))
      ])
      setPlan(planRes.data?.plan || null)
      setTodayMeals(todayRes.data?.today || null)
      setTodayName(todayRes.data?.day_name || '')
      setShoppingList(shoppingRes.data?.shopping_list || [])
    } catch (error) {
      console.error('Error loading nutrition:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGeneratePlan = async () => {
    setGenerating(true)
    try {
      toast.loading('Generating nutrition plan... 🥗', { id: 'gen' })
      await nutritionApi.generate({ calorie_target: 1800, diet_type: 'balanced', allergies: '' })
      toast.success('New nutrition plan generated! 🥗', { id: 'gen' })
      await loadNutrition()
    } catch (error) {
      toast.error('Failed to generate plan', { id: 'gen' })
    } finally {
      setGenerating(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!todayMeals) {
      toast.error('No meals available today.')
      return
    }

    let description = `🥗 ArogyaMitra Meals for Today\n\n`;
    ['breakfast', 'lunch', 'dinner'].forEach(type => {
      if (todayMeals[type]) {
        description += `🍽️ ${type.toUpperCase()}: ${todayMeals[type].name}\n`;
        description += `📊 Cal: ${todayMeals[type].calories} | Pro: ${todayMeals[type].protein_g || todayMeals[type].protein}g | Carb: ${todayMeals[type].carbs_g || todayMeals[type].carbs}g | Fat: ${todayMeals[type].fat_g || todayMeals[type].fats}g\n`;
        description += `🛒 Ingredients: ${(Array.isArray(todayMeals[type].ingredients) ? todayMeals[type].ingredients : [todayMeals[type].ingredients]).join(', ')}\n\n`;
      }
    });

    const url = generateCalendarUrl({
      title: `🥗 Daily Meals — ArogyaMitra`,
      description,
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      durationMinutes: 720
    });

    window.open(url, '_blank');
  }

  const handleCompleteMeal = async (mealType) => {
    try {
      await nutritionApi.completeMeal({ meal_id: mealType, meal_type: mealType })
      setCompletedMeals(prev => new Set([...prev, mealType]))
      toast.success('Meal tracked! +2 charity points 💚')
    } catch (error) {
      toast.error('Failed to log meal')
    }
  }

  const days = plan?.days || []

  const MealCard = ({ mealType, meal: initialMeal }) => {
    const [currentMeal, setCurrentMeal] = useState(initialMeal)
    const [isLiked, setIsLiked] = useState(false)
    const [showAlts, setShowAlts] = useState(false)

    useEffect(() => { setCurrentMeal(initialMeal) }, [initialMeal])

    if (!currentMeal) return null

    const color = mealColors[mealType] || mealColors.Breakfast
    const isCompleted = completedMeals.has(mealType.toLowerCase())

    // Accent logic: highlight border if liked
    const highlightClass = isLiked ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)] bg-white/[0.04]' : color.border

    return (
      <motion.div
        whileHover={{ y: -5 }}
        className={`glass relative overflow-hidden rounded-[2.5rem] p-8 border transition-all duration-500 ${color.bg} ${highlightClass}`}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${color.bg} border-2 ${color.border}`}>
              {color.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-xl font-black uppercase tracking-widest ${color.text}`}>{mealType}</h3>
                {currentMeal.isReplaced && <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Replaced</span>}
              </div>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">{currentMeal.time || 'Traditional Prep'}</p>
            </div>
          </div>
          <button
            onClick={() => !isCompleted && handleCompleteMeal(mealType.toLowerCase())}
            className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300 ${isCompleted
              ? 'bg-green-500 border-green-400 shadow-lg shadow-green-500/20'
              : 'border-white/10 hover:border-green-500'}`}
          >
            {isCompleted ? <Check className="w-5 h-5 text-white" /> : <div className="w-2 h-2 rounded-full bg-white/20" />}
          </button>
        </div>

        <h4 className="text-2xl font-black text-white mb-6 leading-tight group-hover:text-orange-400 transition-colors">{currentMeal.name}</h4>

        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'CAL', val: currentMeal.calories, color: 'text-orange-400' },
            { label: 'PRO', val: `${currentMeal.protein_g || currentMeal.protein || 0}g`, color: 'text-blue-400' },
            { label: 'CARB', val: `${currentMeal.carbs_g || currentMeal.carbs || 0}g`, color: 'text-green-400' },
            { label: 'FAT', val: `${currentMeal.fat_g || currentMeal.fats || 0}g`, color: 'text-yellow-400' }
          ].map((macro, i) => (
            <div key={i} className="bg-black/40 rounded-2xl p-3 text-center border border-white/5">
              <p className={`text-sm font-black ${macro.color}`}>{macro.val}</p>
              <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-1">{macro.label}</p>
            </div>
          ))}
        </div>

        {currentMeal.ingredients && (
          <div className="flex flex-wrap gap-2 mb-8">
            {(Array.isArray(currentMeal.ingredients) ? currentMeal.ingredients : [currentMeal.ingredients]).map((ing, i) => (
              <span key={i} className="bg-white/5 text-gray-400 px-3 py-1 rounded-full text-[10px] font-bold border border-white/5">
                {ing}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">Reaction</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setIsLiked(!isLiked); setShowAlts(false); }}
              className={`p-2.5 rounded-xl border transition-all ${isLiked ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'}`}
            >
              <ThumbsUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => { setShowAlts(true); setIsLiked(false); }}
              className="p-2.5 rounded-xl border bg-white/5 border-white/10 text-gray-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-400 transition-all"
            >
              <ThumbsDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showAlts && (
            <MealAlternativeModal
              mealName={currentMeal.name}
              mealType={mealType}
              goal={user?.fitness_goal || 'maintenance'}
              onClose={() => setShowAlts(false)}
              onReplace={(newMeal) => {
                setCurrentMeal({ ...newMeal, isReplaced: true })
                setShowAlts(false)

                setShoppingList(prev => {
                  let items = [...prev]
                  const newIngs = Array.isArray(newMeal.ingredients) ? newMeal.ingredients : [newMeal.ingredients]
                  newIngs.forEach(ing => {
                    if (!ing) return
                    const existing = items.find(i => (i.ingredient || i.name || '').toLowerCase() === ing.toLowerCase())
                    if (existing) {
                      existing.count = (existing.count || existing.quantity || 1) + 1
                    } else {
                      items.push({ name: ing, count: 1 })
                    }
                  })
                  return items
                })

                toast.success('Meal replaced! Ingredients added to Cart 🛒')
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#0d0d14] pt-16 flex items-center justify-center">
          <div className="text-white text-xl">Loading nutrition plan...</div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0d0d14] pt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
                Nutrition <span className="text-orange-500">Fuel</span> 🥗
              </h1>
              <p className="text-gray-400 text-lg font-medium">Smart Indian meal planning for ultimate vitality.</p>
            </motion.div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCalendar}
                className="bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-2xl text-white font-bold text-sm tracking-wide transition-all flex items-center gap-2"
              >
                📅 Add Today's Plan to Calendar
              </button>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="btn-premium bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-600/20"
              >
                {generating ? 'Regenerating...' : '✨ Refresh My Fuel'}
              </button>
            </div>
          </div>

          {plan ? (
            <>
              {/* Tab Switcher */}
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'today', label: '🌅 Today' },
                  { id: 'week', label: '📅 This Week' },
                  { id: 'shopping', label: '🛒 Shopping List' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-3 rounded-xl font-medium transition ${activeTab === tab.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-[#1a1a2e] border border-[#2a2a40] text-gray-400 hover:text-white'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TODAY TAB */}
              {activeTab === 'today' && todayMeals && (
                <div className="space-y-12">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-orange-600/20 to-red-600/20 rounded-[3rem] p-12 border border-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-8"
                  >
                    <div>
                      <span className="bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Daily Roadmap</span>
                      <h2 className="text-4xl font-black text-white">{todayName}'s Distribution</h2>
                      <p className="text-gray-400 mt-2 font-medium">Optimal fueling for your body's specific metabolic demands.</p>
                    </div>
                    <div className="text-center md:text-right">
                      <p className="text-5xl font-black text-white">{todayMeals.total_calories || '~1800'}</p>
                      <p className="text-orange-500 font-black uppercase tracking-widest text-xs mt-1">Total Target Cal</p>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <MealCard mealType="Breakfast" meal={todayMeals.breakfast} />
                    <MealCard mealType="Lunch" meal={todayMeals.lunch} />
                    <MealCard mealType="Dinner" meal={todayMeals.dinner} />
                    {todayMeals.snacks && (
                      <motion.div
                        whileHover={{ y: -5 }}
                        className={`glass rounded-[2.5rem] p-8 border ${mealColors.Snacks.bg} ${mealColors.Snacks.border}`}
                      >
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-14 h-14 rounded-2xl bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center text-2xl">🍎</div>
                          <h3 className="text-xl font-black uppercase tracking-widest text-green-400">Light Fueling</h3>
                        </div>
                        <div className="space-y-4">
                          {todayMeals.snacks.map((snack, i) => (
                            <div key={i} className="flex justify-between items-center bg-black/40 rounded-[1.5rem] p-5 border border-white/5">
                              <span className="text-white font-black">{snack.name}</span>
                              <span className="bg-green-500/10 text-green-400 px-4 py-1 rounded-full text-[10px] font-black">{snack.calories} CAL</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'today' && !todayMeals && (
                <div className="text-center py-12 bg-[#1a1a2e] border border-[#2a2a40] rounded-xl">
                  <p className="text-gray-400">Today's meal data not available.</p>
                </div>
              )}

              {/* WEEK TAB */}
              {activeTab === 'week' && (
                <div className="space-y-6">
                  {days.map((day, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="glass rounded-[2rem] overflow-hidden border border-white/5 bg-white/[0.02]"
                    >
                      <button
                        onClick={() => setExpandedDay(expandedDay === idx ? null : idx)}
                        className="w-full p-8 flex items-center justify-between text-left group"
                      >
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${expandedDay === idx ? 'bg-orange-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors uppercase tracking-tight">{day.day}</span>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Full Day Schedule</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-orange-500 font-black italic">{day.total_calories} <span className="text-[10px] opacity-50 uppercase tracking-widest not-italic">cal</span></span>
                          <div className={`w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300 ${expandedDay === idx ? 'rotate-180' : ''}`}>
                            <ExternalLink className="w-4 h-4 text-gray-600" />
                          </div>
                        </div>
                      </button>

                      {expandedDay === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="px-8 pb-8 border-t border-white/5 pt-8"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MealCard mealType="Breakfast" meal={day.breakfast} />
                            <MealCard mealType="Lunch" meal={day.lunch} />
                            <MealCard mealType="Dinner" meal={day.dinner} />
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* SHOPPING LIST TAB */}
              {activeTab === 'shopping' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="glass bg-[#0D1520] border border-white/5 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <ShoppingCart className="w-32 h-32 text-orange-500" />
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12 relative z-10">
                    <div>
                      <h2 className="text-3xl font-black text-white flex items-center gap-4">
                        Weekly Inventory
                      </h2>
                      <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">Essential items for your metabolic success</p>
                    </div>

                    <button className="bg-white/5 border border-white/10 px-8 py-4 rounded-2xl text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center gap-3">
                      <Check className="w-4 h-4" /> Share List
                    </button>
                  </div>

                  {shoppingList.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                      {shoppingList.map((item, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          className="bg-white/[0.02] hover:bg-white/[0.05] rounded-[2rem] p-6 flex items-center justify-between border border-white/5 group transition-all"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-orange-600/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                              <Check className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                              <span className="text-white font-black text-sm uppercase tracking-tight">{item.ingredient || item.name}</span>
                              <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mt-0.5">Quantity: ×{item.count || item.quantity || 1}</p>
                            </div>
                          </div>
                          <a
                            href={`https://www.bigbasket.com/ps/?q=${encodeURIComponent(item.ingredient || item.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-600/10 hover:bg-orange-600 text-orange-500 hover:text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                          >
                            Order 🛒
                          </a>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                      <p className="text-gray-700 font-black uppercase tracking-widest text-sm">Inventory Empty</p>
                      <p className="text-gray-800 text-xs mt-2 font-bold">Generate a roadmap to populate your supply chain.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🥗</div>
              <h2 className="text-2xl font-bold text-white mb-2">No Nutrition Plan Yet</h2>
              <p className="text-gray-400 mb-6">Generate your first personalized Indian meal plan</p>
              <button
                onClick={handleGeneratePlan}
                disabled={generating}
                className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {generating ? 'Generating...' : '✨ Generate Plan'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
