import type { NavigatorAnswers } from "./types";

export interface CourtDetails {
  name: string;
  address: readonly string[];
  phone: string;
  officialUrl: string;
  checkedOn: string;
  note?: string;
}

const KING_COUNTY_LOCATIONS: Readonly<Record<string, CourtDetails>> = {
  "East Division, Bellevue Courthouse": {
    name: "King County District Court — Bellevue",
    address: ["1309 114th Ave. S.E., Suite 100", "Bellevue, WA 98004"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
    note: "The official location page says civil cases for this area are handled at the Redmond facility. Confirm the correct filing location before filing.",
  },
  "East Division, Issaquah Courthouse": {
    name: "King County District Court — Issaquah",
    address: ["5415 220th Ave. S.E.", "Issaquah, WA 98029-6839"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
    note: "The official location page says civil cases for this area are handled at the Redmond facility. Confirm the correct filing location before filing.",
  },
  "East Division, Redmond Courthouse": {
    name: "King County District Court — Redmond",
    address: ["8601 160th Ave. N.E.", "Redmond, WA 98052"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
  },
  "South Division, Burien Courthouse": {
    name: "King County District Court — Burien",
    address: ["601 S.W. 149th St.", "Burien, WA 98166"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
  },
  "South Division, MRJC Courthouse": {
    name: "King County District Court — Maleng Regional Justice Center",
    address: ["MRJC Office, 1A, 401 4th Ave. N.", "Kent, WA 98032"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
    note: "The official location page says civil cases for this area are handled at the Burien facility. Confirm the correct filing location before filing.",
  },
  "South Division, Vashon Courthouse": {
    name: "King County District Court — Vashon",
    address: ["10011 S.W. Bank Road", "Vashon, WA 98070"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
    note: "The official location page says this facility is open only one day each month and operates with Burien. Confirm the filing location and hours before going.",
  },
  "West Division, Seattle Courthouse": {
    name: "King County District Court — Seattle",
    address: ["King County Courthouse, 516 Third Ave., Room E-327", "Seattle, WA 98104"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
  },
  "West Division, Shoreline Courthouse": {
    name: "King County District Court — Shoreline",
    address: ["18050 Meridian Ave. N.", "Shoreline, WA 98133"],
    phone: "206-205-9200",
    officialUrl: "https://kingcounty.gov/courts/district-court/locations/bellevue.aspx",
    checkedOn: "2026-08-09",
    note: "The official location page says civil cases for this area are handled at the Seattle facility. Confirm the correct filing location before filing.",
  },
};

export function getKnownCourtDetails(answers: NavigatorAnswers) {
  if (
    answers.residenceState === "WA" &&
    answers.county === "King" &&
    answers.waCourthouse
  ) {
    return KING_COUNTY_LOCATIONS[answers.waCourthouse];
  }
  return undefined;
}
