'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit3, Save, X } from 'lucide-react'

interface Classification {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME'
  color?: string
}

interface Budget {
  id: string
  inflationRate: number
  projectEndDate?: string
}

export default function SettingsManager() {
  const [inflation, setInflation] = useState(2.5)
  const [projectEndDate, setProjectEndDate] = useState('')
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [editingClassification, setEditingClassification] = useState<string | null>(null)
  const [newClassification, setNewClassification] = useState<{ name: string; type: 'EXPENSE' | 'INCOME'; color: string }>({ 
    name: '', 
    type: 'EXPENSE', 
    color: '#3B82F6' 
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [budgetResponse, classificationsResponse] = await Promise.all([
        fetch('/api/budget'),
        fetch('/api/classifications')
      ])
      
      if (budgetResponse.ok) {
        const budgetData = await budgetResponse.json()
        setInflation(budgetData.inflationRate)
        setProjectEndDate(budgetData.projectEndDate || '')
      }
      
      if (classificationsResponse.ok) {
        const classificationsData = await classificationsResponse.json()
        setClassifications(classificationsData)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInflationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInflation(parseFloat(e.target.value))
    setSuccess(false)
  }

  const handleProjectEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProjectEndDate(e.target.value)
    setSuccess(false)
  }

  const handleSaveInflation = async () => {
    setIsSaving(true)
    setSuccess(false)
    try {
      const response = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inflationRate: inflation,
          projectEndDate: projectEndDate || null
        }),
      })
      if (response.ok) {
        setSuccess(true)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddClassification = async () => {
    if (!newClassification.name.trim()) return
    
    try {
      const response = await fetch('/api/classifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClassification),
      })
      
      if (response.ok) {
        const newClass = await response.json()
        setClassifications([...classifications, newClass])
        setNewClassification({ name: '', type: 'EXPENSE', color: '#3B82F6' })
      }
    } catch (error) {
      console.error('Error adding classification:', error)
    }
  }

  const handleUpdateClassification = async (id: string, updates: Partial<Classification>) => {
    try {
      const response = await fetch(`/api/classifications/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      
      if (response.ok) {
        setClassifications(classifications.map(c => 
          c.id === id ? { ...c, ...updates } : c
        ))
        setEditingClassification(null)
      }
    } catch (error) {
      console.error('Error updating classification:', error)
    }
  }

  const handleDeleteClassification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classification?')) return
    
    try {
      const response = await fetch(`/api/classifications/${id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setClassifications(classifications.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting classification:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Inflation Rate Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Inflation Rate Assumption</label>
            <div className="flex items-center space-x-4 mb-4">
              <input
                type="range"
                min={0}
                max={10}
                step={0.25}
                value={inflation}
                onChange={handleInflationChange}
                className="w-full"
              />
              <span className="text-lg font-bold text-blue-700 min-w-[60px]">{inflation.toFixed(2)}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Project End Date</label>
            <input
              type="date"
              value={projectEndDate}
              onChange={handleProjectEndDateChange}
              className="w-full"
              placeholder="Select end date for projections"
            />
            <p className="text-sm text-gray-500 mt-1">Leave empty to use default 30-year projection</p>
          </div>
        </div>

        <button
          onClick={handleSaveInflation}
          disabled={isSaving}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
        {success && <div className="mt-2 text-green-600">Saved!</div>}
      </div>

      {/* Classifications Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Classifications</h3>
        <p className="text-sm text-gray-600 mb-6">
          Create classifications to organize your income and expenses. If no classifications are created, 
          everything will be grouped under "My Total Budget".
        </p>

        {/* Add New Classification */}
        <div className="border border-gray-200 rounded-lg p-4 mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Add New Classification</h4>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newClassification.name}
                onChange={(e) => setNewClassification({ ...newClassification, name: e.target.value })}
                className="w-full"
                placeholder="e.g., Housing, Transportation"
              />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={newClassification.type}
                onChange={(e) => setNewClassification({ ...newClassification, type: e.target.value as 'EXPENSE' | 'INCOME' })}
                className="w-full"
              >
                <option value="EXPENSE">Expense</option>
                <option value="INCOME">Income</option>
              </select>
            </div>
            <div className="min-w-[100px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="color"
                value={newClassification.color}
                onChange={(e) => setNewClassification({ ...newClassification, color: e.target.value })}
                className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
              />
            </div>
            <button
              onClick={handleAddClassification}
              disabled={!newClassification.name.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </button>
          </div>
        </div>

        {/* Existing Classifications */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900">Existing Classifications</h4>
          {classifications.length === 0 ? (
            <p className="text-gray-500 italic">No classifications created yet.</p>
          ) : (
            classifications.map((classification) => (
              <div key={classification.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: classification.color }}
                  />
                  <span className="font-medium">{classification.name}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    classification.type === 'EXPENSE' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {classification.type}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {editingClassification === classification.id ? (
                    <>
                      <input
                        type="text"
                        defaultValue={classification.name}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement
                            handleUpdateClassification(classification.id, { name: target.value })
                          }
                        }}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => setEditingClassification(null)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingClassification(classification.id)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClassification(classification.id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
} 