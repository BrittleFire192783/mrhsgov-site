const DATA_URL = "./data/cases.json";

/* Tag filtering state */
let activeTag = "all";
let ALL_ITEMS = [];
let CURRENT_VISIBLE_ITEMS = [];
let jumpWired = false;

function applyFilter(items) {
  if (!Array.isArray(items)) return [];
  if (activeTag === "all") return items;

  if (activeTag === "required") {
    return items.filter((it) => it && it.required === true);
  }

  return items.filter(
    (it) => it && Array.isArray(it.tags) && it.tags.includes(activeTag)
  );
}

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

function showExpand() {
  const el = $("yearExpand");
  if (!el) return;
  el.classList.add("is-visible");
  el.classList.add("is-open");
}

function hideExpand() {
  const el = $("yearExpand");
  if (!el) return;
  el.classList.remove("is-open");
  el.classList.remove("is-visible");
}

function showDetail() {
  $("detailCard")?.classList.add("is-visible");
}

function hideDetail() {
  $("detailCard")?.classList.remove("is-visible");
}

function setStatus(msg) {
  setText("statusText", msg);
}

function summarizeYear(itemsInYear) {
  if (!itemsInYear || itemsInYear.length === 0) return "No items yet.";
  const subjects = new Set(itemsInYear.map((x) => x.subject).filter(Boolean));
  const cats = new Set(itemsInYear.map((x) => x.category).filter(Boolean));

  const parts = [];
  if (subjects.size) parts.push([...subjects].join(", ").toUpperCase());
  if (cats.size) parts.push([...cats].join(", "));

  return `${itemsInYear.length} item(s) | ${parts.join(" | ")}`;
}

function yearHeadline(itemsInYear) {
  if (!itemsInYear || itemsInYear.length === 0) return "No items yet";
  if (itemsInYear.length === 1) return itemsInYear[0].title;
  const cases = itemsInYear.filter((x) => x.category === "case");
  if (cases.length) return `${cases.length} major case(s)`;
  return `${itemsInYear.length} key items`;
}

function yearBadges(itemsInYear) {
  const set = new Set();
  for (const it of itemsInYear) {
    if (it.subject) set.add(it.subject.toUpperCase());
    if (it.category) set.add(it.category);
  }
  return [...set].slice(0, 6);
}

