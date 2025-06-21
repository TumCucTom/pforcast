export const DEFAULT_EXPENSES = [
  { name: 'Rent', amount: 1200, frequency: 'MONTHLY' as const },
  { name: 'Mortgage', amount: 1500, frequency: 'MONTHLY' as const },
  { name: 'Utility Bills', amount: 200, frequency: 'MONTHLY' as const },
  { name: 'Council Tax', amount: 150, frequency: 'MONTHLY' as const },
  { name: 'Broadband', amount: 50, frequency: 'MONTHLY' as const },
  { name: 'Mobile Phone', amount: 30, frequency: 'MONTHLY' as const },
  { name: 'Home Insurance', amount: 300, frequency: 'ANNUAL' as const },
  { name: 'Car Payments', amount: 300, frequency: 'MONTHLY' as const },
  { name: 'Car Insurance', amount: 600, frequency: 'ANNUAL' as const },
  { name: 'Car Running Costs', amount: 150, frequency: 'MONTHLY' as const },
  { name: 'Travel Expenses', amount: 100, frequency: 'MONTHLY' as const },
  { name: 'Food Shopping', amount: 400, frequency: 'MONTHLY' as const },
  { name: 'Spending Money', amount: 300, frequency: 'MONTHLY' as const },
  { name: 'Contingency', amount: 200, frequency: 'MONTHLY' as const },
  { name: 'Savings', amount: 500, frequency: 'MONTHLY' as const },
  { name: 'Pension Contributions', amount: 400, frequency: 'MONTHLY' as const },
  { name: 'School Fees', amount: 12000, frequency: 'ANNUAL' as const },
  { name: 'Holidays', amount: 3000, frequency: 'ANNUAL' as const },
]

export const DEFAULT_INCOMES = [
  { name: 'Salary', amount: 5000, frequency: 'MONTHLY' as const, isTaxed: true },
  { name: 'Pension', amount: 1500, frequency: 'MONTHLY' as const, isTaxed: true },
  { name: 'Benefits', amount: 0, frequency: 'MONTHLY' as const, isTaxed: false },
]

export const DEFAULT_ASSETS = [
  { name: 'Cash', type: 'CASH' as const, value: 0, annualReturn: 0, annualDividend: 0 },
  { name: 'Savings', type: 'SAVINGS' as const, value: 0, annualReturn: 2.5, annualDividend: 0 },
  { name: 'Property', type: 'PROPERTY' as const, value: 0, annualReturn: 3, annualDividend: 0 },
  { name: 'Equity', type: 'EQUITY' as const, value: 0, annualReturn: 6, annualDividend: 2.5 },
  { name: 'Bonds', type: 'BONDS' as const, value: 0, annualReturn: 4, annualDividend: 3 },
  { name: 'Other', type: 'OTHER' as const, value: 0, annualReturn: 0, annualDividend: 0 },
]

export const DEFAULT_CLASSIFICATIONS = [
  { name: 'Housing', type: 'EXPENSE' as const, color: '#3B82F6' },
  { name: 'Transport', type: 'EXPENSE' as const, color: '#10B981' },
  { name: 'Living Costs', type: 'EXPENSE' as const, color: '#F59E0B' },
  { name: 'Entertainment', type: 'EXPENSE' as const, color: '#EF4444' },
  { name: 'Savings & Investment', type: 'EXPENSE' as const, color: '#8B5CF6' },
  { name: 'Employment', type: 'INCOME' as const, color: '#06B6D4' },
  { name: 'Investment Income', type: 'INCOME' as const, color: '#84CC16' },
] 