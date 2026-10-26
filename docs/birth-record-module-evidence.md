# Birth-record paperwork module: evidence log

This log records what each claim in the birth-record module rests on. Every source was fetched on **October 26, 2026** unless noted. Quotations are verbatim from the fetched text. "Verified" means the text was read at the source on that date. It does not mean legal clearance for any individual applicant.

Review-by date: **December 31, 2026**. The module stops making PDFs after that date until the sources are re-checked. This is a review checkpoint, not a claim that any law or fee will change. See section 7.

Code map: `lib/records-data.ts` (sources R1 to R16, form hashes, fees), `lib/records.ts` (questions, routing, fee math), `lib/pdf/records.ts` (PDF filling), `app/components/RecordsFlow.tsx` (interface), `tests/records.test.mjs`.

## 1. Scope

Included: an adult, born in Oregon, applying for their own record, through one of two routes.

- **Court route.** The person already holds a signed, certified court judgment for a name change, a sex change, or both. The tool fills OHA form 45-17A and, when the name changes, OHA's court-order name-change request.
- **Administrative route.** OHA's notarized application (OHA 2673), once per item. The tool fills the 2673.

Not included: minors, parents, guardians and legal representatives; births outside Oregon; records with prior amendments the sources do not settle; passport or other federal sex-marker forms; Social Security number collection; uploads of IDs or judgments; contact with any agency; signing, notarizing, paying or filing for the user.

## 2. Eligibility and routing claims

| # | Claim in the module | Source and exact text | Where it shows in code |
|---|---|---|---|
| 2.1 | Only people born in Oregon use OHA's route. Where they live now does not matter. | OHA gender-identity page (R6): applicants born in Oregon who live elsewhere are covered; if the birth did not occur in Oregon the applicant contacts that state. OAR 333-011-0273(1)(b): "Registrant is born in Oregon". | `not-oregon-born` outcome |
| 2.2 | The tool covers adults for their own record. | OAR 333-011-0271(1)(b)(A): "The registrant, if the registrant is age 18 or older or an emancipated minor". Other applicants are in (B) and (C). | `not-adult-self` outcome |
| 2.3 | The administrative route works once for the name and once for the sex. | ORS 432.235(4)(b): "The state registrar may not amend a record of live birth to change the name of an applicant under subsection (3)(a)(B) or the sex of an applicant under subsection (3)(b)(B) of this section more than once." OHA FAQ: "each can only be changed once. Any further changes require a court order." | `prior-admin-name`, `prior-admin-sex` outcomes |
| 2.4 | A prior court-ordered change is **not settled**, so the tool does not generate the administrative application. | OAR 333-011-0271(2): "A registrant may not request an administrative name change under this rule if the registrant's name on the record of live birth has previously been amended, except for clerical or typographical errors." OAR 333-011-0272(2) says the same for sex. OAR 333-011-0273(1)(e): "No amendment has previously occurred to the items requested to be changed". The statute (2.3) counts only earlier administrative changes. The rules appear broader than the statute. The app text says only that the sources do not establish the answer. No source read says how OHA treats a prior court-ordered amendment. | `prior-unclear-*` outcomes, kind `needs-review`. Generation is held for these answers. |
| 2.5 | Clerical or typographical fixes do not count as a prior amendment. | OAR 333-011-0271(2) and -0272(2), "except for clerical or typographical errors". | `priorName`, `priorSex` options |
| 2.6 | Name-only administrative changes put a notation on certified copies. Sex changes, alone or with a name, create a new record with no notation. | OAR 333-011-0273(2) and (3). Consistent with OHA page text: "For records with an amended sex designation, nothing on the certificate will indicate an amendment occurred." | Result panel notes |
| 2.7 | A judgment prepared by this tool is not a judgment issued by a court. The court route requires a certified copy from the court. | OHA court-order checklist (R6, R11): "Original certified copy of the court ordered sex change ... showing the original seal and signature of the court clerk." | `no-judgment-yet` outcome ("Judgment-generated is not judgment-issued.") |
| 2.8 | OHA keeps the court order in a sealed file, so the user does not get it back. | R6 and R11: "(Oregon Vital Records will keep this document in a sealed file.)" The R6 completed-request text says documents are returned "with the exception of documents required to be retained in a permanent sealed file." | Checklist item |
| 2.9 | Oregon honors court orders from other states. | R6 and R11: "We honor court orders from Oregon as well as court orders from other states." | Court route copy |

