import { applyTheme, toggleTheme } from "./js/theme.js";
import { updateModeTag } from "./js/modeTag.js";
import { setFilter } from "./js/resultsTable.js";
import { runOutreach } from "./js/outreach.js";
import { openModal, closeModal, copyEmail } from "./js/modal.js";
import {
  openHistoryModal,
  closeHistoryModal,
  deleteHistory,
  wireHistoryUi,
} from "./js/history.js";

applyTheme();
updateModeTag();

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
