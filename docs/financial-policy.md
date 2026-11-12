# Financial and data policy

## Stored amounts and rounding

Money is stored as integer minor units (USD/CAD/GBP/EUR/AUD all use 2 decimals). TypeScript financial calculations validate safe integers and use BigInt multiplication/division with half-away-from-zero rounding. Quantities use thousandths. Invoice and estimate creation supports 1–50 lines, with quantities from 0.001 to 1,000. Multi-line creation validates the whole document and commits atomically. A stable request UUID makes an identical retry return the same document; reusing it with different details is rejected. Job invoice subtotals must equal the saved final job charge. Invoice line totals round before subtotal; tax rounds once on subtotal. PostgreSQL uses exact numeric arithmetic and the same positive half-up policy. No exchange-rate conversion is performed.

## Recognition

Job revenue is the final charge of a completed job, recognized on its completion timestamp converted to the organization's timezone. Scheduled and canceled jobs are excluded. Invoice totals are billing documents, never added to job revenue again. Manually created invoices without a completed job contribute to invoiced totals and cash payments, **not** job revenue. No tax is included in job revenue; invoice tax is a separate liability concept and is not treated as profit.

Cash received is the sum of separately recorded manual payments by payment date. A sent email, created checkout session, or completed subscription checkout never records customer cash receipts. Invoice balances are invoice total minus payments. Dashboard outstanding excludes draft and void invoices; invoice detail still displays the payable amount for a draft.

## Job costs and operating profit

Job-level estimated cost = rounded actual minutes × saved hourly labor allowance / 60 + all expenses explicitly linked to that job. The job-rate snapshot is saved at creation and cannot be changed after completion. Completed jobs are immutable; additional later expenses may update estimated profitability. Job/customer/service reports use lifetime allocated costs for the selected completed jobs, including costs entered on different dates.

Overall period operating cost = all expenses dated in the period + labor allowances for jobs completed in the period. Job-linked expenses and overhead are both counted once; do not add the per-job profit table to period operating-profit totals. Period timing can cause overall profit to differ from the sum of selected jobs' lifetime profits.

Owner labor and employee labor use the same optional cost allowance. If actual payroll is recorded as an expense for labor already in that allowance, it will double count: use either the allowance or the equivalent payroll expense, not both. Additional subcontractor or labor costs may be recorded separately when they represent distinct work.

Shared receipts should be recorded as overhead if no allocation is known. If allocating, create explicit separate expense entries for each job and any remainder overhead; their total must equal the receipt. Automatic allocation and receipt reconciliation are not implemented.

Profit = job charge minus job costs. Profit margin = profit / positive revenue. Zero or negative revenue shows no percentage. Suggested price = cost / (1 - target margin), target from 0% to strictly less than 100%. Margin is not markup. Suggestions never change agreed prices.

Unrecorded overhead, owner compensation, tax, financing, depreciation, and refunds are not automatically imputed. Label all results **estimated operating profit**, never take-home pay.

## Billing and entitlement

Subscription prices come from the configured Stripe recurring price. Reference marketing prices are not client-authoritative entitlements. Only verified active/trialing state with a future period end grants Pro. Events are signature-verified; current subscription state is retrieved from Stripe, customer mapping is checked, and event ID/state are committed atomically. The browser cannot grant subscription state. Paid invoice/estimate/payment operations also enforce entitlement in SQL.

## Retention and corrections

Customers are archived, not deleted. Jobs in terminal states cannot be rewritten or reopened. Payments and invoice items have no client mutation/deletion policies. Expense edits record amount changes in audit events; those events have no client write policies. Application-owned financial mutations create audit entries. Important billing events remain deduplicated by their Stripe event ID.

An unpaid invoice may be voided. An invoice with payments cannot be voided. Refunds, credit notes, negative payment entries, invoice amendments, and chargebacks are not supported by this release; reconcile those externally until a tested compensating-transaction workflow exists. Do not represent a refund by deleting or silently altering an original payment. Back up data and define jurisdiction-specific retention before commercial launch.
