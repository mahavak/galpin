'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    full_name: '',
    sport_type: '',
    experience_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced' | 'professional',
    birth_date: '',
    height_cm: '',
    weight_kg: ''
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = row not found
        throw error
      }

      if (data) {
        setProfile(data)
        setFormData({
          full_name: data.full_name || '',
          sport_type: data.sport_type || '',
          experience_level: data.experience_level || 'intermediate',
          birth_date: data.birth_date || '',
          height_cm: data.height_cm?.toString() || '',
          weight_kg: data.weight_kg?.toString() || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const updateData = {
        id: user.id,
        full_name: formData.full_name || null,
        sport_type: formData.sport_type || null,
        experience_level: formData.experience_level,
        birth_date: formData.birth_date || null,
        height_cm: formData.height_cm ? parseInt(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData)

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      fetchProfile()
    } catch (error) {
      console.error('Error updating profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const calculateBMI = (heightCm: number, weightKg: number) => {
    const heightM = heightCm / 100
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  const age = formData.birth_date ? calculateAge(formData.birth_date) : null
  const bmi = formData.height_cm && formData.weight_kg 
    ? calculateBMI(parseInt(formData.height_cm), parseFloat(formData.weight_kg))
    : null

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Your full name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport/Activity
              </label>
              <input
                type="text"
                value={formData.sport_type}
                onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., Powerlifting, Running, CrossFit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level
              </label>
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData({ ...formData, experience_level: e.target.value as any })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="beginner">Beginner (0-1 years)</option>
                <option value="intermediate">Intermediate (1-3 years)</option>
                <option value="advanced">Advanced (3-5 years)</option>
                <option value="professional">Professional (5+ years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {age && (
              <p className="text-sm text-gray-600 mt-1">Age: {age} years</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="170"
                min="100"
                max="250"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="70"
                min="30"
                max="300"
                step="0.1"
              />
            </div>
          </div>

          {bmi && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>BMI:</strong> {bmi} kg/m²
                {bmi < 18.5 && ' (Underweight)'}
                {bmi >= 18.5 && bmi < 25 && ' (Normal weight)'}
                {bmi >= 25 && bmi < 30 && ' (Overweight)'}
                {bmi >= 30 && ' (Obese)'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Note: BMI may not be accurate for athletes with high muscle mass
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {profile?.id ? 'Email managed by authentication system' : 'Not available'}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Created
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {profile?.created_at 
                ? new Date(profile.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                : 'Unknown'
              }
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Updated
            </label>
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {profile?.updated_at 
                ? new Date(profile.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Never'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      {formData.experience_level && (
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-3">Training Insights for {formData.experience_level}s</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {formData.experience_level === 'beginner' && (
              <>
                <p>• Focus on building movement patterns and consistency</p>
                <p>• Sleep quality is especially important during adaptation phase</p>
                <p>• Start with basic supplements: protein powder and multivitamin</p>
              </>
            )}
            {formData.experience_level === 'intermediate' && (
              <>
                <p>• Periodize training with varying intensities</p>
                <p>• Consider creatine and caffeine for performance enhancement</p>
                <p>• Track sleep and recovery metrics more carefully</p>
              </>
            )}
            {formData.experience_level === 'advanced' && (
              <>
                <p>• Fine-tune nutrition timing around training</p>
                <p>• Consider advanced supplements like beetroot and rhodiola</p>
                <p>• Monitor HRV and other biomarkers for optimization</p>
              </>
            )}
            {formData.experience_level === 'professional' && (
              <>
                <p>• Precision in all aspects: training, nutrition, recovery</p>
                <p>• Regular biomarker testing for supplement optimization</p>
                <p>• Consider working with sports scientists and nutritionists</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}