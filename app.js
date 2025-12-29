const DATA_URL = "./data/cases.json";

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value ?? "";
}

function setList(id, items) {
  const el = $(id);
  if (!el) return;
  el.innerHTML = "";
  if (!items || items.length === 0) return;
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
  if (!terms || terms.length === 0) return;

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
  if (!links || links.length === 0) return;

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
  if (!tags) return;

  for (const tag of tags) {
    const pill = document.createElement("span");
    pill.textContent = tag;
    el.appendChild(pill);
  }
}

function showCard() {
  const card = $("caseCard");
  if (card) card.classList.add("is-visible");
}

function hideCard() {
  const card = $("caseCard");
  if (card) card.classList.remove("is-visible");
}

function placeholderThumb(title, year) {
  const safeTitle = (title || "").replace(/&/g, "and");
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="800" height="460">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#e5e7eb"/>
        <stop offset="1" stop-color="#f9fafb"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#g)"/>
    <text x="40" y="150" font-size="72" font-family="system-ui" fill="#111827" font-weight="800">${year}</text>
    <text x="40" y="230" font-size="34" font-family="system-ui" fill="#374151">${safeTitle}</text>
    <text x="40" y="290" font-size="24" font-family="system-ui" fill="#6b7280">thumbnail placeholder</text>
  </svg>`.trim();

  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function setActiveUI(activeId) {
  const pillsWrap = $("timelineItems");
  if (pillsWrap) {
    for (const b of pillsWrap.querySelectorAll("button")) {
      b.classList.toggle("active", b.dataset.caseId === activeId);
    }
  }

  const track = $("scrollerTrack");
  if (track) {
    for (const card of track.querySelectorAll("button")) {
      card.classList.toggle("active", card.dataset.caseId === activeId);
    }
  }
}

function openItem(items, id, doScroll) {
  const c = items.find((x) => x.id === id);
  if (!c) return;

  setActiveUI(c.id);

  const meta = [c.year, c.subject, c.category].filter(Boolean).join(" | ");
  setText("cardTitle", c.title);
  setText("cardMeta", meta);

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

  showCard();
  setText("statusText", `Opened ${c.title} (${c.year}).`);

  window.location.hash = `item-${c.id}`;

  if (doScroll) {
    $("caseCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderPills(items) {
  const wrap = $("timelineItems");
  if (!wrap) return;
  wrap.innerHTML = "";

  for (const c of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.caseId = c.id;
    btn.textContent = `${c.year}`;
    btn.addEventListener("click", () => openItem(items, c.id, true));
    wrap.appendChild(btn);
  }
}

function renderDropdown(items) {
  const sel = $("yearSelect");
  if (!sel) return;

  sel.innerHTML = `<option value="">Select a year</option>`;
  for (const c of items) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.year}  ${c.title}`;
    sel.appendChild(opt);
  }

  sel.addEventListener("change", () => {
    if (!sel.value) return;
    openItem(items, sel.value, true);
  });
}

function renderScroller(items) {
  const track = $("scrollerTrack");
  if (!track) return;
  track.innerHTML = "";

  for (const c of items) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "thumb-card";
    btn.dataset.caseId = c.id;

    const img = document.createElement("img");
    img.className = "thumb-img";
    img.alt = (c.thumbnail && c.thumbnail.alt) || `${c.title} thumbnail`;
    img.src = (c.thumbnail && c.thumbnail.src) || placeholderThumb(c.title, c.year);

    const body = document.createElement("div");
    body.className = "thumb-body";

    const y = document.createElement("div");
    y.className = "thumb-year";
    y.textContent = `${c.year}`;

    const t = document.createElement("div");
    t.className = "thumb-title";
    t.textContent = c.title;

    const sub = document.createElement("div");
    sub.className = "thumb-sub";
    sub.textContent = [c.subject, c.category].filter(Boolean).join(" | ");

    body.appendChild(y);
    body.appendChild(t);
    body.appendChild(sub);

    btn.appendChild(img);
    btn.appendChild(body);

    btn.addEventListener("click", () => openItem(items, c.id, true));
    track.appendChild(btn);
  }

  const prev = $("scrollerPrev");
  const next = $("scrollerNext");

  if (prev) {
    prev.addEventListener("click", () => {
      track.scrollBy({ left: -320, behavior: "smooth" });
    });
  }
  if (next) {
    next.addEventListener("click", () => {
      track.scrollBy({ left: 320, behavior: "smooth" });
    });
  }
}

function wireCopyLink() {
  const btn = $("btnCopyLink");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy link"), 1200);
    } catch {
      window.prompt("Copy this link:", url);
    }
  });
}

async function loadItems() {
  const res = await fetch(DATA_URL, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load data");
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("Data must be an array");

  data.sort((a, b) => (a.year ?? 0) - (b.year ?? 0));
  return data;
}

function openFromHash(items) {
  const h = (window.location.hash || "").trim();
  const m = h.match(/^#item-(.+)$/);
  if (!m) return false;

  const id = m[1];
  if (!items.some((x) => x.id === id)) return false;

  openItem(items, id, false);
  return true;
}

document.addEventListener("DOMContentLoaded", async () => {
  wireCopyLink();
  hideCard();

  try {
    const items = await loadItems();
    renderScroller(items);
    renderDropdown(items);
    renderPills(items);

    if (!openFromHash(items)) {
      setText("statusText", "Scroll and click a year to open the card.");
    }
  } catch (e) {
    setText("statusText", "Error loading timeline data.");
    console.error(e);
  }
});