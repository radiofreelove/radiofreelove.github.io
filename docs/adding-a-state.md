# Adding a state

State support is an adapter, not a copy-and-paste page.

1. Add the state code and any state-only answers to `lib/types.ts`.
2. Add counties, coverage text, primary authorities, review dates, versioned official templates, and an explicit generated-or-official fee-waiver route to `lib/jurisdictions.ts`.
3. Add only the questions needed by those official forms in `lib/wizard.ts`.
4. Add explicit routing or hard-stop rules for unsupported counties, protected filings, special notices, registry/supervision facts, and other facts the adapter cannot faithfully place.
5. Implement one main generator in `lib/pdf/generator.ts`. Hash-check every source PDF, leave signatures and judge-only decisions blank, and return one clearly named packet. If a fee waiver is generated, make it a second adapter and a separate file; otherwise use the court’s official route.
6. Add the new form paths to `public/sw.js`; the production build will fingerprint the cache version automatically.
7. Follow `docs/form-update-runbook.md`, including a visual page-by-page sample review.

Do not advertise statewide support until the official source actually supplies a statewide packet or every local variant has an explicit adapter.
