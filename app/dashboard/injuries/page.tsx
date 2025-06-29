'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Injury {
  id: string
  injury_name: string
  severity_level: number
  pain_level_current: number
  date_occurred: string
  status: string
  body_part: { name: string }
  injury_type: { name: string, category: string }
  return_to_play_phase: number
  is_active: boolean
}

interface InjuryAssessment {
  id: string
  assessment_date: string
  pain_level: number
  range_of_motion_percentage: number
  strength_percentage: number
  functional_movement_score: number
  improvements_noted: string
  setbacks_noted: string
}

interface RTPProtocol {
  id: string
  name: string
  description: string
  phases: RTPPhase[]
}

interface RTPPhase {
  phase_number: number
  phase_name: string
  description: string
  allowed_activities: string[]
  prohibited_activities: string[]
  advancement_criteria: string
}

export default function InjuriesPage() {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null)
  const [assessments, setAssessments] = useState<InjuryAssessment[]>([])
  const [rtpProtocols, setRtpProtocols] = useState<RTPProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'assessments' | 'rtp' | 'prevention'>('overview')

  const [newInjury, setNewInjury] = useState({
    injury_name: '',
    severity_level: 5,
    pain_level_initial: 5,
    date_occurred: new Date().toISOString().split('T')[0],
    mechanism_of_injury: '',
    activity_when_injured: '',
    body_part_id: '',
    injury_type_id: '',
    notes: ''
  })

  const [newAssessment, setNewAssessment] = useState({
    pain_level: 0,
    range_of_motion_percentage: 100,
    strength_percentage: 100,
    functional_movement_score: 10,
    improvements_noted: '',
    setbacks_noted: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchInjuries()
    fetchRTPProtocols()
  }, [])

  const fetchInjuries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: injuriesData, error } = await supabase
        .from('injuries')
        .select(`
          *,
          body_part:body_parts(name),
          injury_type:injury_types(name, category)
        `)
        .eq('user_id', user.id)
        .order('date_occurred', { ascending: false })

      if (error) throw error
      setInjuries(injuriesData || [])
    } catch (error) {
      console.error('Error fetching injuries:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssessments = async (injuryId: string) => {
    try {
      const { data: assessmentsData, error } = await supabase
        .from('injury_assessments')
        .select('*')
        .eq('injury_id', injuryId)
        .order('assessment_date', { ascending: false })
        .limit(10)

      if (error) throw error
      setAssessments(assessmentsData || [])
    } catch (error) {
      console.error('Error fetching assessments:', error)
    }
  }

  const fetchRTPProtocols = async () => {
    try {
      const { data: protocolsData, error } = await supabase
        .from('return_to_play_protocols')
        .select(`
          *,
          phases:return_to_play_phases(*)
        `)
        .eq('is_public', true)
        .order('usage_count', { ascending: false })

      if (error) throw error
      setRtpProtocols(protocolsData || [])
    } catch (error) {
      console.error('Error fetching RTP protocols:', error)
    }
  }

  const handleCreateInjury = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('injuries')
        .insert({
          ...newInjury,
          user_id: user.id,
          pain_level_current: newInjury.pain_level_initial
        })

      if (error) throw error

      setShowCreateForm(false)
      setNewInjury({
        injury_name: '',
        severity_level: 5,
        pain_level_initial: 5,
        date_occurred: new Date().toISOString().split('T')[0],
        mechanism_of_injury: '',
        activity_when_injured: '',
        body_part_id: '',
        injury_type_id: '',
        notes: ''
      })
      fetchInjuries()
    } catch (error) {
      console.error('Error creating injury:', error)
    }
  }

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInjury) return

    try {
      const { error } = await supabase
        .from('injury_assessments')
        .insert({
          ...newAssessment,
          injury_id: selectedInjury.id
        })

      if (error) throw error

      // Update injury with current pain level
      await supabase
        .from('injuries')
        .update({ pain_level_current: newAssessment.pain_level })
        .eq('id', selectedInjury.id)

      setShowAssessmentForm(false)
      setNewAssessment({
        pain_level: 0,
        range_of_motion_percentage: 100,
        strength_percentage: 100,
        functional_movement_score: 10,
        improvements_noted: '',
        setbacks_noted: '',
        notes: ''
      })
      fetchAssessments(selectedInjury.id)
      fetchInjuries()
    } catch (error) {
      console.error('Error creating assessment:', error)
    }
  }

  const advanceRTPPhase = async (injuryId: string) => {
    try {
      const { error } = await supabase.rpc('advance_rtp_phase', {
        p_injury_id: injuryId
      })

      if (error) throw error
      fetchInjuries()
    } catch (error) {
      console.error('Error advancing RTP phase:', error)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      acute: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      healing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      chronic: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      recovered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      recurring: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    }
    return colors[status as keyof typeof colors] || colors.acute
  }

  const getPainLevelColor = (level: number) => {
    if (level <= 2) return 'text-green-600 dark:text-green-400'
    if (level <= 5) return 'text-yellow-600 dark:text-yellow-400'
    if (level <= 7) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900 dark:text-white">Loading injuries...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Injury Tracking & Return-to-Play</h1>
          <p className="text-gray-600 dark:text-gray-300">Monitor injuries, track recovery, and manage return-to-play protocols</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Report Injury
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Overview', icon: '📊' },
            { id: 'assessments', name: 'Daily Assessments', icon: '📝' },
            { id: 'rtp', name: 'Return-to-Play', icon: '🏃' },
            { id: 'prevention', name: 'Prevention', icon: '🛡️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Active Injuries Grid */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Injuries</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {injuries.filter(injury => injury.is_active).map((injury) => (
                <div
                  key={injury.id}
                  className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedInjury(injury)
                    fetchAssessments(injury.id)
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{injury.injury_name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusColor(injury.status)}`}>
                      {injury.status}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <div><strong>Location:</strong> {injury.body_part.name}</div>
                    <div><strong>Type:</strong> {injury.injury_type.name}</div>
                    <div><strong>Occurred:</strong> {new Date(injury.date_occurred).toLocaleDateString()}</div>
                    <div className="flex justify-between">
                      <span><strong>Severity:</strong> {injury.severity_level}/10</span>
                      <span className={`font-medium ${getPainLevelColor(injury.pain_level_current)}`}>
                        Pain: {injury.pain_level_current}/10
                      </span>
                    </div>
                    {injury.return_to_play_phase > 0 && (
                      <div><strong>RTP Phase:</strong> {injury.return_to_play_phase}/6</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {injuries.filter(injury => injury.is_active).length === 0 && (
              <div className="text-center py-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <span className="text-4xl mb-2 block">✅</span>
                <p className="text-green-800 dark:text-green-300 font-medium">No active injuries!</p>
                <p className="text-green-600 dark:text-green-400 text-sm">Keep up the great work with injury prevention</p>
              </div>
            )}
          </div>

          {/* Recent/Past Injuries */}
          {injuries.filter(injury => !injury.is_active).length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Past Injuries</h2>
              <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {injuries.filter(injury => !injury.is_active).slice(0, 5).map((injury) => (
                    <div key={injury.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">{injury.injury_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {injury.body_part.name} • {new Date(injury.date_occurred).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusColor(injury.status)}`}>
                          {injury.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Assessments Tab */}
      {activeTab === 'assessments' && (
        <div className="space-y-6">
          {selectedInjury ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assessments for {selectedInjury.injury_name}
                </h2>
                <button
                  onClick={() => setShowAssessmentForm(!showAssessmentForm)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  New Assessment
                </button>
              </div>

              {/* Assessment Chart/Progress */}
              <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-6">
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Recovery Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPainLevelColor(selectedInjury.pain_level_current)}`}>
                      {selectedInjury.pain_level_current}/10
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Current Pain</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {assessments[0]?.range_of_motion_percentage || 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Range of Motion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {assessments[0]?.strength_percentage || 'N/A'}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Strength</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {selectedInjury.return_to_play_phase}/6
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">RTP Phase</div>
                  </div>
                </div>
              </div>

              {/* Recent Assessments */}
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <div key={assessment.id} className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {new Date(assessment.assessment_date).toLocaleDateString()}
                      </h4>
                      <span className={`font-medium ${getPainLevelColor(assessment.pain_level)}`}>
                        Pain: {assessment.pain_level}/10
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Range of Motion: </span>
                        <span className="font-medium">{assessment.range_of_motion_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Strength: </span>
                        <span className="font-medium">{assessment.strength_percentage}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-300">Function: </span>
                        <span className="font-medium">{assessment.functional_movement_score}/10</span>
                      </div>
                    </div>
                    {(assessment.improvements_noted || assessment.setbacks_noted) && (
                      <div className="mt-3 text-sm">
                        {assessment.improvements_noted && (
                          <div className="text-green-600 dark:text-green-400">
                            <strong>Improvements:</strong> {assessment.improvements_noted}
                          </div>
                        )}
                        {assessment.setbacks_noted && (
                          <div className="text-red-600 dark:text-red-400">
                            <strong>Setbacks:</strong> {assessment.setbacks_noted}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Select an injury from the Overview tab to view assessments</p>
            </div>
          )}
        </div>
      )}

      {/* Return-to-Play Tab */}
      {activeTab === 'rtp' && (
        <div className="space-y-6">
          {selectedInjury ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Return-to-Play Protocol for {selectedInjury.injury_name}
                </h2>
                {selectedInjury.return_to_play_phase < 6 && (
                  <button
                    onClick={() => advanceRTPPhase(selectedInjury.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Advance Phase
                  </button>
                )}
              </div>

              {/* Current Phase */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  Current Phase: {selectedInjury.return_to_play_phase}/6
                </h3>
                <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 dark:bg-blue-400 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedInjury.return_to_play_phase / 6) * 100}%` }}
                  ></div>
                </div>
                <p className="text-blue-800 dark:text-blue-300">
                  {selectedInjury.return_to_play_phase === 0 && "Rest and recovery phase"}
                  {selectedInjury.return_to_play_phase === 1 && "Rest and protect - focus on pain control"}
                  {selectedInjury.return_to_play_phase === 2 && "Range of motion restoration"}
                  {selectedInjury.return_to_play_phase === 3 && "Progressive loading and strengthening"}
                  {selectedInjury.return_to_play_phase === 4 && "Running progression"}
                  {selectedInjury.return_to_play_phase === 5 && "Sport-specific training"}
                  {selectedInjury.return_to_play_phase === 6 && "Full return to competition - well done! 🎉"}
                </p>
              </div>

              {/* Available RTP Protocols */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-4">Available Protocols</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rtpProtocols.slice(0, 4).map((protocol) => (
                    <div key={protocol.id} className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{protocol.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{protocol.description}</p>
                      <button className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                        View Protocol →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Select an injury from the Overview tab to view RTP protocols</p>
            </div>
          )}
        </div>
      )}

      {/* Prevention Tab */}
      {activeTab === 'prevention' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 dark:text-green-300 mb-4">🛡️ Injury Prevention Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Training Guidelines</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>• Follow the 10% rule for training load increases</li>
                  <li>• Include proper warm-up and cool-down</li>
                  <li>• Maintain strength and flexibility balance</li>
                  <li>• Listen to your body and respect pain signals</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Recovery Factors</h4>
                <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>• Prioritize quality sleep (7-9 hours)</li>
                  <li>• Maintain adequate nutrition and hydration</li>
                  <li>• Manage stress levels effectively</li>
                  <li>• Schedule regular rest days</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 p-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-4">📊 Risk Assessment</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Coming soon: Comprehensive injury risk assessment based on your training data, sleep quality, and movement patterns.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
              Schedule Assessment
            </button>
          </div>
        </div>
      )}

      {/* Create Injury Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Report New Injury</h2>
            </div>
            <form onSubmit={handleCreateInjury} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Injury Name
                  </label>
                  <input
                    type="text"
                    value={newInjury.injury_name}
                    onChange={(e) => setNewInjury({ ...newInjury, injury_name: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., Right hamstring strain"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date Occurred
                  </label>
                  <input
                    type="date"
                    value={newInjury.date_occurred}
                    onChange={(e) => setNewInjury({ ...newInjury, date_occurred: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity Level (1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newInjury.severity_level}
                    onChange={(e) => setNewInjury({ ...newInjury, severity_level: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Initial Pain Level (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newInjury.pain_level_initial}
                    onChange={(e) => setNewInjury({ ...newInjury, pain_level_initial: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  How did it happen?
                </label>
                <textarea
                  value={newInjury.mechanism_of_injury}
                  onChange={(e) => setNewInjury({ ...newInjury, mechanism_of_injury: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe how the injury occurred..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={newInjury.notes}
                  onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any additional details..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Report Injury
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Assessment Modal */}
      {showAssessmentForm && selectedInjury && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Daily Assessment - {selectedInjury.injury_name}
              </h2>
            </div>
            <form onSubmit={handleCreateAssessment} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pain Level (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newAssessment.pain_level}
                    onChange={(e) => setNewAssessment({ ...newAssessment, pain_level: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Range of Motion (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newAssessment.range_of_motion_percentage}
                    onChange={(e) => setNewAssessment({ ...newAssessment, range_of_motion_percentage: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Strength (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={newAssessment.strength_percentage}
                    onChange={(e) => setNewAssessment({ ...newAssessment, strength_percentage: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Function Score (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newAssessment.functional_movement_score}
                    onChange={(e) => setNewAssessment({ ...newAssessment, functional_movement_score: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Improvements Noted
                </label>
                <textarea
                  value={newAssessment.improvements_noted}
                  onChange={(e) => setNewAssessment({ ...newAssessment, improvements_noted: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="What's getting better?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Setbacks or Concerns
                </label>
                <textarea
                  value={newAssessment.setbacks_noted}
                  onChange={(e) => setNewAssessment({ ...newAssessment, setbacks_noted: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any concerns or setbacks?"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssessmentForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Save Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}