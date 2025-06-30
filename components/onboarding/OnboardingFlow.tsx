'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Target, Activity, Moon, Pill } from 'lucide-react'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: React.ReactNode
  component: React.ReactNode
}

interface OnboardingFlowProps {
  onComplete: (data: any) => void
  onSkip: () => void
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    goals: [] as string[],
    experience: '',
    sleepGoal: 8,
    wakeTime: '07:00',
    bedTime: '23:00',
    supplements: [] as string[],
    notifications: true,
  })

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Welcome to Galpin Performance Tracker",
      description: "Let's set up your personalized performance optimization journey based on Dr. Andy Galpin's research.",
      icon: <Target className="w-8 h-8" />,
      component: (
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Target className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Ready to optimize your performance?</h2>
          <p className="text-gray-300 mb-6">
            This quick setup will help us personalize your experience and provide 
            science-backed recommendations tailored to your goals.
          </p>
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-200 text-sm">
              💡 Based on Dr. Andy Galpin's research on human performance optimization
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "What are your primary goals?",
      description: "Select all that apply to help us customize your experience.",
      icon: <Activity className="w-8 h-8" />,
      component: (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">What are your primary goals?</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'strength', label: 'Build Strength', desc: 'Focus on power and muscle development' },
              { id: 'endurance', label: 'Improve Endurance', desc: 'Enhance cardiovascular fitness' },
              { id: 'recovery', label: 'Optimize Recovery', desc: 'Better sleep and recovery protocols' },
              { id: 'performance', label: 'Peak Performance', desc: 'Overall athletic optimization' },
              { id: 'health', label: 'General Health', desc: 'Wellness and longevity focus' },
            ].map((goal) => (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  formData.goals.includes(goal.id)
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => {
                  const newGoals = formData.goals.includes(goal.id)
                    ? formData.goals.filter(g => g !== goal.id)
                    : [...formData.goals, goal.id]
                  setFormData({ ...formData, goals: newGoals })
                }}
              >
                <h3 className="text-white font-semibold">{goal.label}</h3>
                <p className="text-gray-400 text-sm">{goal.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Sleep Optimization",
      description: "Sleep is the foundation of performance. Let's optimize yours.",
      icon: <Moon className="w-8 h-8" />,
      component: (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Sleep Optimization</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-white font-medium mb-2">
                Sleep Goal (hours per night)
              </label>
              <input
                type="range"
                min="6"
                max="10"
                step="0.5"
                value={formData.sleepGoal}
                onChange={(e) => setFormData({ ...formData, sleepGoal: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>6h</span>
                <span className="text-white font-bold">{formData.sleepGoal}h</span>
                <span>10h</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Preferred Wake Time</label>
                <input
                  type="time"
                  value={formData.wakeTime}
                  onChange={(e) => setFormData({ ...formData, wakeTime: e.target.value })}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Preferred Bed Time</label>
                <input
                  type="time"
                  value={formData.bedTime}
                  onChange={(e) => setFormData({ ...formData, bedTime: e.target.value })}
                  className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                💡 Dr. Galpin's research shows that consistency in sleep timing is more important than total duration for performance.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Supplement Preferences",
      description: "Select supplements you're interested in tracking.",
      icon: <Pill className="w-8 h-8" />,
      component: (
        <div>
          <h2 className="text-xl font-bold text-white mb-6">Supplement Preferences</h2>
          <p className="text-gray-400 mb-6">Select supplements you're currently taking or interested in:</p>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              'Creatine', 'Protein Powder', 'Magnesium', 'Vitamin D',
              'Omega-3', 'Caffeine', 'Melatonin', 'Tart Cherry',
              'Curcumin', 'Rhodiola', 'Glutamine', 'Beetroot Extract'
            ].map((supplement) => (
              <motion.div
                key={supplement}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  formData.supplements.includes(supplement)
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
                onClick={() => {
                  const newSupplements = formData.supplements.includes(supplement)
                    ? formData.supplements.filter(s => s !== supplement)
                    : [...formData.supplements, supplement]
                  setFormData({ ...formData, supplements: newSupplements })
                }}
              >
                <span className="text-white text-sm">{supplement}</span>
              </motion.div>
            ))}
          </div>

          <div className="mt-6">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                className="w-4 h-4 text-purple-500 bg-gray-800 border-gray-700 rounded focus:ring-purple-500"
              />
              <span className="text-white">Enable smart notifications and reminders</span>
            </label>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onComplete(formData)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">Getting Started</h1>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Skip for now
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2">
            <motion.div
              className="h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% complete</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={nextStep}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
          >
            <span>{isLastStep ? 'Complete Setup' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  )
}