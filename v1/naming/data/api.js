/* ============================================================
   姓名寓意 · 数据接口层 — 兜底模板 + fetchName()
   这是结果页与"内容源"之间的唯一边界：
   现在内容源是本地 NAMES；后续把 fetchName 换成
     return await (await fetch('/api/naming?name='+name)).json()
   即可接入大模型，结果页 DOM/CSS / 渲染器都无需改动。
   ============================================================ */
(function (root) {
  "use strict";
  var NAMES = root.NAMES || (root.NAMES = {});

  /* 预设名（命中即出对应详情页） */
  var PRESET = ["雷军", "刘庆升", "吴玉胜", "乔布斯", "埃隆马斯克"];

  /* 兜底模板：疑似真实姓名但非预设时使用，结构与中文模板一致，
     文案为通用占位，明确标注"示例/待 AI 生成"，保证流程不断。 */
  function buildFallback(name) {
    var chars = name.split("").slice(0, 4).map(function (c) {
      return { ch: c, py: "" };
    });
    return {
      template: "cn",
      isFallback: true,
      chars: chars,
      hero: {
        big: name + " · 寓意解读",
        desc: "正在为「" + name + "」生成专属解读，以下为示例结构，完整内容将由 AI 补全。",
        tones: [["待", "生"], ["成", "中"]]
      },
      poem: { lines: ["嵌字诗待 AI 生成", "暂以示例占位呈现"] },
      analysis: chars.map(function (c) {
        return {
          seal: c.ch, q: "字义解析生成中", from: "示例占位",
          benyi: "本义", benyiSub: "待补全", yinshen: "引申", yinshenSub: "待补全"
        };
      }),
      blessing: "「" + name + "」的祝愿文案将由 AI 依据字义自动生成，这里先用示例占位。",
      surname: { sub: "姓氏故事 · 示例", body: "「" + name.charAt(0) + "」姓的源流与名人故事将在接入大模型后自动补全。" },
      rhythm: { sub: "音律分析生成中", items: chars.map(function (c) { return { py: "", tn: "—" }; }) },
      people: [],
      english: [],
      fact: "更多关于「" + name + "」的冷知识，接入 AI 后即可实时生成。"
    };
  }

  /* 姓名分类：
     "preset"  命中 5 个预设
     "real"    疑似真实姓名（2-4 汉字 / 含空格音译串）→ 兜底
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

  /* 统一取数接口：preset/real 返回数据对象，invalid 返回 null */
  // TODO: 接 LLM API —— 把下面整段替换为远程请求即可，调用方 await fetchName(name)
  function fetchName(name) {
    var s = (name || "").trim();
    var kind = classify(s);
    if (kind === "invalid") return Promise.resolve(null);
    if (kind === "preset") return Promise.resolve(NAMES[s]);
    return Promise.resolve(buildFallback(s)); // real → 兜底
  }

  root.NAMING_DATA = { PRESET: PRESET, classify: classify, fetchName: fetchName };
})(window);
