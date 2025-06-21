import { addMonths, isAfter, isBefore, startOfMonth } from 'date-fns'

export interface MonthlyProjection {
  month: Date
  totalIncome: number
  totalExpenses: number
  netIncome: number
  tax: number
  cashFlow: number
  assetValues: { [assetId: string]: number }
  investmentIncome: number
}

export interface AssetProjection {
  assetId: string
  name: string
  type: string
  value: number
  monthlyReturn: number
  monthlyDividend: number
  isSold: boolean
}

// UK Tax bands (2024/25) - monthly amounts
const TAX_BANDS = {
  personalAllowance: 12570 / 12, // £12,570 annually
  basicRate: 50270 / 12, // £50,270 annually
  higherRate: 125140 / 12, // £125,140 annually
}

const TAX_RATES = {
  basic: 0.20,
  higher: 0.40,
  additional: 0.45,
}

// Helper function to round to nearest GBP
export function roundToGBP(amount: number): number {
  return Math.round(amount)
}

export function calculateMonthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate / 100, 1 / 12) - 1
}

export function calculateTax(monthlyIncome: number): number {
  let taxableIncome = monthlyIncome - TAX_BANDS.personalAllowance
  if (taxableIncome <= 0) return 0

  let tax = 0

  // Basic rate (20%)
  const basicRateAmount = Math.min(taxableIncome, TAX_BANDS.basicRate - TAX_BANDS.personalAllowance)
  if (basicRateAmount > 0) {
    tax += basicRateAmount * TAX_RATES.basic
    taxableIncome -= basicRateAmount
  }

  // Higher rate (40%)
  const higherRateAmount = Math.min(taxableIncome, TAX_BANDS.higherRate - TAX_BANDS.basicRate)
  if (higherRateAmount > 0) {
    tax += higherRateAmount * TAX_RATES.higher
    taxableIncome -= higherRateAmount
  }

  // Additional rate (45%)
  if (taxableIncome > 0) {
    tax += taxableIncome * TAX_RATES.additional
  }

  return roundToGBP(tax)
}

export function projectExpense(
  baseAmount: number,
  frequency: 'MONTHLY' | 'ANNUAL',
  increaseType: 'FIXED' | 'INFLATION_LINKED',
  increaseRate: number,
  inflationRate: number,
  startDate: Date | null,
  endDate: Date | null,
  projectionDate: Date
): number {
  // Check if expense is active for this month
  if (startDate && isBefore(projectionDate, startDate)) return 0
  if (endDate && isAfter(projectionDate, endDate)) return 0

  // Convert annual to monthly if needed
  let monthlyAmount = frequency === 'ANNUAL' ? baseAmount / 12 : baseAmount

  // Calculate months since start
  const start = startDate || new Date()
  const monthsDiff = (projectionDate.getFullYear() - start.getFullYear()) * 12 + 
                     (projectionDate.getMonth() - start.getMonth())

  if (monthsDiff <= 0) return roundToGBP(monthlyAmount)

  // Apply increase rate
  const effectiveRate = increaseType === 'INFLATION_LINKED' ? inflationRate : increaseRate
  const monthlyRate = calculateMonthlyRate(effectiveRate)
  
  return roundToGBP(monthlyAmount * Math.pow(1 + monthlyRate, monthsDiff))
}

