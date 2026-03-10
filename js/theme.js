import { icons } from "./icons.js";

let theme = localStorage.getItem("rr-theme") || "light";

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.innerHTML = theme === "dark" ? icons.sun : icons.moon;
}

export function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme();
  localStorage.setItem("rr-theme", theme);
}
