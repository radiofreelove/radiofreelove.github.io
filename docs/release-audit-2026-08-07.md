# Release audit — August 7, 2026

Identity Navigator assembles documents and routes unsupported cases. It does not file, sign, decide eligibility, or predict rulings.

## Oregon

- **Adult packet:** OJD July 2026. The downloaded PDF matched SHA-256 `4fda2bb8cc99bae57dfce08588ab7bc5fea28b504d60f22860847fc214700927`.
- **Fee packet:** OJD instructions dated January 2026 and application/order dated February 2022. The PDF matched SHA-256 `e4a1f2f978f81d7278af8b073654ecd4e9a5dffe320af2bc249b38320afc26ac`.
- **Routing:** Adult name-only cases use the county of residence. Sex-only and combined cases may use any Oregon circuit court. A filing that includes a legal-sex change is confidential. A hearing occurs only if the court directs one.
- **Fee handling:** One application per fee. The restricted-access application stays separate, and no finding or decision is selected on the proposed order.
- **Sources:** [adult packet](https://www.courts.oregon.gov/forms/Documents/Name%20and%20Sex%20Change%20Packet%20%28Adult%29.pdf), [fee packet](https://www.courts.oregon.gov/forms/Documents/EntirePacket10.pdf), [ORS chapter 33](https://www.oregonlegislature.gov/bills_laws/ors/ors033.html), [ORS 21.145](https://www.oregonlegislature.gov/bills_laws/ors/ors021.html)

## Washington — King County

- **Individual petition:** KCDC July 2026. The PDF matched SHA-256 `362c90497ebf8f978ea747a5ddb252b66e20211b74e109c3d0786943882680f4`.
- **Fee forms:** KCDC October 2025. The PDF matched SHA-256 `688e31b40aa167fd2bca33c7f90d0e496654b1169b2a5ec1705edb42defff1c1`.
- **Routing:** The generated District Court route is public. Protected filings go to Superior Court. Other counties do not use King County forms. Sex-offender and Department of Corrections notice cases stop for review.
- **Fee handling:** The motion requests the name-change filing fee. The confidential financial statement downloads separately.
- **Sources:** [KCDC name changes](https://kingcounty.gov/en/court/district-court/courts-jails-legal-system/name-changes), [RCW 4.24.130](https://app.leg.wa.gov/RCW/default.aspx?cite=4.24.130), [Washington GR 34 forms](https://www.courts.wa.gov/forms/?fa=forms.contribute&formID=87)

## Idaho

- The Court Assistance Office page listed the same statewide adult set: civil cover sheet, unredacted and redacted petitions, notice, publication letter, and judgment.
- The forms host blocked a second byte download. The local hashes were rechecked, and the live page and revision labels were reviewed. No new source-byte match is claimed.
- The fee-waiver affidavit requires every blank to be completed and a proposed order. Because that sworn workflow is not fully modeled, the app links to the Court Assistance Office.
- **Sources:** [name-change forms](https://courtselfhelp.idaho.gov/Forms/name), [cost and fee-waiver forms](https://courtselfhelp.idaho.gov/Forms/Costs), [motion and affidavit](https://courtselfhelp.idaho.gov/docs/forms/CAO_FW_1-9.pdf), [proposed order](https://courtselfhelp.idaho.gov/docs/forms/CAO_FW_1-10.pdf)

## Utah

- The current adult process page was reviewed after the May 6, 2026 fee changes. It still directs qualifying users to the adult name or sex-designation process and to MyPaperwork for fee help.
- The template endpoint was unavailable during the August 7 byte check. The bundled 1158XX, 1730FA, and 1731FA files keep their August 1, 2026 verification dates. The current process, routing, fee, and waiver pages were rechecked August 7.
- Expanded case or registry facts and unmet evidence statements route to Utah Courts or MyPaperwork. The app does not encode benefit or income thresholds as permanent rules.
- **Sources:** [adult name or sex-designation change](https://www.utcourts.gov/en/self-help/case-categories/family/name-change/sex-change.html), [fees](https://www.utcourts.gov/en/self-help/legal-help/procedures/fees.html), [fee waiver](https://www.utcourts.gov/en/self-help/legal-help/procedures/waiver.html), [Utah Code 26B-8-111](https://le.utah.gov/xcode/Title26B/Chapter8/26B-8-S111.html)

## PDF and application QA

- Generated ten samples: Oregon name, sex, combined, and waiver; King County name and waiver; Idaho name; Utah name, sex, and combined.
- Rendered every page and corrected title-checkbox, dropdown, caption, and proposed-order placement.
- Confirmed zero AcroForm fields, widget annotations, and broken annotations. Signature, filing date, case number, hearing, clerk, and judicial fields remained blank.
- Ran form-hash verification, TypeScript, ESLint, the production build, offline-cache checks, and routing tests.

**Next review deadline:** November 5, 2026.
