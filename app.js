(() => {
  "use strict";

  const { PLAN, FOODS, RECIPES, SAUCES, WEEKS, PANTRY, SHAKER, SESSIONS, SCHEDULE, RULES, PREP, SUPPLEMENTS, SUPP_MOMENTS } = window;

  /* ---------------- helpers ---------------- */
  const $ = (s, el = document) => el.querySelector(s);
  const DAY_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const DAY_LONG = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const MEAL_LABEL = { breakfast: "Petit-déj", lunch: "Déjeuner", shaker: "Après la séance", dinner: "Dîner" };
  const ICON = {
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M7 4L3 8l4 4M3 8h13M17 20l4-4-4-4M21 16H8"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
  };

  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dow = (d) => (d.getDay() + 6) % 7; // 0 = lundi
  const mondayOf = (d) => addDays(d, -dow(d));
  const todayIso = () => iso(new Date());
  const fmt = (n, dec = 0) => Number(n).toLocaleString("fr-FR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const store = {
    get(k, def) { try { const v = localStorage.getItem("sf." + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
    set(k, v) { try { localStorage.setItem("sf." + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  };

  /* ---------------- nutrition ---------------- */
  function macros(ing, mult = 1) {
    const t = { k: 0, p: 0, c: 0, f: 0 };
    for (const [key, g] of ing) {
      const f = FOODS[key];
      if (!f) continue;
      const q = (g * mult) / 100;
      t.k += f[1] * q; t.p += f[2] * q; t.c += f[3] * q; t.f += f[4] * q;
    }
    return t;
  }
  const add = (a, b) => ({ k: a.k + b.k, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f });

  /* ---------------- state ---------------- */
  const state = {
    tab: store.get("tab", "salle"),
    date: todayIso(),
    repasSeg: store.get("repasSeg", "jour"),
  };
  let log = store.get("log", {});
  const saveLog = () => store.set("log", log);
  const dayLog = (date) => { const l = (log[date] ||= { sets: {}, kg: {}, meals: {}, extra: {} }); l.supp ||= {}; return l; };

  const sessionKeyFor = (date) => (log[date] && log[date].session) || SCHEDULE[dow(parse(date))];
  // Menu de la semaine : l'entrée WEEKS du lundi, sinon la dernière disponible avant
  const WEEK_KEYS = Object.keys(WEEKS).sort();
  function weekFor(date) {
    const mon = iso(mondayOf(parse(date)));
    let key = WEEK_KEYS[0];
    for (const k of WEEK_KEYS) if (k <= mon) key = k;
    return { ...WEEKS[key], own: key === mon, monday: mon };
  }
  const menuFor = (date) => weekFor(date).menu[dow(parse(date))];
  function weekRange(date) {
    const mon = mondayOf(parse(date)), sun = addDays(mon, 6);
    return mon.getMonth() === sun.getMonth()
      ? `${mon.getDate()} → ${sun.getDate()} ${MONTHS[sun.getMonth()]}`
      : `${mon.getDate()} ${MONTHS[mon.getMonth()].slice(0, 4)}. → ${sun.getDate()} ${MONTHS[sun.getMonth()].slice(0, 4)}.`;
  }
  const weekTitle = (date) => { const w = weekFor(date); return w.own ? w.label : `Semaine du ${weekRange(date)}`; };

  /* ---------------- week strip ---------------- */
  function renderDays() {
    const mon = mondayOf(parse(state.date));
    const today = todayIso();
    let html = "";
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const id = iso(d);
      const kind = SESSIONS[sessionKeyFor(id)].kind;
      html += `<button class="day ${id === today ? "today" : ""}" role="tab" data-date="${id}"
        aria-selected="${id === state.date}" aria-label="${DAY_LONG[i]} ${d.getDate()}">
        <small>${id === today ? "Auj." : DAY_SHORT[i]}</small><b>${d.getDate()}</b><i class="pip ${kind}"></i></button>`;
    }
    $("#days").innerHTML = html;
  }

  /* ---------------- SALLE ---------------- */
  function lastKg(exName, beforeDate) {
    let best = null;
    for (const [date, l] of Object.entries(log)) {
      if (date >= beforeDate || !l.kg) continue;
      const v = l.kg[exName];
      if (v && (!best || date > best.date)) best = { date, v };
    }
    return best ? best.v : "";
  }

  function renderSalle() {
    const date = state.date;
    const d = parse(date);
    const key = sessionKeyFor(date);
    const s = SESSIONS[key];
    const L = dayLog(date);
    const overridden = !!(log[date] && log[date].session);

    let total = 0, done = 0, body = "";

    if (s.kind === "gym") {
      body += `<ol class="ex-list">`;
      s.ex.forEach((e, i) => {
        const sets = L.sets[`${key}:${i}`] || [];
        const nDone = sets.filter(Boolean).length;
        total += e.s; done += Math.min(nDone, e.s);
        const prev = lastKg(e.n, date);
        const cur = L.kg[e.n] ?? "";
        let bubbles = "";
        for (let j = 0; j < e.s; j++) {
          bubbles += `<button class="set ${sets[j] ? "on" : ""}" data-set="${i}:${j}" aria-pressed="${!!sets[j]}"
            aria-label="Série ${j + 1}">${sets[j] ? ICON.check.replace('viewBox', 'style="width:16px;height:16px;stroke-width:3" viewBox') : j + 1}</button>`;
        }
        body += `<li class="ex ${nDone >= e.s ? "done" : ""}" data-ex="${i}">
          <button class="ex-head" data-toggle-cue="${i}" aria-expanded="false">
            <span class="ex-name">${esc(e.n)} <span class="cue-hint" aria-hidden="true">?</span></span>
            <span class="ex-scheme num">${e.s} × ${esc(e.r)}<small>repos ${fmtRest(e.rest)}</small></span>
            <span class="ex-cue">${esc(e.cue)}</span>
          </button>
          <div class="ex-row">
            <div class="sets">${bubbles}</div>
            <label class="kg"><input type="number" inputmode="decimal" step="0.5" min="0"
              data-kg="${esc(e.n)}" value="${cur}" placeholder="${prev || "—"}" aria-label="Charge en kg pour ${esc(e.n)}"><span>kg</span></label>
          </div>
        </li>`;
      });
      body += `</ol>`;
      if (s.cardio) {
        total += 1; const on = !!L.extra[`${key}:cardio`]; if (on) done += 1;
        body += `<h2 class="section-title">Pour finir</h2>
          <button class="block ${on ? "on" : ""}" data-extra="${key}:cardio" aria-pressed="${on}">
            <span class="check">${ICON.check}</span>
            <span class="block-main"><span class="block-title">${esc(s.cardio)}</span></span>
          </button>`;
      }
    } else {
      body += `<div style="margin-top:8px">`;
      s.blocks.forEach((b, i) => {
        const k = `${key}:b${i}`; const on = !!L.extra[k];
        if (s.kind !== "rest") { total += 1; if (on) done += 1; }
        body += `<button class="block ${on ? "on" : ""}" data-extra="${k}" aria-pressed="${on}">
          <span class="check">${ICON.check}</span>
          <span class="block-main"><span class="block-title">${esc(b.n)}${b.d ? ` <span class="num" style="color:var(--muted);font-weight:500">· ${esc(b.d)}</span>` : ""}</span>
          <span class="block-sub">${esc(b.cue)}</span></span>
        </button>`;
      });
      body += `</div>`;
      if (s.kind === "rest") {
        body += `<h2 class="section-title">Prépa du dimanche</h2>
          <p class="section-sub">1 h 30 aujourd'hui, et la semaine est facile.</p>`;
        PREP.forEach((p, i) => {
          const k = `prep:${i}`; const on = !!L.extra[k];
          body += `<button class="block ${on ? "on" : ""}" data-extra="${k}" aria-pressed="${on}">
            <span class="check">${ICON.check}</span><span class="block-main"><span class="block-sub" style="color:var(--text)">${esc(p)}</span></span></button>`;
        });
      }
    }

    const pct = total ? Math.round((done / total) * 100) : 0;
    const chips = [`<span class="chip accent">${esc(s.focus)}</span>`];
    if (s.duration) chips.push(`<span class="chip num">${s.duration} min</span>`);
    if (s.kind === "gym") chips.push(`<span class="chip num">${s.ex.length} exercices</span>`);

    return `
      <section class="hero">
        <div class="hero-day"><span>${DAY_LONG[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span>
          <button class="link-btn" data-action="swap">${ICON.swap}${overridden ? "Modifiée" : "Changer"}</button></div>
        <h1 class="hero-title">${esc(s.name)}</h1>
        <div class="hero-meta">${chips.join("")}</div>
        ${total ? `<div class="progress"><i style="width:${pct}%"></i></div>
        <div class="progress-label num"><span>${done} / ${total} ${s.kind === "gym" ? "séries" : "fait"}</span><span>${pct} %</span></div>` : ""}
      </section>
      ${body}
      ${s.kind === "gym" ? `<details class="rules"><summary>Règles de progression ${ICON.down}</summary>
        <ul>${RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>` : ""}
    `;
  }
  const fmtRest = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}:${pad(sec % 60)}` : `${sec} s`);

  function openSwapSheet() {
    const date = state.date;
    const current = sessionKeyFor(date);
    const planned = SCHEDULE[dow(parse(date))];
    let html = `<h2 class="r-title" style="font-size:24px">Changer la séance</h2>
      <p class="section-sub" style="margin:4px 0 8px">Seulement pour ce ${DAY_LONG[dow(parse(date))].toLowerCase()}.</p>`;
    for (const [k, s] of Object.entries(SESSIONS)) {
      html += `<button class="sheet-option ${k === current ? "current" : ""}" data-pick-session="${k}">
        <span>${esc(s.name)} <small>${esc(s.focus)}</small></span>
        <small>${k === planned ? "Prévu" : ""}${k === current ? " ✓" : ""}</small></button>`;
    }
    openSheet(html);
  }

  /* ---------------- REPAS ---------------- */
  function dayMeals(date) {
    const m = menuFor(date);
    return [
      { slot: "breakfast", id: m.breakfast, r: RECIPES[m.breakfast] },
      { slot: "lunch", id: m.lunch, r: RECIPES[m.lunch] },
      { slot: "shaker", id: "shaker", r: SHAKER },
      { slot: "dinner", id: m.dinner, r: RECIPES[m.dinner] },
    ];
  }

  function macroLine(m) {
    return `<span class="meal-macro num"><b>${fmt(m.k)} kcal</b><span class="mp">P ${fmt(m.p)}</span><span class="mc">G ${fmt(m.c)}</span><span class="mf">L ${fmt(m.f)}</span></span>`;
  }

  function renderRepas() {
    const seg = state.repasSeg;
    const segs = [["jour", "Jour"], ["semaine", "Semaine"], ["recettes", "Recettes"], ["sauces", "Sauces"]];
    const segHtml = `<div class="seg" role="group" aria-label="Affichage">${segs.map(([k, l]) =>
      `<button data-seg="${k}" aria-pressed="${seg === k}">${l}</button>`).join("")}</div>`;

    if (seg === "recettes") return segHtml + renderRecipeLibrary();
    if (seg === "semaine") return segHtml + renderWeekMenu();
    if (seg === "sauces") return segHtml + renderSauces();

    const date = state.date;
    const d = parse(date);
    const L = dayLog(date);
    const meals = dayMeals(date);
    let tot = { k: 0, p: 0, c: 0, f: 0 }, eaten = { k: 0, p: 0, c: 0, f: 0 };
    meals.forEach((m) => { m.mac = macros(m.r.ing); tot = add(tot, m.mac); if (L.meals[m.slot]) eaten = add(eaten, m.mac); });
    const T = PLAN.targets;
    const bar = (cls, label, v, t) => `<div class="macro"><span>${label} <b class="num">${fmt(v)}</b></span>
      <div class="bar ${cls}"><i style="width:${Math.min(100, (v / t) * 100)}%"></i></div></div>`;
    const anyEaten = Object.values(L.meals).some(Boolean);

    return `
      ${segHtml}
      <section class="hero" style="padding-bottom:8px">
        <div class="hero-day"><span>${DAY_LONG[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span>
          <span class="num" style="font-size:13px">objectif ${fmt(T.kcal)} kcal</span></div>
      </section>
      <div class="totals">
        <div class="kcal-big num">${fmt(anyEaten ? eaten.k : tot.k)}<small>${anyEaten ? `kcal mangées sur ${fmt(tot.k)}` : "kcal prévues"}</small></div>
        <div class="macros">
          ${bar("p", "Prot.", anyEaten ? eaten.p : tot.p, T.p)}
          ${bar("c", "Gluc.", anyEaten ? eaten.c : tot.c, T.c)}
          ${bar("f", "Lip.", anyEaten ? eaten.f : tot.f, T.f)}
        </div>
      </div>
      <ul class="meals">
        ${meals.map((m) => {
          const on = !!L.meals[m.slot];
          return `<li class="meal ${on ? "on" : ""}">
            <button class="check ${on ? "on" : ""}" data-meal="${m.slot}" aria-pressed="${on}" aria-label="Marquer ${MEAL_LABEL[m.slot]} comme mangé">${ICON.check}</button>
            <button class="meal-open" data-recipe="${m.id}">
              <span class="meal-txt">
                <span class="meal-when">${MEAL_LABEL[m.slot]}</span>
                <span class="meal-name" style="display:block">${esc(m.r.name)}</span>
                ${macroLine(m.mac)}
              </span>
              <span class="chev">${ICON.chev}</span>
            </button></li>`;
        }).join("")}
      </ul>
      ${(() => { const w = weekFor(date); return w.own && w.note ? `<p class="note">${esc(w.note)}</p>` : ""; })()}
    `;
  }

  function renderWeekMenu() {
    const mon = mondayOf(parse(state.date));
    const today = todayIso();
    let html = `<section class="hero" style="padding-bottom:4px"><div class="hero-day"><span>${esc(weekTitle(state.date))}</span>
      <span class="num" style="font-size:13px">${weekRange(state.date)}</span></div></section>`;
    for (let i = 0; i < 7; i++) {
      const dt = iso(addDays(mon, i));
      const m = menuFor(dt);
      html += `<div class="wk-day ${dt === today ? "today" : ""} ${dt === state.date ? "sel" : ""}">
        <button class="wk-label" data-date-go="${dt}"><b>${DAY_SHORT[i]}</b><span class="num">${addDays(mon, i).getDate()}</span></button>
        <div class="wk-meals">${["breakfast", "lunch", "dinner"].map((s) =>
          `<button data-recipe="${m[s]}"><span>${MEAL_LABEL[s]}</span>${esc(RECIPES[m[s]].name)}</button>`).join("")}</div></div>`;
    }
    return html;
  }

  function renderRecipeLibrary() {
    const groups = [["breakfast", "Petits-déjeuners"], ["lunch", "Déjeuners"], ["dinner", "Dîners"]];
    return groups.map(([k, label]) => {
      const items = Object.entries(RECIPES).filter(([, r]) => r.meal === k);
      return `<h2 class="section-title">${label}</h2><ul class="recipe-list">${items.map(([id, r]) => {
        const m = macros(r.ing);
        return `<li><button data-recipe="${id}"><span class="meal-txt">
          <span class="meal-name" style="display:block">${esc(r.name)}</span>${macroLine(m)}</span>
          <span class="chev">${ICON.chev}</span></button></li>`;
      }).join("")}</ul>`;
    }).join("");
  }

  function renderSauces() {
    return `<h2 class="section-title">Sauces maison</h2>
      <p class="section-sub">Toutes salées, sans sucre. Macros pour 1 portion.</p>
      ${SAUCES.map((s) => {
        const m = macros(s.ing);
        return `<div class="sauce"><h3>${esc(s.name)} <span class="jp">${esc(s.jp)}</span></h3>
          <p>${esc(s.use)}</p>
          <div class="ing-inline">${s.ing.map(([k, g, note]) => `${g ? `<b class="num">${g} g</b> ` : ""}${esc(note || FOODS[k][0].replace(/\s*\(.*\)/, "").toLowerCase())}`).join(", ")}</div>
          <div style="margin-top:6px">${macroLine(m)}</div></div>`;
      }).join("")}`;
  }

  function openRecipe(id, mult = 1) {
    const r = id === "shaker" ? SHAKER : RECIPES[id];
    if (!r) return;
    const m = macros(r.ing, mult);
    const ingRows = r.ing.map(([k, g, note]) => {
      const f = FOODS[k];
      let qty = g ? `${fmt(g * mult)} g` : "";
      if (k === "oeuf" && g) { const n = (g * mult) / 50; qty = `${fmt(n)} œuf${n > 1 ? "s" : ""}<small>${fmt(g * mult)} g</small>`; }
      if (k === "nori" && g >= 3) { const n = Math.round((g * mult) / 3); qty = `${n} feuille${n > 1 ? "s" : ""}`; }
      // les précisions de type "2 œufs" / "1 pavé" ne valent que pour 1 portion
      const showNote = note && !(mult > 1 && /^\d/.test(note)) && !(k === "oeuf" && /œuf/.test(note) && /^\d/.test(note));
      return `<tr><td>${esc(f[0].replace(/\s*\((1|poudre).*\)/, ""))}${showNote ? `<small>${esc(note)}</small>` : ""}</td><td class="num">${qty || "<span style='color:var(--muted);font-weight:500'>au goût</span>"}</td></tr>`;
    }).join("");

    const html = `
      ${r.jp ? `<div class="jp">${esc(r.jp)}</div>` : ""}
      <h2 class="r-title">${esc(r.name)}</h2>
      <div class="hero-meta">
        ${r.meal ? `<span class="chip accent">${MEAL_LABEL[r.meal]}</span>` : ""}
        ${r.time ? `<span class="chip num">${r.time} min</span>` : ""}
        ${mult > 1 ? `<span class="chip num">${mult} portions</span>` : ""}
      </div>
      <div class="r-macros num">
        <div class="r-macro"><b>${fmt(m.k)}</b><span>kcal</span></div>
        <div class="r-macro p"><b>${fmt(m.p)}</b><span>protéines</span></div>
        <div class="r-macro c"><b>${fmt(m.c)}</b><span>glucides</span></div>
        <div class="r-macro f"><b>${fmt(m.f)}</b><span>lipides</span></div>
      </div>
      <div class="r-head"><h3>Ingrédients</h3>
        ${r.steps ? `<div class="mini-seg" role="group" aria-label="Portions">${[1, 2, 3].map((n) =>
          `<button data-mult="${n}" data-rid="${id}" aria-pressed="${n === mult}">×${n}</button>`).join("")}</div>` : ""}
      </div>
      <table class="ing"><tbody>${ingRows}</tbody></table>
      ${r.steps ? `<div class="r-head"><h3>Préparation</h3></div>
        <ol class="steps">${r.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>` : ""}
      ${r.tip ? `<p class="tip"><b>Astuce</b> · ${esc(r.tip)}</p>` : ""}
      ${id === "shaker" ? `<p class="tip"><b>Quand</b> · juste après la séance. Les jours sans salle, prends-le au goûter : ce sont tes protéines du jour.</p>` : ""}
    `;
    openSheet(html, !!$("#sheet:not([hidden])"));
  }

  /* ---------------- COURSES ---------------- */
  function shoppingList(date) {
    const totals = {};
    weekFor(date).menu.forEach((day) => ["breakfast", "lunch", "dinner"].forEach((slot) => {
      RECIPES[day[slot]].ing.forEach(([k, g]) => { totals[k] = (totals[k] || 0) + g; });
    }));
    SHAKER.ing.forEach(([k, g]) => { totals[k] = (totals[k] || 0) + g * 7; });
    const groups = {}, pantry = [];
    for (const [k, g] of Object.entries(totals)) {
      if (PANTRY.includes(k)) { pantry.push({ k, g }); continue; }
      (groups[FOODS[k][5]] ||= []).push({ k, g });
    }
    return { groups, pantry };
  }

  function qtyLabel(k, g) {
    if (!g) return "à avoir";
    if (k === "oeuf") return `${Math.ceil(g / 50)} œufs`;
    if (k === "nori") return `${Math.ceil(g / 3)} feuilles`;
    if (k === "udon") return `${Math.ceil(g / 200)} packs`;
    if (k === "riz") return `${fmt(Math.round(g * 0.43 / 100) / 10, 1)} kg cru`;
    if (k === "ail") return `${Math.ceil(g / 5)} gousses`;
    if (k === "whey") return `${fmt(g)} g`;
    const r = g >= 100 ? Math.ceil(g / 50) * 50 : Math.ceil(g / 10) * 10;
    return r >= 1000 ? `${fmt(r / 1000, r % 1000 ? 2 : 0).replace(/0$/, "")} kg` : `${r} g`;
  }

  const foodName = (k) => FOODS[k][0].replace(/\s*\((1|poudre).*\)/, "");

  function renderCourses() {
    const date = state.date;
    const mon = iso(mondayOf(parse(date)));
    const { groups, pantry } = shoppingList(date);
    const checked = store.get("shop." + mon, {});
    const have = store.get("pantry", {});
    const order = ["Protéines", "Féculents", "Légumes", "Épicerie", "Sauces"];
    const all = Object.values(groups).flat();
    const nDone = all.filter((x) => checked[x.k]).length;
    const toBuy = pantry.filter((x) => !have[x.k]);
    const item = (k, g, on, attr) => `<button class="shop-item ${on ? "on" : ""}" ${attr}="${k}" aria-pressed="${on}">
        <span class="check">${ICON.check}</span>
        <span class="block-main"><span class="block-title">${esc(foodName(k))}</span>
        <span class="shop-qty num">${qtyLabel(k, g)}</span></span></button>`;
    const menu = weekFor(date).menu;
    return `
      <section class="hero">
        <div class="hero-day"><span>${esc(weekTitle(date))}</span><span class="num" style="font-size:13px">${weekRange(date)}</span></div>
        <h1 class="hero-title">Courses</h1>
        <div class="hero-meta"><span class="chip accent num">${nDone} / ${all.length} cochés</span>
          ${nDone ? `<button class="chip" data-action="shop-reset">Tout décocher</button>` : ""}</div>
        <p class="section-sub" style="margin:12px 0 0">Pour les 7 jours de cette semaine uniquement. Coche ce que tu achètes <b style="color:var(--text)">ou ce qu'il te reste déjà</b> de la semaine d'avant. La liste repart à zéro chaque lundi.</p>
      </section>
      <details class="rules" style="margin-top:4px"><summary>Les plats de la semaine ${ICON.down}</summary>
        <ul class="wk-mini">${menu.map((m, i) => `<li><b>${DAY_SHORT[i]}</b>${["breakfast", "lunch", "dinner"].map((s) =>
          `<button data-recipe="${m[s]}">${esc(RECIPES[m[s]].name)}</button>`).join("")}</li>`).join("")}</ul>
      </details>
      ${order.filter((o) => groups[o]).map((o) => `
        <div class="shop-group"><h3>${o}</h3>
          ${groups[o].sort((a, b) => b.g - a.g).map(({ k, g }) => item(k, g, !!checked[k], "data-shop")).join("")}
        </div>`).join("")}
      <details class="rules pantry" ${toBuy.length ? "open" : ""}>
        <summary><span>Placard <small class="num">${toBuy.length ? `${toBuy.length} à racheter` : "tout est là"}</small></span>${ICON.down}</summary>
        <p class="section-sub" style="margin:0 0 4px">Sauces, riz, whey : ça dure plusieurs semaines. Coché = tu en as. Décoche quand c'est fini, ça restera dans ta liste jusqu'à ce que tu le rachètes.</p>
        ${pantry.sort((a, b) => (!!have[a.k]) - (!!have[b.k]) || b.g - a.g).map(({ k, g }) => item(k, g, !!have[k], "data-pantry")).join("")}
      </details>
      <p class="note">Poisson cru : achète-le le jour même (vendredi). Gyomu Super et Trial pour le volume, AEON pour le poisson.</p>
    `;
  }

  /* ---------------- COMPLÉMENTS ---------------- */
  const perDay = (s) => s.take.reduce((a, t) => a + t.n, 0);
  function jarStatus(s) {
    const start = store.get("jars", {})[s.id];
    if (!start) return null;
    let used = 0;
    for (const [date, l] of Object.entries(log)) {
      if (date < start || !l.supp) continue;
      for (const t of s.take) if (l.supp[`${s.id}:${t.at}`]) used += t.n;
    }
    const left = Math.max(0, s.jar - used);
    return { start, left, days: Math.floor(left / perDay(s)) };
  }

  function renderCompl() {
    const date = state.date; const d = parse(date); const L = dayLog(date);
    let total = 0, done = 0, moments = "";
    for (const [at, m] of Object.entries(SUPP_MOMENTS)) {
      const items = SUPPLEMENTS.flatMap((s) => s.take.filter((t) => t.at === at).map((t) => ({ s, t })));
      if (!items.length) continue;
      moments += `<div class="moment"><div class="moment-head"><b>${m.label}</b><span>${m.hint}</span></div>
        ${items.map(({ s, t }) => {
          const k = `${s.id}:${at}`; const on = !!L.supp[k]; total++; if (on) done++;
          return `<button class="pill ${on ? "on" : ""}" data-supp="${k}" aria-pressed="${on}">
            <span class="check">${ICON.check}</span><span class="block-title">${esc(s.name)}</span>
            <span class="pill-n num">${t.n} gélule${t.n > 1 ? "s" : ""}</span></button>`;
        }).join("")}</div>`;
    }
    const pct = total ? Math.round((done / total) * 100) : 0;
    const list = SUPPLEMENTS.map((s) => {
      const st = jarStatus(s);
      const WHEN = { petitdej: "matin", avantDej: "midi", avantDiner: "soir", soir: "soir" };
      const sched = `${perDay(s)} / jour · ${[...new Set(s.take.map((t) => WHEN[t.at]))].join(" + ")}`;
      const stock = st
        ? `<div class="supp-stock num ${st.days <= 7 ? "low" : ""}"><div class="bar"><i style="width:${(st.left / s.jar) * 100}%"></i></div>
            <span><b>${st.left}</b> gélules · ${st.days <= 0 ? "pot vide" : `${st.days} j restants`}</span></div>`
        : `<div class="supp-stock"><span style="color:var(--muted)">Stock non suivi</span></div>`;
      return `<div class="supp" data-supp-card="${s.id}">
        <button class="supp-head" data-supp-open="${s.id}" aria-expanded="false"><h3>${esc(s.name)}</h3><span class="supp-sched num">${sched}</span></button>
        <p class="supp-detail">${esc(s.detail)}</p>
        ${stock}
        <div class="supp-more">
          <p><b>Pourquoi</b> · <span style="color:var(--muted)">${esc(s.why)}</span></p>
          <p><b>Comment</b> · <span style="color:var(--muted)">${esc(s.how)}</span></p>
          <p><b>Cure</b> · <span style="color:var(--muted)">${esc(s.cure)}</span></p>
          ${s.warn ? `<p class="warn">${esc(s.warn)}</p>` : ""}
          <button class="chip" data-jar="${s.id}">${st ? "Nouveau pot ouvert aujourd'hui" : `Pot ouvert aujourd'hui (${s.jar} gélules)`}</button>
        </div></div>`;
    }).join("");
    return `
      <section class="hero">
        <div class="hero-day"><span>${DAY_LONG[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span></div>
        <h1 class="hero-title long">Compléments</h1>
        <div class="progress"><i style="width:${pct}%"></i></div>
        <div class="progress-label num"><span>${done} / ${total} prises</span><span>${pct} %</span></div>
      </section>
      ${moments}
      <h2 class="section-title">Mes compléments</h2>
      <p class="section-sub">Touche un complément pour voir pourquoi et comment le prendre, et suivre ton stock.</p>
      <div>${list}</div>
      <p class="disclaimer">Posologies d'Aroma-Zone. Ce n'est pas un avis médical : si tu prends un traitement, demande à un médecin ou un pharmacien.</p>
    `;
  }

  /* ---------------- SUIVI ---------------- */
  const weights = () => store.get("weights", {});
  const waists = () => store.get("waist", {});

  function avg(arr) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null; }
  function weekAvg(mon) {
    const w = weights(); const vals = [];
    for (let i = 0; i < 7; i++) { const v = w[iso(addDays(mon, i))]; if (v) vals.push(v); }
    return avg(vals);
  }

  function renderSuivi() {
    const w = weights();
    const entries = Object.entries(w).sort(([a], [b]) => a.localeCompare(b));
    const latest = entries.length ? entries[entries.length - 1][1] : null;
    const start = PLAN.startWeight, goal = PLAN.goalWeight;
    const lost = latest ? start - latest : 0;
    const pct = Math.max(0, Math.min(100, (lost / (start - goal)) * 100));
    const mon = mondayOf(parse(state.date));
    const thisAvg = weekAvg(mon), prevAvg = weekAvg(addDays(mon, -7));
    const delta = thisAvg && prevAvg ? thisAvg - prevAvg : null;
    const todayVal = w[state.date] ?? "";
    const wz = waists(); const wzEntries = Object.entries(wz).sort(([a], [b]) => a.localeCompare(b));
    const lastWaist = wzEntries.length ? wzEntries[wzEntries.length - 1] : null;
    const d = parse(state.date);

    return `
      <section class="hero">
        <div class="hero-day"><span>${DAY_LONG[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span></div>
        <h1 class="hero-title num">${latest ? fmt(latest, 1) : fmt(start)}<span style="font-size:.4em;color:var(--muted);font-weight:600"> kg</span></h1>
      </section>
      <div class="weigh">
        <label class="weigh-input"><input id="weightIn" type="number" inputmode="decimal" step="0.1" min="40" max="200"
          value="${todayVal}" placeholder="${latest ? fmt(latest, 1).replace(",", ".") : "110.0"}" aria-label="Poids du jour en kg"><span>kg</span></label>
        <button class="btn" data-action="save-weight">${todayVal ? "Modifier" : "Enregistrer"}</button>
      </div>
      <div class="goal-track">
        <div class="goal-bar"><i style="width:${pct}%"></i></div>
        <div class="goal-ends num"><span>${start} kg</span><span>${lost > 0 ? `−${fmt(lost, 1)} kg` : "Départ"}</span><span>${goal} kg</span></div>
      </div>
      <div class="stats num">
        <div class="stat"><b>${thisAvg ? fmt(thisAvg, 1) : "—"}</b><span>moyenne semaine</span></div>
        <div class="stat"><b style="color:${delta == null ? "inherit" : delta <= 0 ? "var(--ok)" : "var(--p)"}">${delta == null ? "—" : (delta > 0 ? "+" : "−") + fmt(Math.abs(delta), 1)}</b><span>vs semaine dernière</span></div>
        <div class="stat"><b>${latest ? fmt(Math.max(0, latest - goal), 1) : start - goal}</b><span>kg restants</span></div>
      </div>
      ${weightChart(entries)}
      <h2 class="section-title">Tour de taille</h2>
      <p class="section-sub">Une fois par semaine, au nombril, le matin.${lastWaist ? ` Dernier : <b class="num" style="color:var(--text)">${fmt(lastWaist[1], 1)} cm</b>.` : ""}</p>
      <div class="waist">
        <label class="weigh-input" style="flex:1"><input id="waistIn" type="number" inputmode="decimal" step="0.5" value="${wz[state.date] ?? ""}" placeholder="cm" aria-label="Tour de taille en cm"><span>cm</span></label>
        <button class="btn" data-action="save-waist">OK</button>
      </div>
      <h2 class="section-title">Bilan de la semaine</h2>
      <p class="section-sub">Copie-le et colle-le dans la conversation avec Claude pour ajuster le plan.</p>
      <button class="btn" style="width:100%;height:54px;display:flex;align-items:center;justify-content:center;gap:8px" data-action="copy-report">${ICON.copy} Copier le bilan</button>
      ${entries.length ? `<h2 class="section-title">Historique</h2><ul class="log">${entries.slice(-14).reverse().map(([dt, v]) => {
        const x = parse(dt);
        return `<li><span>${DAY_SHORT[dow(x)]} ${x.getDate()} ${MONTHS[x.getMonth()].slice(0, 4)}.</span><span style="display:flex;align-items:center"><b class="num" style="color:var(--text)">${fmt(v, 1)} kg</b><button data-del-weight="${dt}" aria-label="Supprimer">${ICON.x}</button></span></li>`;
      }).join("")}</ul>` : ""}
    `;
  }

  function weightChart(entries) {
    if (entries.length < 2) return `<div class="chart"><div class="chart-empty">Pèse-toi chaque matin à jeun : la courbe apparaît dès la 2e pesée.</div></div>`;
    const pts = entries.slice(-30);
    const W = 340, H = 170, padL = 34, padR = 10, padT = 12, padB = 22;
    const t0 = parse(pts[0][0]).getTime(), t1 = parse(pts[pts.length - 1][0]).getTime();
    const vals = pts.map((p) => p[1]);
    let lo = Math.floor(Math.min(...vals) - 1);
    let hi = Math.ceil(Math.max(...vals) + 0.5);
    if (hi - lo < 4) lo = hi - 4;
    const x = (t) => padL + ((t - t0) / Math.max(1, t1 - t0)) * (W - padL - padR);
    const y = (v) => padT + ((hi - v) / (hi - lo)) * (H - padT - padB);
    // moyenne glissante 7 jours
    const smooth = pts.map(([dt], i) => {
      const t = parse(dt).getTime();
      const win = pts.filter(([d2]) => { const t2 = parse(d2).getTime(); return t2 <= t && t2 > t - 7 * 864e5; }).map((p) => p[1]);
      return [t, avg(win)];
    });
    const ticks = []; const step = Math.max(1, Math.round((hi - lo) / 4));
    for (let v = Math.ceil(lo); v <= hi; v += step) ticks.push(v);
    return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Courbe de poids">
      ${ticks.map((v) => `<line x1="${padL}" x2="${W - padR}" y1="${y(v)}" y2="${y(v)}" stroke="rgba(160,176,215,.12)"/>
        <text x="${padL - 6}" y="${y(v) + 4}" fill="#8E9AB8" font-size="10" text-anchor="end" stroke="none">${v}</text>`).join("")}
      ${pts.map(([dt, v]) => `<circle cx="${x(parse(dt).getTime())}" cy="${y(v)}" r="2.6" fill="#5E6A88" stroke="none"/>`).join("")}
      <polyline points="${smooth.map(([t, v]) => `${x(t)},${y(v)}`).join(" ")}" stroke="var(--suivi)" stroke-width="2.5" fill="none"/>
      <text x="${padL}" y="${H - 4}" fill="#8E9AB8" font-size="10" stroke="none">${parse(pts[0][0]).getDate()}/${parse(pts[0][0]).getMonth() + 1}</text>
      <text x="${W - padR}" y="${H - 4}" fill="#8E9AB8" font-size="10" text-anchor="end" stroke="none">${parse(pts[pts.length - 1][0]).getDate()}/${parse(pts[pts.length - 1][0]).getMonth() + 1}</text>
    </svg><div class="goal-ends" style="margin:2px 4px 0"><span><i style="display:inline-block;width:8px;height:8px;border-radius:4px;background:#5E6A88"></i> pesées</span><span><i style="display:inline-block;width:14px;height:3px;border-radius:2px;background:var(--suivi);vertical-align:middle"></i> moyenne 7 jours</span></div></div>`;
  }

  function buildReport() {
    const mon = mondayOf(parse(state.date));
    const w = weights(); const wz = waists();
    const lines = [`BILAN ${weekTitle(state.date)} (plan ${PLAN.version}) — semaine du ${mon.getDate()}/${mon.getMonth() + 1}`];
    const dayVals = [];
    let gymDone = 0, gymPlanned = 0, mealsDone = 0, cardioDone = 0, suppDone = 0;
    const lifts = {};
    for (let i = 0; i < 7; i++) {
      const dt = iso(addDays(mon, i));
      if (w[dt]) dayVals.push(`${DAY_SHORT[i]} ${fmt(w[dt], 1)}`);
      const key = sessionKeyFor(dt); const s = SESSIONS[key]; const L = log[dt];
      if (s.kind === "gym") {
        gymPlanned++;
        const setsDone = L ? s.ex.reduce((a, e, j) => a + ((L.sets[`${key}:${j}`] || []).filter(Boolean).length), 0) : 0;
        const setsTot = s.ex.reduce((a, e) => a + e.s, 0);
        if (setsDone >= setsTot * 0.7) gymDone++;
        if (L) for (const [n, v] of Object.entries(L.kg || {})) if (v) lifts[n] = v;
      } else if (s.kind === "cardio" && L && Object.keys(L.extra).some((k) => k.startsWith(key) && L.extra[k])) cardioDone++;
      if (L) mealsDone += Object.values(L.meals).filter(Boolean).length;
      if (L && L.supp) suppDone += Object.values(L.supp).filter(Boolean).length;
    }
    const a = weekAvg(mon), p = weekAvg(addDays(mon, -7));
    lines.push(`Poids : ${dayVals.join(", ") || "pas de pesée"}`);
    lines.push(`Moyenne : ${a ? fmt(a, 1) + " kg" : "—"}${p ? ` (semaine d'avant ${fmt(p, 1)} kg, ${a ? (a - p > 0 ? "+" : "") + fmt(a - p, 1) : "?"} kg)` : ""}`);
    const wzE = Object.entries(wz).sort(([x], [y]) => x.localeCompare(y));
    if (wzE.length) lines.push(`Tour de taille : ${fmt(wzE[wzE.length - 1][1], 1)} cm`);
    lines.push(`Séances muscu complètes : ${gymDone}/${gymPlanned} · cardio : ${cardioDone}`);
    lines.push(`Repas cochés : ${mealsDone}/28`);
    lines.push(`Compléments pris : ${suppDone}/${SUPPLEMENTS.reduce((a, s) => a + s.take.length, 0) * 7}`);
    if (Object.keys(lifts).length) lines.push("Charges : " + Object.entries(lifts).map(([n, v]) => `${n} ${v} kg`).join(" ; "));
    lines.push("Ressenti (faim, énergie, sommeil) : ");
    return lines.join("\n");
  }

  /* ---------------- sheet ---------------- */
  const sheet = $("#sheet"), backdrop = $("#backdrop"), sheetBody = $("#sheetBody");
  function openSheet(html, keepOpen = false) {
    sheetBody.innerHTML = html;
    if (!keepOpen) {
      sheet.hidden = false; backdrop.hidden = false; sheet.classList.remove("closing");
      sheetBody.scrollTop = 0; document.body.style.overflow = "hidden";
    }
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.classList.add("closing");
    setTimeout(() => { sheet.hidden = true; backdrop.hidden = true; sheet.classList.remove("closing"); sheet.style.transform = ""; document.body.style.overflow = ""; }, 200);
  }
  backdrop.addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeSheet(); });
  (() => { // glisser pour fermer
    let y0 = null, dy = 0;
    const start = (e) => { if (e.target.closest("#sheetGrip") || sheetBody.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } };
    const move = (e) => {
      if (y0 == null) return; dy = e.touches[0].clientY - y0;
      if (dy > 0 && sheetBody.scrollTop <= 0) { sheet.style.transform = `translateY(${dy}px)`; sheet.style.transition = "none"; }
      else if (dy < 0) { y0 = null; sheet.style.transform = ""; }
    };
    const end = () => { if (y0 == null) return; sheet.style.transition = ""; if (dy > 110) closeSheet(); else sheet.style.transform = ""; y0 = null; };
    sheet.addEventListener("touchstart", start, { passive: true });
    sheet.addEventListener("touchmove", move, { passive: true });
    sheet.addEventListener("touchend", end);
  })();

  /* ---------------- toast ---------------- */
  let toastT;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800); }

  /* ---------------- rest timer ---------------- */
  const timer = { end: 0, int: null };
  let audioCtx;
  function beep() {
    try {
      audioCtx ||= new (window.AudioContext || window.webkitAudioContext)();
      [0, .18, .36].forEach((t) => {
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
        g.gain.setValueAtTime(.0001, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(.3, audioCtx.currentTime + t + .02);
        g.gain.exponentialRampToValueAtTime(.0001, audioCtx.currentTime + t + .14);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + .15);
      });
    } catch { /* audio indisponible */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }
  function startTimer(sec) {
    try { audioCtx ||= new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch { /* */ }
    timer.end = Date.now() + sec * 1000;
    $("#timer").hidden = false; $("#timer").classList.remove("done");
    clearInterval(timer.int); tickTimer(); timer.int = setInterval(tickTimer, 250);
  }
  function tickTimer() {
    const left = Math.max(0, Math.round((timer.end - Date.now()) / 1000));
    $("#timerTime").textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
    if (left <= 0) {
      clearInterval(timer.int); beep();
      $("#timer").classList.add("done"); $(".timer-label").textContent = "Go !";
      setTimeout(stopTimer, 4000);
    }
  }
  function stopTimer() { clearInterval(timer.int); $("#timer").hidden = true; $(".timer-label").textContent = "Repos"; }
  $("#timer").addEventListener("click", (e) => {
    const adj = e.target.closest("[data-adj]");
    if (adj) { timer.end = Math.max(Date.now(), timer.end) + Number(adj.dataset.adj) * 1000; $("#timer").classList.remove("done"); $(".timer-label").textContent = "Repos"; clearInterval(timer.int); timer.int = setInterval(tickTimer, 250); tickTimer(); }
    if (e.target.closest("#timerSkip")) stopTimer();
  });

  /* ---------------- render ---------------- */
  function render(animate = false) {
    document.body.dataset.tab = state.tab;
    document.querySelectorAll(".tab").forEach((t) => { if (t.dataset.tab === state.tab) t.setAttribute("aria-current", "page"); else t.removeAttribute("aria-current"); });
    renderDays();
    const v = $("#view");
    const views = { salle: renderSalle, repas: renderRepas, courses: renderCourses, compl: renderCompl, suivi: renderSuivi };
    v.innerHTML = views[state.tab]();
    if (animate) { v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); }
  }

  function setDate(date, animate = true) { state.date = date; render(animate); }

  /* ---------------- events ---------------- */
  $("#tabs").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (!t) return;
    state.tab = t.dataset.tab; store.set("tab", state.tab);
    window.scrollTo({ top: 0 }); render(true);
  });
  $("#days").addEventListener("click", (e) => { const d = e.target.closest("[data-date]"); if (d) setDate(d.dataset.date); });
  $("#prevWeek").addEventListener("click", () => setDate(iso(addDays(parse(state.date), -7))));
  $("#nextWeek").addEventListener("click", () => setDate(iso(addDays(parse(state.date), 7))));

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-set],[data-toggle-cue],[data-extra],[data-meal],[data-recipe],[data-seg],[data-shop],[data-action],[data-pick-session],[data-mult],[data-del-weight],[data-pantry],[data-date-go],[data-supp],[data-supp-open],[data-jar]");
    if (!el) return;
    const ds = el.dataset;

    if (ds.set) {
      const [i, j] = ds.set.split(":").map(Number);
      const key = sessionKeyFor(state.date); const L = dayLog(state.date);
      const arr = (L.sets[`${key}:${i}`] ||= []);
      arr[j] = !arr[j]; saveLog();
      const ex = SESSIONS[key].ex[i];
      if (arr[j]) {
        const allDone = SESSIONS[key].ex.every((e2, k) => (L.sets[`${key}:${k}`] || []).filter(Boolean).length >= e2.s);
        if (allDone) { stopTimer(); toast("Séance terminée. Shaker !"); } else startTimer(ex.rest);
      }
      const y = window.scrollY; render(); window.scrollTo(0, y);
      return;
    }
    if (ds.toggleCue != null) {
      const li = el.closest(".ex"); li.classList.toggle("open"); el.setAttribute("aria-expanded", li.classList.contains("open"));
      return;
    }
    if (ds.extra) {
      const L = dayLog(state.date); L.extra[ds.extra] = !L.extra[ds.extra]; saveLog();
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    if (ds.meal) {
      const L = dayLog(state.date); L.meals[ds.meal] = !L.meals[ds.meal]; saveLog();
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    if (ds.supp) {
      const L = dayLog(state.date); L.supp[ds.supp] = !L.supp[ds.supp]; saveLog();
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    if (ds.suppOpen) {
      const c = el.closest(".supp"); c.classList.toggle("open"); el.setAttribute("aria-expanded", c.classList.contains("open")); return;
    }
    if (ds.jar) {
      const j = store.get("jars", {}); j[ds.jar] = todayIso(); store.set("jars", j); toast("Nouveau pot noté");
      const y = window.scrollY; render(); window.scrollTo(0, y);
      const card = document.querySelector(`[data-supp-card="${ds.jar}"]`); if (card) card.classList.add("open");
      return;
    }
    if (ds.pantry) {
      const h = store.get("pantry", {}); h[ds.pantry] = !h[ds.pantry]; store.set("pantry", h);
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    if (ds.dateGo) { state.repasSeg = "jour"; store.set("repasSeg", "jour"); setDate(ds.dateGo); window.scrollTo({ top: 0 }); return; }
    if (ds.mult) { openRecipe(ds.rid, Number(ds.mult)); return; }
    if (ds.recipe) { openRecipe(ds.recipe); return; }
    if (ds.seg) { state.repasSeg = ds.seg; store.set("repasSeg", ds.seg); render(true); return; }
    if (ds.shop) {
      const key = "shop." + iso(mondayOf(parse(state.date)));
      const c = store.get(key, {}); c[ds.shop] = !c[ds.shop]; store.set(key, c);
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    if (ds.pickSession) {
      const planned = SCHEDULE[dow(parse(state.date))]; const L = dayLog(state.date);
      if (ds.pickSession === planned) delete L.session; else L.session = ds.pickSession;
      saveLog(); closeSheet(); render(true); return;
    }
    if (ds.delWeight) {
      const w = weights(); delete w[ds.delWeight]; store.set("weights", w); render(); return;
    }
    switch (ds.action) {
      case "swap": openSwapSheet(); break;
      case "shop-reset": store.set("shop." + iso(mondayOf(parse(state.date))), {}); render(); break;
      case "save-weight": {
        const v = parseFloat(String($("#weightIn").value).replace(",", "."));
        if (!v || v < 40 || v > 200) { toast("Entre un poids entre 40 et 200 kg"); return; }
        const w = weights(); w[state.date] = Math.round(v * 10) / 10; store.set("weights", w);
        toast("Poids enregistré"); render(); break;
      }
      case "save-waist": {
        const v = parseFloat(String($("#waistIn").value).replace(",", "."));
        if (!v || v < 50 || v > 200) { toast("Entre un tour de taille en cm"); return; }
        const w = waists(); w[state.date] = v; store.set("waist", w); toast("Tour de taille enregistré"); render(); break;
      }
      case "copy-report": {
        const txt = buildReport();
        const fallback = () => openSheet(`<h2 class="r-title" style="font-size:24px">Bilan de la semaine</h2>
          <p class="section-sub" style="margin:6px 0 10px">Sélectionne et copie le texte.</p>
          <textarea readonly style="width:100%;height:260px;background:var(--bg-3);color:var(--text);border:0;border-radius:12px;padding:12px;font:14px/1.5 Archivo,system-ui">${esc(txt)}</textarea>`);
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(() => toast("Bilan copié, colle-le à Claude"), fallback);
        else fallback();
        break;
      }
    }
  });

  document.addEventListener("change", (e) => {
    const inp = e.target.closest("[data-kg]"); if (!inp) return;
    const L = dayLog(state.date); const v = parseFloat(String(inp.value).replace(",", "."));
    if (v) L.kg[inp.dataset.kg] = v; else delete L.kg[inp.dataset.kg];
    saveLog();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "weightIn") $('[data-action="save-weight"]').click();
    if (e.key === "Enter" && e.target.id === "waistIn") $('[data-action="save-waist"]').click();
    if (e.key === "Enter" && e.target.matches("[data-kg]")) e.target.blur();
  });

  // Glisser à gauche / droite sur la vue pour changer de jour
  (() => {
    let x0 = null, y0 = null;
    const v = $("#view");
    v.addEventListener("touchstart", (e) => { if (e.target.closest("input,textarea")) return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    v.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.8) setDate(iso(addDays(parse(state.date), dx < 0 ? 1 : -1)));
    }, { passive: true });
  })();

  // Revenir à aujourd'hui quand l'app revient au premier plan un autre jour
  let lastToday = todayIso();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && todayIso() !== lastToday) { lastToday = todayIso(); setDate(lastToday, false); }
  });

  render();

  if ("serviceWorker" in navigator && location.protocol === "https:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
