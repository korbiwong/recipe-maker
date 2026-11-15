// Standalone bridge: gives the page the same `window.claude.use("sample")` it has inside Claude,
// but talks to the Claude API directly with the API key the user saved on this device.
import Anthropic from "@anthropic-ai/sdk";

const KEY = "recipe-maker-api-key";
const MODEL = "claude-opus-5-5";

function getKey() { try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; } }
function fail(code) { const e = new Error(code); e.code = code; return e; }

// Phone photos are large; scale down before upload.
async function shrink(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error("image")); i.src = url; });
    const k = Math.min(1, 1568 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(img.naturalWidth * k)); c.height = Math.max(1, Math.round(img.naturalHeight * k));
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    return { media_type: "image/jpeg", data: c.toDataURL("image/jpeg", 0.85).split(",")[1] };
  } finally { URL.revokeObjectURL(url); }
}

async function ask(input, opts = {}) {
  const key = getKey();
  if (!key) { openSettings(); throw fail("no_key"); }
  const content = [];
  for (const f of opts.images || []) {
    try { content.push({ type: "image", source: Object.assign({ type: "base64" }, await shrink(f)) }); }
    catch (e) { throw fail("image_rejected"); }
  }
  content.push({ type: "text", text: String(input) });
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  let msg;
  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 32000,
      // The first-pass menu is a short list, so it runs at low effort; full recipes and plans get more.
      output_config: { effort: /menu ideas only/.test(String(input)) ? "low" : "medium" },
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      messages: [{ role: "user", content }],
    }, { signal: opts.signal });
    if (opts.onText) stream.on("text", (delta, snapshot) => opts.onText({ text: snapshot, delta }));
    msg = await stream.finalMessage();
  } catch (e) {
    if ((opts.signal && opts.signal.aborted) || e instanceof Anthropic.APIUserAbortError) throw fail("cancelled");
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) throw fail("bad_key");
    if (e instanceof Anthropic.RateLimitError) throw fail("rate_limited");
    if (e instanceof Anthropic.BadRequestError) throw fail("bad_request");
    throw fail("upstream_error");
  }
  if (msg.stop_reason === "refusal") throw fail("refused");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  if (!text.trim()) throw fail("empty_completion");
  return { text, truncated: msg.stop_reason === "max_tokens" };
}

const sample = (input, opts) => ask(input, opts);
sample.json = async (input, opts) => {
  const { text } = await ask(input, opts);
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw fail("invalid_json");
  try { return JSON.parse(text.slice(a, b + 1)); } catch (e) { throw fail("invalid_json"); }
};
sample.limits = async () => ({ images: { maxCount: 8, maxInputBytes: 40 * 1024 * 1024, mediaTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"] } });

if (!window.claude) window.claude = { use: (name) => Promise.resolve(name === "sample" ? sample : null) };

/* ---- API key settings ---- */
let dlg = null, btn = null;
function label() { if (btn) btn.textContent = getKey() ? "API key ✓" : "設定 API key"; }
function openSettings() { if (dlg && !dlg.open) { dlg.querySelector("input").value = getKey(); dlg.showModal(); } }
function h(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
document.addEventListener("DOMContentLoaded", () => {
  dlg = h("dialog", "keydlg");
  dlg.appendChild(h("h2", null, "你嘅 Claude API key"));
  dlg.appendChild(h("p", "desc", "呢個獨立版要用你自己嘅 Anthropic API key 先可以出餸同寫食譜，會按用量收費。條 key 只會存喺呢部裝置嘅瀏覽器入面，並且只會直接傳去 Anthropic。"));
  const inp = h("input"); inp.type = "password"; inp.placeholder = "sk-ant-…"; inp.autocomplete = "off"; inp.setAttribute("aria-label", "API key");
  dlg.appendChild(inp);
  const row = h("div", "acts2");
  const save = h("button", "primary", "儲存"); save.type = "button";
  save.onclick = () => { const v = inp.value.trim(); try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} label(); dlg.close(); };
  const del = h("button", "btn2", "移除"); del.type = "button";
  del.onclick = () => { try { localStorage.removeItem(KEY); } catch (e) {} inp.value = ""; label(); dlg.close(); };
  const close = h("button", "btn2", "關閉"); close.type = "button"; close.onclick = () => dlg.close();
  row.appendChild(save); row.appendChild(del); row.appendChild(close); dlg.appendChild(row);
  const link = h("a", "linkbtn", "去 Anthropic Console 開 API key"); link.href = "https://console.anthropic.com/settings/keys"; link.target = "_blank"; link.rel = "noopener";
  dlg.appendChild(link);
  document.body.appendChild(dlg);
  btn = h("button", "chip"); btn.type = "button"; btn.onclick = openSettings; label();
  const tabs = document.querySelector(".tabs"); if (tabs) tabs.appendChild(btn);
});
if ("serviceWorker" in navigator) window.addEventListener("load", () => { navigator.serviceWorker.register("sw.js").catch(() => {}); });
