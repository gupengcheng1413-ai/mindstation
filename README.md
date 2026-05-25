# 心灵驿站 (Mind Station)

5.6 寸长条屏 (1640×348) 心灵陪伴产品 demo,纯静态 HTML/CSS/JS。

## 子功能

| 子功能 | 状态 | 路径 | Pages |
|---|---|---|---|
| 答案之书 | ✅ 已上线 | `v1/answer-book/` | [link](https://gupengcheng1413-ai.github.io/mindstation/v1/#answer) |
| 每日星语 | ✅ 已上线 | `v1/daily-words/` | [link](https://gupengcheng1413-ai.github.io/mindstation/v1/#reminder) |
| 性格认知 | 占位中 | `v1/personality/` | — |
| 姓名寓意 | 占位中 | `v1/naming/` | — |

## 架构

```
v1/                      ← 心灵驿站 v1 整产品快照
├── index.html           ← 4 卡入口主壳 + 全部场景
├── styles.css           ← 公共 token + 各场景样式
├── app.js               ← setScene 路由 + 各场景逻辑
├── daily-words/
│   └── assets/          ← 每日星语专属(星座、bg、chip)
├── answer-book/         ← 答案之书子项目(iframe 集成)
├── personality/         ← 性格认知(占位)
└── naming/              ← 姓名寓意(占位)
```

## 本地预览

```bash
cd v1 && python3 -m http.server 8000
```

http://localhost:8000/

调试 hash:`#daily` / `#daily?z=taurus` / `#select` / `#reminder` / `#collect` / `#answer`

## 在线预览

https://gupengcheng1413-ai.github.io/mindstation/v1/
