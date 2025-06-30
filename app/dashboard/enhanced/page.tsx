'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import LineChart from '@/components/charts/LineChart'
import ProgressRing from '@/components/charts/ProgressRing'
import AchievementBadge from '@/components/ui/AchievementBadge'
import OnboardingFlow from '@/components/onboarding/OnboardingFlow'
import ProgressPhotos from '@/components/photography/ProgressPhotos'

export const dynamic = 'force-dynamic'

interface DashboardStats {
  weeklyTraining: number
  avgSleepQuality: number
  activeSupplements: number
  lastSleepDuration: number | null
  lastTrainingType: string | null
  avgReadiness: number
  lastCarbTiming: number | null
}

interface ChartData {
  sleepTrend: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill: boolean
      tension: number
    }[]
  }
  trainingVolume: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      fill: boolean
      tension: number
    }[]
  }
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: 'trophy' | 'award' | 'star' | 'target' | 'zap' | 'heart'
  earned: boolean
  earnedDate?: string
  progress?: number
  maxProgress?: number
}

export default function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    weeklyTraining: 0,
    avgSleepQuality: 0,
    activeSupplements: 0,
    lastSleepDuration: null,
    lastTrainingType: null,
    avgReadiness: 0,
    lastCarbTiming: null
  })
  const [chartData, setChartData] = useState<ChartData>({
    sleepTrend: {
      labels: [],
      datasets: []
    },
    trainingVolume: {
      labels: [],
      datasets: []
    }
  })
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showProgressPhotos, setShowProgressPhotos] = useState(false)
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  useEffect(() => {
    checkUserOnboarding()
    fetchDashboardData()
    fetchChartData()
    fetchAchievements()
  }, [])

  const checkUserOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const { data: onboardingData } = await supabase
        .from('user_onboarding')
        .select('onboarding_completed')
        .eq('user_id', user.id)
        .single()

      if (!onboardingData?.onboarding_completed) {
        setShowOnboarding(true)
      }
    } catch (error) {
      console.error('Error checking onboarding:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const today = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(today.getDate() - 7)

      // Fetch data (same as original dashboard)
      const { data: trainingSessions } = await supabase
        .from('training_sessions')
        .select('type')
        .eq('user_id', user.id)
        .gte('session_date', weekAgo.toISOString().split('T')[0])

      const { data: sleepRecords } = await supabase
        .from('sleep_records')
        .select('quality_score, duration_hours')
        .eq('user_id', user.id)
        .order('sleep_date', { ascending: false })
        .limit(7)

      const { data: userSupplements } = await supabase
        .from('user_supplements')
        .select('id')
        .eq('user_id', user.id)
        .is('end_date', null)

      const { data: recoverySessions } = await supabase
        .from('recovery_sessions')
        .select('next_session_readiness, post_workout_carb_timing_minutes')
        .eq('user_id', user.id)
        .order('recovery_date', { ascending: false })
        .limit(7)

      // Calculate stats
      const weeklyTraining = trainingSessions?.length || 0
      const avgSleepQuality = sleepRecords?.length 
        ? Math.round(sleepRecords.reduce((sum, record) => sum + (record.quality_score || 0), 0) / sleepRecords.length * 10) / 10
        : 0
      const activeSupplements = userSupplements?.length || 0
      const lastSleepDuration = sleepRecords?.[0]?.duration_hours || null
      const lastTrainingType = trainingSessions?.[trainingSessions.length - 1]?.type || null
      const avgReadiness = recoverySessions?.length 
        ? Math.round(recoverySessions.reduce((sum, session) => sum + (session.next_session_readiness || 0), 0) / recoverySessions.length * 10) / 10
        : 0
      const lastCarbTiming = recoverySessions?.[0]?.post_workout_carb_timing_minutes || null

      setStats({
        weeklyTraining,
        avgSleepQuality,
        activeSupplements,
        lastSleepDuration,
        lastTrainingType,
        avgReadiness,
        lastCarbTiming
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Fetch sleep trend data
      const { data: sleepData } = await supabase
        .from('sleep_records')
        .select('sleep_date, quality_score, duration_hours')
        .eq('user_id', user.id)
        .gte('sleep_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('sleep_date', { ascending: true })

      // Fetch training volume data
      const { data: trainingData } = await supabase
        .from('training_sessions')
        .select('session_date, type')
        .eq('user_id', user.id)
        .gte('session_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('session_date', { ascending: true })

      // Process sleep chart data
      const sleepLabels = sleepData?.map(record => 
        new Date(record.sleep_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      ) || []
      
      const sleepQualityData = sleepData?.map(record => record.quality_score) || []
      const sleepDurationData = sleepData?.map(record => record.duration_hours) || []

      // Process training volume data (sessions per week)
      const trainingByWeek: { [key: string]: number } = {}
      trainingData?.forEach(session => {
        const weekStart = new Date(session.session_date)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        const weekKey = weekStart.toISOString().split('T')[0]
        trainingByWeek[weekKey] = (trainingByWeek[weekKey] || 0) + 1
      })

      const trainingLabels = Object.keys(trainingByWeek).map(week => 
        new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      )
      const trainingVolumeData = Object.values(trainingByWeek)

      setChartData({
        sleepTrend: {
          labels: sleepLabels,
          datasets: [
            {
              label: 'Sleep Quality',
              data: sleepQualityData,
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Sleep Duration (hrs)',
              data: sleepDurationData,
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        },
        trainingVolume: {
          labels: trainingLabels,
          datasets: [
            {
              label: 'Sessions per Week',
              data: trainingVolumeData,
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              fill: true,
              tension: 0.4
            }
          ]
        }
      })
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch user achievements with definitions
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          id,
          progress,
          earned,
          earned_date,
          achievement_definitions (
            title,
            description,
            icon,
            max_progress
          )
        `)
        .eq('user_id', user.id)
        .limit(6)

      // Create some sample achievements for now
      const formattedAchievements: Achievement[] = [
        {
          id: '1',
          title: 'First Workout',
          description: 'Complete your first training session',
          icon: 'zap',
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
          earned: false,
          progress: 0,
          maxProgress: 1
        },
        {
          id: '3',
          title: 'Week Warrior',
          description: 'Complete 7 training sessions in one week',
          icon: 'trophy',
          earned: false,
          progress: stats.weeklyTraining,
          maxProgress: 7
        }
      ]

      setAchievements(formattedAchievements)
    } catch (error) {
      console.error('Error fetching achievements:', error)
    }
  }

  const handleOnboardingComplete = async (onboardingData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('user_onboarding')
        .upsert({
          user_id: user.id,
          goals: onboardingData.goals,
          sleep_goal: onboardingData.sleepGoal,
          wake_time: onboardingData.wakeTime,
          bed_time: onboardingData.bedTime,
          preferred_supplements: onboardingData.supplements,
          notifications_enabled: onboardingData.notifications,
          onboarding_completed: true,
          completed_at: new Date().toISOString()
        })

      setShowOnboarding(false)
    } catch (error) {
      console.error('Error saving onboarding data:', error)
    }
  }

  const performanceScore = stats.avgSleepQuality > 0 && stats.weeklyTraining > 0 
    ? Math.round((stats.avgSleepQuality + (stats.weeklyTraining / 7 * 10) + stats.avgReadiness) / 3)
    : 0

  const sleepGoalProgress = stats.lastSleepDuration ? Math.min((stats.lastSleepDuration / 8) * 100, 100) : 0
  const trainingGoalProgress = Math.min((stats.weeklyTraining / 5) * 100, 100)

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-white">Loading enhanced dashboard...</div>
  }

  return (
    <div className="space-y-8">
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow
          onComplete={handleOnboardingComplete}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Enhanced Dashboard</h1>
          <p className="text-gray-300">Your complete performance optimization overview</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowProgressPhotos(!showProgressPhotos)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            📷 Progress Photos
          </button>
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Progress Rings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ProgressRing
          progress={performanceScore}
          title="Performance Score"
          value={`${performanceScore}/100`}
          color="#8b5cf6"
        />
        <ProgressRing
          progress={sleepGoalProgress}
          title="Sleep Goal"
          value={stats.lastSleepDuration ? `${stats.lastSleepDuration}h` : '--'}
          color="#06b6d4"
        />
        <ProgressRing
          progress={trainingGoalProgress}
          title="Training Goal"
          value={`${stats.weeklyTraining}/5 sessions`}
          color="#10b981"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LineChart
          data={chartData.sleepTrend}
          title="Sleep Trends (30 Days)"
          height={300}
        />
        <LineChart
          data={chartData.trainingVolume}
          title="Training Volume (Weekly)"
          height={300}
        />
      </div>

      {/* Achievements Section */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Recent Achievements</h2>
          <Link href="/dashboard/achievements" className="text-purple-400 hover:text-purple-300">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.slice(0, 6).map((achievement) => (
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
      </div>

      {/* Progress Photos Section */}
      {showProgressPhotos && (
        <ProgressPhotos userId={userId} />
      )}

      {/* Original Stats Grid (Compact) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Weekly Training</h3>
          <p className="text-2xl font-bold text-white">{stats.weeklyTraining}</p>
          <p className="text-xs text-gray-400">sessions</p>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Sleep Quality</h3>
          <p className="text-2xl font-bold text-white">
            {stats.avgSleepQuality > 0 ? stats.avgSleepQuality : '--'}
          </p>
          <p className="text-xs text-gray-400">avg /10</p>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Supplements</h3>
          <p className="text-2xl font-bold text-white">{stats.activeSupplements}</p>
          <p className="text-xs text-gray-400">active</p>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Readiness</h3>
          <p className="text-2xl font-bold text-white">
            {stats.avgReadiness > 0 ? stats.avgReadiness : '--'}
          </p>
          <p className="text-xs text-gray-400">avg /10</p>
        </div>
        <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700/50">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Last Sleep</h3>
          <p className="text-2xl font-bold text-white">
            {stats.lastSleepDuration ? `${stats.lastSleepDuration}h` : '--'}
          </p>
          <p className="text-xs text-gray-400">duration</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-900/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link 
            href="/dashboard/training"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            🏋️ Log Training
          </Link>
          <Link 
            href="/dashboard/sleep"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            😴 Record Sleep
          </Link>
          <Link 
            href="/dashboard/recovery"
            className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            🔋 Log Recovery
          </Link>
          <Link 
            href="/dashboard/supplements"
            className="flex items-center justify-center px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
          >
            💊 Add Supplement
          </Link>
        </div>
      </div>

      {/* Dr. Galpin Quote */}
      <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-lg rounded-xl p-6 border border-purple-500/30">
        <blockquote className="text-lg italic text-white mb-3">
          "The best program is the one you can adhere to consistently over time."
        </blockquote>
        <cite className="text-sm text-purple-200">— Dr. Andy Galpin</cite>
      </div>
    </div>
  )
}