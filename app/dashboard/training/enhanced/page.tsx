'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface TrainingSession {
  id: string
  session_date: string
  session_time: string
  type: string
  duration_minutes: number
  intensity_level: number
  fasted_state: boolean
  pre_workout_meal: string
  post_workout_meal: string
  muscle_groups: string[]
  notes: string
  created_at: string
}

interface TrainingNote {
  id: string
  content: string
  note_type: string
  priority_level: number
  word_count: number
  created_at: string
  tags: TrainingTag[]
}

interface TrainingTag {
  id: string
  name: string
  color: string
  category: string
  usage_count: number
}

interface SessionWithNotes extends TrainingSession {
  session_notes: TrainingNote[]
  session_tags: { tag: TrainingTag }[]
}

export default function EnhancedTrainingPage() {
  const [sessions, setSessions] = useState<SessionWithNotes[]>([])
  const [tags, setTags] = useState<TrainingTag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedSession, setSelectedSession] = useState<SessionWithNotes | null>(null)
  const [showNoteForm, setShowNoteForm] = useState(false)
  const [showTagForm, setShowTagForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

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
    notes: '',
    tags: [] as string[]
  })

  const [newNote, setNewNote] = useState({
    content: '',
    note_type: 'general' as 'pre_workout' | 'during_workout' | 'post_workout' | 'reflection' | 'technique' | 'progress' | 'general',
    priority_level: 3,
    tags: [] as string[]
  })

  const [newTag, setNewTag] = useState({
    name: '',
    color: '#3b82f6',
    category: 'other' as 'technique' | 'equipment' | 'goal' | 'feeling' | 'environment' | 'personal' | 'other',
    description: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchSessionsWithNotes()
    fetchTags()
  }, [])

  const fetchSessionsWithNotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('training_sessions')
        .select(`
          *,
          session_notes:training_session_notes(*),
          session_tags:training_session_tags(
            tag:training_tags(*)
          )
        `)
        .eq('user_id', user.id)
        .order('session_date', { ascending: false })
        .limit(20)

      if (error) throw error
      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTags = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: tagsData, error } = await supabase
        .rpc('get_popular_tags', { p_user_id: user.id, p_limit: 50 })

      if (error) throw error
      
      // Transform the data to match our interface
      const transformedTags = tagsData?.map((tag: any) => ({
        id: tag.tag_id,
        name: tag.tag_name,
        color: tag.tag_color,
        category: tag.category,
        usage_count: tag.usage_count
      })) || []
      
      setTags(transformedTags)
    } catch (error) {
      console.error('Error fetching tags:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Create the training session
      const { data: sessionData, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          ...formData,
          user_id: user.id,
          muscle_groups: formData.muscle_groups
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // Add tags to the session
      if (formData.tags.length > 0) {
        const tagInserts = formData.tags.map(tagId => ({
          training_session_id: sessionData.id,
          tag_id: tagId
        }))

        await supabase
          .from('training_session_tags')
          .insert(tagInserts)
      }

      // Add initial note if provided
      if (formData.notes.trim()) {
        await supabase
          .from('training_session_notes')
          .insert({
            training_session_id: sessionData.id,
            content: formData.notes,
            note_type: 'general'
          })
      }

      setShowForm(false)
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
        notes: '',
        tags: []
      })
      fetchSessionsWithNotes()
    } catch (error) {
      console.error('Error adding session:', error)
    }
  }

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return

    try {
      const { data: noteData, error: noteError } = await supabase
        .from('training_session_notes')
        .insert({
          training_session_id: selectedSession.id,
          content: newNote.content,
          note_type: newNote.note_type,
          priority_level: newNote.priority_level
        })
        .select()
        .single()

      if (noteError) throw noteError

      // Add tags to the note
      if (newNote.tags.length > 0) {
        const tagInserts = newNote.tags.map(tagId => ({
          note_id: noteData.id,
          tag_id: tagId
        }))

        await supabase
          .from('training_note_tags')
          .insert(tagInserts)
      }

      setShowNoteForm(false)
      setNewNote({
        content: '',
        note_type: 'general',
        priority_level: 3,
        tags: []
      })
      fetchSessionsWithNotes()
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('training_tags')
        .insert({
          ...newTag,
          created_by: user.id
        })

      if (error) throw error

      setShowTagForm(false)
      setNewTag({
        name: '',
        color: '#3b82f6',
        category: 'other',
        description: ''
      })
      fetchTags()
    } catch (error) {
      console.error('Error creating tag:', error)
    }
  }

  const toggleTag = (tagId: string, isSessionTag: boolean = true) => {
    if (isSessionTag) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.includes(tagId) 
          ? prev.tags.filter(id => id !== tagId)
          : [...prev.tags, tagId]
      }))
    } else {
      setNewNote(prev => ({
        ...prev,
        tags: prev.tags.includes(tagId)
          ? prev.tags.filter(id => id !== tagId)
          : [...prev.tags, tagId]
      }))
    }
  }

  const getTagsByCategory = (category: string) => {
    return tags.filter(tag => tag.category === category)
  }

  const getNoteTypeIcon = (type: string) => {
    const icons = {
      pre_workout: '🏃',
      during_workout: '💪',
      post_workout: '✅',
      reflection: '🤔',
      technique: '📐',
      progress: '📈',
      general: '📝'
    }
    return icons[type as keyof typeof icons] || '📝'
  }

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      session.notes.toLowerCase().includes(searchLower) ||
      session.type.toLowerCase().includes(searchLower) ||
      session.muscle_groups.some(mg => mg.toLowerCase().includes(searchLower)) ||
      session.session_notes.some(note => note.content.toLowerCase().includes(searchLower)) ||
      session.session_tags.some(st => st.tag.name.toLowerCase().includes(searchLower))
    )
  })

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-gray-900 dark:text-white">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Enhanced Training Log</h1>
          <p className="text-gray-600 dark:text-gray-300">Track sessions with detailed notes and tags</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/dashboard/training"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            Basic View
          </Link>
          <Link 
            href="/dashboard/training/templates"
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center"
          >
            <span className="mr-2">📋</span>
            Templates
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {showForm ? 'Cancel' : 'Log Session'}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search sessions, notes, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowTagForm(!showTagForm)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            New Tag
          </button>
        </div>
      </div>

      {/* Tag Categories */}
      <div className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Popular Tags</h3>
        <div className="space-y-3">
          {['feeling', 'goal', 'technique', 'equipment'].map(category => {
            const categoryTags = getTagsByCategory(category)
            if (categoryTags.length === 0) return null
            
            return (
              <div key={category}>
                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.slice(0, 8).map(tag => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: tag.color + '20', 
                        color: tag.color,
                        border: `1px solid ${tag.color}40`
                      }}
                    >
                      {tag.name}
                      <span className="ml-1 text-xs opacity-60">({tag.usage_count})</span>
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Training Sessions */}
      <div className="space-y-4">
        {filteredSessions.map((session) => (
          <div key={session.id} className="bg-white dark:bg-white/10 rounded-lg border border-gray-200 dark:border-white/20 overflow-hidden">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
              onClick={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {new Date(session.session_date).toLocaleDateString()} - {session.type}
                    </h3>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {session.duration_minutes} min
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Intensity: {session.intensity_level}/10
                    </span>
                  </div>
                  
                  {/* Session Tags */}
                  {session.session_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {session.session_tags.map((st) => (
                        <span
                          key={st.tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{ 
                            backgroundColor: st.tag.color + '20', 
                            color: st.tag.color,
                            border: `1px solid ${st.tag.color}40`
                          }}
                        >
                          {st.tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Session Notes Count */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                    <span>📝 {session.session_notes.length} notes</span>
                    {session.muscle_groups.length > 0 && (
                      <span>💪 {session.muscle_groups.join(', ')}</span>
                    )}
                    {session.fasted_state && <span>🍽️ Fasted</span>}
                  </div>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedSession(session)
                    setShowNoteForm(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Expanded Session Details */}
            {selectedSession?.id === session.id && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-black/20">
                <div className="space-y-4">
                  {/* Session Notes */}
                  {session.session_notes.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Session Notes</h4>
                      <div className="space-y-3">
                        {session.session_notes.map((note) => (
                          <div key={note.id} className="bg-white dark:bg-white/10 rounded-lg p-4 border border-gray-200 dark:border-white/20">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{getNoteTypeIcon(note.note_type)}</span>
                                <span className="font-medium text-gray-900 dark:text-white capitalize">
                                  {note.note_type.replace('_', ' ')}
                                </span>
                                {note.priority_level > 3 && (
                                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded">
                                    High Priority
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {note.word_count} words • {new Date(note.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Session Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Time:</span> {session.session_time}
                    </div>
                    {session.pre_workout_meal && (
                      <div>
                        <span className="font-medium">Pre-workout:</span> {session.pre_workout_meal}
                      </div>
                    )}
                    {session.post_workout_meal && (
                      <div>
                        <span className="font-medium">Post-workout:</span> {session.post_workout_meal}
                      </div>
                    )}
                    {session.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Original Notes:</span> {session.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSessions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No training sessions found. Start by logging your first session!</p>
        </div>
      )}

      {/* Create Session Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log New Training Session</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.session_date}
                    onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.session_time}
                    onChange={(e) => setFormData({ ...formData, session_time: e.target.value })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="strength">Strength</option>
                    <option value="endurance">Endurance</option>
                    <option value="mixed">Mixed</option>
                    <option value="recovery">Recovery</option>
                  </select>
                </div>
              </div>

              {/* Tags Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tags</label>
                <div className="space-y-3">
                  {['feeling', 'goal', 'technique', 'equipment', 'environment'].map(category => {
                    const categoryTags = getTagsByCategory(category)
                    if (categoryTags.length === 0) return null
                    
                    return (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 capitalize">{category}</h4>
                        <div className="flex flex-wrap gap-2">
                          {categoryTags.map(tag => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all ${
                                formData.tags.includes(tag.id)
                                  ? 'ring-2 ring-offset-2'
                                  : 'opacity-70 hover:opacity-100'
                              }`}
                              style={{ 
                                backgroundColor: tag.color + (formData.tags.includes(tag.id) ? '' : '20'), 
                                color: formData.tags.includes(tag.id) ? 'white' : tag.color,
                                border: `1px solid ${tag.color}`,
                                '--tw-ring-color': tag.color
                              } as React.CSSProperties}
                            >
                              {tag.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Session Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Session Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={4}
                  placeholder="How did the session go? Any observations, achievements, or areas for improvement..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Note Form */}
      {showNoteForm && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add Note to Session</h2>
            </div>
            <form onSubmit={handleAddNote} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note Type</label>
                  <select
                    value={newNote.note_type}
                    onChange={(e) => setNewNote({ ...newNote, note_type: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="pre_workout">Pre-Workout</option>
                    <option value="during_workout">During Workout</option>
                    <option value="post_workout">Post-Workout</option>
                    <option value="reflection">Reflection</option>
                    <option value="technique">Technique</option>
                    <option value="progress">Progress</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={newNote.priority_level}
                    onChange={(e) => setNewNote({ ...newNote, priority_level: parseInt(e.target.value) })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={1}>Low</option>
                    <option value={2}>Below Normal</option>
                    <option value={3}>Normal</option>
                    <option value={4}>Important</option>
                    <option value={5}>Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Note Content</label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={6}
                  placeholder="Write your note here..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNoteForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Tag Form */}
      {showTagForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Tag</h2>
            </div>
            <form onSubmit={handleCreateTag} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={newTag.name}
                  onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., Heavy Day, New PR, Form Focus"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
                  <input
                    type="color"
                    value={newTag.color}
                    onChange={(e) => setNewTag({ ...newTag, color: e.target.value })}
                    className="w-full h-10 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={newTag.category}
                    onChange={(e) => setNewTag({ ...newTag, category: e.target.value as any })}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="technique">Technique</option>
                    <option value="equipment">Equipment</option>
                    <option value="goal">Goal</option>
                    <option value="feeling">Feeling</option>
                    <option value="environment">Environment</option>
                    <option value="personal">Personal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (optional)</label>
                <textarea
                  value={newTag.description}
                  onChange={(e) => setNewTag({ ...newTag, description: e.target.value })}
                  className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  rows={2}
                  placeholder="When do you use this tag?"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTagForm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Create Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}