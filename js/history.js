import { state } from "./state.js";
import { esc, safeLocalDate } from "./utils.js";
import { icons } from "./icons.js";
import { showToast } from "./toast.js";

function renderHistoryRows(rows) {
  const historySearch = document.getElementById("historySearch");
  const historyDedup = document.getElementById("historyDedup");
  const hBody = document.getElementById("hBody");
  if (!hBody) return;

  const q = String(historySearch?.value || "").trim().toLowerCase();
  const base = q
    ? rows.filter((r) => {
        const hay = [
          r.business_name,
          r.domain,
          r.contact_value,
          r.contact_method,
        ]
          .map((x) => String(x || "").toLowerCase())
          .join(" | ");
        return hay.includes(q);
      })
    : rows;

  const filtered = (() => {
    if (!(historyDedup?.checked ?? false)) return base;
    const m = new Map();
    for (const r of base) {
      const key = String(r.domain || r.business_name || "")
        .trim()
        .toLowerCase();
      if (!m.has(key)) m.set(key, r);
    }
    return Array.from(m.values());
  })();

  const totalCount = rows.length;
  const uniqueCount = (() => {
    const s = new Set();
    for (const r of rows) {
      s.add(String(r.domain || r.business_name || "").trim().toLowerCase());
    }
    return s.size;
  })();
  const historyTotalCount = document.getElementById("historyTotalCount");
  const historyUniqueCount = document.getElementById("historyUniqueCount");
  if (historyTotalCount) historyTotalCount.textContent = String(totalCount);
  if (historyUniqueCount) historyUniqueCount.textContent = String(uniqueCount);

  if (!filtered.length) {
    hBody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-row">
            <div class="empty-icon">${icons.search}</div>
            <div class="empty-msg">No matching history entries.</div>
            <div class="empty-sub">Try clearing the search box or disabling “Hide duplicates”.</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  hBody.innerHTML = filtered
    .map(
      (r) => `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 12px 16px; font-weight: 600; font-size: 0.85rem;">
            ${esc(r.business_name)}
            ${r.domain ? `<div style="font-size: 0.7rem; color: var(--text-3); font-weight: 500;">${esc(r.domain)}</div>` : ""}
          </td>
          <td style="padding: 12px 16px;">
            <span class="chip ${r.contact_method === "Email" ? "ch-sent" : "ch-warn"}"><span class="cdot"></span>${esc(r.contact_method === "Unknown" ? "No Email" : r.contact_method)}</span>
            <div style="font-size: 0.7rem; color: var(--text-3); margin-top: 4px; font-family: monospace;">${esc(r.contact_value || "—")}</div>
          </td>
          <td style="padding: 12px 16px; font-size: 0.75rem; color: var(--text-2); white-space: nowrap;">
            ${safeLocalDate(r.timestamp)}
          </td>
          <td style="padding: 12px 16px; text-align: right;">
            <button class="hdel" onclick="deleteHistory(${r.id})" title="Remove from list (will contact again)" aria-label="Delete history row">${icons.trash}</button>
          </td>
        </tr>
      `,
    )
    .join("");
}

export function closeHistoryModal() {
  const hModal = document.getElementById("historyModal");
  if (!hModal) return;
  hModal.classList.remove("show");
  document.body.style.overflow = "";
}

export async function loadHistory() {
  try {
    const res = await fetch("http://localhost:3000/api/history");
    const data = await res.json();
    const rows = data.history || [];
    state.historyRows = rows;

    if (!rows.length) {
      const historyTotalCount = document.getElementById("historyTotalCount");
      const historyUniqueCount = document.getElementById("historyUniqueCount");
      if (historyTotalCount) historyTotalCount.textContent = "0";
      if (historyUniqueCount) historyUniqueCount.textContent = "0";
      document.getElementById("hBody").innerHTML = `
        <tr>
          <td colspan="4">
            <div class="empty-row">
              <div class="empty-icon">${icons.info}</div>
              <div class="empty-msg">No contact history yet.</div>
              <div class="empty-sub">Run a campaign to generate drafts and log outreach.</div>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    renderHistoryRows(rows);
  } catch (e) {
    console.error(e);
    document.getElementById("hBody").innerHTML =
      '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Error loading history</td></tr>';
  }
}

export async function openHistoryModal() {
  const hModal = document.getElementById("historyModal");
  if (!hModal) return;

  hModal.classList.add("show");
  document.body.style.overflow = "hidden";
  document.getElementById("hBody").innerHTML =
    '<tr><td colspan="4" style="text-align:center; padding: 20px;">Loading...</td></tr>';
  await loadHistory();
}

export async function deleteHistory(id) {
  if (
    !confirm(
      "Remove this business from history? They will be eligible to receive messages again if you run a search.",
    )
  )
    return;
  try {
    await fetch(`http://localhost:3000/api/history/${id}`, {
      method: "DELETE",
    });
    showToast({ type: "success", title: "Removed", message: "History entry removed" });
    loadHistory();
  } catch (e) {
    alert("Failed to delete history row");
  }
}

export function wireHistoryUi() {
  const hModal = document.getElementById("historyModal");
  const historySearch = document.getElementById("historySearch");
  const historyDedup = document.getElementById("historyDedup");

  hModal?.addEventListener("click", (e) => {
    if (e.target === hModal) closeHistoryModal();
  });

  historySearch?.addEventListener("input", () => {
    renderHistoryRows(state.historyRows);
  });

  historyDedup?.addEventListener("change", () => {
    renderHistoryRows(state.historyRows);
  });
}
