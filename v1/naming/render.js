// 姓名寓意 · 结果页渲染器（1:1 还原版）
// 文案全部来自数据对象，零硬编码。renderResult(data,name) 按模板拼 HTML。
(() => {
  "use strict";
  const NM = window.__NM;
  const esc = NM.esc;

  // 花线分隔标题（金药丸 + 两侧渐隐线）
  const sechead = t => `<div class="rs-sechead"><span class="ln l"></span><h3>${esc(t)}</h3><span class="ln r"></span></div>`;
  // 卡片四角缺口
  const corners = `<span class="corner c-tl"></span><span class="corner c-tr"></span><span class="corner c-bl"></span><span class="corner c-br"></span>`;

  // 声调胶囊柱（每列竖排字，柱高按列序轮换 t0..t3）
  function tones(arr){
    if(!arr || !arr.length) return "";
    return `<div class="rs-tones">` + arr.map((col,i) =>
      `<div class="rs-tone t${i%4}"><span class="dot"></span><span class="stem"></span>` +
      `<div class="cap">` + col.map(c => `<span>${esc(c)}</span>`).join("") + `</div></div>`
    ).join("") + `</div>`;
  }

  // ===== HERO（中文名：拼音+楷体大字 / 标语 / 声调柱） =====
  function mHeroCn(d){
    const chars = d.chars.map(c =>
      `<span class="rs-hero-char"><span class="py">${esc(c.py||"")}</span><span class="ch">${esc(c.ch)}</span></span>`).join("");
    return `<section class="rs-hero">
      <div class="rs-hero-name">${chars}</div>
      <div class="rs-hero-underline"></div>
      <div class="rs-hero-tag">
        <div class="big">${esc(d.hero.big)}${d.isFallback?'<span class="flag">示例</span>':''}</div>
        <div class="desc">${esc(d.hero.desc)}</div>
      </div>
      ${tones(d.hero.tones)}
    </section>`;
  }

  // ===== 嵌字诗（角标 + 双联田字格 + IP；容器自适应高度） =====
  // ===== 嵌字诗（卷轴装饰=整图截图 poem-scroll.png；诗句=DOM文字叠在田字格区，可改） =====
  function mPoem(d){
    const ls = d.poem.lines;
    const half = Math.ceil(ls.length/2);
    const cells = ls.map((l,i) =>
      `<div class="ln${i<half?" l":""}">${esc(l)}</div>`).join("");
    return `<section class="rs-poem">
      <div class="rs-poem-grid">${cells}</div>
    </section>`;
  }

  // ===== 逐字解析（印章字固定 + 出处/释义自适应；flex 流式） =====
  function mAnalysis(d){
    // 去重：叠字名只保留第一次出现的字（如"王娜娜"只显示"王"和"娜"）
    const seen = new Set();
    const unique = d.analysis.filter(a => {
      if(seen.has(a.seal)) return false;
      seen.add(a.seal);
      return true;
    });
    const cls = unique.length >= 3 ? "c3" : "c2";
    const cards = unique.map(a => `
      <div class="rs-char">
        <div class="rs-char-hd">
          <div class="rs-char-seal">${esc(a.seal)}</div>
          <div class="rs-char-src"><div class="q">${esc(a.q)}</div><div class="from">${esc(a.from)}</div></div>
        </div>
        <div class="rs-char-mean">
          <div class="col"><div class="k">本义</div><div class="v1">${esc(a.benyi)}</div></div>
          <div class="col"><div class="k">引申</div><div class="v1">${esc(a.yinshen)}</div></div>
        </div>
        ${corners}
      </div>`).join("");
    return sechead("逐字解析") + `<div class="rs-chars ${cls}">${cards}</div>`;
  }

  // ===== 名字里的祝福 =====
  function mBlessing(d){
    return sechead("名字里的祝福") +
      `<div class="rs-card rs-bless"><div class="t">${esc(d.blessing)}</div>${corners}</div>`;
  }

  // 单张奶白卡（姓氏故事 / 文化）
  function pcard(title, sub, body){
    return `<div class="rs-pcard">
      <div class="pt"><span class="ln"></span><h4>${esc(title)}</h4><span class="ln r"></span></div>
      <div class="sub">${esc(sub)}</div>
      <div class="body">${body}</div>
    </div>`;
  }

  // ===== 姓氏故事 + 音律（并排） =====
  function mSurnameRhythm(d){
    const rhythm = `<div class="rs-rhythm">` + d.rhythm.items.map(i =>
      `<div class="one"><div class="py">${esc(i.py||"—")}</div><div class="tn">${esc(i.tn)}</div></div>`).join("") + `</div>`;
    return `<div class="rs-duo">
      ${pcard("姓氏故事", d.surname.sub, esc(d.surname.body))}
      ${pcard("音律", d.rhythm.sub, rhythm)}
    </div>`;
  }

  // ===== 同姓名人 / 同名星光（3 列） =====
  function mPeople(d, title){
    if(!d.people || !d.people.length) return "";
    const ppl = d.people.map(p => `
      <div class="col">
        <div class="ph"><b>${esc(p.name)}</b><span>${esc(p.tag)}</span></div>
        <div class="work">${esc(p.work)}</div>
        <div class="line">${esc(p.line)}</div>
      </div>`).join("");
    return sechead(title || "同姓名人") + `<div class="rs-people">${ppl}${corners}</div>`;
  }

  // ===== 同名的人（cn 模板的灰底说明块） =====
  function mSameName(d){
    if(!d.sameName) return "";
    const s = d.sameName;
    return sechead(s.title) +
      `<div class="rs-samename"><h4>${esc(s.title)}</h4><div class="role">${esc(s.sub)}</div><div class="body">${esc(s.body)}</div>${corners}</div>`;
  }

  // ===== 同名的「名人」介绍（公众人物声明） =====
  function mFamous(d){
    if(!d.famous) return "";
    const f = d.famous;
    return sechead(f.title) +
      `<div class="rs-famous">
        <h4>${esc(f.title)}</h4>
        <div class="role">${esc(f.role)}</div>
        <div class="desc">${esc(f.desc)}</div>
        <div class="quote">${esc(f.quote)}</div>
        <div class="disc">· 公众人物，以上仅作姓名文化与公开资料的客观介绍，不含评价 ·</div>
        ${corners}
      </div>`;
  }

  // ===== 英文名灵感（3 列） =====
  function mEnglish(d){
    if(!d.english || !d.english.length) return "";
    const en = d.english.map(e => `
      <div class="col">
        <div class="eh"><b>${esc(e.name)}</b><span>${esc(e.ipa||"")}</span></div>
        <div class="src">${esc(e.src)}</div>
        <div class="map">${esc(e.map)}</div>
      </div>`).join("");
    return sechead("英文名灵感") + `<div class="rs-en">${en}${corners}</div>`;
  }

  // ===== 冷知识 =====
  function mFact(d){
    return sechead("冷知识") +
      `<div class="rs-card rs-fact"><div class="t">${esc(d.fact)}</div>${corners}</div>`;
  }

  window.__NM_modules = { sechead, corners, tones, mHeroCn, mPoem, mAnalysis, mBlessing,
    mSurnameRhythm, mPeople, mSameName, mFamous, mEnglish, mFact, pcard };
})();
