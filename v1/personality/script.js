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

// ---------- result 渲染 — 单屏纵向滚动版 ----------
function renderResult(type){
  const data = state.personalities.personalities[type];
  const groups = state.personalities.groups;
  const inner = $("#rPageInner");
  if(!inner) return;

  const codename  = data?.codename || "?";
  const tagline   = data?.tagline  || "";
  const subtitle  = data?.subtitle || "";
  const groupKey  = data?.group || findGroup(type, groups);
  const group     = groups[groupKey];
  const groupColor = group?.color || "#7B61FF";

  const axisMap = [
    { id:"EI", l:"E", r:"I", lLabel:"E外倾", rLabel:"I内倾", title:"能量来源" },
    { id:"SN", l:"S", r:"N", lLabel:"S感觉", rLabel:"N直觉", title:"接受信息" },
    { id:"TF", l:"T", r:"F", lLabel:"T思维", rLabel:"F情感", title:"决策方式" },
    { id:"JP", l:"J", r:"P", lLabel:"J判断", rLabel:"P感知", title:"行事风格" }
  ];

  const axesHTML = axisMap.map((ax, i) => {
    const myPole = type[i];
    const onLeft = myPole === ax.l;
    const lOn = onLeft ? "is-on" : "";
    const rOn = onLeft ? "" : "is-on";
    const knobCls = onLeft ? "knob-left" : "knob-right";
    return `
      <div class="rp-axis-card rp-axis-${ax.id}">
        <span class="rp-axis-dot"></span>
        <span class="rp-axis-icon">✦</span>
        <h4 class="rp-axis-title">${ax.title}</h4>
        <div class="rp-axis-pole rp-axis-pole-top ${ax.id === "EI" || ax.id === "SN" ? rOn : (onLeft ? "is-on" : "")}">
          ${ax.id === "EI" || ax.id === "SN" ? ax.rLabel : ax.lLabel}
          <span class="rp-axis-pole-arrow">▸</span>
        </div>
        <div class="rp-axis-track">
          <span class="rp-axis-knob ${knobCls}"></span>
        </div>
        <div class="rp-axis-pole rp-axis-pole-bottom ${ax.id === "EI" || ax.id === "SN" ? lOn : (onLeft ? "" : "is-on")}">
          ${ax.id === "EI" || ax.id === "SN" ? ax.lLabel : ax.rLabel}
          <span class="rp-axis-pole-arrow">▸</span>
        </div>
      </div>
    `;
  }).join("");

  const studyCardsHTML = (data?.study?.cards || []).map((c, i) => {
    const m = (c.title || "").match(/^(\d+)\s*(.+)$/);
    const num = m ? m[1] : (i + 1);
    const rest = m ? m[2] : c.title;
    return `
      <div class="rp-study-card">
        <h4 class="rp-study-card-title"><span class="rp-study-num">${num}</span>${rest}</h4>
        <p class="rp-study-card-body">${c.body || ""}</p>
      </div>
    `;
  }).join("");

  const tagsHTML = (data?.study?.tags || []).map(t =>
    `<span class="rp-study-tag">${t}</span>`
  ).join("");

  const eggGrad = `radial-gradient(circle at 35% 30%,${lighten(groupColor)} 0,${groupColor} 70%)`;

  inner.innerHTML = `
    <div class="rp-top">你的测试结果是:</div>
    <div class="rp-top-self">${state.profile.name || "自己"} <svg width="28" height="22" viewBox="0 0 28 22"><path d="M2 6 L14 18 L26 6" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round"/></svg></div>

    <div class="rp-banner">
      <div class="rp-type">${type.toLowerCase()}</div>
      <div class="rp-subtitle">${subtitle ? subtitle.split(/\s+/).map(s => `<p>${s}。</p>`).join("") : `<p>${tagline}</p>`}</div>

      <div class="rp-axes">${axesHTML}</div>

      <div class="rp-egg-frame">
        <div class="rp-egg-shape" style="background:${eggGrad}"></div>
      </div>
      <div class="rp-tag">
        <div class="rp-tag-star"></div>
        <div class="rp-tag-text">${eggLabel(type)}</div>
      </div>

      <button type="button" class="rp-retest" id="rpRetest">重新测试</button>
    </div>

    <div class="rp-divider rp-divider-1"></div>
    <section class="rp-section rp-section-trait">
      <div class="rp-section-titlebar">
        <h3 class="rp-section-title">性格特点</h3>
      </div>
      <p class="rp-trait-text">${data?.personality || `${type} · ${codename} 的性格特点正在路上 ✦`}</p>
    </section>

    <div class="rp-divider rp-divider-2"></div>
    <section class="rp-section rp-section-study">
      <div class="rp-section-titlebar">
        <h3 class="rp-section-title">学习优势分析</h3>
      </div>
      <div class="rp-study-cards">
        ${studyCardsHTML || `<div class="rp-study-card"><p class="rp-study-card-body">学习卡内容待填</p></div>`}
      </div>
      <div class="rp-study-tags">
        <span class="rp-study-tags-label"><span class="rp-emoji">🎓</span><span class="rp-purple">高效学习方式:</span></span>
        <div class="rp-study-tags-list">${tagsHTML}</div>
      </div>
    </section>

    <div class="rp-divider rp-divider-3"></div>
    <section class="rp-section rp-section-social">
      <div class="rp-social-bg"></div>
      <span class="rp-social-dot rp-social-dot-tl"></span>
      <span class="rp-social-dot rp-social-dot-bl"></span>
      <span class="rp-social-dot rp-social-dot-tr"></span>
      <span class="rp-social-dot rp-social-dot-br"></span>
      <span class="rp-social-bar"></span>
      <div class="rp-social-titlebar">
        <h3 class="rp-section-title">校园相处锦囊</h3>
      </div>
      <p class="rp-social-tip">${data?.social?.tip || "暂无相处锦囊"}</p>
    </section>
  `;

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
