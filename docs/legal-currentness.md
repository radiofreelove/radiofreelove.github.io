# Legal-currentness methodology

Identity Navigator is a document-assembly and routing tool, not a legal-advice or automated-filing service. Its release gate is deliberately conservative: if a supported route needs facts or notices that the guided flow does not model, the app stops and sends the person to an official court source.

## Problems corrected from the prototype

The original single-page guide was useful orientation, but its methodology was too static for court-document generation:

- It did not consistently separate **current residence** (which commonly controls the filing court) from place of birth (which often controls a later agency record update).
- It implied one Washington process even though Washington Courts says name-change forms and instructions are local. This release generates only the current King County adult individual District Court petition and routes every other county.
- It described Oregon combined name/sex confidentiality using an older rule. The July 2026 OJD packet says every petition that includes a legal-sex change is confidential, including a combined petition.
- It included Utah requirements that are not part of the current official adult packet. This release uses the current 1158XX, 1730FA, and 1731FA forms and models the statements actually printed there.
- It treated fees and procedural details as durable facts. They are now source-linked and date-stamped rather than encoded as timeless promises.
- It did not prepare or route fee-waiver paperwork. This release generates the current Oregon and King County forms as separate files, and uses explicit official handoffs where the longer Idaho and Utah sworn-financial workflows are not fully modeled.

## Release controls

1. **Primary-source hierarchy.** Court forms, court self-help pages, statutes, and official fee schedules are the authorities. Secondary resources may explain but cannot establish release status.
2. **Exact route coverage.** Every state entry says what the generator does and does not generate. County-local routes are never silently mapped to a different county’s form.
3. **Versioned form assets.** Official PDFs live under revisioned directories. Each registry entry includes its official URL, revision label, verification date, and SHA-256 value.
4. **Integrity check at generation.** The browser hashes every PDF before use. A mismatch stops output instead of filling an unrecognized template.
5. **Review-date hard stop.** The app disables generation after `REVIEW_BY`. A stale legal review cannot be bypassed by being offline.
6. **Conservative blockers.** Registry, supervision, special-notice, expanded-case-table, adult/minor, and confidentiality issues route to official help when this release cannot safely model them.
7. **Human review remains mandatory.** Signature, filing date, case number, clerk, hearing, judge, service, and judge-only decisions remain blank as appropriate.
8. **Data minimization.** Birth information is requested only for packets that ask for it. No answer is sent to an application server; local draft persistence is opt-in. Fee-waiver dates of birth, benefits, income, assets, expenses, and debts are never written to a draft.
9. **Confidentiality separation.** A restricted-access application or confidential financial statement is never merged into the main identity-change packet. Each is labeled and downloaded separately.

## Review cadence

Review all supported jurisdictions at least every 90 days and immediately after a known statutory, rule, fee, or form change. A qualified legal reviewer should approve material routing or eligibility changes before release.
