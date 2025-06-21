'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { format } from 'date-fns'

interface ProjectionPoint {
  month: string
  totalIncome: number
  totalExpenses: number
  netIncome: number
  tax: number
  cashFlow: number
  assetValue: number
  cash: number
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function ProjectionCharts() {
  const [data, setData] = useState<ProjectionPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [assetBreakdown, setAssetBreakdown] = useState<any[]>([])

  useEffect(() => {
    fetchProjection()
  }, [])

  const fetchProjection = async () => {
    try {
      const response = await fetch('/api/projection')
      if (response.ok) {
        const { projection, summary } = await response.json()
        const chartData = projection.map((p: any) => ({
          month: format(new Date(p.month), 'MMM yyyy'),
          totalIncome: p.totalIncome,
          totalExpenses: p.totalExpenses,
          netIncome: p.netIncome,
          tax: p.tax,
          cashFlow: p.cashFlow,
          assetValue: Object.values(p.assetValues).reduce((sum: number, v: any) => sum + (typeof v === 'number' ? v : 0), 0),
          cash: Object.entries(p.assetValues).find(([k]) => k.toLowerCase().includes('cash'))?.[1] || 0,
        }))
        setData(chartData)

        // Create asset breakdown for pie chart
        if (summary.assetBreakdown) {
          const breakdown = Object.entries(summary.assetBreakdown).map(([type, value]) => ({
            name: type,
            value: Math.abs(value as number),
            color: COLORS[Object.keys(summary.assetBreakdown).indexOf(type) % COLORS.length]
          })).filter(item => item.value > 0)
          setAssetBreakdown(breakdown)
        }
      }
    } catch (error) {
      console.error('Error fetching projection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading charts...</div>
  }

  return (
    <div className="space-y-8">
      {/* Cash Flow Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="month" minTickGap={24} />
            <YAxis tickFormatter={v => `£${v.toLocaleString()}`}/>
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`}/>
            <Area type="monotone" dataKey="cash" stroke="#3B82F6" fillOpacity={1} fill="url(#colorCash)" name="Cash Asset" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Value Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Total Asset Value Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" minTickGap={24} />
            <YAxis tickFormatter={v => `£${v.toLocaleString()}`}/>
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`}/>
            <Legend />
            <Line type="monotone" dataKey="assetValue" stroke="#6366F1" name="Total Assets" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Income vs Expenses Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Income vs Expenses</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="month" minTickGap={24} />
            <YAxis tickFormatter={v => `£${v.toLocaleString()}`}/>
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`}/>
            <Legend />
            <Line type="monotone" dataKey="totalIncome" stroke="#10B981" name="Income" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="totalExpenses" stroke="#EF4444" name="Expenses" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="netIncome" stroke="#F59E0B" name="Net Income" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Asset Breakdown Pie Chart */}
      {assetBreakdown.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Asset Allocation</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `£${v.toLocaleString()}`}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Monthly Income</h4>
          <p className="text-2xl font-bold text-green-600">
            £{data[0]?.totalIncome.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Monthly Expenses</h4>
          <p className="text-2xl font-bold text-red-600">
            £{data[0]?.totalExpenses.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Current Net Cash Flow</h4>
          <p className={`text-2xl font-bold ${data[0]?.cashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            £{data[0]?.cashFlow.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Total Asset Value</h4>
          <p className="text-2xl font-bold text-blue-600">
            £{data[0]?.assetValue.toLocaleString() || '0'}
          </p>
        </div>
      </div>
    </div>
  )
} 