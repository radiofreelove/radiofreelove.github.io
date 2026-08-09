import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const expected = new Map([
  ["lib/pdf/generator.ts", "edf6cef5c560f3a2289f905bb7efae169322aa7db8fd30cc1e60f4e6a08d1a82"],
  ["public/forms/idaho/2026-08-checked/civil-cover-sheet.pdf", "28ea03f43b27bbdaa86520d7db57b22d6529e9d2e3d9bd1ae909c27d3a02af1b"],
  ["public/forms/idaho/2026-08-checked/judgment.pdf", "8ce3495c3c686faa270c97c13006709eec29018550ea4fd6102146268a12437d"],
  ["public/forms/idaho/2026-08-checked/notice-of-hearing.pdf", "4a85bca97318f66bc4d4746f86634ced2ba87e7425aea125e9e13f856cc7cdfa"],
  ["public/forms/idaho/2026-08-checked/publication-letter.pdf", "6d760df2550627555adf7c8f501848c38fdd441cd701a9fa4bb949c256b3f391"],
  ["public/forms/idaho/2026-08-checked/redacted-petition.pdf", "af3a07b7d90c65eade7e13ff556cd61de54865093a24a1434250ceaebdf5e464"],
  ["public/forms/idaho/2026-08-checked/unredacted-petition.pdf", "33976b0d1d5c4a12c9251e906f58f9ca951668c51b27db8fa2f0381ff4f788c9"],
  ["public/forms/oregon/2026-07/adult-name-sex-change-packet.pdf", "4fda2bb8cc99bae57dfce08588ab7bc5fea28b504d60f22860847fc214700927"],
  ["public/forms/oregon/fee-waiver/2026-01/fee-deferral-waiver-packet.pdf", "e4a1f2f978f81d7278af8b073654ecd4e9a5dffe320af2bc249b38320afc26ac"],
  ["public/forms/utah/2025-04/1158XX-cover-sheet.pdf", "056bb396f08ce4106fa36500a8bff48f01aa054fefd92e39cdfd9d51b98511f1"],
  ["public/forms/utah/2025-04/1730FA-petition.pdf", "a582e3c4f7201ac13424ec0c6c1cc64318eaf7ede9d12b6e812aea6f05c60d6e"],
  ["public/forms/utah/2025-04/1731FA-order.pdf", "a8cced24d2e6ead1def845e2c7b398764011f3b53552fc8c0c214500801058d4"],
  ["public/forms/washington/king/2026-07/individual-petition.pdf", "362c90497ebf8f978ea747a5ddb252b66e20211b74e109c3d0786943882680f4"],
  ["public/forms/washington/king/fee-waiver/2025-10/motion-and-financial-statement.pdf", "688e31b40aa167fd2bca33c7f90d0e496654b1169b2a5ec1705edb42defff1c1"],
]);

async function listPdfs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listPdfs(entryPath) : [entryPath];
    }),
  );
  return files.flat().filter((file) => file.toLowerCase().endsWith(".pdf"));
}

const actualPdfPaths = (await listPdfs(path.join(repositoryRoot, "public/forms")))
  .map((file) => path.relative(repositoryRoot, file).split(path.sep).join("/"))
  .sort();
const expectedPdfPaths = [...expected.keys()].filter((file) => file.endsWith(".pdf")).sort();

if (JSON.stringify(actualPdfPaths) !== JSON.stringify(expectedPdfPaths)) {
  throw new Error(
    `Protected PDF inventory changed. Expected ${expectedPdfPaths.length}; found ${actualPdfPaths.length}.`,
  );
}

for (const [relativePath, expectedHash] of expected) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== expectedHash) {
    throw new Error(`${relativePath} changed: expected ${expectedHash}, received ${actualHash}`);
  }
}

console.log(`Verified ${expected.size} protected files byte-for-byte (${expectedPdfPaths.length} court PDFs plus the PDF generator).`);
