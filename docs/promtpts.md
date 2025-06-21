```
PForecaster one shot

Create a website that allows users to create and model a lifetime financial budget

Financial expenditure

Start by collecting data on current financial expenditure.  Include a default list of typical expenses, which include but aren’t limited to rent, mortgage, utility bills, council tax, broadband bills, mobile phone bills, home insurance, car payments, car insurance, car running costs, travel expenses, food shopping, spending money, contingency, savings, pension contributions, school fees, holidays.

Allow users to remove items from the default list.  Allow users to add additional custom items that are not on the default list.

Some expenses will be annual, and some monthly.  Allow users to define which are monthly and which are annual. Convert annual to monthly figures so that the analysis can be done using consistent figures which are all monthly

These budget expenses will change over time.  Allow users to define the following
 - A stop date when the expense will end (eg school fees will cease when their children leave school)
 - A start date (some expenses may not exist today but may be planned to start in the future)
 - An increase rate as these expenses may increase over time.  These increase rates may be a fixed percentage or linked to inflation.  Where linked to inflation, there should be a single consistent inflation assumption used by the model.  Include a slider that allows users to change the inflation assumption used (range 0% to 10% in increments of 0.25%)

Income 

Collect similar data on income. Again add a default list including (but not limited to) salary, pension, benefits.

Allow users to 
 - Add additional custom items 
 - Add start dates and stop dates (eg pensions will not start until retirement)
 - Add an increase rate (fixed or inflation linked)
 - Where inflation linked use the same inflation rate defined by the slider above

Additional income will come from the investment portfolio of the individual.  To calculate these amounts, it will be necessary to collect additional information and project the asset portfolio (see below).  This investment income (once calculated) should be included in income for analysis

Classifications

Allow users to group expenses and income into classification buckets (this is optional and not a requirement).  

Asset values

Collect data on the individuals asset holdings.  Have a default list including but not limited to savings, pension, ISA, home value, mortgage, cash.  Allow users to add additional custom assets.

Assets can be negative as well as positive (eg in the case of a mortgage)

For each asset users should define
 - Type of asset (cash, savings, property, equity, bonds, other)
 - Annual return as a percentage.  This annual return could be a fixed amount or be a fixed amount above inflation (where inflation linked use the inflation above as defined by the slide)
 - Annual dividend as a percentage
 - A dividend start and end date
 - Is the divided taxed or tax free
 - A date when the asset will the be sold (allow users to not sell in which case no date is required)

Calculations

Project budget expenditure and income each month using the increase rates (fixed or inflation linked).  Remember that the increase rates are annual rates so to project for 1 month you should use (1+rate)^(1/12)

Start and stop income and expenditure in line with the dates chosen by the user

Project asset value each month.  The annual return and annual dividends are annual percentages, so to calculate the monthly new asset value use the calculation 

New asset value = old asset value * (1+annual return)^(1/12) - annual dividend percentage/12 * old asset value

Investment income for each asset each month will be annual dividend perentage/12 * old asset value.  This should be included in income (as mentioned above)

The annual dividend is only applicable between the start and end dates of that dividend.  Outside of these dates the dividend should be assumed to be zero for that asset

For the default pension asset, this amount should also be increased in each month of the projection while the budget includes a monthly pension contribution

For the default savings asset, this amount should also be increased in each month of the projection while the budget includes a monthly savings number in the budget

When an asset is sold, its value should be added to the cash account and its value ignored for the remainder of the projection.

Calculate total income for the user, including each income item and investment income for those assets that are taxable.  Apply the UK tax rules to calculate PAYE tax based on this income (noting that these amounts are monthly).

The overall budget surplus or deficit (after including investment income and deducting tax) should be added or subtracted from cash each month.  So if I’m spending less than my income, I can put this additional amount into cash. Conversely, if I’m spending more than my income, I need to spend some cash to make up the difference.

Output 

Show the currently monthly budget using a table and charts.  Display summary detail, using the classifications chosen by the user, but allow a drill down into more detailed information.  Investment income should be shown as one item aggregated across investments, but users should be able to drill into this to see a breakdown.

Show current total asset value and a breakdown into asset classes

Show projections of the budget and the asset value through time, highlighting times when the budgeted expenditure exceeds income. Pay particular interest in the cash projection as this asset will take the impact of any persistent budget surpluses/ deficits

Data store

This data should all be saved so that when a user next logs in the model is available with their previously entered data.

Login

Users should be required to create a login and data stored securely for that individual.  User ID should be their email address

Users should be able to reset their password via their email
```

```
Complete the UI components for expense/income/asset management
Add the chart visualizations using Recharts
Implement the detailed forms for data entry
Add the projection charts and analysis views
Enhance the settings page with inflation rate controls

do the above
```

the summary tiles on the dashboard are all zero.  these should be linked to the data.  the quick actions tiles on the dashboard are also incorrect.  Add the inflation slider to the settings page.  also add the ability to create classifications on the settings page.  Classifications should be the same across income and expenses.  classifications should be blank on initial set up (ie its optional if a user wants to use this feature or not).  It the absence of any classifications everything should be classifed under a category called My ToitL Budget.  on the projections page create 2 tables. table 1 should summarise expensea and income by classification with a drill down option.  Table 2 should show asset vale by asset type with a drill down option. for expense

.....

Editing the income fields doesnt work.  Also. there are a set of default classififcations in there that i dont want.  Classications should just be My Budget, unless users add new classifications in the settings page.  the classifications should not be different by income or expense. the font in the input boxes is too difficult to read.  the project chart should show monthly income vs expenses. please remove net income.  Renane Cash Flow Over Time chart to Net Cashflow and this should display total income - total expenditure

.....

Add a feature in the settings page that lets me determine the end of the project period in the charts.  Update the charts to use this feature.  remove all classifications from the system and only have one classification called My Budget.  Users should use the existing functiuonality to add or change any additional classifications that they want.  Move Monthly Income vs Expenses chart to the top of the chart page and also include this chart below the tiles on the dashboard.

.....
