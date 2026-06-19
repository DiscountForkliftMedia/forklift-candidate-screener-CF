/**
 * Client-side resume text extraction.
 *
 * On the old Node/Express server, PDF/DOCX parsing was done server-side with
 * pdf-parse + mammoth. Those libraries depend on Node internals and do not run
 * reliably on the Cloudflare Workers runtime, so extraction now happens in the
 * browser (where pdf.js and mammoth's browser build are battle-tested) and only
 * the resulting plain text is sent to the Worker for AI analysis.
 */

// pdf.js: use the bundled worker. Vite resolves the `?url` import to a hashed
// asset URL at build time, so this works in dev and in production.
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// mammoth's browser entry point accepts an ArrayBuffer (no Node Buffer needed).
// Types are declared locally in src/types/mammoth-browser.d.ts.
import mammoth from "mammoth/mammoth.browser";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

async function extractPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => (typeof item.str === "string" ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  // Release resources promptly.
  await pdf.destroy();
  return pages.join("\n");
}

async function extractDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value || "";
}

/**
 * Extract plain text from a resume File (PDF, DOCX, or TXT).
 * Throws a user-friendly Error on unsupported or unparseable files.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || name.endsWith(".pdf");
  const isDocx =
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx");
  const isTxt = file.type === "text/plain" || name.endsWith(".txt");
  const isLegacyDoc = !isDocx && name.endsWith(".doc");

  // The legacy binary Word format (.doc, Word 97–2003) cannot be parsed reliably
  // in the browser. Ask the user to convert rather than failing cryptically.
  if (isLegacyDoc) {
    throw new Error(
      "Legacy .doc files aren't supported. Please re-save as .docx or PDF and upload again.",
    );
  }

  try {
    if (isPdf) {
      return await extractPdf(file);
    }
    if (isDocx) {
      return await extractDocx(file);
    }
    if (isTxt) {
      return await file.text();
    }
  } catch (err: any) {
    if (isPdf) {
      throw new Error(
        "Failed to parse PDF file. Ensure it is not password protected, scanned-image-only, or corrupted.",
      );
    }
    if (isDocx) {
      throw new Error("Failed to parse MS Word (.docx) file. Ensure it is not corrupted.");
    }
    throw new Error(err?.message || "Failed to read the resume file.");
  }

  throw new Error("Unsupported file format. Please upload a PDF, DOCX, or TXT file.");
}
