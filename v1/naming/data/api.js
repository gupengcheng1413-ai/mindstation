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

  /* 姓名分类（前端只拦"明显垃圾"，是不是真名交后端 DeepSeek 判）：
     "preset"  命中 5 个预设
     "real"    其余一律放行给 Worker（含长译名、间隔号、生僻字、少数民族名）
     "invalid" 仅拦：空 / 单字 / 纯数字 / 纯标点 / 纯英文乱码无空格 */
  function classify(raw) {
    var s = (raw || "").trim();
    if (!s) return "invalid";
    if (PRESET.indexOf(s) >= 0) return "preset";
    var core = s.replace(/[\s·•・.]/g, ""); // 去空格与各种间隔号后看实体长度
    if (core.length < 2) return "invalid";          // 空或单字
    if (/^\d+$/.test(core)) return "invalid";        // 纯数字
    if (/^[^一-鿿A-Za-z]+$/.test(core)) return "invalid"; // 纯标点/符号，无任何汉字或字母
    return "real"; // 其余放行，后端判真假
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
    var timer = setTimeout(function () { ctrl.abort(); }, 45000);
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
