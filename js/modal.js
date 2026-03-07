import { state } from "./state.js";
import { chipFor, esc } from "./utils.js";

export function openModal(idx) {
  const r = state.allResults[idx];
  if (!r) return;

  const modal = document.getElementById("modal");
  if (!modal) return;

  document.getElementById("mBiz").textContent = r.businessName || "Unknown Business";
  document.getElementById("mUrl").textContent = r.url || "";
  document.getElementById("mEmail").textContent = r.email || "—";
  document.getElementById("mRating").textContent = r.rating || "—";
  document.getElementById("mAddr").textContent = r.address || "—";

  const extras = [];
  if (r.phone) extras.push(`📞 ${r.phone}`);
  if (r.socialLink) extras.push(`💬 ${r.socialLink}`);
  document.getElementById("mExtras").innerHTML = extras.length
    ? extras.map(esc).join(" &nbsp; ")
    : "—";

  document.getElementById("mBody").textContent =
    r.generatedEmail || "No message body available.";
  document.getElementById("mChips").innerHTML = chipFor(r.emailStatus);

  const cb = document.getElementById("copyBtn");
  cb.textContent = "📋 Copy Email Body";
  cb.classList.remove("ok");

  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("show");
  document.body.style.overflow = "";
}

export function copyEmail() {
  navigator.clipboard
    .writeText(document.getElementById("mBody").textContent)
    .then(() => {
      const cb = document.getElementById("copyBtn");
      cb.textContent = "✓ Copied to clipboard!";
      cb.classList.add("ok");
      setTimeout(() => {
        cb.textContent = "📋 Copy Email Body";
        cb.classList.remove("ok");
      }, 2500);
    });
}
