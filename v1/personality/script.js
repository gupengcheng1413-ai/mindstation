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
  exitModalOpen: false,
  // quiz 进入来源:"profile"=正常流程, "result"=result 页"重新测试"进来
  quizFrom: "profile",
  // profile 完成后落点:"quiz"=开始测试 / "pick"=选择 MBTI
  profileFor: "quiz",
  // pick 选中的人格
  pickedType: null,
  // 档案库 (轻量本地态, 后端化前先 demo 数据)
  archives: [],
  // 当前生效档案 id
  currentArchiveId: null,
  // archive 模式: "switch"=默认切换 / "delete"=删除模式
  archiveMode: "switch",
  // 删除模式下选中的档案 id 集合
  archiveDelIds: [],
  // archive 选中(等待"确定"提交)的目标档案 id
  archivePendingId: null,
  // 从"新建档案"入口进入 → 完成后强制追加新档案, 不覆盖原档案
  forceNewArchive: false,
  // result 页点"新建档案"进 menu 时的上下文快照; 在 menu 点返回可还原并回 result
  newArchiveReturn: null
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
  if(name === "pick")    renderPick();
  if(name === "archive") renderArchive();
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
// 仅刷新姓名行 typed 态 + "下一步"启用态, 不回写 input.value(供中文合成输入安全调用)
function refreshProfileNext(){
  const nameRow = $("#pfNameRow");
  const nextBtn = $("#pfNext");
  if(nameRow) nameRow.classList.toggle("is-typed", !!state.profile.name);
  const ready = !!state.profile.name && !!state.profile.relation;
  if(nextBtn){
    nextBtn.disabled = !ready;
    nextBtn.classList.toggle("is-on", ready);
  }
}
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
    upsertCurrentArchive();
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
  // 新建档案流程未完成 → 回到发起新建的 result
  if(tryReturnToNewArchiveSource()) return;
  // 来源是 result 时回 result, 否则回 menu
  if(state.quizFrom === "result"){
    setScene("result");
  } else {
    setScene("menu");
  }
}

