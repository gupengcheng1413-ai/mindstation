// 四类敏感词（演示集，部署后按需扩充）。放后端，用户不可见。
const WORDS = [
  // 政治敏感
  "习近平", "法轮功", "台独", "藏独",
  // 脏话辱骂
  "傻逼", "操你", "草泥马", "他妈的", "fuck", "shit",
  // 色情
  "做爱", "性交", "porn", "av女优",
  // 暴恐
  "炸弹", "恐怖袭击", "杀人", "枪支"
];

export function hitBlocklist(s) {
  const low = String(s || "").toLowerCase();
  return WORDS.some(w => low.includes(w.toLowerCase()));
}
