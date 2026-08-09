export type StateCode = "WA" | "OR" | "ID" | "UT";

export type ChangeGoal = "name" | "sex" | "both";

export type LegalSex = "male" | "female" | "nonbinary";

export type YesNo = "yes" | "no";

export type EmploymentStatus = "employed" | "unemployed";

export interface NavigatorAnswers {
  adult?: YesNo;
  residenceState?: StateCode;
  county?: string;
  goal?: ChangeGoal;
  feeHelp?: YesNo;
  rememberDraft?: boolean;

  currentFirst?: string;
  currentMiddle?: string;
  currentLast?: string;
  currentSuffix?: string;
  birthFirst?: string;
  birthMiddle?: string;
  birthLast?: string;
  newFirst?: string;
  newMiddle?: string;
  newLast?: string;
  newSuffix?: string;

  address?: string;
  city?: string;
  addressState?: string;
  zip?: string;
  phone?: string;
  email?: string;

  dateOfBirth?: string;
  birthCity?: string;
  birthCounty?: string;
  birthState?: string;
  reason?: string;
  formerNames?: string;

  signingCity?: string;
  signingDate?: string;

  // Fee-waiver answers are deliberately excluded from saved drafts.
  feeDateOfBirth?: string;

  // Oregon disclosures and legal-sex attestation.
  orChildSupport?: YesNo;
  orProtectionOrder?: YesNo;
  orSupervision?: YesNo;
  orSexOffender?: YesNo;
  orPublicInterestExplanation?: string;
  orTreatmentAttestation?: YesNo;
  orAcp?: YesNo;
  orFeeStateId?: string;
  orFeeHouseholdSize?: string;
  orFeeLegalAid?: YesNo;
  orFeeLegalAidName?: string;
  orFeeSnapAmount?: string;
  orFeeSsiAmount?: string;
  orFeeTanfAmount?: string;
  orFeeOhp?: YesNo;
  orFeeJobsIncome?: string;
  orFeeOtherIncome?: string;
  orFeeCash?: string;
  orFeeAssetsDescription?: string;
  orFeeAssetsValue?: string;
  orFeeHomeExpenses?: string;
  orFeeTransportExpenses?: string;
  orFeeOtherExpenses?: string;
  orFeeOtherInfo?: string;

  // Washington, King County District Court.
  waRoute?: "district-public" | "superior-confidential";
  waCourthouse?: string;
  waSexOffender?: YesNo;
  waDocJurisdiction?: YesNo;
  waPriorNameChange?: YesNo;
  waPriorDate?: string;
  waPriorLocation?: string;
  waPriorCourt?: string;
  waPriorCase?: string;
  waNoDetriment?: YesNo;
  waNoOpenProtectionOrder?: YesNo;
  waInterpreter?: YesNo;
  waInterpreterLanguage?: string;
  waPronouns?: string;
  waFeeAdditionalInfo?: string;
  waFeeFiledByMail?: YesNo;
  waFeeSupportsOthers?: YesNo;
  waFeeSupportCount?: string;
  waFeeSupportAges?: string;
  waFeeEmploymentStatus?: EmploymentStatus;
  waFeeEmployer?: string;
  waFeeGrossPay?: string;
  waFeeTakeHomePay?: string;
  waFeeOtherIncomeLines?: string;
  waFeeGovernmentAssistance?: string;
  waFeeFoodStamps?: YesNo;
  waFeeCash?: string;
  waFeeChecking?: string;
  waFeeSavings?: string;
  waFeeAuto1?: string;
  waFeeAuto2?: string;
  waFeeHome?: string;
  waFeeOtherAssetLines?: string;
  waFeeRent?: string;
  waFeeFood?: string;
  waFeeUtilities?: string;
  waFeeTransportation?: string;
  waFeeMaintenance?: string;
  waFeeChildSupport?: string;
  waFeeClothing?: string;
  waFeeChildCare?: string;
  waFeeEducation?: string;
  waFeeInsurance?: string;
  waFeeMedical?: string;
  waFeeOtherExpenseLines?: string;
  waFeeDebtLines?: string;

  // Idaho adult name-change packet.
  idSexOffender?: YesNo;
  idAvoidCreditors?: YesNo;

  // Utah adult name or sex designation change.
  utOtherCases?: YesNo;
  utProbationParole?: YesNo;
  utSexOffender?: YesNo;
  utResidencySince?: string;
  utCourtAddress?: string;
  utCurrentSex?: LegalSex;
  utRequestedSex?: LegalSex;
  utSixMonths?: YesNo;
  utDistress?: YesNo;
  utClinicalEvidence?: YesNo;
  utExpressionEvidence?: YesNo;
}

export type AnswerKey = keyof NavigatorAnswers;

export interface FormTemplate {
  id: string;
  title: string;
  localPath: string;
  officialUrl: string;
  revision: string;
  sha256: string;
}

export interface AuthorityLink {
  label: string;
  url: string;
  kind: "court" | "statute" | "fees" | "help";
}

export interface FeeWaiverConfig {
  mode: "generated" | "official-route";
  title: string;
  description: string;
  officialUrl: string;
  secondaryUrl?: string;
  template?: FormTemplate;
}

export interface JurisdictionConfig {
  code: StateCode;
  name: string;
  accent: string;
  verifiedOn: string;
  reviewBy: string;
  generatorCoverage: string;
  counties: readonly string[];
  goals: readonly ChangeGoal[];
  templates: readonly FormTemplate[];
  feeWaiver: FeeWaiverConfig;
  authorities: readonly AuthorityLink[];
}

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "textarea"
  | "select"
  | "radio";

export interface FieldOption {
  value: string;
  label: string;
  description?: string;
}

export interface WizardField {
  key: AnswerKey;
  label: string;
  type: FieldType;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  options?: readonly FieldOption[];
  inputMode?: "text" | "numeric" | "decimal" | "tel" | "email";
  min?: number;
  step?: string;
  span?: "full" | "half" | "third";
}

export interface WizardStep {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  fields: readonly WizardField[];
  sourceNote?: string;
}

export interface GenerationResult {
  bytes: Uint8Array;
  filename: string;
  packetLabel: string;
  revisionLabel: string;
  confidential?: boolean;
  filingNote?: string;
}
