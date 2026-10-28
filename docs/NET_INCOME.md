# Net income: how it is calculated

The website follows `Sales.xlsx` (checked against the Feb–Oct 2026 sheets). One formula is used by the
dashboard, the monthly chart and the reports (`src/lib/finance/components.ts`):

```
Revenue          = Sales + GCash charges
Net income       = Revenue + Excess money
                   − Expenses − Reimbursements − Salary paid out − Short
Total net income = Brought forward + Net income
```

| Sales.xlsx (July–Oct sheets)                          | Website                                             |
| ----------------------------------------------------- | --------------------------------------------------- |
| TOTAL SALES (sum of daily SUB TOTAL = sales + charges) | Sales + GCash charges                               |
| TOTAL EXPENSES                                        | Expenses tab                                        |
| Salary/Reimbursement                                  | Reimbursements tab + Salary paid out (Salary tab)   |
| Short                                                 | Short tab                                           |
| From prev. month NET INCOME                           | Brought forward (net income of every earlier month) |
| TOTAL NET INCOME                                      | Total net income                                    |

Check: July 2026 = 17,435 + 8,020 − 8,978 − 8,720 − 49 = **7,708**, which is what the website gives for the same data.

## Details

- **Brought forward** is not typed in. It is the sum of net income of all months before the one on screen, so
  it always follows the records. (In the sheet the previous month's total was copied by formula.)
- **Salary paid out** is cash handed over, like the sheet: each cash advance on the day it was given, plus the rest of
  a pay date (salary − advances) on the day it was marked paid. An advance is never counted twice.
- **Excess money** is not in Sales.xlsx. It was added at the owner's request and is added to net income.
- **GCash Cash In / Cash Out / Load amounts** are money moved for customers. Only the charge is income.
- **Debt payments**: in the sheet, payments on the shop's own debt ("bayad sa utang", "hulog sa debt") were typed as
  expenses, so they reduced net income. The Debts tab does not change net income. Record the payment as an expense
  too if it should reduce net income.
- **Cash Out and Cash In fee**: the Add transaction form fills in the charge from the sheet's fee table
  (`src/lib/gcash/fee.ts`). Cash In uses the same table as Cash Out; Load charges stay manual. The owner can overtype the fee.

## Known quirks in Sales.xlsx (not copied)

- Feb 2026: TOTAL SALES left out one daily subtotal (row 257, ₱37).
- Mar–Jun 2026: some daily subtotals were adjusted by hand (e.g. `=SUM(C36,G36)-I6`).
- Sep 2026: item rows add up to ₱5 more than TOTAL SALES.
- Oct 2026: TOTAL SALES is entered as sales − expenses; the final TOTAL NET INCOME is still right.

## How the Dashboard shows it
The Dashboard uses plain words, with the same numbers underneath (`src/lib/dashboard/overview.ts`, `components/dashboard/money-overview.tsx`):
- **Money in** = Sales + GCash fees + Excess money. **Money out** = Expenses + Reimbursements + Salaries paid + Short. **Profit** = in − out (the sheet's NET INCOME).
- **Running total** = profit of earlier months + this period (the sheet's TOTAL NET INCOME).
- Debts and GCash cash movements are shown apart because they are not income.

## Dashboard layout
The Dashboard uses the whole screen width (no centered column). The four headline cards sit in one row on wide screens (2 x 2 on tablets, stacked on phones), each with its own quiet accent colour: **Money in** blue, **Money out** amber, **Profit** green, **Total profit so far** violet. A negative profit or total is shown in red. The four charts sit in one row on very wide screens (2 x 2 otherwise). The numbers themselves are unchanged. Code: `src/components/dashboard/money-overview.tsx` (`HEADLINE_STYLE`), `src/lib/dashboard/overview.ts`.
