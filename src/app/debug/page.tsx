'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DetailedMonthlyProjection {
  month: string
  totalIncome: number
  totalIncomeBeforeTax: number
  totalIncomeAfterTax: number
  totalExpenses: number
  netIncome: number
  tax: number
  cashFlow: number
  investmentIncome: number
  cashValue: number
  expenseBreakdown: { [expenseId: string]: { name: string; amount: number; classification?: string } }
  incomeBreakdown: { [incomeId: string]: { name: string; amount: number; classification?: string } }
  assetBreakdown: { [assetId: string]: { name: string; value: number; monthlyReturn: number; monthlyDividend: number; isSold: boolean } }
}

interface DebugData {
  detailedProjection: DetailedMonthlyProjection[]
  summary: {
    inflationRate: number
    totalMonths: number
  }
}

export default function DebugPage() {
  const [data, setData] = useState<DebugData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  useEffect(() => {
    fetchDebugData()
  }, [])

  const fetchDebugData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/debug/projection')
      if (!response.ok) {
        throw new Error('Failed to fetch debug data')
      }
      const debugData = await response.json()
      setData(debugData)
      
      // Set first month as default selected
      if (debugData.detailedProjection.length > 0) {
        setSelectedMonth(debugData.detailedProjection[0].month)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount)
  }

  const selectedMonthData = data?.detailedProjection.find(p => p.month === selectedMonth)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading debug data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-semibold">Error</h2>
            <p className="text-red-600 mt-2">{error}</p>
            <button
              onClick={fetchDebugData}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug: Monthly Calculations</h1>
          <p className="text-gray-600">
            Detailed breakdown of monthly net income calculations including all expenses, income, and investment income
          </p>
          {data && (
            <div className="mt-4 flex gap-4 text-sm text-gray-500">
              <span>Inflation Rate: {data.summary.inflationRate}%</span>
              <span>Projection Period: {data.summary.totalMonths} months</span>
            </div>
          )}
          <div className="mt-4">
            <button
              onClick={fetchDebugData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {data && (
          <>
            {/* Month Selector */}
            <div className="mb-6">
              <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Month:
              </label>
              <select
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {data.detailedProjection.map((projection) => (
                  <option key={projection.month} value={projection.month}>
                    {format(new Date(projection.month), 'MMMM yyyy')}
                  </option>
                ))}
              </select>
            </div>

            {selectedMonthData && (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Income (After Tax)</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedMonthData.totalIncomeAfterTax)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(selectedMonthData.totalExpenses)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
                    <p className={`text-2xl font-bold ${selectedMonthData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedMonthData.netIncome)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-sm font-medium text-gray-500">Cash Flow</h3>
                    <p className={`text-2xl font-bold ${selectedMonthData.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(selectedMonthData.cashFlow)}
                    </p>
                  </div>
                </div>

                {/* Cash Value Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Value Over Time</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.detailedProjection} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="month" 
                        minTickGap={24}
                        tickFormatter={(value) => format(new Date(value), 'MMM yyyy')}
                      />
                      <YAxis tickFormatter={v => `£${v.toLocaleString()}`}/>
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip 
                        formatter={(v: number) => `£${v.toLocaleString()}`}
                        labelFormatter={(value) => format(new Date(value), 'MMMM yyyy')}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="cashValue" 
                        stroke="#10B981" 
                        name="Cash Value" 
                        dot={false} 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Breakdowns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Income Breakdown */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Income Breakdown</h3>
                      <p className="text-sm text-gray-500">Total (After Tax): {formatCurrency(selectedMonthData.totalIncomeAfterTax)}</p>
                    </div>
                    <div className="p-6">
                      {Object.entries(selectedMonthData.incomeBreakdown).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(selectedMonthData.incomeBreakdown).map(([id, income]) => (
                            <div key={id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <div>
                                <p className="font-medium text-gray-900">{income.name}</p>
                                {income.classification && (
                                  <p className="text-sm text-gray-500">{income.classification}</p>
                                )}
                              </div>
                              <p className="font-semibold text-green-600">{formatCurrency(income.amount)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No income data for this month</p>
                      )}
                    </div>
                  </div>

                  {/* Expense Breakdown */}
                  <div className="bg-white rounded-lg shadow">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
                      <p className="text-sm text-gray-500">Total: {formatCurrency(selectedMonthData.totalExpenses)}</p>
                    </div>
                    <div className="p-6">
                      {Object.entries(selectedMonthData.expenseBreakdown).length > 0 ? (
                        <div className="space-y-3">
                          {Object.entries(selectedMonthData.expenseBreakdown).map(([id, expense]) => (
                            <div key={id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <div>
                                <p className="font-medium text-gray-900">{expense.name}</p>
                                {expense.classification && (
                                  <p className="text-sm text-gray-500">{expense.classification}</p>
                                )}
                              </div>
                              <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">No expense data for this month</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Investment Income and Assets */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Investment Income & Assets</h3>
                    <p className="text-sm text-gray-500">
                      Total Investment Income: {formatCurrency(selectedMonthData.investmentIncome)}
                    </p>
                  </div>
                  <div className="p-6">
                    {Object.entries(selectedMonthData.assetBreakdown).length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Asset
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Value
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monthly Return
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monthly Dividend
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(selectedMonthData.assetBreakdown).map(([id, asset]) => (
                              <tr key={id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {asset.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(asset.value)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(asset.monthlyReturn)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(asset.monthlyDividend)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    asset.isSold 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
                                    {asset.isSold ? 'Sold' : 'Active'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No asset data for this month</p>
                    )}
                  </div>
                </div>

                {/* Tax Calculation */}
                <div className="bg-white rounded-lg shadow">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Tax Calculation</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Gross Income (Before Tax)</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(selectedMonthData.totalIncomeBeforeTax)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tax Amount</p>
                        <p className="text-lg font-semibold text-red-600">
                          {formatCurrency(selectedMonthData.tax)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Net Income After Tax</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(selectedMonthData.totalIncomeAfterTax)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 