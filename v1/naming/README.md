# 姓名寓意

心灵驿站子功能，长条屏 1640×348，独立子项目，由主壳 `v1/index.html` 经 iframe 懒加载，靠 `postMessage({type:"naming-back"})` 回首页（与 personality / answer-book 一致）。

## 结构
- `index.html` 场景骨架（input / confirm / scan / loading / blocked / history / result）
- `style.css` device 缩放骨架 + 各场景 + 结果页模块组件样式
- `script.js` 路由 setScene、键盘录入、姓名校验分流、扫描/加载模拟、history（置顶/删除）、回主壳
- `render.js` + `render-part2.js` 结果页数据驱动渲染器（中文模板 / 音译模板）
- `data/names.js` + `data/names-part2.js` 5 个预设名字数据
- `data/api.js` **唯一取数边界**：`fetchName(name)` + `classify()` + 兜底模板
- `assets/` 从 Figma 导出的装饰资源（蛋蛋 IP、装饰色块）

## 名字分流
- 预设 5 名（雷军/刘庆升/吴玉胜/乔布斯/埃隆马斯克）→ 出对应详情
- 其他疑似真名（2-4 汉字 / 含空格音译串）→ 兜底模板（标「示例」，待 AI 补全）
- 纯数字 / 乱码 / 单字 / 空 → blocked 拦截页

## 接 LLM
把 `data/api.js` 里 `fetchName()` 换成远程请求即可，结果页 DOM/CSS/渲染器无需改动：
```js
async function fetchName(name){
  return await (await fetch('/api/naming?name='+encodeURIComponent(name))).json();
}
```
返回对象需符合 `data/names.js` 的字段结构（template:"cn"|"translit" + 各模块字段）。

## 本地预览
`cd v1 && python3 -m http.server` → 打开 index.html → 点首页「姓名寓意」。
