import { applyTheme, toggleTheme } from "./js/theme.js";
import { updateModeTag } from "./js/modeTag.js";
import { setFilter } from "./js/resultsTable.js";
import { runOutreach } from "./js/outreach.js";
import { openModal, closeModal, copyEmail } from "./js/modal.js";
import { icons } from "./js/icons.js";
import { copyToClipboard, showToast } from "./js/toast.js";
import {
  openHistoryModal,
  closeHistoryModal,
  deleteHistory,
  wireHistoryUi,
} from "./js/history.js";

applyTheme();
updateModeTag();

// Icons (monochrome SVG)
const brandLogo = document.getElementById("brandLogo");
if (brandLogo) brandLogo.innerHTML = icons.radar;
const historyIcon = document.getElementById("historyIcon");
if (historyIcon) historyIcon.innerHTML = icons.history;
const btnIcon = document.getElementById("btnIcon");
if (btnIcon && !btnIcon.innerHTML.trim()) btnIcon.innerHTML = icons.play;

// Quick start example queries
document.querySelectorAll(".qs-pill").forEach((b) => {
  b.addEventListener("click", () => {
    const qInput = document.getElementById("queryInput");
    const q = b.getAttribute("data-q") || "";
    if (qInput) qInput.value = q;
    const runBtn = document.getElementById("runBtn");
    runBtn?.focus();
  });
});

// Copy buttons (email/phone) in results table
document.addEventListener("click", async (e) => {
  const btn = e.target?.closest?.("[data-copy]");
  if (!btn) return;
  const v = btn.getAttribute("data-copy");
  if (!v) return;
  try {
    await copyToClipboard(v);
  } catch {
    showToast({ type: "error", title: "Copy failed", message: "Clipboard not available" });
  }
});

// Wire key handlers (equivalent to old script.js)
const qInput = document.getElementById("queryInput");
qInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") runOutreach();
});

const modal = document.getElementById("modal");
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

wireHistoryUi();

// Expose functions for inline onclick handlers
window.toggleTheme = toggleTheme;
window.updateModeTag = updateModeTag;
window.setFilter = setFilter;
window.runOutreach = runOutreach;
window.openModal = openModal;
window.closeModal = closeModal;
window.copyEmail = copyEmail;
window.openHistoryModal = openHistoryModal;
window.closeHistoryModal = closeHistoryModal;
window.deleteHistory = deleteHistory;
