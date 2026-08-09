import type {
  ChangeGoal,
  JurisdictionConfig,
  StateCode,
} from "./types";

export const REVIEWED_ON = "2026-08-07";
export const REVIEW_BY = "2026-11-05";

export const WASHINGTON_COUNTIES = [
  "Adams",
  "Asotin",
  "Benton",
  "Chelan",
  "Clallam",
  "Clark",
  "Columbia",
  "Cowlitz",
  "Douglas",
  "Ferry",
  "Franklin",
  "Garfield",
  "Grant",
  "Grays Harbor",
  "Island",
  "Jefferson",
  "King",
  "Kitsap",
  "Kittitas",
  "Klickitat",
  "Lewis",
  "Lincoln",
  "Mason",
  "Okanogan",
  "Pacific",
  "Pend Oreille",
  "Pierce",
  "San Juan",
  "Skagit",
  "Skamania",
  "Snohomish",
  "Spokane",
  "Stevens",
  "Thurston",
  "Wahkiakum",
  "Walla Walla",
  "Whatcom",
  "Whitman",
  "Yakima",
] as const;

export const OREGON_COUNTIES = [
  "Baker",
  "Benton",
  "Clackamas",
  "Clatsop",
  "Columbia",
  "Coos",
  "Crook",
  "Curry",
  "Deschutes",
  "Douglas",
  "Gilliam",
  "Grant",
  "Harney",
  "Hood River",
  "Jackson",
  "Jefferson",
  "Josephine",
  "Klamath",
  "Lake",
  "Lane",
  "Lincoln",
  "Linn",
  "Malheur",
  "Marion",
  "Morrow",
  "Multnomah",
  "Polk",
  "Sherman",
  "Tillamook",
  "Umatilla",
  "Union",
  "Wallowa",
  "Wasco",
  "Washington",
  "Wheeler",
  "Yamhill",
] as const;

export const IDAHO_COUNTIES = [
  "Ada",
  "Adams",
  "Bannock",
  "Bear Lake",
  "Benewah",
  "Bingham",
  "Blaine",
  "Boise",
  "Bonner",
  "Bonneville",
  "Boundary",
  "Butte",
  "Camas",
  "Canyon",
  "Caribou",
  "Cassia",
  "Clark",
  "Clearwater",
  "Custer",
  "Elmore",
  "Franklin",
  "Fremont",
  "Gem",
  "Gooding",
  "Idaho",
  "Jefferson",
  "Jerome",
  "Kootenai",
  "Latah",
  "Lemhi",
  "Lewis",
  "Lincoln",
  "Madison",
  "Minidoka",
  "Nez Perce",
  "Oneida",
  "Owyhee",
  "Payette",
  "Power",
  "Shoshone",
  "Teton",
  "Twin Falls",
  "Valley",
  "Washington",
] as const;

export const UTAH_COUNTIES = [
  "Beaver",
  "Box Elder",
  "Cache",
  "Carbon",
  "Daggett",
  "Davis",
  "Duchesne",
  "Emery",
  "Garfield",
  "Grand",
  "Iron",
  "Juab",
  "Kane",
  "Millard",
  "Morgan",
  "Piute",
  "Rich",
  "Salt Lake",
  "San Juan",
  "Sanpete",
  "Sevier",
  "Summit",
  "Tooele",
  "Uintah",
  "Utah",
  "Wasatch",
  "Washington",
  "Wayne",
  "Weber",
] as const;

export const IDAHO_COURT_DETAILS: Record<
  string,
  { district: string; newspaper: string }
