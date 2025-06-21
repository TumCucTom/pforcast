'use client'

import { useState, useEffect } from 'react'

export default function InflationSlider() {
  const [inflation, setInflation] = useState(2.5)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchBudget()
  }, [])

  const fetchBudget = async () => {
    try {
      const response = await fetch('/api/budget')
      if (response.ok) {
        const data = await response.json()
        setInflation(data.inflationRate)
      }
    } catch (error) {
      // fallback to default
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInflation(parseFloat(e.target.value))
    setSuccess(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess(false)
    try {
      const response = await fetch('/api/budget', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inflationRate: inflation }),
      })
      if (response.ok) {
        setSuccess(true)
      }
    } catch (error) {
      // handle error
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-4 text-gray-500">Loading inflation settings...</div>
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-xl mx-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Inflation Rate Assumption</h3>
      <div className="flex items-center space-x-4 mb-4">
        <input
          type="range"
          min={0}
          max={10}
          step={0.25}
          value={inflation}
          onChange={handleChange}
          className="w-full"
        />
        <span className="text-lg font-bold text-blue-700">{inflation.toFixed(2)}%</span>
      </div>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {isSaving ? 'Saving...' : 'Save Inflation Rate'}
      </button>
      {success && <div className="mt-2 text-green-600">Saved!</div>}
    </div>
  )
} 