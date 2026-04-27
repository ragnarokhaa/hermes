# Hermes FactLens Frontend Demo

一个前端优先的黑客松 demo，用于展示 `Hermes 3 + Exa MCP` 在“名言溯源 / 视频鉴伪 / 证据检索”场景下的交互方式。

## 运行方式

现在推荐从项目根目录启动本地后端，这样前端会调用 Hermes Agent：

```bash
cd /Users/meng/Documents/Codex/2026-04-24/github/hermes-main
npm start
```

然后打开 `http://127.0.0.1:3000`。

这个本地后端会代理到 Hermes API server，默认地址是 `http://127.0.0.1:8643/v1/chat/completions`。如果端口不同，可以用环境变量覆盖：

```bash
HERMES_API_URL=http://127.0.0.1:8643/v1/chat/completions npm start
```

## 当前包含的前端模块

- 输入区：自由输入待验证内容、人物和素材类型
- 预设案例：真实案例、虚假案例、视频鉴伪案例
- Agent Trace：流式展示规划、搜索、对齐、评分过程
- Verdict 面板：真假判断、置信度、摘要、元信息
- Evidence 面板：视频、文本、新闻等证据卡片
- 视觉参考与功能建议区：方便 hackathon pitch 时直接展示

## 后续接后端建议

前端现在的 mock 数据结构已经和真实接口接入方式尽量保持一致，推荐后续接口返回：

```json
{
  "query": "string",
  "speaker": "string",
  "type": "quote | speech | video",
  "verdict": "True | False | Mixed",
  "confidence": 0.96,
  "summary": "string",
  "trace": ["step 1", "step 2"],
  "meta": [["Verdict", "True"], ["Best Timestamp", "12:41"]],
  "evidence": [
    {
      "type": "Video",
      "source": "YouTube / transcript / article",
      "detail": "string",
      "score": 0.94
    }
  ]
}
```

## 视觉参考来源

- Linear
- Raycast
- Perplexity
- Exa
- Vercel
- Stripe Sessions
- Mobbin
- Land-book
- Awwwards
