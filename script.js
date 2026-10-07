(() => {
  const T = window.AI_TIMELINE, EV = window.AI_EVENTS, OV = T.overview;
  const IDLE_WARN = 90000, IDLE_RESET = 20000;
  const SITE_URL = { en: "https://bodyanddata.org/", ne: "https://bodyanddata.org/ne/" };
  const ACTIVITIES_URL = "#activities";
  const PAPERS = ["lavender", "butter", "sky", "peach", "sage", "sand", "mist"];
  const UI = {
    en: { explore: "Explore activities", visit: "Visit Body & Data", hint: "Tap any year or use", keys: "to move through the years", next: "Next", prev: "Previous", close: "Close", still: "Still exploring?", stillText: "The timeline goes back to the start in a few seconds so the next visitor can begin fresh.", keep: "Keep exploring", winter: "AI winter" },
    ne: { explore: "गतिविधिहरू हेर्नुहोस्", visit: "बडी एन्ड डेटामा जानुहोस्", hint: "थप पढ्न कुनै पनि वर्षमा थिच्नुहोस्।", keys: "वर्षहरू अघि-पछि सार्न", next: "अर्को", prev: "अघिल्लो", close: "बन्द गर्नुहोस्", still: "अझै हेर्दै हुनुहुन्छ?", stillText: "अर्को आगन्तुकले नयाँ सुरुवात गर्न सकून् भनेर टाइमलाइन केही सेकेन्डमा सुरुमा फर्किन्छ।", keep: "हेर्न जारी राख्नुहोस्", winter: "एआई हिउँद" }
  };
  const P = {
    "arrow-right": "M5 12h14M13 6l6 6-6 6", "arrow-left": "M19 12H5M11 6l-6 6 6 6",
    close: "M6 6l12 12M18 6L6 18", "chevron-down": "M6 9l6 6 6-6",
    book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 21h15", external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5",
    moon: "M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z", sun: "M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"
  };
  const icon = n => `<svg class="bd-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const tr = (o, k) => (S.lang === "ne" && o.ne && o.ne[k]) || o[k];
  const START = T.sections.map((_, p) => T.sections.slice(0, p).reduce((n, s) => n + s.events.length, 0));
  const shuffle = () => { const out = []; EV.forEach(() => { const o = PAPERS.filter(p => p !== out[out.length - 1]); out.push(o[Math.floor(Math.random() * o.length)]); }); return out; };

  const HOME = Math.max(0, EV.findIndex(e => e.year === "1956"));
  const fmt = s => esc(s.trim()).replace(/\n\s*/g, "<br><br>");
  const S = { page: EV[HOME].section, sel: HOME, seen: new Set([HOME]), overview: false, idle: false, lang: "en", dark: false, papers: shuffle(), animate: true };
  try { S.dark = localStorage.getItem("ai-tl-dark") === "1"; } catch (e) {}
  const root = document.getElementById("root");
  const timers = {};
  let swipe = null;

  /* ---------- state changes ---------- */
  function go(i) {
    if (i < 0 || i >= EV.length) return;
    S.animate = EV[i].section !== S.page;
    S.sel = i; S.page = EV[i].section; S.seen.add(i); render();
  }
  const toggle = i => { if (S.sel === i) { S.sel = -1; S.animate = false; render(); } else go(i); };
  const showPage = p => { if (p >= 0 && p < T.sections.length) go(START[p]); };
  function reset() {
    Object.assign(S, { idle: false, overview: false, page: EV[HOME].section, sel: HOME, seen: new Set([HOME]), lang: "en", papers: shuffle(), animate: true });
    render();
  }
  function arm() {
    clearTimeout(timers.w); clearTimeout(timers.r);
    timers.w = setTimeout(() => { S.idle = true; render(); timers.r = setTimeout(reset, IDLE_RESET); }, IDLE_WARN);
  }

  /* ---------- templates ---------- */
  const keys = label => `<span class="keys"><kbd aria-hidden="true">←</kbd><kbd aria-hidden="true">→</kbd><span>${label}</span></span>`;

  function ext(dir, t) {
    const p = S.page + (dir === "next" ? 1 : -1), s = T.sections[p];
    const label = dir === "next" ? t.next : t.prev;
    return `<li class="ext ${dir}"><button class="ext-btn" data-page="${p}" aria-label="${label}: ${esc(s.label)}">
      <span class="ext-arrow">${icon(dir === "next" ? "arrow-right" : "arrow-left")}</span>
      <span class="ext-lab"><span class="ext-k">${label}</span></span></button></li>`;
  }

  function timeline(t) {
    return T.sections.map((s, p) => {
      const hasPrev = p > 0, hasNext = p < T.sections.length - 1, n = s.events.length, active = p === S.page;
      const cols = [hasPrev && "150px", `repeat(${n},minmax(0,1fr))`, hasNext && "150px"].filter(Boolean).join(" ");
      const items = s.events.map((e, j) => {
        const i = START[p] + j;
        const cls = ["event", e.period && "period", S.seen.has(i) && "seen", S.sel === i && "sel", j === 0 && !hasPrev && "first", j === n - 1 && !hasNext && "last"].filter(Boolean).join(" ");
        return `<li class="${cls}" data-i="${i}"><div class="item">
          <p class="year"${e.period ? ' style="font-size:1rem"' : ""}>${esc(e.year)}</p>${e.period ? "" : `<p class="text">${esc(tr(e, "title"))}</p>`}</div>
          <span class="dot">${e.period ? (e.pill || t.winter) : ""}</span>
          <button class="hit" data-toggle="${i}" aria-expanded="${S.sel === i}" aria-label="${esc(e.year + ": " + tr(e, "title"))}"></button></li>`;
      }).join("");
      return `<section class="page${active ? " active" : ""}" aria-label="${esc(s.label)}"><ol class="events" style="grid-template-columns:${cols}">
        ${active && hasPrev ? ext("prev", t) : ""}${items}${active && hasNext ? ext("next", t) : ""}</ol></section>`;
    }).join("");
  }

  function detail(t) {
    if (S.sel < 0) return `<div class="detail"></div>`;
    const e = EV[S.sel];
    const media = e.image
      ? `<div class="box-media" style="background-color:var(--bd-${S.papers[S.sel]})"><img src="${e.image}" alt="${esc(tr(e, "title"))}"></div>`
      : `<div class="box-media blank bd-doodles"><span>${esc(e.year)}</span></div>`;
    return `<div class="detail open" aria-live="polite"><div class="box">${media}<div class="box-main">
      <div class="box-head"><span class="box-year">${esc(e.year)}</span>
        <button class="bd-btn bd-btn--quiet" data-close aria-label="${t.close}">${icon("close")}</button></div>
      <h2>${esc(tr(e, "title"))}</h2><p class="box-text">${fmt(tr(e, "description"))}</p></div></div></div>`;
  }

  function mobileList(t) {
    return T.sections.map((s, p) => `<div><p class="vsec">${esc(s.label)}</p><ol>${s.events.map((e, j) => {
      const i = START[p] + j, open = S.sel === i;
      const cls = ["vli", e.period && "period", S.seen.has(i) && "seen", open && "sel"].filter(Boolean).join(" ");
      const next = EV[i + 1];
      return `<li class="${cls}"><button class="vrow" data-toggle="${i}" aria-expanded="${open}">
        <span class="vdot"></span><span class="vtxt"><span class="year">${esc(e.year)}</span><span class="text">${esc(tr(e, "title"))}</span></span>
        <span class="vchev">${icon("chevron-down")}</span></button>
        ${open ? `<div class="vpanel">${e.image ? `<div class="vmedia" style="background-color:var(--bd-${S.papers[i]})"><img src="${e.image}" alt="${esc(tr(e, "title"))}"></div>` : ""}
          <div class="vbody"><p>${fmt(tr(e, "description"))}</p>
          ${next ? `<button class="bd-btn bd-btn--sm" data-go="${i + 1}">${t.next}: ${esc(next.short || next.year)} ${icon("arrow-right")}</button>` : ""}</div></div>` : ""}</li>`;
    }).join("")}</ol></div>`).join("");
  }

  function render() {
    const t = UI[S.lang], ne = S.lang === "ne";
    document.documentElement.lang = S.lang;
    document.documentElement.setAttribute("data-theme", S.dark ? "dark" : "light");
    root.innerHTML = `<div class="app ${S.animate ? "" : "no-anim"}">
      <header class="top">
        <a class="bd-logo" href="#" data-reset><img src="${S.dark ? "image/logo-dark.png" : "image/logo.png"}" alt="Body &amp; Data"></a>
        <div class="top-actions">
          <button class="bd-btn bd-btn--ghost bd-btn--sm" data-theme-toggle aria-label="Toggle dark mode">${icon(S.dark ? "sun" : "moon")}</button>
          <a class="bd-btn bd-btn--ghost bd-btn--sm" href="${ACTIVITIES_URL}">${icon("book")} ${t.explore}</a>
          <a class="bd-btn bd-btn--sm" href="${SITE_URL[S.lang]}" target="_blank" rel="noopener">${t.visit} ${icon("external")}</a>
          <div class="lang" role="group" aria-label="Language">
            <button aria-pressed="${!ne}" data-lang="en" lang="en">English</button>
            <button aria-pressed="${ne}" data-lang="ne" lang="ne">नेपाली</button></div>
        </div></header>
      <div class="wrap">
        <div class="title"><h1 class="bd-h1 bd-barred">${esc(ne ? T.title_ne : T.title)}</h1>
          <p class="hintline"><span>${t.hint}</span>${keys(t.keys)}</p></div>
        <main class="stage"><div class="track">${detail(t)}${timeline(t)}</div></main>
        <div class="vlist">${mobileList(t)}</div>
      </div>
      ${S.overview ? `<div class="veil" data-veil role="dialog" aria-modal="true"><div class="sheet">
        <div class="sheet-head"><h2 class="bd-h2">${esc(tr(OV, "title"))}</h2><button class="bd-btn bd-btn--quiet" data-close-overview>${t.close}</button></div>
        <img src="${OV.image}" alt="Diagram of what AI is"><p>${esc(tr(OV, "text"))}</p></div></div>` : ""}
      ${S.idle ? `<div class="veil" role="dialog" aria-modal="true"><div class="sheet small"><h3 class="bd-h3">${t.still}</h3>
        <p>${t.stillText}</p><button class="bd-btn" data-keep>${t.keep}</button></div></div>` : ""}
    </div>`;
    document.body.style.background = "var(--bd-band-mist)";
    if (S.sel >= 0) requestAnimationFrame(place);
  }

  /* ---------- detail card placement (points a line from card to dot) ---------- */
  function place() {
    const box = root.querySelector(".detail.open"), track = root.querySelector(".track");
    const li = root.querySelector(`.event[data-i="${S.sel}"]`);
    if (!box || !li || !track) return;
    const tb = track.getBoundingClientRect(), dot = li.querySelector(".dot").getBoundingClientRect();
    const target = dot.top - tb.top;
    const tops = [...track.querySelectorAll(".page.active .dot")].map(d => d.getBoundingClientRect().top - tb.top);
    const bottom = Math.min(...tops) - 40;
    box.style.top = (bottom - box.offsetHeight) + "px";
    box.style.setProperty("--ch", Math.max(10, target - bottom) + "px");
    const w = box.offsetWidth, x = dot.left + dot.width / 2 - tb.left;
    const left = Math.max(0, Math.min(tb.width - w, x - w / 2));
    box.style.left = left + "px";
    box.style.setProperty("--px", Math.max(16, Math.min(w - 16, x - left)) + "px");
  }
  window.addEventListener("resize", place);
  if (document.fonts) document.fonts.ready.then(place);

  /* ---------- events ---------- */
  root.addEventListener("click", e => {
    const q = s => e.target.closest(s);
    let el;
    if ((el = q("[data-toggle]"))) toggle(+el.dataset.toggle);
    else if ((el = q("[data-page]"))) showPage(+el.dataset.page);
    else if ((el = q("[data-go]"))) go(+el.dataset.go);
    else if (q("[data-close]")) { S.sel = -1; S.animate = false; render(); }
    else if ((el = q("[data-lang]"))) { S.lang = el.dataset.lang; S.animate = false; render(); }
    else if (q("[data-theme-toggle]")) { S.dark = !S.dark; S.animate = false; try { localStorage.setItem("ai-tl-dark", S.dark ? "1" : "0"); } catch (x) {} render(); }
    else if (q("[data-reset]")) { e.preventDefault(); reset(); }
    else if (q("[data-keep]")) { S.idle = false; arm(); render(); }
    else if (q("[data-close-overview]") || e.target.matches("[data-veil]")) { S.overview = false; render(); }
  });
  root.addEventListener("pointerdown", e => { if (e.pointerType !== "mouse" && e.target.closest(".stage")) swipe = { x: e.clientX, y: e.clientY }; });
  root.addEventListener("pointerup", e => {
    const s = swipe; swipe = null; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) showPage(S.page + (dx < 0 ? 1 : -1));
  });
  window.addEventListener("keydown", e => {
    if (e.key === "Escape") { S.overview = false; S.sel = -1; S.animate = false; render(); return; }
    if (S.overview || S.idle) return;
    if (e.key === "ArrowRight") go(S.sel < 0 ? START[S.page] : S.sel + 1);
    if (e.key === "ArrowLeft") go(S.sel < 0 ? START[S.page] : S.sel - 1);
  });
  ["pointerdown", "keydown", "wheel", "touchmove"].forEach(ev => window.addEventListener(ev, arm, { passive: true }));

  arm();
  render();
})();