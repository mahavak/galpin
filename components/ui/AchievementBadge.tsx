'use client'

import { motion } from 'framer-motion'
import { Trophy, Award, Star, Target, Zap, Heart } from 'lucide-react'

interface AchievementBadgeProps {
  id: string
  title: string
  description: string
  icon: 'trophy' | 'award' | 'star' | 'target' | 'zap' | 'heart'
  earned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
}

const iconComponents = {
  trophy: Trophy,
  award: Award,
  star: Star,
  target: Target,
  zap: Zap,
  heart: Heart,
}

const badgeColors = {
  trophy: 'from-yellow-500 to-orange-500',
  award: 'from-purple-500 to-pink-500',
  star: 'from-blue-500 to-cyan-500',
  target: 'from-green-500 to-emerald-500',
  zap: 'from-orange-500 to-red-500',
  heart: 'from-red-500 to-pink-500',
}

export default function AchievementBadge({
  id,
  title,
  description,
  icon,
  earned,
  earnedDate,
  progress = 0,
  maxProgress = 1,
}: AchievementBadgeProps) {
  const IconComponent = iconComponents[icon]
  const progressPercentage = maxProgress > 0 ? (progress / maxProgress) * 100 : 0

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`relative p-4 rounded-xl border transition-all duration-300 ${
        earned
          ? 'bg-gradient-to-br ' + badgeColors[icon] + ' border-white/20 shadow-lg'
          : 'bg-gray-900/50 border-gray-700/50 backdrop-blur-lg'
      }`}
    >
      {/* Glow effect for earned badges */}
      {earned && (
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${badgeColors[icon]} opacity-20 blur-xl`} />
      )}
      
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
          earned ? 'bg-white/20' : 'bg-gray-800'
        }`}>
          <IconComponent 
            className={`w-6 h-6 ${earned ? 'text-white' : 'text-gray-400'}`} 
          />
        </div>

        {/* Title and Description */}
        <h3 className={`font-semibold mb-1 ${earned ? 'text-white' : 'text-gray-300'}`}>
          {title}
        </h3>
        <p className={`text-sm mb-3 ${earned ? 'text-white/80' : 'text-gray-400'}`}>
          {description}
        </p>

        {/* Progress Bar (for unearned badges) */}
        {!earned && maxProgress > 1 && (
          <div className="mb-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}/{maxProgress}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <motion.div
                className={`h-2 rounded-full bg-gradient-to-r ${badgeColors[icon]}`}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Earned Date */}
        {earned && earnedDate && (
          <p className="text-xs text-white/60">
            Earned {new Date(earnedDate).toLocaleDateString()}
          </p>
        )}

        {/* Earned indicator */}
        {earned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
          >
            <span className="text-white text-xs">✓</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}