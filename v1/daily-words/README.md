# 每日星语 (Daily Words)

心灵驿站子功能。星座绑定 + 每日星语 + 收藏。

## 资源

`assets/illustrations/` — Figma 1:1 还原的整图 PNG (home / unbound / reminder / select / daily-leo / daily-taurus / collect 等),DOM 上叠透明热区做点击。

## 关键场景

- `home` 4 卡入口(共享主壳)
- `unbound` / `reminder` 未绑定 / 已绑定提示页
- `select` 12 星座选择(选中替换 chip,DOM 用 `chips/<zodiac>.png`)
- `loading` 进度条 + 流星
- `daily` 每日星语主页(狮子/金牛 6 星座共用对应底图,DOM 旋转星球)
- `collect` 收藏列表(DOM 渲染,按实际数量,日期取系统时间)
- `confirm` 删除确认 overlay

## 集成位置

主项目 `v1/index.html` / `v1/styles.css` / `v1/app.js`,本目录只放专属资源。
