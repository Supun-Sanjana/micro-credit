# Portfolio at Risk (PAR)

Solida reports Portfolio at Risk using cumulative, loan-level exposure as of the
UTC calendar date returned as `asOfDate`.

- **Gross portfolio outstanding** is the sum of positive outstanding balances on
  active loans in the caller's organization and branch scope.
- A loan is overdue when it has at least one unpaid, non-superseded repayment
  schedule dated before `asOfDate`. Days past due are measured from that loan's
  oldest such schedule.
- **PAR 1+**, **PAR 7+**, **PAR 30+**, and **PAR 90+** each include the full
  outstanding balance of every eligible loan at or beyond their threshold. A
  90-day delinquent loan is consequently included in all four measures, but is
  counted no more than once within a measure.
- `parTotal` is an alias for the **PAR 1+ exposure**. It is not the sum of the
  four overlapping threshold figures.
- Each returned PAR ratio is its exposure divided by gross portfolio
  outstanding. Ratios are zero when that denominator is zero.

Loans outside the active-loan scope, fully settled/zero-balance loans, and
superseded schedules are excluded. Partially paid schedules remain overdue
until marked paid according to the current schedule model. Written-off loans
are not active and are therefore excluded.
