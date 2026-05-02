# Truth Hermes

> Video-backed news verification — agent is all you need.

Truth Hermes is a fact-checking demo targeting misinformation in the short-video era. Users submit a claim, and the system aligns it against real video evidence (official launches, interviews, earnings calls, etc.), returning a **True / Need Review / Fake** verdict with an authenticity score.

The project consists of three parts:

- **Frontend/** — Frontend UI (vanilla HTML/CSS/JS)
- **hermes-cerul-tech-news-package/** — Hermes agent package (skills, scripts, agent definitions)
- **config/** — Cerul MCP integration config example

The page includes 3 preset examples you can click to try instantly:

| Input Claim | Expected Verdict | Authenticity |
|---|---|---|
| "Did OpenAI publicly demonstrate GPT-4o with real-time voice and vision capabilities…" | **True** | 71–99% |
| "Did Apple announce that it will give every university student a free MacBook…" | **Fake** | 1–39% |
| "Is this NVIDIA keynote clip misleading because the surrounding product context was removed." | **Need Review** | 40–70% |

---

## Core Approach: Cerul Judgment Layer

Truth Hermes' judgment logic has two layers:

1. **Cerul Retrieval Layer** — Uses Cerul MCP to search video/transcript/media corpora for matching evidence (sources, timestamps, keyframes)
2. **Judgment Layer** — In the frontend [Frontend/main.js](Frontend/main.js) `cerulJudgmentLayer`, scans retrieved evidence text for three signal categories:

| Signal Category | Examples | Purpose |
|---|---|---|
| Strong fake | `rumor`, `no credible`, `no evidence`, `no official`, `could not locate` | High specificity — triggers strong fake verdict on match |
| Strong true | `official launch`, `launch livestream`, `product page`, `press reports`, `official keynote` | Phrase-level matching to avoid false positives from neutral words like `official` in negation contexts |
| Mixed | `reposted clip`, `trimmed`, `omitted`, `reframed`, `diverge` | Original source exists but was clipped/reframed → Need Review |

Judgment priority:

```
fakeScore ≥ 2                       → fake
mixedScore ≥ 2 and fakeScore < 2    → uncertain
trueScore ≥ 2 and fakeScore = 0     → true
fakeScore ≥ 1 and trueScore < 2     → fake
otherwise                            → uncertain
```

The final Authenticity score maps the classification result to the corresponding range (1–39 / 40–70 / 71–99).

> Key design principle: **fake signals have the highest priority**, and only phrases are matched (not neutral words like `official` or `launch` that can appear in negation contexts), preventing fake news from being "diluted" into Need Review by neutral word counts.

---

## Cerul MCP Integration

[config/cerul-mcp.yaml.example](config/cerul-mcp.yaml.example) is the minimal Cerul MCP configuration:

```yaml
mcp_servers:
  cerul:
    url: "https://api.cerul.ai/mcp?apiKey=${CERUL_API_KEY}"
    enabled: true
    timeout: 120
    connect_timeout: 30
    tools:
      include:
        - cerul_search
        - cerul_usage
```

Copy it as `config/cerul-mcp.yaml` and set the `CERUL_API_KEY` environment variable — the Hermes agent will pick it up automatically.

---

## Directory Structure

```
hermes/
├── Frontend/                          # Frontend UI
│   ├── index.html
│   ├── main.js                        # Contains cerulJudgmentLayer
│   ├── styles.css
│   └── assets/
├── hermes-cerul-tech-news-package/    # Agent package
│   └── hermes-cerul-tech-news-package/
│       ├── hermes-agent/              # Agent definitions
│       ├── skills/                    # Skills
│       ├── scripts/                   # Utility scripts
│       ├── config/
│       └── PACKAGE_MANIFEST.md
├── config/
│   └── cerul-mcp.yaml.example         # Cerul MCP config example
└── README.md
```

---

## Suggested Backend API

The frontend mock data structure is aligned with the target API. Recommended backend response:

```json
{
  "query": "string",
  "speaker": "string",
  "type": "quote | speech | video",
  "verdict": "True | Need Review | Fake",
  "authenticity": 86,
  "summary": "string",
  "mediaEvidence": {
    "source": "string",
    "provider": "string",
    "timestamp": "09:12 - 09:48",
    "frameTimestamp": "09:26",
    "description": "string"
  },
  "evidence": [
    {
      "type": "Video | Official Announcement | Tech Coverage",
      "source": "string",
      "detail": "string",
      "score": "0.97",
      "timestamp": "09:12 - 09:48"
    }
  ]
}
```

---

## Acknowledgments

- **Cerul** — Video evidence retrieval
- **Anthropic Claude** — Agent reasoning and judgment
- Visual references: Linear, Raycast, Perplexity, Stripe Sessions
