import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, history, userFinancialData } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Create a comprehensive financial context from user data
    let financialContext = ''
    if (userFinancialData) {
      const data = userFinancialData
      financialContext = `
USER'S FINANCIAL PROFILE:
- Monthly Income (After Tax): £${data.currentMonth?.totalIncome?.toLocaleString() || 0}
- Monthly Expenses: £${data.currentMonth?.totalExpenses?.toLocaleString() || 0}
- Net Cash Flow: £${data.currentMonth?.cashFlow?.toLocaleString() || 0}
- Total Assets: £${data.totalAssetValue?.toLocaleString() || 0}
- Cash Flow Issues: ${data.cashFlowIssues || 0} months with negative cash flow
- Inflation Rate: ${data.inflationRate || 0}%

ASSET BREAKDOWN:
${Object.entries(data.assetBreakdown || {}).map(([asset, value]) => `- ${asset}: £${Number(value).toLocaleString()}`).join('\n')}

PROJECTION DATA:
${data.projection ? data.projection.slice(0, 12).map((month: any) => 
  `- ${month.month}: Income £${month.totalIncome?.toLocaleString() || 0}, Expenses £${month.totalExpenses?.toLocaleString() || 0}`
).join('\n') : 'No projection data available'}

KEY INSIGHTS:
1. ${data.currentMonth?.cashFlow >= 0 ? 'Positive cash flow - good financial health' : 'Negative cash flow - needs attention'}
2. ${data.cashFlowIssues > 0 ? `${data.cashFlowIssues} months with cash flow issues detected` : 'No cash flow issues detected'}
3. ${data.totalAssetValue > 100000 ? 'High asset value - consider diversification' : 'Moderate asset value - room for growth'}
4. ${data.currentMonth?.totalExpenses > data.currentMonth?.totalIncome * 0.8 ? 'High expense ratio - consider cost reduction' : 'Reasonable expense ratio'}
`
    }

    // Create conversation history
    const conversationHistory = history?.map((msg: any) => ({
      role: msg.role,
      content: msg.content
    })) || []

    const systemPrompt = `You are a professional financial advisor and AI assistant. You have access to the user's complete financial profile and projections.

${financialContext}

Your role is to:
1. Analyze the user's financial situation and provide personalized advice
2. Identify potential issues and opportunities
3. Suggest actionable improvements
4. Answer questions about their finances
5. Provide insights on budgeting, investing, tax optimization, and financial planning

IMPORTANT GUIDELINES:
- Always consider the user's specific financial data when giving advice
- Be specific and actionable in your recommendations
- Highlight both risks and opportunities
- Suggest concrete steps they can take
- Consider their cash flow, asset allocation, and expense patterns
- Mention specific financial products or strategies when relevant
- Be encouraging but realistic about challenges
- ALWAYS limit your suggestions to exactly 3 top recommendations maximum

When the user asks for general advice or insights, provide exactly 3 top suggestions that highlight specific issues or opportunities for their situation, such as:
- Better broadband/utility deals if they have high expenses
- Investment opportunities if they have excess cash
- Debt consolidation if they have multiple liabilities
- Tax optimization strategies
- Emergency fund recommendations
- Retirement planning opportunities
- Insurance needs analysis
- Expense reduction strategies

Always base your suggestions on their actual financial data and keep responses concise with exactly 3 recommendations.`

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      temperature: 0.7,
      max_tokens: 1000,
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    )
  }
} 