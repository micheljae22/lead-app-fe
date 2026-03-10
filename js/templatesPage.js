import { applyTheme, toggleTheme } from "./theme.js";
import { icons } from "./icons.js";
import { showToast } from "./toast.js";

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

const STORAGE_KEY = "rr-templates-v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readTemplates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((t) => t && typeof t === "object")
      .map((t) => ({
        id: String(t.id || ""),
        name: String(t.name || ""),
        body: String(t.body || ""),
        createdAt: typeof t.createdAt === "string" ? t.createdAt : "",
      }))
      .filter((t) => t.id);
  } catch {
    return [];
  }
}

function writeTemplates(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function samplePreview(body) {
  const sample = {
    businessName: "ABC Dental Clinic",
    website: "example.com",
    query: "cafes in Colombo",
  };
  return String(body || "")
    .replaceAll("{businessName}", sample.businessName)
    .replaceAll("{website}", sample.website)
    .replaceAll("{query}", sample.query);
}

let templates = readTemplates();
let currentTemplateId = null;

const tplList = document.getElementById("tplList");
const tplName = document.getElementById("tplName");
const tplBody = document.getElementById("tplBody");
const tplPreview = document.getElementById("tplPreview");
const saveTemplateBtn = document.getElementById("saveTemplateBtn");
const useTemplateBtn = document.getElementById("useTemplateBtn");
const newTemplateBtn = document.getElementById("newTemplateBtn");
const tplError = document.getElementById("tplError");
const tplNote = document.getElementById("tplNote");

function setEditorState() {
  const isEditing = Boolean(currentTemplateId);
  if (saveTemplateBtn) saveTemplateBtn.textContent = isEditing ? "Save changes" : "Save as new";
  if (saveTemplateBtn) saveTemplateBtn.disabled = false;
  if (useTemplateBtn) useTemplateBtn.disabled = !isEditing;
}

function setMsg(el, msg) {
  if (!el) return;
  const m = String(msg || "").trim();
  el.textContent = m;
  el.style.display = m ? "block" : "none";
}

function clearMsgs() {
  setMsg(tplError, "");
  setMsg(tplNote, "");
}

function getEditorDraft() {
  return {
    name: String(tplName?.value || "").trim(),
    body: String(tplBody?.value || "").trim(),
  };
}

function renderList() {
  if (!tplList) return;

  if (!templates.length) {
    tplList.innerHTML = `
      <div class="empty-row" style="margin: 14px;">
        <div class="empty-icon">${icons.info}</div>
        <div class="empty-msg">No templates yet.</div>
        <div class="empty-sub">Click “New template” to create your first reusable outreach template.</div>
      </div>
    `;
    return;
  }

  tplList.innerHTML = templates
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .map((t) => {
      const active = String(t.id) === String(currentTemplateId);
      return `
        <button
          type="button"
          class="ftab ${active ? "active" : ""}"
          data-tpl-id="${t.id}"
          style="justify-content:space-between;width:100%;border-radius:0;border-left:0;border-right:0;"
          aria-pressed="${active ? "true" : "false"}"
        >
          <span style="display:flex;flex-direction:column;align-items:flex-start;gap:2px;">
            <span style="font-weight:900; font-size:.82rem; color: var(--text);">${t.name || "Untitled"}</span>
            <span style="font-size:.72rem; color: var(--text-3);">Created ${t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}</span>
          </span>
          <span style="display:inline-flex;align-items:center;gap:8px;">
            <span class="pill-badge" style="background: var(--grad-soft); color: var(--text); border-color: var(--border);">Local</span>
          </span>
        </button>
      `;
    })
    .join("");

  tplList.querySelectorAll("[data-tpl-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-tpl-id");
      selectTemplate(id);
    });
  });
}

function selectTemplate(id) {
  currentTemplateId = id;
  const t = templates.find((x) => String(x.id) === String(id));
  if (tplName) tplName.value = t?.name || "";
  if (tplBody) tplBody.value = t?.body || "";
  if (tplPreview) tplPreview.textContent = samplePreview(t?.body || "");
  clearMsgs();
  setEditorState();
  renderList();

  const draftName = String(t?.name || "").trim().toLowerCase();
  if (draftName) {
    const dupe = templates.some(
      (x) => String(x.id) !== String(id) && String(x.name || "").trim().toLowerCase() === draftName,
    );
    if (dupe) {
      setMsg(tplNote, "Note: You already have another template with this name.");
    }
  }
}

function newTemplate() {
  currentTemplateId = null;
  if (tplName) tplName.value = "";
  if (tplBody) tplBody.value = "";
  if (tplPreview) tplPreview.textContent = "";
  clearMsgs();
  setEditorState();
  renderList();
}

function saveTemplate() {
  clearMsgs();
  const draft = getEditorDraft();

  if (!draft.name || !draft.body) {
    setMsg(tplError, "Please enter both a name and a body before saving.");
    return;
  }

  const hasDupeName = templates.some(
    (t) =>
      String(t.id) !== String(currentTemplateId) &&
      String(t.name || "").trim().toLowerCase() === draft.name.toLowerCase(),
  );
  if (hasDupeName) {
    setMsg(tplNote, "Note: You already have another template with this name.");
  }

  if (!currentTemplateId) {
    const t = {
      id: uid(),
      name: draft.name,
      body: draft.body,
      createdAt: new Date().toISOString(),
    };
    templates = [t, ...templates];
    writeTemplates(templates);
    currentTemplateId = t.id;
    renderList();
    setEditorState();
    showToast({ type: "success", title: "Saved", message: "Template saved" });
    return;
  }

  const idx = templates.findIndex((x) => String(x.id) === String(currentTemplateId));
  if (idx < 0) {
    currentTemplateId = null;
    setEditorState();
    setMsg(tplError, "Template no longer exists. Save as new to create it again.");
    return;
  }

  templates[idx] = {
    ...templates[idx],
    name: draft.name,
    body: draft.body,
  };
  writeTemplates(templates);
  renderList();
  setEditorState();
  showToast({ type: "success", title: "Saved", message: "Template saved" });
}

function useTemplate() {
  if (!currentTemplateId) return;
  const t = templates.find((x) => String(x.id) === String(currentTemplateId));
  if (!t) return;

  localStorage.setItem(
    "rr_selected_template",
    JSON.stringify({ id: t.id, name: t.name, body: t.body }),
  );
  showToast({ type: "success", title: "Ready", message: "Open the dashboard to apply this template." });

  setTimeout(() => {
    window.location.href = "/";
  }, 350);
}

newTemplateBtn?.addEventListener("click", () => newTemplate());

tplBody?.addEventListener("input", () => {
  tplPreview.textContent = samplePreview(tplBody.value);
});

tplName?.addEventListener("input", () => {
  clearMsgs();
});

saveTemplateBtn?.addEventListener("click", () => saveTemplate());
useTemplateBtn?.addEventListener("click", () => useTemplate());

// Initial render
renderList();
setEditorState();
clearMsgs();

if (tplPreview) tplPreview.textContent = "Select a template to preview.";