## 3. Fees

| # | Claim | Source and exact text |
|---|---|---|
| 3.1 | Amendment fee $35. | OAR 333-011-0340(6): "A fee of $35 shall be paid to the state registrar for the preparation of a new or updated record of live birth for amendment ... This fee does not include a certified copy of the amended record." Form 45-17A instructions: "Oregon law requires a $35 fee for amendments to birth records with some exceptions." |
| 3.2 | Expedite $30, court route only in this tool. | OAR 333-011-0340(6)(c): "An additional service to expedite an amendment within three business days may be available for an additional fee of $30 ..." 45-17A instructions: "you must check the expedite box on the order form". OHA R6: three full business days once everything is received. Form 2673 has no expedite box (read on the form). OHA's page tells administrative applicants to mark "expedite" on the Amendment Order Form, but the administrative "Gather & Submit all Required Materials" list on R6 names the notarized application, the ID copy, the $35 fee and certificate fees, with no separate order form, so the tool does not offer expedite there. This is a stated limit, shown to the user. |
| 3.3 | Computer-issued certificate $25, full image $30. | OAR 333-011-0340(3)(a), (b). 45-17A instructions. |
| 3.4 | Born 2008 or later: computer issued only. Full image available 1903 to 2007. Computer issued 1920 to present. | 45-17A and 45-13A (R8): "If you are requesting a certificate for someone born in 2008 or later, you MUST choose the computer issued certificate." "Full Image (long form): available for births from 1903 - 2007". |
| 3.5 | Replacement certificates: first free, each additional $5, originals returned within a year. | OAR 333-011-0340(9): "A fee of $5 for each certified copy shall be paid for the replacement of certified copies of a birth record when the original documents are returned within a year of issuance ... The $5 fee may be waived for the replacement of one certified copy". 45-17A: "exchange one incorrect original birth certificate, issued within the last 12 months, for a free corrected certificate. All other original certificates issued within 12 months may be exchanged for $5 each." |
| 3.6 | One payment, check or money order to "OHA/Vital Records", no cash. | R6 and R11 court-route text: "Make one payment for all fees. No cash. Make payment by money order or check. Make payment out to: OHA/Vital Records". 45-17A footer: "Make check/money order payable to: OHA/Vital Records". |
| 3.7 | Fees and submission are the same for the court and administrative routes. | R11: "The required fees and submission process is the same for the administrative and court ordered option to change a name and or sex on a birth record." |

Tested in `tests/records.test.mjs` (fee math), against the amounts above.

## 4. Which order form goes with a court judgment (45-17A or 45-13A)

**Question.** OHA's gender-identity page (R6), in the court-ordered section, lists "3. Completed Birth Order Form" with an "English Birth Order Form" link. That link goes to form 45-13A, the Oregon Birth Certificate Order Form (04/26). OHA's change-a-record page (R11) lists "Completed Amend a Birth Record Order Form" for the same court-ordered name and sex changes. That is form 45-17A (07/26).

**What each form is** (read from the PDFs):

- **45-17A, "Amend a Birth Record Order Form."** Opens with "To amend a record, you must: Submit the Amend a Birth Record Order Form." It carries an amendment-fee table (the $35 line and the optional $30 expedite line), the certificate-fee table, replacement certificates, and the same applicant fields as the 45-13A (name on record, date of birth, parents, relationship, reason, contact, signature).
- **45-13A, "Oregon Birth Certificate Order Form."** Opens with "Ordering Birth Certificates by Mail or Drop Box". It orders certificates only. It has no amendment fee line and no expedite box.

**What supports using 45-17A alone.**

