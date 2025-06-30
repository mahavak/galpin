'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import AchievementBadge from '@/components/ui/AchievementBadge'
import { Trophy, Award, Star, Target, Zap, Heart } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Achievement {
  id: string
  title: string
  description: string
  icon: 'trophy' | 'award' | 'star' | 'target' | 'zap' | 'heart'
  category: string
  earned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
}

const categoryIcons = {
  training: '🏋️',
  sleep: '😴',
  recovery: '🔋',
  consistency: '📈',
  milestones: '🎯'
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    earned: 0,
    inProgress: 0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all achievement definitions with user progress
      const { data: achievementsData } = await supabase
        .from('achievement_definitions')
        .select(`
          id,
          title,
          description,
          icon,
          category,
          max_progress,
          user_achievements!left (
            progress,
            earned,
            earned_date
          )
        `)
        .eq('active', true)
        .order('category', { ascending: true })

      // Create sample achievements for now
      const formattedAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Workout',
          description: 'Complete your first training session',
          icon: 'zap',
          category: 'training',
          earned: true,
          earnedDate: new Date().toISOString(),
          progress: 1,
          maxProgress: 1
        },
        {
          id: '2',
          title: 'Sleep Tracker',
          description: 'Log your first sleep session',
          icon: 'heart',
          category: 'sleep',
          earned: false,
          progress: 0,
          maxProgress: 1
        },
        {
          id: '3',
          title: 'Week Warrior',
          description: 'Complete 7 training sessions in one week',
          icon: 'trophy',
          category: 'training',
          earned: false,
          progress: 3,
          maxProgress: 7
        },
        {
          id: '4',
          title: 'Recovery Pro',
          description: 'Complete 50 recovery activities',
          icon: 'star',
          category: 'recovery',
          earned: false,
          progress: 12,
          maxProgress: 50
        },
        {
          id: '5',
          title: 'Consistency King',
          description: 'Log data for 30 consecutive days',
          icon: 'target',
          category: 'consistency',
          earned: false,
          progress: 8,
          maxProgress: 30
        },
        {
          id: '6',
          title: 'Goal Getter',
          description: 'Set your first performance goal',
          icon: 'award',
          category: 'milestones',
          earned: true,
          earnedDate: new Date().toISOString(),
          progress: 1,
          maxProgress: 1
        }
      ]

      setAchievements(formattedAchievements)

      // Calculate stats
      const total = formattedAchievements.length
      const earned = formattedAchievements.filter(a => a.earned).length
      const inProgress = formattedAchievements.filter(a => !a.earned && (a.progress || 0) > 0).length

      setStats({ total, earned, inProgress })
    } catch (error) {
      console.error('Error fetching achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory)

  const categories = [
    { id: 'all', label: 'All Achievements', icon: '🏆' },
    { id: 'training', label: 'Training', icon: '🏋️' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'recovery', label: 'Recovery', icon: '🔋' },
    { id: 'consistency', label: 'Consistency', icon: '📈' },
    { id: 'milestones', label: 'Milestones', icon: '🎯' }
  ]

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading achievements...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Achievements</h1>
        <p className="text-gray-300">Track your performance optimization milestones</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Earned</h3>
              <p className="text-3xl font-bold">{stats.earned}</p>
              <p className="text-sm opacity-80">Achievements unlocked</p>
            </div>
            <Trophy className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">In Progress</h3>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
              <p className="text-sm opacity-80">Partially completed</p>
            </div>
            <Target className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Total</h3>
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm opacity-80">Available achievements</p>
            </div>
            <Star className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-white font-semibold">Overall Progress</h3>
          <span className="text-white font-bold">
            {stats.total > 0 ? Math.round((stats.earned / stats.total) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div 
            className="h-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-1000"
            style={{ width: `${stats.total > 0 ? (stats.earned / stats.total) * 100 : 0}%` }}
          />
        </div>
        <p className="text-gray-400 text-sm mt-2">
          {stats.earned} of {stats.total} achievements earned
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-white font-semibold mb-4">Filter by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-3 rounded-lg border transition-all ${
                selectedCategory === category.id
                  ? 'border-purple-500 bg-purple-500/20'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{category.icon}</div>
                <div className="text-xs text-white">{category.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-white font-semibold">
            {selectedCategory === 'all' ? 'All Achievements' : 
             categories.find(c => c.id === selectedCategory)?.label}
          </h3>
          <span className="text-gray-400 text-sm">
            {filteredAchievements.length} achievement{filteredAchievements.length !== 1 ? 's' : ''}
          </span>
        </div>

        {filteredAchievements.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No achievements in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAchievements
              .sort((a, b) => {
                // Sort by: earned first, then by progress, then alphabetically
                if (a.earned !== b.earned) return a.earned ? -1 : 1
                if ((a.progress || 0) !== (b.progress || 0)) return (b.progress || 0) - (a.progress || 0)
                return a.title.localeCompare(b.title)
              })
              .map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  id={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  earned={achievement.earned}
                  earnedDate={achievement.earnedDate}
                  progress={achievement.progress}
                  maxProgress={achievement.maxProgress}
                />
              ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-lg rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-white font-semibold mb-3 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Achievement Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-200">
          <div>
            <p className="font-medium mb-1">🎯 Stay Consistent</p>
            <p>Daily logging helps unlock consistency achievements faster</p>
          </div>
          <div>
            <p className="font-medium mb-1">📈 Track Everything</p>
            <p>The more data you log, the more achievements you'll unlock</p>
          </div>
          <div>
            <p className="font-medium mb-1">💤 Prioritize Sleep</p>
            <p>Quality sleep unlocks many performance-related achievements</p>
          </div>
          <div>
            <p className="font-medium mb-1">🏆 Set Goals</p>
            <p>Use the goals section to work towards specific milestones</p>
          </div>
        </div>
      </div>
    </div>
  )
}