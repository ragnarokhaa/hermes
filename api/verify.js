import { verifyWithCerul } from "../lib/verification.js";

function sendJson(response, status, payload) {
  response.status(status).setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  try {
    const payload = typeof request.body === "object" && request.body
      ? request.body
      : JSON.parse(request.body || "{}");
    const query = String(payload.query || "").trim();

    if (!query) {
      sendJson(response, 400, { error: "query is required" });
      return;
    }

    const result = await verifyWithCerul({
      query,
      speaker: String(payload.speaker || "").trim(),
      type: payload.type || "video",
      apiKey: process.env.CERUL_API_KEY,
    });

    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, 502, {
      error: "verification_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
