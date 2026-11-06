import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { playPop, playSuccess, playClaimReward } from '../utils/soundEffects';
import { triggerConfetti, triggerSuperConfetti } from '../utils/confetti';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const emptyDay = () => ({ reps: 0, calories: 0, meals: 0, workouts: 0, durationSec: 0, exercises: 0 });

const useWellnessStore = create(
    persist(
        (set, get) => ({
            // User gamification state
            userXp: 520,
            streakDays: 4,
            todayWebcamReps: 0,
            claimedMilestones: ['first_step'], // IDs of claimed milestones
            
            // Meals completed mapping: { "YYYY-MM-DD": { breakfast: true, lunch: false, ... } }
            completedMealsByDate: {
                // Pre-populate today with a default sample if empty
            },

            // Stored meal macro details for recalculations: { "YYYY-MM-DD": { breakfast: { calories: 320, protein: 12, ... } } }
            mealDetailsByDate: {},

            // Gamification activities
            scratchStateByDate: {},
            wheelStateByDate: {},
            dailyActivity: {},
            workoutLog: [],

            // Helper to get today's meal completion map
            getTodayCompletedMeals: () => {
                const today = getTodayKey();
                return get().completedMealsByDate[today] || {};
            },

            // Check if a specific meal is completed today
            isMealCompleted: (mealType, dateStr = getTodayKey()) => {
                const dayMeals = get().completedMealsByDate[dateStr] || {};
                return Boolean(dayMeals[mealType]);
            },

            // Optimistic Toggle meal completion
            toggleMeal: (mealType, mealInfo = {}, dateStr = getTodayKey()) => {
                const currentMeals = get().completedMealsByDate[dateStr] || {};
                const currentDetails = get().mealDetailsByDate[dateStr] || {};
                const isNowCompleted = !currentMeals[mealType];

                const updatedMeals = {
                    ...currentMeals,
                    [mealType]: isNowCompleted,
                };

                // Store or update nutritional metrics of this meal
                const updatedDetails = {
                    ...currentDetails,
                    [mealType]: {
                        calories: Number(mealInfo.calories) || (mealType === 'breakfast' ? 320 : mealType === 'lunch' ? 450 : mealType === 'dinner' ? 400 : 150),
                        protein: Number(mealInfo.protein_g || mealInfo.protein) || (mealType === 'breakfast' ? 14 : mealType === 'lunch' ? 22 : mealType === 'dinner' ? 25 : 6),
                        carbs: Number(mealInfo.carbs_g || mealInfo.carbs) || (mealType === 'breakfast' ? 45 : mealType === 'lunch' ? 60 : mealType === 'dinner' ? 40 : 18),
                        fat: Number(mealInfo.fat_g || mealInfo.fat) || (mealType === 'breakfast' ? 8 : mealType === 'lunch' ? 12 : mealType === 'dinner' ? 10 : 4),
                        name: mealInfo.name || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Meal`,
                    }
                };

                if (isNowCompleted) {
                    playSuccess();
                    triggerConfetti({ x: 0.8, y: 0.4 });
                    const today = dateStr;
                    set((state) => {
                        const activity = state.dailyActivity || {};
                        const day = activity[today] || emptyDay();
                        return {
                            userXp: state.userXp + 25,
                            completedMealsByDate: {
                                ...state.completedMealsByDate,
                                [dateStr]: updatedMeals,
                            },
                            mealDetailsByDate: {
                                ...state.mealDetailsByDate,
                                [dateStr]: updatedDetails,
                            },
                            dailyActivity: {
                                ...activity,
                                [today]: { ...day, meals: day.meals + 1 },
                            },
                        };
                    });
                } else {
                    playPop();
                    set((state) => ({
                        completedMealsByDate: {
                            ...state.completedMealsByDate,
                            [dateStr]: updatedMeals,
                        },
                        mealDetailsByDate: {
                            ...state.mealDetailsByDate,
                            [dateStr]: updatedDetails,
                        }
                    }));
                }

                return isNowCompleted;
            },

            // Dynamic Macro Aggregator for today or any given date
            getDynamicDailyMacros: (targetConfig = {}, dateStr = getTodayKey()) => {
                const dayMeals = get().completedMealsByDate[dateStr] || {};
                const dayDetails = get().mealDetailsByDate[dateStr] || {};

                const targets = {
                    calories: targetConfig.calories || 2000,
                    protein: targetConfig.protein || 75,
                    carbs: targetConfig.carbs || 250,
                    fat: targetConfig.fat || 55,
                };

                let consumed = {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                };

                // Sum up only active/checked meals
                Object.keys(dayMeals).forEach((mealType) => {
                    if (dayMeals[mealType]) {
                        const m = dayDetails[mealType] || {
                            calories: mealType === 'breakfast' ? 320 : mealType === 'lunch' ? 450 : mealType === 'dinner' ? 400 : 150,
                            protein: mealType === 'breakfast' ? 14 : mealType === 'lunch' ? 22 : mealType === 'dinner' ? 25 : 6,
                            carbs: mealType === 'breakfast' ? 45 : mealType === 'lunch' ? 60 : mealType === 'dinner' ? 40 : 18,
                            fat: mealType === 'breakfast' ? 8 : mealType === 'lunch' ? 12 : mealType === 'dinner' ? 10 : 4,
                        };
                        consumed.calories += Number(m.calories) || 0;
                        consumed.protein += Number(m.protein) || 0;
                        consumed.carbs += Number(m.carbs) || 0;
                        consumed.fat += Number(m.fat) || 0;
                    }
                });

                const completedCount = Object.values(dayMeals).filter(Boolean).length;

                return {
                    targets,
                    consumed,
                    remaining: {
                        calories: Math.max(0, targets.calories - consumed.calories),
                        protein: Math.max(0, targets.protein - consumed.protein),
                        carbs: Math.max(0, targets.carbs - consumed.carbs),
                        fat: Math.max(0, targets.fat - consumed.fat),
                    },
                    percentages: {
                        calories: Math.min(100, Math.round((consumed.calories / targets.calories) * 100)),
                        protein: Math.min(100, Math.round((consumed.protein / targets.protein) * 100)),
                        carbs: Math.min(100, Math.round((consumed.carbs / targets.carbs) * 100)),
                        fat: Math.min(100, Math.round((consumed.fat / targets.fat) * 100)),
                    },
                    completedCount,
                };
            },

            // Claim milestone reward
            claimMilestone: (milestoneId, pointsAward = 100) => {
                const currentClaimed = get().claimedMilestones;
                if (currentClaimed.includes(milestoneId)) {
                    return false;
                }

                playClaimReward();
                triggerSuperConfetti();

                set((state) => ({
                    userXp: state.userXp + pointsAward,
                    claimedMilestones: [...state.claimedMilestones, milestoneId],
                }));

                return true;
            },

            // Scratch Card scratch completion
            revealScratchCard: (prizeXp = 150, dateStr = getTodayKey()) => {
                const current = get().scratchStateByDate[dateStr];
                if (current?.revealed) return;

                playClaimReward();
                triggerSuperConfetti();

                set((state) => ({
                    userXp: state.userXp + prizeXp,
                    scratchStateByDate: {
                        ...state.scratchStateByDate,
                        [dateStr]: { revealed: true, prizeXp, revealedAt: new Date().toISOString() }
                    }
                }));
            },

            // Spin Wellness Wheel
            recordWheelSpin: (prizeLabel, prizeXp = 100, dateStr = getTodayKey()) => {
                playClaimReward();
                triggerConfetti();

                set((state) => ({
                    userXp: state.userXp + prizeXp,
                    wheelStateByDate: {
                        ...state.wheelStateByDate,
                        [dateStr]: { spun: true, prizeLabel, prizeXp, spunAt: new Date().toISOString() }
                    }
                }));
            },

            // Record webcam workout reps
            addWebcamReps: (count = 1, caloriesBurned = 0.5) => {
                const today = getTodayKey();
                set((state) => {
                    const activity = state.dailyActivity || {};
                    const day = activity[today] || emptyDay();
                    return {
                        todayWebcamReps: state.todayWebcamReps + count,
                        userXp: state.userXp + 5,
                        dailyActivity: {
                            ...activity,
                            [today]: {
                                ...day,
                                reps: day.reps + count,
                                calories: day.calories + caloriesBurned * count,
                            },
                        },
                    };
                });
            },

            recordCompletedExercise: ({ name = 'Workout', reps = 0, durationSec = 0 } = {}) => {
                const today = getTodayKey();
                const entry = {
                    name,
                    reps,
                    duration: Math.max(1, Math.round(durationSec / 60)),
                    calories_burned: Math.max(8, Math.round(reps * 0.5)),
                    date: today,
                };
                set((state) => {
                    const activity = state.dailyActivity || {};
                    const day = activity[today] || emptyDay();
                    return {
                        workoutLog: [entry, ...(state.workoutLog || [])].slice(0, 30),
                        dailyActivity: {
                            ...activity,
                            [today]: {
                                ...day,
                                workouts: day.workouts + 1,
                                exercises: day.exercises + 1,
                                durationSec: day.durationSec + durationSec,
                                calories: day.calories,
                            },
                        },
                    };
                });
            },

            // Reset or calibrate daily stats
            resetDailyStats: () => {
                const today = getTodayKey();
                set((state) => ({
                    completedMealsByDate: { ...state.completedMealsByDate, [today]: {} },
                    todayWebcamReps: 0,
                }));
            }
        }),
        {
            name: 'arogyamitra-wellness-state',
        }
    )
);

export default useWellnessStore;
