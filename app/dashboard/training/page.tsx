'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/database'
import { useLanguage } from '@/lib/language-context'

type TrainingSession = Database['public']['Tables']['training_sessions']['Row']

export default function TrainingPage() {
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()
  const { t } = useLanguage()

  // Form state
  const [formData, setFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_time: new Date().toTimeString().slice(0, 5),
    type: 'strength' as 'strength' | 'endurance' | 'mixed' | 'recovery',
    duration_minutes: 60,
    intensity_level: 5,
    fasted_state: false,
    pre_workout_meal: '',
    post_workout_meal: '',
    muscle_groups: [] as string[],
    notes: ''
  })

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('training_sessions')
        .insert({
          user_id: user.id,
          ...formData
        })

      if (error) throw error

      setShowForm(false)
      fetchSessions()
      // Reset form
      setFormData({
        session_date: new Date().toISOString().split('T')[0],
        session_time: new Date().toTimeString().slice(0, 5),
        type: 'strength',
        duration_minutes: 60,
        intensity_level: 5,
        fasted_state: false,
        pre_workout_meal: '',
        post_workout_meal: '',
        muscle_groups: [],
        notes: ''
      })
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const muscleGroupOptions = [
    'Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Full Body'
  ]

  const getTrainingRecommendation = () => {
    if (formData.type === 'strength' && formData.fasted_state) {
      return {
        type: 'warning',
        message: 'Dr. Galpin recommends avoiding fasted strength training. Consider having a small meal with carbs and protein 30-60 minutes before.'
      }
    }
    if (formData.type === 'endurance' && formData.duration_minutes <= 60 && formData.fasted_state) {
      return {
        type: 'info',
        message: 'Fasted endurance training under 60 minutes may enhance mitochondrial adaptations and fat oxidation.'
      }
    }
    if (formData.type === 'endurance' && formData.duration_minutes > 60) {
      return {
        type: 'info',
        message: 'For endurance over 60 minutes, consume 60-100g of fast-digesting carbs per hour during exercise.'
      }
    }
    return null
  }

  const recommendation = getTrainingRecommendation()

  if (loading) {
    return <div className="flex justify-center items-center h-64">{t('common.loading')}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('training.title')}</h1>
        <div className="flex space-x-3">
          <a 
            href="/dashboard/training/enhanced"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center"
          >
            <span className="mr-2">📝</span>
            {t('training.enhanced')}
          </a>
          <a 
            href="/dashboard/training/templates"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <span className="mr-2">📋</span>
            {t('training.templates')}
          </a>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? t('common.cancel') : t('training.logSession')}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">{t('training.logSession')}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.date')}
                </label>
                <input
                  type="date"
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.session_time}
                  onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="strength">Strength</option>
                  <option value="endurance">Endurance</option>
                  <option value="mixed">Mixed</option>
                  <option value="recovery">Recovery</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Intensity (1-10)
                </label>
                <input
                  type="range"
                  value={formData.intensity_level}
                  onChange={(e) => setFormData({ ...formData, intensity_level: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{formData.intensity_level}</div>
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.fasted_state}
                    onChange={(e) => setFormData({ ...formData, fasted_state: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Fasted Training</span>
                </label>
              </div>
            </div>

            {recommendation && (
              <div className={`p-4 rounded-lg ${
                recommendation.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'
              }`}>
                <p className="text-sm">{recommendation.message}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Muscle Groups
              </label>
              <div className="grid grid-cols-3 gap-2">
                {muscleGroupOptions.map((group) => (
                  <label key={group} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.muscle_groups.includes(group)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, muscle_groups: [...formData.muscle_groups, group] })
                        } else {
                          setFormData({ ...formData, muscle_groups: formData.muscle_groups.filter(g => g !== group) })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm">{group}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pre-workout Meal
              </label>
              <input
                type="text"
                value={formData.pre_workout_meal}
                onChange={(e) => setFormData({ ...formData, pre_workout_meal: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Banana and protein shake"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post-workout Meal
              </label>
              <input
                type="text"
                value={formData.post_workout_meal}
                onChange={(e) => setFormData({ ...formData, post_workout_meal: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Chicken, rice, and vegetables"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="How did you feel? Any PRs? Other observations..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Sessions</h2>
        </div>
        <div className="divide-y">
          {sessions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No training sessions logged yet. Click "Log New Session" to get started!
            </div>
          ) : (
            sessions.map((session) => (
              <div key={session.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium capitalize">{session.type} Training</span>
                      {session.fasted_state && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Fasted</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(session.session_date).toLocaleDateString()} at {session.session_time}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Duration: {session.duration_minutes} min | Intensity: {session.intensity_level}/10
                    </div>
                    {session.muscle_groups && session.muscle_groups.length > 0 && (
                      <div className="text-sm text-gray-600 mt-1">
                        Muscles: {session.muscle_groups.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}