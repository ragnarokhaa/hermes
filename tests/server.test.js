import assert from "node:assert/strict";
import test from "node:test";

import { normalizeHermesResult } from "../server.js";

test("normalizes structured Hermes JSON into the frontend result shape", () => {
  const result = normalizeHermesResult({
    query: "Did Sam Altman say Sora can generate realistic video?",
    speaker: "Sam Altman",
    type: "video",
    hermesContent: JSON.stringify({
      verdict: "正确",
      confidence: 0.84,
      summary: "Cerul found video evidence supporting the claim.",
      evidence: [
        {
          type: "Video",
          source: "OpenAI interview",
          detail: "The transcript discusses realistic video generation.",
          score: 0.91,
          url: "https://cerul.ai/video/example",
          timestamp: "12:41-12:52",
          keyframe_url: "https://cerul.ai/keyframe/example.jpg"
        }
      ]
    })
  });

  assert.equal(result.query, "Did Sam Altman say Sora can generate realistic video?");
  assert.equal(result.status, "true");
  assert.equal(result.verdictLabel, "True News");
  assert.equal(result.confidence, "84%");
  assert.equal(result.mediaEvidence.source, "OpenAI interview");
  assert.equal(result.mediaEvidence.timestamp, "12:41-12:52");
  assert.equal(result.mediaEvidence.keyframeUrl, "https://cerul.ai/keyframe/example.jpg");
  assert.equal(result.evidence[0].action, "Open source");
});
