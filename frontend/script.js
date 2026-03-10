/* ── Theme ─────────────────────────────────────────────────────────────── */
      let theme = localStorage.getItem("rr-theme") || "light";
      document.documentElement.setAttribute("data-theme", theme);
      document.getElementById("themeBtn").textContent =
        theme === "dark" ? "☀️" : "🌙";

      function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", theme);
        document.getElementById("themeBtn").textContent =
          theme === "dark" ? "☀️" : "🌙";
        localStorage.setItem("rr-theme", theme);
      }

      /* ── Refs ──────────────────────────────────────────────────────────────── */
      const qInput = document.getElementById("queryInput");
      const runBtn = document.getElementById("runBtn");
      const btnLabel = document.getElementById("btnLabel");
      const btnIcon = document.getElementById("btnIcon");
      const statusArea = document.getElementById("statusArea");
      const errorBox = document.getElementById("errorBox");
      const resultsSec = document.getElementById("resultsSection");
      const tBody = document.getElementById("tBody");
      const howCard = document.getElementById("howCard");
      const modal = document.getElementById("modal");

      // Auto-hydrate saved settings
      document.addEventListener("DOMContentLoaded", () => {
        if (localStorage.getItem("rr-senderName")) document.getElementById("senderName").value = localStorage.getItem("rr-senderName");
        if (localStorage.getItem("rr-gmailUser")) document.getElementById("gmailUser").value = localStorage.getItem("rr-gmailUser");
        if (localStorage.getItem("rr-gmailPass")) document.getElementById("gmailPass").value = localStorage.getItem("rr-gmailPass");
        if (localStorage.getItem("rr-subjectTemplate")) document.getElementById("subjectTemplate").value = localStorage.getItem("rr-subjectTemplate");
      });

      qInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") runOutreach();
      });
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
      });

      /* ── State ─────────────────────────────────────────────────────────────── */
      let allResults = [];
      let activeFilter = "all";

      /* ── Util ──────────────────────────────────────────────────────────────── */
      const esc = (s) =>
        String(s ?? "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");

      function chipFor(st) {
        const M = {
          sent: ["ch-sent", "Email Sent"],
          "sms sent": ["ch-sent", "SMS Sent"],
          "dm required": ["ch-warn", "DM Required"],
          "already contacted": ["ch-warn", "Already Contacted"],
          "no email found": ["ch-warn", "No Cont Info"],
          "no website": ["ch-warn", "No Website"],
          skipped: ["ch-warn", "Skipped"],
          "failed to send": ["ch-fail", "Send Failed"],
          "generation failed": ["ch-fail", "AI Error"],
          failed: ["ch-fail", "Failed"],
        };
        const [cls, lbl] = M[st] || ["ch-warn", st || "—"];
        return `<span class="chip ${cls}"><span class="cdot"></span>${lbl}</span>`;
      }

      function updateModeTag() {
        const has =
          document.getElementById("emailTemplate").value.trim().length > 0;
        const t = document.getElementById("modeTag");
        t.className = "mode-tag " + (has ? "mt-template" : "mt-ai");
        t.textContent = has ? "Template Mode" : "AI Mode";
      }

      function toggleConfig() {
        const body = document.getElementById("cfgBody");
        const icon = document.querySelector("#cfgToggle svg");
        
        if (body.style.display === "none") {
          body.style.display = "block";
          icon.innerHTML = '<polyline points="18 15 12 9 6 15"></polyline>';
        } else {
          body.style.display = "none";
          icon.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
        }
      }

      function showErr(m) {
        errorBox.textContent = "⚠  " + m;
        errorBox.classList.add("show");
      }
      function hideErr() {
        errorBox.textContent = "";
        errorBox.classList.remove("show");
      }

      /* ── Filter ────────────────────────────────────────────────────────────── */
      function setFilter(f) {
        activeFilter = f;
        document
          .querySelectorAll(".ftab")
          .forEach((b) => b.classList.toggle("active", b.dataset.filter === f));
        renderTable();
      }

      /* ── Render ────────────────────────────────────────────────────────────── */
      function renderResults(results) {
        allResults = results;
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
        document.getElementById("stTotal").textContent = results.length;
        document.getElementById("stSent").textContent = sent;
        document.getElementById("stSkip").textContent = noEmail;
        document.getElementById("stFail").textContent = failed;
        document.getElementById("fcAll").textContent = results.length;
        document.getElementById("fcSent").textContent = sent;
        document.getElementById("fcSkip").textContent = noEmail;
        document.getElementById("fcFail").textContent = failed;
        activeFilter = "all";
        document
          .querySelectorAll(".ftab")
          .forEach((b) =>
            b.classList.toggle("active", b.dataset.filter === "all"),
          );
        renderTable();
      }

      function renderTable() {
        const rows = allResults.filter((r) => {
          if (activeFilter === "all") return true;
          if (activeFilter === "sent") return r.emailStatus === "sent";
          if (activeFilter === "noemail")
            return (
              r.emailStatus === "no email found" ||
              r.emailStatus === "no website" ||
              r.emailStatus === "skipped"
            );
          if (activeFilter === "failed")
            return (
              r.emailStatus !== "sent" &&
              r.emailStatus !== "no email found" &&
              r.emailStatus !== "no website" &&
              r.emailStatus !== "skipped"
            );
          return true;
        });

        if (!rows.length) {
          tBody.innerHTML = `<tr><td colspan="7"><div class="empty-row"><div class="empty-icon">🔍</div><div class="empty-msg">${allResults.length ? "No entries in this category." : "No results yet. Run a search above."}</div></div></td></tr>`;
          return;
        }

        tBody.innerHTML = "";
        rows.forEach((r, i) => {
          const gi = allResults.indexOf(r);
          const isYP = r.source === "Yellow Pages";

          const src = r.source
            ? `<span class="src-pill ${isYP ? "src-y" : "src-g"}"><span class="src-dot"></span>${esc(r.source)}</span>`
            : "—";

          const site = r.url
            ? `<a class="site-link" href="${esc(r.url)}" target="_blank" rel="noopener" title="${esc(r.url)}">${esc(r.url.replace(/^https?:\/\//, "").replace(/\/$/, ""))}</a>`
            : `<span style="color:var(--text-3)">—</span>`;

          let contactHtml = `<span style="color:var(--text-3)">—</span>`;
          if (r.email) {
            contactHtml = r.emailGuessed
              ? `<span class="email-v e-guess" title="Guessed from domain">~ ${esc(r.email)}</span>`
              : `<span class="email-v e-found">${esc(r.email)}</span>`;
          } else if (r.phone) {
            contactHtml = `<span class="email-v" style="color:var(--amber)">📞 ${esc(r.phone)}</span>`;
          } else if (r.socials && r.socials.length > 0) {
            const fb = r.socials.find((s) => s.url.includes("facebook.com"));
            const ig = r.socials.find((s) => s.url.includes("instagram.com"));

            if (ig) {
              const handle = ig.url
                .split("instagram.com/")[1]
                ?.replace(/\//g, "");
              contactHtml = `<a class="site-link" href="https://ig.me/m/${handle}" target="_blank">💬 Direct Message</a>`;
            } else if (fb) {
              const handle = fb.url.split("facebook.com/")[1]?.split("/")[0];
              contactHtml = `<a class="site-link" href="https://m.me/${handle}" target="_blank">💬 Direct Message</a>`;
            } else {
              contactHtml = `<a class="site-link" href="${esc(r.socials[0].url)}" target="_blank">💬 Social Profile</a>`;
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
        <td>
          <span class="cell-title">${esc(r.businessName || "Unknown")}</span>
          ${meta.length ? `<span class="cell-sub">${meta.join(" · ")}</span>` : ""}
        </td>
        <td>
            <span class="cell-title">${esc(r.address || "Unknown Location")}</span>
            <span class="cell-sub">${src}</span>
        </td>
        <td>
            <div style="display:flex; flex-direction:column; gap:0.2rem;">
                ${site}
                ${contactHtml}
            </div>
        </td>
        <td>
            <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-start;">
                ${chipFor(r.emailStatus)}
                ${vbtn}
            </div>
        </td>
      </tr>`;
        });
      }

      /* ── Modal ─────────────────────────────────────────────────────────────── */
      function openModal(idx) {
        const r = allResults[idx];
        if (!r) return;
        document.getElementById("mBiz").textContent =
          r.businessName || "Unknown Business";
        document.getElementById("mUrl").textContent = r.url || "";
        document.getElementById("mEmail").textContent = r.email || "—";
        document.getElementById("mRating").textContent = r.rating || "—";
        document.getElementById("mAddr").textContent = r.address || "—";

        let extras = [];
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
      function closeModal() {
        modal.classList.remove("show");
        document.body.style.overflow = "";
      }
      function copyEmail() {
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

      /* ── Run ───────────────────────────────────────────────────────────────── */
      async function runOutreach() {
        const qInput = document.getElementById("queryInput");
        const query = qInput.value.trim();
        const emailTemplate = document
          .getElementById("emailTemplate")
          .value.trim();
        const runBtn = document.getElementById("runBtn");
        const btnLabel = document.getElementById("btnLabel");
        const btnIcon = document.getElementById("btnIcon");
        const statusArea = document.getElementById("statusArea");
        const resultsSec = document.getElementById("resultsSection");
        const howCard = document.getElementById("howCard");

        if (!query) {
          qInput.focus();
          qInput.style.borderColor = "var(--red)";
          qInput.style.boxShadow = "0 0 0 4px rgba(239,68,68,.18)";
          setTimeout(() => {
            qInput.style.borderColor = "";
            qInput.style.boxShadow = "";
          }, 1800);
          return;
        }

        runBtn.style.display = "none";

        hideErr();
        statusArea.classList.add("show");
        if (resultsSec) resultsSec.style.display = "none";
        if (howCard) howCard.style.display = "none";
        document.getElementById("statusTxt").textContent =
          "Searching via Google, Yelp, and Yellow Pages…";
        document.getElementById("statusSub").textContent =
          "Both sources running in parallel. This takes 2–4 minutes, please wait.";

        try {
          // Reset UI
          allResults = [];
          renderResults([]);
          resultsSec.style.display = "block";
          resultsSec.scrollIntoView({ behavior: "smooth", block: "start" });

          const smsTemplate = document
            .getElementById("smsTemplate")
            .value.trim();

          const senderConfig = {
            senderName: document.getElementById("senderName").value.trim(),
            gmailUser: document.getElementById("gmailUser").value.trim(),
            gmailPass: document.getElementById("gmailPass").value.trim(),
            subjectTemplate: document
              .getElementById("subjectTemplate")
              .value.trim(),
          };

          const voiplineConfig = {
            token: document.getElementById("voiplineToken")?.value.trim() || "",
            callerId:
              document.getElementById("voiplineCallerId")?.value.trim() || "",
          };

          let res;
          try {
            res = await fetch("/api/run-outreach", {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem('rankradar_tool_token')}`
              },
              body: JSON.stringify({
                query,
                emailTemplate,
                smsTemplate,
                senderConfig,
                voiplineConfig,
              }),
            });
          } catch (fetchErr) {
            showErr(fetchErr.message);
            res = null;
          }

          if (!res) {
            runBtn.style.display = "flex";
            statusArea.classList.remove("show");
            return;
          }

          if (!res.ok) {
            const err = await res
              .json()
              .catch(() => ({ error: `HTTP ${res.status}` }));
            throw new Error(err.error || `Server error ${res.status}`);
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop(); // keep last incomplete line
              for (const line of lines) {
                if (!line.trim()) continue;
                try {
                  const msg = JSON.parse(line);
                  if (msg.type === "status") {
                    document.getElementById("statusTxt").textContent =
                      "Processing...";
                    document.getElementById("statusSub").textContent =
                      msg.message;
                  } else if (msg.type === "result") {
                    allResults.push(msg.data);
                    renderResults(allResults);
                  } else if (msg.type === "error") {
                    showErr(msg.message);
                  } else if (msg.type === "done") {
                    document.getElementById("statusTxt").textContent =
                      "Completed";
                    document.getElementById("statusSub").textContent =
                      msg.summary;
                  }
                } catch (e) {
                  console.error("Stream parse error:", line);
                }
              }
            }
            if (done) break;
          }

          setTimeout(() => {
            statusArea.classList.remove("show");
            runBtn.style.display = "flex";
          }, 4500);
        } catch (err) {
          showErr(err.message || "An unexpected error occurred.");
          statusArea.classList.remove("show");
          if (howCard) howCard.style.display = "";
          runBtn.style.display = "flex";
        } finally {
          runBtn.disabled = false;
          btnLabel.textContent = "Run Outreach";
          btnIcon.textContent = "▶";
        }
      }

