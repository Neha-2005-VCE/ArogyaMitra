import React from 'react';
import { motion } from 'framer-motion';
import { Award, Flame, Clock, Zap, Target, TrendingUp, ChevronRight, Share2 } from 'lucide-react';

const WorkoutComplete = ({ stats, onKeepGoing }) => {
  const {
    calories = 0,
    sets = 0,
    minutes = 0,
    intensity = 0,
    achievements = [
      "Improved cardiovascular endurance",
      "Built muscle strength and tone",
      "Boosted metabolism for the day",
      "Enhanced energy levels",
      "Progressed towards your fitness goals"
    ]
  } = stats;

  const statItems = [
    { icon: <Flame className="w-6 h-6 text-orange-400" />, label: 'Calories Burned', value: calories, color: 'from-orange-500/20 to-orange-500/5', textColor: 'text-orange-400' },
    { icon: <Award className="w-6 h-6 text-green-400" />, label: 'Sets Completed', value: sets, color: 'from-green-500/20 to-green-500/5', textColor: 'text-green-400' },
    { icon: <Clock className="w-6 h-6 text-blue-400" />, label: 'Minutes Worked', value: minutes, color: 'from-blue-500/20 to-blue-500/5', textColor: 'text-blue-400' },
    { icon: <Zap className="w-6 h-6 text-purple-400" />, label: 'Average Intensity', value: `${intensity}%`, color: 'from-purple-500/20 to-purple-500/5', textColor: 'text-purple-400' },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-[#1a1a2e] border border-[#2a2a40] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative"
      >
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-[100px] pointer-events-none" />

        <div className="p-8 relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-block p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 mb-6 shadow-lg shadow-orange-500/20"
            >
              <Award className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-4xl font-bold text-white mb-2">Workout Complete!</h2>
            <p className="text-gray-400 text-lg">Amazing effort today! You crushed it! 💪</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            {statItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={`bg-gradient-to-br ${item.color} border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center`}
              >
                <div className="mb-3">{item.icon}</div>
                <div className={`text-3xl font-bold ${item.textColor} mb-1`}>{item.value}</div>
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">{item.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Achievements Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-[#0d0d14]/50 border border-white/5 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">What You Achieved Today</h3>
            </div>
            <ul className="space-y-3">
              {achievements.map((ach, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                  </div>
                  {ach}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onKeepGoing}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2 group"
            >
              Keep Going! 🚀
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <div className="flex gap-3">
              <button className="flex-1 py-3 bg-[#2a2a40] hover:bg-[#353550] text-gray-300 rounded-xl font-medium transition flex items-center justify-center gap-2">
                <Share2 className="w-4 h-4" /> Share Progress
              </button>
              <button className="flex-1 py-3 bg-[#2a2a40] hover:bg-[#353550] text-gray-300 rounded-xl font-medium transition flex items-center justify-center gap-2">
                <Target className="w-4 h-4" /> View Goal
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkoutComplete;
