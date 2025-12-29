/* AP Gov Timeline
   Static site logic: loads data/cases.json, renders timeline buttons, and
   reveals a case card when a year is selected.
*/

const DATA_URL = "./data/cases.json";

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (!el) return;
  el.textContent = value ?? "";
}

function clearList(id) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";
}

function setList(id, items) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";

  if (!items || items.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "";
    el.appendChild(li);
    return;
  }

  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  }
}

function setTerms(id, terms) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";

  if (!terms || terms.length === 0) {
    const div = document.createElement("div");
    div.className = "muted";
    div.textContent = "";
    el.appendChild(div);
    return;
  }

  for (const t of terms) {
    const row = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = t.term;
    const span = document.createElement("span");
    span.className = "muted";
    span.textContent = ` ${t.definition}`;
    row.appendChild(strong);
    row.appendChild(span);
    el.appendChild(row);
  }
}

function setLinks(id, links) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";

  if (!links || links.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "";
    el.appendChild(li);
    return;
  }

  for (const link of links) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = link.url;
    a.target = "_blank";
    a.rel = "noreferrer";
    a.textContent = link.label;
    li.appendChild(a);
    el.appendChild(li);
  }
}

function setTags(tags) {
  const el = $("cardTags");
  if (!el) return;
  el.innerHTML = "";

  if (!tags || tags.length === 0) return;

  for (const tag of tags) {
    const pill = document.createElement("span");
    pill.textContent = tag;
    el.appendChild(pill);
  }
}

function showCaseCard() {
  const card = $("caseCard");
  if (!card) return;
  card.classList.add("is-visible");
}

function hideCaseCard() {
  const card = $("caseCard");
  if (!card) return;
  card.classList.remove("is-visible");
}

function scrollToCard() {
  const card = $("caseCard");
  if (!card) return;
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveTimelineButton(activeId) {
  const wrap = $("timelineItems");
  if (!wrap) return;
  const buttons = wrap.querySelectorAll("button");
  for (const b of buttons) {
    b.classList.toggle("active", b.dataset.caseId === activeId);
  }
}

function renderTimeline(cases) {
  const wrap = $("timelineItems");
  if (!wrap) return;
  wrap.innerHTML = "";

  for (const c of cases) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.caseId = c.id;
    btn.textContent = `${c.year}`;

    btn.addEventListener("click", () => {
      openCase(cases, c.id, true);
    });

    wrap.appendChild(btn);
  }
}

function openCase(cases, id, doScroll) {
  const c = cases.find((x) => x.id === id);
  if (!c) return;

  setActiveTimelineButton(c.id);

  setText("cardTitle", c.title);
  setText("cardMeta", [c.year, c.vote, c.type].filter(Boolean).join(" | "));
  setTags(c.tags);

  setText("quickTake", c.quickTake);
  setText("corePrompt", c.corePrompt);

  setText("answerLabel", c.answerLabel || "Holding");
  setText("answerText", c.answerText);

  setList("factsList", c.facts);
  setList("reasoningList", c.reasoning);
  setList("precedentList", c.precedent);

  setTerms("termsList", c.terms);

  setList("whyExamList", c.whyExam);
  setList("whyRealList", c.whyReal);

  setList("leadsToList", c.leadsTo);
  setList("connectsBackList", c.connectsBack);

  setLinks("linksList", c.links);

  showCaseCard();
  setText("statusText", `Opened ${c.title} (${c.year}).`);

  // Update hash for shareable link
  window.location.hash = `case-${c.id}`;

  if (doScroll) {
    scrollToCard();
  }
}

function wireCopyLinkButton() {
  const btn = $("btnOpenHash");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = "Copied";
      setTimeout(() => {
        btn.textContent = "Copy link to this case";
      }, 1200);
    } catch {
      // Fallback
      window.prompt("Copy this link:", url);
    }
  });
}

async function loadCases() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${DATA_URL}`);
  const data = await res.json();

  if (!Array.isArray(data)) throw new Error("cases.json must be an array");

  // Sort by year
  data.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));

  return data;
}

function openFromHash(cases) {
  const h = (window.location.hash || "").trim();
  const m = h.match(/^#case-(.+)$/);
  if (!m) return false;

  const id = m[1];
  const exists = cases.some((c) => c.id === id);
  if (!exists) return false;

  openCase(cases, id, false);
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  wireCopyLinkButton();

  // Hide until a case is chosen
  hideCaseCard();

  try {
    const cases = await loadCases();

    if (cases.length === 0) {
      setText("statusText", "No cases loaded yet. Add entries to data/cases.json.");
      return;
    }

    renderTimeline(cases);

    const opened = openFromHash(cases);
    if (!opened) {
      setText("statusText", "Pick a year to open the case card.");
    }
  } catch (err) {
    setText("statusText", "Error loading timeline data.");
    console.error(err);
  }
});