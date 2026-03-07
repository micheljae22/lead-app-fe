import { state } from "./state.js";
import { renderResults } from "./resultsTable.js";

function showErr(m) {
  const errorBox = document.getElementById("errorBox");
  if (!errorBox) return;
  errorBox.textContent = "⚠  " + m;
  errorBox.classList.add("show");
}
function hideErr() {
  const errorBox = document.getElementById("errorBox");
  if (!errorBox) return;
  errorBox.textContent = "";
  errorBox.classList.remove("show");
}

export async function runOutreach() {
  const qInput = document.getElementById("queryInput");
  const query = qInput.value.trim();

  const emailTemplate = document.getElementById("emailTemplate").value.trim();
  const runBtn = document.getElementById("runBtn");
  const btnLabel = document.getElementById("btnLabel");
  const btnIcon = document.getElementById("btnIcon");
  const statusArea = document.getElementById("statusArea");
  const resultsSec = document.getElementById("resultsSection");
  const howCard = document.getElementById("howCard");

  const liveHint = document.getElementById("liveHint");
  const prProcessed = document.getElementById("prProcessed");
  const prTotal = document.getElementById("prTotal");

  if (!query) {
    qInput.focus();
    showErr("Please enter a search query (e.g. cafes in colombo).");
    qInput.style.borderColor = "var(--red)";
    qInput.style.boxShadow = "0 0 0 4px rgba(239,68,68,.18)";
    setTimeout(() => {
      qInput.style.borderColor = "";
      qInput.style.boxShadow = "";
    }, 1800);
    return;
  }

  runBtn.disabled = true;
  btnLabel.textContent = "Running...";
  btnIcon.textContent = "⏳";
  if (liveHint) liveHint.textContent = "Run in progress...";
  if (prProcessed) prProcessed.textContent = "0";
  if (prTotal) prTotal.textContent = "0";

  hideErr();
  statusArea.classList.add("show");
  if (resultsSec) resultsSec.style.display = "none";
  if (howCard) howCard.style.display = "none";

  document.getElementById("statusTxt").textContent =
    "Searching via Google, Yelp, and Yellow Pages…";
  document.getElementById("statusSub").textContent =
    "Both sources running in parallel. This takes 2–4 minutes, please wait.";

  try {
    state.allResults = [];
    renderResults([]);

    if (resultsSec) {
      resultsSec.style.display = "block";
      resultsSec.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    const smsTemplate = document.getElementById("smsTemplate").value.trim();

    const senderConfig = {
      senderName: document.getElementById("senderName").value.trim(),
      gmailUser: document.getElementById("gmailUser").value.trim(),
      gmailPass: document.getElementById("gmailPass").value.trim(),
      subjectTemplate: document.getElementById("subjectTemplate").value.trim(),
    };

    const voiplineConfig = {
      token: document.getElementById("voiplineToken")?.value.trim() || "",
      callerId: document.getElementById("voiplineCallerId")?.value.trim() || "",
    };

    const sendEmailsToggle = document.getElementById("sendEmails");
    const sendEmails = sendEmailsToggle ? !!sendEmailsToggle.checked : true;

    let res;
    try {
      res = await fetch("http://localhost:3000/api/run-outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          emailTemplate,
          smsTemplate,
          sendEmails,
          senderConfig,
          voiplineConfig,
        }),
      });
    } catch (fetchErr) {
      showErr(fetchErr.message);
      res = null;
    }

    if (!res) {
      runBtn.disabled = false;
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
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const msg = JSON.parse(line);
            if (msg.type === "status") {
              document.getElementById("statusTxt").textContent = "Processing...";
              document.getElementById("statusSub").textContent = msg.message;

              const m = String(msg.message || "").match(/Processing\s+(\d+)\/(\d+)/i);
              if (m) {
                if (prProcessed) prProcessed.textContent = m[1];
                if (prTotal) prTotal.textContent = m[2];
              }
            } else if (msg.type === "result") {
              state.allResults.push(msg.data);
              renderResults(state.allResults);
            } else if (msg.type === "error") {
              showErr(msg.message);
            } else if (msg.type === "done") {
              document.getElementById("statusTxt").textContent = "Completed";
              document.getElementById("statusSub").textContent = msg.summary;
              if (liveHint) liveHint.textContent = msg.summary || "Completed.";
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
      runBtn.disabled = false;
      btnLabel.textContent = "Run Outreach";
      btnIcon.textContent = "▶";
    }, 4500);
  } catch (err) {
    showErr(err.message || "An unexpected error occurred.");
    statusArea.classList.remove("show");
    if (howCard) howCard.style.display = "";
    runBtn.disabled = false;
  } finally {
    runBtn.disabled = false;
    btnLabel.textContent = "Run Outreach";
    btnIcon.textContent = "▶";
  }
}
