# 心灵驿站 · 长条屏 demo

5.6 寸长条屏 (1640×348) 心灵驿站功能群 demo,纯静态 HTML/CSS/JS。

## 模块

- **每日星语**:首页 → 未绑定 → 选星座 → loading → 主页 (狮子 / 金牛 6 星座共用) → 收藏列表 → 删除确认
- **答案之书**:集成自 [answer-book](https://github.com/gupengcheng1413-ai/answer-book) 子项目,iframe 嵌入,1640×348 同尺寸

## 版本

- **v1**:首版,Figma 1:1 还原 + 流星动效。在线预览 → `v1/`

## 本地预览

```bash
cd v1 && python3 -m http.server 8000
# 浏览器打开 http://localhost:8000/
```

调试 hash:`#daily` / `#daily?z=taurus` / `#select` / `#reminder` / `#collect` / `#answer`
