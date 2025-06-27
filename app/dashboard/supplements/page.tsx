'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type Supplement = Database['public']['Tables']['supplements']['Row']
type UserSupplement = Database['public']['Tables']['user_supplements']['Row'] & {
  supplements: Supplement
}

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<Supplement[]>([])
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedSupplement, setSelectedSupplement] = useState<string>('')
  const supabase = createClient()

  // Form state
  const [formData, setFormData] = useState({
    supplement_id: '',
    dosage: '',
    frequency: 'daily',
    timing: 'morning',
    start_date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all available supplements
      const { data: supplementsData, error: supplementsError } = await supabase
        .from('supplements')
        .select('*')
        .order('name')

      if (supplementsError) throw supplementsError

      // Fetch user's supplements
      const { data: userSupplementsData, error: userSupplementsError } = await supabase
        .from('user_supplements')
        .select(`
          *,
          supplements (*)
        `)
        .eq('user_id', user.id)
        .is('end_date', null) // Only active supplements

      if (userSupplementsError) throw userSupplementsError

      setSupplements(supplementsData || [])
      setUserSupplements(userSupplementsData || [])
    } catch (error) {
      console.error('Error fetching supplements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddSupplement = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('user_supplements')
        .insert({
          user_id: user.id,
          ...formData
        })

      if (error) throw error

      setShowAddForm(false)
      fetchData()
      // Reset form
      setFormData({
        supplement_id: '',
        dosage: '',
        frequency: 'daily',
        timing: 'morning',
        start_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      setSelectedSupplement('')
    } catch (error) {
      console.error('Error adding supplement:', error)
    }
  }

  const handleRemoveSupplement = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_supplements')
        .update({ end_date: new Date().toISOString().split('T')[0] })
        .eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error removing supplement:', error)
    }
  }

  const getSupplementDetails = (supplementId: string) => {
    return supplements.find(s => s.id === supplementId)
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      protein: 'bg-blue-100 text-blue-800',
      vitamin: 'bg-yellow-100 text-yellow-800',
      mineral: 'bg-green-100 text-green-800',
      performance: 'bg-red-100 text-red-800',
      recovery: 'bg-purple-100 text-purple-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const selectedSupplementDetails = selectedSupplement ? getSupplementDetails(selectedSupplement) : null

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Supplements</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showAddForm ? 'Cancel' : 'Add Supplement'}
        </button>
      </div>

      {/* Current Supplements */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Your Current Supplements</h2>
        </div>
        <div className="divide-y">
          {userSupplements.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No supplements added yet. Click "Add Supplement" to get started!
            </div>
          ) : (
            userSupplements.map((userSup) => (
              <div key={userSup.id} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{userSup.supplements.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(userSup.supplements.category || 'other')}`}>
                        {userSup.supplements.category}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <strong>Dosage:</strong> {userSup.dosage} | 
                      <strong> Frequency:</strong> {userSup.frequency} | 
                      <strong> Timing:</strong> {userSup.timing}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{userSup.supplements.description}</p>
                    {userSup.notes && (
                      <p className="text-sm text-gray-500 mt-1 italic">Notes: {userSup.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveSupplement(userSup.id)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium ml-4"
                  >
                    Stop Taking
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Add New Supplement</h2>
          <form onSubmit={handleAddSupplement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Supplement
              </label>
              <select
                value={selectedSupplement}
                onChange={(e) => {
                  setSelectedSupplement(e.target.value)
                  setFormData({ ...formData, supplement_id: e.target.value })
                }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Choose a supplement...</option>
                {supplements.map((supplement) => (
                  <option key={supplement.id} value={supplement.id}>
                    {supplement.name} ({supplement.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedSupplementDetails && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">{selectedSupplementDetails.name}</h4>
                <p className="text-sm text-blue-800 mb-2">{selectedSupplementDetails.description}</p>
                <div className="text-sm text-blue-700">
                  <p><strong>Recommended Dosage:</strong> {selectedSupplementDetails.default_dosage}</p>
                  <p><strong>Timing:</strong> {selectedSupplementDetails.timing_recommendations}</p>
                  {selectedSupplementDetails.notes && (
                    <p className="mt-1"><strong>Notes:</strong> {selectedSupplementDetails.notes}</p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Dosage
                </label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., 200mg, 5g, 2 capsules"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="twice_daily">Twice Daily</option>
                  <option value="three_times_daily">Three Times Daily</option>
                  <option value="pre_workout">Pre-Workout Only</option>
                  <option value="post_workout">Post-Workout Only</option>
                  <option value="as_needed">As Needed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timing
                </label>
                <select
                  value={formData.timing}
                  onChange={(e) => setFormData({ ...formData, timing: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="pre_workout">Pre-Workout</option>
                  <option value="post_workout">Post-Workout</option>
                  <option value="with_meals">With Meals</option>
                  <option value="between_meals">Between Meals</option>
                  <option value="before_bed">Before Bed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={3}
                placeholder="Why are you taking this? Any specific goals or observations?"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setSelectedSupplement('')
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Add Supplement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Research Database */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Research-Backed Supplements</h2>
          <p className="text-sm text-gray-600 mt-1">Based on Dr. Andy Galpin's recommendations</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
          {supplements.map((supplement) => (
            <div key={supplement.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium">{supplement.name}</h3>
                <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(supplement.category || 'other')}`}>
                  {supplement.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{supplement.description}</p>
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Dosage:</strong> {supplement.default_dosage}</p>
                <p><strong>Timing:</strong> {supplement.timing_recommendations}</p>
                {supplement.notes && (
                  <p className="text-xs text-blue-600 mt-2">{supplement.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guidelines */}
      <div className="mt-8 bg-green-50 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-3">Dr. Galpin's Supplement Guidelines</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <strong>Whole foods first:</strong> Always prioritize a varied, healthy diet over supplements
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <strong>Common deficiencies:</strong> Magnesium and Vitamin D are most commonly deficient
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <strong>Biomarker testing:</strong> Get blood work to determine precise needs
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <strong>Quality matters:</strong> Choose reputable brands with third-party testing
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">•</span>
            <strong>Timing is key:</strong> Follow timing recommendations for optimal absorption
          </li>
        </ul>
      </div>
    </div>
  )
}