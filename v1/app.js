// 心灵驿站 · 每日星语 — v1
// 长条屏 1640×348 单页应用

(() => {

// ---------- 数据 ----------
const ZODIACS = {
  aries:       { name:"白羊座", title:"勇往直前的开拓者", date:"3.21-4.19" },
  taurus:      { name:"金牛座", title:"安稳守心者",       date:"4.20-5.20" },
  gemini:      { name:"双子座", title:"思维灵动派",       date:"5.21-6.21" },
  cancer:      { name:"巨蟹座", title:"温柔守护者",       date:"6.22-7.22" },
  leo:         { name:"狮子座", title:"倔强逐梦人",       date:"7.23-8.22" },
  virgo:       { name:"处女座", title:"细致深耕者",       date:"8.23-9.22" },
  libra:       { name:"天秤座", title:"平衡织梦人",       date:"9.23-10.23" },
  scorpio:     { name:"天蝎座", title:"专注燃魂者",       date:"10.24-11.22" },
  sagittarius: { name:"射手座", title:"自由奔行者",       date:"11.23-12.21" },
  capricorn:   { name:"摩羯座", title:"稳步登山客",       date:"12.22-1.19" },
  aquarius:    { name:"水瓶座", title:"灵感漫游者",       date:"1.20-2.18" },
  pisces:      { name:"双鱼座", title:"温柔造梦师",       date:"2.19-3.20" }
};

// 五维 + 综合分（按星座取一份预置；这里只精修 leo 与 taurus，对应 Figma 两张主页）
const DAILY_DATA = {
  leo:{
    quote:"心怀热血自赴前路荣光",
    prose:"习惯事事要强、不愿示弱，很容易因一次考试失利、刷题瓶颈陷入 emo，还习惯独自硬撑。不必时刻逼自己耀眼夺目，允许偶尔放慢节奏、接纳短暂低落；把骨子里的倔强化作学习的底气，沉下心稳步积累、踏实深耕，你的天赋与热血，终会在坚持中绽放专属高光。",
    title:"倔强<br>逐梦人",
    img:"daily-words/assets/illustrations/lion-egg.png",
    score:82,
    dims:{focus:89,effi:79,motiv:87,harv:77,mind:98},
    lucky:{ color:"绿松石蓝", item:"玛瑙", food:"蜂蜜", num:"7 / 9", dir:"正东", time:"11 点" }
  },
  taurus:{
    quote:"步履从容深耕自有收获",
    prose:"天生稳重自律，做事认真有韧劲对待学习愿意脚踏实地的你，一点点积累，却也容易被难题卡点、枯燥备考消磨耐心。不必焦虑前路快慢，不用强迫自己跟风追赶。守住骨子里的踏实与专注，一步一个脚印攻克学习难关。慢慢来、稳下来，所有默默付出的努力，都会在合适的时刻如期开花。",
    title:"安稳<br>守心者",
    img:"daily-words/assets/illustrations/taurus-egg.png",
    score:78,
    dims:{focus:50,effi:70,motiv:69,harv:77,mind:98},
    lucky:{ color:"克莱因蓝", item:"黑曜石", food:"冰美式", num:"8 / 3", dir:"西北", time:"12 点" }
  },
  // 默认模板（其他星座共用，但替换名字）
  _default:{
    quote:"今日宜静心深耕慢慢生光",
    prose:"学习路上有起有伏是常态。今天试着把目光放在眼前能做好的小事上：一道题、一段笔记、一次专注。不必和谁比快慢，专属于你的节奏正在悄悄积攒力量，所有踏实付出的时间，终会汇成你独一无二的星光。",
    title:"温柔<br>追光人",
    img:"daily-words/assets/illustrations/taurus-egg.png",
    score:64,
    dims:{focus:62,effi:70,motiv:58,harv:65,mind:72},
    lucky:{ color:"晨曦粉", item:"月光石", food:"蜂蜜柠檬", num:"3 / 6", dir:"东南", time:"10 点" }
  }
};

// 综合分 → 状态名 + 颜色
function scoreLevel(s){
  if(s<=20) return { name:"闲息静养日", color:"#ff7474" };
  if(s<=40) return { name:"蓄力回升日", color:"#ffa946" };
  if(s<=60) return { name:"平稳精进日", color:"#53cf00" };
  if(s<=80) return { name:"思维翱翔日", color:"#5577ff" };
  return       { name:"逐光登顶日", color:"#ab64fb" };
}

// ---------- state ----------
const state = {
  scene:"home",
  prev:null,
  bound:null,             // 当前绑定的星座 key（null = 未绑定）
  nextZodiac:null,        // 待切换的星座
  pendingFlow:"bind",     // "bind" 首次绑定 / "switch" 切换
  collect:[],             // 收藏列表
  showConfirm:false,
  starfieldOn:false,
  meteorTimer:null
};

// 启动初始为空收藏列表（之前用 seed 假数据，会让"清空后再次收藏"显示混乱）
state.collect = [];

// ---------- DOM 短手 ----------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

// ---------- 自适应缩放 ----------
function fitDevice(){
  const dev = $("#device");
  const stage = $(".stage");
  // 用 visualViewport（手机端键盘弹起/工具栏隐显时更准），否则回退 client*
  const vw = (window.visualViewport?.width)  || stage.clientWidth  || window.innerWidth;
  const vh = (window.visualViewport?.height) || stage.clientHeight || window.innerHeight;
  const sx = vw / 1640;
  const sy = vh / 348;
  // contain 模式：取较小，确保整机完整可见；不再卡 1 上限——大屏（如 1920x1080 横屏）也能放大显示
  const s = Math.min(sx, sy);
  dev.style.setProperty("--device-scale", s);
}
addEventListener("resize", fitDevice);
addEventListener("orientationchange", fitDevice);
window.visualViewport?.addEventListener("resize", fitDevice);
fitDevice();

// ---------- 场景切换 ----------
function setScene(name){
  if(state.scene === name) return;
  const cur = $(`.scene[data-scene="${state.scene}"]`);
  const nxt = $(`.scene[data-scene="${name}"]`);
  if(!nxt) return;

  // 离开 confirm（覆盖层）→ 直接隐藏覆盖层，底层场景留在 state.scene
  const wasOverlay = (state.scene === "confirm");
  const isOverlay  = (name === "confirm");

  if(wasOverlay){
    cur.hidden = true;
  }
  state.prev = state.scene;
  state.scene = name;

  if(cur && !cur.hidden && !wasOverlay && !isOverlay){
    cur.classList.add("is-leaving");
    setTimeout(()=>{
      cur.hidden = true;
      cur.classList.remove("is-leaving");
    },180);
  }

  setTimeout(()=>{
    nxt.hidden = false;
    nxt.classList.remove("is-entering");
    void nxt.offsetWidth;
    nxt.classList.add("is-entering");
    onSceneEnter(name);
  }, (cur && !cur.hidden && !wasOverlay && !isOverlay) ? 160 : 0);
}

function onSceneEnter(name){
  // 控制星空 canvas 显隐 + 流星：daily 也开（仅流星，不开 canvas 星空，避免与白底冲突）
  const showStarfield = (name==="loading" || name==="select" || name==="collect" || name==="confirm");
  toggleStarfield(showStarfield);
  // 流星仅在 daily 页出现
  state.meteorOn = (name === "daily");

  if(name === "select"){
    // 进入选择页 = xingzuo-all-weixuanze 未选择状态：清空所有 chip，禁用确定
    $$(".zhot-on").forEach(el => el.hidden = true);
    state.nextZodiac = null;
    const btn = $("#selConfirm");
    if(btn) btn.disabled = true;
    // 滚回顶部
    const sel = $("#selectTrack"); if(sel) sel.scrollTop = 0;
  }
  if(name === "loading") runLoading();
  if(name === "daily")   runDailyEnter();
  if(name === "collect") renderCollect();
  if(name === "answer"){
    // 进入时 lazy-load iframe，?skip-menu=1 让答案之书启动直接进 question 状态
    const fr = $("#ansFrame");
    const target = "answer-book/index.html?skip-menu=1";
    if(fr && fr.getAttribute("src") !== target){
      fr.setAttribute("src", target);
    }
  }
  if(name === "personality"){
    const fr = $("#perFrame");
    const target = "personality/index.html";
    if(fr && fr.getAttribute("src") !== target){
      fr.setAttribute("src", target);
    }
  }
}

// ---------- 启动 ----------
function init(){
  bindEvents();
  startStarfield();
  scheduleMeteors();
  // 首屏：home
  $$(".scene").forEach(s => { if(s.dataset.scene !== "home") s.hidden = true; });
}

// ---------- 事件 ----------
function bindEvents(){
  // 顶部 home 卡点击
  $$(".hcard[data-card]").forEach(el => {
    el.addEventListener("click", () => {
      const card = el.dataset.card;
      if(card === "answer"){
        setScene("answer");
      }else if(card === "star"){
        if(state.bound){
          // 已绑定 → 提示页"去查看"（4092:70）
          setScene("reminder");
        }else{
          setScene("unbound");
        }
      }else if(card === "personality"){
        setScene("personality");
      }else if(card === "naming"){
        toast("姓名寓意 · 即将上线");
      }
    });
  });

  // 通用 data-go 路由
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-go]");
    if(!t) return;
    const go = t.dataset.go;

    if(go === "back"){
      // select 返回：bound 回 daily（切换流程） / unbound 回 home（首次绑定）
      const back = state.bound ? "daily" : "home";
      setScene(back);
      return;
    }
    if(go === "home")    { state.cameFrom = null; return setScene("home"); }
    if(go === "select")  return setScene("select");
    if(go === "daily")   return setScene("daily");
    if(go === "collect") return setScene("collect");
    if(go === "reminder"){ state.cameFrom = null; return setScene("reminder"); }
  });

  // select：点星座卡（仅选中，不跳转）
  $$(".zhot").forEach(card => {
    card.addEventListener("click", () => {
      const zo = card.dataset.zo;
      $$(".zhot-on").forEach(el => el.hidden = (el.dataset.for !== zo));
      state.nextZodiac = zo;
      const btn = $("#selConfirm");
      if(btn) btn.disabled = false;
    });
  });

  // 右上"确定" → loading
  $("#selConfirm")?.addEventListener("click", () => {
    if(!state.nextZodiac) return;
    state.pendingFlow = state.bound ? "switch" : "bind";
    setScene("loading");
  });

  // 顶部胶囊已用 .daily-hot-zo / .daily-hot-fav 替代，路由由 data-go 处理（见上方通用 router）

  // daily 底部"收藏"按钮（Figma Group 228 / 229 切换）—— 切换收藏/取消收藏
  $("#favBtn")?.addEventListener("click", () => {
    const z = state.bound;
    const data = DAILY_DATA[z] || DAILY_DATA._default;
    const exists = state.collect.find(x => x.z === z && x.text === data.quote);
    const btn = $("#favBtn");
    const img = $("#favBtnImg");
    if(!exists){
      state.collect.unshift({ z, text:data.quote, date:fmtDate() });
      if(img) img.src = "daily-words/assets/illustrations/fav-on.png";
      btn?.setAttribute("aria-pressed","true");
      toast("已收藏到我的收藏 ✨");
    }else{
      state.collect = state.collect.filter(x => !(x.z === z && x.text === data.quote));
      if(img) img.src = "daily-words/assets/illustrations/fav-off.png";
      btn?.setAttribute("aria-pressed","false");
      toast("已取消收藏");
    }
  });

  // 收藏 trash
  $("#trashBtn")?.addEventListener("click", () => {
    if(state.collect.length === 0) return;
    $("#confCount").textContent = numToZh(state.collect.length);
    setScene("confirm");
  });

  // 删除确认
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-conf]");
    if(!t) return;
    const conf = $(`.scene[data-scene="confirm"]`);
    if(t.dataset.conf === "ok"){
      // 立刻清空 + 重渲染，避免老卡片残留在视觉上
      state.collect = [];
      conf.hidden = true;
      state.scene = "collect";
      renderCollect();
    }else{
      conf.hidden = true;
      state.scene = "collect";
    }
  });

  // 滚动指示
  const scroll = $("#dailyScroll");
  if(scroll){
    scroll.addEventListener("scroll", () => {
      const s = $(".scene-daily");
      if(scroll.scrollTop > 30) s.classList.add("scrolled");
      else s.classList.remove("scrolled");
    });
  }

  // 键盘快捷
  addEventListener("keydown", (e) => {
    if(state.scene === "home"){
      const track = $("#homeTrack");
      if(e.key === "ArrowRight") track.scrollBy({ left:380, behavior:"smooth" });
      if(e.key === "ArrowLeft")  track.scrollBy({ left:-380, behavior:"smooth" });
    }
  });
}

