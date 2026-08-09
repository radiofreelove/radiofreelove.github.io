import {
  PDFCheckBox,
  PDFDocument,
  PDFDropdown,
  PDFFont,
  PDFForm,
  PDFName,
  PDFPage,
  PDFTextField,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { sha256 as hashSha256 } from "@noble/hashes/sha2.js";
import { withBasePath } from "../base-path";
import {
  getJurisdiction,
  IDAHO_COURT_DETAILS,
  isReviewOverdue,
  UTAH_JUDICIAL_DISTRICT,
} from "../jurisdictions";
import type {
  FormTemplate,
  GenerationResult,
  LegalSex,
  NavigatorAnswers,
} from "../types";

const INK = rgb(0.06, 0.08, 0.08);
const LINE_BASELINE_OFFSET = 3;

function compact(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join(" ");
}

function currentName(a: NavigatorAnswers) {
  return compact([a.currentFirst, a.currentMiddle, a.currentLast, a.currentSuffix]);
}

function birthName(a: NavigatorAnswers) {
  return compact([a.birthFirst, a.birthMiddle, a.birthLast]);
}

function newName(a: NavigatorAnswers) {
  return compact([a.newFirst, a.newMiddle, a.newLast, a.newSuffix]);
}

function cityStateZip(a: NavigatorAnswers) {
  const cityState = compact([a.city, a.addressState]);
  return [cityState, a.zip].filter(Boolean).join(" ");
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function dateParts(value?: string) {
  const formatted = formatDate(value);
  const [month = "", day = "", year = ""] = formatted.split("/");
  return { monthDay: [month, day].filter(Boolean).join("/"), year };
}

function numberValue(value?: string) {
  if (!value) return 0;
  const parsed = Number(value.replace(/[$,]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function money(value: number | string | undefined) {
  const parsed = typeof value === "number" ? value : numberValue(value);
  return parsed.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(parsed) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function totalMoney(values: Array<string | undefined>) {
  return values.reduce((sum, value) => sum + numberValue(value), 0);
}

function structuredMoneyLines(value?: string, maximum = 5) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maximum)
    .map((line) => {
      const [label = "", amount = ""] = line.split("|").map((part) => part.trim());
      return { label, amount: money(amount) };
    });
}

function filenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function splitLines(
  value: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines: number,
) {
  const paragraphs = value.replace(/\r/g, "").split("\n");
  const lines: string[] = [];
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
      } else {
        if (line) lines.push(line);
        line = word;
      }
      if (lines.length >= maxLines) break;
    }
    if (line && lines.length < maxLines) lines.push(line);
    if (lines.length >= maxLines) break;
  }

  if (lines.length === maxLines) {
    let last = lines[maxLines - 1];
    while (
      last.length > 1 &&
      font.widthOfTextAtSize(`${last}…`, size) > maxWidth
    ) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function drawFit(
  page: PDFPage,
  value: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  maxSize = 9,
  minSize = 5.5,
) {
  if (!value) return;
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(value, size) > maxWidth) {
    size -= 0.25;
  }
  let output = value;
  while (
    output.length > 1 &&
    font.widthOfTextAtSize(output, size) > maxWidth
  ) {
    output = output.slice(0, -1);
  }
  if (output !== value) output = `${output.slice(0, -1)}…`;
  page.drawText(output, { x, y, size, font, color: INK });
}

function drawFitOnLine(
  page: PDFPage,
  value: string | undefined,
  x: number,
  lineY: number,
  maxWidth: number,
  font: PDFFont,
  maxSize = 9,
  minSize = 5.5,
) {
  drawFit(
    page,
    value,
    x,
    lineY + LINE_BASELINE_OFFSET,
    maxWidth,
    font,
    maxSize,
    minSize,
  );
}

function drawFitCenteredOnLine(
  page: PDFPage,
  value: string | undefined,
  lineX: number,
  lineY: number,
  lineWidth: number,
  font: PDFFont,
  maxSize = 9,
  minSize = 5.5,
) {
  if (!value) return;
  let size = maxSize;
  while (size > minSize && font.widthOfTextAtSize(value, size) > lineWidth) {
    size -= 0.25;
  }
  let output = value;
  while (
    output.length > 1 &&
    font.widthOfTextAtSize(output, size) > lineWidth
  ) {
    output = output.slice(0, -1);
  }
  if (output !== value) output = `${output.slice(0, -1)}…`;
  const textWidth = font.widthOfTextAtSize(output, size);
  page.drawText(output, {
    x: lineX + (lineWidth - textWidth) / 2,
    y: lineY + LINE_BASELINE_OFFSET,
    size,
    font,
    color: INK,
  });
}

function drawWrappedOnLines(
  page: PDFPage,
  value: string | undefined,
  x: number,
  lineYs: number[],
  maxWidth: number,
  font: PDFFont,
  size = 8,
) {
  if (!value) return;
  const lines = splitLines(value, font, size, maxWidth, lineYs.length);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: lineYs[index] + LINE_BASELINE_OFFSET,
      size,
      font,
      color: INK,
    });
  });
}

function drawWrappedInLineSlots(
  page: PDFPage,
  value: string | undefined,
  slots: Array<{ x: number; lineY: number; maxWidth: number }>,
  font: PDFFont,
  size = 8,
) {
  if (!value || slots.length === 0) return;
  const wrapWidth = Math.min(...slots.map((slot) => slot.maxWidth));
  const lines = splitLines(value, font, size, wrapWidth, slots.length);
  lines.forEach((line, index) => {
    const slot = slots[index];
    page.drawText(line, {
      x: slot.x,
      y: slot.lineY + LINE_BASELINE_OFFSET,
      size,
      font,
      color: INK,
    });
  });
}

function drawWrapped(
  page: PDFPage,
  value: string | undefined,
  x: number,
  y: number,
  maxWidth: number,
  font: PDFFont,
  size = 8,
  lineHeight = 10,
  maxLines = 3,
) {
  if (!value) return;
  const lines = splitLines(value, font, size, maxWidth, maxLines);
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color: INK,
    });
  });
}

function markBox(
  page: PDFPage,
  left: number,
  bottom: number,
  width: number,
  height: number,
) {
  const insetX = width * 0.24;
  const insetY = height * 0.24;
  const x0 = left + insetX;
  const x1 = left + width - insetX;
  const y0 = bottom + insetY;
  const y1 = bottom + height - insetY;
  const options = {
    thickness: Math.min(1.1, Math.max(0.9, Math.min(width, height) * 0.11)),
    color: INK,
  };

  page.drawLine({
    start: { x: x0, y: y0 },
    end: { x: x1, y: y1 },
    ...options,
  });
  page.drawLine({
    start: { x: x0, y: y1 },
    end: { x: x1, y: y0 },
    ...options,
  });
}

