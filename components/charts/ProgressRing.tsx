'use client'

import { motion } from 'framer-motion'

interface ProgressRingProps {
  progress: number // 0-100
  size?: number
  strokeWidth?: number
  title: string
  value: string
  color?: string
}

export default function ProgressRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  title, 
  value,
  color = '#6366f1'
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">{Math.round(progress)}%</span>
          <span className="text-sm text-gray-400">{value}</span>
        </div>
      </div>
      <h3 className="text-white font-medium mt-4 text-center">{title}</h3>
    </div>
  )
}