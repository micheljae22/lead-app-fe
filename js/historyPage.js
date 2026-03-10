import { applyTheme, toggleTheme } from "./theme.js";
import { icons } from "./icons.js";
import { loadHistory, wireHistoryUi } from "./history.js";

applyTheme();

const brandLogo = document.getElementById("brandLogo");
if (brandLogo) brandLogo.innerHTML = icons.radar;

const themeBtn = document.getElementById("themeBtn");
if (themeBtn) {
  themeBtn.innerHTML = document.documentElement.getAttribute("data-theme") === "dark" ? icons.sun : icons.moon;
  themeBtn.addEventListener("click", () => {
    toggleTheme();
    themeBtn.innerHTML = document.documentElement.getAttribute("data-theme") === "dark" ? icons.sun : icons.moon;
  });
}

wireHistoryUi();

const refreshBtn = document.getElementById("historyRefresh");
refreshBtn?.addEventListener("click", () => loadHistory());

await loadHistory();