> = {
  Benewah: { district: "FIRST", newspaper: "St. Maries Gazette Record" },
  Bonner: { district: "FIRST", newspaper: "Bonner County Daily Bee" },
  Boundary: { district: "FIRST", newspaper: "Bonners Ferry Herald" },
  Kootenai: { district: "FIRST", newspaper: "The Coeur d’Alene Press" },
  Shoshone: { district: "FIRST", newspaper: "Shoshone News Press" },
  Clearwater: { district: "SECOND", newspaper: "Clearwater Tribune" },
  Idaho: { district: "SECOND", newspaper: "Idaho County Free Press" },
  Latah: { district: "SECOND", newspaper: "Moscow-Pullman Daily News" },
  Lewis: { district: "SECOND", newspaper: "Lewis County Herald" },
  "Nez Perce": { district: "SECOND", newspaper: "Lewiston Morning Tribune" },
  Adams: { district: "THIRD", newspaper: "The Adams County Record" },
  Canyon: { district: "THIRD", newspaper: "The Idaho Press Tribune" },
  Gem: { district: "THIRD", newspaper: "The Messenger-Index" },
  Owyhee: { district: "THIRD", newspaper: "The Owyhee Avalanche" },
  Payette: { district: "THIRD", newspaper: "The Independent-Enterprise" },
  Washington: { district: "THIRD", newspaper: "The Weiser Signal American" },
  Ada: { district: "FOURTH", newspaper: "The Idaho Statesman" },
  Boise: { district: "FOURTH", newspaper: "The Idaho World" },
  Elmore: { district: "FOURTH", newspaper: "Mountain Home News" },
  Valley: { district: "FOURTH", newspaper: "Star News" },
  Blaine: { district: "FIFTH", newspaper: "Idaho Mountain Express" },
  Camas: { district: "FIFTH", newspaper: "The Courier NEWS" },
  Cassia: { district: "FIFTH", newspaper: "Times-News" },
  Gooding: { district: "FIFTH", newspaper: "Times-News" },
  Jerome: { district: "FIFTH", newspaper: "Times-News" },
  Lincoln: { district: "FIFTH", newspaper: "Times-News" },
  Minidoka: { district: "FIFTH", newspaper: "Times-News" },
  "Twin Falls": { district: "FIFTH", newspaper: "Times-News" },
  Bannock: { district: "SIXTH", newspaper: "Idaho State Journal" },
  "Bear Lake": { district: "SIXTH", newspaper: "News-Examiner" },
  Caribou: { district: "SIXTH", newspaper: "Caribou County Sun" },
  Franklin: { district: "SIXTH", newspaper: "Preston Citizen" },
  Oneida: { district: "SIXTH", newspaper: "The Idaho Enterprise" },
  Power: {
    district: "SIXTH",
    newspaper: "The Power County Press and Aberdeen Times",
  },
  Bingham: { district: "SEVENTH", newspaper: "The Morning News" },
  Bonneville: { district: "SEVENTH", newspaper: "The Post Register" },
  Butte: { district: "SEVENTH", newspaper: "The Arco Advertiser" },
  Custer: { district: "SEVENTH", newspaper: "The Challis Messenger" },
  Clark: { district: "SEVENTH", newspaper: "The Jefferson Star" },
  Fremont: {
    district: "SEVENTH",
    newspaper: "The Rexburg Standard Journal",
  },
  Jefferson: { district: "SEVENTH", newspaper: "The Jefferson Star" },
  Lemhi: { district: "SEVENTH", newspaper: "The Recorder Herald" },
  Madison: {
    district: "SEVENTH",
    newspaper: "The Rexburg Standard Journal",
  },
  Teton: { district: "SEVENTH", newspaper: "The Teton Valley News" },
};

export const UTAH_JUDICIAL_DISTRICT: Record<string, string> = {
  "Box Elder": "First",
  Cache: "First",
  Rich: "First",
  Davis: "Second",
  Morgan: "Second",
  Weber: "Second",
  "Salt Lake": "Third",
  Summit: "Third",
  Tooele: "Third",
  Juab: "Fourth",
  Millard: "Fourth",
  Utah: "Fourth",
  Wasatch: "Fourth",
  Beaver: "Fifth",
  Iron: "Fifth",
  Washington: "Fifth",
  Garfield: "Sixth",
  Kane: "Sixth",
  Piute: "Sixth",
  Sanpete: "Sixth",
  Sevier: "Sixth",
  Wayne: "Sixth",
  Carbon: "Seventh",
  Emery: "Seventh",
  Grand: "Seventh",
  "San Juan": "Seventh",
  Daggett: "Eighth",
  Duchesne: "Eighth",
  Uintah: "Eighth",
};

const NAME_ONLY: readonly ChangeGoal[] = ["name"];
const NAME_SEX_BOTH: readonly ChangeGoal[] = ["name", "sex", "both"];

