let theme = localStorage.getItem("rr-theme") || "light";

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.getElementById("themeBtn");
  if (btn) btn.textContent = theme === "dark" ? "☀️" : "🌙";
}

export function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  applyTheme();
  localStorage.setItem("rr-theme", theme);
}
