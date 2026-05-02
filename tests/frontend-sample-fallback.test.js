import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSampleFallback,
  findSampleForRequest,
} from "../Frontend/sampleFallback.js";

const appleSample = {
  id: "apple-free-macbook",
  query:
    "Did Apple announce that it will give every university student a free MacBook starting this year.",
  summary: "The rumor is not supported by Apple primary-source evidence.",
  evidence: [{ type: "Newsroom Search", source: "Official Apple channels" }],
};

test("finds a curated sample by typed query when the sample id is missing", () => {
  const sample = findSampleForRequest([appleSample], {
    query:
      " did apple announce that it will give every university student a free macbook starting this year. ",
  });

  assert.equal(sample, appleSample);
});

test("builds a curated fallback when the live verifier returns no evidence", () => {
  const fallback = buildSampleFallback(appleSample, {
    evidence: [],
    raw: { request_id: "req_live_zero", results: [], credits_remaining: 123 },
  });

  assert.equal(fallback.raw.request_id, "req_live_zero");
  assert.equal(fallback.evidence[0].type, "Live MCP Search");
  assert.doesNotMatch(fallback.evidence[0].source, /req_live_zero/);
  assert.match(fallback.summary, /Cerul returned no live video match/);
});