export const JURISDICTIONS: Record<StateCode, JurisdictionConfig> = {
  WA: {
    code: "WA",
    name: "Washington",
    accent: "#385f80",
    verifiedOn: REVIEWED_ON,
    reviewBy: REVIEW_BY,
    generatorCoverage:
      "Adult individual name change in King County District Court. Other counties and confidential Superior Court filings are routed to the official court.",
    counties: WASHINGTON_COUNTIES,
    goals: NAME_ONLY,
    templates: [
      {
        id: "wa-king-individual-petition-2026-07",
        title: "King County Petition for Name Change - Individual",
        localPath:
          "/forms/washington/king/2026-07/individual-petition.pdf",
        officialUrl:
          "https://cdn.kingcounty.gov/-/media/king-county/courts/district-court/forms_resources_library_docs/name-change-forms/petition-for-name-change-individual-july_2026.pdf",
        revision: "KCDC July 2026",
        sha256:
          "362c90497ebf8f978ea747a5ddb252b66e20211b74e109c3d0786943882680f4",
      },
    ],
    feeWaiver: {
      mode: "generated",
      title: "King County motion and confidential financial statement",
      description:
        "Prepared separately from the public name-change petition. The court decides whether fees are waived.",
      officialUrl:
        "https://cdn.kingcounty.gov/-/media/king-county/courts/district-court/forms_resources_library_docs/name-change-forms/motion_and_declaration_for_waiver_of_fees_and_surcharges_october-2025.pdf?hash=CC9B1EBEA7AA9C8CBDF22669671B0559&rev=59a1206477a942f38d7ea74ce9327661",
      template: {
        id: "wa-king-fee-waiver-2025-10",
        title: "King County Motion and Declaration for Waiver of Civil Fees and Surcharges",
        localPath:
          "/forms/washington/king/fee-waiver/2025-10/motion-and-financial-statement.pdf",
        officialUrl:
          "https://cdn.kingcounty.gov/-/media/king-county/courts/district-court/forms_resources_library_docs/name-change-forms/motion_and_declaration_for_waiver_of_fees_and_surcharges_october-2025.pdf?hash=CC9B1EBEA7AA9C8CBDF22669671B0559&rev=59a1206477a942f38d7ea74ce9327661",
        revision: "KCDC October 2025",
        sha256:
          "688e31b40aa167fd2bca33c7f90d0e496654b1169b2a5ec1705edb42defff1c1",
      },
    },
    authorities: [
      {
        label: "Washington Courts: name changes",
        url: "https://www.courts.wa.gov/forms/?fa=forms.static&staticID=13",
        kind: "court",
      },
      {
        label: "RCW 4.24.130",
        url: "https://app.leg.wa.gov/RCW/default.aspx?cite=4.24.130",
        kind: "statute",
      },
      {
        label: "King County District Court process and fees",
        url: "https://kingcounty.gov/en/court/district-court/courts-jails-legal-system/name-changes",
        kind: "fees",
      },
      {
        label: "Washington court directory",
        url: "https://www.courts.wa.gov/court_dir/",
        kind: "help",
      },
    ],
  },
  OR: {
    code: "OR",
    name: "Oregon",
    accent: "#2f7d5f",
    verifiedOn: REVIEWED_ON,
    reviewBy: REVIEW_BY,
    generatorCoverage:
      "Statewide adult petition and proposed general judgment for name change, legal-sex change, or both.",
    counties: OREGON_COUNTIES,
    goals: NAME_SEX_BOTH,
    templates: [
      {
        id: "or-adult-name-sex-packet-2026-07",
        title: "Oregon adult change of name or sex packet",
        localPath:
          "/forms/oregon/2026-07/adult-name-sex-change-packet.pdf",
        officialUrl:
          "https://www.courts.oregon.gov/forms/Documents/Name%20and%20Sex%20Change%20Packet%20%28Adult%29.pdf",
        revision: "OJD July 2026",
        sha256:
          "4fda2bb8cc99bae57dfce08588ab7bc5fea28b504d60f22860847fc214700927",
      },
    ],
    feeWaiver: {
      mode: "generated",
      title: "Oregon fee deferral or waiver application and proposed order",
      description:
        "Prepared as a separate restricted-access application. The proposed order leaves every court finding and ruling blank.",
      officialUrl:
        "https://www.courts.oregon.gov/forms/Documents/EntirePacket10.pdf",
      template: {
        id: "or-fee-deferral-waiver-2026-01",
        title: "Oregon Fee Deferral or Waiver Packet",
        localPath:
          "/forms/oregon/fee-waiver/2026-01/fee-deferral-waiver-packet.pdf",
        officialUrl:
          "https://www.courts.oregon.gov/forms/Documents/EntirePacket10.pdf",
        revision: "OJD instructions January 2026; forms February 2022",
        sha256:
          "e4a1f2f978f81d7278af8b073654ecd4e9a5dffe320af2bc249b38320afc26ac",
      },
    },
    authorities: [
      {
        label: "OJD official adult packet",
        url: "https://www.courts.oregon.gov/forms/Documents/Name%20and%20Sex%20Change%20Packet%20%28Adult%29.pdf",
        kind: "court",
      },
      {
        label: "ORS 33.410 and ORS 33.460",
        url: "https://www.oregonlegislature.gov/bills_laws/ors/ors033.html",
        kind: "statute",
      },
      {
        label: "2026 Oregon circuit-court fee schedule",
        url: "https://www.courts.oregon.gov/Documents/2026_CircuitFeeSchedule_public_eff-2026-01-01.pdf",
        kind: "fees",
      },
      {
        label: "OJD court locations",
        url: "https://www.courts.oregon.gov/courts/Pages/default.aspx",
        kind: "help",
      },
    ],
  },
  ID: {
    code: "ID",
    name: "Idaho",
    accent: "#7a5a2f",
    verifiedOn: REVIEWED_ON,
    reviewBy: REVIEW_BY,
    generatorCoverage:
      "Statewide adult name-change filing packet, including redacted and unredacted petitions, notice, publication letter, and proposed judgment.",
    counties: IDAHO_COUNTIES,
    goals: NAME_ONLY,
    templates: [
      {
        id: "id-civil-cover-2023-05",
        title: "General Civil Case Information Sheet",
        localPath: "/forms/idaho/2026-08-checked/civil-cover-sheet.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/Civil_Cover_Sheet.pdf",
        revision: "May 30, 2023",
        sha256:
          "28ea03f43b27bbdaa86520d7db57b22d6529e9d2e3d9bd1ae909c27d3a02af1b",
      },
      {
        id: "id-unredacted-petition-2019-07",
        title: "Unredacted Petition for Name Change",
        localPath: "/forms/idaho/2026-08-checked/unredacted-petition.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/CAO_NCA_1-1.pdf",
        revision: "CAO NCA 1-1 07/01/2019",
        sha256:
          "33976b0d1d5c4a12c9251e906f58f9ca951668c51b27db8fa2f0381ff4f788c9",
      },
      {
        id: "id-redacted-petition-2019-07",
        title: "Redacted Petition for Name Change",
        localPath: "/forms/idaho/2026-08-checked/redacted-petition.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/CAO_NCA_1-1R.pdf",
        revision: "CAO NCA 1-1 07/01/2019",
        sha256:
          "af3a07b7d90c65eade7e13ff556cd61de54865093a24a1434250ceaebdf5e464",
      },
      {
        id: "id-notice-2017-07",
        title: "Notice of Hearing on Name Change",
        localPath: "/forms/idaho/2026-08-checked/notice-of-hearing.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/CAO_NCA_1-2.pdf",
        revision: "CAO NCA 1-2 07/01/2017",
        sha256:
          "4a85bca97318f66bc4d4746f86634ced2ba87e7425aea125e9e13f856cc7cdfa",
      },
      {
        id: "id-publication-letter-2016-07",
        title: "Letter Requesting Publication of Notice",
        localPath: "/forms/idaho/2026-08-checked/publication-letter.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/CAO_NC_1-3.pdf",
        revision: "CAO NC 1-3 07/01/2016",
        sha256:
          "6d760df2550627555adf7c8f501848c38fdd441cd701a9fa4bb949c256b3f391",
      },
      {
        id: "id-judgment-2016-07",
        title: "Judgment for Name Change",
        localPath: "/forms/idaho/2026-08-checked/judgment.pdf",
        officialUrl:
          "https://courtselfhelp.idaho.gov/docs/forms/CAO_NCA_8-1.pdf",
        revision: "CAO NCA 8-1 07/01/2016",
        sha256:
          "8ce3495c3c686faa270c97c13006709eec29018550ea4fd6102146268a12437d",
      },
    ],
    feeWaiver: {
      mode: "official-route",
      title: "Idaho fee-waiver motion, affidavit, and proposed order",
      description:
        "Idaho’s six-page sworn financial affidavit requires a longer, court-specific review. Use the Court Assistance Office forms and enter N/A in every inapplicable blank.",
      officialUrl: "https://courtselfhelp.idaho.gov/Forms/Costs",
      secondaryUrl:
        "https://courtselfhelp.idaho.gov/docs/forms/CAO_FW_1-9.pdf",
    },
    authorities: [
      {
        label: "Idaho Court Assistance Office name-change forms",
        url: "https://courtselfhelp.idaho.gov/Forms/name",
        kind: "court",
      },
      {
        label: "Designated county newspapers",
        url: "https://courtselfhelp.idaho.gov/docs/County_Newspapers_for_Name_Change_Petition_Notice.pdf",
        kind: "court",
      },
      {
        label: "Idaho court costs and fee waiver",
        url: "https://courtselfhelp.idaho.gov/Forms/Costs",
        kind: "fees",
      },
      {
        label: "Idaho legal aid name-change information",
        url: "https://idaholegalaid.org/resources/name-changes",
        kind: "help",
      },
    ],
  },
  UT: {
    code: "UT",
    name: "Utah",
    accent: "#74507a",
    verifiedOn: REVIEWED_ON,
    reviewBy: REVIEW_BY,
    generatorCoverage:
      "Statewide adult probate cover sheet, petition, and proposed order for name change, sex designation change, or both.",
    counties: UTAH_COUNTIES,
    goals: NAME_SEX_BOTH,
    templates: [
      {
        id: "ut-cover-1158XX",
        title: "Utah District Court Cover Sheet for Probate Cases",
        localPath: "/forms/utah/2025-04/1158XX-cover-sheet.pdf",
        officialUrl:
          "https://apps.utcourts.gov/aem-services/aem/forms/template/1158XX",
        revision: "Form 1158XX, checked August 1, 2026",
        sha256:
          "056bb396f08ce4106fa36500a8bff48f01aa054fefd92e39cdfd9d51b98511f1",
      },
      {
        id: "ut-petition-1730FA",
        title: "Petition for Name or Sex Change",
        localPath: "/forms/utah/2025-04/1730FA-petition.pdf",
        officialUrl:
          "https://apps.utcourts.gov/aem-services/aem/forms/template/1730FA",
        revision: "Form 1730FA, checked August 1, 2026",
        sha256:
          "a582e3c4f7201ac13424ec0c6c1cc64318eaf7ede9d12b6e812aea6f05c60d6e",
      },
      {
        id: "ut-order-1731FA",
        title: "Order on Petition for Name or Sex Change",
        localPath: "/forms/utah/2025-04/1731FA-order.pdf",
        officialUrl:
          "https://apps.utcourts.gov/aem-services/aem/forms/template/1731FA",
        revision: "Form 1731FA revised April 14, 2025",
        sha256:
          "a8cced24d2e6ead1def845e2c7b398764011f3b53552fc8c0c214500801058d4",
      },
    ],
    feeWaiver: {
      mode: "official-route",
      title: "Utah fee-waiver application",
      description:
        "Utah Courts uses benefit, income, and necessities-based paths. MyPaperwork can prepare and file the current request.",
      officialUrl:
        "https://www.utcourts.gov/en/self-help/legal-help/procedures/waiver.html",
      secondaryUrl:
        "https://mycourtcase.utah.gov/",
    },
    authorities: [
      {
        label: "Utah Courts adult name or sex designation change",
        url: "https://www.utcourts.gov/en/self-help/case-categories/family/name-change/sex-change.html",
        kind: "court",
      },
      {
        label: "Utah Code 26B-8-111",
        url: "https://le.utah.gov/xcode/Title26B/Chapter8/26B-8-S111.html",
        kind: "statute",
      },
      {
        label: "Utah filing fees",
        url: "https://www.utcourts.gov/en/self-help/legal-help/procedures/fees.html",
        kind: "fees",
      },
      {
        label: "Utah court directory",
        url: "https://www.utcourts.gov/en/about/miscellaneous/directory.html",
        kind: "help",
      },
    ],
  },
};

export function getJurisdiction(code?: StateCode) {
  return code ? JURISDICTIONS[code] : undefined;
}

export function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function isReviewOverdue(config: JurisdictionConfig, now = new Date()) {
  const cutoff = new Date(`${config.reviewBy}T23:59:59Z`);
  return now.getTime() > cutoff.getTime();
}
