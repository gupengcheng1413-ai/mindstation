# 姓名寓意 Worker 部署

## 一次性
1. `npm i -g wrangler`
2. `wrangler login`

## 填 key（不进代码库）
`wrangler secret put DEEPSEEK_KEY` —— 粘贴 DeepSeek API key。

## 部署
`cd v1/naming/worker && wrangler deploy`
拿到形如 `https://naming-worker.<子域>.workers.dev` 的地址，
填进 `v1/naming/data/api.js` 的 `WORKER_URL`。

## 自测
`curl "https://naming-worker.<子域>.workers.dev/?name=周杰伦"` → `{"status":"ok",...}`
`curl "...?name=傻逼"` → `{"status":"blocked",...}`