const hModal = document.getElementById("historyModal");

      hModal.addEventListener("click", (e) => {
        if (e.target === hModal) closeHistoryModal();
      });

      function closeHistoryModal() {
        hModal.classList.remove("show");
        document.body.style.overflow = "";
      }

      async function openHistoryModal() {
        hModal.classList.add("show");
        document.body.style.overflow = "hidden";
        document.getElementById("hBody").innerHTML =
          '<tr><td colspan="4" style="text-align:center; padding: 20px;">Loading...</td></tr>';
        await loadHistory();
      }

      async function loadHistory() {
        try {
          const res = await fetch("/api/history", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('rankradar_tool_token')}`
            }
          });
          const data = await res.json();
          const rows = data.history || [];

          if (!rows.length) {
            document.getElementById("hBody").innerHTML =
              '<tr><td colspan="4" style="text-align:center; padding: 30px; color: var(--text-3);">No history found. Run outreach first.</td></tr>';
            return;
          }

          document.getElementById("hBody").innerHTML = rows
            .map(
              (r) => `
            <tr style="border-bottom: 1px solid var(--border);">
              <td style="padding: 12px 16px; font-weight: 600; font-size: 0.85rem;">
                ${esc(r.business_name)}
                ${r.domain ? `<div style="font-size: 0.7rem; color: var(--text-3); font-weight: 500;">${esc(r.domain)}</div>` : ""}
              </td>
              <td style="padding: 12px 16px;">
                <span class="chip ${r.contact_method === "Email" ? "ch-sent" : "ch-warn"}"><span class="cdot"></span>${esc(r.contact_method)}</span>
                <div style="font-size: 0.7rem; color: var(--text-3); margin-top: 4px; font-family: monospace;">${esc(r.contact_value)}</div>
              </td>
              <td style="padding: 12px 16px; font-size: 0.75rem; color: var(--text-2); white-space: nowrap;">
                ${new Date(r.timestamp + "Z").toLocaleString()}
              </td>
              <td style="padding: 12px 16px; text-align: right;">
                <button onclick="deleteHistory(${r.id})" style="background: none; border: none; color: var(--red); opacity: 0.7; font-size: 1rem; cursor: pointer;" title="Remove from list (will contact again)">🗑️</button>
              </td>
            </tr>
          `,
            )
            .join("");
        } catch (e) {
          console.error(e);
          document.getElementById("hBody").innerHTML =
            '<tr><td colspan="4" style="text-align:center; padding: 20px; color: red;">Error loading history</td></tr>';
        }
      }

      async function deleteHistory(id) {
        if (
          !confirm(
            "Remove this business from history? They will be eligible to receive messages again if you run a search.",
          )
        )
          return;
        try {
          await fetch(`/api/history/${id}`, {
            method: "DELETE",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem('rankradar_tool_token')}`
            }
          });
          loadHistory(); // reload
        } catch (e) {
          alert("Failed to delete history row");
        }
      }

      /* ── Settings Modal ────────────────────────────────────────────────────── */
      const sModal = document.getElementById("settingsModal");
      sModal.addEventListener("click", (e) => { if (e.target === sModal) closeSettingsModal(); });

      function openSettingsModal() {
        document.getElementById("defSenderName").value = localStorage.getItem("rr-senderName") || "";
        document.getElementById("defGmailUser").value = localStorage.getItem("rr-gmailUser") || "";
        document.getElementById("defGmailPass").value = localStorage.getItem("rr-gmailPass") || "";
        document.getElementById("defSubject").value = localStorage.getItem("rr-subjectTemplate") || "";
        document.getElementById("forceDarkTheme").checked = (theme === "dark");

        sModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }

      function closeSettingsModal() {
        sModal.classList.remove("show");
        document.body.style.overflow = "";
      }

      function saveSettingsModal() {
        localStorage.setItem("rr-senderName", document.getElementById("defSenderName").value.trim());
        localStorage.setItem("rr-gmailUser", document.getElementById("defGmailUser").value.trim());
        localStorage.setItem("rr-gmailPass", document.getElementById("defGmailPass").value.trim());
        localStorage.setItem("rr-subjectTemplate", document.getElementById("defSubject").value.trim());
        
        // Auto-fill dashboard if currently empty
        if (!document.getElementById("senderName").value) document.getElementById("senderName").value = localStorage.getItem("rr-senderName");
        if (!document.getElementById("gmailUser").value) document.getElementById("gmailUser").value = localStorage.getItem("rr-gmailUser");
        if (!document.getElementById("gmailPass").value) document.getElementById("gmailPass").value = localStorage.getItem("rr-gmailPass");
        if (!document.getElementById("subjectTemplate").value) document.getElementById("subjectTemplate").value = localStorage.getItem("rr-subjectTemplate");

        closeSettingsModal();
      }

      function toggleThemeFromSettings() {
         toggleTheme();
      }