// 心灵驿站 · 姓名寓意 — v1
// 长条屏 1640×348 单页应用
// 场景: input / confirm / scan / loading / blocked / history / result
(() => {
  "use strict";
  const $  = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const DATA = window.NAMING_DATA;

  // 预置历史名（须在 state 初始化前定义，loadHistory 依赖它）
  const SEED_HISTORY = ["雷军", "刘庆升", "吴玉胜", "乔布斯", "埃隆马斯克"];

  // ---------- 状态 ----------
  const state = {
    scene: "input",
    prevScene: "input",     // history 返回用
    entry: "keyboard",      // 进入 confirm 的方式
    currentName: "",
    history: [],            // 见下方 loadHistory()，定义后再赋值（避免 const 暂时性死区）
    pressTimer: null
  };
  state.history = loadHistory();

  // ---------- 自适应缩放（与主壳一致） ----------
  function fitDevice(){
    const dev = $("#device"), stage = $(".stage");
    if(!dev) return;
    const vw = (window.visualViewport?.width)  || stage.clientWidth  || innerWidth;
    const vh = (window.visualViewport?.height) || stage.clientHeight || innerHeight;
    dev.style.setProperty("--device-scale", Math.min(vw/1640, vh/348));
  }
  addEventListener("resize", fitDevice);
  addEventListener("orientationchange", fitDevice);
  window.visualViewport?.addEventListener("resize", fitDevice);

  // ---------- 场景切换 ----------
  function setScene(name){
    if(state.scene === name) return;
    const cur = $(`.scene[data-scene="${state.scene}"]`);
    const nxt = $(`.scene[data-scene="${name}"]`);
    if(!nxt) return;
    state.prevScene = state.scene;
    state.scene = name;
    if(cur && !cur.hidden){
      cur.classList.add("is-leaving");
      setTimeout(() => { cur.hidden = true; cur.classList.remove("is-leaving"); }, 180);
    }
    setTimeout(() => {
      nxt.hidden = false;
      nxt.classList.remove("is-entering"); void nxt.offsetWidth;
      nxt.classList.add("is-entering");
      onSceneEnter(name);
    }, cur && !cur.hidden ? 160 : 0);
  }

  function onSceneEnter(name){
    if(name === "confirm") setTimeout(() => { const i = $("#nameInput"); if(i){ i.focus(); } }, 220);
    if(name === "scan")    runScan();
    if(name === "history") renderHistory();
  }

  // ---------- toast ----------
  let toastT;
  function toast(msg){
    const el = $("#toast"); if(!el) return;
    el.textContent = msg; el.classList.add("is-show");
    clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("is-show"), 1800);
  }

  // ---------- 回主壳首页 ----------
  function backToHome(){
    if(window.parent !== window) window.parent.postMessage({ type: "naming-back" }, "*");
  }

  // ---------- 录入流程 ----------
  function gotoConfirm(clear){
    state.entry = "keyboard";
    const i = $("#nameInput");
    if(i && clear) i.value = "";
    setScene("confirm");
  }

  // 校验并跳转：preset/real → loading→result；invalid → blocked
  function submitName(raw){
    const kind = DATA.classify(raw);
    if(kind === "invalid"){ setScene("blocked"); return; }
    state.currentName = raw.trim();
    runLoading(state.currentName);
  }

  // ---------- scan 模拟（停留 ~2s 自动识别一个预设名） ----------
  let scanT;
  function runScan(){
    clearTimeout(scanT);
    const pick = DATA.PRESET[Math.floor(Date.now() / 1000) % DATA.PRESET.length];
    scanT = setTimeout(() => {
      if(state.scene !== "scan") return;
      state.currentName = pick;
      runLoading(pick);
    }, 2100);
  }

  // ---------- loading 模拟进度 ----------
  let loadT;
  async function runLoading(name){
    setScene("loading");
    const fill = $("#loadFill");
    if(fill) fill.style.width = "0%";
    const data = await DATA.fetchName(name);   // 唯一取数边界（后续可换 LLM）
    let p = 0;
    clearInterval(loadT);
    loadT = setInterval(() => {
      p += Math.random() * 18 + 8;
      if(fill) fill.style.width = Math.min(p, 100) + "%";
      if(p >= 100){
        clearInterval(loadT);
        setTimeout(() => {
          if(!data){ setScene("blocked"); return; }
          pushHistory(name);
          window.__NM_render(data, name);
          setScene("result");
          const sc = $("#resultScroll"); if(sc) sc.scrollTop = 0;
        }, 260);
      }
    }, 230);
  }

  // ============================================================
  //  history 历史记录（本地存储 + 置顶 + 删除）
  // ============================================================
  // 预置历史：5 个预设名始终在「已测姓名」里（已有记录则合并，缺的补上）
  function loadHistory(){
    let list = [];
    try {
      const raw = localStorage.getItem("naming.history");
      if(raw) list = JSON.parse(raw) || [];
    } catch(_) { list = []; }
    // 补齐缺失的预设名（保留用户已测记录与置顶状态）
    const now = Date.now();
    SEED_HISTORY.forEach((name, i) => {
      if(!list.some(h => h && h.name === name)){
        list.push({ name, time: now - i * 60000, top: false });
      }
    });
    return list;
  }
  function saveHistory(){ localStorage.setItem("naming.history", JSON.stringify(state.history)); }

  function pushHistory(name){
    const now = Date.now();
    const ex = state.history.find(h => h.name === name);
    if(ex){ ex.time = now; }
    else { state.history.push({ name, time: now, top: false }); }
    saveHistory();
  }

  function relTime(ts){
    const d = (Date.now() - ts) / 1000;
    if(d < 60) return "刚刚";
    if(d < 3600) return Math.floor(d/60) + " 分钟前";
    if(d < 86400) return Math.floor(d/3600) + " 小时前";
    return Math.floor(d/86400) + " 天前";
  }

  function sortedHistory(){
    return state.history.slice().sort((a,b) =>
      (b.top?1:0)-(a.top?1:0) || b.time-a.time);
  }

  function renderHistory(){
    const list = $("#histList"), empty = $("#histEmpty");
    const items = sortedHistory();
    if(!items.length){ list.innerHTML = ""; empty.hidden = false; return; }
    empty.hidden = true;
    list.innerHTML = items.map(h =>
      `<button type="button" class="hs-card${h.top?" is-top":""}" data-name="${esc(h.name)}">
        <span class="hs-card-name">${esc(h.name)}</span>
        <span class="hs-card-pin">置顶</span>
        <span class="hs-card-time">${relTime(h.time)}</span>
      </button>`).join("");
  }

  function toggleTop(name){
    const h = state.history.find(x => x.name === name);
    if(h){ h.top = !h.top; saveHistory(); renderHistory(); toast(h.top?"已置顶":"已取消置顶"); }
  }

  function esc(s){ return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }

  // ---------- 暴露给 part2 / 事件 ----------
  window.__NM = { state, setScene, toast, backToHome, gotoConfirm, submitName,
    pushHistory, esc, $, $$, fitDevice, toggleTop, renderHistory };
})();
