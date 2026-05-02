# Hermes FactLens Frontend Demo

一个前端优先的新闻验证 demo，用于展示 Truth Hermes 在“名言溯源 / 视频鉴伪 / 证据检索”场景下的交互方式。

## 运行方式

这是一个零构建静态页面，直接打开 `index.html` 即可预览三个本地示例。

如果你本地习惯用静态服务器，也可以在当前目录执行任一方式：

- `python -m http.server 8000`
- `npx serve .`
- VS Code Live Server

部署到 Vercel 后，三个预设示例继续走本地 demo 判断；用户自己输入的真实新闻会调用 `/api/verify`，再由后端接入 Cerul MCP。

## 当前包含的前端模块

- 输入区：自由输入待验证内容、人物和素材类型
- 预设案例：真实案例、虚假案例、视频鉴伪案例
- Verification Workflow：展示判断、来源视频、时间戳和关键帧
- Verdict 面板：真假判断、置信度、摘要、元信息
- Evidence 面板：视频、文本、新闻等证据卡片
- 视觉参考与功能建议区：方便 hackathon pitch 时直接展示

## 当前后端接口

真实输入会向 Vercel Function 发送请求：

```json
{
  "query": "string",
  "speaker": "string",
  "type": "quote | speech | video"
}
```

后端需要在 Vercel 环境变量中配置 `CERUL_API_KEY`。不要把 API key 写进前端代码或提交到 GitHub。

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
