# Hermes FactLens Frontend Demo

一个前端优先的黑客松 demo，用于展示 `Hermes 3 + Exa MCP` 在“名言溯源 / 视频鉴伪 / 证据检索”场景下的交互方式。

## 运行方式

这是一个零构建静态页面，直接打开 `index.html` 即可预览。

如果你本地习惯用静态服务器，也可以在当前目录执行任一方式：

- `python -m http.server 8000`
- `npx serve .`
- VS Code Live Server

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
