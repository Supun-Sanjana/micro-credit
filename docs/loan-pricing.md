# Loan pricing and amortization

## Existing product contract

`LoanProduct.multiplier` is a legacy whole-term receivable factor. A FLAT
product with principal `P` and multiplier `M` has contractual receivable
`P × M`; this existing contract is unchanged.

For a `DECLINING_BALANCE` or `FIXED_INSTALLMENT` product (or one whose
`interestMethod` is `DECLINING_BALANCE`), Solida keeps that backward-compatible
meaning rather than treating `multiplier` as an annual percentage rate.

- The full-term nominal rate is `multiplier - 1`.
- The stored `numberOfWeeks` field is the number of instalments, despite its
  legacy name.
- The nominal periodic rate is `(multiplier - 1) / instalmentCount`.
- `repaymentFrequency` controls the due-date cadence (daily, weekly,
  biweekly, or monthly); it does not convert an annual rate because no annual
  rate is stored. `CUSTOM` is unsupported for declining-balance loans.
- This is neither a nominal annual-rate nor effective annual-rate convention.
- `InterestMethod.NONE` uses a zero periodic rate.

## Amortization and rounding

For a positive principal and positive periodic rate, each regular instalment
uses the standard annuity formula. Currency values are rounded to two decimal
places per instalment. Interest is rounded from the opening balance for each
period; principal is payment minus interest. The last instalment is the
remaining rounded balance plus its final-period interest, ensuring principal
closes to zero. Total receivable is the sum of the actual instalments.

Loans store their calculated amount, total receivable, and schedule at
origination/disbursement. Editing a product never recalculates an existing
loan or its schedules; changes apply only to subsequently originated loans.
