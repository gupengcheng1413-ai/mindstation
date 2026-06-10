// 姓名寓意 · 渲染器 part2 — 音译模板模块 + renderResult 组装 + 事件绑定 + init
(() => {
  "use strict";
  const NM = window.__NM;
  const M = window.__NM_modules;
  const esc = NM.esc, $ = NM.$, $$ = NM.$$;

  // —— 音译模板模块 —— //
  function mHeroTl(d){
    return `<section class="rs-hero">
      <div class="rs-hero-name translit"><span class="kind">${esc(d.kind)}</span><span class="ch">${esc(d.title)}</span></div>
      <div class="rs-hero-tag">
        <div class="big">${esc(d.hero.big)}${d.isFallback?'<span class="flag">示例</span>':''}</div>
        <div class="desc">${esc(d.hero.desc)}</div>
      </div>
      ${M.tones(d.hero.tones)}
    </section>`;
  }

  function mEtymology(d){
    const cols = d.etymology.cols.map(c =>
      `<div class="col"><div class="k">${esc(c.k)}</div><div class="v">${esc(c.v)}</div></div>`).join("");
    return M.sechead("词源") +
      `<div class="rs-ety"><div class="rs-ety-sub">${esc(d.etymology.sub)}</div>
        <div class="rs-ety-cols">${cols}</div>
        <div class="rs-ety-note">${esc(d.etymology.note)}</div>${M.corners}</div>`;
  }

  function mPick(d){
    const items = d.pick.items.map(p =>
      `<div class="pk"><div class="ph"><b>${esc(p.b)}</b><span>${esc(p.tip)}</span></div><div class="mean">${esc(p.mean)}</div></div>`).join("");
    return M.sechead("中译选字") +
      `<div class="rs-pick"><div class="rs-pick-grid">${items}</div>
        <div class="note">${esc(d.pick.note)}</div>${M.corners}</div>`;
  }

  function mCultureVariants(d){
    const vs = d.variants.items.map(v =>
      `<div class="v"><b>${esc(v.b)}</b><span>${esc(v.s)}</span></div>`).join("");
    return `<div class="rs-duo">
      ${M.pcard("名字背后的文化", d.culture.sub, esc(d.culture.body))}
      ${M.pcard("同源", d.variants.sub, `<div class="rs-variants">${vs}</div>`)}
    </div>`;
  }

  // —— 新四段式渲染模块 —— //
  // 首屏 HTML（hero + poem）
  function heroHTML(d){
    if(d.template === "translit"){
      return mHeroTl(d);
    }
    return [M.mHeroCn(d), M.mPoem(d)].join("");
  }

  // 核心详情 HTML（analysis + blessing）
  function coreDetailHTML(d){
    if(d.template === "translit"){
      return [mEtymology(d), mPick(d)].join("");
    }
    return [M.mAnalysis(d), M.mBlessing(d)].join("");
  }

  // 姓氏文化 HTML（surname + rhythm）
  function cultureHTML(d){
    if(d.template === "translit"){
      return mCultureVariants(d);
    }
    return M.mSurnameRhythm(d);
  }

  // 外围补充 HTML（people + english + fact + sameName/famous）
  function extraFinalHTML(d){
    if(d.template === "translit"){
      return [M.mPeople(d, "同名星光"), M.mFamous(d), M.mFact(d)].join("");
    }
    return [M.mPeople(d, "同姓名人"),
      d.famous ? M.mFamous(d) : M.mSameName(d), M.mEnglish(d), M.mFact(d)].join("");
  }

  // —— 旧两段式渲染模块（兼容） —— //
  // 核心模块 HTML（第一段，~12s 即可渲染）
  function coreHTML(d){
    if(d.template === "translit"){
      return [mHeroTl(d), mEtymology(d), mPick(d)].join("");
    }
    return [M.mHeroCn(d), M.mPoem(d), M.mAnalysis(d), M.mBlessing(d)].join("");
  }

  // 外围模块 HTML（第二段，异步补；d 须为合并后完整对象）
  function extraHTML(d){
    if(d.template === "translit"){
      return [mCultureVariants(d), M.mPeople(d, "同名星光"), M.mFamous(d), M.mFact(d)].join("");
    }
    return [M.mSurnameRhythm(d), M.mPeople(d, "同姓名人"),
      d.famous ? M.mFamous(d) : M.mSameName(d), M.mEnglish(d), M.mFact(d)].join("");
  }

  // 占位符文案
  const PLACEHOLDER = {
    core: `<div class="rs-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="txt">正在解析字义...</span></div>`,
    culture: `<div class="rs-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="txt">正在追溯姓氏源流...</span></div>`,
    extra: `<div class="rs-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="txt">正在检索名人与英文名...</span></div>`,
    legacy: `<div class="rs-extra-loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="txt">更多内容生成中…</span></div>`
  };


  function shell(inner){
    const bg = `<div class="rs-bg" aria-hidden="true"><img class="bg-whole" src="assets/bg-top.png" alt=""></div>`;
    const head = `<div class="rs-head">
      <button type="button" class="nm-back" data-go="input" aria-label="返回"><img src="assets/nm-back.png" alt=""></button>
      <h1 class="nm-title">姓名寓意</h1>
      <button type="button" class="rs-chip rs-chip-hist" data-go="history">已测姓名</button>
      <button type="button" class="rs-chip rs-chip-again" data-act="again">再测一个</button>
    </div>`;
    return bg + `<div class="rs-wrap">${head}${inner}</div>`;
  }

  // —— 新四段式渲染接口 —— //
  // 渲染首屏（hero + poem）+ 3个占位符
  function renderHero(d, name){
    $("#resultScroll").innerHTML = shell(
      heroHTML(d) +
      `<div id="rsCoreDetail">${PLACEHOLDER.core}</div>` +
      `<div id="rsCulture">${PLACEHOLDER.culture}</div>` +
      `<div id="rsExtra">${PLACEHOLDER.extra}</div>`
    );
  }
  // 填充核心详情
  function fillCoreDetail(d){
    const box = $("#rsCoreDetail");
    if(box) box.innerHTML = coreDetailHTML(d);
  }
  // 填充姓氏文化
  function fillCulture(d){
    const box = $("#rsCulture");
    if(box) box.innerHTML = cultureHTML(d);
  }
  // 填充外围补充
  function fillExtraFinal(d){
    const box = $("#rsExtra");
    if(box) box.innerHTML = extraFinalHTML(d);
  }

  // —— 旧两段式渲染接口（兼容） —— //
  // 完整渲染（预设/缓存命中：核心+外围一次到位，无占位）
  function renderResult(d, name){
    $("#resultScroll").innerHTML = shell(coreHTML(d) + `<div id="rsExtra">${extraHTML(d)}</div>`);
  }
  // 只渲核心 + 外围占位（两段式第一段）
  function renderCore(d, name){
    $("#resultScroll").innerHTML = shell(coreHTML(d) + `<div id="rsExtra">${PLACEHOLDER.legacy}</div>`);
  }
  // 外围到达后填充（第二段；d 为合并后完整对象）
  function fillExtra(d){
    const box = $("#rsExtra");
    if(box) box.innerHTML = extraHTML(d);
  }

  // 暴露接口
  window.__NM_render = renderResult;
  window.__NM_renderCore = renderCore;
  window.__NM_fillExtra = fillExtra;
  window.__NM_renderHero = renderHero;
  window.__NM_fillCoreDetail = fillCoreDetail;
  window.__NM_fillCulture = fillCulture;
  window.__NM_fillExtraFinal = fillExtraFinal;

  // ============================================================
  //  事件绑定
  // ============================================================
  function bind(){
    // confirm 确定 —— 读输入框真实姓名，交 submitName 三状态分流（空则占位名「雷军」）
    const input = $("#nameInput"), ok = $("#confirmOk");
    const submitInput = () => NM.submitName((input && input.value.trim()) || "雷军");
    if(ok) ok.addEventListener("click", submitInput);
    if(input) input.addEventListener("keydown", e => { if(e.key === "Enter") submitInput(); });

    // 通用 data-act 委托（result/blocked 等动态渲染的按钮）
    document.body.addEventListener("click", e => {
      const a = e.target.closest("[data-act]"); if(!a) return;
      const act = a.dataset.act;
      if(act === "scan")      NM.setScene("scan");
      else if(act === "keyboard") NM.gotoConfirm(true);
      else if(act === "retry")    NM.setScene("input");   // blocked 换一个 → 回 naming 首页(扫描/键盘选择)
      else if(act === "again")    NM.setScene("input");   // result 再测一个
    });

    // 通用 data-go 路由
    document.body.addEventListener("click", e => {
      const t = e.target.closest("[data-go]"); if(!t) return;
      const go = t.dataset.go;
      if(go === "home"){ NM.backToHome(); return; }
      if(go === "back"){ NM.setScene(NM.state.prevScene === "history" ? "input" : NM.state.prevScene); return; }
      NM.setScene(go);
    });

    // history：点卡片重看 / 长按置顶 / 清空
    const list = $("#histList");
    if(list){
      list.addEventListener("click", e => {
        const card = e.target.closest(".hs-card"); if(!card) return;
        if(card.dataset.longpressed){ card.dataset.longpressed = ""; return; }
        NM.state.currentName = card.dataset.name;
        runFromHistory(card.dataset.name);
      });
      // 长按置顶
      let lpTimer;
      const startLp = e => {
        const card = e.target.closest(".hs-card"); if(!card) return;
        lpTimer = setTimeout(() => { card.dataset.longpressed = "1"; NM.toggleTop(card.dataset.name); }, 550);
      };
      const endLp = () => clearTimeout(lpTimer);
      list.addEventListener("mousedown", startLp);
      list.addEventListener("touchstart", startLp, {passive:true});
      ["mouseup","mouseleave","touchend","touchcancel","scroll"].forEach(ev => list.addEventListener(ev, endLp));
    }
    const trash = $("#histTrash");
    if(trash) trash.addEventListener("click", () => {
      if(!NM.state.history.length){ NM.toast("还没有记录"); return; }
      NM.state.history = [];
      localStorage.setItem("naming.history", "[]");
      NM.renderHistory(); NM.toast("已清空");
    });
  }

  // 从 history 点名字 → loading → result（两段式：核心先出，外围异步补）
  const HS_TIPS = ["正在拆解字义……", "检索古今典故……", "推敲声律节奏……", "落笔成文……"];
  let hsLoadT, hsTipT;

  // 两段式核心流程，主入口与历史入口共用。
  // showResult()：核心就绪、即将切到 result 时由调用方收尾（冲满进度条等）。
  // 返回 {status}；调用方据此决定 loading 页后续（blocked/error 分流）。
  async function runTwoStage(name){
    let core;
    try {
      core = await window.NAMING_DATA.fetchCore(name);
    } catch(err){
      console.error("[two-stage] fetchCore 异常:", err);
      return { status: "error" };
    }
    if(core.status === "invalid") return { status: "error" };
    if(core.status === "blocked") return { status: "blocked" };
    if(core.status !== "ok") return { status: "error" };

    try {
      NM.pushHistory(name);
      if(core.full){
        // 预设/缓存：完整页一次到位
        renderResult(core.data, name);
      }else{
        // 核心页 + 外围占位，并发起第二段
        renderCore(core.data, name);
        window.NAMING_DATA.fetchExtra(name, core.data).then(ex => {
          if(ex.status === "ok") fillExtra(ex.data);
          else { const box = $("#rsExtra"); if(box) box.innerHTML = ""; } // 外围失败：移除占位，保留核心页
        }).catch(err => {
          console.error("[two-stage] fetchExtra 异常:", err);
          const box = $("#rsExtra"); if(box) box.innerHTML = "";
        });
      }
    } catch(err){
      // 渲染抛错绝不能静默卡在 loading：明确返回 error，让调用方回输入页 + toast
      console.error("[two-stage] 渲染异常:", err);
      return { status: "error" };
    }
    return { status: "ok" };
  }
  window.__NM_runTwoStage = runTwoStage;

  // 新四段式流程：hero → core → culture → extra，逐段渲染
  // onHeroReady: hero 渲染完成后的回调（用于切换到 result 场景）
  // 返回 {status}；调用方据此决定 loading 页后续（blocked/error 分流）
  async function runFourStage(name, onHeroReady){
    let hero;
    try {
      hero = await window.NAMING_DATA.fetchHero(name);
    } catch(err){
      console.error("[four-stage] fetchHero 异常:", err);
      return { status: "error" };
    }
    if(hero.status === "invalid") return { status: "error" };
    if(hero.status === "blocked") return { status: "blocked" };
    if(hero.status !== "ok") return { status: "error" };

    try {
      NM.pushHistory(name);

      // 预设/缓存：完整页一次到位
      if(hero.full){
        renderResult(hero.data, name);
        if(onHeroReady) onHeroReady(); // 通知主流程切换场景
        return { status: "ok" };
      }

      // 渲染首屏 + 占位符
      renderHero(hero.data, name);
      if(onHeroReady) onHeroReady(); // 首屏渲染完成，立即通知主流程切换到 result 场景
      let data = hero.data;

      // 第2段：core detail（带重试）
      try {
        const core = await window.NAMING_DATA.fetchCoreDetail(name, data);
        if(core.status === "ok"){
          data = core.data;
          fillCoreDetail(data);
        } else {
          // core 失败重试一次
          const retry = await window.NAMING_DATA.fetchCoreDetail(name, data);
          if(retry.status === "ok"){
            data = retry.data;
            fillCoreDetail(data);
          } else {
            // 仍失败：移除占位，继续下一段
            const box = $("#rsCoreDetail"); if(box) box.innerHTML = "";
          }
        }
      } catch(err){
        console.error("[four-stage] fetchCoreDetail 异常:", err);
        const box = $("#rsCoreDetail"); if(box) box.innerHTML = "";
      }

      // 第3段：culture（不重试）
      try {
        const culture = await window.NAMING_DATA.fetchCulture(name, data);
        if(culture.status === "ok"){
          data = culture.data;
          fillCulture(data);
        } else {
          const box = $("#rsCulture"); if(box) box.innerHTML = "";
        }
      } catch(err){
        console.error("[four-stage] fetchCulture 异常:", err);
        const box = $("#rsCulture"); if(box) box.innerHTML = "";
      }

      // 第4段：extra（不重试）
      try {
        const extra = await window.NAMING_DATA.fetchExtraFinal(name, data);
        if(extra.status === "ok"){
          data = extra.data;
          fillExtraFinal(data);
        } else {
          const box = $("#rsExtra"); if(box) box.innerHTML = "";
        }
      } catch(err){
        console.error("[four-stage] fetchExtraFinal 异常:", err);
        const box = $("#rsExtra"); if(box) box.innerHTML = "";
      }

    } catch(err){
      console.error("[four-stage] 渲染异常:", err);
      return { status: "error" };
    }
    return { status: "ok" };
  }
  window.__NM_runFourStage = runFourStage;

  async function runFromHistory(name){
    NM.setScene("loading");
    const fill = $("#loadFill"), sub = $(".scene-loading .ld-sub");
    if(fill) fill.style.width = "0%";
    if(sub) sub.textContent = HS_TIPS[0];
    let p = 0, ti = 0;
    clearInterval(hsLoadT); clearInterval(hsTipT);
    hsLoadT = setInterval(() => { p = Math.min(p + Math.random()*6 + 2, 85); if(fill) fill.style.width = p + "%"; }, 240);
    hsTipT  = setInterval(() => { ti = (ti+1) % HS_TIPS.length; if(sub) sub.textContent = HS_TIPS[ti]; }, 1600);

    const res = await runFourStage(name);
    clearInterval(hsLoadT); clearInterval(hsTipT);

    if(res.status === "blocked"){ NM.setScene("blocked"); return; }
    if(res.status !== "ok"){ NM.setScene("input"); NM.toast("生成失败，请重试"); return; }

    if(fill) fill.style.width = "100%";
    setTimeout(() => {
      NM.setScene("result"); const sc = $("#resultScroll"); if(sc) sc.scrollTop = 0;
    }, 300);
  }

  // ---------- init ----------
  NM.fitDevice();
  bind();
  $$(".scene").forEach(s => { if(s.dataset.scene !== "input") s.hidden = true; });
})();
