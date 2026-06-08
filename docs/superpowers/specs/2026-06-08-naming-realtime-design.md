# 姓名寓意 · 实时查询 + 安全过滤 设计文档

- 日期：2026-06-08
- 子项目：`v1/naming/`（心灵驿站 mindstation）
- 目标：放开任意姓名输入，实时调用 DeepSeek 生成姓名解析；不当内容拦截到 blocked 页，格式问题 toast 留输入页。

## 1. 背景与约束

现状：`v1/naming/` 是纯静态前端，托管在 GitHub Pages（`gupengcheng1413-ai.github.io/mindstation/v1/`）。结果页**数据驱动**——内容全部来自 `data/names.js` 的 5 个预设名（雷军/刘庆升/吴玉胜/乔布斯/埃隆马斯克），渲染器 `render.js` / `render-part2.js` 按数据对象铺排，**文案零硬编码**。取数边界是 `data/api.js` 的 `fetchName(name)`，第 5 行已注释好接 LLM 的目标形态。

硬约束：
- **GitHub Pages 纯静态，不能跑服务端代码。** LLM 的 API key 不能放进前端（浏览器可见）。因此实时生成必须有一个后端代理活在 Pages 之外。
- 前端只通过 `fetchName(name)` 这一个函数取数。本次改动**不动**结果页 DOM、渲染器、CSS。
- 长条屏 1640×348 展示设备，等待体验重要。

已验证的现状事实（写计划时以代码为准）：
- `data/api.js:64` `fetchName` 已是 `Promise`，返回 `null` 表示 invalid。
- `script.js:105` `runLoading` 已 `await DATA.fetchName(name)`，是假进度条。
- `render.js:94/114/129` 对 `people`/`famous`/`english` 空值已 `return ""` —— **空模块自动隐藏，无需改渲染器**。
- `script.js:84` `submitName` 已用 `classify` 分流 invalid→blocked。

## 2. 五个关键决策（已与用户确认）

1. 后端用 **Serverless 函数**（Cloudflare Workers）。
2. LLM 用 **DeepSeek**，用户已有 key。
3. 安全过滤**双层**：前端管格式，后端管内容。
4. 分级反馈：**格式问题→toast 留输入页；内容不当→整页 blocked**。
5. **真实 loading + 文案轮播 + localStorage 缓存**。

补充取舍：
- 内容审核与生成**合并为一次 DeepSeek 请求**（system prompt 内先判后生成）。
- 生僻名编不出的模块（people/famous/english）**留空隐藏**，不让模型硬编造。

## 3. 整体架构与数据流

```
┌─────────────────────┐  HTTPS  ┌──────────────────────┐  HTTPS  ┌─────────────┐
│ GitHub Pages (静态)   │ ──────▶ │ Cloudflare Worker     │ ──────▶ │ DeepSeek     │
│ v1/naming 前端        │         │ (持 key + 内容审核)     │         │ Chat API     │
│ fetchName(name)      │ ◀────── │ 返回结构化 JSON         │ ◀────── │ JSON mode    │
└─────────────────────┘  JSON   └──────────────────────┘  JSON   └─────────────┘
        │  缓存命中(localStorage)直接返回；5 个预设名仍走本地 names.js
```

**平台：Cloudflare Workers。** 免费额度每天 10 万次请求，边缘节点访问 DeepSeek 无障碍，单文件 `worker.js`，`wrangler` 部署，key 用 `wrangler secret put` 存（不进代码库）。

**前端唯一改动点**：`data/api.js` 的 `fetchName` 内部，从「返回本地数据」改成「先查缓存 → 未命中则 `fetch(WORKER_URL)`」。结果页 DOM / 渲染器 / CSS 一行不动。

**仓库结构新增**：
```
v1/naming/
├── worker/
│   ├── worker.js        ← 审核 + 调 DeepSeek + 拼 JSON
│   ├── wrangler.toml    ← 部署配置（不含 key）
│   └── README.md        ← 部署步骤 + key 怎么填
└── data/api.js          ← 改 fetchName 内部：缓存 → Worker（保留本地预设兜底）
```

## 4. 安全过滤（双层）

**第一层 · 前端格式校验（已有，微调）**
`classify()` 继续拦明显垃圾：空 / 纯数字 / 乱码 / 单字 → 判 `invalid`。本层命中只弹 **toast**（"请输入真实姓名"），留输入页重输，**不发请求**。省钱也省 Worker 调用。

**第二层 · 后端内容审核（新增，Worker 内，调 DeepSeek 之前）**
格式过关的名字发到 Worker，Worker 先审内容，从快到慢两道：
1. **关键词表（快、零成本）**：Worker 内置敏感词表，覆盖四类——政治敏感、脏话辱骂、色情、暴恐。命中直接拒，不调 DeepSeek。词表放后端，用户看不到也绕不过。
2. **模型兜底审核（慢、兜底）**：未命中关键词的，在 DeepSeek 调用里先判一次"是否为可正常解析的人名"，挡谐音脏话、新造词、注入串等关键词表覆盖不到的边缘情况。