// ---------- 顶部 toast ----------
let toastTimer = null;
function toast(msg){
  const el = $("#toast");
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 2200);
}

// ---------- loading ----------
function runLoading(){
  const fill = $("#loadFill");
  // 关掉 transition 直接归零（避免上一次满进度回弹动画）
  fill.style.transition = "none";
  fill.style.width = "0%";
  // 下一帧恢复 transition 再开始填充
  void fill.offsetWidth;
  fill.style.transition = "";
  let p = 0;
  const tick = () => {
    p += 6 + Math.random()*6;
    if(p > 100) p = 100;
    fill.style.width = p + "%";
    if(p < 100){
      setTimeout(tick, 90 + Math.random()*60);
    }else{
      setTimeout(() => {
        // loading 完成 → 直接进 daily（不再经过 success 覆盖层）
        if(state.nextZodiac){
          const verb = state.pendingFlow === "switch" ? "切换" : "绑定";
          const z = ZODIACS[state.nextZodiac];
          state.bound = state.nextZodiac;
          state.nextZodiac = null;
          toast(`已选择【${z.name}】`);
          setScene("daily");
        }
        // else: just stay on loading (e.g. direct hash visit)
      }, 420);
    }
  };
  tick();
}

// ---------- daily 进入 ----------
const DAILY_TAURUS_BG = new Set(["taurus","virgo","capricorn","gemini","libra","aquarius"]);
function runDailyEnter(){
  const z = state.bound || "leo";
  // 整张 Figma PNG 直接做底图：土象 + 风象用金牛页，其余用狮子页
  const bg = $("#dailyBg");
  if(bg){
    bg.src = (DAILY_TAURUS_BG.has(z)
      ? "daily-words/assets/illustrations/daily-taurus-bg.png"
      : "daily-words/assets/illustrations/daily-leo-bg.png") + "?v=6";
  }
  // 给 daily 场景打 data-z，CSS 据此切换收藏按钮位置（leo:1072 / 其他:1110）
  const scene = document.querySelector(".scene-daily");
  if(scene) scene.setAttribute("data-z", DAILY_TAURUS_BG.has(z) ? "taurus" : "leo");
  // 返回按钮目标：从 collect 进来则回 collect，否则默认回 reminder
  const back = $("#dailyBack");
  if(back){
    back.dataset.go = (state.cameFrom === "collect") ? "collect" : "reminder";
  }
  // 重置滚动
  const sc = $("#dailyScroll");
  if(sc) sc.scrollTop = 0;
}

