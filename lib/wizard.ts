import {
  getJurisdiction,
  IDAHO_COURT_DETAILS,
  UTAH_JUDICIAL_DISTRICT,
} from "./jurisdictions";
import type {
  ChangeGoal,
  NavigatorAnswers,
  StateCode,
  WizardField,
  WizardStep,
} from "./types";

export interface BlockingOutcome {
  id: string;
  kind: "official-route" | "needs-review";
  title: string;
  description: string;
  nextStep: string;
}

const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
] as const;

const STATE_OPTIONS = [
  {
    value: "OR",
    label: "Oregon",
    description: "Name, legal-sex, or combined adult court packet",
  },
  {
    value: "WA",
    label: "Washington",
    description: "King County adult individual name-change petition",
  },
  {
    value: "ID",
    label: "Idaho",
    description: "Statewide adult name-change filing packet",
  },
  {
    value: "UT",
    label: "Utah",
    description: "Name, sex-designation, or combined adult packet",
  },
] as const;

const GOAL_OPTIONS = [
  {
    value: "name",
    label: "Change my legal name",
    description: "Prepare a court name-change petition.",
  },
  {
    value: "sex",
    label: "Change my legal sex designation",
    description: "Available here only where the court publishes a statewide form.",
  },
  {
    value: "both",
    label: "Change both",
    description: "Prepare one combined packet where the court allows it.",
  },
] as const;

const LEGAL_SEX_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "nonbinary", label: "Nonbinary / other" },
] as const;

function hasNameGoal(goal?: ChangeGoal) {
  return goal === "name" || goal === "both";
}

function hasSexGoal(goal?: ChangeGoal) {
  return goal === "sex" || goal === "both";
}

function commonNameFields(prefix: "current" | "birth" | "new") {
  const labels = {
    current: "Current legal",
    birth: "Name on birth certificate",
    new: "Requested new",
  } as const;
  return [
    {
      key: `${prefix}First`,
      label: `${labels[prefix]} first name`,
      type: "text",
      required: true,
      autoComplete: prefix === "current" ? "given-name" : "off",
      span: "half",
    },
    {
      key: `${prefix}Middle`,
      label: `${labels[prefix]} middle name`,
      type: "text",
      autoComplete: prefix === "current" ? "additional-name" : "off",
      span: "half",
    },
    {
      key: `${prefix}Last`,
      label: `${labels[prefix]} last name`,
      type: "text",
      required: true,
      autoComplete: prefix === "current" ? "family-name" : "off",
      span: "half",
    },
    ...(prefix === "birth"
      ? []
      : [
          {
            key: `${prefix}Suffix`,
            label: "Suffix",
            type: "text",
            autoComplete: "honorific-suffix",
            placeholder: "Jr., III",
            span: "half",
          },
        ]),
  ] as WizardField[];
}

function moneyField(
  key: keyof NavigatorAnswers,
  label: string,
  hint?: string,
): WizardField {
  return {
    key,
    label,
    type: "number",
    required: true,
    inputMode: "decimal",
    min: 0,
    step: "0.01",
    placeholder: "0",
    hint,
    span: "half",
  };
}

