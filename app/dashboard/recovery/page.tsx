'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface RecoverySession {
  id: string
  recovery_date: string
  post_workout_carb_intake_g: number | null
  post_workout_carb_timing_minutes: number | null
  carb_source: string | null
  muscle_soreness: number | null
  energy_levels: number | null
  mood_score: number | null
  sleep_quality_previous_night: number | null
  recovery_methods: string[] | null
  next_session_readiness: number | null
  notes: string | null
}

interface RecoveryModality {
  id: string
  session_date: string
  modality_type: string
  duration_minutes: number | null
  effectiveness: number | null
  timing_relative_to_workout: string | null
}

export default function RecoveryPage() {
  const [recoverySessions, setRecoverySessions] = useState<RecoverySession[]>([])
  const [modalities, setModalities] = useState<RecoveryModality[]>([])
  const [loading, setLoading] = useState(true)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showModalityForm, setShowModalityForm] = useState(false)
  const supabase = createClient()

  // Recovery session form state
  const [sessionFormData, setSessionFormData] = useState({
    recovery_date: new Date().toISOString().split('T')[0],
    post_workout_carb_intake_g: '',
    post_workout_carb_timing_minutes: 30,
    carb_source: '',
    muscle_soreness: 5,
    energy_levels: 5,
    mood_score: 5,
    sleep_quality_previous_night: 7,
    recovery_methods: [] as string[],
    next_session_readiness: 7,
    notes: ''
  })

  // Recovery modality form state
  const [modalityFormData, setModalityFormData] = useState({
    session_date: new Date().toISOString().split('T')[0],
    modality_type: 'stretching',
    duration_minutes: 15,
    effectiveness: 7,
    timing_relative_to_workout: 'immediately_after',
    specific_details: '',
    notes: ''
  })

  useEffect(() => {
    fetchRecoveryData()
  }, [])

  const fetchRecoveryData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch recovery sessions
      const { data: sessions } = await supabase
        .from('recovery_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('recovery_date', { ascending: false })
        .limit(7)

      // Fetch recovery modalities
      const { data: modalitiesData } = await supabase
        .from('recovery_modalities')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(10)

      setRecoverySessions(sessions || [])
      setModalities(modalitiesData || [])
    } catch (error) {
      console.error('Error fetching recovery data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('recovery_sessions')
        .insert({
          user_id: user.id,
          ...sessionFormData,
          post_workout_carb_intake_g: sessionFormData.post_workout_carb_intake_g 
            ? parseFloat(sessionFormData.post_workout_carb_intake_g) 
            : null
        })

      if (error) throw error

      setShowSessionForm(false)
      fetchRecoveryData()
      // Reset form
      setSessionFormData({
        recovery_date: new Date().toISOString().split('T')[0],
        post_workout_carb_intake_g: '',
        post_workout_carb_timing_minutes: 30,
        carb_source: '',
        muscle_soreness: 5,
        energy_levels: 5,
        mood_score: 5,
        sleep_quality_previous_night: 7,
        recovery_methods: [],
        next_session_readiness: 7,
        notes: ''
      })
    } catch (error) {
      console.error('Error saving recovery session:', error)
    }
  }

  const handleModalitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('recovery_modalities')
        .insert({
          user_id: user.id,
          ...modalityFormData
        })

      if (error) throw error

      setShowModalityForm(false)
      fetchRecoveryData()
      // Reset form
      setModalityFormData({
        session_date: new Date().toISOString().split('T')[0],
        modality_type: 'stretching',
        duration_minutes: 15,
        effectiveness: 7,
        timing_relative_to_workout: 'immediately_after',
        specific_details: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error saving recovery modality:', error)
    }
  }

  const recoveryMethodOptions = [
    'Cold Therapy', 'Heat Therapy', 'Massage', 'Stretching', 'Foam Rolling',
    'Compression Garments', 'Meditation', 'Sauna', 'Ice Bath', 'Active Recovery'
  ]

  const modalityTypes = [
    { value: 'cold_therapy', label: 'Cold Therapy' },
    { value: 'heat_therapy', label: 'Heat Therapy' },
    { value: 'massage', label: 'Massage' },
    { value: 'stretching', label: 'Stretching' },
    { value: 'foam_rolling', label: 'Foam Rolling' },
    { value: 'meditation', label: 'Meditation' },
    { value: 'compression', label: 'Compression' },
    { value: 'sauna', label: 'Sauna' },
    { value: 'active_recovery', label: 'Active Recovery' }
  ]

  const getRecoveryRecommendations = () => {
    const recommendations = []

    if (sessionFormData.post_workout_carb_timing_minutes > 120) {
      recommendations.push({
        type: 'warning',
        message: 'Dr. Galpin emphasizes rapid carb replenishment post-workout. Consider consuming carbs within 30-60 minutes for optimal glycogen replenishment.'
      })
    }

    if (sessionFormData.muscle_soreness > 7) {
      recommendations.push({
        type: 'info',
        message: 'High muscle soreness detected. Consider tart cherry extract (480mg) or cold therapy for soreness reduction.'
      })
    }

    if (sessionFormData.sleep_quality_previous_night < 6) {
      recommendations.push({
        type: 'warning',
        message: 'Poor sleep quality may impact recovery. Consider melatonin (0.5-3mg) or magnesium glycinate (200-400mg) before bed.'
      })
    }

    return recommendations
  }

  const recommendations = getRecoveryRecommendations()
  const avgReadiness = recoverySessions.length > 0 
    ? Math.round(recoverySessions.reduce((sum, s) => sum + (s.next_session_readiness || 0), 0) / recoverySessions.length * 10) / 10
    : 0

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recovery Tracking</h1>
          <p className="text-gray-600">Monitor your post-workout recovery and readiness</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowSessionForm(!showSessionForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
          >
            Log Recovery
          </button>
          <button
            onClick={() => setShowModalityForm(!showModalityForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"
          >
            Add Modality
          </button>
        </div>
      </div>

      {/* Recovery Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Avg Readiness</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{avgReadiness || '--'} / 10</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Last Carb Timing</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {recoverySessions[0]?.post_workout_carb_timing_minutes || '--'} min
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Recovery Methods</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{modalities.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Muscle Soreness</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {recoverySessions[0]?.muscle_soreness || '--'} / 10
          </p>
        </div>
      </div>

      {/* Recovery Session Form */}
      {showSessionForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Log Recovery Session</h2>
          <form onSubmit={handleSessionSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={sessionFormData.recovery_date}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, recovery_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Post-Workout Carbs (g)
                </label>
                <input
                  type="number"
                  value={sessionFormData.post_workout_carb_intake_g}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, post_workout_carb_intake_g: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 60"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carb Timing (minutes post-workout)
                </label>
                <input
                  type="number"
                  value={sessionFormData.post_workout_carb_timing_minutes}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, post_workout_carb_timing_minutes: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carb Source
                </label>
                <input
                  type="text"
                  value={sessionFormData.carb_source}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, carb_source: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., banana, sports drink, rice"
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
                  Muscle Soreness (1-10)
                </label>
                <input
                  type="range"
                  value={sessionFormData.muscle_soreness}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, muscle_soreness: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{sessionFormData.muscle_soreness}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Levels (1-10)
                </label>
                <input
                  type="range"
                  value={sessionFormData.energy_levels}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, energy_levels: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{sessionFormData.energy_levels}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mood Score (1-10)
                </label>
                <input
                  type="range"
                  value={sessionFormData.mood_score}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, mood_score: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{sessionFormData.mood_score}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Night Sleep Quality (1-10)
                </label>
                <input
                  type="range"
                  value={sessionFormData.sleep_quality_previous_night}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, sleep_quality_previous_night: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{sessionFormData.sleep_quality_previous_night}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Next Session Readiness (1-10)
                </label>
                <input
                  type="range"
                  value={sessionFormData.next_session_readiness}
                  onChange={(e) => setSessionFormData({ ...sessionFormData, next_session_readiness: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{sessionFormData.next_session_readiness}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recovery Methods Used
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {recoveryMethodOptions.map((method) => (
                  <label key={method} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={sessionFormData.recovery_methods.includes(method)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSessionFormData({ 
                            ...sessionFormData, 
                            recovery_methods: [...sessionFormData.recovery_methods, method] 
                          })
                        } else {
                          setSessionFormData({ 
                            ...sessionFormData, 
                            recovery_methods: sessionFormData.recovery_methods.filter(m => m !== method) 
                          })
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 mr-2"
                    />
                    <span className="text-sm">{method}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={sessionFormData.notes}
                onChange={(e) => setSessionFormData({ ...sessionFormData, notes: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="How did you feel? Any recovery observations?"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowSessionForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Save Recovery Session
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recovery Modality Form */}
      {showModalityForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add Recovery Modality</h2>
          <form onSubmit={handleModalitySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={modalityFormData.session_date}
                  onChange={(e) => setModalityFormData({ ...modalityFormData, session_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recovery Method
                </label>
                <select
                  value={modalityFormData.modality_type}
                  onChange={(e) => setModalityFormData({ ...modalityFormData, modality_type: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {modalityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={modalityFormData.duration_minutes}
                  onChange={(e) => setModalityFormData({ ...modalityFormData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Effectiveness (1-10)
                </label>
                <input
                  type="range"
                  value={modalityFormData.effectiveness}
                  onChange={(e) => setModalityFormData({ ...modalityFormData, effectiveness: parseInt(e.target.value) })}
                  className="w-full"
                  min="1"
                  max="10"
                />
                <div className="text-center text-sm text-gray-600">{modalityFormData.effectiveness}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timing Relative to Workout
                </label>
                <select
                  value={modalityFormData.timing_relative_to_workout}
                  onChange={(e) => setModalityFormData({ ...modalityFormData, timing_relative_to_workout: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="immediately_after">Immediately After</option>
                  <option value="within_2hrs">Within 2 Hours</option>
                  <option value="same_day">Same Day</option>
                  <option value="next_day">Next Day</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowModalityForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Save Modality
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recent Recovery Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recent Recovery Sessions</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {recoverySessions.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No recovery sessions logged yet.
              </div>
            ) : (
              recoverySessions.map((session) => (
                <div key={session.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">
                        {new Date(session.recovery_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Readiness: {session.next_session_readiness}/10 | 
                        Soreness: {session.muscle_soreness}/10
                      </div>
                      {session.post_workout_carb_intake_g && (
                        <div className="text-sm text-gray-600">
                          Carbs: {session.post_workout_carb_intake_g}g @ {session.post_workout_carb_timing_minutes}min
                        </div>
                      )}
                      {session.recovery_methods && session.recovery_methods.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {session.recovery_methods.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Recovery Modalities</h2>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {modalities.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No recovery modalities logged yet.
              </div>
            ) : (
              modalities.map((modality) => (
                <div key={modality.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium capitalize">
                        {modality.modality_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(modality.session_date).toLocaleDateString()} | 
                        {modality.duration_minutes}min | 
                        Effectiveness: {modality.effectiveness}/10
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {modality.timing_relative_to_workout?.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dr. Galpin's Recovery Insights */}
      <div className="mt-8 bg-orange-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">Dr. Galpin's Recovery Insights</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <strong>Rapid Carb Replenishment:</strong> Unlike protein, carbohydrate timing post-exercise significantly impacts glycogen replenishment speed
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <strong>Tart Cherry:</strong> 480mg reduces muscle soreness and aids sleep with natural melatonin
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <strong>Glutamine:</strong> 5g supports immune system and reduces illness incidence during heavy training
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <strong>Sleep Priority:</strong> Quality sleep is the most impactful factor for recovery and performance
          </li>
          <li className="flex items-start">
            <span className="text-orange-600 mr-2">•</span>
            <strong>Practice Race-Day Fueling:</strong> Mimic competition fueling strategies during training for optimal preparation
          </li>
        </ul>
      </div>
    </div>
  )
}