function animateNum(el, from, to, dur){
  if(document.documentElement.classList.contains("no-anim")){ el.textContent = to; return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    const ease = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * ease);
    if(k < 1) requestAnimationFrame(step);
    else el.textContent = to;
  };
  requestAnimationFrame(step);
}

// ---------- collect 渲染 ----------
function renderCollect(){
  const list = $("#colList");
  const empty = $("#colEmpty");
  const trash = $("#trashBtn");
  list.innerHTML = "";
  if(state.collect.length === 0){
    if(trash) trash.hidden = true;
    empty.hidden = false;
    return;
  }
  if(trash) trash.hidden = false;
  empty.hidden = true;
  // Figma 3 槽位绝对定位：(80,84) (828,84) (80,190)，按 state.collect 顺序填入
  const SLOTS = [
    { left:  80, top:  84 },
    { left: 828, top:  84 },
    { left:  80, top: 190 },
  ];
  state.collect.slice(0, 3).forEach((it, i) => {
    const slot = SLOTS[i];
    const z = ZODIACS[it.z];
    const card = document.createElement("button");
    card.type = "button";
    card.className = "cl-card";
    card.style.left = slot.left + "px";
    card.style.top  = slot.top  + "px";
    card.innerHTML = `
      <span class="cl-zname">${z?.name || ""}</span>
      <span class="cl-text">${it.text}</span>
      <span class="cl-date">${it.date}</span>
    `;
    card.addEventListener("click", () => {
      state.bound = it.z;
      state.cameFrom = "collect";
      setScene("daily");
    });
    list.appendChild(card);
  });
}

