[![Deploy Status](https://img.shields.io/badge/Deployed%20on-Vercel-00C7B7?style=for-the-badge&logo=vercel)](https://forecaster.thomasbale.com)
[![Issues](https://img.shields.io/badge/Issues-VibeOps-FF6B6B?style=for-the-badge)](https://github.com/TumCucTom/pforcast/issues)

# PForcast - Lifetime Financial Budget Planner

## Overview
PForcast is a personal-finance **forecasting and planning tool**.  Add all your incomes, expenses, and assets once and the app will run 30-year, month-by-month projections so you can answer questions like:

* "When will I become cash-flow negative?"
* "What if inflation jumps to 6 %?"
* "How large will my ISA portfolio be by age 60?"

The UI is 100 % client-side React (Next 14/15), the data lives in Postgres via Prisma, and an optional Groq-powered assistant guides financial decisions in plain English.

## VibeOps Workflow
This repo is wired to **VibeOps** for both issue tracking _and_ hands-free deployments:

1. Open a GitHub Issue with the `vibeops` label → a staging preview spins up automatically.
2. Merge to `main` → VibeOps triggers the Vercel production build.
3. Health-checks & comments are posted back to the PR so you never deploy a broken commit.

> Badge at the top of this file shows live prod status and links to the issue board.

## Prompts used

See [prompts list](docs/promtpts.md)

## Product Images

![](docs/Screenshot%202025-06-21%20181915.png)
![](docs/Screenshot%202025-06-21%20181938.png)
![](docs/Screenshot%202025-06-21%20182004.png)
![](docs/Screenshot%202025-06-21%20182028.png)
![](docs/Screenshot%202025-06-21%20182113.png)
![](docs/Screenshot%202025-06-21%20182134.png)

## Live Demo
👉 [https://forecaster.thomasbale.com](https://forecaster.thomasbale.com)

![demo video](docs/demo.mp4)

## Features

### Financial Data Management
- **Expenses Tracking**: Comprehensive expense management with default categories including rent, mortgage, utilities, insurance, transportation, and more
- **Income Management**: Track multiple income sources including salary, pension, benefits, and investment income
- **Asset Portfolio**: Manage various asset types (cash, savings, property, equity, bonds) with return projections
- **Custom Categories**: Add custom expenses, income sources, and assets not in the default lists

### Advanced Forecasting
- **Time-based Planning**: Set start and end dates for expenses and income (e.g., school fees, pension start dates)
- **Inflation Modeling**: Configurable inflation rate (0% to 10% in 0.25% increments) affecting inflation-linked items
- **Growth Projections**: Fixed or inflation-linked growth rates for expenses, income, and assets
- **Tax Calculations**: UK tax system integration with PAYE calculations based on current tax bands

### Financial Analysis
- **Monthly Projections**: 30-year financial projections with monthly granularity
- **Cash Flow Analysis**: Identify periods of negative cash flow and potential financial stress
- **Asset Value Tracking**: Monitor asset growth and portfolio performance over time
- **Investment Income**: Automatic calculation of dividend and interest income from assets

### User Experience
- **Secure Authentication**: Email-based login with password reset functionality
- **Responsive Design**: Modern, mobile-friendly interface built with Tailwind CSS
- **Data Persistence**: All financial data securely stored and retrievable
- **Visual Analytics**: Interactive charts and detailed breakdowns
- **AI Financial Assistant**: Groq-powered chatbot for financial advice and guidance

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Charts**: Recharts for data visualization
- **Validation**: Zod for schema validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Update the `.env` file with your configuration:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="your-groq-api-key-here"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Account Creation
- Register with your email address and password
- The system will create default classifications and budget settings

### 2. Data Entry
- **Expenses**: Add your current expenses, set frequency (monthly/annual), and configure growth rates
- **Income**: Enter your income sources with start/end dates and growth projections
- **Assets**: Define your current assets with expected returns and dividend information

### 3. Configuration
- **Inflation Rate**: Adjust the inflation assumption using the slider (0% to 10%)
- **Classifications**: Organize your data into custom categories for better analysis

### 4. Analysis
- View current monthly budget summary
- Check projected cash flow over 30 years
- Monitor asset growth and investment income
- Identify potential financial stress periods

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Data Management
- `GET/POST /api/expenses` - Expense management
- `PUT/DELETE /api/expenses/[id]` - Individual expense operations
- `GET/POST /api/incomes` - Income management
- `GET/POST /api/assets` - Asset management

### Analysis
- `GET /api/projection` - Generate financial projections

### AI Assistant
- `POST /api/chat` - AI-powered financial advice using Groq

## Financial Calculations

### Monthly Rate Conversion
Annual rates are converted to monthly using: `(1 + annual_rate)^(1/12) - 1`

### Asset Projection
Monthly asset growth: `new_value = old_value * (1 + monthly_return_rate) - monthly_dividend`

### Tax Calculation
UK tax bands (2024/25):
- Personal Allowance: £12,570 annually
- Basic Rate (20%): £12,571 - £50,270
- Higher Rate (40%): £50,271 - £125,140
- Additional Rate (45%): Above £125,140

### Cash Flow Management
Monthly cash flow is automatically added/subtracted from the cash asset, providing a realistic view of liquidity over time.

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure session management
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS Protection**: Configured for production deployment

## Deployment

### Production Setup
1. Set up a PostgreSQL database
2. Update environment variables for production
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Netlify, etc.)

### Environment Variables for Production
```env
DATABASE_URL="postgresql://user:password@host:port/database"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the GitHub repository.

**Note**: To use the AI Financial Assistant chatbot, you'll need to:
1. Sign up for a free account at [Groq](https://console.groq.com/)
2. Get your API key from the Groq console
3. Add it to your `.env` file as `GROQ_API_KEY`
