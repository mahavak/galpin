'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface ExportData {
  profile: any
  training_sessions: any[]
  sleep_records: any[]
  recovery_sessions: any[]
  user_supplements: any[]
  supplement_intake_logs: any[]
  goals: any[]
  goal_progress_logs: any[]
  user_achievements: any[]
}

export default function ExportPage() {
  const [loading, setLoading] = useState(false)
  const [exportData, setExportData] = useState<ExportData | null>(null)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importStatus, setImportStatus] = useState<string>('')
  const [dataStats, setDataStats] = useState({
    training_sessions: 0,
    sleep_records: 0,
    recovery_sessions: 0,
    goals: 0,
    supplements: 0
  })

  const supabase = createClient()

  useEffect(() => {
    fetchDataStats()
  }, [])

  const fetchDataStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [training, sleep, recovery, goals, supplements] = await Promise.all([
        supabase.from('training_sessions').select('id').eq('user_id', user.id),
        supabase.from('sleep_records').select('id').eq('user_id', user.id),
        supabase.from('recovery_sessions').select('id').eq('user_id', user.id),
        supabase.from('goals').select('id').eq('user_id', user.id),
        supabase.from('user_supplements').select('id').eq('user_id', user.id)
      ])

      setDataStats({
        training_sessions: training.data?.length || 0,
        sleep_records: sleep.data?.length || 0,
        recovery_sessions: recovery.data?.length || 0,
        goals: goals.data?.length || 0,
        supplements: supplements.data?.length || 0
      })
    } catch (error) {
      console.error('Error fetching data stats:', error)
    }
  }

  const exportAllData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch all user data
      const [
        profile,
        trainingSessions,
        sleepRecords,
        recoverySessions,
        userSupplements,
        supplementIntakeLogs,
        goals,
        goalProgressLogs,
        userAchievements
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('training_sessions').select('*').eq('user_id', user.id),
        supabase.from('sleep_records').select('*').eq('user_id', user.id),
        supabase.from('recovery_sessions').select('*').eq('user_id', user.id),
        supabase.from('user_supplements').select(`
          *,
          supplements (name, category, description, default_dosage, timing_recommendations)
        `).eq('user_id', user.id),
        supabase.from('supplement_intake_logs').select('*').eq('user_id', user.id),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('goal_progress_logs').select('*').eq('goal_id', user.id),
        supabase.from('user_achievements').select(`
          *,
          achievements (name, description, icon, category, points)
        `).eq('user_id', user.id)
      ])

      const exportData: ExportData = {
        profile: profile.data,
        training_sessions: trainingSessions.data || [],
        sleep_records: sleepRecords.data || [],
        recovery_sessions: recoverySessions.data || [],
        user_supplements: userSupplements.data || [],
        supplement_intake_logs: supplementIntakeLogs.data || [],
        goals: goals.data || [],
        goal_progress_logs: goalProgressLogs.data || [],
        user_achievements: userAchievements.data || []
      }

      setExportData(exportData)
      
      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `galpin-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = async (tableName: string) => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let data: any[] = []
      let fileName = ''

      switch (tableName) {
        case 'training_sessions':
          const { data: training } = await supabase
            .from('training_sessions')
            .select('*')
            .eq('user_id', user.id)
          data = training || []
          fileName = 'training-sessions'
          break
        
        case 'sleep_records':
          const { data: sleep } = await supabase
            .from('sleep_records')
            .select('*')
            .eq('user_id', user.id)
          data = sleep || []
          fileName = 'sleep-records'
          break
        
        case 'goals':
          const { data: goals } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', user.id)
          data = goals || []
          fileName = 'goals'
          break
        
        case 'recovery_sessions':
          const { data: recovery } = await supabase
            .from('recovery_sessions')
            .select('*')
            .eq('user_id', user.id)
          data = recovery || []
          fileName = 'recovery-sessions'
          break
      }

      if (data.length === 0) {
        alert('No data found for export')
        return
      }

      // Convert to CSV
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header]
            if (value === null || value === undefined) return ''
            if (typeof value === 'string' && value.includes(',')) {
              return `"${value.replace(/"/g, '""')}"`
            }
            return value
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${fileName}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exporting CSV:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImportFile(file)
      setImportStatus('')
    }
  }

  const importData = async () => {
    if (!importFile) return

    setLoading(true)
    setImportStatus('Processing file...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const text = await importFile.text()
      let importData: any

      try {
        importData = JSON.parse(text)
      } catch (error) {
        setImportStatus('Error: Invalid JSON format')
        return
      }

      // Validate data structure
      if (!importData.profile && !importData.training_sessions && !importData.sleep_records) {
        setImportStatus('Error: Invalid data format. Expected Galpin export format.')
        return
      }

      let imported = 0
      let errors = 0

      // Import training sessions
      if (importData.training_sessions && Array.isArray(importData.training_sessions)) {
        setImportStatus('Importing training sessions...')
        for (const session of importData.training_sessions) {
          try {
            const { user_id, id, created_at, ...sessionData } = session
            await supabase
              .from('training_sessions')
              .upsert({ ...sessionData, user_id: user.id })
            imported++
          } catch (error) {
            errors++
          }
        }
      }

      // Import sleep records
      if (importData.sleep_records && Array.isArray(importData.sleep_records)) {
        setImportStatus('Importing sleep records...')
        for (const record of importData.sleep_records) {
          try {
            const { user_id, id, created_at, ...recordData } = record
            await supabase
              .from('sleep_records')
              .upsert({ ...recordData, user_id: user.id })
            imported++
          } catch (error) {
            errors++
          }
        }
      }

      // Import recovery sessions
      if (importData.recovery_sessions && Array.isArray(importData.recovery_sessions)) {
        setImportStatus('Importing recovery sessions...')
        for (const session of importData.recovery_sessions) {
          try {
            const { user_id, id, created_at, ...sessionData } = session
            await supabase
              .from('recovery_sessions')
              .upsert({ ...sessionData, user_id: user.id })
            imported++
          } catch (error) {
            errors++
          }
        }
      }

      // Import goals
      if (importData.goals && Array.isArray(importData.goals)) {
        setImportStatus('Importing goals...')
        for (const goal of importData.goals) {
          try {
            const { user_id, id, created_at, updated_at, ...goalData } = goal
            await supabase
              .from('goals')
              .upsert({ ...goalData, user_id: user.id })
            imported++
          } catch (error) {
            errors++
          }
        }
      }

      setImportStatus(`Import complete! ${imported} records imported successfully${errors > 0 ? `, ${errors} errors` : ''}.`)
      fetchDataStats()
      
    } catch (error) {
      console.error('Error importing data:', error)
      setImportStatus('Error: Failed to import data')
    } finally {
      setLoading(false)
    }
  }

  const generateSampleData = () => {
    const sampleData = {
      profile: {
        full_name: "Sample User",
        sport_type: "Weightlifting",
        experience_level: "intermediate",
        height_cm: 175,
        weight_kg: 75.5
      },
      training_sessions: [
        {
          session_date: "2024-01-15",
          type: "strength",
          duration_minutes: 60,
          intensity_level: 8,
          fasted_state: false,
          muscle_groups: ["chest", "triceps"],
          notes: "Great bench press session"
        }
      ],
      sleep_records: [
        {
          sleep_date: "2024-01-14",
          duration_hours: 7.5,
          quality_score: 8,
          room_temp_celsius: 20.5,
          deep_sleep_hours: 2.1,
          rem_sleep_hours: 1.8
        }
      ],
      goals: [
        {
          title: "Increase Bench Press",
          category: "training",
          specific: "Increase 1RM bench press to 225lbs",
          measurable: "Track weekly max attempts",
          achievable: "Progressive overload with proper form",
          relevant: "Upper body strength for powerlifting",
          time_bound: "2024-06-01",
          target_value: 225,
          target_unit: "lbs",
          priority: "high"
        }
      ]
    }

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'galpin-sample-data.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Data Export & Import</h1>
        <p className="text-gray-300">Backup your data or import from other sources</p>
      </div>

      {/* Data Overview */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">Your Data Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{dataStats.training_sessions}</div>
            <div className="text-sm text-gray-300">Training Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{dataStats.sleep_records}</div>
            <div className="text-sm text-gray-300">Sleep Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{dataStats.recovery_sessions}</div>
            <div className="text-sm text-gray-300">Recovery Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{dataStats.goals}</div>
            <div className="text-sm text-gray-300">Goals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{dataStats.supplements}</div>
            <div className="text-sm text-gray-300">Supplements</div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">📤 Export Data</h2>
        
        <div className="space-y-4">
          {/* Full Export */}
          <div className="border border-white/20 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Complete Data Export (JSON)</h3>
            <p className="text-gray-300 text-sm mb-3">
              Export all your data including profile, training, sleep, recovery, goals, and supplements in JSON format.
              Perfect for complete backups or transferring to another account.
            </p>
            <button
              onClick={exportAllData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Exporting...' : 'Export All Data (JSON)'}
            </button>
          </div>

          {/* CSV Exports */}
          <div className="border border-white/20 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Individual Table Exports (CSV)</h3>
            <p className="text-gray-300 text-sm mb-3">
              Export specific data tables in CSV format for analysis in Excel, Google Sheets, or other tools.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                onClick={() => exportCSV('training_sessions')}
                disabled={loading || dataStats.training_sessions === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Training CSV ({dataStats.training_sessions})
              </button>
              <button
                onClick={() => exportCSV('sleep_records')}
                disabled={loading || dataStats.sleep_records === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Sleep CSV ({dataStats.sleep_records})
              </button>
              <button
                onClick={() => exportCSV('recovery_sessions')}
                disabled={loading || dataStats.recovery_sessions === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Recovery CSV ({dataStats.recovery_sessions})
              </button>
              <button
                onClick={() => exportCSV('goals')}
                disabled={loading || dataStats.goals === 0}
                className="bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm transition-colors"
              >
                Goals CSV ({dataStats.goals})
              </button>
            </div>
          </div>

          {/* Sample Data */}
          <div className="border border-white/20 rounded-lg p-4">
            <h3 className="font-medium text-white mb-2">Sample Data Template</h3>
            <p className="text-gray-300 text-sm mb-3">
              Download a sample data file to see the expected format for imports.
            </p>
            <button
              onClick={generateSampleData}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Download Sample Data
            </button>
          </div>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">📥 Import Data</h2>
        
        <div className="space-y-4">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Galpin Export File (JSON)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          {importFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-1">Selected File:</h4>
              <p className="text-blue-700 text-sm">{importFile.name}</p>
              <p className="text-blue-600 text-xs">Size: {(importFile.size / 1024).toFixed(1)} KB</p>
            </div>
          )}

          {importStatus && (
            <div className={`rounded-lg p-4 ${
              importStatus.includes('Error') ? 'bg-red-50 border border-red-200 text-red-700' :
              importStatus.includes('complete') ? 'bg-green-50 border border-green-200 text-green-700' :
              'bg-blue-50 border border-blue-200 text-blue-700'
            }`}>
              {importStatus}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={importData}
              disabled={!importFile || loading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Importing...' : 'Import Data'}
            </button>
            {importFile && (
              <button
                onClick={() => {
                  setImportFile(null)
                  setImportStatus('')
                }}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Import Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-900 mb-2">⚠️ Import Notes:</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• Only JSON files exported from Galpin Tracker are supported</li>
              <li>• Existing data with matching dates may be overwritten</li>
              <li>• Large imports may take several minutes to complete</li>
              <li>• Always backup your current data before importing</li>
              <li>• User IDs and timestamps will be updated automatically</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Data Portability Info */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
        <h2 className="text-lg font-semibold text-white mb-4">📋 Data Portability</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-white mb-2">What's Included in Exports:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>✅ User profile information</li>
              <li>✅ All training sessions</li>
              <li>✅ Sleep tracking data</li>
              <li>✅ Recovery metrics</li>
              <li>✅ Supplement tracking</li>
              <li>✅ Goals and progress logs</li>
              <li>✅ Achievement history</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-white mb-2">Export Formats:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>🔄 <strong>JSON:</strong> Complete data backup</li>
              <li>📊 <strong>CSV:</strong> Spreadsheet analysis</li>
              <li>📱 <strong>Compatible:</strong> Import/export between accounts</li>
              <li>🔒 <strong>Privacy:</strong> Your data stays with you</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}