function markBoxSex(
  page: PDFPage,
  value: LegalSex | undefined,
  boxes: Record<LegalSex, [number, number, number, number]>,
) {
  if (!value) return;
  markBox(page, ...boxes[value]);
}

async function sha256(bytes: Uint8Array) {
  return Array.from(hashSha256(bytes))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function loadOfficialTemplate(template: FormTemplate) {
  const response = await fetch(withBasePath(template.localPath), {
    cache: "force-cache",
  });
  if (!response.ok) {
    throw new Error(`Could not load ${template.title}.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const actual = await sha256(bytes);
  if (actual !== template.sha256) {
    throw new Error(
      `${template.title} did not pass the bundled-form integrity check. Generation stopped.`,
    );
  }
  return PDFDocument.load(bytes);
}

function setText(
  form: PDFForm,
  name: string,
  value: string | undefined,
  font?: PDFFont,
) {
  if (!value) return;
  const field = form.getFieldMaybe(name);
  if (!(field instanceof PDFTextField)) return;
  const maxLength = field.getMaxLength();
  let output = value;
  if (maxLength && output.length > maxLength) {
    if (/phone|telephone/i.test(name)) {
      output = output.replace(/\D/g, "");
    }
    if (output.length > maxLength) {
      if (/phone|telephone/i.test(name)) {
        output = output.slice(0, maxLength);
      } else {
        // The official Idaho fields use short legacy MaxLen values. The
        // finished PDFs are flattened, so safely expand the field long enough
        // to preserve a person's complete legal name or address.
        field.setMaxLength(output.length);
      }
    }
  }
  field.setText(output);
  let fontSize = output.length > 80 ? 7 : output.length > 45 ? 8 : 9;
  if (font && !field.isMultiline()) {
    const widgetWidths = field.acroField
      .getWidgets()
      .map((widget) => widget.getRectangle().width)
      .filter((width) => width > 4);
    const fieldWidth = Math.min(...widgetWidths);
    const textWidthAtOnePoint = font.widthOfTextAtSize(output, 1);
    if (Number.isFinite(fieldWidth) && textWidthAtOnePoint > 0) {
      fontSize = Math.min(
        fontSize,
        Math.max(4, ((fieldWidth - 4) / textWidthAtOnePoint) * 0.96),
      );
    }
  }
  field.setFontSize(fontSize);
}

function setDropdown(form: PDFForm, name: string, value?: string) {
  if (!value) return false;
  const field = form.getFieldMaybe(name);
  if (!(field instanceof PDFDropdown) || !field.getOptions().includes(value)) {
    return false;
  }
  field.select(value);
  field.setFontSize(value.length > 30 ? 7.2 : 8);
  return true;
}

function setCheck(form: PDFForm, name: string, checked: boolean) {
  const field = form.getFieldMaybe(name);
  if (!(field instanceof PDFCheckBox)) return;
  if (checked) field.check();
  else field.uncheck();
}

async function flattenForm(doc: PDFDocument, font: PDFFont) {
  const form = doc.getForm();
  const signature = form.getFieldMaybe("Petitioners Signature");
  if (signature) form.removeField(signature);
  form.updateFieldAppearances(font);
  form.flatten();
}

async function mergeDocuments(documents: PDFDocument[]) {
  const merged = await PDFDocument.create();
  for (const document of documents) {
    const pages = await merged.copyPages(document, document.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged;
}

function setMetadata(doc: PDFDocument, title: string, state: string) {
  // Generated packets are intentionally non-interactive. Removing the empty
  // AcroForm dictionary and annotations after flattening avoids viewer-specific
  // widget artifacts and ensures no signature/court field can be mistaken for
  // a place the app completed.
  doc.catalog.delete(PDFName.of("AcroForm"));
  doc.getPages().forEach((page) => page.node.delete(PDFName.of("Annots")));
  doc.setTitle(title);
  doc.setAuthor("Identity Navigator");
  doc.setSubject(`${state} court form packet prepared from official templates`);
  doc.setCreator("Identity Navigator — client-side PDF generator");
  doc.setProducer("pdf-lib");
  doc.setCreationDate(new Date());
}

async function generateOregon(a: NavigatorAnswers): Promise<GenerationResult> {
  const config = getJurisdiction("OR")!;
  const doc = await loadOfficialTemplate(config.templates[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const petition = doc.getPage(1);
  const judgment = doc.getPage(2);
  const hasName = a.goal === "name" || a.goal === "both";
  const hasSex = a.goal === "sex" || a.goal === "both";

  drawFit(petition, a.county?.toUpperCase(), 300, 697, 122, font, 8);
  drawFit(petition, currentName(a), 72, 630, 240, font, 9);
  if (hasName) {
    markBox(petition, 387, 627.24, 11.4, 11.4);
    markBox(petition, 109.08, 556.2, 10.2, 10.2);
    drawFitOnLine(petition, currentName(a), 158, 538.8, 380, font, 8);
    drawFitOnLine(petition, a.newFirst, 158, 519.48, 92, font, 8);
    drawFitOnLine(petition, a.newMiddle, 265, 519.48, 130, font, 8);
    drawFitOnLine(
      petition,
      compact([a.newLast, a.newSuffix]),
      410,
      519.48,
      128,
      font,
      8,
    );
  }
  if (hasSex) {
    markBox(petition, 446.88, 627.24, 11.4, 11.4);
    markBox(petition, 109.08, 494.88, 10.2, 10.2);
    markBoxSex(
      petition,
      a.utRequestedSex,
      {
        male: [161.64, 482.4, 10.2, 10.2],
        female: [203.16, 482.4, 10.2, 10.2],
        nonbinary: [253.56, 482.4, 10.2, 10.2],
      },
    );
  }

  const disclosureRows: Array<{
    applies: boolean;
    label: string;
    boxBottom: number;
    textY: number;
  }> = [
    {
      applies: a.orChildSupport === "yes",
      label: "Child support",
      boxBottom: 406.32,
      textY: 395,
    },
    {
      applies: a.orProtectionOrder === "yes",
      label: "Protection order",
      boxBottom: 377.52,
      textY: 367,
    },
    {
      applies: a.orSupervision === "yes",
      label: "Supervision",
      boxBottom: 350.64,
      textY: 339,
    },
    {
      applies: a.orSexOffender === "yes",
      label: "Registry",
      boxBottom: 321.96,
      textY: 310,
    },
  ];
  const explanations = (a.orPublicInterestExplanation ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let explanationIndex = 0;
  disclosureRows.forEach((row) => {
    if (!row.applies) return;
    markBox(petition, 109.08, row.boxBottom, 10.2, 10.2);
    const explanation = explanations[explanationIndex] ?? explanations.at(-1) ?? "";
    drawFit(
      petition,
      `${row.label}: ${explanation}`,
      110,
      row.textY,
      430,
      font,
      6.3,
      5,
    );
    explanationIndex += 1;
  });

  if (a.formerNames?.trim()) {
    markBox(petition, 73.08, 280.68, 10.2, 10.2);
    drawWrappedInLineSlots(
      petition,
      a.formerNames,
      [
        { x: 110, lineY: 267.84, maxWidth: 176 },
        { x: 326, lineY: 267.84, maxWidth: 176 },
        { x: 110, lineY: 253.44, maxWidth: 176 },
        { x: 326, lineY: 253.44, maxWidth: 176 },
      ],
      font,
      7.5,
    );
  }
  if (a.orAcp === "yes") {
    markBox(petition, 73.08, 234.24, 10.2, 10.2);
  }
  drawFit(petition, a.email, 72, 126, 180, font, 8);
  drawFit(petition, currentName(a), 288, 126, 250, font, 8);
  drawFit(petition, a.address, 72, 92, 165, font, 8);
  drawFit(petition, cityStateZip(a), 252, 92, 205, font, 8);
  drawFit(petition, a.phone, 470, 92, 70, font, 7.5);

  drawFit(judgment, a.county?.toUpperCase(), 300, 697, 122, font, 8);
  drawFit(judgment, currentName(a), 72, 644, 240, font, 9);
  if (hasName) {
    markBox(judgment, 427.44, 627.24, 11.4, 11.4);
    markBox(judgment, 109.08, 528.36, 10.2, 10.2);
    drawFitOnLine(judgment, currentName(a), 158, 513.24, 380, font, 8);
    drawFitOnLine(judgment, a.newFirst, 158, 493.92, 92, font, 8);
    drawFitOnLine(judgment, a.newMiddle, 265, 493.92, 130, font, 8);
    drawFitOnLine(
      judgment,
      compact([a.newLast, a.newSuffix]),
      410,
      493.92,
      128,
      font,
      8,
    );
  }
  if (hasSex) {
    markBox(judgment, 487.44, 627.24, 11.4, 11.4);
    markBox(judgment, 109.08, 462.48, 10.2, 10.2);
    markBoxSex(
      judgment,
      a.utRequestedSex,
      {
        male: [296.76, 462.48, 10.2, 10.2],
        female: [340.92, 462.48, 10.2, 10.2],
        nonbinary: [393.84, 462.48, 10.2, 10.2],
      },
    );
  }
  if (a.orAcp === "yes") {
    markBox(judgment, 73.08, 407.88, 10.2, 10.2);
  }
  drawFit(judgment, currentName(a), 288, 181, 250, font, 8);
  drawFit(judgment, a.address, 72, 145, 165, font, 8);
  drawFit(judgment, cityStateZip(a), 252, 145, 205, font, 8);
  drawFit(judgment, a.phone, 505, 145, 45, font, 7);

  setMetadata(doc, "Oregon adult identity record change packet", "Oregon");
  const bytes = await doc.save();
  return {
    bytes,
    filename: `oregon-${filenamePart(newName(a) || currentName(a))}-court-packet.pdf`,
    packetLabel: "Oregon adult petition and proposed general judgment",
    revisionLabel: config.templates[0].revision,
  };
}

async function generateWashington(a: NavigatorAnswers): Promise<GenerationResult> {
  const config = getJurisdiction("WA")!;
  const doc = await loadOfficialTemplate(config.templates[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const form = doc.getForm();

  setText(form, "undefined", currentName(a), font);
  setDropdown(form, "petdiv", a.waCourthouse);
  setCheck(form, "Check Box1", a.waSexOffender === "yes");
  setCheck(form, "Check Box2", a.waSexOffender !== "yes");
  setCheck(form, "Check Box3", a.waDocJurisdiction === "yes");
  setCheck(form, "Check Box4", a.waDocJurisdiction !== "yes");
  setCheck(form, "Check Box5", a.waPriorNameChange === "yes");
  setCheck(form, "Check Box6", a.waPriorNameChange !== "yes");
  setText(form, "Text13", formatDate(a.waPriorDate), font);
  setText(form, "Text14", a.waPriorLocation, font);
  setText(form, "Text15", a.waPriorCourt, font);
  setText(form, "Text16", a.waPriorCase, font);
  setText(form, "Text19", a.reason, font);
  setCheck(form, "Check Box7", a.waNoDetriment === "yes");
  setCheck(form, "Check Box8.0.0", a.waNoDetriment === "no");
  setCheck(form, "Check Box8.0.1", a.waNoOpenProtectionOrder === "yes");
  setCheck(form, "Check Box8.1.1", a.waNoOpenProtectionOrder === "no");
  setText(form, "FIRST NAMERow1", a.currentFirst, font);
  setText(form, "MIDDLE NAMERow1", a.currentMiddle, font);
  setText(form, "LAST NAMERow1", a.currentLast, font);
  setText(form, "SUFFIXRow1", a.currentSuffix, font);
  setText(form, "FIRST NAMERow1_2", a.newFirst, font);
  setText(form, "MIDDLE NAMERow1_2", a.newMiddle, font);
  setText(form, "LAST NAMERow1_2", a.newLast, font);
  setText(form, "SUFFIXRow1_2", a.newSuffix, font);
  setText(form, "City", a.signingCity, font);
  setText(form, "Text9", a.address, font);
  setText(form, "Text10", cityStateZip(a), font);
  setText(form, "Text11", a.phone, font);
  setText(form, "Text12", a.email, font);
  setCheck(form, "I would like to request an interpreter", a.waInterpreter === "yes");
  setText(form, "Text17", a.waInterpreterLanguage, font);
  setCheck(form, "I would like to use these pronouns at", Boolean(a.waPronouns?.trim()));
  setText(form, "Text18", a.waPronouns, font);
  await flattenForm(doc, font);

  setMetadata(doc, "King County individual petition for name change", "Washington");
  const bytes = await doc.save();
  return {
    bytes,
    filename: `washington-king-${filenamePart(newName(a))}-name-change-petition.pdf`,
    packetLabel: "King County District Court individual petition",
    revisionLabel: config.templates[0].revision,
  };
}

function overlayIdahoPetition(
  doc: PDFDocument,
  a: NavigatorAnswers,
  font: PDFFont,
  bold: PDFFont,
  redacted: boolean,
) {
  const details = IDAHO_COURT_DETAILS[a.county ?? ""];
  const page = doc.getPage(0);
  const signaturePage = doc.getPage(1);
  drawFitOnLine(page, currentName(a), 86, 685.32, 215, font, 8);
  drawFitOnLine(page, a.address, 86, 654.24, 215, font, 8);
  drawFitOnLine(page, cityStateZip(a), 86, 623.16, 215, font, 8);
  drawFitOnLine(page, a.phone, 86, 592.2, 215, font, 8);
  drawFitOnLine(page, a.email, 86, 561.12, 215, font, 8);
  drawFitOnLine(page, details?.district, 313, 516.24, 66, bold, 8);
  drawFitOnLine(page, a.county?.toUpperCase(), 399, 497.28, 122, bold, 8);
  drawFitOnLine(page, currentName(a), 124, 456.48, 176, font, 8);
  const date = dateParts(a.dateOfBirth);
  if (redacted) {
    drawFitOnLine(page, date.year, 270, 292.68, 64, font, 8);
    drawFitOnLine(page, a.birthCity, 86, 273.72, 105, font, 8);
    drawFitOnLine(page, a.birthCounty, 247, 273.72, 158, font, 8);
    drawFitOnLine(page, a.birthState, 455, 273.72, 63, font, 7);
  } else {
    drawFitOnLine(page, date.monthDay, 200, 293.16, 170, font, 8);
    drawFitOnLine(page, date.year, 380, 292.68, 63, font, 8);
    drawFitOnLine(page, a.birthCity, 107, 273.72, 190, font, 8);
    drawFitOnLine(page, a.birthCounty, 356, 273.72, 157, font, 8);
    drawFitOnLine(page, a.birthState, 124, 254.76, 210, font, 8);
  }
  drawFitOnLine(page, newName(a), 250, 235.8, 268, font, 8);
  drawWrappedOnLines(
    page,
    a.reason,
    262,
    [216.84, 197.88, 178.8],
    256,
    font,
    7.5,
  );
  drawFitOnLine(page, details?.newspaper, 371, 84, 146, font, 7.5);
  drawFitOnLine(signaturePage, currentName(a), 86, 446.76, 215, font, 8);
}

async function generateIdaho(a: NavigatorAnswers): Promise<GenerationResult> {
  const config = getJurisdiction("ID")!;
  const documents = await Promise.all(config.templates.map(loadOfficialTemplate));
  const [cover, unredacted, redacted, notice, publication, judgment] = documents;
  const details = IDAHO_COURT_DETAILS[a.county ?? ""];

  const coverFont = await cover.embedFont(StandardFonts.Helvetica);
  const coverForm = cover.getForm();
  setText(coverForm, "Name", a.currentFirst, coverFont);
  setText(coverForm, "Middle", a.currentMiddle, coverFont);
  setText(
    coverForm,
    "Last",
    compact([a.currentLast, a.currentSuffix]),
    coverFont,
  );
  setText(coverForm, "Any other names used", a.formerNames, coverFont);
  setText(
    coverForm,
    "Address",
    `${a.address}, ${cityStateZip(a)}`,
    coverFont,
  );
  setText(coverForm, "Phone numbers Home", a.phone, coverFont);
  setText(coverForm, "Email", a.email, coverFont);
  setText(coverForm, "Date of Birth", formatDate(a.dateOfBirth), coverFont);
  await flattenForm(cover, coverFont);

  for (const [doc, isRedacted] of [
    [unredacted, false],
    [redacted, true],
  ] as const) {
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    overlayIdahoPetition(doc, a, font, bold, isRedacted);
  }

  const noticeFont = await notice.embedFont(StandardFonts.Helvetica);
  const noticeForm = notice.getForm();
  setText(noticeForm, "Full Name of Party Filing", currentName(a), noticeFont);
  setText(
    noticeForm,
    "Mailing Address of Party Filing Document",
    a.address,
    noticeFont,
  );
  setText(noticeForm, "City State and Zip Code", cityStateZip(a), noticeFont);
  setText(noticeForm, "Telephone", a.phone, noticeFont);
  setText(noticeForm, "Email Address", a.email, noticeFont);
  setDropdown(noticeForm, "Select Judicial District", details?.district);
  setDropdown(noticeForm, "Select Your County", a.county?.toUpperCase());
  setDropdown(noticeForm, "Select County", a.county);
  setText(noticeForm, "Current Full Legal Name", currentName(a), noticeFont);
  setText(noticeForm, "Current Legal Name", currentName(a), noticeFont);
  setText(noticeForm, "Current City of Residence", a.city, noticeFont);
  setText(noticeForm, "New Legal Name", newName(a), noticeFont);
  const reasonLines = splitLines(a.reason ?? "", noticeFont, 8, 275, 2);
  setText(
    noticeForm,
    "The Reason for Changing the Name",
    reasonLines[0],
    noticeFont,
  );
  setText(
    noticeForm,
    "The Reason for Changing the Name Continued",
    reasonLines[1],
    noticeFont,
  );
  await flattenForm(notice, noticeFont);
  drawFit(notice.getPage(0), currentName(a), 86, 91, 210, noticeFont, 8);

  const publicationFont = await publication.embedFont(StandardFonts.Helvetica);
  const publicationForm = publication.getForm();
  setText(
    publicationForm,
    "Full Name of Party Filing",
    currentName(a),
    publicationFont,
  );
  setText(publicationForm, "Address of Party Filing", a.address, publicationFont);
  setText(
    publicationForm,
    "Address of Party Filing Continued",
    cityStateZip(a),
    publicationFont,
  );
  setText(
    publicationForm,
    "Address of the Party Filing Continued 1",
    a.phone,
    publicationFont,
  );
  await flattenForm(publication, publicationFont);

  const judgmentFont = await judgment.embedFont(StandardFonts.Helvetica);
  const judgmentForm = judgment.getForm();
  setText(
    judgmentForm,
    "Full Name of Party Filing",
    currentName(a),
    judgmentFont,
  );
  setText(
    judgmentForm,
    "Mailing Address of Party Filing Document",
    a.address,
    judgmentFont,
  );
  setText(
    judgmentForm,
    "City State and Zip Code",
    cityStateZip(a),
    judgmentFont,
  );
  setText(judgmentForm, "Telephone", a.phone, judgmentFont);
  setText(judgmentForm, "Email Address", a.email, judgmentFont);
  setDropdown(judgmentForm, "Select Judicial District", details?.district);
  setDropdown(judgmentForm, "Select Your County", a.county?.toUpperCase());
  setText(
    judgmentForm,
    "Current Full Legal Name",
    currentName(a),
    judgmentFont,
  );
  setText(judgmentForm, "Current Legal Name", currentName(a), judgmentFont);
  setText(
    judgmentForm,
    "Month and Day Only",
    dateParts(a.dateOfBirth).monthDay,
    judgmentFont,
  );
  setText(judgmentForm, "Year Only", dateParts(a.dateOfBirth).year, judgmentFont);
  setText(judgmentForm, "New Name", newName(a), judgmentFont);
  await flattenForm(judgment, judgmentFont);

  const merged = await mergeDocuments(documents);
  setMetadata(merged, "Idaho adult name-change court packet", "Idaho");
  const bytes = await merged.save();
  return {
    bytes,
    filename: `idaho-${filenamePart(newName(a))}-name-change-packet.pdf`,
    packetLabel: "Idaho adult name-change filing packet",
    revisionLabel: "Official Idaho form set checked August 1, 2026",
  };
}

function drawUtahCoverContact(
  page: PDFPage,
  a: NavigatorAnswers,
  font: PDFFont,
) {
  drawFitOnLine(page, currentName(a), 58, 543.44, 494, font, 8.5);
  drawFitOnLine(page, a.address, 58, 509.69, 494, font, 8.5);
  drawFitOnLine(page, cityStateZip(a), 58, 475.94, 494, font, 8.5);
  drawFitOnLine(page, a.phone, 58, 442.19, 210, font, 8.5);
  drawFitOnLine(page, a.email, 306, 442.19, 246, font, 8.5);
}

function drawUtahCourtContact(
  page: PDFPage,
  a: NavigatorAnswers,
  font: PDFFont,
) {
  drawFitOnLine(page, currentName(a), 58, 672.44, 237, font, 8.5);
  drawFitOnLine(page, a.address, 58, 641.19, 237, font, 8.5);
  drawFitOnLine(page, cityStateZip(a), 58, 609.94, 237, font, 8.5);
  drawFitOnLine(page, a.phone, 58, 575.69, 237, font, 8.5);
  drawFitOnLine(page, a.email, 58, 544.38, 237, font, 8.5);
}

const UTAH_CHECKBOX_WIDTH = 13.5;
const UTAH_CHECKBOX_HEIGHT = 9;
const UTAH_CHECKBOX_INSET_X = 3.25;
const UTAH_CHECKBOX_INSET_Y = 1.5;

function markUtah(page: PDFPage, left: number, bottom: number) {
  // Utah's checkboxes are printed as bracket pairs rather than form fields.
  // Draw the X from the measured outer bounds so every mark is centered,
  // independent of font bearings and baseline placement.
  const x0 = left + UTAH_CHECKBOX_INSET_X;
  const x1 = left + UTAH_CHECKBOX_WIDTH - UTAH_CHECKBOX_INSET_X;
  const y0 = bottom + UTAH_CHECKBOX_INSET_Y;
  const y1 = bottom + UTAH_CHECKBOX_HEIGHT - UTAH_CHECKBOX_INSET_Y;
  const options = { thickness: 1.1, color: INK };

  page.drawLine({
    start: { x: x0, y: y0 },
    end: { x: x1, y: y1 },
    ...options,
  });
  page.drawLine({
    start: { x: x0, y: y1 },
    end: { x: x1, y: y0 },
    ...options,
  });
}

function markUtahGoal(
  page: PDFPage,
  a: NavigatorAnswers,
  points: { name: Array<[number, number]>; sex: Array<[number, number]> },
) {
  if (a.goal === "name" || a.goal === "both") {
    points.name.forEach(([x, y]) => markUtah(page, x, y));
  }
  if (a.goal === "sex" || a.goal === "both") {
    points.sex.forEach(([x, y]) => markUtah(page, x, y));
  }
}

function markUtahSex(
  page: PDFPage,
  value: LegalSex | undefined,
  points: Record<LegalSex, [number, number]>,
) {
  if (!value) return;
  markUtah(page, ...points[value]);
}

function drawUtahNameRows(
  page: PDFPage,
  name: { first?: string; middle?: string; last?: string },
  lineYs: [number, number, number],
  font: PDFFont,
) {
  drawFitOnLine(page, name.first, 248, lineYs[0], 304, font, 8);
  drawFitOnLine(page, name.middle, 248, lineYs[1], 304, font, 8);
  drawFitOnLine(page, name.last, 248, lineYs[2], 304, font, 8);
}

async function generateUtah(a: NavigatorAnswers): Promise<GenerationResult> {
  const config = getJurisdiction("UT")!;
  const [cover, petition, order] = await Promise.all(
    config.templates.map(loadOfficialTemplate),
  );
  const hasName = a.goal === "name" || a.goal === "both";
  const hasSex = a.goal === "sex" || a.goal === "both";
  const district = UTAH_JUDICIAL_DISTRICT[a.county ?? ""];

  const coverFont = await cover.embedFont(StandardFonts.Helvetica);
  const coverPage = cover.getPage(0);
  drawUtahCoverContact(coverPage, a, coverFont);
  markUtah(cover.getPage(2), 110, 678.83);

  const petitionFont = await petition.embedFont(StandardFonts.Helvetica);
  const p0 = petition.getPage(0);
  drawUtahCourtContact(p0, a, petitionFont);
  markUtah(p0, 100.84, 513.45);
  drawFitCenteredOnLine(p0, district, 164.4, 403.25, 85.5, petitionFont, 8);
  drawFitCenteredOnLine(p0, a.county, 335.4, 403.25, 128.1, petitionFont, 8);
  drawFitOnLine(p0, a.utCourtAddress, 161, 376.19, 375, petitionFont, 8);
  markUtahGoal(p0, a, {
    name: [
      [312.75, 321.11],
      [57.6, 297.11],
    ],
    sex: [
      [312.75, 281.23],
      [57.6, 281.73],
    ],
  });
  drawFitOnLine(p0, currentName(a), 58, 261.44, 240, petitionFont, 8.5);
  drawFitOnLine(p0, a.county, 146, 110.31, 225, petitionFont, 8.5);
  drawFitOnLine(
    p0,
    formatDate(a.dateOfBirth),
    224,
    85.5,
    143,
    petitionFont,
    8.5,
  );

  const p1 = petition.getPage(1);
  markUtah(p1, 93.6, 645.76);
  markUtah(p1, 93.6, 306.2);

  const p2 = petition.getPage(2);
  markUtah(p2, 99, 475.51);
  if (hasName) {
    markUtah(p2, 57.6, 320.7);
    drawUtahNameRows(
      p2,
      { first: a.birthFirst, middle: a.birthMiddle, last: a.birthLast },
      [250.44, 227.88, 205.31],
      petitionFont,
    );
    const birthDiffers =
      birthName(a).toLowerCase() !==
      compact([a.currentFirst, a.currentMiddle, a.currentLast]).toLowerCase();
    if (birthDiffers) {
      markUtah(p2, 99, 177.89);
      drawUtahNameRows(
        p2,
        { first: a.currentFirst, middle: a.currentMiddle, last: a.currentLast },
        [134.69, 112.13, 89.56],
        petitionFont,
      );
    }
  }

  const p3 = petition.getPage(3);
  if (hasName) {
    drawUtahNameRows(
      p3,
      {
        first: a.newFirst,
        middle: a.newMiddle,
        last: compact([a.newLast, a.newSuffix]),
      },
      [659.31, 636.75, 614.19],
      petitionFont,
    );
    drawWrapped(p3, a.reason, 101, 568, 435, petitionFont, 8, 11, 4);
    drawFitOnLine(p3, a.county, 146, 497.74, 120, petitionFont, 8.5);
    drawFitOnLine(
      p3,
      formatDate(a.utResidencySince),
      146,
      475.93,
      120,
      petitionFont,
      8.5,
    );
  }
  if (hasSex) {
    markUtah(p3, 57.6, 409.43);
    markUtahSex(
      p3,
      a.utCurrentSex,
      {
        male: [99.6, 343.36],
        female: [170.4, 343.36],
        nonbinary: [247.2, 343.36],
      },
    );
    if (a.utCurrentSex === "nonbinary") {
      drawFitOnLine(p3, "nonbinary", 304, 337, 56, petitionFont, 7);
    }
    markUtahSex(
      p3,
      a.utRequestedSex,
      {
        male: [99.6, 300.43],
        female: [170.4, 300.43],
        nonbinary: [247.2, 300.43],
      },
    );
    if (a.utRequestedSex === "nonbinary") {
      drawFitOnLine(p3, "nonbinary", 304, 294.06, 56, petitionFont, 7);
    }
  }
  const p4 = petition.getPage(4);
  drawFitOnLine(
    p4,
    `${a.signingCity}, ${a.addressState}`,
    119,
    626.14,
    268,
    petitionFont,
    8.5,
  );
  drawFitOnLine(p4, currentName(a), 363, 564.2, 188, petitionFont, 8.5);

  const orderFont = await order.embedFont(StandardFonts.Helvetica);
  const o0 = order.getPage(0);
  drawUtahCourtContact(o0, a, orderFont);
  drawFitCenteredOnLine(o0, district, 164.4, 478.56, 85.5, orderFont, 8);
  drawFitCenteredOnLine(o0, a.county, 335.4, 478.56, 128.1, orderFont, 8);
  drawFitOnLine(o0, a.utCourtAddress, 161, 451.5, 375, orderFont, 8);
  markUtahGoal(o0, a, {
    name: [
      [57.6, 378.42],
      [312.75, 359.32],
    ],
    sex: [
      [57.6, 363.04],
      [312.75, 328.45],
    ],
  });
  drawFitOnLine(o0, currentName(a), 58, 342.75, 240, orderFont, 8.5);
  drawFitOnLine(
    o0,
    formatDate(a.dateOfBirth),
    228,
    192.44,
    200,
    orderFont,
    8.5,
  );

  const o1 = order.getPage(1);
  if (hasName) {
    drawUtahNameRows(
      o1,
      { first: a.birthFirst, middle: a.birthMiddle, last: a.birthLast },
      [536.25, 513.69, 491.13],
      orderFont,
    );
    const birthDiffers =
      birthName(a).toLowerCase() !==
      compact([a.currentFirst, a.currentMiddle, a.currentLast]).toLowerCase();
    if (birthDiffers) {
      drawUtahNameRows(
        o1,
        { first: a.currentFirst, middle: a.currentMiddle, last: a.currentLast },
        [426.5, 403.94, 381.38],
        orderFont,
      );
    }
  }
  const o2 = order.getPage(2);
  if (hasSex && a.utRequestedSex === "nonbinary") {
    drawFitOnLine(o2, "nonbinary", 304, 270.75, 58, orderFont, 7.5);
  }
  if (hasName) {
    drawUtahNameRows(
      o2,
      {
        first: a.newFirst,
        middle: a.newMiddle,
        last: compact([a.newLast, a.newSuffix]),
      },
      [182.06, 159.5, 136.94],
      orderFont,
    );
  }

  const merged = await mergeDocuments([cover, petition, order]);
  setMetadata(
    merged,
    "Utah adult name or sex designation change packet",
    "Utah",
  );
  const bytes = await merged.save();
  return {
    bytes,
    filename: `utah-${filenamePart(newName(a) || currentName(a))}-court-packet.pdf`,
    packetLabel: "Utah probate cover sheet, petition, and proposed order",
    revisionLabel: "Official Utah form set checked August 1, 2026",
  };
}

async function generateOregonFeeWaiver(
  a: NavigatorAnswers,
): Promise<GenerationResult> {
  const config = getJurisdiction("OR")!;
  const template = config.feeWaiver.template;
  if (!template) throw new Error("The Oregon fee-waiver template is unavailable.");
  const doc = await loadOfficialTemplate(template);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const application = doc.getPage(1);
  const declaration = doc.getPage(2);
  const expenses = doc.getPage(3);
  const order = doc.getPage(4);
  const orderReadiness = doc.getPage(5);
  const applicant = currentName(a);

  const benefits = totalMoney([
    a.orFeeSnapAmount,
    a.orFeeSsiAmount,
    a.orFeeTanfAmount,
  ]);
  const totalIncome =
    benefits + totalMoney([a.orFeeJobsIncome, a.orFeeOtherIncome]);
  const totalAssets = totalMoney([a.orFeeCash, a.orFeeAssetsValue]);
  const totalExpenses = totalMoney([
    a.orFeeHomeExpenses,
    a.orFeeTransportExpenses,
    a.orFeeOtherExpenses,
  ]);

  // Application page 1: match the identity-change caption and request only
  // the filing fee. Case number and all signature/date fields remain blank.
  drawFit(application, a.county?.toUpperCase(), 300, 695, 122, font, 8);
  drawFit(application, applicant, 72, 667, 225, font, 8);
  drawFit(application, a.currentFirst, 176, 578, 130, font, 8);
  drawFit(application, a.currentMiddle, 320, 578, 130, font, 8);
  drawFit(
    application,
    compact([a.currentLast, a.currentSuffix]),
    462,
    578,
    80,
    font,
    8,
  );
  markBox(application, 116.05, 511.64, 10.2, 10.2);
  markBox(application, 98.1, 474.12, 10.26, 10.26);
  markBox(application, 177.66, 474.12, 10.26, 10.26);

  // Declaration page 2. The SSN line intentionally stays blank because the
  // official form labels that disclosure voluntary.
  drawFit(declaration, formatDate(a.feeDateOfBirth), 220, 675, 190, font, 8);
  drawFit(declaration, a.orFeeStateId, 325, 656, 170, font, 8);
  drawFit(declaration, a.orFeeHouseholdSize, 307, 603, 75, font, 8);
  if (a.orFeeLegalAid === "yes") {
    markBox(declaration, 111.6, 522.78, 9.12, 9.12);
    drawFit(declaration, a.orFeeLegalAidName, 181, 522, 330, font, 8);
  } else {
    markBox(declaration, 111.6, 534.12, 9.12, 9.12);
  }
  const benefitRows: Array<{
    value?: string;
    bottom: number;
  }> = [
    { value: a.orFeeSnapAmount, bottom: 460.04 },
    { value: a.orFeeSsiAmount, bottom: 448.64 },
    { value: a.orFeeTanfAmount, bottom: 437.24 },
  ];
  benefitRows.forEach(({ value, bottom }) => {
    if (numberValue(value) > 0) {
      markBox(declaration, 109.05, bottom, 9.15, 9.15);
    }
  });
  if (a.orFeeOhp === "yes") {
    markBox(declaration, 109.05, 425.94, 9.15, 9.15);
  }
  drawFit(declaration, money(a.orFeeSnapAmount), 432, 461, 86, font, 8);
  drawFit(declaration, money(a.orFeeSsiAmount), 301, 450, 82, font, 8);
  drawFit(declaration, money(a.orFeeTanfAmount), 357, 438, 82, font, 8);
  drawFit(declaration, money(benefits), 278, 404, 105, font, 8);
  drawFit(declaration, money(a.orFeeJobsIncome), 413, 334, 105, font, 8);
  drawFit(declaration, money(a.orFeeOtherIncome), 322, 311, 105, font, 8);
  drawFit(declaration, money(totalIncome), 322, 271, 105, bold, 8);
  drawFit(declaration, money(a.orFeeCash), 268, 231, 105, font, 8);
  drawWrapped(
    declaration,
    a.orFeeAssetsDescription,
    90,
    188,
    430,
    font,
    7.5,
    12,
    4,
  );
  drawFit(declaration, money(a.orFeeAssetsValue), 178, 122, 100, font, 8);
  drawFit(declaration, money(totalAssets), 311, 100, 105, bold, 8);

  drawFit(expenses, money(a.orFeeHomeExpenses), 236, 678, 110, font, 8);
  drawFit(
    expenses,
    money(a.orFeeTransportExpenses),
    236,
    642,
    110,
    font,
    8,
  );
  drawFit(expenses, money(a.orFeeOtherExpenses), 236, 606, 110, font, 8);
  drawFit(expenses, money(totalExpenses), 301, 569, 110, bold, 8);
  drawWrapped(expenses, a.orFeeOtherInfo, 83, 508, 445, font, 8, 12, 6);
  drawFit(expenses, applicant, 365, 331, 170, font, 8);
  drawFit(expenses, a.address, 72, 291, 168, font, 8);
  drawFit(expenses, cityStateZip(a), 252, 291, 170, font, 8);
  drawFit(expenses, a.phone, 435, 291, 105, font, 8);

  // Proposed order: populate only the caption, applicant, requested fee, and
  // submitter contact. Every finding, outcome, payment plan, and judge field
  // below "The court finds Applicant" remains untouched.
  drawFit(order, a.county?.toUpperCase(), 300, 695, 122, font, 8);
  drawFit(order, applicant, 72, 668, 225, font, 8);
  drawFit(order, applicant, 182, 569, 330, font, 8);
  markBox(order, 108.06, 530.7, 9.12, 9.12);

  markBox(orderReadiness, 137.7, 656.46, 10.26, 10.26);
  drawFit(orderReadiness, applicant, 360, 638, 176, font, 8);
  drawFit(orderReadiness, applicant, 365, 511, 170, font, 8);
  drawFit(orderReadiness, a.address, 72, 466, 168, font, 8);
  drawFit(orderReadiness, cityStateZip(a), 252, 466, 170, font, 8);
  drawFit(orderReadiness, a.phone, 435, 466, 105, font, 8);

  setMetadata(doc, "Oregon fee deferral or waiver application", "Oregon");
  const bytes = await doc.save();
  return {
    bytes,
    filename: `oregon-${filenamePart(applicant)}-fee-waiver-request.pdf`,
    packetLabel: "Oregon restricted-access fee application and proposed order",
    revisionLabel: template.revision,
    confidential: true,
    filingNote:
      "File this separately. Sign and date the application and both submitter signature areas on the proposed order; leave all court findings and the judge signature blank.",
  };
}

async function generateWashingtonFeeWaiver(
  a: NavigatorAnswers,
): Promise<GenerationResult> {
  const config = getJurisdiction("WA")!;
  const template = config.feeWaiver.template;
  if (!template) throw new Error("The King County fee-waiver template is unavailable.");
  const doc = await loadOfficialTemplate(template);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();
  setDropdown(form, "petdiv", a.waCourthouse);
  setCheck(form, "plaintiffpetitioner", true);
  setCheck(form, "defendantrespondent in this action", false);
  setCheck(form, "Check Box1", true);
  setCheck(form, "Check Box2", false);
  setCheck(form, "Check Box5", false);
  setCheck(form, "Check Box6", false);
  setCheck(form, "Check Box3", a.waFeeFoodStamps === "yes");
  setCheck(form, "Check Box4", a.waFeeFoodStamps !== "yes");
  form.updateFieldAppearances(font);
  form.flatten();
  const motion = doc.getPage(0);
  const declaration = doc.getPage(1);
  const financial = doc.getPage(2);
  const applicant = currentName(a);

  const incomeLines = structuredMoneyLines(a.waFeeOtherIncomeLines, 3);
  const assetLines = structuredMoneyLines(a.waFeeOtherAssetLines, 5);
  const otherExpenseLines = structuredMoneyLines(a.waFeeOtherExpenseLines, 4);
  const debtLines = structuredMoneyLines(a.waFeeDebtLines, 4);
  const incomeSubtotal =
    incomeLines.reduce((sum, line) => sum + numberValue(line.amount), 0) +
    numberValue(a.waFeeGovernmentAssistance);
  const totalIncome = numberValue(a.waFeeTakeHomePay) + incomeSubtotal;
  const totalAssets =
    totalMoney([
      a.waFeeCash,
      a.waFeeChecking,
      a.waFeeSavings,
      a.waFeeAuto1,
      a.waFeeAuto2,
      a.waFeeHome,
    ]) + assetLines.reduce((sum, line) => sum + numberValue(line.amount), 0);
  const householdExpenses = totalMoney([
    a.waFeeRent,
    a.waFeeFood,
    a.waFeeUtilities,
    a.waFeeTransportation,
    a.waFeeMaintenance,
    a.waFeeChildSupport,
    a.waFeeClothing,
    a.waFeeChildCare,
    a.waFeeEducation,
    a.waFeeInsurance,
    a.waFeeMedical,
  ]);
  const otherExpenses = otherExpenseLines.reduce(
    (sum, line) => sum + numberValue(line.amount),
    0,
  );
  const debts = debtLines.reduce(
    (sum, line) => sum + numberValue(line.amount),
    0,
  );

  drawFit(motion, applicant, 72, 522, 198, font, 8);
  drawFit(motion, applicant, 69, 86, 180, font, 8);

  drawWrapped(
    declaration,
    a.waFeeAdditionalInfo,
    110,
    565,
    415,
    font,
    8,
    11,
    10,
  );
  if (a.waFeeFiledByMail === "yes") {
    markBox(declaration, 73.08, 412.2, 9.24, 9.24);
  }
  drawFit(declaration, a.signingCity, 117, 268, 207, font, 8);
  drawFit(declaration, a.addressState, 333, 268, 60, font, 8);
  drawFit(declaration, applicant, 324, 213, 207, font, 8);
  drawFit(declaration, a.address, 252, 171, 334, font, 8);
  drawFit(declaration, cityStateZip(a), 314, 155, 272, font, 8);
  drawFit(declaration, a.email, 239, 141, 347, font, 8);
  drawFit(declaration, a.phone, 240, 125, 346, font, 8);

  drawFit(financial, applicant, 90, 646, 480, font, 8);
  drawFit(financial, applicant, 187, 689, 137, font, 7);
  if (a.waFeeSupportsOthers === "yes") {
    markBox(financial, 41.04, 627.06, 14.12, 9.96);
    drawFit(financial, a.waFeeSupportCount, 294, 630, 45, font, 7);
    drawFit(financial, a.waFeeSupportAges, 414, 630, 165, font, 7);
  }
  if (a.waFeeEmploymentStatus === "employed") {
    markBox(financial, 72, 591.66, 14.24, 9.96);
  } else {
    markBox(financial, 167.88, 591.66, 14.24, 9.96);
  }
  drawFit(financial, a.waFeeEmployer, 104, 578, 196, font, 7);
  drawFit(financial, money(a.waFeeGrossPay), 209, 554, 90, font, 7);
  drawFit(financial, money(a.waFeeTakeHomePay), 209, 535, 90, font, 7);
  const leftRows = [499, 483, 467];
  incomeLines.forEach((line, index) => {
    drawFit(financial, line.label, 75, leftRows[index], 125, font, 7);
    drawFit(financial, line.amount, 209, leftRows[index], 90, font, 7);
  });
  drawFit(
    financial,
    money(a.waFeeGovernmentAssistance),
    209,
    451,
    90,
    font,
    7,
  );
  drawFit(financial, money(incomeSubtotal), 209, 435, 90, font, 7);
  drawFit(financial, money(totalIncome), 211, 395, 88, bold, 7);

  const fixedAssetValues = [
    a.waFeeCash,
    a.waFeeChecking,
    a.waFeeSavings,
    a.waFeeAuto1,
    a.waFeeAuto2,
    a.waFeeHome,
  ];
  const assetYs = [354, 338, 322, 306, 290, 272];
  fixedAssetValues.forEach((value, index) =>
    drawFit(financial, money(value), 209, assetYs[index], 90, font, 7),
  );
  const otherAssetYs = [255, 239, 223, 207, 190];
  assetLines.forEach((line, index) => {
    drawFit(financial, line.label, 89, otherAssetYs[index], 110, font, 7);
    drawFit(financial, line.amount, 209, otherAssetYs[index], 90, font, 7);
  });
  drawFit(financial, money(totalAssets), 209, 161, 90, bold, 7);

  const expenseValues = [
    a.waFeeRent,
    a.waFeeFood,
    a.waFeeUtilities,
    a.waFeeTransportation,
    a.waFeeMaintenance,
    a.waFeeChildSupport,
    a.waFeeClothing,
    a.waFeeChildCare,
    a.waFeeEducation,
    a.waFeeInsurance,
    a.waFeeMedical,
  ];
  const expenseYs = [594, 578, 553, 535, 518, 499, 483, 467, 451, 435, 419];
  expenseValues.forEach((value, index) =>
    drawFit(financial, money(value), 479, expenseYs[index], 103, font, 7),
  );
  drawFit(financial, money(householdExpenses), 479, 395, 103, bold, 7);

  const otherExpenseYs = [354, 338, 322, 306];
  otherExpenseLines.forEach((line, index) => {
    drawFit(financial, line.label, 306, otherExpenseYs[index], 163, font, 7);
    drawFit(financial, line.amount, 479, otherExpenseYs[index], 103, font, 7);
  });
  drawFit(financial, money(otherExpenses), 479, 290, 103, bold, 7);

  const debtYs = [255, 239, 223, 207];
  debtLines.forEach((line, index) => {
    drawFit(financial, line.label, 306, debtYs[index], 163, font, 7);
    drawFit(financial, line.amount, 487, debtYs[index], 52, font, 7);
  });
  drawFit(financial, money(debts), 479, 190, 103, bold, 7);
  drawFit(
    financial,
    money(householdExpenses + otherExpenses + debts),
    479,
    161,
    103,
    bold,
    7,
  );

  setMetadata(doc, "King County fee-waiver motion and financial statement", "Washington");
  const bytes = await doc.save();
  return {
    bytes,
    filename: `washington-king-${filenamePart(applicant)}-fee-waiver-request.pdf`,
    packetLabel: "King County fee-waiver motion and confidential financial statement",
    revisionLabel: template.revision,
    confidential: true,
    filingNote:
      "File this with the petition as a separate document. Add the dates and required signatures on both motion pages and the confidential financial statement.",
  };
}

export async function generateFeeWaiver(
  answers: NavigatorAnswers,
): Promise<GenerationResult> {
  const config = getJurisdiction(answers.residenceState);
  if (!config || config.feeWaiver.mode !== "generated") {
    throw new Error("This jurisdiction uses the court’s official fee-waiver route.");
  }
  if (isReviewOverdue(config)) {
    throw new Error(
      `The ${config.name} fee-waiver form set has reached its legal-review deadline.`,
    );
  }
  if (answers.residenceState === "OR") return generateOregonFeeWaiver(answers);
  if (answers.residenceState === "WA") return generateWashingtonFeeWaiver(answers);
  throw new Error("A generated fee-waiver adapter is not available for this route.");
}

export async function generatePacket(
  answers: NavigatorAnswers,
): Promise<GenerationResult> {
  const config = getJurisdiction(answers.residenceState);
  if (!config) throw new Error("Choose a supported state before generating.");
  if (isReviewOverdue(config)) {
    throw new Error(
      `The ${config.name} form set has reached its legal-review deadline. Generation is disabled until the official sources are rechecked.`,
    );
  }

  switch (answers.residenceState) {
    case "OR":
      return generateOregon(answers);
    case "WA":
      return generateWashington(answers);
    case "ID":
      return generateIdaho(answers);
    case "UT":
      return generateUtah(answers);
    default:
      throw new Error("This jurisdiction does not have a generator adapter yet.");
  }
}
