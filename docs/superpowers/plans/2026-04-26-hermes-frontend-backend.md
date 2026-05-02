# Hermes Frontend Backend Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the static Truth Hermes frontend to the local Hermes API server so user submissions call Hermes Agent and Cerul MCP.

**Architecture:** Add a small Node HTTP server that serves `Frontend/` and exposes `POST /api/verify`. The browser calls `/api/verify`; the server calls Hermes at `http://127.0.0.1:8643/v1/chat/completions`, then normalizes the response into the frontend's existing result shape.

**Tech Stack:** Node.js built-in `http`, static HTML/CSS/JS, Hermes OpenAI-compatible API.

---

### Task 1: Local Server

**Files:**
- Create: `/Users/meng/Documents/Codex/2026-04-24/github/hermes-main/server.js`
- Create: `/Users/meng/Documents/Codex/2026-04-24/github/hermes-main/package.json`

- [ ] Add a dependency-free Node server that serves static files from `Frontend/`.
- [ ] Add `POST /api/verify` that validates `{ query, speaker, type, conversationHistory }`.
- [ ] Call Hermes `POST /v1/chat/completions` with `Authorization: Bearer local-hermes-dev`.
- [ ] Parse JSON from Hermes when possible; fall back to a readable text summary when needed.

### Task 2: Frontend Wiring

**Files:**
- Modify: `/Users/meng/Documents/Codex/2026-04-24/github/hermes-main/Frontend/main.js`
- Modify: `/Users/meng/Documents/Codex/2026-04-24/github/hermes-main/Frontend/README.md`

- [ ] Convert `submitVerification()` to async.
- [ ] Show an immediate loading result while `/api/verify` is running.
- [ ] Replace the loading result with normalized real data.
- [ ] Keep existing mock samples as fallback when the backend request fails.

### Task 3: Verification

**Commands:**
- `node server.js`
- `curl -sS http://127.0.0.1:3000/api/health`
- `curl -sS -X POST http://127.0.0.1:3000/api/verify -H 'Content-Type: application/json' -d '{"query":"请调用 Cerul usage 工具检查当前用量，只返回 tier、credits_remaining、rate_limit_per_sec。","type":"video"}'`

- [ ] Verify static server health.
- [ ] Verify `/api/verify` returns JSON in the frontend result shape.
- [ ] Open the frontend at `http://127.0.0.1:3000`.
