# Legal-currentness method

Identity Navigator assembles documents and routes unsupported cases. It does not give legal advice or file cases. When the guided flow lacks a required fact or notice, generation stops and points to an official source.

## Why coverage is narrow

| Issue | Current approach |
| --- | --- |
| Filing location | Residence and birthplace are separate because they serve different legal functions. |
| Washington forms | Name-change forms are local. Only the King County adult individual District Court petition is generated. |
| Oregon confidentiality | Every petition that includes a legal-sex change is treated as confidential under the July 2026 OJD packet. |
| Utah requirements | The adapter follows the current 1158XX, 1730FA, and 1731FA forms rather than older checklist language. |
| Fees and procedure | Amounts and process details are source-linked and date-stamped. |
| Fee help | Oregon and King County forms are prepared separately. Idaho and Utah route to their official sworn-financial processes. |

## Release controls

1. **Use primary sources.** Court forms, court self-help pages, statutes, and official fee schedules control release status.
2. **State exact coverage.** Each adapter identifies what it prepares and where it stops.
3. **Version every form.** Registry entries include source, revision, verification date, and SHA-256 value.
4. **Verify before use.** A hash mismatch stops generation.
5. **Expire stale reviews.** Generation stops after `REVIEW_BY`, including offline use.
6. **Route unsupported facts.** Local variation, registry, supervision, notice, case-history, age, and confidentiality issues go to official help when not modeled.
7. **Reserve human decisions.** Signature, filing, hearing, clerk, service, and judicial fields remain blank where required.
8. **Minimize data.** The app asks only for required facts, sends no answers to a server, and saves drafts only by opt-in. Fee-waiver financial data is never saved.
9. **Separate confidential records.** Restricted applications and confidential financial statements are separate downloads.

## Review cycle

Review each jurisdiction at least every 90 days and after any known change to a statute, rule, fee, form, or court process. Qualified legal review is required for material routing or eligibility changes.
