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

  // 缓存版本号：修改样式或数据结构后递增，自动清除旧缓存
  var CACHE_VERSION = 2;

  function cacheGet(name) {
    try {
      var v = localStorage.getItem("naming.cache." + name);
      if (!v) return null;
      var cached = JSON.parse(v);
      // 检查版本号，旧版本缓存自动失效
      if (!cached._v || cached._v < CACHE_VERSION) {
        localStorage.removeItem("naming.cache." + name);
        return null;
      }
      return cached;
    } catch (_) { return null; }
  }
  function cacheSet(name, data) {
    try {
      // 写入时打上版本号
      data._v = CACHE_VERSION;
      localStorage.setItem("naming.cache." + name, JSON.stringify(data));
    } catch (_) {}
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

  // 单段取数：part="hero"|"core"|"culture"|"extra"。返回 {status:"ok",data}/{status:"blocked"}/{status:"error"}
  async function callPart(s, part) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 45000);
    try {
      var resp = await fetch(WORKER_URL + "?name=" + encodeURIComponent(s) + "&part=" + part, { signal: ctrl.signal });
      clearTimeout(timer);
      var out = await resp.json();
      if (out.status === "ok" && out.data) return { status: "ok", data: out.data };
      if (out.status === "blocked") return { status: "blocked" };
      return { status: "error" };
    } catch (e) {
      clearTimeout(timer);
      return { status: "error" };
    }
  }

  // 新四段式 API：hero（首屏，含判定）
  async function fetchHero(name) {
    var s = (name || "").trim();
    var kind = classify(s);
    if (kind === "invalid") return { status: "invalid" };
    if (kind === "preset")  return { status: "ok", data: NAMES[s], full: true }; // preset 直接返回完整数据

    var cached = cacheGet(s);
    if (cached) return { status: "ok", data: cached, full: true }; // 缓存命中，返回完整数据

    var r = await callPart(s, "hero");
    return { status: r.status, data: r.data, full: false };
  }

  // 新四段式 API：core（核心详情）
  async function fetchCoreDetail(name, heroData) {
    var s = (name || "").trim();
    var r = await callPart(s, "core");
    if (r.status === "ok" && r.data) {
      var merged = Object.assign({}, heroData, r.data);
      return { status: "ok", data: merged };
    }
    return { status: "error" };
  }

  // 新四段式 API：culture（姓氏文化）
  async function fetchCulture(name, prevData) {
    var s = (name || "").trim();
    var r = await callPart(s, "culture");
    if (r.status === "ok" && r.data) {
      var merged = Object.assign({}, prevData, r.data);
      return { status: "ok", data: merged };
    }
    return { status: "error" };
  }

  // 新四段式 API：extra（外围补充）
  async function fetchExtraFinal(name, prevData) {
    var s = (name || "").trim();
    var r = await callPart(s, "extra");
    if (r.status === "ok" && r.data) {
      var merged = Object.assign({}, prevData, r.data);
      cacheSet(s, merged); // 只有在全部完成后才写缓存
      return { status: "ok", data: merged };
    }
    return { status: "error" };
  }

  // 旧两段式 API：第一段核心模块（含判定）。preset/完整缓存命中则直接返回 {full:true} 标记，调用方跳过第二段。
  // 返回 {status, data, full?}：full=true 表示 data 已是完整页（无需再取 extra）。
  async function fetchCore(name) {
    var s = (name || "").trim();
    var kind = classify(s);
    if (kind === "invalid") return { status: "invalid" };
    if (kind === "preset")  return { status: "ok", data: NAMES[s], full: true };

    var cached = cacheGet(s);
    if (cached) return { status: "ok", data: cached, full: true };

    var r = await callPart(s, "core");
    return { status: r.status, data: r.data, full: false };
  }

  // 旧两段式 API：第二段外围模块。成功则与 core 合并、写完整缓存，返回合并后的完整 data。
  // 返回 {status:"ok",data} 或 {status:"error"}（外围失败不阻断，结果页保留核心）。
  async function fetchExtra(name, coreData) {
    var s = (name || "").trim();
    var r = await callPart(s, "extra");
    if (r.status === "ok" && r.data) {
      // core 字段权威：合并时 core 覆盖 extra（防 extra 误吐核心字段）
      var merged = Object.assign({}, r.data, coreData);
      cacheSet(s, merged);
      return { status: "ok", data: merged };
    }
    return { status: "error" };
  }

  // 兼容旧入口：完整单请求（preset/缓存优先），仅供不分段的调用点使用
  async function fetchName(name) {
    var s = (name || "").trim();
    var kind = classify(s);
    if (kind === "invalid") return { status: "invalid" };
    if (kind === "preset")  return { status: "ok", data: NAMES[s] };
    var cached = cacheGet(s);
    if (cached) return { status: "ok", data: cached };
    var r = await callPart(s, "core");
    return r;
  }

  root.NAMING_DATA = {
    PRESET: PRESET,
    classify: classify,
    fetchName: fetchName,
    fetchCore: fetchCore,
    fetchExtra: fetchExtra,
    // 新四段式 API
    fetchHero: fetchHero,
    fetchCoreDetail: fetchCoreDetail,
    fetchCulture: fetchCulture,
    fetchExtraFinal: fetchExtraFinal
  };
})(window);
