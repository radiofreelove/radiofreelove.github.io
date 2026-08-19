# Update an official form

Never replace a PDF in place. Add a versioned copy and update its registry record.

## Review the source

1. Open every authority link for the jurisdiction.
2. Confirm the form number, revision, court, local rules, confidentiality, notice duties, fee source, fee-help process, and eligibility text.
3. Compare the new PDF with the prior version: pages, dimensions, text, fields, checkboxes, signatures, and judicial sections.

## Update the adapter

1. Save the PDF under a new versioned path in `public/forms/<state>/`.
2. Update `localPath`, `officialUrl`, `revision`, and `sha256` in `lib/jurisdictions.ts`.
3. Update `REVIEWED_ON` and `REVIEW_BY`. Keep production review windows at 90 days or less.
4. Revise questions, routing stops, and PDF coordinates as needed.
5. Record the source URL, observed revision, reviewer, date, and changes in the release audit.

## Validate

Run:

```bash
npm run verify:forms
npm run lint
npm test
npm run qa:pdfs -- <output-directory>
```

Render every sample page. Check for overlaps, misplaced marks, and clipped text. Confirm that signatures, filing dates, case numbers, hearings, clerk fields, and judicial decisions remain blank where required. Generated PDFs must contain no AcroForm widgets or broken annotations.

For fee-help files, also confirm:

- The financial document is separate.
- Applicant roles, requested fees, and totals are correct.
- Signatures and dates remain blank.
- No court finding or ruling is selected.

If an official source is unavailable or unclear, expire the review date and route users to the court until review is complete.
