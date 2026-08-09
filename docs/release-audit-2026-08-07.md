# Release audit — August 7, 2026

This audit records the source review for the production release. Identity Navigator assembles documents and routes edge cases; it does not file, sign, determine eligibility, or predict a ruling.

## Oregon

- Adult name/sex packet: OJD July 2026, exact official PDF downloaded again and matched SHA-256 `4fda2bb8cc99bae57dfce08588ab7bc5fea28b504d60f22860847fc214700927`.
- Fee packet: OJD instructions January 2026 and application/order February 2022, exact official PDF matched SHA-256 `e4a1f2f978f81d7278af8b073654ecd4e9a5dffe320af2bc249b38320afc26ac`.
- Routing checked: county of residence for adult name-only filings; any Oregon circuit court for sex-only or combined filings; every filing that includes a legal-sex change is confidential; no hearing unless the court directs one.
- Fee handling checked: one application per requested fee, confidential/restricted-access application, and proposed order with no court finding or decision preselected.
- Primary sources: [adult packet](https://www.courts.oregon.gov/forms/Documents/Name%20and%20Sex%20Change%20Packet%20%28Adult%29.pdf), [fee packet](https://www.courts.oregon.gov/forms/Documents/EntirePacket10.pdf), [ORS chapter 33](https://www.oregonlegislature.gov/bills_laws/ors/ors033.html), and [ORS 21.145](https://www.oregonlegislature.gov/bills_laws/ors/ors021.html).

## Washington — King County

- Individual petition: KCDC July 2026, exact official PDF downloaded again and matched SHA-256 `362c90497ebf8f978ea747a5ddb252b66e20211b74e109c3d0786943882680f4`.
- Fee motion and financial statement: KCDC October 2025, exact official PDF matched SHA-256 `688e31b40aa167fd2bca33c7f90d0e496654b1169b2a5ec1705edb42defff1c1`.
- Routing checked: the generated District Court route is public; qualifying protected filings are routed to Superior Court; non-King counties are not mapped to King County forms; sex-offender and Department of Corrections notice cases stop for review.
- Fee handling checked: the motion requests the name-change case fee, and the financial statement remains a separately labeled confidential file.
- Primary sources: [KCDC name-change process](https://kingcounty.gov/en/court/district-court/courts-jails-legal-system/name-changes), [RCW 4.24.130](https://app.leg.wa.gov/RCW/default.aspx?cite=4.24.130), and [Washington GR 34 forms](https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=87).

## Idaho

- The current Court Assistance Office name-change page still lists the statewide adult set used here: civil cover sheet, unredacted petition, redacted petition, notice, publication letter, and judgment. The displayed form revisions were unchanged during this review.
- The official forms host blocked a second raw byte download, so the already registered local SHA-256 values were revalidated and the live court page/revision labels were checked instead of claiming a new byte-for-byte source comparison.
- The fee-waiver affidavit says every blank must be completed, using `N/A` where needed, and requires a proposed order. Because that longer sworn workflow is not fully modeled, the PWA routes to the official Court Assistance Office instead of producing a partial form.
- Primary sources: [name-change forms](https://courtselfhelp.idaho.gov/Forms/name), [cost and fee-waiver forms](https://courtselfhelp.idaho.gov/Forms/Costs), [motion and affidavit](https://courtselfhelp.idaho.gov/docs/forms/CAO_FW_1-9.pdf), and [proposed order](https://courtselfhelp.idaho.gov/docs/forms/CAO_FW_1-10.pdf).

## Utah

- The current Utah Courts adult process page was reviewed after the May 6, 2026 fee changes. It continues to direct qualifying users to the adult name/sex process and supports fee-waiver preparation through MyPaperwork.
- Utah’s direct template endpoint was unavailable during the August 7 byte recheck. The bundled 1158XX, 1730FA, and 1731FA bytes therefore retain their August 1, 2026 check labels; the current process, routing, fee page, and waiver page were rechecked on August 7.
- The PWA routes expanded case/registry facts and unsatisfied evidence statements to Utah Courts or MyPaperwork. It links to the official fee-waiver decision path rather than encoding benefit/income thresholds as a permanent rule.
- Primary sources: [adult name or sex designation change](https://www.utcourts.gov/en/self-help/case-categories/family/name-change/sex-change.html), [fees](https://www.utcourts.gov/en/self-help/legal-help/procedures/fees.html), [fee waiver](https://www.utcourts.gov/en/self-help/legal-help/procedures/waiver.html), and [Utah Code 26B-8-111](https://le.utah.gov/xcode/Title26B/Chapter8/26B-8-S111.html).

## PDF and application QA

- Generated ten representative outputs: Oregon name, sex, combined, and waiver; King County name and waiver; Idaho name; Utah name, sex, and combined.
- Rendered every page and corrected title-checkbox, dropdown-appearance, caption, and proposed-order placement issues found during the first pass.
- Confirmed every generated PDF has zero AcroForm fields, zero widget annotations, zero broken annotations, and no prefilled signature, filing date, case number, hearing, clerk, or judge decision.
- Ran form-hash verification, TypeScript, ESLint, production build, offline precache checks, and routing tests.

Next scheduled review deadline: **November 5, 2026**.
