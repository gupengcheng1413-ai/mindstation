/* ============================================================
   姓名寓意 · 数据层 part2 — 吴玉胜 / 乔布斯 / 埃隆马斯克 + 兜底模板
   内容取自 Figma 4901:8765 / 4879:6699 / 4879:5185
   ============================================================ */
(function (root) {
  "use strict";
  var NAMES = root.NAMES || (root.NAMES = {});

  /* ---------------- 吴玉胜（cn） ---------------- */
  NAMES["吴玉胜"] = {
    template: "cn",
    chars: [
      { ch: "吴", py: "wú" },
      { ch: "玉", py: "yù" },
      { ch: "胜", py: "shèng" }
    ],
    hero: {
      big: "玉质温润 所向皆胜",
      desc: "内里温润如玉，骨子里却有股不服输的劲，既雅且有锋芒。",
      tones: [["温", "润"], ["坚", "毅"], ["清", "雅"], ["进", "取"]]
    },
    poem: { lines: ["吴山叠翠映朝晖", "玉树临风格自非", "胜境从来酬有志", "一肩明月伴云归"] },
    analysis: [
      { seal: "吴", q: "吴山点点愁", from: "白居易《长相思》", benyi: "古国名、大声", benyiSub: "江南风物，温雅之乡", yinshen: "钟灵毓秀", yinshenSub: "温雅有节" },
      { seal: "玉", q: "言念君子，温其如玉", from: "《诗经 · 秦风》", benyi: "美石，温润", benyiSub: "君子如玉", yinshen: "品德高洁", yinshenSub: "温润有光" },
      { seal: "胜", q: "山阴道上，应接不暇", from: "《世说新语》", benyi: "胜利、优美", benyiSub: "出众不凡", yinshen: "更胜一筹", yinshenSub: "志在必得" }
    ],
    blessing: "以「玉」养性、以「胜」立志，长辈盼你做个温润却有锋芒的人，柔中带刚，恰到好处。",
    surname: { sub: "江南大姓 · 源自姬姓", body: "出自姬姓，周太王长子泰伯让国奔吴，建吴国于江南；后人以国为姓，是典型的江南望族。" },
    rhythm: { sub: "阳 去 去，平起重收", items: [{ py: "wú", tn: "阳平" }, { py: "yù", tn: "去声" }, { py: "shèng", tn: "去声" }] },
    people: [
      { name: "吴承恩", tag: "明 · 小说家", work: "《西游记》", line: "敢问路在何方" },
      { name: "吴道子", tag: "唐 · 画圣", work: "吴带当风", line: "衣袂飘举，妙绝古今" },
      { name: "吴敬梓", tag: "清 · 小说家", work: "《儒林外史》", line: "功名富贵无凭据" }
    ],
    sameName: {
      title: "同名的人",
      sub: "江南常见的雅致名",
      body: "「吴」是江南大姓，「玉胜」寄托温润与争先——同名者多分布于江浙一带，常见于书香或经商之家，名字透着温雅又要强的气质。"
    },
    english: [
      { name: "Jasper", ipa: "[ˈdʒæspər]", src: "碧玉、玉石", map: "对应「玉」" },
      { name: "Victor", ipa: "[ˈvɪktər]", src: "拉丁语「胜利者」", map: "对应「胜」" },
      { name: "Wilson", ipa: "[ˈwɪlsən]", src: "「意志之子」", map: "音近「吴」" }
    ],
    fact: "「吴」字本义是「大声说话」，从口从矢，是个会意字——天生自带一点存在感。"
  };

  /* ---------------- 乔布斯（translit） ---------------- */
  NAMES["乔布斯"] = {
    template: "translit",
    kind: "音译 · Jobs",
    title: "乔布斯",
    hero: {
      big: "专注而笃定 化繁为简",
      desc: "一个英文姓氏的音译，本义朴素，却因一个人而成了「极致」的代名词。",
      tones: [["专", "注"], ["笃", "定"], ["化繁", "为简"], ["坚韧"]]
    },
    etymology: {
      sub: "希伯来 → 英语姓氏",
      cols: [
        { k: "词根", v: "Job" },
        { k: "希伯来", v: "Iyov" },
        { k: "含义", v: "受苦者" },
        { k: "现代", v: "Jobs" }
      ],
      note: "坚忍的人 源自《圣经》约伯以历经磨难仍守信念著称"
    },
    pick: {
      sub: "为何用「乔布斯」译 Jobs",
      items: [
        { b: "乔", tip: "高大、乔木", mean: "取挺拔向上之意" },
        { b: "布", tip: "布帛、传布", mean: "质朴务实" }
      ],
      note: "音义贴合 三字稳重，朗朗上口"
    },
    culture: { sub: "常见的英语职业姓氏", body: "源自中世纪以「职业 / 圣经名」取姓的传统。和 Smith、Baker 一样，是英语世界里很普通的一个姓。" },
    variants: {
      sub: "Jobs",
      items: [
        { b: "Job", s: "本名" },
        { b: "Joby", s: "昵称" },
        { b: "Jobson", s: "「Job 之子」" },
        { b: "Joby", s: "古拼写" }
      ]
    },
    people: [
      { name: "Job 约伯", tag: "圣经 · 人物", work: "《约伯记》", line: "历尽苦难仍守信，坚忍的象征" },
      { name: "Steve Jobs", tag: "美 · 企业家", work: "Stay Hungry", line: "求知若饥，虚心若愚" },
      { name: "Jobson", tag: "英 · 姓氏", work: "Patronymic", line: "中世纪「Job 之子」的衍生姓" }
    ],
    famous: {
      title: "同名的「乔布斯」",
      role: "知名科技企业家 · 苹果联合创始人",
      desc: "史蒂夫·乔布斯（Steve Jobs，1955–2011），苹果公司联合创始人，主导 Mac、iPod、iPhone、iPad 等产品，深刻改变了个人电脑、音乐与移动通信产业，是改变世界的科技先驱之一。",
      quote: "「Stay hungry, stay foolish. 求知若饥，虚心若愚。」"
    },
    fact: "Jobs 的词根 Job 在《圣经》里是「约伯」——一个以坚忍闻名的人物，和「工作」其实同源。"
  };

  /* ---------------- 埃隆马斯克（translit） ---------------- */
  NAMES["埃隆马斯克"] = {
    template: "translit",
    kind: "音译 · Elon Musk",
    title: "埃隆马斯克",
    hero: {
      big: "天马行空 奔向星辰",
      desc: "名 Elon + 姓 Musk 的音译，组合起来辽阔又带点野性 像一支射向太空的箭。",
      tones: [["辽", "阔"], ["敢想", "敢做"], ["天马", "行空"], ["向", "上"]]
    },
    etymology: {
      sub: "名源希伯来 · 姓源古英语",
      cols: [
        { k: "Elon", v: "希伯来语" },
        { k: "释义", v: "橡树" },
        { k: "Musk", v: "古英语/波斯" },
        { k: "释义", v: "麝香" }
      ],
      note: "合起来 橡树 + 麝香 坚实而独特"
    },
    pick: {
      sub: "Elon Musk 怎么变成五个汉字",
      items: [
        { b: "埃隆", tip: "音译 Elon", mean: "「隆」取兴隆昌盛之意" },
        { b: "马斯克", tip: "音译 Musk", mean: "纯音译 不取字义 只求贴音" }
      ],
      note: "纯音译 不取字义 只求贴音"
    },
    culture: { sub: "名与姓的不同来路", body: "Elon 是常见希伯来男名，《圣经》中即有此名；Musk 作姓氏较罕见，多见于英国与南非移民后裔。" },
    variants: {
      sub: "Elon",
      items: [
        { b: "Elan", s: "法语变体" },
        { b: "Ilan", s: "现代希伯来" },
        { b: "Alon", s: "「橡树」异写" },
        { b: "Elona", s: "女性形" }
      ]
    },
    people: [
      { name: "Elon 长老", tag: "圣经 · 士师", work: "《士师记》", line: "以色列士师之一，治世十年" },
      { name: "Elon University", tag: "美 · 名校", work: "Oak 橡树", line: "校名即取「橡树」之意，建于 1889" },
      { name: "Musk 麝香", tag: "香料 · 词源", work: "梵语 muṣká", line: "古代最珍贵的天然香料之一" }
    ],
    famous: {
      title: "同名的「埃隆马斯克」",
      role: "知名科技企业家 · 特斯拉与 SpaceX 创始人",
      desc: "埃隆·马斯克（Elon Musk，1971 年生），特斯拉、SpaceX 创始人，亦创办 PayPal、Neuralink 等公司，业务横跨电动车、航天与人工智能，是当代最具影响力的科技创业者之一。",
      quote: "「当某件事足够重要时，即使胜算不大，你也应该去做。」"
    },
    fact: "Elon 在希伯来语里是「橡树」，Musk 是「麝香」——一个名字里同时藏着大树和香气。"
  };

  root.NAMES = NAMES;
})(window);
