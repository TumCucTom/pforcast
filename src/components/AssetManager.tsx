'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Calendar, TrendingUp } from 'lucide-react'
import { DEFAULT_ASSETS } from '@/lib/defaults'

interface Asset {
  id: string
  name: string
  type: 'CASH' | 'SAVINGS' | 'PROPERTY' | 'EQUITY' | 'BONDS' | 'OTHER'
  value: number
  annualReturn: number
  returnType: 'FIXED' | 'INFLATION_LINKED'
  annualDividend: number
  dividendStartDate: string | null
  dividendEndDate: string | null
  isDividendTaxed: boolean
  saleDate: string | null
}

export default function AssetManager() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    type: 'CASH' as 'CASH' | 'SAVINGS' | 'PROPERTY' | 'EQUITY' | 'BONDS' | 'OTHER',
    value: '',
    annualReturn: '0',
    returnType: 'FIXED' as 'FIXED' | 'INFLATION_LINKED',
    annualDividend: '0',
    dividendStartDate: '',
    dividendEndDate: '',
    isDividendTaxed: true,
    saleDate: '',
  })

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.name.trim()) {
      alert('Please enter an asset name')
      return
    }
    
    const value = parseFloat(formData.value)
    if (!formData.value || isNaN(value)) {
      alert('Please enter a valid asset value')
      return
    }
    
    const annualReturn = parseFloat(formData.annualReturn)
    if (isNaN(annualReturn)) {
      alert('Please enter a valid annual return')
      return
    }
    
    const annualDividend = parseFloat(formData.annualDividend)
    if (annualDividend < 0) {
      alert('Annual dividend cannot be negative')
      return
    }
    
    // Validate dividend start date if provided
    if (formData.dividendStartDate) {
      const startDate = new Date(formData.dividendStartDate + 'T00:00:00.000Z')
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
      
      if (startDate < today) {
        alert('Dividend start date cannot be in the past. Leave blank for immediate dividends or set a future date.')
        return
      }
    }
    
    // Validate dividend end date if provided
    if (formData.dividendEndDate) {
      const endDate = new Date(formData.dividendEndDate + 'T00:00:00.000Z')
      const startDate = formData.dividendStartDate ? new Date(formData.dividendStartDate + 'T00:00:00.000Z') : new Date()
      
      if (endDate <= startDate) {
        alert('Dividend end date must be after the start date')
        return
      }
    }
    
    // Validate sale date if provided
    if (formData.saleDate) {
      const saleDate = new Date(formData.saleDate + 'T00:00:00.000Z')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (saleDate < today) {
        alert('Sale date cannot be in the past')
        return
      }
    }
    
    const payload = {
      ...formData,
      value: value,
      annualReturn: annualReturn,
      annualDividend: annualDividend,
      dividendStartDate: formData.dividendStartDate || null,
      dividendEndDate: formData.dividendEndDate || null,
      saleDate: formData.saleDate || null,
    }

    console.log('Submitting asset payload:', payload)

    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets'
      const method = editingAsset ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Asset saved successfully:', result)
        setShowForm(false)
        setEditingAsset(null)
        resetForm()
        fetchAssets()
      } else {
        const errorData = await response.json()
        console.error('Failed to save asset:', errorData)
        
        // Show user-friendly error message
        if (errorData.details && Array.isArray(errorData.details)) {
          alert(`Validation errors:\n${errorData.details.join('\n')}`)
        } else if (errorData.error) {
          alert(`Error: ${errorData.error}`)
        } else {
          alert('Failed to save asset. Please check your input and try again.')
        }
      }
    } catch (error) {
      console.error('Error saving asset:', error)
      alert('Network error. Please try again.')
    }
  }

  const handleEdit = (asset: Asset) => {
    console.log('Editing asset:', asset)
    
    // Convert date strings to YYYY-MM-DD format for HTML date inputs
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return ''
      try {
        // Handle potential timezone issues by parsing the date more carefully
        const date = new Date(dateString)
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString)
          return ''
        }
        // Use local date to avoid timezone issues
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
      } catch (error) {
        console.error('Error formatting date:', error)
        return ''
      }
    }
    
    setEditingAsset(asset)
    setFormData({
      name: asset.name,
      type: asset.type,
      value: asset.value.toString(),
      annualReturn: asset.annualReturn.toString(),
      returnType: asset.returnType,
      annualDividend: asset.annualDividend.toString(),
      dividendStartDate: formatDateForInput(asset.dividendStartDate),
      dividendEndDate: formatDateForInput(asset.dividendEndDate),
      isDividendTaxed: asset.isDividendTaxed,
      saleDate: formatDateForInput(asset.saleDate),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this asset?')) return

    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchAssets()
      }
    } catch (error) {
      console.error('Error deleting asset:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CASH',
      value: '',
      annualReturn: '0',
      returnType: 'FIXED',
      annualDividend: '0',
      dividendStartDate: '',
      dividendEndDate: '',
      isDividendTaxed: true,
      saleDate: '',
    })
  }

  const addDefaultAsset = async (asset: typeof DEFAULT_ASSETS[0]) => {
    const payload = {
      name: asset.name,
      type: asset.type,
      value: asset.value,
      annualReturn: asset.annualReturn,
      annualDividend: asset.annualDividend,
      returnType: 'FIXED' as const,
      dividendStartDate: null,
      dividendEndDate: null,
      isDividendTaxed: true,
      saleDate: null,
    }

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        fetchAssets()
      } else {
        console.error('Failed to add default asset:', response.statusText)
      }
    } catch (error) {
      console.error('Error adding default asset:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
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
        <h2 className="text-2xl font-bold text-gray-900">Assets</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Asset
        </button>
      </div>

      {/* Summary - Added to top */}
      {assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, a) => sum + a.value, 0))}
              </div>
              <div className="text-sm text-gray-600">Total Asset Value</div>
              <div className="text-xs text-gray-500">(Negative assets reduce total)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {assets.length}
              </div>
              <div className="text-sm text-gray-600">Total Assets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(assets.reduce((sum, a) => sum + (a.value * a.annualReturn / 100), 0))}
              </div>
              <div className="text-sm text-gray-600">Annual Returns</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(assets.filter(a => a.type === 'CASH').reduce((sum, a) => sum + a.value, 0))}
              </div>
              <div className="text-sm text-gray-600">Cash</div>
            </div>
          </div>
        </div>
      )}

      {/* Default Assets */}
      {assets.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Start</h3>
          <p className="text-blue-700 mb-4">
            Add some common asset types to get started with your portfolio:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {DEFAULT_ASSETS.map((asset, index) => (
              <button
                key={index}
                onClick={() => addDefaultAsset(asset)}
                className="text-left p-3 bg-white border border-blue-200 rounded-md hover:bg-blue-50"
              >
                <div className="font-medium text-blue-900">{asset.name}</div>
                <div className="text-sm text-blue-600">
                  {formatCurrency(asset.value)} {asset.type.toLowerCase()}
                </div>
                <div className="text-xs text-blue-500">
                  {asset.annualReturn}% return, {asset.annualDividend}% dividend
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Asset Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingAsset ? 'Edit Asset' : 'Add New Asset'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Asset['type'] })}
                  className="w-full"
                >
                  <option value="CASH">Cash</option>
                  <option value="SAVINGS">Savings</option>
                  <option value="PROPERTY">Property</option>
                  <option value="EQUITY">Equity</option>
                  <option value="BONDS">Bonds</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value (use negative for liabilities like mortgages - these reduce total asset value)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Return (%) (use negative for assets that fall in value)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.annualReturn}
                  onChange={(e) => setFormData({ ...formData, annualReturn: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Type
                </label>
                <select
                  value={formData.returnType}
                  onChange={(e) => setFormData({ ...formData, returnType: e.target.value as 'FIXED' | 'INFLATION_LINKED' })}
                  className="w-full"
                >
                  <option value="FIXED">Fixed</option>
                  <option value="INFLATION_LINKED">Inflation Linked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Dividend (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.annualDividend}
                  onChange={(e) => setFormData({ ...formData, annualDividend: e.target.value })}
                  className="w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dividend Start Date (Optional - Leave blank if dividends are already being paid, or set future date for future dividends)
                </label>
                <input
                  type="date"
                  value={formData.dividendStartDate}
                  onChange={(e) => {
                    console.log('Dividend start date changed:', e.target.value)
                    console.log('Event target:', e.target)
                    console.log('Form data before:', formData.dividendStartDate)
                    setFormData({ ...formData, dividendStartDate: e.target.value })
                    console.log('Form data after:', e.target.value)
                  }}
                  onFocus={(e) => console.log('Dividend start date focused:', e.target.value)}
                  onBlur={(e) => console.log('Dividend start date blurred:', e.target.value)}
                  className="w-full"
                />
                <button
                  type="button"
                  onClick={() => {
                    console.log('Current dividend start date:', formData.dividendStartDate)
                    console.log('Setting test date...')
                    setFormData({ ...formData, dividendStartDate: '2024-12-31' })
                  }}
                  className="mt-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  Set Test Date (2024-12-31)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dividend End Date (Optional - Leave empty for perpetual dividends)
                </label>
                <input
                  type="date"
                  value={formData.dividendEndDate}
                  onChange={(e) => {
                    console.log('Dividend end date changed:', e.target.value)
                    setFormData({ ...formData, dividendEndDate: e.target.value })
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dividend Taxed
                </label>
                <select
                  value={formData.isDividendTaxed ? 'yes' : 'no'}
                  onChange={(e) => setFormData({ ...formData, isDividendTaxed: e.target.value === 'yes' })}
                  className="w-full"
                >
                  <option value="yes">Taxed</option>
                  <option value="no">Tax Free</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sale Date (Optional - Asset will be sold and converted to cash on this date)
                </label>
                <input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => {
                    console.log('Sale date changed:', e.target.value)
                    setFormData({ ...formData, saleDate: e.target.value })
                  }}
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingAsset(null)
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
                {editingAsset ? 'Update' : 'Add'} Asset
              </button>
            </div>
            
            {/* Debug display */}
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Debug - Current Form Data:</strong><br/>
              Dividend Start: "{formData.dividendStartDate}"<br/>
              Dividend End: "{formData.dividendEndDate}"<br/>
              Sale Date: "{formData.saleDate}"<br/>
              Annual Dividend: {formData.annualDividend}%
            </div>
          </form>
        </div>
      )}

      {/* Assets Table */}
      {assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Return
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dividend
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{asset.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(asset.value)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.annualReturn}% {asset.returnType === 'INFLATION_LINKED' ? '+ inflation' : 'fixed'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {asset.annualDividend}%
                        <span className="ml-2 text-xs text-gray-500">
                          {asset.isDividendTaxed ? 'Taxed' : 'Tax Free'}
                        </span>
                      </div>
                      {asset.dividendStartDate && (
                        <div className="text-xs text-gray-500">
                          from {new Date(asset.dividendStartDate).toLocaleDateString()}
                        </div>
                      )}
                      {asset.dividendEndDate && (
                        <div className="text-xs text-gray-500">
                          to {new Date(asset.dividendEndDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {asset.saleDate ? (
                        <div className="text-xs text-gray-500">
                          {new Date(asset.saleDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">Not for sale</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(asset)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(asset.id)}
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
    </div>
  )
} 