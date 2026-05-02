import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeCerulSearchResult,
  parseMcpResponse,
} from "../lib/verification.js";

test("parses JSON and SSE MCP responses", () => {
  assert.deepEqual(
    parseMcpResponse("application/json", '{"jsonrpc":"2.0","id":1,"result":{"ok":true}}'),
    { jsonrpc: "2.0", id: 1, result: { ok: true } },
  );

  assert.deepEqual(
    parseMcpResponse(
      "text/event-stream",
      'event: message\ndata: {"jsonrpc":"2.0","id":2,"result":{"ok":true}}\n\n',
    ),
    { jsonrpc: "2.0", id: 2, result: { ok: true } },
  );
});

test("normalizes Cerul search results into the frontend result shape", () => {
  const result = normalizeCerulSearchResult({
    query: "Sam Altman Sora realistic video",
    speaker: "Sam Altman",
    type: "video",
    searchPayload: {
      results: [
        {
          score: 0.8004,
          url: "https://cerul.ai/v/example/0",
          title: "OpenAI Sora: A Closer Look!",
          snippet: "This closer look discusses Sora and realistic text-to-video output.",
          thumbnail_url: "https://img.example/maxresdefault.jpg",
          keyframe_url: "https://cdn.cerul.ai/frames/example/000.jpg",
          source: "youtube",
          speaker: "Two Minute Papers",
          timestamp_start: 0,
          timestamp_end: 60.36,
        },
      ],
      credits_remaining: 7988,
    },
  });

  assert.equal(result.query, "Sam Altman Sora realistic video");
  assert.equal(result.status, "true");
  assert.equal(result.verdictLabel, "True");
  assert.equal(result.confidence, "80%");
  assert.match(result.summary, /Cerul found 1 video evidence result/);
  assert.equal(result.mediaEvidence.source, "OpenAI Sora: A Closer Look!");
  assert.equal(result.mediaEvidence.timestamp, "00:00-01:00");
  assert.equal(result.mediaEvidence.keyframeUrl, "https://cdn.cerul.ai/frames/example/000.jpg");
  assert.equal(result.evidence[0].source, "OpenAI Sora: A Closer Look!");
  assert.equal(result.evidence[0].action, "Open source");
});

test("classifies Cerul confidence scores using the frontend authenticity thresholds", () => {
  const high = normalizeCerulSearchResult({
    query: "high confidence",
    searchPayload: { results: [{ score: 0.79, title: "High confidence source" }] },
  });
  const medium = normalizeCerulSearchResult({
    query: "medium confidence",
    searchPayload: { results: [{ score: 0.7, title: "Medium confidence source" }] },
  });
  const low = normalizeCerulSearchResult({
    query: "low confidence",
    searchPayload: { results: [{ score: 0.39, title: "Low confidence source" }] },
  });

  assert.equal(high.verdictLabel, "True");
  assert.equal(medium.verdictLabel, "Need Review");
  assert.equal(low.verdictLabel, "Fake");
});
