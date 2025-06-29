'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface WorkoutTemplate {
  id: string
  name: string
  description: string
  category: string
  duration_minutes: number
  difficulty_level: string
  rating_avg: number
  usage_count: number
  exercise_count: number
  equipment_needed: string[]
  muscle_groups: string[]
  tags: string[]
  created_by: string
}

interface TemplateExercise {
  id: string
  exercise_name: string
  exercise_category: string
  order_index: number
  sets: number
  reps: string
  rest_seconds: number
  tempo: string
  rpe_target: number
  notes: string
}

export default function WorkoutTemplatesPage() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null)
  const [templateExercises, setTemplateExercises] = useState<TemplateExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [savedTemplates, setSavedTemplates] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
    fetchSavedTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const { data: templatesData, error } = await supabase
        .rpc('get_popular_templates', { p_limit: 50 })

      if (error) throw error
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: saved } = await supabase
        .from('user_saved_templates')
        .select('template_id')
        .eq('user_id', user.id)

      if (saved) {
        setSavedTemplates(new Set(saved.map(s => s.template_id)))
      }
    } catch (error) {
      console.error('Error fetching saved templates:', error)
    }
  }

  const fetchTemplateDetails = async (templateId: string) => {
    try {
      const [templateResponse, exercisesResponse] = await Promise.all([
        supabase
          .from('workout_templates')
          .select('*')
          .eq('id', templateId)
          .single(),
        supabase
          .from('workout_template_exercises')
          .select('*')
          .eq('template_id', templateId)
          .order('order_index')
      ])

      if (templateResponse.error) throw templateResponse.error
      if (exercisesResponse.error) throw exercisesResponse.error

      setSelectedTemplate(templateResponse.data)
      setTemplateExercises(exercisesResponse.data || [])
    } catch (error) {
      console.error('Error fetching template details:', error)
    }
  }

  const toggleSaveTemplate = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (savedTemplates.has(templateId)) {
        await supabase
          .from('user_saved_templates')
          .delete()
          .eq('user_id', user.id)
          .eq('template_id', templateId)
        
        setSavedTemplates(prev => {
          const newSet = new Set(prev)
          newSet.delete(templateId)
          return newSet
        })
      } else {
        await supabase
          .from('user_saved_templates')
          .insert({ user_id: user.id, template_id: templateId })
        
        setSavedTemplates(prev => new Set(prev).add(templateId))
      }
    } catch (error) {
      console.error('Error toggling saved template:', error)
    }
  }

  const handleUseTemplate = async (template: WorkoutTemplate) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Record template usage
      await supabase.rpc('use_template', {
        p_template_id: template.id,
        p_user_id: user.id
      })

      // Redirect to create training session with template data
      const templateData = {
        name: `${template.name} - ${new Date().toLocaleDateString()}`,
        type: template.category,
        duration_minutes: template.duration_minutes,
        template_id: template.id,
        exercises: templateExercises
      }

      localStorage.setItem('workout_template_data', JSON.stringify(templateData))
      window.location.href = '/dashboard/training?from_template=true'
    } catch (error) {
      console.error('Error using template:', error)
    }
  }

  const filteredTemplates = templates.filter(template => {
    const categoryMatch = filterCategory === 'all' || template.category === filterCategory
    const difficultyMatch = filterDifficulty === 'all' || template.difficulty_level === filterDifficulty
    return categoryMatch && difficultyMatch
  })

  const getCategoryIcon = (category: string) => {
    const icons = {
      strength: '💪',
      cardio: '❤️',
      mobility: '🤸',
      conditioning: '🔥',
      sport_specific: '⚽',
      recovery: '🧘',
      combination: '🔄'
    }
    return icons[category as keyof typeof icons] || '💪'
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      advanced: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[difficulty as keyof typeof colors] || colors.intermediate
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900 dark:text-white">Loading templates...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workout Templates</h1>
          <p className="text-gray-600 dark:text-gray-300">Evidence-based workout plans from Dr. Galpin and the community</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/dashboard/training" 
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Training
          </Link>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Template
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="strength">Strength</option>
              <option value="cardio">Cardio</option>
              <option value="mobility">Mobility</option>
              <option value="conditioning">Conditioning</option>
              <option value="sport_specific">Sport Specific</option>
              <option value="recovery">Recovery</option>
              <option value="combination">Combination</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="expert">Expert</option>
            </select>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getCategoryIcon(template.category)}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{template.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-1 text-xs rounded capitalize ${getDifficultyColor(template.difficulty_level)}`}>
                      {template.difficulty_level}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSaveTemplate(template.id)}
                  className={`p-2 rounded-full transition-colors ${
                    savedTemplates.has(template.id) 
                      ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
                  }`}
                >
                  <svg className="h-5 w-5" fill={savedTemplates.has(template.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">{template.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>⏱️ {template.duration_minutes} min</span>
                <span>📊 {template.exercise_count} exercises</span>
                <div className="flex items-center">
                  <span>⭐ {template.rating_avg.toFixed(1)}</span>
                  <span className="ml-2">({template.usage_count} uses)</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => fetchTemplateDetails(template.id)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm transition-colors"
                >
                  Use Template
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No templates found matching your filters.</p>
        </div>
      )}

      {/* Template Details Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTemplate.name}</h2>
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{selectedTemplate.description}</p>
                </div>
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Template Info</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Duration:</strong> {selectedTemplate.duration_minutes} minutes</div>
                    <div><strong>Difficulty:</strong> {selectedTemplate.difficulty_level}</div>
                    <div><strong>Category:</strong> {selectedTemplate.category}</div>
                    <div><strong>Rating:</strong> ⭐ {selectedTemplate.rating_avg.toFixed(1)} ({selectedTemplate.usage_count} uses)</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Equipment & Focus</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Equipment:</strong> {selectedTemplate.equipment_needed?.join(', ') || 'None specified'}</div>
                    <div><strong>Muscle Groups:</strong> {selectedTemplate.muscle_groups?.join(', ') || 'Full body'}</div>
                    <div><strong>Tags:</strong> {selectedTemplate.tags?.join(', ') || 'None'}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Workout Plan</h3>
                <div className="space-y-3">
                  {templateExercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {index + 1}. {exercise.exercise_name}
                          </h4>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-300">
                            {exercise.sets && <div><strong>Sets:</strong> {exercise.sets}</div>}
                            {exercise.reps && <div><strong>Reps:</strong> {exercise.reps}</div>}
                            {exercise.rest_seconds && <div><strong>Rest:</strong> {Math.floor(exercise.rest_seconds / 60)}:{(exercise.rest_seconds % 60).toString().padStart(2, '0')}</div>}
                            {exercise.rpe_target && <div><strong>RPE:</strong> {exercise.rpe_target}/10</div>}
                          </div>
                          {exercise.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">{exercise.notes}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedTemplate(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Use This Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}