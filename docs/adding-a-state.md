# Add a state

Treat each state as an adapter with explicit limits.

1. Add the state code and state-specific answers to `lib/types.ts`.
2. Add counties, coverage, authorities, review dates, versioned forms, and the fee-help route to `lib/jurisdictions.ts`.
3. Add only questions required by the official forms to `lib/wizard.ts`.
4. Stop routes the adapter cannot handle, including unsupported counties, protected filings, special notices, registry or supervision facts, and local variations.
5. Add the main PDF adapter to `lib/pdf/generator.ts`. Verify source hashes and leave signatures and judicial decisions blank.
6. If the app prepares a fee waiver, use a separate adapter and download. Otherwise, link to the official process.
7. Run the [form update checklist](form-update-runbook.md), including page-by-page PDF review.

Do not claim statewide coverage unless the official source provides one statewide packet or every local variation has its own adapter.
