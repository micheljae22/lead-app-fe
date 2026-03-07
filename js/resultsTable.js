import { state } from "./state.js";
import { chipFor, esc } from "./utils.js";

function renderTable() {
  const tBody = document.getElementById("tBody");
  if (!tBody) return;

  const rows = state.allResults.filter((r) => {
    if (state.activeFilter === "all") return true;
    if (state.activeFilter === "sent") return r.emailStatus === "sent";
    if (state.activeFilter === "noemail")
      return (
        r.emailStatus === "no email found" ||
        r.emailStatus === "no website" ||
        r.emailStatus === "skipped"
      );
    if (state.activeFilter === "failed")
      return (
        r.emailStatus !== "sent" &&
        r.emailStatus !== "no email found" &&
        r.emailStatus !== "no website" &&
        r.emailStatus !== "skipped"
      );
    return true;
  });

  if (!rows.length) {
    tBody.innerHTML = `<tr><td colspan="8"><div class="empty-row"><div class="empty-icon">🔍</div><div class="empty-msg">${state.allResults.length ? "No entries in this category." : "No results yet. Run a search above."}</div></div></td></tr>`;
    return;
  }

  tBody.innerHTML = "";
  rows.forEach((r, i) => {
    const gi = state.allResults.indexOf(r);
    const isYP = r.source === "Yellow Pages";

    const src = r.source
      ? `<span class="src-pill ${isYP ? "src-y" : "src-g"}"><span class="src-dot"></span>${esc(r.source)}</span>`
      : "—";

    const site = r.url
      ? `<a class="site-link" href="${esc(r.url)}" target="_blank" rel="noopener" title="${esc(r.url)}">${esc(
          r.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        )}</a>`
      : `<span style="color:var(--text-3)">—</span>`;

    let emailHtml = `<span style="color:var(--text-3)">—</span>`;
    if (r.email) {
      emailHtml = r.emailGuessed
        ? `<span class="email-v e-guess" title="Guessed from domain">~ ${esc(r.email)}</span>`
        : `<span class="email-v e-found">${esc(r.email)}</span>`;
    }

    let phoneHtml = `<span style="color:var(--text-3)">—</span>`;
    if (r.phone) {
      phoneHtml = `<span class="email-v" style="color:var(--amber)">📞 ${esc(r.phone)}</span>`;
    } else if (r.socials && r.socials.length > 0) {
      const fb = r.socials.find((s) => s.url.includes("facebook.com"));
      const ig = r.socials.find((s) => s.url.includes("instagram.com"));

      if (ig) {
        const handle = ig.url
          .split("instagram.com/")[1]
          ?.replace(/\//g, "");
        phoneHtml = `<a class="site-link" href="https://ig.me/m/${handle}" target="_blank">💬 Direct Message</a>`;
      } else if (fb) {
        const handle = fb.url.split("facebook.com/")[1]?.split("/")[0];
        phoneHtml = `<a class="site-link" href="https://m.me/${handle}" target="_blank">💬 Direct Message</a>`;
      } else {
        phoneHtml = `<a class="site-link" href="${esc(r.socials[0].url)}" target="_blank">💬 Social Profile</a>`;
      }
    }

    const vbtn = r.generatedEmail
      ? `<button class="vbtn" onclick="openModal(${gi})">✉ View Draft</button>`
      : `<span style="color:var(--text-3)">—</span>`;

    const meta = [];
    if (r.rating) meta.push("★ " + esc(r.rating));
    if (r.address) meta.push(esc(r.address));

    tBody.innerHTML += `
      <tr class="drow">
        <td style="color:var(--text-3);font-size:.72rem;font-weight:600">${i + 1}</td>
        <td>
          <div class="biz-name">${esc(r.businessName || "Unknown")}</div>
          ${meta.length ? `<div class="biz-meta">${meta.join(" · ")}</div>` : ""}
        </td>
        <td>${src}</td>
        <td>${site}</td>
        <td>${emailHtml}</td>
        <td>${phoneHtml}</td>
        <td>${chipFor(r.emailStatus)}</td>
        <td>${vbtn}</td>
      </tr>`;
  });
}

export function setFilter(f) {
  state.activeFilter = f;
  document
    .querySelectorAll(".ftab")
    .forEach((b) => b.classList.toggle("active", b.dataset.filter === f));
  renderTable();
}

export function renderResults(results) {
  state.allResults = results;

  let sent = 0,
    noEmail = 0,
    failed = 0;

  results.forEach((r) => {
    if (r.emailStatus === "sent") sent++;
    else if (
      r.emailStatus === "no email found" ||
      r.emailStatus === "no website" ||
      r.emailStatus === "skipped"
    )
      noEmail++;
    else failed++;
  });

  const stTotal = document.getElementById("stTotal");
  const stSent = document.getElementById("stSent");
  const stSkip = document.getElementById("stSkip");
  const stFail = document.getElementById("stFail");
  if (stTotal) stTotal.textContent = results.length;
  if (stSent) stSent.textContent = sent;
  if (stSkip) stSkip.textContent = noEmail;
  if (stFail) stFail.textContent = failed;

  const fcAll = document.getElementById("fcAll");
  const fcSent = document.getElementById("fcSent");
  const fcSkip = document.getElementById("fcSkip");
  const fcFail = document.getElementById("fcFail");
  if (fcAll) fcAll.textContent = results.length;
  if (fcSent) fcSent.textContent = sent;
  if (fcSkip) fcSkip.textContent = noEmail;
  if (fcFail) fcFail.textContent = failed;

  state.activeFilter = "all";
  document
    .querySelectorAll(".ftab")
    .forEach((b) => b.classList.toggle("active", b.dataset.filter === "all"));

  renderTable();

  const autoScrollToggle = document.getElementById("autoScroll");
  const tblScroll = document.getElementById("tblScroll");
  if ((autoScrollToggle?.checked ?? false) && tblScroll) {
    tblScroll.scrollTop = tblScroll.scrollHeight;
  }
}
