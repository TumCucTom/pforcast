'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react'
import { DEFAULT_INCOMES } from '@/lib/defaults'

interface Income {
  id: string
  name: string
  amount: number
  frequency: 'MONTHLY' | 'ANNUAL'
  startDate: string | null
  endDate: string | null
  increaseType: 'FIXED' | 'INFLATION_LINKED'
  increaseRate: number
  classificationId: string | null
  classification?: {
    id: string
    name: string
    color: string
  }
}

interface Classification {
  id: string
  name: string
  type: 'INCOME'
  color: string
}

export default function IncomeManager() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingIncome, setEditingIncome] = useState<Income | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'MONTHLY' as 'MONTHLY' | 'ANNUAL',
    startDate: '',
    endDate: '',
    increaseType: 'FIXED' as 'FIXED' | 'INFLATION_LINKED',
    increaseRate: '0',
    classificationId: '',
  })

  useEffect(() => {
    fetchIncomes()
    fetchClassifications()
  }, [])

  const fetchIncomes = async () => {
    try {
      const response = await fetch('/api/incomes')
      if (response.ok) {
        const data = await response.json()
        setIncomes(data)
      }
    } catch (error) {
      console.error('Error fetching incomes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassifications = async () => {
    try {
      const response = await fetch('/api/classifications?type=INCOME')
      if (response.ok) {
        const data = await response.json()
        setClassifications(data)
      }
    } catch (error) {
      console.error('Error fetching classifications:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      increaseRate: parseFloat(formData.increaseRate),
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      classificationId: formData.classificationId || null,
    }

    try {
      const url = editingIncome ? `/api/incomes/${editingIncome.id}` : '/api/incomes'
      const method = editingIncome ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setShowForm(false)
        setEditingIncome(null)
        resetForm()
        fetchIncomes()
      }
    } catch (error) {
      console.error('Error saving income:', error)
    }
  }

  const handleEdit = (income: Income) => {
    setEditingIncome(income)
    setFormData({
      name: income.name,
      amount: income.amount.toString(),
      frequency: income.frequency,
      startDate: income.startDate || '',
      endDate: income.endDate || '',
      increaseType: income.increaseType,
      increaseRate: income.increaseRate.toString(),
      classificationId: income.classificationId || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income?')) return

    try {
      const response = await fetch(`/api/incomes/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchIncomes()
      }
    } catch (error) {
      console.error('Error deleting income:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency: 'MONTHLY',
      startDate: '',
      endDate: '',
      increaseType: 'FIXED',
      increaseRate: '0',
      classificationId: '',
    })
  }

  const addDefaultIncome = async (income: typeof DEFAULT_INCOMES[0]) => {
    const payload = {
      name: income.name,
      amount: income.amount,
      frequency: income.frequency,
      startDate: null,
      endDate: null,
      increaseType: 'FIXED' as const,
      increaseRate: 0,
      classificationId: null,
    }

    try {
      const response = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchIncomes()
      } else {
        console.error('Failed to add default income:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding default income:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const getMonthlyAmount = (income: Income) => {
    return income.frequency === 'ANNUAL' ? income.amount / 12 : income.amount
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Income</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Income
        </button>
      </div>

      {/* Default Incomes */}
      {incomes.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Start</h3>
          <p className="text-blue-700 mb-4">
            Add some common income sources to get started:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {DEFAULT_INCOMES.map((income, index) => (
              <button
                key={index}
                onClick={() => addDefaultIncome(income)}
                className="text-left p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-50"
              >
                <div className="font-medium text-blue-900">{income.name}</div>
                <div className="text-sm text-blue-600">
                  {formatCurrency(income.amount)} {income.frequency.toLowerCase()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Income Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingIncome ? 'Edit Income' : 'Add New Income'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Income Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'MONTHLY' | 'ANNUAL' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classification
                </label>
                <select
                  value={formData.classificationId}
                  onChange={(e) => setFormData({ ...formData, classificationId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Classification</option>
                  {classifications.map((classification) => (
                    <option key={classification.id} value={classification.id}>
                      {classification.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Increase Type
                </label>
                <select
                  value={formData.increaseType}
                  onChange={(e) => setFormData({ ...formData, increaseType: e.target.value as 'FIXED' | 'INFLATION_LINKED' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FIXED">Fixed Percentage</option>
                  <option value="INFLATION_LINKED">Inflation Linked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Increase Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.increaseRate}
                  onChange={(e) => setFormData({ ...formData, increaseRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingIncome(null)
                  resetForm()
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingIncome ? 'Update' : 'Add'} Income
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Incomes Table */}
      {incomes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Growth
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incomes.map((income) => (
                  <tr key={income.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{income.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(income.amount)}
                      </div>
                      <div className="text-xs text-gray-500">{income.frequency.toLowerCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(getMonthlyAmount(income))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {income.classification ? (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: `${income.classification.color}20`, color: income.classification.color }}
                        >
                          {income.classification.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {income.increaseRate}% {income.increaseType === 'INFLATION_LINKED' ? '+ inflation' : 'fixed'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {income.startDate ? (
                          <div className="flex items-center text-xs text-gray-500">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(income.startDate).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">Ongoing</span>
                        )}
                      </div>
                      {income.endDate && (
                        <div className="text-xs text-gray-500">
                          to {new Date(income.endDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(income)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary */}
      {incomes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(incomes.reduce((sum, e) => sum + getMonthlyAmount(e), 0))}
              </div>
              <div className="text-sm text-gray-600">Total Monthly Income</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {incomes.length}
              </div>
              <div className="text-sm text-gray-600">Total Income Sources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(incomes.reduce((sum, e) => sum + e.amount, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Annual Income</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 