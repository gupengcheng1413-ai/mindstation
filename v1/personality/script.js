// 心灵驿站 · 性格认知 — v0.2
// 长条屏 1640×348 单页应用 (menu / profile / quiz / result 四场景)

(() => {

// ---------- DOM 短手 ----------
const $  = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- 状态 ----------
const state = {
  scene: "menu",
  questions: null,
  personalities: null,
  profile: { name: "", relation: "" },
  qIndex: 0,
  answers: [],
  currentType: null,
  relationModalOpen: false,
  pendingRelation: "",
  exitModalOpen: false
};

// ---------- 自适应缩放 ----------
function fitDevice(){
  const dev   = $("#device");
  const stage = $(".stage");
  const vw = (window.visualViewport?.width)  || stage.clientWidth  || window.innerWidth;
  const vh = (window.visualViewport?.height) || stage.clientHeight || window.innerHeight;
  const s  = Math.min(vw / 1640, vh / 348);
  dev.style.setProperty("--device-scale", s);
}
addEventListener("resize", fitDevice);
addEventListener("orientationchange", fitDevice);
window.visualViewport?.addEventListener("resize", fitDevice);

// ---------- 数据加载 ----------
async function loadData(){
  const [q, p] = await Promise.all([
    fetch("data/questions.json").then(r => r.json()),
    fetch("data/personalities.json").then(r => r.json())
  ]);
  state.questions = q;
  state.personalities = p;
}

// ---------- 场景切换 ----------
function setScene(name){
  if(state.scene === name) return;
  const cur = $(`.scene[data-scene="${state.scene}"]`);
  const nxt = $(`.scene[data-scene="${name}"]`);
  if(!nxt) return;
  state.scene = name;
  document.body.dataset.state = name;

  if(cur && !cur.hidden){
    cur.classList.add("is-leaving");
    setTimeout(() => {
      cur.hidden = true;
      cur.classList.remove("is-leaving");
    }, 180);
  }
  setTimeout(() => {
    nxt.hidden = false;
    nxt.classList.remove("is-entering");
    void nxt.offsetWidth;
    nxt.classList.add("is-entering");
    onSceneEnter(name);
  }, cur && !cur.hidden ? 160 : 0);
}

function onSceneEnter(name){
  if(name === "profile") renderProfile();
  if(name === "quiz")    renderQuestion();
  if(name === "result")  renderResult(state.currentType);
}

// ---------- 计分核心 ----------
function score(answers, questions){
  const tally = { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0 };
  questions.questions.forEach((q, i) => {
    const ans = answers[i];
    if(!ans) return;
    const axis = questions.axes.find(a => a.id === q.axis);
    let idx = ans === "a" ? 0 : 1;
    if(q.reversed) idx = 1 - idx;
    tally[axis.poles[idx]]++;
  });
  const tieRight = { EI:"I", SN:"N", TF:"F", JP:"P" };
  const type = questions.axes.map(ax => {
    const [l, r] = ax.poles;
    if(tally[l] === tally[r]) return tieRight[ax.id];
    return tally[l] > tally[r] ? l : r;
  }).join("");
  return { type, tally };
}
window._mbtiScore = score;

// ---------- toast ----------
let toastTimer = null;
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 2200);
}

// ---------- profile 渲染 ----------
function renderProfile(){
  const nameInput = $("#pfName");
  const nameRow   = $("#pfNameRow");
  const relVal    = $("#pfRelationVal");
  const nextBtn   = $("#pfNext");
  if(nameInput && nameInput.value !== state.profile.name) nameInput.value = state.profile.name;
  if(nameRow) nameRow.classList.toggle("is-typed", !!state.profile.name);
  if(relVal){
    relVal.textContent = state.profile.relation || "未选择";
    relVal.classList.toggle("is-on", !!state.profile.relation);
  }
  const ready = !!state.profile.name && !!state.profile.relation;
  if(nextBtn){
    nextBtn.disabled = !ready;
    nextBtn.classList.toggle("is-on", ready);
  }
  // 弹层 chip 按 pendingRelation 高亮(进弹层后所有切换都靠 pending)
  $$(".pm-chip").forEach(chip => {
    chip.classList.toggle("is-on", chip.dataset.rel === state.pendingRelation);
  });
  // 确定按钮:有 pending 就高亮可点击,无则灰态
  const confirmBtn = $("#pmConfirm");
  if(confirmBtn) confirmBtn.classList.toggle("is-on", !!state.pendingRelation);
}

