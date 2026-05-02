function normalizeSampleText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

export function findSampleForRequest(samples, request = {}) {
  const sampleId = request.sampleId;
  if (sampleId) {
    const sample = samples.find((item) => item.id === sampleId);
    if (sample) {
      return sample;
    }
  }

  const query = normalizeSampleText(request.query);
  if (!query) {
    return null;
  }

  return samples.find((item) => normalizeSampleText(item.query) === query) || null;
}

export function hasLiveEvidence(data = {}) {
  const evidence = Array.isArray(data.evidence) ? data.evidence : [];
  const rawResults = Array.isArray(data.raw?.results) ? data.raw.results : [];

  return evidence.length > 0 || rawResults.length > 0;
}

export function buildSampleFallback(sample, data = {}) {
  if (!sample || hasLiveEvidence(data)) {
    return null;
  }

  const liveSearchEvidence = {
    type: "Live MCP Search",
    source: "Cerul MCP live search",
    detail:
      "The backend called Cerul MCP successfully, but Cerul returned zero matching video evidence for this exact sample query.",
    score: "0.00",
    action: "MCP live",
  };

  return {
    ...sample,
    raw: data.raw,
    evidence: [liveSearchEvidence, ...(sample.evidence || [])],
    summary:
      `${sample.summary} Cerul returned no live video match for this curated sample query, so Truth Hermes is showing the demo evidence card.`,
  };
}
