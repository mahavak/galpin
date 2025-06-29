'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface Supplement {
  id: string
  name: string
  category: string
  description: string
  default_dosage: string
  timing_recommendations: string
  evidence_level: string
  contraindications: string[]
  side_effects: string[]
  optimal_timing: string[]
  food_interaction: string
  max_daily_dose: string
}

interface UserSupplement {
  id: string
  supplement_id: string
  dosage: string
  frequency: string
  timing: string
  start_date: string
  notes: string
  supplements: Supplement
}

interface SupplementEffectiveness {
  id: string
  supplement_id: string
  rating: number
  benefits_experienced: string[]
  side_effects: string[]
  notes: string
  duration_days: number
  would_recommend: boolean
  cost_per_month: number
  evaluation_date: string
}

interface SupplementInteraction {
  supplement_a: string
  supplement_b: string
  interaction_type: string
  severity: string
  description: string
  recommendation: string
}

interface SupplementRecommendation {
  supplement_name: string
  recommendation_reason: string
  priority_score: number
}

interface CostAnalysis {
  supplement_name: string
  monthly_cost: number
  cost_per_serving: number
  effectiveness_rating: number
  cost_effectiveness_score: number
}

export default function EnhancedSupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([])
  const [effectiveness, setEffectiveness] = useState<SupplementEffectiveness[]>([])
  const [interactions, setInteractions] = useState<SupplementInteraction[]>([])
  const [recommendations, setRecommendations] = useState<SupplementRecommendation[]>([])
  const [costAnalysis, setCostAnalysis] = useState<CostAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'current' | 'add' | 'effectiveness' | 'costs' | 'interactions'>('current')
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEffectivenessForm, setShowEffectivenessForm] = useState<string | null>(null)
  const [showCostForm, setShowCostForm] = useState<string | null>(null)

  const [newSupplement, setNewSupplement] = useState({
    supplement_id: '',
    dosage: '',
    frequency: 'daily',
    timing: 'morning',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [newEffectiveness, setNewEffectiveness] = useState({
    supplement_id: '',
    rating: 5,
    benefits_experienced: [] as string[],
    side_effects: [] as string[],
    notes: '',
    duration_days: 30,
    would_recommend: true,
    cost_per_month: 0
  })

  const [newCost, setNewCost] = useState({
    supplement_id: '',
    brand_name: '',
    product_name: '',
    cost_amount: 0,
    quantity_amount: 0,
    quantity_unit: 'servings',
    purchase_date: new Date().toISOString().split('T')[0],
    supplier: '',
    notes: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all supplements
      const { data: supplementsData } = await supabase
        .from('supplements')
        .select('*')
        .order('name')

      // Fetch user supplements
      const { data: userSupplementsData } = await supabase
        .from('user_supplements')
        .select(`
          *,
          supplements (*)
        `)
        .eq('user_id', user.id)
        .is('end_date', null)

      // Fetch effectiveness ratings
      const { data: effectivenessData } = await supabase
        .from('supplement_effectiveness')
        .select('*')
        .eq('user_id', user.id)

      // Check for interactions
      const { data: interactionsData } = await supabase
        .rpc('check_supplement_interactions', { p_user_id: user.id })

      // Get recommendations
      const { data: recommendationsData } = await supabase
        .rpc('get_supplement_recommendations', { p_user_id: user.id })

      // Get cost analysis
      const { data: costAnalysisData } = await supabase
        .rpc('calculate_supplement_cost_analysis', { p_user_id: user.id })

      setSupplements(supplementsData || [])
      setUserSupplements(userSupplementsData || [])
      setEffectiveness(effectivenessData || [])
      setInteractions(interactionsData || [])
      setRecommendations(recommendationsData || [])
      setCostAnalysis(costAnalysisData || [])

    } catch (error) {
      console.error('Error fetching supplement data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSupplement = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_supplements')
        .insert({
          user_id: user.id,
          ...newSupplement
        })

      if (error) throw error

      setShowAddForm(false)
      setNewSupplement({
        supplement_id: '',
        dosage: '',
        frequency: 'daily',
        timing: 'morning',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      fetchAllData()
    } catch (error) {
      console.error('Error adding supplement:', error)
    }
  }

  const addEffectivenessRating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('supplement_effectiveness')
        .insert({
          user_id: user.id,
          ...newEffectiveness
        })

      if (error) throw error

      setShowEffectivenessForm(null)
      setNewEffectiveness({
        supplement_id: '',
        rating: 5,
        benefits_experienced: [],
        side_effects: [],
        notes: '',
        duration_days: 30,
        would_recommend: true,
        cost_per_month: 0
      })
      fetchAllData()
    } catch (error) {
      console.error('Error adding effectiveness rating:', error)
    }
  }

  const addCost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const costPerServing = newCost.quantity_amount > 0 ? newCost.cost_amount / newCost.quantity_amount : 0

      const { error } = await supabase
        .from('supplement_costs')
        .insert({
          user_id: user.id,
          cost_per_serving: costPerServing,
          ...newCost
        })

      if (error) throw error

      setShowCostForm(null)
      setNewCost({
        supplement_id: '',
        brand_name: '',
        product_name: '',
        cost_amount: 0,
        quantity_amount: 0,
        quantity_unit: 'servings',
        purchase_date: new Date().toISOString().split('T')[0],
        supplier: '',
        notes: ''
      })
      fetchAllData()
    } catch (error) {
      console.error('Error adding cost:', error)
    }
  }

  const getEvidenceColor = (level: string) => {
    switch (level) {
      case 'strong': return 'bg-green-100 text-green-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'limited': return 'bg-orange-100 text-orange-800'
      case 'insufficient': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-200'
      case 'moderate': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'mild': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getInteractionTypeIcon = (type: string) => {
    switch (type) {
      case 'synergistic': return '🤝'
      case 'antagonistic': return '⚠️'
      case 'neutral': return '➖'
      case 'timing_dependent': return '⏰'
      case 'caution': return '⚠️'
      default: return '❓'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'protein': return '🥩'
      case 'vitamin': return '🌟'
      case 'mineral': return '⚡'
      case 'performance': return '🚀'
      case 'recovery': return '🧘'
      default: return '💊'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading supplements...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Enhanced Supplement Tracking</h1>
          <p className="text-gray-300">Track effectiveness, costs, and interactions</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + Add Supplement
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💊</span>
            <div>
              <p className="text-white font-semibold">{userSupplements.length}</p>
              <p className="text-gray-300 text-sm">Active Supplements</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📊</span>
            <div>
              <p className="text-white font-semibold">{effectiveness.length}</p>
              <p className="text-gray-300 text-sm">Effectiveness Ratings</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="text-white font-semibold">{interactions.length}</p>
              <p className="text-gray-300 text-sm">Interactions Found</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💰</span>
            <div>
              <p className="text-white font-semibold">
                ${costAnalysis.reduce((sum, item) => sum + (item.monthly_cost || 0), 0).toFixed(0)}
              </p>
              <p className="text-gray-300 text-sm">Monthly Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactions Alert */}
      {interactions.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">🔔 Supplement Interactions Detected</h3>
          <div className="space-y-2">
            {interactions.slice(0, 2).map((interaction, index) => (
              <div key={index} className="text-orange-700 text-sm">
                <strong>{interaction.supplement_a} + {interaction.supplement_b}:</strong> {interaction.description}
              </div>
            ))}
            {interactions.length > 2 && (
              <p className="text-orange-600 text-sm">+ {interactions.length - 2} more interactions. Check the Interactions tab for details.</p>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Personalized Recommendations</h3>
          <div className="space-y-2">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="text-blue-700 text-sm">
                <strong>{rec.supplement_name}:</strong> {rec.recommendation_reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'current', label: 'Current Stack', count: userSupplements.length },
          { key: 'effectiveness', label: 'Effectiveness', count: effectiveness.length },
          { key: 'costs', label: 'Cost Analysis', count: costAnalysis.length },
          { key: 'interactions', label: 'Interactions', count: interactions.length },
          { key: 'add', label: 'Add New', count: 0 }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label} {tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'current' && (
        <div className="space-y-4">
          {userSupplements.map((userSup) => (
            <div key={userSup.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{getCategoryIcon(userSup.supplements.category)}</span>
                    <h3 className="text-lg font-semibold text-white">{userSup.supplements.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded capitalize ${getEvidenceColor(userSup.supplements.evidence_level)}`}>
                      {userSup.supplements.evidence_level} evidence
                    </span>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{userSup.supplements.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong className="text-gray-300">Your Dosage:</strong>
                      <p className="text-white">{userSup.dosage}</p>
                    </div>
                    <div>
                      <strong className="text-gray-300">Frequency:</strong>
                      <p className="text-white capitalize">{userSup.frequency}</p>
                    </div>
                    <div>
                      <strong className="text-gray-300">Timing:</strong>
                      <p className="text-white capitalize">{userSup.timing}</p>
                    </div>
                  </div>
                  
                  {userSup.supplements.optimal_timing && userSup.supplements.optimal_timing.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-gray-300 text-sm">Optimal Timing:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {userSup.supplements.optimal_timing.map((timing, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs capitalize">
                            {timing.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-right space-y-2">
                  <button
                    onClick={() => {
                      setNewEffectiveness({ ...newEffectiveness, supplement_id: userSup.supplement_id })
                      setShowEffectivenessForm(userSup.id)
                    }}
                    className="block bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Rate Effectiveness
                  </button>
                  <button
                    onClick={() => {
                      setNewCost({ ...newCost, supplement_id: userSup.supplement_id })
                      setShowCostForm(userSup.id)
                    }}
                    className="block bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Add Cost
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {userSupplements.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💊</span>
              <h3 className="text-lg font-medium text-white mb-2">No supplements tracked yet</h3>
              <p className="text-gray-300 mb-4">Start by adding your first supplement to track effectiveness and costs.</p>
              <button
                onClick={() => setActiveTab('add')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Add Your First Supplement
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'effectiveness' && (
        <div className="space-y-4">
          {effectiveness.map((eff) => {
            const supplement = supplements.find(s => s.id === eff.supplement_id)
            return (
              <div key={eff.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{supplement?.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                          <span key={star} className={star <= eff.rating ? 'text-yellow-400' : 'text-gray-600'}>
                            ⭐
                          </span>
                        ))}
                      </div>
                      <span className="text-white font-medium">{eff.rating}/10</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-300">Duration: {eff.duration_days} days</p>
                    <p className="text-sm text-gray-300">
                      Would recommend: {eff.would_recommend ? '✅ Yes' : '❌ No'}
                    </p>
                  </div>
                </div>
                
                {eff.benefits_experienced && eff.benefits_experienced.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-green-400 text-sm">Benefits Experienced:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eff.benefits_experienced.map((benefit, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {eff.side_effects && eff.side_effects.length > 0 && (
                  <div className="mb-3">
                    <strong className="text-red-400 text-sm">Side Effects:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {eff.side_effects.map((effect, index) => (
                        <span key={index} className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                          {effect}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {eff.notes && (
                  <div>
                    <strong className="text-gray-300 text-sm">Notes:</strong>
                    <p className="text-white text-sm mt-1">{eff.notes}</p>
                  </div>
                )}
              </div>
            )
          })}
          
          {effectiveness.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📊</span>
              <h3 className="text-lg font-medium text-white mb-2">No effectiveness ratings yet</h3>
              <p className="text-gray-300 mb-4">Rate your supplements to track what works best for you.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-4">
          {costAnalysis.map((cost, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white">{cost.supplement_name}</h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <div>
                      <span className="text-gray-300">Monthly Cost: </span>
                      <span className="text-white font-medium">${cost.monthly_cost?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Per Serving: </span>
                      <span className="text-white font-medium">${cost.cost_per_serving?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div>
                      <span className="text-gray-300">Effectiveness: </span>
                      <span className="text-white font-medium">{cost.effectiveness_rating?.toFixed(1) || 'N/A'}/10</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {cost.cost_effectiveness_score?.toFixed(1) || '0.0'}
                  </div>
                  <div className="text-xs text-gray-300">Value Score</div>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min((cost.cost_effectiveness_score || 0) * 10, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-300 mt-1">
                  {(cost.cost_effectiveness_score || 0) < 3 ? 'Poor value' :
                   (cost.cost_effectiveness_score || 0) < 6 ? 'Fair value' :
                   (cost.cost_effectiveness_score || 0) < 8 ? 'Good value' : 'Excellent value'}
                </p>
              </div>
            </div>
          ))}
          
          {costAnalysis.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💰</span>
              <h3 className="text-lg font-medium text-white mb-2">No cost data yet</h3>
              <p className="text-gray-300 mb-4">Add cost information to analyze supplement value.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interactions' && (
        <div className="space-y-4">
          {interactions.map((interaction, index) => (
            <div key={index} className={`rounded-lg p-6 border ${getSeverityColor(interaction.severity)}`}>
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{getInteractionTypeIcon(interaction.interaction_type)}</span>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold">{interaction.supplement_a} + {interaction.supplement_b}</h3>
                    <span className="text-xs px-2 py-1 rounded capitalize bg-white/20">
                      {interaction.interaction_type.replace('_', ' ')}
                    </span>
                    <span className="text-xs px-2 py-1 rounded capitalize bg-white/30">
                      {interaction.severity}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{interaction.description}</p>
                  {interaction.recommendation && (
                    <div className="bg-white/10 rounded p-3">
                      <strong className="text-sm">Recommendation:</strong>
                      <p className="text-sm mt-1">{interaction.recommendation}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {interactions.length === 0 && (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">✅</span>
              <h3 className="text-lg font-medium text-white mb-2">No interactions found</h3>
              <p className="text-gray-300 mb-4">Your current supplement stack appears to be safe from known interactions.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">Add New Supplement</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Supplement</label>
              <select
                value={newSupplement.supplement_id}
                onChange={(e) => setNewSupplement({ ...newSupplement, supplement_id: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select a supplement</option>
                {supplements.map((sup) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Dosage</label>
              <input
                type="text"
                value={newSupplement.dosage}
                onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="e.g., 200mg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
              <select
                value={newSupplement.frequency}
                onChange={(e) => setNewSupplement({ ...newSupplement, frequency: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="daily">Daily</option>
                <option value="twice_daily">Twice Daily</option>
                <option value="three_times_daily">Three Times Daily</option>
                <option value="weekly">Weekly</option>
                <option value="as_needed">As Needed</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Timing</label>
              <select
                value={newSupplement.timing}
                onChange={(e) => setNewSupplement({ ...newSupplement, timing: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="morning">Morning</option>
                <option value="pre_workout">Pre-Workout</option>
                <option value="post_workout">Post-Workout</option>
                <option value="evening">Evening</option>
                <option value="with_meals">With Meals</option>
                <option value="between_meals">Between Meals</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                value={newSupplement.start_date}
                onChange={(e) => setNewSupplement({ ...newSupplement, start_date: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
              <textarea
                value={newSupplement.notes}
                onChange={(e) => setNewSupplement({ ...newSupplement, notes: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                rows={3}
                placeholder="Any additional notes about this supplement..."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setActiveTab('current')}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={addSupplement}
              disabled={!newSupplement.supplement_id || !newSupplement.dosage}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Supplement
            </button>
          </div>
        </div>
      )}

      {/* Effectiveness Form Modal */}
      {showEffectivenessForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Rate Supplement Effectiveness</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Overall Rating (1-10)</label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={newEffectiveness.rating}
                  onChange={(e) => setNewEffectiveness({ ...newEffectiveness, rating: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-white font-medium">{newEffectiveness.rating}/10</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={newEffectiveness.duration_days}
                  onChange={(e) => setNewEffectiveness({ ...newEffectiveness, duration_days: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Would you recommend?</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newEffectiveness.would_recommend === true}
                      onChange={() => setNewEffectiveness({ ...newEffectiveness, would_recommend: true })}
                      className="mr-2"
                    />
                    <span className="text-white">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={newEffectiveness.would_recommend === false}
                      onChange={() => setNewEffectiveness({ ...newEffectiveness, would_recommend: false })}
                      className="mr-2"
                    />
                    <span className="text-white">No</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                <textarea
                  value={newEffectiveness.notes}
                  onChange={(e) => setNewEffectiveness({ ...newEffectiveness, notes: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  rows={3}
                  placeholder="Describe your experience..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEffectivenessForm(null)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addEffectivenessRating}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Rating
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cost Form Modal */}
      {showCostForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-lg font-semibold text-white mb-4">Add Cost Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCost.cost_amount}
                    onChange={(e) => setNewCost({ ...newCost, cost_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newCost.quantity_amount}
                    onChange={(e) => setNewCost({ ...newCost, quantity_amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    placeholder="60"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
                <select
                  value={newCost.quantity_unit}
                  onChange={(e) => setNewCost({ ...newCost, quantity_unit: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="servings">Servings</option>
                  <option value="pills">Pills</option>
                  <option value="capsules">Capsules</option>
                  <option value="grams">Grams</option>
                  <option value="ounces">Ounces</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Brand</label>
                <input
                  type="text"
                  value={newCost.brand_name}
                  onChange={(e) => setNewCost({ ...newCost, brand_name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="Optimum Nutrition"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Supplier</label>
                <input
                  type="text"
                  value={newCost.supplier}
                  onChange={(e) => setNewCost({ ...newCost, supplier: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                  placeholder="Amazon, iHerb, etc."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCostForm(null)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCost}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Cost
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}