function openRelationModal(){
  state.relationModalOpen = true;
  state.pendingRelation = state.profile.relation || "";
  const m = $("#profileModal");
  if(m) m.hidden = false;
  renderProfile();
}
function closeRelationModal(commit){
  if(commit){
    state.profile.relation = state.pendingRelation || state.profile.relation;
  }
  state.relationModalOpen = false;
  state.pendingRelation = "";
  const m = $("#profileModal");
  if(m) m.hidden = true;
  renderProfile();
}

// ---------- quiz 渲染 ----------
function renderQuestion(){
  const list = state.questions.questions;
  const q = list[state.qIndex];
  if(!q){
    const { type } = score(state.answers, state.questions);
    state.currentType = type;
    return setScene("result");
  }
  $("#qIdx").textContent = state.qIndex + 1;
  $("#qTotal").textContent = `/${list.length}`;
  $("#qBarFill").style.width = `${(state.qIndex / list.length) * 100}%`;
  $("#qStem").textContent = q.q;
  $("#qOptATxt").textContent = q.a;
  $("#qOptBTxt").textContent = q.b;

  // 还原选项的高亮(若已答过该题)
  $("#qOptA").classList.toggle("is-picked", state.answers[state.qIndex] === "a");
  $("#qOptB").classList.toggle("is-picked", state.answers[state.qIndex] === "b");

  // 上/下一题按钮启用态
  $("#qPrev").disabled = state.qIndex === 0;
  $("#qNext").disabled = !state.answers[state.qIndex];
}

function pickOption(opt){
  if(state.exitModalOpen) return;
  state.answers[state.qIndex] = opt;
  $("#qOptA").classList.toggle("is-picked", opt === "a");
  $("#qOptB").classList.toggle("is-picked", opt === "b");
  $("#qNext").disabled = false;
  setTimeout(() => {
    state.qIndex++;
    $("#qBarFill").style.width = `${(state.qIndex / state.questions.questions.length) * 100}%`;
    renderQuestion();
  }, 220);
}

function gotoPrev(){
  if(state.qIndex === 0) return;
  state.qIndex--;
  $("#qBarFill").style.width = `${(state.qIndex / state.questions.questions.length) * 100}%`;
  renderQuestion();
}
function gotoNext(){
  if(!state.answers[state.qIndex]) return;
  state.qIndex++;
  $("#qBarFill").style.width = `${(state.qIndex / state.questions.questions.length) * 100}%`;
  renderQuestion();
}

function openExitModal(){
  state.exitModalOpen = true;
  const m = $("#quizExit");
  if(m) m.hidden = false;
}
function closeExitModal(){
  state.exitModalOpen = false;
  const m = $("#quizExit");
  if(m) m.hidden = true;
}
function confirmExit(){
  closeExitModal();
  state.qIndex = 0;
  state.answers = [];
  setScene("menu");
}

