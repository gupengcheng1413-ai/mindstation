/* ============================================================
   姓名寓意 · 数据接口层 — fetchName()
   这是结果页与"内容源"之间的唯一边界：
   preset 走本地秒出；real 先查缓存，未命中调 Worker 生成。
   fetchName 统一返回 {status:"ok"|"blocked"|"error"|"invalid", data?}
   ============================================================ */
(function (root) {
  "use strict";
  var NAMES = root.NAMES || (root.NAMES = {});

  /* 预设名（命中即出对应详情页） */
  var PRESET = ["雷军", "刘庆升", "吴玉胜", "乔布斯", "埃隆马斯克"];

  // 已部署的后端地址（阿里云函数计算 FC，国内直连；见 worker-fc/index.js）
  var WORKER_URL = "https://t-mvp-liefcrkzog.cn-hangzhou.fcapp.run/";

  function cacheGet(name) {
    try { var v = localStorage.getItem("naming.cache." + name); return v ? JSON.parse(v) : null; }
    catch (_) { return null; }
  }
  function cacheSet(name, data) {
    try { localStorage.setItem("naming.cache." + name, JSON.stringify(data)); } catch (_) {}
  }

  /* 姓名分类：
     "preset"  命中 5 个预设
     "real"    疑似真实姓名（2-4 汉字 / 含空格音译串）→ Worker 生成
     "invalid" 纯数字/乱码/单字/空 → 拦截 */
  function classify(raw) {
    var s = (raw || "").trim();
    if (!s) return "invalid";
    if (PRESET.indexOf(s) >= 0) return "preset";
    // 含空格的拉丁音译串（如 "Elon Musk"）
    if (/^[A-Za-z][A-Za-z\s.]{2,}$/.test(s) && /\s/.test(s)) return "real";
    // 纯汉字 2-4 字
    var han = s.replace(/\s/g, "");
    if (/^[一-龥]{2,4}$/.test(han)) return "real";
    return "invalid";
  }

  // 统一取数：返回 {status:"ok",data} / {status:"blocked"} / {status:"error"} / {status:"invalid"}
  // preset 走本地秒出；其余先查缓存，未命中调 Worker；15s 超时。
  async function fetchName(name) {
    var s = (name || "").trim();
    var kind = classify(s);
    if (kind === "invalid") return { status: "invalid" };
    if (kind === "preset")  return { status: "ok", data: NAMES[s] };

    var cached = cacheGet(s);
    if (cached) return { status: "ok", data: cached };

    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 30000);
    try {
      var resp = await fetch(WORKER_URL + "?name=" + encodeURIComponent(s), { signal: ctrl.signal });
      clearTimeout(timer);
      var out = await resp.json();
      if (out.status === "ok" && out.data) { cacheSet(s, out.data); return { status: "ok", data: out.data }; }
      if (out.status === "blocked") return { status: "blocked" };
      return { status: "error" };
    } catch (e) {
      clearTimeout(timer);
      return { status: "error" };
    }
  }

  root.NAMING_DATA = { PRESET: PRESET, classify: classify, fetchName: fetchName };
})(window);
