export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function chipFor(st) {
  const M = {
    sent: ["ch-sent", "Email Sent"],
    "sms sent": ["ch-sent", "SMS Sent"],
    "dm required": ["ch-warn", "DM Required"],
    "already contacted": ["ch-warn", "Already Contacted"],
    "no email found": ["ch-warn", "No Cont Info"],
    "no website": ["ch-warn", "No Website"],
    skipped: ["ch-warn", "Skipped"],
    "failed to send": ["ch-fail", "Send Failed"],
    "generation failed": ["ch-fail", "AI Error"],
    failed: ["ch-fail", "Failed"],
  };
  const [cls, lbl] = M[st] || ["ch-warn", st || "—"];
  return `<span class="chip ${cls}"><span class="cdot"></span>${lbl}</span>`;
}

export function safeLocalDate(raw) {
  if (!raw) return "—";
  const d1 = new Date(raw);
  if (!Number.isNaN(d1.getTime())) return d1.toLocaleString();
  const d2 = new Date(String(raw) + "Z");
  if (!Number.isNaN(d2.getTime())) return d2.toLocaleString();
  return "—";
}