export function getWizardSteps(answers: NavigatorAnswers): WizardStep[] {
  const jurisdiction = getJurisdiction(answers.residenceState);
  const steps: WizardStep[] = [
    {
      id: "state",
      eyebrow: "First step",
      title: "Where do you live now?",
      description:
        "The state where you live now usually decides which court and forms you need. It may be different from the state on your birth certificate.",
      fields: [
        {
          key: "residenceState",
          label: "Current state of residence",
          type: "radio",
          required: true,
          options: STATE_OPTIONS,
        },
      ],
      sourceNote: "This tool currently prepares forms for Washington, Oregon, Idaho, and Utah.",
    },
  ];

  if (!jurisdiction) return steps;

  steps.push(
    {
      id: "county",
      eyebrow: jurisdiction.name,
      title: "Which county do you live in?",
      description:
        "We use your county to choose the court name printed on the form and to check whether the court requires a local form.",
      fields: [
        {
          key: "county",
          label: "County",
          type: "select",
          required: true,
          options: jurisdiction.counties.map((county) => ({
            value: county,
            label: `${county} County`,
          })),
        },
      ],
    },
    {
      id: "adult",
      eyebrow: "Who can use these forms",
      title: "Are you at least 18 years old?",
      description:
        "This tool prepares adult forms only. A child’s case or a guardianship case uses different forms.",
      fields: [
        {
          key: "adult",
          label: "Adult eligibility",
          type: "radio",
          required: true,
          options: YES_NO,
        },
      ],
    },
    {
      id: "goal",
      eyebrow: "Your filing",
      title: "What do you want the court to change?",
      fields: [
        {
          key: "goal",
          label: "Requested change",
          type: "radio",
          required: true,
          options: GOAL_OPTIONS,
        },
      ],
    },
  );

  if (answers.residenceState === "WA" && answers.county === "King") {
    steps.push({
      id: "wa-route",
      eyebrow: "Washington privacy options",
      title: "Which court option fits your filing?",
      description:
        "King County District Court name-change files are public. A qualifying Superior Court petition may be automatically sealed.",
      fields: [
        {
          key: "waRoute",
          label: "Court route",
          type: "radio",
          required: true,
          options: [
            {
              value: "district-public",
              label: "District Court — public record",
              description: "Use the official King County individual petition included here.",
            },
            {
              value: "superior-confidential",
              label: "Superior Court — confidential route",
              description: "Use the official court’s protected process instead of creating a PDF here.",
            },
          ],
        },
      ],
    });
  }

  steps.push({
    id: "fee-help",
    eyebrow: "Filing costs",
    title: "Would paying the court fees make it hard to cover basic needs?",
    description:
      "A fee waiver asks the court to reduce, delay, or excuse a filing fee. The court decides. Choosing yes will prepare the current request separately or link you to the court’s own process.",
    fields: [
      {
        key: "feeHelp",
        label: "Fee-waiver help",
        type: "radio",
        required: true,
        options: [
          {
            value: "no",
            label: "No — prepare the court packet only",
          },
          {
            value: "yes",
            label: "Yes — include fee-waiver help",
            description: jurisdiction.feeWaiver.description,
          },
        ],
      },
    ],
    sourceNote:
      jurisdiction.feeWaiver.mode === "generated"
        ? "Financial waiver paperwork is kept separate from the main court packet. Financial answers are never saved in a draft."
        : "The result will link directly to the court’s current fee-waiver process. This tool will not try to fill a financial form it cannot prepare reliably.",
  });

  steps.push({
    id: "current-name",
    eyebrow: "Identity",
    title: "Enter your current legal name",
    description: "Copy it exactly from your current government identification.",
    fields: commonNameFields("current"),
  });

  if (hasNameGoal(answers.goal)) {
    const reasonField: WizardField | undefined =
      answers.residenceState === "OR"
        ? undefined
        : {
            key: "reason",
            label:
              answers.residenceState === "WA"
                ? "Why are you requesting this change? (optional on this form)"
                : "Why are you requesting this change?",
            type: "textarea",
            required: answers.residenceState === "ID" || answers.residenceState === "UT",
            hint: "Write in your own words. This answer is placed only on forms that ask for a reason.",
            span: "full",
          };
    steps.push({
      id: "new-name",
      eyebrow: "The name you want",
      title: "What should your new legal name be?",
      description: "Use the exact spelling and spacing you want in the signed order.",
      fields: [
        ...commonNameFields("new"),
        ...(reasonField ? [reasonField] : []),
        ...(answers.residenceState === "OR" || answers.residenceState === "ID"
          ? [
              {
                key: "formerNames" as const,
                label: "Other names you have used",
                type: "textarea" as const,
                hint: "Include legal or customary names if applicable; otherwise leave blank.",
                span: "full" as const,
              },
            ]
          : []),
      ],
    });
  }

  steps.push({
    id: "contact",
    eyebrow: "Court contact information",
    title: "Where can the court reach you?",
    description:
      "These details are placed on court forms. Use a safe mailing address and email you monitor.",
    fields: [
      {
        key: "address",
        label: "Street or mailing address",
        type: "text",
        required: true,
        autoComplete: "street-address",
        span: "full",
      },
      {
        key: "city",
        label: "City",
        type: "text",
        required: true,
        autoComplete: "address-level2",
        span: "half",
      },
      {
        key: "addressState",
        label: "State",
        type: "text",
        required: true,
        autoComplete: "address-level1",
        placeholder: answers.residenceState,
        span: "half",
      },
      {
        key: "zip",
        label: "ZIP code",
        type: "text",
        required: true,
        autoComplete: "postal-code",
        inputMode: "numeric",
        span: "half",
      },
      {
        key: "phone",
        label: "Phone",
        type: "tel",
        required: true,
        autoComplete: "tel",
        inputMode: "tel",
        span: "half",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        required: true,
        autoComplete: "email",
        inputMode: "email",
        span: "half",
      },
      ...(answers.residenceState === "WA" || answers.residenceState === "UT"
        ? [
            {
              key: "signingCity" as const,
              label: "City where you expect to sign",
              type: "text" as const,
              required: true,
              span: "half" as const,
            },
          ]
        : []),
    ],
  });

  if (answers.residenceState === "ID" || answers.residenceState === "UT") {
    steps.push({
      id: "birth",
      eyebrow: "Birth record",
      title: "Enter the details on your birth record",
      description:
        "These states ask for birth information in the petition. It stays on this device unless you choose to save a draft.",
      fields: [
        ...(answers.residenceState === "UT" && hasNameGoal(answers.goal)
          ? commonNameFields("birth")
          : []),
        {
          key: "dateOfBirth",
          label: "Date of birth",
          type: "date",
          required: true,
          autoComplete: "bday",
          span: "half",
        },
        ...(answers.residenceState === "ID"
          ? [
              {
                key: "birthCity" as const,
                label: "Birth city",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
              {
                key: "birthCounty" as const,
                label: "Birth county",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
              {
                key: "birthState" as const,
                label: "Birth state or country",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
            ]
          : []),
      ],
    });
  }

  if (answers.residenceState === "OR") {
    const anyDisclosure =
      answers.orChildSupport === "yes" ||
      answers.orProtectionOrder === "yes" ||
      answers.orSupervision === "yes" ||
      answers.orSexOffender === "yes";
    steps.push({
      id: "or-disclosures",
      eyebrow: "Questions the Oregon form requires",
      title: "Tell us whether any of these apply",
      description: "The court asks these questions to identify other legal duties or safety issues. On the official form, they are called public-interest disclosures.",
      fields: [
        {
          key: "orChildSupport",
          label: "Do you have unpaid past-due child support (arrears), or a current support order?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "orProtectionOrder",
          label: "Is a protection, stalking, or restraining order in effect against you?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "orSupervision",
          label: "Are you on probation, parole, or post-prison supervision?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "orSexOffender",
          label: "Are you required to register as a sex offender?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        ...(anyDisclosure
          ? [
              {
                key: "orPublicInterestExplanation" as const,
                label: "Explain each checked item, including state and case numbers if available",
                type: "textarea" as const,
                required: true,
                hint: "Use a new line for each yes answer, in the same order as the questions above.",
                span: "full" as const,
              },
            ]
          : []),
        {
          key: "orAcp",
          label: "Are you asking to seal this record because you participate in Oregon’s Address Confidentiality Program?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        ...(hasSexGoal(answers.goal)
          ? [
              {
                key: "utRequestedSex" as const,
                label: "Requested legal sex designation",
                type: "radio" as const,
                required: true,
                options: LEGAL_SEX_OPTIONS,
              },
              {
                key: "orTreatmentAttestation" as const,
                label: "Can you truthfully agree to (attest to) the treatment statement printed on the Oregon form?",
                type: "radio" as const,
                required: true,
                options: YES_NO,
              },
            ]
          : []),
      ],
      sourceNote:
        "The July 2026 OJD packet treats every petition that includes a legal-sex change as confidential.",
    });
  }

  if (answers.residenceState === "WA") {
    steps.push({
      id: "wa-declarations",
      eyebrow: "Questions the King County form requires",
      title: "Answer these court-form questions",
      fields: [
        {
          key: "waCourthouse",
          label: "King County courthouse",
          type: "select",
          required: true,
          options: [
            "East Division, Bellevue Courthouse",
            "East Division, Issaquah Courthouse",
            "East Division, Redmond Courthouse",
            "South Division, Burien Courthouse",
            "South Division, MRJC Courthouse",
            "South Division, Vashon Courthouse",
            "West Division, Seattle Courthouse",
            "West Division, Shoreline Courthouse",
          ].map((label) => ({ value: label, label })),
        },
        {
          key: "waSexOffender",
          label: "Are you required to register as a sex offender?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "waDocJurisdiction",
          label: "Does the Washington Department of Corrections currently have legal authority over your case (jurisdiction)?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "waPriorNameChange",
          label: "Have you had a prior name change?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        ...(answers.waPriorNameChange === "yes"
          ? [
              {
                key: "waPriorDate" as const,
                label: "Date of prior name change",
                type: "date" as const,
                required: true,
                span: "half" as const,
              },
              {
                key: "waPriorLocation" as const,
                label: "Location",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
              {
                key: "waPriorCourt" as const,
                label: "Court",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
              {
                key: "waPriorCase" as const,
                label: "Case number",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
            ]
          : []),
        {
          key: "waNoDetriment",
          label: "Would the requested change avoid harming anyone else’s legal interests?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "waNoOpenProtectionOrder",
          label: "Is it true that no open or pending protection-order case names you as the person responding to the case?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "waInterpreter",
          label: "Would you like to request an interpreter for the hearing?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        ...(answers.waInterpreter === "yes"
          ? [
              {
                key: "waInterpreterLanguage" as const,
                label: "Interpreter language",
                type: "text" as const,
                required: true,
                span: "half" as const,
              },
            ]
          : []),
        {
          key: "waPronouns",
          label: "Pronouns you would like used at the hearing",
          type: "text",
          span: "half",
        },
      ],
    });
  }

  if (answers.residenceState === "ID") {
    steps.push({
      id: "id-declarations",
      eyebrow: "Questions the Idaho form requires",
      title: "Answer these required questions",
      description:
        `The ${answers.county ?? "selected"} County packet will use the ${IDAHO_COURT_DETAILS[answers.county ?? ""]?.newspaper ?? "court-designated newspaper"} for the publication request.`,
      fields: [
        {
          key: "idAvoidCreditors",
          label: "Is this request intended to avoid creditors or outstanding debts?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "idSexOffender",
          label: "Are you required to register as a convicted sexual offender?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
      ],
      sourceNote: "The official packet requires notice to run for four successive weeks.",
    });
  }

  if (answers.residenceState === "UT") {
    steps.push({
      id: "ut-declarations",
      eyebrow: "Questions the Utah form requires",
      title: "Answer these case and registry questions",
      description:
        `Your caption will identify the ${UTAH_JUDICIAL_DISTRICT[answers.county ?? ""] ?? "appropriate"} Judicial District. Confirm the exact courthouse address before filing.`,
      fields: [
        {
          key: "utCourtAddress",
          label: "District court street address",
          type: "text",
          required: true,
          hint: "Copy this from the official Utah court directory.",
          span: "full",
        },
        {
          key: "utOtherCases",
          label: "Are you involved in any other court actions or proceedings?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "utProbationParole",
          label: "Are you in custody, on probation, or on parole?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        {
          key: "utSexOffender",
          label: "Are you listed on Utah’s Sex and Kidnap Offender Registry?",
          type: "radio",
          required: true,
          options: YES_NO,
        },
        ...(hasNameGoal(answers.goal)
          ? [
              {
                key: "utResidencySince" as const,
                label: `Date you began living in ${answers.county ?? "this"} County`,
                type: "date" as const,
                required: true,
                hint: "Utah’s name-change section states that county residence must be at least one year before filing.",
                span: "half" as const,
              },
            ]
          : []),
        ...(hasSexGoal(answers.goal)
          ? [
              {
                key: "utCurrentSex" as const,
                label: "Current legal sex designation on birth certificate",
                type: "radio" as const,
                required: true,
                options: LEGAL_SEX_OPTIONS,
              },
              {
                key: "utRequestedSex" as const,
                label: "Requested legal sex designation",
                type: "radio" as const,
                required: true,
                options: LEGAL_SEX_OPTIONS,
              },
              {
                key: "utSixMonths" as const,
                label: "Have you outwardly expressed the requested designation consistently for at least six months?",
                type: "radio" as const,
                required: true,
                options: YES_NO,
              },
              {
                key: "utDistress" as const,
                label: "Does the current designation cause serious distress or make daily life harder (clinically significant distress or impairment)?",
                type: "radio" as const,
                required: true,
                options: YES_NO,
              },
              {
                key: "utClinicalEvidence" as const,
                label: "Will you attach evidence of appropriate clinical care from a licensed medical professional?",
                type: "radio" as const,
                required: true,
                options: YES_NO,
              },
              {
                key: "utExpressionEvidence" as const,
                label: "Will you attach evidence of consistent outward expression for at least six months?",
                type: "radio" as const,
                required: true,
                options: YES_NO,
              },
            ]
          : []),
      ],
    });
  }

  if (answers.feeHelp === "yes" && answers.residenceState === "OR") {
    steps.push(
      {
        id: "or-fee-personal",
        eyebrow: "Private fee request",
        title: "Tell the court about your household and benefits",
        description:
          "Use current monthly amounts. Enter 0 when a program does not apply. The court—not this app—decides whether to waive, defer, postpone, or deny the fee.",
        fields: [
          {
            key: "feeDateOfBirth",
            label: "Date of birth",
            type: "date",
            required: true,
            autoComplete: "bday",
            span: "half",
          },
          {
            key: "orFeeStateId",
            label: "Driver license or state ID number (optional)",
            type: "text",
            hint: "The official form also has a voluntary SSN line. For safety, this app leaves that line blank so you can decide whether to add it after download.",
            span: "half",
          },
          {
            key: "orFeeHouseholdSize",
            label: "People living in your household, including you",
            type: "number",
            required: true,
            inputMode: "numeric",
            min: 1,
            step: "1",
            span: "half",
          },
          {
            key: "orFeeLegalAid",
            label: "Are you represented in this case by a legal-aid attorney?",
            type: "radio",
            required: true,
            options: YES_NO,
          },
          ...(answers.orFeeLegalAid === "yes"
            ? [
                {
                  key: "orFeeLegalAidName" as const,
                  label: "Legal-aid attorney or organization name",
                  type: "text" as const,
                  required: true,
                  span: "full" as const,
                },
              ]
            : []),
          moneyField("orFeeSnapAmount", "Monthly SNAP amount"),
          moneyField("orFeeSsiAmount", "Monthly SSI amount"),
          moneyField("orFeeTanfAmount", "Monthly TANF amount"),
          {
            key: "orFeeOhp",
            label: "Do you currently receive Oregon Health Plan coverage?",
            type: "radio",
            required: true,
            options: YES_NO,
          },
        ],
        sourceNote:
          "Oregon’s application says it is restricted to protect party privacy. Submit it as its own document, not as an attachment to the public petition.",
      },
      {
        id: "or-fee-finances",
        eyebrow: "Private fee request",
        title: "Add monthly income and household assets",
        description:
          "Use combined amounts for everyone in your household, as the official form instructs.",
        fields: [
          moneyField("orFeeJobsIncome", "Monthly job income before taxes"),
          moneyField("orFeeOtherIncome", "Monthly income from other sources"),
          moneyField("orFeeCash", "Cash available across all accounts"),
          {
            key: "orFeeAssetsDescription",
            label: "Assets other than cash",
            type: "textarea",
            hint: "List vehicles, real estate, boats, jewelry, livestock, business interests, or other assets. Leave blank if none.",
            span: "full",
          },
          moneyField(
            "orFeeAssetsValue",
            "Combined value of the listed non-cash assets",
          ),
        ],
      },
      {
        id: "or-fee-expenses",
        eyebrow: "Private fee request",
        title: "Add monthly living expenses",
        fields: [
          moneyField(
            "orFeeHomeExpenses",
            "Home expenses",
            "Rent or mortgage, utilities, cell phone, and food.",
          ),
          moneyField(
            "orFeeTransportExpenses",
            "Transportation expenses",
            "Parking, fuel, transit, insurance, and vehicle payments.",
          ),
          moneyField(
            "orFeeOtherExpenses",
            "Other living expenses",
            "Examples include childcare, medical costs, child support, loans, fines, and credit cards.",
          ),
          {
            key: "orFeeOtherInfo",
            label: "Other information you want the court to consider (optional)",
            type: "textarea",
            span: "full",
          },
        ],
      },
    );
  }

  if (answers.feeHelp === "yes" && answers.residenceState === "WA") {
    steps.push(
      {
        id: "wa-fee-motion",
        eyebrow: "King County fee request",
        title: "Complete the motion details",
        fields: [
          {
            key: "waFeeAdditionalInfo",
            label: "Anything else you want the court to consider? (optional)",
            type: "textarea",
            span: "full",
          },
          {
            key: "waFeeFiledByMail",
            label: "Do you expect to file this motion by mail with a self-addressed stamped envelope?",
            type: "radio",
            required: true,
            options: YES_NO,
          },
        ],
        sourceNote:
          "The financial statement is marked CONFIDENTIAL. It is generated as a separate file from the public name-change petition.",
      },
      {
        id: "wa-fee-income",
        eyebrow: "Private fee information",
        title: "Add household support and monthly income",
        description: "Enter 0 for required money fields that do not apply.",
        fields: [
          {
            key: "waFeeSupportsOthers",
            label: "Do you support people who live with you?",
            type: "radio",
            required: true,
            options: YES_NO,
          },
          ...(answers.waFeeSupportsOthers === "yes"
            ? [
                {
                  key: "waFeeSupportCount" as const,
                  label: "How many people do you support?",
                  type: "number" as const,
                  required: true,
                  inputMode: "numeric" as const,
                  min: 1,
                  step: "1",
                  span: "half" as const,
                },
                {
                  key: "waFeeSupportAges" as const,
                  label: "Their ages",
                  type: "text" as const,
                  required: true,
                  placeholder: "4, 9, 68",
                  span: "half" as const,
                },
              ]
            : []),
          {
            key: "waFeeEmploymentStatus",
            label: "Employment status",
            type: "radio",
            required: true,
            options: [
              { value: "employed", label: "Employed" },
              { value: "unemployed", label: "Unemployed" },
            ],
          },
          ...(answers.waFeeEmploymentStatus === "employed"
            ? [
                {
                  key: "waFeeEmployer" as const,
                  label: "Employer name",
                  type: "text" as const,
                  required: true,
                  span: "full" as const,
                },
              ]
            : []),
          moneyField("waFeeGrossPay", "Gross pay per month"),
          moneyField("waFeeTakeHomePay", "Take-home pay per month"),
          {
            key: "waFeeOtherIncomeLines",
            label: "Other household income sources (optional, up to 3)",
            type: "textarea",
            hint: "One per line: source | monthly amount. Example: Child support | 250",
            span: "full",
          },
          moneyField(
            "waFeeGovernmentAssistance",
            "Other monthly government assistance",
            "For example SSDI or TANF. Food stamps are asked separately.",
          ),
          {
            key: "waFeeFoodStamps",
            label: "Do you receive food stamps?",
            type: "radio",
            required: true,
            options: YES_NO,
          },
        ],
      },
      {
        id: "wa-fee-assets",
        eyebrow: "Private fee information",
        title: "Add current household assets",
        description: "Enter equity—the value after subtracting any loan—for vehicles and a home.",
        fields: [
          moneyField("waFeeCash", "Cash on hand"),
          moneyField("waFeeChecking", "Checking-account balance"),
          moneyField("waFeeSavings", "Savings-account balance"),
          moneyField("waFeeAuto1", "Vehicle 1 equity"),
          moneyField("waFeeAuto2", "Vehicle 2 equity"),
          moneyField("waFeeHome", "Home equity"),
          {
            key: "waFeeOtherAssetLines",
            label: "Other assets (optional, up to 5)",
            type: "textarea",
            hint: "One per line: asset | value. Example: Tools | 300",
            span: "full",
          },
        ],
      },
      {
        id: "wa-fee-expenses",
        eyebrow: "Private fee information",
        title: "Add monthly household expenses",
        fields: [
          moneyField("waFeeRent", "Rent or mortgage"),
          moneyField("waFeeFood", "Food and household supplies"),
          moneyField("waFeeUtilities", "Utilities"),
          moneyField("waFeeTransportation", "Transportation"),
          moneyField("waFeeMaintenance", "Court-ordered maintenance actually paid"),
          moneyField("waFeeChildSupport", "Court-ordered child support actually paid"),
          moneyField("waFeeClothing", "Clothing"),
          moneyField("waFeeChildCare", "Child care"),
          moneyField("waFeeEducation", "Education"),
          moneyField("waFeeInsurance", "Car and health insurance"),
          moneyField("waFeeMedical", "Medical expenses"),
        ],
      },
      {
        id: "wa-fee-other-expenses",
        eyebrow: "Private fee information",
        title: "Add any remaining expenses and debts",
        fields: [
          {
            key: "waFeeOtherExpenseLines",
            label: "Other monthly household expenses (optional, up to 4)",
            type: "textarea",
            hint: "One per line: expense | monthly amount. Example: Internet | 60",
            span: "full",
          },
          {
            key: "waFeeDebtLines",
            label: "Other debts with monthly payments (optional, up to 4)",
            type: "textarea",
            hint: "One per line: debt | monthly payment. Example: Credit card | 75",
            span: "full",
          },
        ],
      },
    );
  }

  steps.push({
    id: "review",
    eyebrow: "Check your answers",
    title: "Review before creating the PDFs",
    description:
      "This tool fills official court PDFs. It does not file them, sign for you, or decide whether a judge will approve the request.",
    fields: [],
  });

  return steps;
}

export function getBlockingOutcome(
  answers: NavigatorAnswers,
): BlockingOutcome | undefined {
  if (answers.adult === "no") {
    return {
      id: "minor",
      kind: "official-route",
      title: "These forms are not for a child’s case",
      description:
        "A child’s petition may require a parent or guardian, special notice or consent, and different court forms.",
      nextStep: "Open the official court sources below and choose the process for a child or guardianship case.",
    };
  }

  if (answers.residenceState === "WA") {
    if (answers.county && answers.county !== "King") {
      return {
        id: "wa-local-form",
        kind: "official-route",
        title: `${answers.county} County requires local court routing`,
        description:
          "Washington Courts does not publish one statewide name-change form. Filing instructions and forms vary by local court.",
        nextStep: "Use the Washington court directory below to contact your county’s District Court.",
      };
    }
    if (answers.goal && answers.goal !== "name") {
      return {
        id: "wa-sex-route",
        kind: "official-route",
        title: "A legal-sex record update is not part of this court petition",
        description:
          "This tool prepares only King County’s individual name-change petition.",
        nextStep: "Use the official Washington Courts source below to identify the correct record agency or court process.",
      };
    }
    if (answers.waRoute === "superior-confidential") {
      return {
        id: "wa-confidential",
        kind: "official-route",
        title: "Use King County Superior Court’s confidential route",
        description:
          "The bundled District Court form warns that its files are public and are reported to the county recorder.",
        nextStep: "Follow the official King County instructions below for Superior Court filing and sealing eligibility.",
      };
    }
    if (answers.waSexOffender === "yes" || answers.waDocJurisdiction === "yes") {
      return {
        id: "wa-notice",
        kind: "needs-review",
        title: "Additional notice duties apply before filing",
        description:
          "The King County petition warns of criminal penalties for missing sex-offender or Department of Corrections notice duties.",
        nextStep: "Get instructions from the court or a qualified legal provider before preparing this petition.",
      };
    }
  }

  if (answers.residenceState === "ID") {
    if (answers.goal && answers.goal !== "name") {
      return {
        id: "id-sex-route",
        kind: "official-route",
        title: "Idaho’s published court packet here is for name change only",
        description:
          "The Idaho Court Assistance Office form set used by this release does not contain a legal-sex designation petition.",
        nextStep: "Use the official Idaho forms page below to verify the appropriate current process.",
      };
    }
    if (answers.idSexOffender === "yes" || answers.idAvoidCreditors === "yes") {
      return {
        id: "id-certification",
        kind: "needs-review",
        title: "Your answers conflict with a certification in the standard petition",
        description:
          "The official Idaho form requires a sworn statement that the request is not to avoid creditors and that the petitioner is not required to register as a convicted sexual offender.",
        nextStep: "Do not sign the standard form without advice from the court or a qualified legal provider.",
      };
    }
  }

  if (answers.residenceState === "OR") {
    if (
      (answers.goal === "sex" || answers.goal === "both") &&
      answers.orTreatmentAttestation === "no"
    ) {
      return {
        id: "or-attestation",
        kind: "needs-review",
        title: "The standard Oregon petition includes an attestation you cannot make",
        description:
          "The July 2026 official form prints a treatment statement as part of the requested legal-sex change.",
        nextStep: "Ask the circuit court or a qualified Oregon legal provider about the correct filing approach.",
      };
    }
  }

  if (answers.residenceState === "UT") {
    if (
      answers.utOtherCases === "yes" ||
      answers.utProbationParole === "yes" ||
      answers.utSexOffender === "yes"
    ) {
      return {
        id: "ut-additional-case",
        kind: "needs-review",
        title: "The Utah petition needs additional case or registry details",
        description:
          "Those answers activate extra tables, notice duties, or a public-interest explanation that this guided release intentionally does not automate.",
        nextStep: "Use Utah MyPaperwork or ask the district court/self-help center to complete the expanded filing.",
      };
    }
    if (
      (answers.goal === "sex" || answers.goal === "both") &&
      [
        answers.utSixMonths,
        answers.utDistress,
        answers.utClinicalEvidence,
        answers.utExpressionEvidence,
      ].includes("no")
    ) {
      return {
        id: "ut-evidence",
        kind: "needs-review",
        title: "The standard Utah petition’s evidence statements are not all satisfied",
        description:
          "The official form asks the petitioner to state that each listed condition is true and that supporting evidence is attached.",
        nextStep: "Review Utah Courts’ current requirements or seek legal help before filing.",
      };
    }
  }

  return undefined;
}

export function validateStep(step: WizardStep, answers: NavigatorAnswers) {
  const errors: Partial<Record<keyof NavigatorAnswers, string>> = {};
  for (const field of step.fields) {
    const value = answers[field.key];
    if (field.required && (value === undefined || value === null || value === "")) {
      errors[field.key] = "This answer is required.";
      continue;
    }
    if (field.type === "email" && typeof value === "string") {
      if (!/^\S+@\S+\.\S+$/.test(value)) errors[field.key] = "Enter a valid email address.";
    }
    if (field.type === "number" && typeof value === "string" && value !== "") {
      const number = Number(value);
      if (!Number.isFinite(number) || (field.min !== undefined && number < field.min)) {
        errors[field.key] =
          field.min === 1 ? "Enter 1 or more." : "Enter 0 or a positive amount.";
      }
    }
  }

  if (step.id === "ut-declarations" && answers.utResidencySince) {
    const began = new Date(`${answers.utResidencySince}T00:00:00`);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (began > oneYearAgo) {
      errors.utResidencySince =
        "The official form states that county residence must begin at least one year before filing.";
    }
  }

  if (step.id === "or-disclosures") {
    const disclosure =
      answers.orChildSupport === "yes" ||
      answers.orProtectionOrder === "yes" ||
      answers.orSupervision === "yes" ||
      answers.orSexOffender === "yes";
    if (disclosure && !answers.orPublicInterestExplanation?.trim()) {
      errors.orPublicInterestExplanation = "Explain every item marked yes.";
    }
  }

  const structuredMoneyFields: Array<{
    key: keyof NavigatorAnswers;
    maximum: number;
  }> = [
    { key: "waFeeOtherIncomeLines", maximum: 3 },
    { key: "waFeeOtherAssetLines", maximum: 5 },
    { key: "waFeeOtherExpenseLines", maximum: 4 },
    { key: "waFeeDebtLines", maximum: 4 },
  ];
  for (const { key, maximum } of structuredMoneyFields) {
    const value = answers[key];
    if (typeof value !== "string" || !value.trim()) continue;
    const lines = value.split(/\r?\n/).filter((line) => line.trim());
    const valid = lines.every((line) => {
      const [description, amount, ...extra] = line.split("|").map((part) => part.trim());
      return (
        Boolean(description) &&
        Boolean(amount) &&
        extra.length === 0 &&
        Number.isFinite(Number(amount.replace(/[$,]/g, ""))) &&
        Number(amount.replace(/[$,]/g, "")) >= 0
      );
    });
    if (lines.length > maximum) {
      errors[key] = `Use no more than ${maximum} lines.`;
    } else if (!valid) {
      errors[key] = "Use one line per item in the format: description | amount.";
    }
  }

  return errors;
}

export function stateName(code?: StateCode) {
  return getJurisdiction(code)?.name ?? "your state";
}