**注入防护**：姓名会拼进 DeepSeek 的 prompt，Worker 必须先做：长度上限 ≤16 字、去除换行与控制字符。防超长串与 prompt 注入（"忽略上面的指令…"）。

## 5. Worker 内部逻辑与三状态协议

**处理流程（`worker/worker.js`）**
```
GET ?name=xxx
 ├─ 1. 清洗：trim、去换行/控制字符、长度 ≤16；非法 → error
 ├─ 2. 关键词表审核：命中 → { status:"blocked" }
 ├─ 3. 调 DeepSeek（一次请求，JSON mode，system prompt 内先判后生成）：
 │      ① 判断是否可正常解析的人名，不是 → 模型回 {blocked:true}
 │      ② 是 → 按固定 schema 生成全部模块
 ├─ 4. 解析返回：blocked → {status:"blocked"}；正常 → {status:"ok",data}
 └─ 5. 任何异常（超时/解析失败/限流）→ { status:"error" }
```

**前端三状态协议**：
```
{ "status": "ok",      "data": {…} }    // 正常，带结果数据 → result 页
{ "status": "blocked", "reason": "…" }  // 内容不当 → 整页 blocked
{ "status": "error",   "message": "…" } // 系统/网络错误 → toast 可重试
```
前端格式层的 `invalid` 也走 toast。三者清楚分开：`invalid`/`error` → toast 留输入页；`blocked` → 整页拦截。

## 6. DeepSeek 数据契约

**核心：JSON schema 严格对齐现有 `data/names.js`。** 这是"前端零改动渲染"的根。把现有雷军那条数据的结构原样写进 DeepSeek 的 system prompt 当输出模板，用 JSON mode（`response_format: {type:"json_object"}`）保证可解析。

字段（与现有完全一致）：`template / chars / hero / poem / analysis / blessing / surname / rhythm / people / english / fact`（+ `famous` 知名同名人，可选）。

- **模板分流**：prompt 让模型自判——纯汉字 → `template:"cn"`；拉丁串 → `template:"translit"`。各自对应已有两套结果页模板。
- **空模块隐藏**：`people` / `famous` / `english` 生僻名编不出时，要求模型**返回空数组/省略字段**，不硬编造。已验证 `render.js:94/114/129` 对空值 `return ""`，渲染器无需改动。
- **示例标记**：不再走 `buildFallback` 占位；真名一律实时生成。`isFallback` 标记保留给 DeepSeek 调用彻底失败的极端兜底（可选）。

## 7. 缓存与 loading 体验

**缓存（localStorage）**
- key：`naming.cache.<名字>`，存整个 `data` 对象。
- `fetchName` 流程：命中缓存 → 秒返回；未命中 → 调 Worker → 成功后写缓存。
- 5 个预设名继续走本地 `names.js`，永远秒出、不耗 token。
- `blocked` / `error` **不写缓存**（避免一次网络抖动被永久钉死）。

**loading 改造（`runLoading`）**
- 请求中：进度条缓慢爬到 ~85%，配轮播文案（"拆解字义中…""检索典故…""推敲音律…"）。
- 返回后：冲满 100% → 进结果页。
- 超时上限 **15s**，超时走 `error`（toast 可重试）。
- DeepSeek 正常耗时 3~8s，属正常等待，不算错误。

## 8. 错误处理映射

| 情况 | 判定层 | 前端表现 |
|---|---|---|
| 格式非法（空/数字/乱码/单字） | 前端 `classify` | toast「请输入真实姓名」，留输入页 |
| 内容不当（敏感词/模型判违规） | Worker `blocked` | 整页 `blocked` 拦截 |
| 网络失败/超时/Worker 报错 | Worker `error` 或前端超时 | toast「生成失败，请重试」，留输入页 |
| DeepSeek 慢（3~8s） | — | 真实 loading + 文案轮播，非错误 |

## 9. 测试（手动验证清单）

纯静态项目无测试框架，延续现有手动验证：
- 预设名（雷军）→ 秒出、走本地。
- 新真名（如"周杰伦"）→ 走 Worker、loading、结果页正常；二次查秒出（缓存）。
- 脏话/敏感词 → 整页 blocked。
- 乱码/数字/单字 → toast 留输入页。
- 断网 → toast 报错，可重试。
- Worker 侧：`curl` 直打几个用例，验证三状态 JSON 正确。

## 10. 不做（YAGNI）

- 不做流式输出（结果页是一次性数据驱动渲染，增量渲染对 demo 不划算）。
- 不做完整自托管后端（一个接口用 Worker 足够）。
- 不做用户账号 / 服务端持久化（缓存只在浏览器 localStorage）。
- 不动结果页 DOM / 渲染器 / CSS。
