const CERUL_MCP_URL = "https://api.cerul.ai/mcp";
const MCP_PROTOCOL_VERSION = "2025-03-26";
const DEFAULT_CERUL_DELAY_MS = 1_250;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

function sanitizeError(text, apiKey = "") {
  let sanitized = String(text || "");
  if (apiKey) {
    sanitized = sanitized.split(apiKey).join("[REDACTED_CERUL_API_KEY]");
  }
  return sanitized.replace(/apiKey=[^\s&"']+/gi, "apiKey=[REDACTED]");
}

function formatTime(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function formatTimestamp(start, end) {
  if (start === undefined && end === undefined) {
    return "";
  }
  return `${formatTime(start)}-${formatTime(end ?? start)}`;
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
    [item?.timestamp_start, item?.timestamp_end].filter((value) => value !== undefined).join("-");

  return {
    type: item?.type || item?.provider || item?.source || "Video",
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

export function parseMcpResponse(contentType = "", text = "") {
  const body = String(text || "").trim();
  if (!body) {
    return null;
  }

  if (contentType.includes("text/event-stream")) {
    const events = body
      .split(/\n\n+/)
      .flatMap((event) => event.split("\n"))
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .map((line) => safeJsonParse(line))
      .filter(Boolean);

    return events.at(-1) || null;
  }

  return JSON.parse(body);
}

function extractMcpToolJson(response) {
  if (response?.error) {
    throw new Error(response.error.message || "Cerul MCP returned an error");
  }

  const text = response?.result?.content
    ?.filter((item) => item?.type === "text" && item.text)
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!text) {
    return {};
  }

  return safeJsonParse(text, { text });
}

async function postMcp({ apiKey, body, method, name, fetchImpl }) {
  const endpoint = `${CERUL_MCP_URL}?apiKey=${encodeURIComponent(apiKey)}`;
  const headers = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
    "Mcp-Method": method,
  };
  if (name) {
    headers["Mcp-Name"] = name;
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Cerul MCP ${response.status}: ${sanitizeError(text, apiKey)}`);
  }

  return parseMcpResponse(response.headers.get("content-type") || "", text);
}

export async function callCerulTool({
  apiKey,
  toolName,
  arguments: toolArguments = {},
  fetchImpl = fetch,
  delayMs = DEFAULT_CERUL_DELAY_MS,
}) {
  if (!apiKey) {
    throw new Error("CERUL_API_KEY is not configured");
  }

  await postMcp({
    apiKey,
    fetchImpl,
    method: "initialize",
    body: {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "truthnews-space", version: "0.1.0" },
      },
    },
  });

  await sleep(delayMs);

  await postMcp({
    apiKey,
    fetchImpl,
    method: "notifications/initialized",
    body: { jsonrpc: "2.0", method: "notifications/initialized" },
  });

  await sleep(delayMs);

  const toolResponse = await postMcp({
    apiKey,
    fetchImpl,
    method: "tools/call",
    name: toolName,
    body: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: toolArguments,
      },
    },
  });

  return extractMcpToolJson(toolResponse);
}

export function normalizeCerulSearchResult({
  query,
  speaker = "",
  type = "video",
  searchPayload = {},
}) {
  const results = Array.isArray(searchPayload.results) ? searchPayload.results : [];
  const topScore = results[0]?.rerank_score ?? results[0]?.score ?? 0.72;
  const evidence = results.map((item, index) => normalizeEvidence({
    type: item.source || "Video",
    source: item.title || item.speaker || item.url || `Evidence ${index + 1}`,
    detail: item.snippet || item.transcript || "",
    score: item.rerank_score ?? item.score ?? "",
    url: item.url || "",
    timestamp: formatTimestamp(item.timestamp_start, item.timestamp_end),
    keyframe_url: item.keyframe_url || item.thumbnail_url || "",
  }, index));
  const verdict = classifyVerdict("证据不足");
  const plural = results.length === 1 ? "result" : "results";

  return {
    id: `cerul-${Date.now()}`,
    speaker,
    type,
    query,
    ...verdict,
    summary: results.length
      ? `Cerul found ${results.length} video evidence ${plural}. Review the sources and timestamps below before making a final claim judgment.`
      : "Cerul did not return matching video evidence for this query yet.",
    confidence: normalizeConfidence(topScore),
    mediaEvidence: mediaEvidenceFrom(evidence, verdict.status),
    evidence,
    raw: searchPayload,
  };
}

export async function verifyWithCerul({
  query,
  speaker = "",
  type = "video",
  apiKey,
  fetchImpl = fetch,
}) {
  const searchArguments = {
    query,
    max_results: 5,
    ranking_mode: "embedding",
    include_answer: false,
  };

  if (speaker) {
    searchArguments.speaker = speaker;
  }

  const searchPayload = await callCerulTool({
    apiKey,
    toolName: "cerul_search",
    arguments: searchArguments,
    fetchImpl,
  });

  return normalizeCerulSearchResult({
    query,
    speaker,
    type,
    searchPayload,
  });
}
