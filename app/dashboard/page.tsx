'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

// Force dynamic rendering
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    weeklyTraining: 0,
    avgSleepQuality: 0,
    activeSupplements: 0,
    lastSleepDuration: null,
    lastTrainingType: null,
    avgReadiness: 0,
    lastCarbTiming: null
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date ranges
      const today = new Date()
      const weekAgo = new Date()
      weekAgo.setDate(today.getDate() - 7)

      // Fetch weekly training sessions
      const { data: trainingSessions } = await supabase
        .from('training_sessions')
        .select('type')
        .eq('user_id', user.id)
        .gte('session_date', weekAgo.toISOString().split('T')[0])

      // Fetch recent sleep records
      const { data: sleepRecords } = await supabase
        .from('sleep_records')
        .select('quality_score, duration_hours')
        .eq('user_id', user.id)
        .order('sleep_date', { ascending: false })
        .limit(7)

      // Fetch active supplements
      const { data: userSupplements } = await supabase
        .from('user_supplements')
        .select('id')
        .eq('user_id', user.id)
        .is('end_date', null)

      // Fetch recovery data
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

  const getRecommendations = () => {
    const recommendations = []

    // Sleep recommendations
    if (stats.avgSleepQuality > 0 && stats.avgSleepQuality < 6) {
      recommendations.push({
        type: 'warning',
        icon: '😴',
        title: 'Sleep Quality Alert',
        message: 'Your average sleep quality is below 6/10. Consider tracking CO2 levels and room temperature for better insights.'
      })
    } else if (stats.lastSleepDuration && stats.lastSleepDuration < 7) {
      recommendations.push({
        type: 'info',
        icon: '⏰',
        title: 'Sleep Duration',
        message: 'Dr. Galpin emphasizes sleep as the #1 performance factor. Aim for 7-9 hours nightly.'
      })
    }

    // Training recommendations
    if (stats.weeklyTraining === 0) {
      recommendations.push({
        type: 'info',
        icon: '🏋️',
        title: 'Training Consistency',
        message: 'No training sessions logged this week. Consistency is key for adaptation and progress.'
      })
    } else if (stats.weeklyTraining > 6) {
      recommendations.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Recovery Check',
        message: 'High training frequency detected. Ensure adequate recovery and sleep quality.'
      })
    }

    // Recovery recommendations
    if (stats.lastCarbTiming && stats.lastCarbTiming > 120) {
      recommendations.push({
        type: 'warning',
        icon: '🍌',
        title: 'Post-Workout Nutrition',
        message: 'Dr. Galpin emphasizes rapid carb replenishment. Your last session had carbs at ' + stats.lastCarbTiming + ' minutes post-workout. Aim for 30-60 minutes.'
      })
    }

    if (stats.avgReadiness > 0 && stats.avgReadiness < 6) {
      recommendations.push({
        type: 'warning',
        icon: '🔋',
        title: 'Low Readiness',
        message: 'Your average readiness score is low. Consider recovery modalities like tart cherry extract or cold therapy.'
      })
    }

    // Supplement recommendations
    if (stats.activeSupplements === 0) {
      recommendations.push({
        type: 'info',
        icon: '💊',
        title: 'Supplement Basics',
        message: 'Consider starting with the basics: Magnesium and Vitamin D are commonly deficient nutrients.'
      })
    }

    // Default recommendations if none triggered
    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        icon: '✅',
        title: 'Looking Good!',
        message: 'Your metrics are on track. Keep focusing on consistent training, quality sleep, and proper nutrition.'
      })
    }

    return recommendations
  }

  const recommendations = getRecommendations()

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Track your performance optimization journey</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh Data
        </button>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">This Week's Training</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.weeklyTraining} sessions
              </p>
              {stats.lastTrainingType && (
                <p className="text-xs text-gray-500 capitalize">Last: {stats.lastTrainingType}</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Sleep Quality</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgSleepQuality > 0 ? `${stats.avgSleepQuality} / 10` : '-- / 10'}
              </p>
              {stats.lastSleepDuration && (
                <p className="text-xs text-gray-500">Last: {stats.lastSleepDuration}h</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Supplements</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeSupplements}</p>
              <p className="text-xs text-gray-500">Currently taking</p>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 rounded-full p-3">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Avg Readiness</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgReadiness > 0 ? `${stats.avgReadiness} / 10` : '-- / 10'}
              </p>
              {stats.lastCarbTiming && (
                <p className="text-xs text-gray-500">Last carbs: {stats.lastCarbTiming}min</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/20">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Performance Score</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.avgSleepQuality > 0 && stats.weeklyTraining > 0 
                  ? Math.round((stats.avgSleepQuality + (stats.weeklyTraining / 7 * 10) + stats.avgReadiness) / 3)
                  : '--'
                }
              </p>
              <p className="text-xs text-gray-500">Sleep + Training + Recovery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link 
            href="/dashboard/training"
            className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-white bg-white/5 backdrop-blur-sm transform hover:scale-105"
          >
            <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log Training
          </Link>
          <Link 
            href="/dashboard/sleep"
            className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-white bg-white/5 backdrop-blur-sm transform hover:scale-105"
          >
            <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Record Sleep
          </Link>
          <Link 
            href="/dashboard/recovery"
            className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-white bg-white/5 backdrop-blur-sm transform hover:scale-105"
          >
            <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Log Recovery
          </Link>
          <Link 
            href="/dashboard/supplements"
            className="flex items-center justify-center px-4 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition-all text-white bg-white/5 backdrop-blur-sm transform hover:scale-105"
          >
            <svg className="h-5 w-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Supplement
          </Link>
        </div>
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.map((rec, index) => (
          <div key={index} className={`rounded-lg p-6 ${
            rec.type === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
            rec.type === 'success' ? 'bg-green-50 border border-green-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            <div className="flex items-start">
              <span className="text-2xl mr-3">{rec.icon}</span>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{rec.title}</h3>
                <p className="text-gray-700">{rec.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dr. Galpin Quote */}
      <div className="mt-8 bg-gray-900 text-white rounded-lg p-6">
        <blockquote className="text-lg italic mb-2">
          "Sleep is the most impactful factor for enhancing athletic performance, 
          outweighing any supplement or intervention."
        </blockquote>
        <cite className="text-sm text-gray-300">— Dr. Andy Galpin</cite>
      </div>
    </div>
  )
}