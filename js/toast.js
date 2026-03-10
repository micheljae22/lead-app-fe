import { icons } from "./icons.js";

let host;

function ensureHost() {
  if (host) return host;
  host = document.getElementById("toastHost");
  if (host) return host;

  host = document.createElement("div");
  host.id = "toastHost";
  host.className = "toast-host";
  document.body.appendChild(host);
  return host;
}

export function showToast({ type = "info", title = "", message = "" }) {
  const h = ensureHost();

  const el = document.createElement("div");
  el.className = `toast toast-${type}`;

  const icon =
    type === "success" ? icons.check : type === "error" ? icons.alert : icons.info;

  el.innerHTML = `
    <div class="toast-ic">${icon}</div>
    <div class="toast-txt">
      ${title ? `<div class="toast-title">${title}</div>` : ""}
      <div class="toast-msg">${message}</div>
    </div>
    <button class="toast-x" type="button" aria-label="Close toast">×</button>
  `;

  const rm = () => {
    el.classList.add("toast-out");
    el.addEventListener(
      "animationend",
      () => {
        el.remove();
      },
      { once: true },
    );
  };

  el.querySelector(".toast-x").addEventListener("click", rm);
  h.appendChild(el);

  window.setTimeout(rm, 2800);
}

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(String(text ?? ""));
  showToast({ type: "success", title: "Copied", message: "Copied to clipboard" });
}