// ---------- result 渲染 — 像素级对齐 Figma 4654:807(1640×1954) ----------
function renderResult(type){
  const data = state.personalities.personalities[type];
  const groups = state.personalities.groups;
  const inner = $("#rPageInner");
  if(!inner) return;

  const codename  = data?.codename || "";
  const subtitle  = data?.subtitle || data?.tagline || "";
  // banner 副标题 Figma 134/229 双行;按中文标点拆 2 行
  const subParts = (subtitle || "").split(/\s+|[,，]/).filter(Boolean);
  const subL1 = subParts[0] || "";
  const subL2 = subParts.slice(1).join("") || "";

  // 4 个轴 — Figma 顺序:能量来源(EI) / 接受信息(SN) / 决策方式(TF) / 行事风格(JP)
  // 每个卡按 Figma 精确坐标:卡身 / dot / 金天线 / 标题 / pole-top / pole-bot / knob track
  const axes = [
    { id:"EI", title:"能量来源", topLabel:"I内倾", botLabel:"E外倾",
      cardX:565.8, dotX:582.8, antX:553, antW:40.8, antH:35.2, antFlip:false,
      labelX:583.8, titleX:583.8,
      poleTopX:598.8, poleTopY:161, poleBotX:594.8, poleBotY:293,
      trackX:620.8, trackY:202 },
    { id:"SN", title:"接受信息", topLabel:"N直觉", botLabel:"S感觉",
      cardX:720, dotX:738, antX:782.3, antW:45.3, antH:40.6, antFlip:false,
      labelX:738, titleX:738,
      poleTopX:745, poleTopY:161, poleBotX:747, poleBotY:293,
      trackX:775, trackY:202 },
    { id:"TF", title:"决策方式", topLabel:"F情感", botLabel:"T思维",
      cardX:874, dotX:892, antX:936.3, antW:45.3, antH:40.6, antFlip:true,
      labelX:892, titleX:892,
      poleTopX:901, poleTopY:161, poleBotX:901, poleBotY:294,
      trackX:929, trackY:202 },
    { id:"JP", title:"行事风格", topLabel:"P感知", botLabel:"J判断",
      cardX:1026.8, dotX:1044.8, antX:1014, antW:40.8, antH:35.2, antFlip:true,
      labelX:1044.8, titleX:1044.8,
      poleTopX:1055, poleTopY:158, poleBotX:1057, poleBotY:291,
      trackX:1084, trackY:199 }
  ];

  const axesHTML = axes.map((ax, i) => {
    const myPole = type[i];                              // E/I, S/N, T/F, J/P
    // 注意 axes 数组里 topLabel 与 botLabel:Figma 设计稿里 EI/SN 两卡是 I/N 在上,E/S 在下;TF/JP 两卡是 F/P 在上,T/J 在下
    // 当前 type 与 topLabel 同字母 → top 高亮(active);否则 bot 高亮
    const topActive = myPole === ax.topLabel[0];
    return `
      <div class="rp-axis" data-axis="${ax.id}">
        <!-- 卡身 140×295 r=17 #fff shadow -->
        <div class="rp-axis-card" style="left:${ax.cardX}px"></div>
        <!-- 标题 26/46 Bold #000 -->
        <h4 class="rp-axis-title" style="left:${ax.titleX}px;top:97px">${ax.title}</h4>
        <!-- pole top: 选中态色,带 ▸(箭头由 CSS mask 渲染,跟随 currentColor) -->
        <span class="rp-axis-pole rp-axis-pole-top ${topActive?'is-on':''}" style="left:${ax.poleTopX}px;top:${ax.poleTopY}px">
          ${ax.topLabel}
          <span class="rp-pole-arrow"></span>
        </span>
        <!-- 滑轨 + knob,由 axis-knob.svg 提供轨身,knob 透过 .is-top/.is-bot 切换上下半 -->
        <div class="rp-axis-track ${topActive?'is-top':'is-bot'}" style="left:${ax.trackX}px;top:${ax.trackY}px"></div>
        <!-- pole bot -->
        <span class="rp-axis-pole rp-axis-pole-bot ${topActive?'':'is-on'}" style="left:${ax.poleBotX}px;top:${ax.poleBotY}px">
          ${ax.botLabel}
          <span class="rp-pole-arrow"></span>
        </span>
      </div>
    `;
  }).join("");


  // study 4 卡 — Figma 各自坐标
  const studyCards = data?.study?.cards || [];
  const studyPos = [
    {x:135, y:972,  numW:561, w:599},   // #1
    {x:827, y:972,  numW:561, w:599},   // #2
    {x:135, y:1189, numW:525, w:599},   // #3
    {x:827, y:1189, numW:525, w:608}    // #4
  ];
  const studyHTML = studyCards.slice(0,4).map((c, i) => {
    const p = studyPos[i] || studyPos[0];
    const m = (c.title || "").match(/^(\d+)\s*(.+)$/);
    const num = m ? m[1] : (i+1);
    const rest = m ? m[2] : c.title;
    return `
      <div class="rp-study-card" style="left:${p.x}px;top:${p.y}px"></div>
      <h4 class="rp-study-title" style="left:${p.x+(i===0?59:i===1?59:77)}px;top:${p.y+(i===0?21:16)}px;width:${i<2?561:525}px">${num} ${rest}</h4>
      <p class="rp-study-body" style="left:${p.x+40}px;top:${p.y+70}px;width:${p.w}px">${c.body || ""}</p>
    `;
  }).join("");

  // tags Figma 4654:904 文本带 5 项,中间用 3×33 黑色分隔线
  const tags = data?.study?.tags || [];

  inner.innerHTML = `
    <!-- 顶栏 -->
    <button type="button" class="rp-back" id="rpBack" aria-label="返回">
      <img src="assets/result/back.svg" alt="" draggable="false">
    </button>
    <p class="rp-top-label">你的测试结果是:</p>
    <p class="rp-top-self">${state.profile.name || "自己"}</p>
    <span class="rp-top-arrow">
      <svg viewBox="0 0 28 22" width="28" height="22"><path d="M2 6 L14 18 L26 6" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </span>

    <!-- ===== Banner 区 (75-362) ===== -->
    <div class="rp-banner-bg"></div>
    <div class="rp-banner-stripes"></div>
    <img class="rp-mascot" src="assets/result/mascot.png" alt="" draggable="false">
    <div class="rp-banner-frame"></div>

    <!-- type 大字 -->
    <p class="rp-type">${type.toLowerCase()}</p>
    <img class="rp-type-deco" src="assets/result/type-deco.svg" alt="" draggable="false">

    <!-- 副标题 -->
    <div class="rp-subtitle">
      <p>${subL1}</p>
      ${subL2 ? `<p>${subL2}。</p>` : ""}
    </div>

    <!-- 4 轴 -->
    ${axesHTML}

    <!-- 蛋蛋 star + 标签 -->
    <div class="rp-star ${type[0]==='I'?'is-i-person':'is-e-person'}">
      <span class="rp-star-text">${eggLabel(type)}</span>
    </div>

    <!-- 重新测试 CTA(整图含字) -->
    <button type="button" class="rp-retest" id="rpRetest" aria-label="重新测试"></button>

    <!-- divider 1 -->
    <span class="rp-divider" style="top:361px"></span>

    <!-- ===== 性格特点 (362-852) ===== -->
    <div class="rp-trait-bg"></div>
    <div class="rp-section-tag" style="top:381px"></div>
    <h3 class="rp-section-title" style="top:390px">性格特点</h3>
    <p class="rp-trait-text">${data?.personality || (type + " · " + codename + " 的性格特点正在路上 ✦")}</p>

    <!-- divider 2 -->
    <span class="rp-divider" style="top:852px"></span>

    <!-- ===== 学习优势分析 (853-1443) ===== -->
    <div class="rp-study-bg"></div>
    <div class="rp-section-tag" style="top:872px"></div>
    <h3 class="rp-section-title" style="top:881px;left:153px;width:236px">学习优势分析</h3>
    ${studyHTML}

    <!-- 高效学习方式 标签行 -->
    <p class="rp-study-tag-label" style="top:1493px">
      <span class="rp-emoji">🎓</span><span class="rp-purple">高效学习方式:</span>
    </p>
    <div class="rp-study-tags">
      ${tags.map((t,i)=>`<span class="rp-tag-item">${t}</span>${i<tags.length-1?'<span class="rp-tag-sep"></span>':''}`).join("")}
    </div>

    <!-- divider 3 -->
    <span class="rp-divider" style="top:1446px"></span>

    <!-- ===== 校园相处锦囊 (1573-1850) ===== -->
    <div class="rp-social-bg-top"></div>
    <div class="rp-social-bg-bot"></div>
    <span class="rp-social-bar"></span>
    <span class="rp-social-dot rp-dot-1"></span>
    <span class="rp-social-dot rp-dot-2"></span>
    <span class="rp-social-dot rp-dot-3"></span>
    <span class="rp-social-dot rp-dot-4"></span>
    <div class="rp-section-tag" style="top:1675px"></div>
    <h3 class="rp-section-title" style="top:1684px;left:162px;width:311px">校园相处锦囊</h3>
    <p class="rp-social-tip">${data?.social?.tip || "暂无相处锦囊"}</p>
  `;

  $("#rpBack")?.addEventListener("click", () => {
    if(window.parent !== window) window.parent.postMessage({ type:"personality-back" }, "*");
    else setScene("menu");
  });
  $("#rpRetest")?.addEventListener("click", () => {
    state.qIndex = 0;
    state.answers = [];
    setScene("profile");
  });

  const page = $("#rPage");
  if(page) page.scrollTop = 0;
  const tip = $("#rScrollTip");
  page?.addEventListener("scroll", () => {
    tip?.classList.toggle("is-hidden", page.scrollTop > 60);
  }, { passive:true });
}

