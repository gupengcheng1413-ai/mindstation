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
  let sceneT;
  function setScene(name){
    if(state.scene === name) return;
    const nxt = $(`.scene[data-scene="${name}"]`);
    if(!nxt) return;
    const cur = $(`.scene[data-scene="${state.scene}"]`);
    clearTimeout(sceneT);                 // 取消上一次未完成的过渡，杜绝孤儿定时器竞态
    state.prevScene = state.scene;
    state.scene = name;
    if(cur && cur !== nxt && !cur.hidden) cur.classList.add("is-leaving");
    sceneT = setTimeout(() => {
      // 强制隐藏除目标外的所有场景，防止滞后定时器残留旧场景（如快速 loading→blocked）
      $$(".scene").forEach(s => { if(s !== nxt){ s.hidden = true; s.classList.remove("is-leaving","is-entering"); } });
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

  // invalid → toast 留输入页；其余进 loading 由 fetchName 三状态分流
  function submitName(raw){
    const s = (raw || "").trim();
    if(DATA.classify(s) === "invalid"){ toast("请输入真实姓名"); return; }
    state.currentName = s;
    runLoading(s);
  }

  // ---------- scan 模拟（停留 ~2s 自动识别一个预设名） ----------
  let scanT;
  function runScan(){
    clearTimeout(scanT);
    const pick = "雷军"; // 扫描默认识别为雷军
    scanT = setTimeout(() => {
      if(state.scene !== "scan") return;
      state.currentName = pick;
      runLoading(pick);
    }, 2100);
  }

  // ---------- loading 真实进度 + 文案轮播 + 三状态分流 ----------
  const LOAD_TIPS = ["拆解字义中……", "检索古今典故……", "推敲声律节奏……", "落笔成文……"];
  let loadT, tipT;
  async function runLoading(name){
    setScene("loading");
    const fill = $("#loadFill"), title = $("#loadTitle");
    if(fill) fill.style.width = "0%";
    if(title) title.textContent = LOAD_TIPS[0];
    // 假进度：缓慢爬到 85% 停住，等真实返回再冲满
    let p = 0, ti = 0;
    clearInterval(loadT); clearInterval(tipT);
    loadT = setInterval(() => { p = Math.min(p + Math.random()*6 + 2, 85); if(fill) fill.style.width = p + "%"; }, 240);
    tipT  = setInterval(() => { ti = (ti+1) % LOAD_TIPS.length; if(title) title.textContent = LOAD_TIPS[ti]; }, 1600);

    // 首屏渲染完成后的回调：立即切换到 result 场景
    const onHeroReady = () => {
      clearInterval(loadT); clearInterval(tipT);
      if(fill) fill.style.width = "100%";
      setTimeout(() => {
        setScene("result");
        const sc = $("#resultScroll"); if(sc) sc.scrollTop = 0;
      }, 300);
    };

    const res = await window.__NM_runFourStage(name, onHeroReady);

    // 如果首屏就失败（blocked/error），处理错误
    if(res.status === "blocked"){
      clearInterval(loadT); clearInterval(tipT);
      setScene("blocked");
      return;
    }
    if(res.status !== "ok"){
      clearInterval(loadT); clearInterval(tipT);
      setScene("input");
      toast("生成失败，请重试");
      return;
    }
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