1. R11 names the Amend a Birth Record Order Form for court-ordered name changes ("Completed Amend a Birth Record Order form") and for court-ordered sex or name changes ("Completed Amend a Birth Record Order Form" in the final checklist).
2. R6 itself requires the $35 amendment fee for the court route ("5. $35 Amendment Fee") and says "The required fees and submission process is the same for the administrative and court ordered option". The amendment fee has a line only on the 45-17A.
3. 45-17A instructions say amendments are ordered with that form, and the form also orders the certificates, so it covers everything the 45-13A would.
4. OHA's own list for "Gather & Submit all Required Materials" on R11 starts with "Amend a Birth Record Record Order Form".

**What does not support it.** The literal link text on R6 says "Birth Order Form" and points to the 45-13A. No OHA text read says the 45-13A is required in addition to, or instead of, the 45-17A.

**Decision.** The tool produces the 45-17A only. It does not produce the 45-13A. The 45-13A would repeat the same applicant and certificate information without the amendment fee line, so including it would add a second set of order details without adding a requirement any OHA text states. This is a reading of OHA's two pages, shown to the user in plain words. It is not confirmed by OHA. If OHA says it wants the 45-13A, the 45-17A already holds every field on it. The applicant can ask at CHS.Amendments@oha.oregon.gov. No one at OHA was contacted for this project.

## 5. Practical packet facts

| # | Claim | Source |
|---|---|---|
| 5.1 | The 2673 is signed only in front of a notary. | OHA 2673 form text: "Sign your name ONLY in the presence of a Notary." R6: "Do NOT sign the application until asked to do so by the Notary." Tool leaves signature, notary, commission and county fields empty (tested). |
| 5.2 | Applications with cross-outs or white-out are rejected. | R6: "If ANY words are crossed out or any white out is used on the form, the application will be rejected." |
| 5.3 | ID copy required. If the ID name differs from the record, proof of the name change is needed. | R6: "If your ID does not match what is currently listed on the birth certificate, proof of how your name was changed must be submitted." |
| 5.4 | Do not staple. One envelope. | R6 and R11: "Please do not staple payments or documents to each other or to the order form. Place all materials in one envelope". |
| 5.5 | Mail to Oregon Vital Records, Amendments Unit, PO Box 14050, Portland OR 97293, or the drop box at 800 NE Oregon Street, Portland OR 97232 (blue box at the west door in the parking lot). | R6 and R11. The 45-17A footer gives "PO Box 14050, Portland OR 97293-0050". |
| 5.6 | Sex marker choices M, F, X on the application; the registrant's current sex on the record can be M, F, U or X. | R6 tips for items 9 and 14. |
| 5.7 | The 2673 and 45-17A forms and the court-order name request were filled through their real AcroForm field names and compared with the original PDFs by hash. | `lib/records-data.ts` SHA-256 values; `tests/records.test.mjs`; `scripts/verify-form-registry.mjs`; `scripts/verify-protected-files.mjs`. |
| 5.8 | The court-order name-change request form has no signature or date fields filled. The contact fields are printed name, relationship, email, phone. | Read from the PDF; `tests/records.test.mjs`. |

## 6. Other agencies (links only; no forms)

| # | Claim | Source and text |
|---|---|---|
| 6.1 | OHA cannot guarantee other agencies accept the amended certificate, and some may require a court order. | R6: "We cannot guarantee if other agencies will accept these amended certificates ... In some cases, agencies might require a court order to recognize the new name and/or sex." |
| 6.2 | Oregon DMV, gender marker: no documents indicating gender are needed, no Social Security match is needed, in person, M, F or X, renewal or replacement fee applies. | R12, fetched October 26, 2026. |
| 6.3 | Oregon DMV, name: the name must match Social Security for REAL ID; a standard credential can be verified in another name with proof; change the name with Social Security first. | R13, fetched October 26, 2026. |
| 6.4 | Social Security: a name change is requested through a replacement Social Security card. | R14, fetched October 26, 2026. |
| 6.5 | Passports: the State Department page (updated March 16, 2026) says it currently issues only the sex marker matching sex at birth. The module links to it and generates nothing for passports. | R15, fetched October 26, 2026. This is a fast-moving area, so the link is neutral: "Federal rules are changing, so read the agency page before you apply." |