// ---------- result 渲染 — 像素级对齐 Figma 4654:807(1640×1954) ----------
function renderResult(type){
  const data = state.personalities.personalities[type];
  const groups = state.personalities.groups;
  const inner = $("#rPageInner");
  if(!inner) return;

  // 按人格群组给 result 场景打主题色标记(analysts紫/diplomats绿/sentinels蓝/explorers黄)
  const groupKey = findGroup((type || "").toUpperCase(), groups);
  const resultScene = $('.scene[data-scene="result"]');
  if(resultScene){
    resultScene.dataset.group = groupKey || "analysts";
    resultScene.dataset.type = (type || "").toUpperCase();
  }

  const codename  = data?.codename || "";
  const subtitle  = data?.subtitle || data?.tagline || "";
  // banner 副标题 Figma 134/229;分句间空格改为逗号
  const subParts = (subtitle || "").split(/\s+|[,，]/).filter(Boolean);
  const subL1 = subParts.join("，") || "";
  const subL2 = "";

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
        <span class="rp-axis-pole rp-axis-pole-top ${topActive?'is-on':''}" data-pole="${ax.topLabel[0]}" style="left:${ax.poleTopX}px;top:${ax.poleTopY}px">
          ${ax.topLabel}
          <span class="rp-pole-arrow"></span>
        </span>
        <!-- 滑轨 + knob,由 axis-knob.svg 提供轨身,knob 透过 .is-top/.is-bot 切换上下半 -->
        <div class="rp-axis-track ${topActive?'is-top':'is-bot'}" style="left:${ax.trackX}px;top:${ax.trackY}px"></div>
        <!-- pole bot -->
        <span class="rp-axis-pole rp-axis-pole-bot ${topActive?'':'is-on'}" data-pole="${ax.botLabel[0]}" style="left:${ax.poleBotX}px;top:${ax.poleBotY}px">
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
    <p class="rp-top-label">你的MBTI是:${typeCN(type)}</p>
    <div class="rp-top-chips">
      <button type="button" class="rp-top-switch" id="rpTopSwitch" aria-label="切换档案">
        <span class="rp-top-self">${state.profile.name || "自己"}</span>
        <span class="rp-top-arrow">
          <img class="rp-arrow-up" src="assets/result/switch-arrow.svg" alt="" draggable="false">
          <img class="rp-arrow-dn" src="assets/result/switch-arrow.svg" alt="" draggable="false">
        </span>
      </button>
      <button type="button" class="rp-top-new" id="rpTopNew">
        <span class="rp-top-new-text">新建档案</span>
        <span class="rp-top-new-plus"><img src="assets/result/new-plus.svg" alt="" draggable="false"></span>
      </button>
    </div>

    <!-- ===== Banner 区 (75-362) ===== -->
    <div class="rp-banner-bg"></div>
    <div class="rp-banner-stripes"></div>
    <div class="rp-banner-frame"></div>
    <img class="rp-mascot" src="assets/result/ip/ip_${type.toLowerCase()}.png" alt="" draggable="false">

    <!-- type 大字 -->
    <p class="rp-type">${type.toLowerCase()}</p>
    <!-- codename 下方装饰花纹 — Figma Group 264, 每群组一张配色 (348/151.6 170×34.4) -->
    <img class="rp-type-deco" src="assets/result/deco/deco-${groupKey || "analysts"}.svg" alt="" draggable="false">
    <!-- codename(非正式名)— Figma 切图 PNG(浪漫体字形), 失败回退文字 -->
    <img class="rp-codename-img" src="assets/result/codename/cn_${type.toLowerCase()}.png" alt="${codename}" draggable="false"
         onerror="this.onerror=null;this.outerHTML='<p class=\\'rp-codename\\' style=\\'font-size:${(codename||"").length>=4?48:54}px\\'>${codename}</p>'">

    <!-- 副标题 -->
    <div class="rp-subtitle">
      <p>${subL1}</p>
      ${subL2 ? `<p>${subL2}。</p>` : ""}
    </div>

    <!-- 4 轴 -->
    ${axesHTML}

    <!-- 蛋蛋 star + 标签 -->
    <div class="rp-star">
      <img src="assets/result/star.svg" alt="" draggable="false">
      <span class="rp-star-text">${eggLabel(type)}</span>
    </div>

    <!-- 重新测试 CTA — Figma 4663:1026/1027 -->
    <button type="button" class="rp-retest" id="rpRetest">重新测试</button>

    <!-- divider 1 -->
    <span class="rp-divider rp-divider-v90" style="top:361px"></span>

    <!-- ===== 性格特点 (362-852) ===== -->
    <div class="rp-trait-bg"></div>
    <div class="rp-section-tag rp-tag-trait" style="top:381px"></div>
    <h3 class="rp-section-title" style="top:390px;left:157px;width:197px">性格特点</h3>
    <p class="rp-trait-text">${data?.personality || (type + " · " + codename + " 的性格特点正在路上 ✦")}</p>

    <!-- divider 2 -->
    <span class="rp-divider" style="top:852px"></span>

    <!-- ===== 学习优势分析 (853-1443) ===== -->
    <div class="rp-study-bg" style="top:853px"></div>
    <div class="rp-section-tag rp-tag-study" style="top:872px"></div>
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
    <span class="rp-divider" style="top:1443px"></span>

    <!-- ===== 校园相处锦囊 (1573-1850) ===== -->
    <div class="rp-social-bg-top" style="top:1444px"></div>
    <div class="rp-social-bg-bot" style="top:1641px"></div>
    <span class="rp-social-bar" style="top:1573px"></span>
    <span class="rp-social-bar-line" style="top:1609px"></span>
    <span class="rp-social-bar-right" style="top:1573px"></span>
    <span class="rp-social-dot rp-dot-1"></span>
    <span class="rp-social-dot rp-dot-2"></span>
    <span class="rp-social-dot rp-dot-3"></span>
    <span class="rp-social-dot rp-dot-4"></span>
    <div class="rp-section-tag rp-tag-social" style="top:1675px"></div>
    <h3 class="rp-section-title" style="top:1684px;left:162px;width:311px">校园相处锦囊</h3>
    <p class="rp-social-tip">${data?.social?.tip || "暂无相处锦囊"}</p>
  `;

  $("#rpBack")?.addEventListener("click", () => {
    if(window.parent !== window) window.parent.postMessage({ type:"personality-back" }, "*");
    else setScene("menu");
  });
  $("#rpRetest")?.addEventListener("click", () => {
    // 直接进入答题页(profile 已填,不需要重填)
    state.qIndex = 0;
    state.answers = [];
    state.quizFrom = "result";
    setScene("quiz");
  });
  $("#rpTopSwitch")?.addEventListener("click", () => openArchive());
  $("#rpTopNew")?.addEventListener("click", () => startNewArchive());

  // 8 个 pole 标签点击 → 弹出对应解读
  inner.querySelectorAll(".rp-axis-pole").forEach(pole => {
    pole.style.cursor = "pointer";
    pole.addEventListener("click", () => {
      const letter = pole.dataset.pole;
      if(letter) openPoleDetail(letter);
    });
  });

  const page = $("#rPage");
  if(page) page.scrollTop = 0;
  const tip = $("#rScrollTip");
  page?.addEventListener("scroll", () => {
    tip?.classList.toggle("is-hidden", page.scrollTop > 60);
  }, { passive:true });

  // ----- trait 段高度自适应 -----
  // 背景底缘始终贴合文字底缘(留 21px padding), 文案长则整段变高、短则变矮;
  // 后续 study/social 段随 shift(可正可负)联动平移, 消除固定 852 高造成的多余空白。
  requestAnimationFrame(() => {
    const traitText = inner.querySelector(".rp-trait-text");
    if(!traitText) return;
    const textBottom = traitText.offsetTop + traitText.offsetHeight;
    const baseTop = 362;
    const MIN_BOTTOM = 471 + 80;                       // 极短文案下限, 防压坏标题区
    const desiredBottom = Math.max(MIN_BOTTOM, textBottom + 40);  // 文本底缘留 40px 空白
    const newHeight = desiredBottom - baseTop;
    const shift = Math.round(desiredBottom - 852);     // 相对设计基线的位移(可正可负)

    if(shift !== 0){
      const traitBg = inner.querySelector(".rp-trait-bg");
      if(traitBg) traitBg.style.height = `${newHeight}px`;

      // 遍历 inner 的直接子元素, 按 computed top 平移 (覆盖 CSS 写死 top 与 inline top 两种)
      // top >= 852 即 trait 段之后的所有元素, 整体随 shift 平移, 段内布局保持一致。
      Array.from(inner.children).forEach(el => {
        const ct = parseFloat(getComputedStyle(el).top);
        if(!isNaN(ct) && ct >= 852){
          el.style.top = `${Math.round(ct + shift)}px`;
        }
      });

      const rpi = $("#rPageInner");
      if(rpi) rpi.style.minHeight = `${1954 + shift}px`;
    }
  });
}

// ---------- 8 个轴 pole 解读弹层 — 像素级对齐 Figma Detail Page-i/e/n/s/t/f/j/p ----------
const POLE_DETAIL = {
  I: { letter:"I", cn:"内倾", en:"Introvert",
       sub:"能量来源:向内而生,靠独处或深度对话充电。",
       desc:"偏爱小而密的高质量社交,反感无效寒暄;\n沟通中更擅长倾听,习惯沉淀思绪再回应,对私人空间有清晰边界。\n朋友不多,但每段关系都足够深刻真诚。" },
  E: { letter:"E", cn:"外倾", en:"Extravert",
       sub:"能量来源:向外汲取,在社交与互动中充电。",
       desc:"偏爱多元开放的社交场景,享受即时交流;\n乐于主动表达,在互动中梳理思路,对外部反馈更敏感。\n朋友圈广,擅长快速建立联结,在热闹中获得活力。" },
  N: { letter:"N", cn:"直觉", en:"Intuition",
       sub:"接受信息:从抽象关联与灵感中捕捉信息,着眼未来可能。",
       desc:"关注趋势与可能性,偏好探索未知,重视创意与想象;\n擅长发现事物间的隐性联系,喜欢畅想未来,追求创新突破的方向。\n偏爱跳出框架思考,享受脑洞与灵感碰撞的过程。" },
  S: { letter:"S", cn:"感觉", en:"Sensing",
       sub:"接受信息:从具体事实与经验中获取信息,聚焦当下现实。",
       desc:"关注细节与实际,偏好可验证的信息,重视亲身经历;\n习惯基于已有经验做判断,擅长处理具体事务,追求落地可行的方案。\n相信看得见、摸得着的事实,做事踏实稳健。" },
  T: { letter:"T", cn:"思考", en:"Thinking",
       sub:"决策方式:以逻辑为标尺,基于客观分析做决策",
       desc:"重视公平与原则,习惯理性拆解问题,追求公正高效的结果;\n擅长用逻辑梳理思路,优先考虑利弊对错,而非情绪感受。\n信奉规则与道理,决策时更看重客观事实而非人情。" },
  F: { letter:"F", cn:"情感", en:"Feeling",
       sub:"决策方式:以价值为导向,基于共情与感受做决策。",
       desc:"重视人际和谐,习惯换位思考,优先考虑他人的情绪与需求;\n擅长感知他人的情绪变化,追求温暖包容的氛围,看重关系中的真诚联结。\n信奉善意与共情,决策时更看重对人的影响。" },
  J: { letter:"J", cn:"判断", en:"Judging",
       sub:"行事风格:偏好有序可控,用计划与结构应对生活。",
       desc:"喜欢提前规划安排,做事有始有终,讨厌临时变动与混乱;\n习惯明确目标与截止时间,享受完成任务的踏实感,追求稳定可预期的节奏。\n信奉条理与规划,把一切安排妥当才安心。" },
  P: { letter:"P", cn:"感知", en:"Perceiving",
       sub:"行事风格:偏好灵活开放,用随性与适应应对生活。",
       desc:"喜欢随遇而安的节奏,做事灵活多变,讨厌被固定计划束缚;\n习惯保持多种选择,享受即兴带来的惊喜,擅长快速适应变化。\n信奉随性与弹性,更愿意拥抱未知与不确定性。" }
};

function openPoleDetail(letter){
  const data = POLE_DETAIL[letter];
  if(!data) return;
  const modal = $("#poleDetailModal");
  if(!modal) return;
  modal.querySelector(".pd-letter").textContent = `${data.letter} ${data.cn}`;
  modal.querySelector(".pd-en").textContent = `（${data.en}）`;
  modal.querySelector(".pd-sub").textContent = data.sub;
  modal.querySelector(".pd-desc").textContent = data.desc;
  modal.hidden = false;
}
function closePoleDetail(){
  const modal = $("#poleDetailModal");
  if(modal) modal.hidden = true;
}

function closePoleDetail(){
  const modal = $("#poleDetailModal");
  if(modal) modal.hidden = true;
}

// ---------- pick 选择 MBTI 渲染 — 像素级对齐 Figma 4377:3245(默认)/4377:3041(选中) ----------
// 4 行 × 4 列, 每卡 358×90 r=14, x=80/454/828/1202, y=88/194/300/406
// 行配色: 0=紫(NT) / 1=绿(NF) / 2=蓝(SJ) / 3=橙(SP)
const PICK_GRID = [
  [
    { type:"INTJ", cn:"建筑师" },
    { type:"INTP", cn:"逻辑学家" },
    { type:"ENTJ", cn:"指挥官" },
    { type:"ENTP", cn:"辩论家" }
  ],
  [
    { type:"INFJ", cn:"提倡者" },
    { type:"INFP", cn:"调停者" },
    { type:"ENFJ", cn:"主人公" },
    { type:"ENFP", cn:"活动家" }
  ],
  [
    { type:"ISTJ", cn:"物流师" },
    { type:"ISFJ", cn:"守卫者" },
    { type:"ESTJ", cn:"总经理" },
    { type:"ESFJ", cn:"执政官" }
  ],
  [
    { type:"ISTP", cn:"鉴赏家" },
    { type:"ISFP", cn:"探险家" },
    { type:"ESTP", cn:"企业家" },
    { type:"ESFP", cn:"表演者" }
  ]
];

// type → 正式中文译名(建筑师 / 辩论家 / 企业家 …), 取自 PICK_GRID
function typeCN(type){
  const t = (type || "").toUpperCase();
  for(const row of PICK_GRID){
    const hit = row.find(c => c.type === t);
    if(hit) return hit.cn;
  }
  return "";
}

function renderPick(){
  const grid = $("#pickGrid");
  if(!grid) return;
  const COLS_X = [80, 454, 828, 1202];
  const ROWS_Y = [88, 194, 300, 406];
  let html = "";
  PICK_GRID.forEach((row, rIdx) => {
    row.forEach((item, cIdx) => {
      const x = COLS_X[cIdx];
      const y = ROWS_Y[rIdx];
      const isOn = state.pickedType === item.type;
      html += `
        <button type="button" class="pp-card${isOn?' is-on':''}" data-type="${item.type}" data-row="${rIdx}" style="left:${x}px;top:${y}px">
          <span class="pp-card-code">${item.type}</span>
          <span class="pp-card-cn">${item.cn}</span>
        </button>
      `;
    });
  });
  grid.innerHTML = html;
  const cf = $("#pickConfirm");
  if(cf) cf.classList.toggle("is-on", !!state.pickedType);
  const page = $("#pickPage");
  if(page) page.scrollTop = 0;
  const tip = $("#pickScrollTip");
  if(tip) tip.classList.remove("is-hidden");
}

function pickType(type){
  state.pickedType = type;
  renderPick();
}

// ---------- archive 档案切换 / 删除 — Figma 4381:3733 / 4741:463 / 4741:519 ----------
// 卡布局: 3 张 482×90, x=80/579/1078, y=90, gap=17px

function ensureArchiveSeed(){
  if(state.archives.length === 0){
    const id = "ar-" + Date.now();
    state.archives.push({
      id,
      name: state.profile.name || "我",
      relation: state.profile.relation || "自己",
      type: state.currentType || "ENTP"
    });
    state.currentArchiveId = id;
  }
}

// 完成测试 / 选 MBTI 后, 把当前 profile + type 写入档案库
// 若已有同名+同关系记录则更新, 否则新增, 并设为当前生效档案
function upsertCurrentArchive(){
  if(!state.profile.name || !state.profile.relation || !state.currentType) return;
  // 走到这里说明新建/重测已完成落档 → 旧 result 返回快照失效
  state.newArchiveReturn = null;
  // 关系=自己 → 全局唯一: 若已存在"自己"档案则覆盖它(即便从"新建档案"入口进入)
  if(state.profile.relation === "自己"){
    const selfAr = state.archives.find(a => a.relation === "自己");
    if(selfAr){
      selfAr.name = state.profile.name;
      selfAr.type = state.currentType;
      state.currentArchiveId = selfAr.id;
      state.forceNewArchive = false;
      return;
    }
    // 没有"自己"档案 → 落到下方正常新增逻辑
  }
  // 强制新建(从"新建档案"入口进入)→ 跳过所有匹配, 直接追加, 保留原档案
  if(state.forceNewArchive){
    const id = "ar-" + Date.now();
    state.archives.push({
      id,
      name: state.profile.name,
      relation: state.profile.relation,
      type: state.currentType
    });
    state.currentArchiveId = id;
    state.forceNewArchive = false;
    return;
  }
  // 当前生效档案存在 → 更新它(覆盖型, 视为重新测试同一档案)
  let target = state.currentArchiveId
    ? state.archives.find(a => a.id === state.currentArchiveId)
    : null;
  // 当前没有生效档案 → 找匹配项
  if(!target){
    target = state.archives.find(a =>
      a.name === state.profile.name && a.relation === state.profile.relation
    );
  }
  if(target){
    target.name = state.profile.name;
    target.relation = state.profile.relation;
    target.type = state.currentType;
    state.currentArchiveId = target.id;
  } else {
    const id = "ar-" + Date.now();
    state.archives.push({
      id,
      name: state.profile.name,
      relation: state.profile.relation,
      type: state.currentType
    });
    state.currentArchiveId = id;
  }
}

function renderArchive(){
  ensureArchiveSeed();
  const list = $("#archiveList");
  const scene = document.querySelector('.scene-archive');
  if(!list || !scene) return;
  scene.dataset.mode = state.archiveMode;
  $("#archiveTitle").textContent = state.archiveMode === "delete" ? "删除档案" : "档案";
  const cf = $("#archiveConfirm");
  if(cf) cf.style.display = state.archiveMode === "delete" ? "none" : "block";

  const COLS_X = [80, 579, 1077], ROW_Y0 = 90, ROW_GAP = 104;
  const cellPos = (idx) => ({ x: COLS_X[idx % 3], y: ROW_Y0 + Math.floor(idx / 3) * ROW_GAP });
  const items = state.archives;
  const showAdd = state.archiveMode === "switch";
  let html = "";
  items.forEach((ar, i) => {
    const { x, y } = cellPos(i);
    const isCurrent = state.archiveMode === "switch" && (state.archivePendingId || state.currentArchiveId) === ar.id;
    const isChecked = state.archiveMode === "delete" && state.archiveDelIds.includes(ar.id);
    html += `
      <button type="button" class="ar-card${isCurrent?' is-current':''}${isChecked?' is-checked':''}" data-id="${ar.id}" style="left:${x}px;top:${y}px">
        <span class="ar-check">
          <span class="ar-check-box"></span>
          <span class="ar-check-tick"><img src="assets/archive/check-on.png" alt=""></span>
        </span>
        <span class="ar-card-main">
          <span class="ar-card-name">${ar.name}</span>
          <span class="ar-card-rel">${ar.relation}</span>
        </span>
        <span class="ar-card-type">${(ar.type || "").toLowerCase()}</span>
      </button>
    `;
  });
  if(showAdd){
    const { x, y } = cellPos(items.length);
    html += `
      <button type="button" class="ar-card ar-card-add" data-add="1" style="left:${x}px;top:${y}px">
        <span class="ar-add-plus"><img src="assets/archive/plus.svg" alt=""></span>
        <span class="ar-card-name">新建档案</span>
      </button>
    `;
  }
  // 3 列网格向下扩展 → spacer 撑开 scrollHeight, 列表可纵向滚动
  const count = items.length + (showAdd ? 1 : 0);
  const rows = Math.ceil(count / 3);
  const fullH = ROW_Y0 + rows * ROW_GAP + ROW_Y0;
  html += `<span class="ar-list-spacer" style="top:${Math.max(348, fullH) - 1}px"></span>`;
  list.innerHTML = html;
}

function openArchive(){
  state.archiveMode = "switch";
  state.archiveDelIds = [];
  state.archivePendingId = state.currentArchiveId;
  setScene("archive");
}

// 新建档案流程未完成时, 任意"返回"入口都应回到发起新建的那个 result 页。
// 有快照 → 还原上下文 + 回 result, 返回 true; 无快照 → 返回 false(走原返回逻辑)。
function tryReturnToNewArchiveSource(){
  const snap = state.newArchiveReturn;
  if(!snap) return false;
  state.currentType = snap.currentType;
  state.currentArchiveId = snap.currentArchiveId;
  state.profile.name = snap.profile.name;
  state.profile.relation = snap.profile.relation;
  state.newArchiveReturn = null;
  state.forceNewArchive = false;
  setScene("result");
  return true;
}

// 新建档案: 回功能主页 menu, 清空 profile + 解绑生效档案, 后续流程追加为新档案, 原档案保留
function startNewArchive(){
  // 从 result 进来 → 先快照当前档案上下文, 以便 menu 返回时能回到原 result
  if(state.scene === "result" && state.currentType){
    state.newArchiveReturn = {
      currentType: state.currentType,
      currentArchiveId: state.currentArchiveId,
      profile: { name: state.profile.name, relation: state.profile.relation }
    };
  }
  state.profile.name = "";
  state.profile.relation = "";
  state.currentArchiveId = null;
  state.forceNewArchive = true;
  setScene("menu");
}

function archiveSwitchTo(id){
  state.archivePendingId = id;
  renderArchive();
}

function archiveCommitSwitch(){
  if(state.archivePendingId && state.archivePendingId !== state.currentArchiveId){
    state.currentArchiveId = state.archivePendingId;
    const ar = state.archives.find(a => a.id === state.currentArchiveId);
    if(ar){
      state.profile.name = ar.name;
      state.profile.relation = ar.relation;
      state.currentType = ar.type;
    }
  }
  toast("已切换档案");
  setScene("result");
}

function enterDeleteMode(){
  state.archiveMode = "delete";
  state.archiveDelIds = [];
  renderArchive();
}

function toggleDeleteCheck(id){
  const i = state.archiveDelIds.indexOf(id);
  if(i >= 0) state.archiveDelIds.splice(i, 1);
  else state.archiveDelIds.push(id);
  renderArchive();
}

function openDeleteConfirm(){
  if(state.archiveDelIds.length === 0){
    toast("请选择要删除的档案");
    return;
  }
  const map = ["零","一","两","三","四","五","六","七","八","九","十"];
  const n = state.archiveDelIds.length;
  $("#adcTitle").textContent = `确定删除${map[n] || n}条档案吗？`;
  const m = $("#archiveDelConfirm");
  if(m) m.hidden = false;
}

function closeDeleteConfirm(){
  const m = $("#archiveDelConfirm");
  if(m) m.hidden = true;
}

function commitDelete(){
  const remaining = state.archives.filter(a => !state.archiveDelIds.includes(a.id));
  if(state.archiveDelIds.includes(state.currentArchiveId)){
    state.currentArchiveId = remaining[0]?.id || null;
    if(state.currentArchiveId){
      const ar = remaining[0];
      state.profile.name = ar.name;
      state.profile.relation = ar.relation;
      state.currentType = ar.type;
    }
  }
  state.archives = remaining;
  state.archiveDelIds = [];
  closeDeleteConfirm();
  if(state.archives.length === 0){
    toast("已删除全部档案");
    setScene("menu");
    return;
  }
  state.archiveMode = "switch";
  renderArchive();
  toast("已删除档案");
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
    // 新建档案流程未完成时, 返回回到发起新建的 result
    if(tryReturnToNewArchiveSource()) return;
    // 主壳里返回首页(parent),独立页面下回 history
    if(window.parent !== window) window.parent.postMessage({ type:"personality-back" }, "*");
    else history.length > 1 ? history.back() : null;
  });
  $("#menuHelp")?.addEventListener("click", () => setScene("knowledge"));
  $("#knowledgeBack")?.addEventListener("click", () => setScene("menu"));
  $("#ctaStart")?.addEventListener("click", () => {
    state.profileFor = "quiz";
    setScene("profile");
  });
  $("#ctaPick")?.addEventListener("click", () => {
    state.profileFor = "pick";
    setScene("profile");
  });

  // profile
  $("#profileBack")?.addEventListener("click", () => {
    if(tryReturnToNewArchiveSource()) return;
    setScene("menu");
  });
  const pfNameEl = $("#pfName");
  if(pfNameEl){
    let composing = false;
    const commit = (el) => {
      // 取前 6 个 Unicode 码点(中文按字计, 不按 UTF-16 长度), 避免截断代理对
      let v = Array.from(el.value).slice(0, 6).join("");
      if(el.value !== v) el.value = v;
      state.profile.name = v;
      // 仅刷新"下一步"启用态, 不回写 input.value(避免打断输入法合成 / 移动光标)
      refreshProfileNext();
    };
    pfNameEl.addEventListener("compositionstart", () => { composing = true; });
    pfNameEl.addEventListener("compositionend", (e) => { composing = false; commit(e.target); });
    pfNameEl.addEventListener("input", (e) => {
      // 中文合成中(拼音未上屏)→ 不处理, 让输入法自由组字
      if(composing) return;
      commit(e.target);
    });
  }
  $("#pfRelation")?.addEventListener("click", () => openRelationModal());
  $("#pfNext")?.addEventListener("click", () => {
    if(!state.profile.name || !state.profile.relation) return;
    if(state.profileFor === "pick"){
      state.pickedType = null;
      setScene("pick");
    } else {
      state.qIndex = 0;
      state.answers = [];
      state.quizFrom = "profile";
      setScene("quiz");
    }
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

  // pole 解读弹层确定按钮
  $("#pdConfirm")?.addEventListener("click", () => closePoleDetail());
  // 点 mask 也关闭
  document.querySelector("#poleDetailModal .pd-mask")?.addEventListener("click", () => closePoleDetail());

  // pick 选择 MBTI
  $("#pickBack")?.addEventListener("click", () => setScene("profile"));
  $("#pickGrid")?.addEventListener("click", (e) => {
    const card = e.target.closest(".pp-card");
    if(!card) return;
    pickType(card.dataset.type);
  });
  $("#pickConfirm")?.addEventListener("click", () => {
    if(!state.pickedType) return;
    state.currentType = state.pickedType;
    upsertCurrentArchive();
    setScene("result");
  });
  // pick 滚动提示淡出
  const pickPage = document.getElementById("pickPage");
  pickPage?.addEventListener("scroll", () => {
    const tip = document.getElementById("pickScrollTip");
    tip?.classList.toggle("is-hidden", pickPage.scrollTop > 30);
  }, { passive:true });

  // archive 档案切换 / 删除
  $("#archiveBack")?.addEventListener("click", () => {
    if(state.archiveMode === "delete"){
      // 删除模式下返回 = 退出删除模式回到切换模式
      state.archiveMode = "switch";
      state.archiveDelIds = [];
      renderArchive();
    } else {
      setScene("result");
    }
  });
  $("#archiveList")?.addEventListener("click", (e) => {
    const card = e.target.closest(".ar-card");
    if(!card) return;
    if(card.dataset.add){
      startNewArchive();
      return;
    }
    const id = card.dataset.id;
    if(!id) return;
    if(state.archiveMode === "delete"){
      toggleDeleteCheck(id);
    } else {
      archiveSwitchTo(id);
    }
  });
  $("#archiveConfirm")?.addEventListener("click", () => archiveCommitSwitch());
  $("#archiveTrash")?.addEventListener("click", () => {
    if(state.archiveMode === "switch"){
      enterDeleteMode();
    } else {
      // 删除模式下 → 弹确认
      openDeleteConfirm();
    }
  });
  $("#adcCancel")?.addEventListener("click", () => closeDeleteConfirm());
  $("#adcOk")?.addEventListener("click", () => commitDelete());
  document.querySelector("#archiveDelConfirm .adc-mask")?.addEventListener("click", () => closeDeleteConfirm());

  // quiz
  $("#quizBack")?.addEventListener("click", () => {
    // 从 result 进入(重新测试)时, 任意时刻返回都弹"reconfirm-test"
    // 从 profile 进入时, 已答题或非首题才弹
    if(state.quizFrom === "result" || state.qIndex > 0 || state.answers.some(Boolean)){
      openExitModal();
    } else {
      setScene("menu");
    }
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
      if(e.key === "Escape"){ if(!tryReturnToNewArchiveSource()) setScene("menu"); }
      if(e.key === "Enter" && state.profile.name && state.profile.relation){
        if(state.profileFor === "pick"){
          state.pickedType = null;
          setScene("pick");
        } else {
          state.qIndex = 0;
          state.answers = [];
          state.quizFrom = "profile";
          setScene("quiz");
        }
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
        else if(!tryReturnToNewArchiveSource()) setScene("menu");
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
    if(state.scene === "pick"){
      if(e.key === "Escape") setScene("profile");
      if(e.key === "Enter" && state.pickedType){
        state.currentType = state.pickedType;
        setScene("result");
      }
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
  // hash 直入场景: 跳过 menu 离场动画, 直接 hidden 切换到目标
  const directEnter = (target, prep) => {
    document.querySelectorAll(".scene").forEach(s => { s.hidden = (s.dataset.scene !== target); });
    state.scene = target;
    document.body.dataset.state = target;
    if(prep) prep();
    onSceneEnter(target);
  };
  if(hash === "profile"){
    directEnter("profile");
  }else if(hash === "pick"){
    directEnter("pick", () => {
      state.profile.name = state.profile.name || "测试";
      state.profile.relation = state.profile.relation || "自己";
      state.profileFor = "pick";
    });
  }else if(hash === "quiz"){
    directEnter("quiz", () => {
      state.profile.name = state.profile.name || "测试";
      state.profile.relation = state.profile.relation || "自己";
    });
  }else if(hash === "result"){
    directEnter("result", () => {
      state.currentType = (params.get("type") || "INTP").toUpperCase();
    });
  }else if(hash === "archive"){
    directEnter("archive", () => {
      // 注 demo 数据看看 3 张卡布局
      state.profile.name = state.profile.name || "Vivian";
      state.profile.relation = state.profile.relation || "自己";
      state.currentType = state.currentType || "ENTP";
      if(state.archives.length === 0){
        state.archives = [
          { id:"ar-1", name:"Vivian", relation:"自己", type:"ENTP" },
          { id:"ar-2", name:"jwj",    relation:"朋友", type:"INFP" },
          { id:"ar-3", name:"水一",   relation:"家人", type:"ENFP" }
        ];
        state.currentArchiveId = "ar-1";
      }
      state.archiveMode = (params.get("mode") || "switch");
      state.archivePendingId = state.currentArchiveId;
    });
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