// ---------- starfield ----------
function startStarfield(){
  const cv = $("#starfield");
  const ctx = cv.getContext("2d");
  // hi-DPI
  const dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = 1640 * dpr;
  cv.height = 348 * dpr;
  ctx.scale(dpr, dpr);

  const N = 60;
  const stars = [];
  for(let i=0;i<N;i++){
    stars.push({
      x: Math.random()*1640,
      y: Math.random()*348,
      r: Math.random()*1.6 + 0.4,
      a: Math.random()*0.7 + 0.3,
      s: Math.random()*0.4 + 0.2,
      ph: Math.random()*Math.PI*2
    });
  }
  let last = 0;
  function loop(t){
    const dt = (t - last) || 16;
    last = t;
    ctx.clearRect(0,0,1640,348);
    for(const st of stars){
      st.ph += dt*0.0015;
      const tw = (Math.sin(st.ph) + 1)/2;
      const a = st.a * (0.4 + 0.6*tw);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.arc(st.x, st.y + Math.sin(st.ph*0.6)*0.7, st.r, 0, Math.PI*2);
      ctx.fill();
      if(st.r > 1.4){
        ctx.beginPath();
        ctx.fillStyle = `rgba(180,220,255,${a*0.45})`;
        ctx.arc(st.x, st.y, st.r*2.2, 0, Math.PI*2);
        ctx.fill();
      }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function toggleStarfield(on){
  const cv = $("#starfield");
  if(!cv) return;
  cv.classList.toggle("is-on", on);
  state.starfieldOn = on;
}

// ---------- 流星 ----------
function scheduleMeteors(){
  // 启动单条流星循环；spawnMeteor 内部会自驱 + 暂停态自动重试
  setTimeout(spawnMeteor, 1200);
}
function spawnMeteor(){
  const dev = $("#device");
  if(!dev || !state.meteorOn || document.hidden){
    // 暂停态，0.8s 后再尝试
    setTimeout(spawnMeteor, 800);
    return;
  }
  const m = document.createElement("div");
  m.className = "meteor";
  // 整屏随机起点：右半边 1000–1620，竖向 -20–280（覆盖 348 视口绝大部分）
  const startX = 1000 + Math.random()*620;
  const startY = -20  + Math.random()*300;
  // 慢速：2.2–3.2s
  const dur = (2.2 + Math.random()*1.0).toFixed(2);
  // 大小：0.7–1.2
  const scale = (0.7 + Math.random()*0.5).toFixed(2);
  m.style.left = startX + "px";
  m.style.top  = startY + "px";
  m.style.setProperty("--mdur", dur + "s");
  m.style.setProperty("--mscale", scale);
  dev.appendChild(m);
  const lifeMs = Math.ceil(parseFloat(dur)*1000) + 80;
  setTimeout(() => {
    m.remove();
    // 上一颗结束 → 略停顿后再换位置 spawn 下一颗，营造"一颗接一颗"
    const gap = 350 + Math.random()*900; // 0.35–1.25s 间隙
    setTimeout(spawnMeteor, gap);
  }, lifeMs);
}

// ---------- 工具 ----------
function fmtDate(){
  const d = new Date();
  return `${d.getMonth()+1}-${d.getDate()}`;
}
function numToZh(n){
  const map = ["零","一","二","三","四","五","六","七","八","九","十"];
  return map[n] || String(n);
}

// 启动
function bootWithHash(){
  init();
  const hash = (location.hash || "").replace("#","");
  const valid = ["home","unbound","reminder","select","loading","daily","collect","confirm","answer","personality"];

  // ?noanim=1 关闭入场动画（截图用）；?expand=1 展开为 1500 高（截图 daily 整页用）
  const params = new URLSearchParams(location.search);
  if(params.get("noanim") === "1" || params.get("expand") === "1"){
    document.documentElement.classList.add("no-anim");
  }
  if(params.get("expand") === "1"){
    const dev = $("#device");
    dev.style.height = "1500px";
    const stage = $(".stage");
    stage.style.alignItems = "flex-start";
    fitDevice();
    document.querySelectorAll(".scene").forEach(s => {
      if(s.dataset.scene === "daily"){
        s.style.height = "1500px";
        const sc = s.querySelector("#dailyScroll");
        if(sc){ sc.style.overflow = "visible"; sc.style.height = "1500px"; }
      }
    });
  }

  if(hash && valid.includes(hash) && hash !== "home"){
    if(hash === "daily" || hash === "reminder" || hash === "collect" || hash === "confirm") state.bound = "leo";
    if(hash === "daily" && location.search.includes("z=taurus")) state.bound = "taurus";
    $(`.scene[data-scene="home"]`).hidden = true;
    if(hash === "confirm"){
      const collect = $(`.scene[data-scene="collect"]`);
      collect.hidden = false;
      state.scene = "collect";
      onSceneEnter("collect");
      $("#confCount").textContent = numToZh(state.collect.length);
    }
    const nxt = $(`.scene[data-scene="${hash}"]`);
    nxt.hidden = false;
    nxt.classList.add("is-entering");
    state.scene = hash;
    if(hash !== "confirm") onSceneEnter(hash);
  }
}
if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", bootWithHash, { once:true });
}else{
  bootWithHash();
}

})();