export function projectAsset(
  asset: any,
  inflationRate: number,
  projectionDate: Date,
  previousValue: number
): AssetProjection {
  // Check if asset is sold
  if (asset.saleDate && isAfter(projectionDate, asset.saleDate)) {
    return {
      assetId: asset.id,
      name: asset.name,
      type: asset.type,
      value: 0,
      monthlyReturn: 0,
      monthlyDividend: 0,
      isSold: true,
    }
  }

  // Calculate monthly return rate
  const effectiveReturnRate = asset.returnType === 'INFLATION_LINKED' 
    ? asset.annualReturn + inflationRate 
    : asset.annualReturn
  const monthlyReturnRate = calculateMonthlyRate(effectiveReturnRate)

  // Calculate new value
  const monthlyReturn = previousValue * monthlyReturnRate
  const newValue = previousValue + monthlyReturn

  // Calculate dividend
  let monthlyDividend = 0
  if (asset.annualDividend > 0) {
    const dividendStart = asset.dividendStartDate || new Date()
    const dividendEnd = asset.dividendEndDate || new Date(2100, 0, 1)
    
    if (isAfter(projectionDate, dividendStart) && isBefore(projectionDate, dividendEnd)) {
      monthlyDividend = previousValue * (asset.annualDividend / 100 / 12)
    }
  }

  return {
    assetId: asset.id,
    name: asset.name,
    type: asset.type,
    value: roundToGBP(newValue),
    monthlyReturn: roundToGBP(monthlyReturn),
    monthlyDividend: roundToGBP(monthlyDividend),
    isSold: false,
  }
}

export function generateProjection(
  expenses: any[],
  incomes: any[],
  assets: any[],
  inflationRate: number,
  months: number = 360 // 30 years
): MonthlyProjection[] {
  const projections: MonthlyProjection[] = []
  let currentDate = startOfMonth(new Date())
  let assetValues: { [assetId: string]: number } = {}
  
  // Initialize asset values
  assets.forEach(asset => {
    assetValues[asset.id] = roundToGBP(asset.value)
  })

  for (let i = 0; i < months; i++) {
    const projectionDate = addMonths(currentDate, i)
    
    // Project expenses
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + projectExpense(
        expense.amount,
        expense.frequency,
        expense.increaseType,
        expense.increaseRate,
        inflationRate,
        expense.startDate,
        expense.endDate,
        projectionDate
      )
    }, 0)

    // Project incomes
    const totalIncomes = incomes.reduce((sum, income) => {
      return sum + projectExpense(
        income.amount,
        income.frequency,
        income.increaseType,
        income.increaseRate,
        inflationRate,
        income.startDate,
        income.endDate,
        projectionDate
      )
    }, 0)

    // Project assets and investment income
    let investmentIncome = 0
    const newAssetValues: { [assetId: string]: number } = {}
    
    assets.forEach(asset => {
      const projection = projectAsset(asset, inflationRate, projectionDate, assetValues[asset.id] || 0)
      newAssetValues[asset.id] = projection.value
      
      if (!projection.isSold) {
        investmentIncome += projection.monthlyDividend
      }
    })

    // Calculate total income including investment income
    const totalIncome = totalIncomes + investmentIncome

    // Calculate tax
    const tax = calculateTax(totalIncome)

    // Calculate net income
    const netIncome = totalIncome - tax

    // Calculate cash flow
    const cashFlow = netIncome - totalExpenses

    // Update cash asset
    const cashAsset = assets.find(a => a.type === 'CASH')
    if (cashAsset) {
      newAssetValues[cashAsset.id] = (newAssetValues[cashAsset.id] || 0) + cashFlow
    }

    projections.push({
      month: projectionDate,
      totalIncome: roundToGBP(totalIncome),
      totalExpenses: roundToGBP(totalExpenses),
      netIncome: roundToGBP(netIncome),
      tax: roundToGBP(tax),
      cashFlow: roundToGBP(cashFlow),
      assetValues: Object.fromEntries(
        Object.entries(newAssetValues).map(([key, value]) => [key, roundToGBP(value)])
      ),
      investmentIncome: roundToGBP(investmentIncome),
    })

    assetValues = newAssetValues
  }

  return projections
}

// New function to calculate total annual income correctly
export function calculateTotalAnnualIncome(incomes: any[]): number {
  return incomes.reduce((total, income) => {
    if (income.frequency === 'ANNUAL') {
      return total + income.amount
    } else {
      // MONTHLY frequency
      return total + (income.amount * 12)
    }
  }, 0)
} 