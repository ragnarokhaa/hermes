import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("frontend sends non-sample verification requests to the Vercel API", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /fetch\(["']\/api\/verify["']/);
});

test("frontend keeps curated sample verifications local", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /let selectedSampleId = null/);
  assert.match(main, /sampleId: selectedSampleId/);
  assert.match(main, /if \(request\.sampleId\)/);
  assert.match(main, /return resolveInitialResult\(request\)/);
});

test("frontend renders returned key frame images", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /media\.keyframeUrl/);
  assert.match(main, /<img class="keyframe-image"/);
});

test("frontend does not expose Cerul request ids in the UI", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.doesNotMatch(main, /Cerul MCP \$\{escapeHtml\(requestId\)\}/);
});

test("sample buttons mark requests as local demos without auto-submitting", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /selectedSampleId = match\.id/);
  assert.match(main, /elements\.speakerInput\.value = match\.speaker/);
  assert.doesNotMatch(main, /elements\.caseList\?\.[\s\S]*submitVerification\(\);/);
});

test("editing the composer clears curated sample mode", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /elements\.quoteInput\?\.[\s\S]*selectedSampleId = null/);
});

test("frontend reclassifies API results by authenticity score", async () => {
  const main = await readFile(new URL("../Frontend/main.js", import.meta.url), "utf8");

  assert.match(main, /classifyAuthenticity\(authenticity\)/);
  assert.match(main, /\.\.\.classification/);
});