function eggLabel(type){
  const e = type[0];
  const map = { E:"e人", I:"i人" };
  return map[e] || "蛋";
}

function findGroup(type, groups){
  for(const k in groups){
    if(groups[k].members.includes(type)) return k;
  }
  return "analysts";
}

function lighten(hex){
  const v = hex.replace("#","");
  const r = Math.min(255, parseInt(v.slice(0,2),16) + 40);
  const g = Math.min(255, parseInt(v.slice(2,4),16) + 40);
  const b = Math.min(255, parseInt(v.slice(4,6),16) + 40);
  return `rgb(${r},${g},${b})`;
}

// ---------- 事件绑定 ----------
function bindEvents(){
  // menu
  $("#menuBack")?.addEventListener("click", () => {
    // 主壳里返回首页(parent),独立页面下回 history
    if(window.parent !== window) window.parent.postMessage({ type:"personality-back" }, "*");
    else history.length > 1 ? history.back() : null;
  });
  $("#menuHelp")?.addEventListener("click", () => toast("帮助说明 — 即将上线"));
  $("#ctaStart")?.addEventListener("click", () => setScene("profile"));
  $("#ctaPick")?.addEventListener("click", () => toast("「直接选 MBTI」 — 即将上线"));

  // profile
  $("#profileBack")?.addEventListener("click", () => setScene("menu"));
  $("#pfName")?.addEventListener("input", (e) => {
    let v = e.target.value;
    // 限制 1-6 字(中英文 + 数字),maxlength 已限 6
    if(v.length > 6) v = v.slice(0,6);
    state.profile.name = v;
    e.target.value = v;
    renderProfile();
  });
  $("#pfRelation")?.addEventListener("click", () => openRelationModal());
  $("#pfNext")?.addEventListener("click", () => {
    if(!state.profile.name || !state.profile.relation) return;
    state.qIndex = 0;
    state.answers = [];
    setScene("quiz");
  });

  // 关系弹层
  $("#pmChips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".pm-chip");
    if(!chip) return;
    state.pendingRelation = chip.dataset.rel;
    renderProfile();
  });
  $("#pmConfirm")?.addEventListener("click", () => {
    if(!state.pendingRelation) return;
    closeRelationModal(true);
  });

  // quiz
  $("#quizBack")?.addEventListener("click", () => {
    if(state.qIndex > 0 || state.answers.some(Boolean)) openExitModal();
    else setScene("menu");
  });
  $("#qOptA")?.addEventListener("click", () => pickOption("a"));
  $("#qOptB")?.addEventListener("click", () => pickOption("b"));
  $("#qPrev")?.addEventListener("click", () => gotoPrev());
  $("#qNext")?.addEventListener("click", () => gotoNext());

  // 退出确认弹层
  $("#qeCancel")?.addEventListener("click", () => confirmExit());
  $("#qeConfirm")?.addEventListener("click", () => closeExitModal());

  // result
  $("#resultBack")?.addEventListener("click", () => setScene("menu"));

  // 键盘
  addEventListener("keydown", (e) => {
    if(state.scene === "profile"){
      if(state.relationModalOpen){
        if(e.key === "Escape") closeRelationModal();
        return;
      }
      if(e.key === "Escape") setScene("menu");
      if(e.key === "Enter" && state.profile.name && state.profile.relation){
        state.qIndex = 0;
        state.answers = [];
        setScene("quiz");
      }
      return;
    }
    if(state.scene === "quiz"){
      if(state.exitModalOpen){
        if(e.key === "Escape") closeExitModal();
        return;
      }
      if(e.key === "Escape"){
        if(state.qIndex > 0 || state.answers.some(Boolean)) openExitModal();
        else setScene("menu");
        return;
      }
      if(e.key === "1" || e.key === "a" || e.key === "A") pickOption("a");
      if(e.key === "2" || e.key === "b" || e.key === "B") pickOption("b");
      if(e.key === "ArrowLeft")  gotoPrev();
      if(e.key === "ArrowRight") gotoNext();
      return;
    }
    if(state.scene === "result"){
      const page = $("#rPage");
      if(!page) return;
      if(e.key === "ArrowDown" || e.key === "PageDown") page.scrollBy({ top:  300, behavior:"smooth" });
      if(e.key === "ArrowUp"   || e.key === "PageUp")   page.scrollBy({ top: -300, behavior:"smooth" });
      if(e.key === "Home") page.scrollTo({ top:0,   behavior:"smooth" });
      if(e.key === "End")  page.scrollTo({ top:9999,behavior:"smooth" });
    }
  });
}

// ---------- 启动 ----------
async function boot(){
  fitDevice();
  await loadData();
  bindEvents();

  const hash = (location.hash || "").replace("#","").split("?")[0];
  const params = new URLSearchParams(location.hash.split("?")[1] || "");
  if(hash === "profile"){
    setScene("profile");
  }else if(hash === "quiz"){
    state.profile.name = state.profile.name || "测试";
    state.profile.relation = state.profile.relation || "自己";
    setScene("quiz");
  }else if(hash === "result"){
    state.currentType = (params.get("type") || "INTP").toUpperCase();
    setScene("result");
  }else{
    onSceneEnter("menu");
  }
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", boot, { once:true });
}else{
  boot();
}

})();
