export function updateModeTag() {
  const emailTemplate = document.getElementById("emailTemplate");
  const t = document.getElementById("modeTag");
  if (!emailTemplate || !t) return;

  const has = emailTemplate.value.trim().length > 0;
  t.className = "mode-tag " + (has ? "mt-template" : "mt-ai");
  t.textContent = has ? "Template Mode" : "AI Mode";
}
