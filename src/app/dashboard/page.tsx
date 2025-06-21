'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  PiggyBank, 
  Settings, 
  LogOut,
  Plus,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import ExpenseManager from '@/components/ExpenseManager'
import IncomeManager from '@/components/IncomeManager'
import AssetManager from '@/components/AssetManager'
import ProjectionCharts from '@/components/ProjectionCharts'
import SettingsManager from '@/components/SettingsManager'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Summary {
  currentMonth: {
    totalIncome: number
    totalExpenses: number
    netIncome: number
    tax: number
    cashFlow: number
    investmentIncome: number
  }
  totalAssetValue: number
  assetBreakdown: Record<string, number>
  cashFlowIssues: number
  inflationRate: number
  projection?: { month: string; totalIncome: number; totalExpenses: number }[]
}

export default function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/projection', { credentials: 'include' })
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/')
          return
        }
        throw new Error('Failed to fetch data')
      }
      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear cookie and redirect
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
    router.push('/')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(Math.round(amount))
  }

  const handleQuickAction = (tab: string) => {
    setActiveTab(tab)
  }

  const formatChartData = (projection: any[]) => {
    return projection.map(item => ({
      ...item,
      month: new Date(item.month).getFullYear().toString(),
      totalIncome: Math.round(item.totalIncome),
      totalExpenses: Math.round(item.totalExpenses)
    }))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your financial data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">PForcast</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Eye },
              { id: 'expenses', name: 'Expenses', icon: DollarSign },
              { id: 'income', name: 'Income', icon: TrendingUp },
              { id: 'assets', name: 'Assets', icon: PiggyBank },
              { id: 'projections', name: 'Projections', icon: BarChart3 },
              { id: 'settings', name: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary.currentMonth.totalIncome)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Monthly Expenses</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary.currentMonth.totalExpenses)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                    <p className={`text-2xl font-semibold ${
                      summary.currentMonth.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.currentMonth.cashFlow)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <PiggyBank className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Assets</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {formatCurrency(summary.totalAssetValue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Income vs Expenses Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={formatChartData(summary.projection || [])} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" minTickGap={24} />
                  <YAxis tickFormatter={v => `£${v.toLocaleString()}`}/>
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`}/>
                  <Legend />
                  <Line type="monotone" dataKey="totalIncome" stroke="#10B981" name="Income" dot={false} strokeWidth={2} />
                  <Line type="monotone" dataKey="totalExpenses" stroke="#EF4444" name="Expenses" dot={false} strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => handleQuickAction('expenses')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </button>
                <button 
                  onClick={() => handleQuickAction('income')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </button>
                <button 
                  onClick={() => handleQuickAction('assets')}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </button>
              </div>
            </div>

            {/* Alerts */}
            {summary.cashFlowIssues > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Cash Flow Warning
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You have {summary.cashFlowIssues} months with negative cash flow in your projection.
                        Consider reviewing your expenses or increasing your income.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <ExpenseManager />
        )}

        {activeTab === 'income' && (
          <IncomeManager />
        )}

        {activeTab === 'assets' && (
          <AssetManager />
        )}

        {activeTab === 'projections' && (
          <ProjectionCharts />
        )}

        {activeTab === 'settings' && (
          <SettingsManager />
        )}
      </div>
    </div>
  )
} 