function openItemDetail(allItems, id, doScroll) {
  const c = allItems.find((x) => x.id === id);
  if (!c) return;

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

  showDetail();
  window.location.hash = `item-${c.id}`;
  setStatus(`Opened ${c.title} (${c.year}).`);

  if (doScroll) {
    $("detailCard")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function openYearExpand(year, itemsInYear) {
  setText("expandTitle", `${year}`);
  setText("expandMeta", summarizeYear(itemsInYear));

    const summary =
    itemsInYear.length === 0
      ? "Select an event. APUSH info coming soon."
      : "Select an event below. APUSH info coming soon.";
  setText("expandSummary", summary);

  const list = $("expandItems");
  if (list) {
    list.innerHTML = "";
    if (itemsInYear.length === 0) {
      const p = document.createElement("div");
      p.className = "muted";
      p.textContent = "No items yet.";
      list.appendChild(p);
    } else {
      for (const it of itemsInYear) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "item-btn";

        const title = document.createElement("div");
        title.className = "item-title";
        title.textContent = it.title;

        const meta = document.createElement("div");
        meta.className = "item-meta";
        meta.textContent = [it.subject, it.category, it.vote]
          .filter(Boolean)
          .join(" | ");

        btn.appendChild(title);
        btn.appendChild(meta);

        btn.addEventListener("click", () => openItemDetail(ALL_ITEMS, it.id, true));
        list.appendChild(btn);
      }
    }
  }

  showExpand();
  $("yearExpand")?.scrollIntoView({ behavior: "smooth", block: "start" });
  setStatus(`Expanded ${year}. Select an item.`);
}

function renderYears(allItems) {
  const yearsEl = $("years");
  if (!yearsEl) return [];

  const byYear = new Map();
  for (const it of allItems) {
    const y = it.year;
    if (!byYear.has(y)) byYear.set(y, []);
    byYear.get(y).push(it);
  }

  const years = [...byYear.keys()].sort((a, b) => a - b);

  yearsEl.innerHTML = "";
  for (const y of years) {
    const itemsInYear = byYear.get(y);

    const section = document.createElement("section");
    section.className = "year";
    section.id = `year-${y}`;

    const top = document.createElement("div");
    top.className = "year-top";

    const left = document.createElement("div");

    const yearEl = document.createElement("div");
    yearEl.className = "year-big";
    yearEl.textContent = `${y}`;

    const titleEl = document.createElement("div");
    titleEl.className = "year-title";
    titleEl.textContent = yearHeadline(itemsInYear);

    const subEl = document.createElement("div");
    subEl.className = "year-sub";

    if (itemsInYear.length === 0) {
      subEl.textContent = "No items yet.";
    } else {
      const casesInYear = itemsInYear.filter((x) => x.category === "case");

      if (casesInYear.length) {
        const titles = casesInYear.map((c) => c.title).filter(Boolean);
        const shown = titles.slice(0, 3);
        const remaining = titles.length - shown.length;

        subEl.textContent =
          remaining > 0
            ? `Cases: ${shown.join(" • ")} • +${remaining} more`
            : `Cases: ${shown.join(" • ")}`;
      } else {
        subEl.textContent = "Open the year snapshot, then pick a card to study.";
      }
    }

    left.appendChild(yearEl);
    left.appendChild(titleEl);
    left.appendChild(subEl);

    const right = document.createElement("div");
    right.className = "year-right";

    const badges = document.createElement("div");
    badges.className = "badges";
    for (const b of yearBadges(itemsInYear)) {
      const s = document.createElement("span");
      s.textContent = b;
      badges.appendChild(s);
    }
    right.appendChild(badges);

    top.appendChild(left);
    top.appendChild(right);

    const actions = document.createElement("div");
    actions.className = "year-actions";

    const hint = document.createElement("div");
    hint.className = "muted";
    hint.textContent = `Items: ${itemsInYear.length}`;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn";
    btn.textContent = "Expand this year";
    btn.addEventListener("click", () => openYearExpand(y, itemsInYear));

    actions.appendChild(hint);
    actions.appendChild(btn);

    section.appendChild(top);
    section.appendChild(actions);

    yearsEl.appendChild(section);
  }

  return years;
}

function renderJump(years) {
  const sel = $("yearSelect");
  if (!sel) return;

  sel.innerHTML = `<option value="">Select a year</option>`;
  for (const y of years) {
    const opt = document.createElement("option");
    opt.value = `${y}`;
    opt.textContent = `${y}`;
    sel.appendChild(opt);
  }

  if (!jumpWired) {
    sel.addEventListener("change", () => {
      if (!sel.value) return;
      const target = document.getElementById(`year-${sel.value}`);
      target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
      setStatus(`Jumped to ${sel.value}. Click Expand.`);
    });
    jumpWired = true;
  }
}

function wireNavButtons() {
  const years = $("years");
  if (!years) return;

  $("btnPrev")?.addEventListener("click", () => {
    years.scrollBy({ left: -years.clientWidth, behavior: "smooth" });
  });

  $("btnNext")?.addEventListener("click", () => {
    years.scrollBy({ left: years.clientWidth, behavior: "smooth" });
  });
}

function wireCollapse() {
  $("btnCollapse")?.addEventListener("click", () => {
    hideExpand();
    setStatus("Collapsed year panel.");
    $("years")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
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

function wireFilters() {
  const btns = Array.from(document.querySelectorAll(".filter-btn"));
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      activeTag = btn.dataset.tag || "all";

      CURRENT_VISIBLE_ITEMS = applyFilter(ALL_ITEMS);
      const years = renderYears(CURRENT_VISIBLE_ITEMS);
      renderJump(years);

      hideExpand();
      hideDetail();

      if (activeTag === "all") setStatus("Showing all items.");
      else if (activeTag === "required") setStatus("Showing required cases.");
      else setStatus(`Filtered by: ${activeTag}`);
    });
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

function openFromHash(allItems) {
  const h = (window.location.hash || "").trim();
  const m = h.match(/^#item-(.+)$/);
  if (!m) return false;

  const id = m[1];
  const c = allItems.find((x) => x.id === id);
  if (!c) return false;

  const yearSection = document.getElementById(`year-${c.year}`);
  yearSection?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });

  const itemsInYear = allItems.filter((x) => x.year === c.year);
  openYearExpand(c.year, itemsInYear);
  openItemDetail(allItems, c.id, false);
  return true;
}

function openHowToIfNeeded() {
  const details = document.getElementById("howtoDetails");
  if (!details) return;
  const hash = window.location.hash || "";
  if (hash.startsWith("#howto")) {
    details.open = true;
    details.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

window.addEventListener("hashchange", openHowToIfNeeded);

document.addEventListener("DOMContentLoaded", async () => {
  wireNavButtons();
  wireCollapse();
  wireCopyLink();
  hideExpand();
  hideDetail();
  openHowToIfNeeded();

  try {
    ALL_ITEMS = await loadItems();
    CURRENT_VISIBLE_ITEMS = applyFilter(ALL_ITEMS);

    wireFilters();

    const years = renderYears(CURRENT_VISIBLE_ITEMS);
    renderJump(years);

    if (!openFromHash(ALL_ITEMS)) {
      setStatus("Drag horizontally. Click a year to expand.");
    }
  } catch (e) {
    setStatus("Error loading timeline data.");
    console.error(e);
  }
});