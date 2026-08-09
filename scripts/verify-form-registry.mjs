import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  JURISDICTIONS,
  REVIEW_BY,
  REVIEWED_ON,
} from "../lib/jurisdictions.ts";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const seenIds = new Set();
const seenPaths = new Set();
let count = 0;

if (new Date(REVIEW_BY) <= new Date(REVIEWED_ON)) {
  throw new Error("REVIEW_BY must be later than REVIEWED_ON.");
}

for (const jurisdiction of Object.values(JURISDICTIONS)) {
  if (!jurisdiction.authorities.some((authority) => authority.kind === "court")) {
    throw new Error(`${jurisdiction.code} has no primary court authority.`);
  }
  if (jurisdiction.verifiedOn !== REVIEWED_ON || jurisdiction.reviewBy !== REVIEW_BY) {
    throw new Error(`${jurisdiction.code} does not use the release review dates.`);
  }
  const templates = [
    ...jurisdiction.templates,
    ...(jurisdiction.feeWaiver.template ? [jurisdiction.feeWaiver.template] : []),
  ];
  for (const template of templates) {
    if (seenIds.has(template.id)) throw new Error(`Duplicate form id: ${template.id}`);
    if (seenPaths.has(template.localPath)) throw new Error(`Duplicate form path: ${template.localPath}`);
    seenIds.add(template.id);
    seenPaths.add(template.localPath);

    if (!template.localPath.startsWith("/forms/")) {
      throw new Error(`${template.id} is not stored under /forms/.`);
    }
    if (!/^https:\/\//.test(template.officialUrl)) {
      throw new Error(`${template.id} is missing an HTTPS official URL.`);
    }
    if (!template.revision.trim()) {
      throw new Error(`${template.id} is missing a revision label.`);
    }

    const localFile = `${projectRoot}public${template.localPath}`;
    const bytes = await readFile(localFile);
    const actual = createHash("sha256").update(bytes).digest("hex");
    if (actual !== template.sha256) {
      throw new Error(
        `${template.id} hash mismatch\nexpected ${template.sha256}\nactual   ${actual}`,
      );
    }
    count += 1;
  }
}

console.log(
  `Verified ${count} official PDF templates across ${Object.keys(JURISDICTIONS).length} jurisdictions. Review window: ${REVIEWED_ON} through ${REVIEW_BY}.`,
);
