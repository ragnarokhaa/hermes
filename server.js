import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.join(__dirname, "Frontend");

const PORT = Number(process.env.PORT || 3000);
const HERMES_API_URL =
  process.env.HERMES_API_URL || "http://127.0.0.1:8643/v1/chat/completions";
const HERMES_API_KEY = process.env.HERMES_API_KEY || "local-hermes-dev";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function normalizeConfidence(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${Math.round((value <= 1 ? value * 100 : value))}%`;
  }

  const text = String(value || "").trim();
  if (!text) {
    return "72%";
  }
  return text.endsWith("%") ? text : text;
}

function classifyVerdict(value) {
  const text = String(value || "").toLowerCase();

  if (text.includes("正确") || text.includes("true") || text.includes("support")) {
    return { status: "true", verdictLabel: "True News", verdictTitle: "True News" };
  }

  if (text.includes("错误") || text.includes("false") || text.includes("contradict")) {
    return { status: "false", verdictLabel: "False News", verdictTitle: "False News" };
  }

  if (text.includes("误导") || text.includes("mixed") || text.includes("misleading")) {
    return { status: "mixed", verdictLabel: "Misleading Clip", verdictTitle: "Misleading Clip" };
  }

  return { status: "pending", verdictLabel: "Need Review", verdictTitle: "Need Review" };
}

function parseHermesContent(content) {
  const text = String(content || "").trim();
  if (!text) {
    return {};
  }

  const unfenced = text
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1));
      } catch {
        return { summary: unfenced };
      }
    }
  }

  return { summary: unfenced };
}

function normalizeEvidence(item, index) {
  const source = item?.source || item?.title || item?.url || `Evidence ${index + 1}`;
  const url = item?.url || item?.video_url || item?.source_url || "";
  const timestamp =
    item?.timestamp ||
    item?.timestamp_range ||
    [item?.timestamp_start, item?.timestamp_end].filter(Boolean).join("-");

  return {
    type: item?.type || item?.provider || "Video",
    source,
    detail: item?.detail || item?.snippet || item?.transcript || item?.evidence || "",
    score: item?.score ?? item?.confidence ?? item?.rerank_score ?? "0.80",
    timestamp,
    action: url ? "Open source" : item?.action || "",
    url,
    keyframe_url: item?.keyframe_url || item?.keyframeUrl || item?.thumbnail_url || "",
  };
}

function mediaEvidenceFrom(evidence, status) {
  const firstVideo = evidence.find((item) => item.keyframe_url || item.timestamp || item.url);
  if (!firstVideo) {
    return null;
  }

  return {
    label: "Primary video evidence",
    source: firstVideo.source,
    provider: firstVideo.type || "Cerul MCP",
    description: firstVideo.detail || "Cerul returned this source as relevant evidence.",
    timestamp: firstVideo.timestamp || "Timestamp pending",
    linkLabel: firstVideo.url ? "Open source" : "Source returned",
    clipLabel: "Evidence clip",
    frameTimestamp: firstVideo.timestamp || "Key frame",
    frameTitle: firstVideo.keyframe_url ? "Cerul key frame" : "Key frame pending",
    frameNote: firstVideo.keyframe_url
      ? "This frame comes from the Cerul evidence window."
      : "Cerul did not return a key frame for this evidence.",
    frameClass: status === "mixed" ? "frame-clip" : status === "false" ? "frame-archive" : "frame-stage",
    keyframeUrl: firstVideo.keyframe_url,
  };
}

export function normalizeHermesResult({ query, speaker = "", type = "video", hermesContent }) {
  const parsed = parseHermesContent(hermesContent);
  const verdictText = parsed.verdict || parsed.conclusion || parsed["结论"] || parsed.status;
  const verdict = classifyVerdict(verdictText);
  const evidence = Array.isArray(parsed.evidence)
    ? parsed.evidence.map(normalizeEvidence)
    : Array.isArray(parsed["依据"])
      ? parsed["依据"].map(normalizeEvidence)
      : [];

  return {
    id: `hermes-${Date.now()}`,
    speaker,
    type,
    query,
    ...verdict,
    summary:
      parsed.summary ||
      parsed.reason ||
      parsed["判断理由"] ||
      parsed["摘要"] ||
      String(hermesContent || "Hermes returned a response, but no structured summary was found."),
    confidence: normalizeConfidence(parsed.confidence),
    mediaEvidence: parsed.mediaEvidence || mediaEvidenceFrom(evidence, verdict.status),
    evidence,
    raw: parsed,
  };
}

function buildHermesPrompt({ query, speaker, type, conversationHistory }) {
  const priorContext = Array.isArray(conversationHistory) && conversationHistory.length
    ? `\nPrior frontend conversation context:\n${JSON.stringify(conversationHistory.slice(-3))}`
    : "";

  return `You are Truth Hermes, a video-grounded verification agent.

Use Cerul MCP tools for video, talk, interview, podcast, conference, quote, or speech evidence. Be conservative.

User claim:
${query}

Speaker/channel hint: ${speaker || "not provided"}
Content type: ${type || "video"}${priorContext}

Return JSON only with this exact shape:
{
  "verdict": "正确 | 错误 | 误导 | 证据不足",
  "confidence": 0.0,
  "summary": "short Chinese explanation",
  "evidence": [
    {
      "type": "Video",
      "source": "source title",
      "detail": "evidence detail",
      "score": 0.0,
      "url": "source url if available",
      "timestamp": "MM:SS-MM:SS if available",
      "keyframe_url": "keyframe image url if available"
    }
  ]
}`;
}

async function readRequestJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 64_000) {
      throw new Error("Request body too large");
    }
  }
  return body ? JSON.parse(body) : {};
}

async function callHermes(payload) {
  const response = await fetch(HERMES_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${HERMES_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "hermes-agent",
      messages: [{ role: "user", content: buildHermesPrompt(payload) }],
      stream: false,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Hermes API ${response.status}: ${text}`);
  }

  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content || "";
}

async function handleVerify(req, res) {
  try {
    const payload = await readRequestJson(req);
    const query = String(payload.query || "").trim();
    if (!query) {
      sendJson(res, 400, { error: "query is required" });
      return;
    }

    const hermesContent = await callHermes({
      query,
      speaker: payload.speaker || "",
      type: payload.type || "video",
      conversationHistory: payload.conversationHistory || [],
    });

    sendJson(res, 200, normalizeHermesResult({
      query,
      speaker: payload.speaker || "",
      type: payload.type || "video",
      hermesContent,
    }));
  } catch (error) {
    sendJson(res, 502, {
      error: "verification_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  const relativePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(FRONTEND_DIR, relativePath));

  if (!filePath.startsWith(FRONTEND_DIR) || !existsSync(filePath)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const data = await readFile(filePath);
  res.writeHead(200, {
    "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
  });
  res.end(data);
}

export function createApp() {
  return createServer(async (req, res) => {
    if (req.method === "GET" && req.url === "/api/health") {
      sendJson(res, 200, { ok: true, hermesApiUrl: HERMES_API_URL });
      return;
    }

    if (req.method === "POST" && req.url === "/api/verify") {
      await handleVerify(req, res);
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    sendJson(res, 405, { error: "method_not_allowed" });
  });
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  createApp().listen(PORT, "127.0.0.1", () => {
    console.log(`Truth Hermes frontend running at http://127.0.0.1:${PORT}`);
    console.log(`Proxying verification requests to ${HERMES_API_URL}`);
  });
}
