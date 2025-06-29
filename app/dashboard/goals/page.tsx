'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Goal {
  id: string
  title: string
  description: string
  specific: string
  measurable: string
  achievable: string
  relevant: string
  time_bound: string
  category: string
  priority: string
  target_value: number
  target_unit: string
  current_value: number
  progress_percentage: number
  status: string
  completion_date: string | null
  is_habit: boolean
  habit_frequency: string | null
  current_streak: number
  best_streak: number
  created_at: string
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  category: string
  earned_date: string
  points: number
}

interface GoalTemplate {
  id: string
  name: string
  description: string
  category: string
  template_data: any
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [templates, setTemplates] = useState<GoalTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<GoalTemplate | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active')
  
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    time_bound: '',
    category: 'performance',
    priority: 'medium',
    target_value: 0,
    target_unit: '',
    is_habit: false,
    habit_frequency: 'daily',
    motivation_note: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchGoalsData()
  }, [])

  const fetchGoalsData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Fetch user achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_date,
          achievements (
            name,
            description,
            icon,
            category,
            points
          )
        `)
        .eq('user_id', user.id)
        .order('earned_date', { ascending: false })

      // Fetch goal templates
      const { data: templatesData } = await supabase
        .from('goal_templates')
        .select('*')
        .eq('is_public', true)
        .order('usage_count', { ascending: false })

      setGoals(goalsData || [])
      setAchievements(achievementsData?.map((ua: any) => ({
        id: ua.id,
        name: ua.achievements.name,
        description: ua.achievements.description,
        icon: ua.achievements.icon,
        category: ua.achievements.category,
        points: ua.achievements.points,
        earned_date: ua.earned_date
      })) || [])
      setTemplates(templatesData || [])
    } catch (error) {
      console.error('Error fetching goals data:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const goalData = {
        ...newGoal,
        user_id: user.id,
        target_value: parseFloat(newGoal.target_value.toString()),
        time_bound: newGoal.time_bound || null
      }

      const { error } = await supabase
        .from('goals')
        .insert([goalData])

      if (error) throw error

      setShowCreateForm(false)
      setSelectedTemplate(null)
      setNewGoal({
        title: '',
        description: '',
        specific: '',
        measurable: '',
        achievable: '',
        relevant: '',
        time_bound: '',
        category: 'performance',
        priority: 'medium',
        target_value: 0,
        target_unit: '',
        is_habit: false,
        habit_frequency: 'daily',
        motivation_note: ''
      })
      fetchGoalsData()
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      const { error } = await supabase
        .rpc('update_goal_progress', {
          p_goal_id: goalId,
          p_new_value: newValue,
          p_note: 'Manual progress update',
          p_data_source: 'manual'
        })

      if (error) throw error
      fetchGoalsData()
    } catch (error) {
      console.error('Error updating goal progress:', error)
    }
  }

  const handleUseTemplate = (template: GoalTemplate) => {
    const templateData = template.template_data
    setNewGoal({
      title: template.name,
      description: template.description,
      specific: templateData.specific || '',
      measurable: templateData.measurable || '',
      achievable: templateData.achievable || '',
      relevant: templateData.relevant || '',
      time_bound: '',
      category: templateData.category || 'performance',
      priority: templateData.priority || 'medium',
      target_value: templateData.target_value || 0,
      target_unit: templateData.target_unit || '',
      is_habit: templateData.is_habit || false,
      habit_frequency: templateData.habit_frequency || 'daily',
      motivation_note: ''
    })
    setSelectedTemplate(template)
    setShowCreateForm(true)
  }

  const filteredGoals = goals.filter(goal => {
    switch (activeTab) {
      case 'active':
        return goal.status === 'active'
      case 'completed':
        return goal.status === 'completed'
      default:
        return true
    }
  })

  const totalPoints = achievements.reduce((sum, achievement) => sum + achievement.points, 0)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training': return '🏋️'
      case 'sleep': return '😴'
      case 'recovery': return '🧘'
      case 'nutrition': return '🥗'
      case 'supplements': return '💊'
      case 'performance': return '⚡'
      case 'lifestyle': return '🌟'
      default: return '🎯'
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading goals...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Goal Setting & Achievement</h1>
          <p className="text-gray-300">SMART goals for performance optimization</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          + New Goal
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            <div>
              <p className="text-white font-semibold">{goals.length}</p>
              <p className="text-gray-300 text-sm">Total Goals</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="text-white font-semibold">{goals.filter(g => g.status === 'completed').length}</p>
              <p className="text-gray-300 text-sm">Completed</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🔥</span>
            <div>
              <p className="text-white font-semibold">{Math.max(...goals.map(g => g.current_streak), 0)}</p>
              <p className="text-gray-300 text-sm">Best Streak</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
          <div className="flex items-center">
            <span className="text-2xl mr-3">🏆</span>
            <div>
              <p className="text-white font-semibold">{totalPoints}</p>
              <p className="text-gray-300 text-sm">Achievement Points</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {achievements.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Achievements 🏆</h2>
          <div className="flex flex-wrap gap-3">
            {achievements.slice(0, 5).map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
              >
                <span className="mr-2">{achievement.icon}</span>
                <span className="font-medium">{achievement.name}</span>
                <span className="ml-2 text-xs">+{achievement.points}pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goal Templates */}
      {!showCreateForm && templates.length > 0 && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Start Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.slice(0, 6).map((template) => (
              <div
                key={template.id}
                onClick={() => handleUseTemplate(template)}
                className="bg-white/5 rounded-lg p-4 cursor-pointer hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="flex items-start">
                  <span className="text-xl mr-3">{getCategoryIcon(template.category)}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-white">{template.name}</h3>
                    <p className="text-gray-300 text-sm mt-1">{template.description}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded capitalize">
                      {template.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white">
              {selectedTemplate ? `Create Goal from "${selectedTemplate.name}"` : 'Create New Goal'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setSelectedTemplate(null)
              }}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Goal Title</label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="What do you want to achieve?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="performance">Performance</option>
                <option value="training">Training</option>
                <option value="sleep">Sleep</option>
                <option value="recovery">Recovery</option>
                <option value="nutrition">Nutrition</option>
                <option value="supplements">Supplements</option>
                <option value="lifestyle">Lifestyle</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                rows={2}
                placeholder="Brief description of your goal"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Specific (What exactly?)</label>
              <input
                type="text"
                value={newGoal.specific}
                onChange={(e) => setNewGoal({ ...newGoal, specific: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="What exactly will you accomplish?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Measurable (How tracked?)</label>
              <input
                type="text"
                value={newGoal.measurable}
                onChange={(e) => setNewGoal({ ...newGoal, measurable: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="How will you measure progress?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Achievable (Is it realistic?)</label>
              <input
                type="text"
                value={newGoal.achievable}
                onChange={(e) => setNewGoal({ ...newGoal, achievable: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="Why is this goal realistic?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Relevant (Why important?)</label>
              <input
                type="text"
                value={newGoal.relevant}
                onChange={(e) => setNewGoal({ ...newGoal, relevant: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="Why is this goal important to you?"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Date</label>
              <input
                type="date"
                value={newGoal.time_bound}
                onChange={(e) => setNewGoal({ ...newGoal, time_bound: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Priority</label>
              <select
                value={newGoal.priority}
                onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Target Value</label>
              <input
                type="number"
                value={newGoal.target_value}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                placeholder="225"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Unit</label>
              <input
                type="text"
                value={newGoal.target_unit}
                onChange={(e) => setNewGoal({ ...newGoal, target_unit: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                placeholder="lbs, hours, %, etc."
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={newGoal.is_habit}
                onChange={(e) => setNewGoal({ ...newGoal, is_habit: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm text-gray-300">This is a habit/recurring goal</label>
            </div>
            
            {newGoal.is_habit && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Frequency</label>
                <select
                  value={newGoal.habit_frequency}
                  onChange={(e) => setNewGoal({ ...newGoal, habit_frequency: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-1">Motivation Note</label>
              <textarea
                value={newGoal.motivation_note}
                onChange={(e) => setNewGoal({ ...newGoal, motivation_note: e.target.value })}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400"
                rows={2}
                placeholder="Why is this goal important to you? What will achieving it mean?"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowCreateForm(false)
                setSelectedTemplate(null)
              }}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createGoal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals Tabs */}
      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {[
          { key: 'active', label: 'Active Goals', count: goals.filter(g => g.status === 'active').length },
          { key: 'completed', label: 'Completed', count: goals.filter(g => g.status === 'completed').length },
          { key: 'all', label: 'All Goals', count: goals.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-2 px-4 rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => (
          <div key={goal.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{getCategoryIcon(goal.category)}</span>
                  <h3 className="text-lg font-semibold text-white">{goal.title}</h3>
                  {goal.is_habit && <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">HABIT</span>}
                  <span className={`text-xs px-2 py-1 rounded capitalize ${getPriorityColor(goal.priority)}`}>
                    {goal.priority}
                  </span>
                </div>
                {goal.description && (
                  <p className="text-gray-300 text-sm mb-2">{goal.description}</p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-300">
                  <div><strong>Specific:</strong> {goal.specific}</div>
                  <div><strong>Measurable:</strong> {goal.measurable}</div>
                  <div><strong>Achievable:</strong> {goal.achievable}</div>
                  <div><strong>Relevant:</strong> {goal.relevant}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {goal.current_value}{goal.target_unit}
                </div>
                <div className="text-sm text-gray-300">
                  of {goal.target_value}{goal.target_unit}
                </div>
                <div className="text-sm text-gray-300">
                  Due: {new Date(goal.time_bound).toLocaleDateString()}
                </div>
                {goal.current_streak > 0 && (
                  <div className="text-sm text-orange-400">
                    🔥 {goal.current_streak} day streak
                  </div>
                )}
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-1">
                <span>Progress</span>
                <span>{goal.progress_percentage}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    goal.progress_percentage >= 100 ? 'bg-green-500' :
                    goal.progress_percentage >= 75 ? 'bg-blue-500' :
                    goal.progress_percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Quick Progress Update */}
            {goal.status === 'active' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">Quick update:</span>
                <input
                  type="number"
                  placeholder={`Current: ${goal.current_value}`}
                  className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm w-24"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const value = parseFloat((e.target as HTMLInputElement).value)
                      if (!isNaN(value)) {
                        updateGoalProgress(goal.id, value)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
                <span className="text-sm text-gray-300">{goal.target_unit}</span>
              </div>
            )}
            
            {goal.status === 'completed' && goal.completion_date && (
              <div className="text-sm text-green-400">
                ✅ Completed on {new Date(goal.completion_date).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}
        
        {filteredGoals.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-lg font-medium text-white mb-2">
              {activeTab === 'active' ? 'No active goals' : 
               activeTab === 'completed' ? 'No completed goals yet' : 
               'No goals created yet'}
            </h3>
            <p className="text-gray-300 mb-4">
              {activeTab === 'active' ? 'Create your first goal to start tracking progress!' : 
               activeTab === 'completed' ? 'Complete some goals to see them here.' : 
               'Get started by creating your first SMART goal.'}
            </p>
            {activeTab !== 'completed' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Create Your First Goal
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}