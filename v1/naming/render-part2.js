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
      `<div class="pk"><div class="ph"><b>${esc(c.v)}</b></div><div class="mean">${esc(c.k)}</div></div>`).join("");
    return M.sechead("词源") +
      `<div class="rs-pick"><div class="rs-pick-grid">${cols}</div>
        <div class="note">${esc(d.etymology.note)}</div>${M.corners}</div>`;
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
        M.mSameName(d), M.mFamous(d), M.mEnglish(d), M.mFact(d));
    }
    const A = "assets/bg/";
    const bg = `<div class="rs-bg" aria-hidden="true">
      <img class="b142" src="${A}e142.svg" alt="">
      <img class="b125" src="${A}e125.svg" alt="">
      <img class="b121" src="${A}e121.svg" alt="">
      <img class="b150" src="${A}e150.svg" alt="">
      <img class="b149" src="${A}e149.svg" alt="">
      <img class="b151" src="${A}e151.svg" alt="">
      <img class="b148" src="${A}e148.svg" alt="">
      <div class="egg-clip egg1"><img src="${A}egg.png" alt=""></div>
      <div class="egg-clip egg2"><img src="${A}egg.png" alt=""></div>
      <img class="bU1" src="${A}union.svg" alt="">
      <img class="bU2" src="${A}union1.svg" alt="">
    </div>`;
    $("#resultScroll").innerHTML = bg + `<div class="rs-wrap">${out.join("")}</div>`;
  }
  window.__NM_render = renderResult;

  // ============================================================
  //  事件绑定
  // ============================================================
  function bind(){
    // input 页两按钮
    $$(".in-btn[data-act]").forEach(b => b.addEventListener("click", () => {
      if(b.dataset.act === "scan") NM.setScene("scan");
      else NM.gotoConfirm(true);
    }));

    // confirm 确定
    const input = $("#nameInput"), ok = $("#confirmOk");
    if(ok) ok.addEventListener("click", () => NM.submitName(input.value));
    if(input) input.addEventListener("keydown", e => { if(e.key === "Enter") NM.submitName(input.value); });

    // blocked 换一个
    $$('[data-act="retry"]').forEach(b => b.addEventListener("click", () => NM.gotoConfirm(true)));
    // result 再测一个
    $$('[data-act="again"]').forEach(b => b.addEventListener("click", () => NM.gotoConfirm(true)));

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

  // 从 history 点名字 → loading → result（命中预设/真名走数据，否则兜底）
  async function runFromHistory(name){
    NM.setScene("loading");
    const fill = $("#loadFill"); if(fill) fill.style.width = "0%";
    const data = await window.NAMING_DATA.fetchName(name);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random()*20 + 10;
      if(fill) fill.style.width = Math.min(p,100) + "%";
      if(p >= 100){ clearInterval(t); setTimeout(() => {
        if(!data){ NM.setScene("input"); return; }
        NM.pushHistory(name); renderResult(data, name);
        NM.setScene("result"); const sc = $("#resultScroll"); if(sc) sc.scrollTop = 0;
      }, 220); }
    }, 200);
  }

  // ---------- init ----------
  NM.fitDevice();
  bind();
  $$(".scene").forEach(s => { if(s.dataset.scene !== "input") s.hidden = true; });
})();
