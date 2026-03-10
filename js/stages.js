const STAGES = ["search", "processing", "complete"];

function setActive(stage) {
  const host = document.getElementById("stageBar");
  if (!host) return;
  STAGES.forEach((s) => {
    const el = host.querySelector(`[data-stage="${s}"]`);
    if (!el) return;
    el.classList.toggle("active", s === stage);
    el.classList.toggle("done", STAGES.indexOf(s) < STAGES.indexOf(stage));
  });
}

export function resetStages() {
  setActive("search");
}

export function updateStageFromStatus(msg) {
  const m = String(msg || "").toLowerCase();
  if (m.includes("search")) setActive("search");
  else if (m.includes("processing")) setActive("processing");
}

export function setStageComplete() {
  setActive("complete");
}
