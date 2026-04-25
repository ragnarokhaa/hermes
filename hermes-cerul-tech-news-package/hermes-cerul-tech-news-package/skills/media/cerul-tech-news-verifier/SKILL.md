---
name: cerul-tech-news-verifier
description: >
  Verify whether claims in technology-news videos are likely true, false, misleading,
  or unsupported by searching video speech, visuals, and on-screen text with Cerul MCP.
  Use when the user asks whether a tech-news claim from a video is fake news, asks to
  fact-check a video segment, or asks for timestamped visual evidence from a video.
---

# Cerul Tech News Video Verification

Use the configured Cerul MCP server for video-grounded evidence. The available Hermes tool names are expected to be:

- `mcp_cerul_cerul_search`
- `mcp_cerul_cerul_usage`

## Workflow

1. Parse the user's claim and any video URL, title, speaker, company, product, date, or timestamp hint.
2. Call `mcp_cerul_cerul_search` with a focused query for the exact claim.
   - Prefer `ranking_mode: "rerank"`.
   - Prefer `include_answer: true` when the user asks for a judgment, not only search results.
   - Use `max_results: 5` by default; increase only when evidence is thin.
   - If the user supplies a YouTube/source URL or speaker/date constraints and the MCP tool supports filters, pass them as filters.
3. Inspect returned `snippet`, `transcript`, `title`, `url`, `speaker`, `timestamp_start`, `timestamp_end`, `thumbnail_url`, and especially `keyframe_url`.
4. Decide the verdict conservatively:
   - `正确`: the video evidence directly supports the claim.
   - `错误`: the evidence directly contradicts the claim.
   - `误导`: part of the claim is true but context, timing, scope, or wording changes the meaning.
   - `证据不足`: Cerul results do not contain enough relevant evidence.
5. Return timestamped evidence and frame images. For each evidence item include:
   - source title and URL
   - timestamp range, formatted as `HH:MM:SS-HH:MM:SS` or `MM:SS-MM:SS`
   - the relevant quoted/paraphrased evidence from transcript or on-screen visual description
   - `keyframe_url` as the frame image; render it as Markdown image when possible: `![证据帧](KEYFRAME_URL)`
6. If `keyframe_url` is missing, use `thumbnail_url` only as a fallback and clearly label it as preview image rather than timestamp frame.
7. If the user asks to save the frame locally and a terminal/file tool is available, download the `keyframe_url` into the working directory with a descriptive filename and return the local path.

## Output Shape

Use this compact structure in Chinese:

```markdown
结论：正确 / 错误 / 误导 / 证据不足

依据：
1. [标题](url) 时间戳 `MM:SS-MM:SS`
   证据：...
   ![证据帧](keyframe_url)

判断理由：...

注意：如果证据来自视频片段，只说明该视频片段能支持/反驳什么；不要把它扩展成没有证据支撑的全局事实。
```

## Reliability Rules

- Do not invent timestamps or frame URLs.
- If timestamp fields are null, say that Cerul did not return a timestamp for that evidence.
- Treat Cerul as video evidence search, not a universal fact database. For high-stakes or current claims, combine video evidence with web/source verification when available.
- Never expose the Cerul API key in responses, logs, or generated files.
