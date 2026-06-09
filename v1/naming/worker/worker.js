import { hitBlocklist } from "./blocklist.js";
import { SYSTEM_PROMPT, userMessage } from "./prompt.js";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status, headers: { "Content-Type": "application/json", ...CORS }
  });

// 清洗：去控制字符（含换行/制表/DEL），保留空格（音译名如 Elon Musk），截断 16 字防注入
function clean(raw) {
  return String(raw || "").replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 16);
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const url = new URL(request.url);
    const name = clean(url.searchParams.get("name"));

    if (!name || name.length < 2) return json({ status: "error", message: "姓名无效" });
    if (hitBlocklist(name)) return json({ status: "blocked", reason: "内容不当" });

    try {
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.DEEPSEEK_KEY}` },
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          response_format: { type: "json_object" },
          max_tokens: 3000,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage(name) }
          ]
        })
      });
      if (!resp.ok) return json({ status: "error", message: "上游错误" });
      const out = await resp.json();
      const content = out.choices?.[0]?.message?.content;
      if (!content) return json({ status: "error", message: "上游返回异常" });
      const data = JSON.parse(content);
      if (data.blocked) return json({ status: "blocked", reason: "无法解析为人名" });
      return json({ status: "ok", data });
    } catch (e) {
      return json({ status: "error", message: "生成失败" });
    }
  }
};
