# 心灵驿站 · 每日星语 — v1

> 5.6 寸长条屏 demo（1640×348），基于 Figma 设计稿像素级还原 + 动效。
> 纯 HTML / CSS / 原生 JS，无构建步骤。

## 启动

```bash
cd /home/pcgu3/starwords
python3 -m http.server 8989
```

浏览器打开 <http://127.0.0.1:8989/v1/>。

把窗口缩到 1640×348，或在 devtools 里设备模拟成 1640×348，能看到设计原始比例。窗口更窄时会自动按比例缩放。

## 业务路径（页面内按钮驱动）

```
home (4 张卡片轮播)
 └─ 点击「每日星语」卡
     ├─ 未绑定 ─→ unbound（飞船蛋 + "选择你的星座"）
     │           └─「去选择」─→ select（12 星座）─→ 点星座 ─→ loading
     │                                                       └─→ success（绑定成功遮罩）
     │                                                                └─→ daily
     └─ 已绑定 ─→ reminder（飞船蛋 + "快来查看你的每日专属治愈星语吧～"）
                 ├─「去查看」─→ daily
                 └─「我的收藏」胶囊 ─→ collect

daily（每日星语主页）
 ├─ 顶部「我的收藏」胶囊 ─→ collect
 ├─ 顶部「狮子座」胶囊 ─→ select（切换星座）─→ 选其他 ─→ loading ─→ success（切换成功）─→ daily（新主题色）
 ├─ 上下滚动 ─→ 下半区「星愿 Buff」卡片
 └─「收藏」按钮 ─→ 加入收藏（再点取消）

collect（我的收藏）
 ├─ 左上「<」返回 ─→ daily
 └─ 右上垃圾桶 ─→ confirm ─→「确认」→ 全删 + 显示空态 / 「取消」→ 回 collect
```

主流程跑完一遍：home → 每日星语卡 → unbound → 去选择 → 选狮子座 → loading → 已为你绑定【狮子座】 → 立即查看 → daily（狮子主题）→ 上下滚动看 buff → 顶部胶囊「狮子座」→ select → 选金牛座 → loading → 已为你切换【金牛座】 → daily（金牛主题）→ 顶部胶囊「我的收藏」→ collect → 垃圾桶 → 确认 → 空态。

## URL 直达入口（用于截图 / 调试）

| 路径 | 场景 |
|---|---|
| `/v1/` 或 `/v1/#home` | 首页 4 卡轮播 |
| `/v1/#unbound` | 未绑定首屏 |
| `/v1/#reminder` | 已绑定提示页（按 Figma 4092:70） |
| `/v1/#select` | 12 星座选择 |
| `/v1/#loading` | 加载页（直接 hash 进入会停在加载态，业务流程才会自动跳 success） |
| `/v1/#success` | 绑定成功遮罩 |
| `/v1/#daily` | 每日星语主页（狮子座） |
| `/v1/?z=taurus#daily` | 每日星语主页（金牛座，主题色变暖橙） |
| `/v1/#collect` | 我的收藏（带 3 条预置） |
| `/v1/#confirm` | 批量删除确认遮罩 |
| `/v1/?expand=1#daily` | 把 device 临时撑到 1500 高，看 daily 整页内容（含下半 buff 区） |
| `/v1/?noanim=1...` | 跳过入场动画（截图用），可与上面任意 hash 组合 |

## 动效一览

- **星空粒子**：60 颗自适应大小 + 透明度呼吸 + sin 抖动，canvas 60fps；夜空场景（home / select / loading / collect / confirm）启用
- **流星**：每 6–10s 随机角度从右上斜划，长尾渐隐
- **首页卡片**：每日星语卡 shimmer 流动光带 + sparks 闪烁
- **未绑定 / 已绑定提示页 飞船蛋**：上下浮 4s + 圆形光晕呼吸 + 投影同步 + CTA 按钮脉冲
- **星座选择**：12 张卡 hover/active 高光扫光、`is-on` 状态外发光
- **Loading**：蛋蛋插画 ±3° 摇摆 + 3 条轨道粒子环绕 + 进度条 stripe 流动光 + 周边小星 twinkle
- **绑定 / 切换成功**：遮罩 fade-in + 文字与 CTA stagger 进入
- **Daily 主页**：
  - 综合分数字 0→目标值 1.2s 缓动
  - 5 维度条逐条 0→目标宽度，stagger 80ms
  - 6 幸运字段 fade + translate stagger 60ms
  - 综合分柔光 radial 呼吸（与分数颜色绑定）
  - 卡通形象 4s 上下浮 + 投影同步、装饰星 sparkle 缓慢旋转、点缀星 wink
  - 装饰字（"倔强逐梦人""安稳守心者"）走 ZCOOL XiaoWei 字体 + 渐变 bg-clip
  - 主题色：狮子座蓝、金牛座暖橙
- **收藏列表**：每条 stagger fade，删除 stagger 渐出
- **顶部 toast**：透明度 + translateY，2.2s 自动隐藏
- **全局**：`prefers-reduced-motion` 自动降级，禁用所有非 fade 动画

## 颜色 token (按 PRD)

```
综合分段位
  0-20    #FF7474   闲息静养日
  21-40   #FFA946   蓄力回升日
  41-60   #53CF00   平稳精进日
  61-80   #5577FF   思维翱翔日
  81-100  #AB64FB   逐光登顶日

5 维度
  专注 #FF9090   效率 #3D64FF   动力 #00BC87
  收获 #00BBFF   心态 #FFA85B

主 CTA  linear-gradient(90deg, #00DCA9 → #087DF2)
```

## 文件结构

```
v1/
├── index.html          # 单页：9 个场景共存一棵 DOM，hidden 控制显隐
├── styles.css          # token + 9 场景 + keyframes + reduced-motion
├── app.js              # 状态机 + 数字滚动 + 星空 canvas + 流星调度 + loading 假进度
├── daily-words/assets/illustrations/   # Figma 整张切出来的 PNG
│   ├── card-answer.png     # 首页答案之书卡
│   ├── card-star.png       # 首页每日星语卡
│   ├── lion-egg.png        # 狮子蛋（daily 狮子主题）
│   ├── taurus-egg.png      # 金牛蛋（daily 金牛主题）
│   ├── spaceship-egg.png   # 飞船蛋（unbound + reminder）
│   ├── empty-egg.png       # 空收藏插画
│   ├── egg-loading.png     # loading 里的蛋蛋插画
│   └── sparkle.png         # daily 形象上方装饰星
└── README.md
```

## 注意事项

- 字体走 Google Fonts CDN（`Noto Sans SC` + `ZCOOL XiaoWei`），首次加载需联网；离线场景会 fallback 到系统中文字体
- canvas 星空在 high-DPI 屏会自动按 devicePixelRatio 放大，保持锐利
- daily 主页 Figma 原稿 1640×1453（上下两屏），物理屏 1640×348 内通过垂直滚动查看下半区——底部有"↓ 下滑查看星愿 Buff"提示
- 收藏数据当前仅存于内存，刷新页面会重置为 3 条预置内容
- `state.bound` 控制是否已绑定；首次进 demo `state.bound = null`，绑过狮子座后变 `"leo"`，再次点 home 的"每日星语"卡就会进 reminder（4092:70）而不是 unbound
