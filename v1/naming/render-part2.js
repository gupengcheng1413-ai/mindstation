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

  // —— 组装（外层包 .rs-wrap 居中 1640 内容列） —— //
  function renderResult(d, name){
    const out = [];
    if(d.template === "translit"){
      out.push(mHeroTl(d), mEtymology(d), mPick(d), mCultureVariants(d),
        M.mPeople(d, "同名星光"), M.mFamous(d), M.mFact(d));
    }else{
      out.push(M.mHeroCn(d), M.mPoem(d), M.mAnalysis(d), M.mBlessing(d),
        M.mSurnameRhythm(d), M.mPeople(d, "同姓名人"),
        d.famous ? M.mFamous(d) : M.mSameName(d), M.mEnglish(d), M.mFact(d));
    }
    const bg = `<div class="rs-bg" aria-hidden="true"><img class="bg-whole" src="assets/bg-top.png" alt=""></div>`;
    const head = `<div class="rs-head">
      <button type="button" class="nm-back" data-go="input" aria-label="返回"><img src="assets/nm-back.png" alt=""></button>
      <h1 class="nm-title">姓名寓意</h1>
      <button type="button" class="rs-chip rs-chip-hist" data-go="history">已测姓名</button>
      <button type="button" class="rs-chip rs-chip-again" data-act="again">再测一个</button>
    </div>`;
    $("#resultScroll").innerHTML = bg + `<div class="rs-wrap">${head}${out.join("")}</div>`;
  }
  window.__NM_render = renderResult;

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
      else if(act === "retry")    NM.backToHome();        // blocked 换一个 → 回主页未选择态
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

  // 从 history 点名字 → loading → result（消费 fetchName 四状态：ok→result / blocked→blocked / 其余→input+toast）
  const HS_TIPS = ["正在拆解字义……", "检索古今典故……", "推敲声律节奏……", "落笔成文……"];
  let hsLoadT, hsTipT;
  async function runFromHistory(name){
    NM.setScene("loading");
    const fill = $("#loadFill"), sub = $(".scene-loading .ld-sub");
    if(fill) fill.style.width = "0%";
    if(sub) sub.textContent = HS_TIPS[0];
    let p = 0, ti = 0;
    clearInterval(hsLoadT); clearInterval(hsTipT);
    hsLoadT = setInterval(() => { p = Math.min(p + Math.random()*6 + 2, 85); if(fill) fill.style.width = p + "%"; }, 240);
    hsTipT  = setInterval(() => { ti = (ti+1) % HS_TIPS.length; if(sub) sub.textContent = HS_TIPS[ti]; }, 1600);

    const res = await window.NAMING_DATA.fetchName(name);
    clearInterval(hsLoadT); clearInterval(hsTipT);

    if(res.status === "blocked"){ NM.setScene("blocked"); return; }
    if(res.status !== "ok"){ NM.setScene("input"); NM.toast("生成失败，请重试"); return; }

    if(fill) fill.style.width = "100%";
    setTimeout(() => {
      NM.pushHistory(name); renderResult(res.data, name);
      NM.setScene("result"); const sc = $("#resultScroll"); if(sc) sc.scrollTop = 0;
    }, 300);
  }

  // ---------- init ----------
  NM.fitDevice();
  bind();
  $$(".scene").forEach(s => { if(s.dataset.scene !== "input") s.hidden = true; });
})();
