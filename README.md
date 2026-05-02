# Truth Hermes

> Video-backed news verification — agent is all you need.

Truth Hermes 是一个面向"短视频时代假新闻"的事实核查 demo：用户输入一条声明，系统把它对齐到真实的视频证据（官方发布会、采访、财报会议等），并给出 **True / Need Review / Fake** 的判断和可信度分数。

项目由三部分组成：

- **Frontend/** — 前端（原生 HTML/CSS/JS）
- **hermes-cerul-tech-news-package/** — Hermes agent 包（含 skills、scripts、agent 定义）
- **config/** — Cerul MCP 接入配置示例


页面内置 3 个预设案例可以直接点击体验：

| 输入声明 | 预期判定 | Authenticity |
|---|---|---|
| "Did OpenAI publicly demonstrate GPT-4o with real-time voice and vision capabilities…" | **True** | 71–99% |
| "Did Apple announce that it will give every university student a free MacBook…" | **Fake** | 1–39% |
| "Is this NVIDIA keynote clip misleading because the surrounding product context was removed." | **Need Review** | 40–70% |

---

## 核心思路：Cerul Judgment Layer

Truth Hermes 的判断逻辑分两层：

1. **Cerul 检索层** — 通过 Cerul MCP 在视频/转录/媒体语料中检索匹配证据（来源、时间戳、关键帧）
2. **Judgment 层** — 在前端 [Frontend/main.js](Frontend/main.js) 的 `cerulJudgmentLayer` 中，把检索出的证据文本扫描三类信号：

| 信号类别 | 例子 | 作用 |
|---|---|---|
| Strong fake | `rumor`、`no credible`、`no evidence`、`no official`、`could not locate` | 高特异性，命中即强判 fake |
| Strong true | `official launch`、`launch livestream`、`product page`、`press reports`、`official keynote` | 词组级匹配，避免 `official` 这类中性词在否定语境下误判 |
| Mixed | `reposted clip`、`trimmed`、`omitted`、`reframed`、`diverge` | 有原始来源但被剪裁/重组 → Need Review |

判断顺序：

```
fakeScore ≥ 2                       → fake
mixedScore ≥ 2 且 fakeScore < 2     → uncertain
trueScore ≥ 2 且 fakeScore = 0      → true
fakeScore ≥ 1 且 trueScore < 2      → fake
otherwise                            → uncertain
```

最终的 Authenticity 分数由分类结果映射到对应区间（1–39 / 40–70 / 71–99）。

> 这一层的设计要点：**fake 信号优先级最高**，且只匹配词组（不匹配 `official`、`launch` 这类在否定语境下也会出现的中性词），避免假新闻被中性词数量"抵消"成 Need Review。

---

## Cerul MCP 接入

[config/cerul-mcp.yaml.example](config/cerul-mcp.yaml.example) 是 Cerul MCP 的最小接入配置：

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

复制为 `config/cerul-mcp.yaml` 并设置 `CERUL_API_KEY` 环境变量后即可被 Hermes agent 加载。

---

## 目录结构

```
hermes/
├── Frontend/                          # 前端
│   ├── index.html
│   ├── main.js                        # 含 cerulJudgmentLayer
│   ├── styles.css
│   └── assets/
├── hermes-cerul-tech-news-package/    # Agent 包
│   └── hermes-cerul-tech-news-package/
│       ├── hermes-agent/              # Agent 定义
│       ├── skills/                    # 技能
│       ├── scripts/                   # 工具脚本
│       ├── config/
│       └── PACKAGE_MANIFEST.md
├── config/
│   └── cerul-mcp.yaml.example         # Cerul MCP 配置示例
└── README.md
```

---

## 后端接口建议

前端 mock 数据结构已与目标接口对齐，推荐后端返回：

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

## 致谢

- **Cerul** — 视频证据检索
- **Anthropic Claude** — Agent 推理与判断
- 视觉参考：Linear、Raycast、Perplexity、Stripe Sessions
