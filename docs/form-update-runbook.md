# Official-form update runbook

Never replace a PDF in place without updating its registry record and tests.

1. Open every authority link for the jurisdiction in `lib/jurisdictions.ts`.
2. Confirm the form number, revision date, filing court, county rules, confidentiality, notice/publication duties, filing fee source, fee-waiver procedure, and eligibility language.
3. Download the official PDF into a **new versioned directory** under `public/forms/<state>/`.
4. Compare page count, page size, text, checkboxes, AcroForm field names, and signature/judge-only areas against the previous version.
5. Update the template’s `localPath`, `officialUrl`, `revision`, and `sha256` in `lib/jurisdictions.ts`.
6. Update `REVIEWED_ON` and `REVIEW_BY`. Use a review window no longer than 90 days for production.
7. Update the relevant questionnaire, blocker, and PDF-coordinate adapter if wording or layout changed.
8. Add any new form path to `PRECACHE` in `public/sw.js`. The production build automatically fingerprints the cache and adds every hashed app asset.
9. Run `npm run verify:forms`, `npm run lint`, and `npm test`.
10. Run `npm run qa:pdfs -- <output-directory>`, render every page to images, and verify that text does not overlap labels or lines and that signature, clerk, hearing, and judge fields remain appropriate. Confirm that generated PDFs contain no AcroForm widgets or broken annotations.
11. For fee-waiver outputs, confirm that the financial document is separate, the correct applicant role and requested fee are selected, totals reconcile, signatures/dates remain blank, and no court finding or ruling is marked.
12. Record the source URLs, observed revision, reviewer, date, and changes in the release notes before deployment.

If an official source is unavailable or ambiguous, set the review date to the present or past so generation stops, then route users to the court until review is complete.