## 7. Currentness

- OHA published a Notice of Proposed Rulemaking (filed 9/30/2026; comment period ended 10/21/2026; filing caption "Implementation of SB 163 (2025), identifying processes and requirements for establishing parentage"). R10 says final filing is planned for December 2026 with an effective date of January 1, 2027.
- What the notice does to rules this module uses: it repeals OAR 333-011-0275 and adopts 333-011-0274; amends 333-011-0265 to replace a reference to 0275 with 0274; amends 333-011-0340. For 0340 the summary text read describes reference and date cleanup, and the fee amounts read in the proposal are unchanged. OAR 333-011-0271, -0272 and -0273 do not appear among the rules proposed.
- Therefore: the module has a **review-by date of December 31, 2026**, and generation stops after it (`isRecordsReviewOverdue`, tested). This is a prompt to re-read the sources once final rules are filed. It is not a statement that the fee, form or process will change.
- The form versions in the module are OHA 2673 (03/26), 45-17A (07/26), court-order name request (04/26).

## 8. Advisory-opinion search

- **On point (already in the court-tool log, section 3.5):** OSB Formal Ethics Opinion 2005-137 (2016 revision), https://www.osbar.org/_docs/ethics/2005-137.pdf. "The sale by nonlawyers of self-help legal software, whether through a program to be run on the purchaser's own computer or through a program to be run online, simply is not the practice of law, unauthorized or otherwise. When coupled with a clear indication to customers that there is no human interaction to be had ..." The opinion concerned a for-profit venture, is advisory, binds no court, and does not evaluate this tool. It is the same opinion that supports the court-form side of the project. It does not add support for the birth-record module beyond the same principle: stored questions, official forms, no human interaction.
- **Searched, nothing added:** the OSB UPL advisory opinions page (https://www.osbar.org/upl/advisoryopinions.html, accessed October 26, 2026) lists 2013-01, 2013-02 and 2014-03; none is about software or document assembly. OSB Formal Opinion 2005-107 (https://www.osbar.org/_docs/ethics/2005-107.pdf) is about general legal-information materials and is not cited as support here.
- **Result:** no additional on-point advisory opinion was found. The birth-record module relies on the same opinion as the rest of the project. No legal clearance is claimed.

## 9. What remains unresolved

1. Whether OHA wants the 45-13A alongside the 45-17A for court judgments (section 4). The tool uses the 45-17A and says why.
2. How OHA treats a prior court-ordered amendment under OAR 333-011-0271(2) and -0272(2) (section 2.4). The tool does not generate the administrative application for these answers.
3. Whether expedite is available on the 2673 route (section 3.2). Not offered.
4. Final rules expected December 2026 (section 7).
5. Federal sex-marker and passport procedures (section 6.5): not covered.
6. Manual accessibility testing with assistive technology is still pending, as stated in the README. Automated axe checks run on the new view.

## 10. Source list

| ID | Source | URL | Accessed |
|---|---|---|---|
| R1 | ORS 432.235 | https://www.oregonlegislature.gov/bills_laws/ors/ors432.html | 2026-10-26 |
| R2 | OAR 333-011-0271 | https://secure.sos.state.or.us/oard/view.action?ruleNumber=333-011-0271 | 2026-10-26 |
| R3 | OAR 333-011-0272 | https://secure.sos.state.or.us/oard/view.action?ruleNumber=333-011-0272 | 2026-10-26 |
| R4 | OAR 333-011-0273 | https://secure.sos.state.or.us/oard/view.action?ruleNumber=333-011-0273 | 2026-10-26 |
| R5 | OAR 333-011-0340 | https://secure.sos.state.or.us/oard/view.action?ruleNumber=333-011-0340 | 2026-10-26 |
| R6 | OHA, change birth record to support gender identity | https://www.oregon.gov/oha/ph/birthdeathcertificates/pages/changebirthsupportgenderidentity.aspx | 2026-10-26 |
| R7 | OHA 2673 and information sheet (03/26) | https://www.oregon.gov/oha/PH/BIRTHDEATHCERTIFICATES/Document%20Forms/OHA2673FormEnglish.pdf | 2026-10-26 |
| R8 | OHA 45-17A (07/26) | https://www.oregon.gov/oha/PH/BIRTHDEATHCERTIFICATES/Document%20Forms/45-17A.pdf | 2026-10-26 |
| R9 | OHA court-order name-change request (04/26) | https://www.oregon.gov/oha/PH/BIRTHDEATHCERTIFICATES/Document%20Forms/CourtOrderNameChangeForm.pdf | 2026-10-26 |
| R10 | OHA rulemaking page | https://www.oregon.gov/oha/ph/birthdeathcertificates/pages/vitalrecordsrulemaking.aspx | 2026-10-26 |
| R11 | OHA, change a birth record | https://www.oregon.gov/oha/ph/birthdeathcertificates/pages/changebirthrecord.aspx | 2026-10-26 |
| R12 | Oregon DMV, gender marker | https://www.oregon.gov/odot/dmv/pages/driverid/chg_gender_designation.aspx | 2026-10-26 |
| R13 | Oregon DMV, name | https://www.oregon.gov/odot/dmv/pages/dv/chgname.aspx | 2026-10-26 |
| R14 | Social Security, change name | https://www.ssa.gov/life-events/change-name | 2026-10-26 |
| R15 | State Department, sex markers in passports | https://travel.state.gov/en/passports/apply/unique-needs/sex-markers.html | 2026-10-26 |
| R16 | OAR 333-011-0275 | https://secure.sos.state.or.us/oard/view.action?ruleNumber=333-011-0275 | 2026-10-26 |
| N1 | OHA Notice of Proposed Rulemaking, September 2026 | https://www.oregon.gov/oha/PH/BIRTHDEATHCERTIFICATES/Document%20Forms/RulesLegislature/333-011NoticeofProposedRulemaking_9-2026.pdf | 2026-10-26 |
| N2 | OHA 45-13A (04/26) | https://www.oregon.gov/oha/PH/BIRTHDEATHCERTIFICATES/Document%20Forms/45-13A.pdf | 2026-10-26 |
| N3 | OSB Formal Opinion 2005-137 | https://www.osbar.org/_docs/ethics/2005-137.pdf | 2026-10-26 |
| N4 | OSB UPL advisory opinions page | https://www.osbar.org/upl/advisoryopinions.html | 2026-10-26 |

The bundled copies of R7, R8 and R9 are in `public/forms/oregon-oha/2026-10-26-checked/`. Their SHA-256 values are in `lib/records-data.ts`.

## 11. How each output is used (added after review)

- **Administrative route:** one PDF, the OHA 2673. Item 15 on the 2673 orders new copies, and the fee total (amendment plus copies) is the one payment. No 45-17A is produced, so copies and fees cannot be ordered twice. The 2673 has no field for exchanging older certificates, and R6 lists "$5 Replacement Fee (if required)" without saying how it applies to this form, so the app does not prepare exchanges on this route and sends that separate question to OHA. It does not say old certificates may not be sent.
- **Court route:** 45-17A (all fees and any copies and exchanges) plus, when the name changes, the court-order name request, which has no fees. One payment.
- **Names:** "name on the record" (current name on the birth certificate) and the "new name" come from the record and judgment answers. The "person ordering" on 45-17A and the printed name on the court-order request use the name on the photo ID the applicant will send, so the printed name matches the signature. Source: OHA, "When signing the form be sure to use the name as it appears on the ID being submitted" (R11, Guidelines for Completing Affidavits). Tested in `tests/records.test.mjs`.
- **ID:** R6 and R7 accept any ONE current photo ID from OHA's list, or any THREE listed documents with at least one showing the current address. The result checklist says both and links the list. Photo ID is not presented as mandatory.
- **Downloads:** file names are neutral (`oha-2673-application.pdf`, `oha-45-17A-order-form.pdf`, `oha-court-order-name-request.pdf`) so no name appears in a file name.
