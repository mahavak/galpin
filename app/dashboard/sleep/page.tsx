'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type SleepRecord = Database['public']['Tables']['sleep_records']['Row']

export default function SleepPage() {
  const [records, setRecords] = useState<SleepRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    sleep_date: new Date().toISOString().split('T')[0],
    bedtime: '22:00',
    wake_time: '06:00',
    quality_score: 7,
    room_temp_celsius: 20,
    co2_level: 800,
    deep_sleep_hours: 0,
    rem_sleep_hours: 0,
    awakenings: 0,
    notes: ''
  })

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('sleep_records')
        .select('*')
        .eq('user_id', user.id)
        .order('sleep_date', { ascending: false })
        .limit(7)

      if (error) throw error
      setRecords(data || [])
    } catch (error) {
      console.error('Error fetching sleep records:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateDuration = (bedtime: string, wakeTime: string) => {
    const bed = new Date(`2000-01-01T${bedtime}`)
    let wake = new Date(`2000-01-01T${wakeTime}`)
    
    // If wake time is before bedtime, it's the next day
    if (wake < bed) {
      wake = new Date(`2000-01-02T${wakeTime}`)
    }
    
    const diff = wake.getTime() - bed.getTime()
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10 // Hours with 1 decimal
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const duration = calculateDuration(formData.bedtime, formData.wake_time)

      const { error } = await supabase
        .from('sleep_records')
        .insert({
          user_id: user.id,
          ...formData,
          duration_hours: duration,
          bedtime: `${formData.sleep_date}T${formData.bedtime}:00`,
          wake_time: `${formData.sleep_date}T${formData.wake_time}:00`
        })

      if (error) throw error

      setShowForm(false)
      fetchRecords()
      // Reset form
      setFormData({
        sleep_date: new Date().toISOString().split('T')[0],
        bedtime: '22:00',
        wake_time: '06:00',
        quality_score: 7,
        room_temp_celsius: 20,
        co2_level: 800,
        deep_sleep_hours: 0,
        rem_sleep_hours: 0,
        awakenings: 0,
        notes: ''
      })
    } catch (error) {
      console.error('Error saving sleep record:', error)
    }
  }

  const getSleepRecommendation = () => {
    const recommendations = []
    
    if (formData.co2_level > 900) {
      recommendations.push({
        type: 'warning',
        message: 'CO2 levels above 900ppm can negatively impact sleep quality. Consider improving ventilation.'
      })
    }
    
    if (formData.room_temp_celsius > 21 || formData.room_temp_celsius < 16) {
      recommendations.push({
        type: 'info',
        message: 'Optimal room temperature for sleep is 16-21°C (60-70°F).'
      })
    }
    
    const duration = calculateDuration(formData.bedtime, formData.wake_time)
    if (duration < 7) {
      recommendations.push({
        type: 'warning',
        message: 'Dr. Galpin emphasizes that sleep is the most impactful factor for athletic performance. Aim for 7-9 hours.'
      })
    }
    
    return recommendations
  }

  const recommendations = getSleepRecommendation()
  const avgQuality = records.length > 0 
    ? Math.round(records.reduce((sum, r) => sum + (r.quality_score || 0), 0) / records.length * 10) / 10
    : 0

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sleep Tracking</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Log Sleep'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">7-Day Avg Quality</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{avgQuality || '--'} / 10</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Last Night</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {records[0]?.duration_hours || '--'} hours
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">CO2 Alert</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {records[0]?.co2_level && records[0].co2_level > 900 ? '⚠️ High' : '✅ Good'}
          </p>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Log Sleep Data</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.sleep_date}
                  onChange={(e) => setFormData({ ...formData, sleep_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bedtime
                </label>
                <input
                  type="time"
                  value={formData.bedtime}
                  onChange={(e) => setFormData({ ...formData, bedtime: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wake Time
                </label>
                <input
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sleep Quality (1-10)
              </label>
              <input
                type="range"
                value={formData.quality_score}
                onChange={(e) => setFormData({ ...formData, quality_score: parseInt(e.target.value) })}
                className="w-full"
                min="1"
                max="10"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Poor</span>
                <span className="font-medium">Quality: {formData.quality_score}</span>
                <span>Excellent</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Temperature (°C)
                </label>
                <input
                  type="number"
                  value={formData.room_temp_celsius}
                  onChange={(e) => setFormData({ ...formData, room_temp_celsius: parseFloat(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CO2 Level (ppm)
                </label>
                <input
                  type="number"
                  value={formData.co2_level}
                  onChange={(e) => setFormData({ ...formData, co2_level: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Leave blank if unknown"
                />
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className={`p-4 rounded-lg ${
                    rec.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-800'
                  }`}>
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deep Sleep (hours)
                </label>
                <input
                  type="number"
                  value={formData.deep_sleep_hours}
                  onChange={(e) => setFormData({ ...formData, deep_sleep_hours: parseFloat(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  REM Sleep (hours)
                </label>
                <input
                  type="number"
                  value={formData.rem_sleep_hours}
                  onChange={(e) => setFormData({ ...formData, rem_sleep_hours: parseFloat(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Awakenings
                </label>
                <input
                  type="number"
                  value={formData.awakenings}
                  onChange={(e) => setFormData({ ...formData, awakenings: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>
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
                placeholder="Any factors that affected sleep? Dreams? How you felt upon waking?"
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
                Save Sleep Data
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sleep History */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Sleep History (Last 7 Days)</h2>
        </div>
        <div className="divide-y">
          {records.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No sleep data recorded yet. Click "Log Sleep" to get started!
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {new Date(record.sleep_date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {record.duration_hours} hours | Quality: {record.quality_score}/10
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>🌡️ {record.room_temp_celsius}°C</span>
                      {record.co2_level && (
                        <span className={record.co2_level > 900 ? 'text-yellow-600' : ''}>
                          💨 {record.co2_level} ppm
                        </span>
                      )}
                      {record.awakenings !== null && (
                        <span>🔄 {record.awakenings} awakenings</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {record.bedtime ? new Date(record.bedtime).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : '--'} - {record.wake_time ? new Date(record.wake_time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      }) : '--'}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sleep Tips */}
      <div className="mt-8 bg-purple-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">Dr. Galpin's Sleep Optimization Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Keep CO2 levels below 900ppm - open windows or use ventilation
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Room temperature between 60-70°F (16-21°C) for optimal sleep
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Sleep is the #1 performance enhancer - prioritize 7-9 hours
          </li>
          <li className="flex items-start">
            <span className="text-purple-600 mr-2">•</span>
            Use sleep trackers for accountability, even if not 100% accurate
          </li>
        </ul>
      </div>
    </div>
  )
}