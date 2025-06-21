'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Eye } from 'lucide-react'
import { format } from 'date-fns'

interface Classification {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME'
  color?: string
}

interface Expense {
  id: string
  name: string
  amount: number
  frequency: 'MONTHLY' | 'ANNUAL'
  classificationId?: string
  classification?: Classification
}

interface Income {
  id: string
  name: string
  amount: number
  frequency: 'MONTHLY' | 'ANNUAL'
  classificationId?: string
  classification?: Classification
}

interface Asset {
  id: string
  name: string
  type: string
  value: number
}

interface ClassificationSummary {
  classification: Classification | null
  totalAmount: number
  itemCount: number
  items: (Expense | Income)[]
}

interface AssetTypeSummary {
  type: string
  totalValue: number
  assetCount: number
  assets: Asset[]
}

export default function ProjectionTables() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [incomes, setIncomes] = useState<Income[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [classifications, setClassifications] = useState<Classification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedClassifications, setExpandedClassifications] = useState<Set<string>>(new Set())
  const [expandedAssetTypes, setExpandedAssetTypes] = useState<Set<string>>(new Set())
  const [projection, setProjection] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchProjection()
  }, [selectedMonth])

  const fetchData = async () => {
    try {
      const [expensesRes, incomesRes, assetsRes, classificationsRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/incomes'),
        fetch('/api/assets'),
        fetch('/api/classifications')
      ])

      if (expensesRes.ok) setExpenses(await expensesRes.json())
      if (incomesRes.ok) setIncomes(await incomesRes.json())
      if (assetsRes.ok) setAssets(await assetsRes.json())
      if (classificationsRes.ok) setClassifications(await classificationsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProjection = async () => {
    try {
      const res = await fetch(`/api/projection?month=${selectedMonth}`)
      if (res.ok) {
        const data = await res.json()
        setProjection(data.projection)
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching projection:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  const convertToMonthly = (amount: number, frequency: 'MONTHLY' | 'ANNUAL') => {
    return frequency === 'ANNUAL' ? Math.round(amount / 12) : Math.round(amount)
  }

  const getClassificationSummary = (): ClassificationSummary[] => {
    const summary: { [key: string]: ClassificationSummary } = {}
    
    // Initialize with "My Total Budget" for items without classification
    summary['unclassified'] = {
      classification: null,
      totalAmount: 0,
      itemCount: 0,
      items: []
    }

    // Add classifications
    classifications.forEach(classification => {
      summary[classification.id] = {
        classification,
        totalAmount: 0,
        itemCount: 0,
        items: []
      }
    })

    // Process expenses
    expenses.forEach(expense => {
      const monthlyAmount = convertToMonthly(expense.amount, expense.frequency)
      const key = expense.classificationId || 'unclassified'
      
      if (summary[key]) {
        summary[key].totalAmount += monthlyAmount
        summary[key].itemCount += 1
        summary[key].items.push(expense)
      }
    })

    // Process incomes
    incomes.forEach(income => {
      const monthlyAmount = convertToMonthly(income.amount, income.frequency)
      const key = income.classificationId || 'unclassified'
      
      if (summary[key]) {
        summary[key].totalAmount += monthlyAmount
        summary[key].itemCount += 1
        summary[key].items.push(income)
      }
    })

    return Object.values(summary).filter(s => s.itemCount > 0)
  }

  const getAssetTypeSummary = (): AssetTypeSummary[] => {
    const summary: { [key: string]: AssetTypeSummary } = {}
    
    assets.forEach(asset => {
      if (!summary[asset.type]) {
        summary[asset.type] = {
          type: asset.type,
          totalValue: 0,
          assetCount: 0,
          assets: []
        }
      }
      
      summary[asset.type].totalValue += asset.value
      summary[asset.type].assetCount += 1
      summary[asset.type].assets.push(asset)
    })

    return Object.values(summary)
  }

  const toggleClassificationExpansion = (classificationId: string | null) => {
    const key = classificationId || 'unclassified'
    const newExpanded = new Set(expandedClassifications)
    if (newExpanded.has(key)) {
      newExpanded.delete(key)
    } else {
      newExpanded.add(key)
    }
    setExpandedClassifications(newExpanded)
  }

  const toggleAssetTypeExpansion = (assetType: string) => {
    const newExpanded = new Set(expandedAssetTypes)
    if (newExpanded.has(assetType)) {
      newExpanded.delete(assetType)
    } else {
      newExpanded.add(assetType)
    }
    setExpandedAssetTypes(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading projection tables...</p>
        </div>
      </div>
    )
  }

  const classificationSummary = getClassificationSummary()
  const assetTypeSummary = getAssetTypeSummary()

  return (
    <div className="space-y-8">
      {/* Month Selector */}
      <div className="flex items-center space-x-4 mb-4">
        <label htmlFor="month" className="text-sm font-medium text-gray-700">Select Month:</label>
        <input
          id="month"
          type="month"
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
        {summary && (
          <span className="text-sm text-gray-500">Showing data for: {format(new Date(summary.selectedMonth + '-01'), 'MMMM yyyy')}</span>
        )}
      </div>
      {/* Table 1: Expenses and Income by Classification */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Expenses and Income by Classification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classificationSummary.map((summary) => {
                const isExpanded = expandedClassifications.has(summary.classification?.id || 'unclassified')
                const classificationName = summary.classification?.name || 'My Total Budget'
                const classificationType = summary.classification?.type || 'MIXED'
                
                return (
                  <>
                    <tr key={summary.classification?.id || 'unclassified'} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleClassificationExpansion(summary.classification?.id || null)}
                            className="mr-2 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <div className="flex items-center">
                            {summary.classification?.color && (
                              <div 
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: summary.classification.color }}
                              />
                            )}
                            <span className="font-medium text-gray-900">{classificationName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          classificationType === 'EXPENSE' 
                            ? 'bg-red-100 text-red-800' 
                            : classificationType === 'INCOME'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {classificationType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(summary.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.itemCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => toggleClassificationExpansion(summary.classification?.id || null)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            {summary.items.map((item) => (
                              <div key={item.id} className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-600">{item.name}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(convertToMonthly(item.amount, item.frequency))}
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({item.frequency.toLowerCase()})
                                  </span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2: Asset Values by Asset Type */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Asset Values by Asset Type</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assetTypeSummary.map((summary) => {
                const isExpanded = expandedAssetTypes.has(summary.type)
                
                return (
                  <>
                    <tr key={summary.type} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleAssetTypeExpansion(summary.type)}
                            className="mr-2 text-gray-400 hover:text-gray-600"
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                          <span className="font-medium text-gray-900">{summary.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(summary.totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {summary.assetCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => toggleAssetTypeExpansion(summary.type)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {isExpanded ? 'Hide Details' : 'Show Details'}
                        </button>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            {summary.assets.map((asset) => (
                              <div key={asset.id} className="flex justify-between items-center py-1">
                                <span className="text-sm text-gray-600">{asset.name}</span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatCurrency(asset.value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
} 