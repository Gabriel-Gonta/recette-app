(() => {
  "use strict";

  const { PLAN, FOODS, RECIPES, SAUCES, WEEKS, PANTRY, SHAKER, SESSIONS, GYM_ROTATION, RULES, PREP, SUPPLEMENTS, SUPP_MOMENTS,
    TRIP, SORTIES, DAYS, EVENTS, BOOKINGS, TRIP_RULES, TRANSPORT, PASSES, PASS_NOTES, COSTS, MY_PLACES } = window;

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
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    route: '<svg viewBox="0 0 24 24"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/></svg>',
    train: '<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="13" rx="3"/><path d="M5 10h14M8 20l2-4M16 20l-2-4"/><circle cx="9" cy="13" r=".6"/><circle cx="15" cy="13" r=".6"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    globe: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9s1.3-6.4 3.8-9z"/></svg>',
    bowl: '<svg viewBox="0 0 24 24"><path d="M4 11h16a8 8 0 0 1-16 0z"/></svg>',
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
    tab: store.get("tab", "planning"),
    planSeg: store.get("planSeg", "jour"),
    calMonth: null,
    date: todayIso(),
    repasSeg: store.get("repasSeg", "jour"),
  };
  let log = store.get("log", {});
  const saveLog = () => store.set("log", log);
  const dayLog = (date) => { const l = (log[date] ||= { sets: {}, kg: {}, meals: {}, extra: {} }); l.supp ||= {}; return l; };

  /* ---------------- planning : cœur ---------------- */
  let plan = store.get("plan", {});
  plan.assign ||= {}; plan.done ||= {}; plan.notes ||= {}; plan.unplaced ||= []; plan.resa ||= {}; plan.todo ||= []; plan.places ||= {}; plan.mealOut ||= {};
  const savePlan = () => store.set("plan", plan);

  const inTokyo = (date) => date >= TRIP.tokyo.from && date <= TRIP.tokyo.to;
  const inTrip = (date) => date >= TRIP.start && date <= TRIP.end;
  function baseDay(date) {
    if (DAYS[date]) return DAYS[date];
    const w = dow(parse(date));
    return { m: w >= 5 ? "weekend" : w === 0 || w === 3 ? "kick" : "salle", s: [] };
  }
  const sortieIds = (date) => (inTokyo(date) ? [] : (plan.assign[date] ?? baseDay(date).s).filter((id) => SORTIES[id]));
  const sortiesOf = (date) => sortieIds(date).map((id) => ({ id, ...SORTIES[id] }));
  const isKick = (date) => !inTokyo(date) && [0, 3].includes(dow(parse(date)));
  const isGym = (date) => !inTokyo(date) && [1, 2, 4].includes(dow(parse(date))) && !sortiesOf(date).some((s) => s.full || s.morning);
  const isWeekend = (date) => dow(parse(date)) >= 5;
  const awayNight = (date) => sortiesOf(date).find((s) => s.night);

  // rotation A → B → C : la n-ième séance de salle depuis le début du séjour
  function rotationKey(date) {
    let n = 0;
    for (let d = parse(TRIP.start); iso(d) < date; d = addDays(d, 1)) if (isGym(iso(d))) n++;
    return GYM_ROTATION[n % GYM_ROTATION.length];
  }
  function plannedSession(date) {
    if (inTokyo(date)) return "tokyo";
    if (isKick(date)) return "kick";
    if (isGym(date)) return rotationKey(date);
    if (sortiesOf(date).some((s) => s.full)) return "walk";
    return "rest";
  }
  const sessionKeyFor = (date) => (log[date] && log[date].session) || plannedSession(date);

  // repas pris dehors : réglage manuel, sinon d'après les sorties du jour
  function mealOut(date, slot) {
    const k = `${date}:${slot}`;
    if (k in plan.mealOut) return plan.mealOut[k];
    if (slot === "shaker") return false;
    if (inTokyo(date)) return true;
    return sortiesOf(date).some((s) => (s.out || []).includes(slot));
  }
  const isBento = (date, slot) => slot === "lunch" && !mealOut(date, slot) && sortiesOf(date).some((s) => s.full);
  const outCity = (date) => (inTokyo(date) ? "Tokyo" : (sortiesOf(date).find((s) => s.city) || {}).city);
  const OUT_MACROS = { k: 750, p: 45, c: 80, f: 25 };
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
      const so = sortiesOf(id);
      const out = inTokyo(id) ? "tokyo" : so.some((s) => s.full) ? "full" : so.length ? "some" : "";
      html += `<button class="day ${id === today ? "today" : ""}" role="tab" data-date="${id}"
        aria-selected="${id === state.date}" aria-label="${DAY_LONG[i]} ${d.getDate()}">
        <small>${id === today ? "Auj." : DAY_SHORT[i]}</small><b>${d.getDate()}</b>
        <span class="pips"><i class="pip ${kind}"></i>${out ? `<i class="pip s-${out}"></i>` : ""}</span></button>`;
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
      if (dow(d) === 6 && !awayNight(date) && !inTokyo(date)) {
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
    if (s.time) chips.push(`<span class="chip num">${s.time}</span>`);
    if (s.duration && s.kind !== "kick") chips.push(`<span class="chip num">${s.duration} min</span>`);
    if (s.kind === "gym" && !overridden) {
      const idx = GYM_ROTATION.indexOf(key);
      if (idx >= 0) chips.push(`<span class="chip">Séance ${"ABC"[idx]} de la rotation</span>`);
    }
    const daySorties = sortiesOf(date);
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
      ${daySorties.length ? `<button class="day-link" data-goto-plan="${date}">${ICON.pin}<span><small>Aujourd'hui</small>${daySorties.map((x) => esc(x.t)).join(" · ")}</span>${ICON.chev}</button>` : ""}
      ${body}
      ${s.kind === "gym" ? `<details class="rules"><summary>Règles de progression ${ICON.down}</summary>
        <ul>${RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>` : ""}
    `;
  }
  const fmtRest = (sec) => (sec >= 60 ? `${Math.floor(sec / 60)}:${pad(sec % 60)}` : `${sec} s`);

  function openSwapSheet() {
    const date = state.date;
    const current = sessionKeyFor(date);
    const planned = plannedSession(date);
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
    meals.forEach((m) => {
      m.out = mealOut(date, m.slot); m.bento = isBento(date, m.slot);
      m.mac = m.out ? OUT_MACROS : macros(m.r.ing);
      tot = add(tot, m.mac); if (L.meals[m.slot]) eaten = add(eaten, m.mac);
    });
    const city = outCity(date);
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
        <div class="kcal-big num">${fmt(anyEaten ? eaten.k : tot.k)}<small>${anyEaten ? `kcal mangées sur ${fmt(tot.k)}` : "kcal prévues"}${meals.some((m) => m.out) ? " (estimé)" : ""}</small></div>
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
            <button class="meal-open" ${m.out ? `data-out-open="${m.slot}"` : `data-recipe="${m.id}" data-slot="${m.slot}"`}>
              <span class="meal-txt">
                <span class="meal-when">${MEAL_LABEL[m.slot]}${m.bento ? " · à emporter" : ""}${m.out ? ` · dehors${city ? ` (${esc(city)})` : ""}` : ""}</span>
                <span class="meal-name" style="display:block">${m.out ? "Repas dehors" : esc(m.r.name)}</span>
                ${m.out ? `<span class="meal-macro num"><b>~${fmt(m.mac.k)} kcal</b><span class="mp">P ~${m.mac.p}</span><span>estimé</span></span>` : macroLine(m.mac)}
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

  function openOutSheet(slot) {
    const date = state.date;
    const city = outCity(date);
    openSheet(`<div class="jp">${MEAL_LABEL[slot]} · ${DAY_LONG[dow(parse(date))].toLowerCase()} ${parse(date).getDate()}</div>
      <h2 class="r-title">Repas dehors${city ? ` à ${esc(city)}` : ""}</h2>
      <p class="section-sub" style="margin-top:10px">Compté environ ${OUT_MACROS.k} kcal et ${OUT_MACROS.p} g de protéines dans le total du jour.</p>
      <button class="btn ghost" data-meal-out="${slot}">Je mange à la maison finalement</button>`);
  }

  function openRecipe(id, mult = 1, slot = null) {
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
          `<button data-mult="${n}" data-rid="${id}" data-slot="${slot || ""}" aria-pressed="${n === mult}">×${n}</button>`).join("")}</div>` : ""}
      </div>
      <table class="ing"><tbody>${ingRows}</tbody></table>
      ${r.steps ? `<div class="r-head"><h3>Préparation</h3></div>
        <ol class="steps">${r.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>` : ""}
      ${r.tip ? `<p class="tip"><b>Astuce</b> · ${esc(r.tip)}</p>` : ""}
      ${id === "shaker" ? `<p class="tip"><b>Quand</b> · juste après la salle ou le kick. Les jours sans sport, prends-le au goûter : ce sont tes protéines du jour.</p>` : ""}
      ${slot && slot !== "shaker" ? `<button class="btn ghost" data-meal-out="${slot}">Je mange dehors à ce repas</button>` : ""}
    `;
    openSheet(html, !!$("#sheet:not([hidden])"));
  }

  /* ---------------- COURSES ---------------- */
  function shoppingList(date) {
    const totals = {};
    const mon = mondayOf(parse(date));
    let skipped = 0;
    for (let i = 0; i < 7; i++) {
      const dt = iso(addDays(mon, i)); const day = menuFor(dt);
      ["breakfast", "lunch", "dinner"].forEach((slot) => {
        if (mealOut(dt, slot)) { skipped++; return; }
        RECIPES[day[slot]].ing.forEach(([k, g]) => { totals[k] = (totals[k] || 0) + g; });
      });
    }
    SHAKER.ing.forEach(([k, g]) => { totals[k] = (totals[k] || 0) + g * 7; });
    const groups = {}, pantry = [];
    for (const [k, g] of Object.entries(totals)) {
      if (PANTRY.includes(k)) { pantry.push({ k, g }); continue; }
      (groups[FOODS[k][5]] ||= []).push({ k, g });
    }
    return { groups, pantry, skipped };
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
    const { groups, pantry, skipped } = shoppingList(date);
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
        <p class="section-sub" style="margin:12px 0 0">Pour les repas faits maison de cette semaine${skipped ? ` (${skipped} repas dehors retirés)` : ""}. Coche ce que tu achètes <b style="color:var(--text)">ou ce qu'il te reste déjà</b> de la semaine d'avant. La liste repart à zéro chaque lundi.</p>
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

  /* ---------------- PLANNING ---------------- */
  const mapsSearch = (q) => `https://maps.apple.com/?q=${encodeURIComponent(q)}`;
  const mapsGo = (q) => `https://maps.apple.com/?daddr=${encodeURIComponent(q)}&dirflg=r`;
  const dateLabel = (date, long = false) => { const d = parse(date); return `${(long ? DAY_LONG : DAY_SHORT)[dow(d)]}${long ? "" : "."} ${d.getDate()} ${long ? MONTHS[d.getMonth()] : MONTHS[d.getMonth()].slice(0, 4) + "."}`; };
  const MTYPE = {
    kick: "Kick 12h–13h", salle: "Salle 10h–11h30", journee: "Journée 9h–17h", weekend: "Week-end", matin: "Matinée sumo", tokyo: "Tokyo",
  };

  function placeRow(name, q, extra = {}) {
    return `<li>
      <span class="place-name">${esc(name)}${extra.a ? `<small class="addr">${esc(extra.a)}</small>` : ""}</span>
      <span class="place-btns">
        <a class="map-btn" href="${mapsSearch(q)}" target="_blank" rel="noopener" aria-label="Voir ${esc(name)} dans Plans">${ICON.pin}Plans</a>
        <a class="map-btn go" href="${mapsGo(q)}" target="_blank" rel="noopener" aria-label="Itinéraire en transports vers ${esc(name)}">${ICON.route}Y aller</a>
        ${extra.w ? `<a class="map-btn web" href="${esc(extra.w)}" target="_blank" rel="noopener" aria-label="Site de ${esc(name)}">${ICON.globe}Site</a>` : ""}
      </span>
    </li>`;
  }
  function placeRows(places) {
    if (!places || !places.length) return "";
    return `<ul class="places">${places.map(([name, q, extra]) => placeRow(name, q, extra)).join("")}</ul>`;
  }
  function gymPlace() {
    const custom = plan.places.gym;
    if (custom) return { name: custom, q: custom };
    return MY_PLACES.gym;
  }

  function sortieWhen(date, s) {
    if (s.morning) return "Matin";
    if (s.evening) return "Soir";
    if (inTokyo(date)) return "";
    if (isKick(date)) return "13h30";
    if (isWeekend(date)) return "Journée";
    if (s.full) return "9h–17h";
    return "Aprèm";
  }

  function sortieCard(date, s, isMain = false) {
    const done = plan.done[s.id] === date;
    const tags = [];
    if (s.pass) tags.push(`<span class="tag pass">${esc(s.pass)}</span>`);
    if (s.night) tags.push(`<span class="tag night">Nuit à ${esc(s.night)}</span>`);
    else if (s.city) tags.push(`<span class="tag">${esc(s.city)}</span>`);
    return `<article class="sortie ${done ? "done" : ""}">
      ${tags.length ? `<div class="sortie-top">${tags.join("")}</div>` : ""}
      ${isMain ? "" : `<h3>${esc(s.t)}</h3>`}
      <p class="sortie-d">${esc(s.d)}</p>
      ${s.info ? `<p class="sortie-line">${ICON.info}<span>${esc(s.info)}</span></p>` : ""}
      ${placeRows(s.p)}
      <div class="sortie-actions">
        <button class="act ${done ? "on" : ""}" data-sortie-done="${s.id}">${ICON.check}${done ? "Faite" : "Marquer faite"}</button>
        <button class="act" data-sortie-move="${s.id}">${ICON.swap}Déplacer</button>
        <button class="act ghost" data-sortie-remove="${s.id}" aria-label="Retirer ${esc(s.t)} de ce jour">${ICON.x}</button>
      </div>
    </article>`;
  }

  function renderPlanning() {
    const seg = state.planSeg;
    const segs = [["jour", "Jour"], ["global", "Global"], ["resa", "À réserver"], ["infos", "Infos"]];
    const segHtml = `<div class="seg" role="group" aria-label="Affichage">${segs.map(([k, l]) =>
      `<button data-plan-seg="${k}" aria-pressed="${seg === k}">${l}</button>`).join("")}</div>`;
    if (seg === "global") return segHtml + renderGlobal();
    if (seg === "resa") return segHtml + renderResa();
    if (seg === "infos") return segHtml + renderInfos();
    return segHtml + renderPlanDay();
  }

  function renderPlanDay() {
    const date = state.date; const d = parse(date);
    const so = sortiesOf(date);
    const base = baseDay(date);
    const tokyo = inTokyo(date);
    const month = TRIP.months[d.getMonth()];
    const kind = tokyo ? "tokyo" : isKick(date) ? "kick" : isGym(date) ? "salle" : isWeekend(date) ? "weekend" : so.some((s) => s.morning) ? "matin" : so.some((s) => s.full) ? "journee" : "";
    const main = so.find((s) => !s.evening) || so[0];
    const title = tokyo ? "Tokyo" : main ? main.t : "Journée libre";
    const chips = [];
    if (MTYPE[kind]) chips.push(`<span class="chip accent">${MTYPE[kind]}</span>`);
    if (base.ferie) chips.push(`<span class="chip">Férié</span>`);
    if (!inTrip(date)) chips.push(`<span class="chip">Hors séjour</span>`);

    const rows = [];
    const sk = sessionKeyFor(date); const sess = SESSIONS[sk];
    so.filter((s) => s.morning).forEach((s) => rows.push({ t: "Matin", html: sortieCard(date, s, s === main) }));
    if (sess.kind === "gym") { const g = gymPlace(); rows.push({ t: "10h", html: `<div class="slot-wrap"><button class="slot gym" data-goto-tab="salle"><span><b>${esc(sess.name)}</b><small>Salle 10h–11h30 · ouvrir la séance</small></span>${ICON.chev}</button>
      <ul class="places slim">${placeRow(g.name, g.q, g)}</ul></div>` }); }
    if (sess.kind === "kick") { const k = plan.places.kick; rows.push({ t: "12h", html: `<div class="slot-wrap"><button class="slot kick" data-goto-tab="salle"><span><b>Kick-boxing</b><small>12h–13h · shaker juste après</small></span>${ICON.chev}</button>
      ${k ? `<ul class="places slim">${placeRow(k, k)}</ul>` : ""}</div>` }); }
    if (tokyo) rows.push({ t: "", html: `<div class="slot tokyo"><span><b>Tokyo, du 27 oct. au 4 nov.</b><small>Marche beaucoup, repas dehors. Si tu peux rentrer le 3 nov. à midi : dernier soir des illuminations des temples de Gion (17h30–21h) et montgolfières illuminées à Saga (à vérifier).</small></span></div>` });
    so.filter((s) => !s.morning && !s.evening).forEach((s) => rows.push({ t: sortieWhen(date, s), html: sortieCard(date, s, s === main) }));
    if (dow(d) < 5 && !tokyo && !awayNight(date) && inTrip(date)) rows.push({ t: "17h", html: `<div class="slot work"><span><b>Travail</b><small>17h/18h–20h · facultatif, une belle sortie passe avant</small></span></div>` });
    if (dow(d) === 4 && !tokyo && inTrip(date)) rows.push({ t: "Soir", html: `<div class="slot faint"><span><b>Kick du vendredi soir</b><small>Une semaine sur deux</small></span></div>` });
    so.filter((s) => s.evening).forEach((s) => rows.push({ t: "Soir", html: sortieCard(date, s, s === main) }));

    const note = plan.notes[date] || "";
    return `
      <section class="hero">
        <div class="hero-day"><span>${DAY_LONG[dow(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</span>${month ? `<span style="font-size:13px">${esc(month.name)}</span>` : ""}</div>
        <h1 class="hero-title ${title.length > 10 ? "long" : ""}">${esc(title)}</h1>
        <div class="hero-meta">${chips.join("")}</div>
      </section>
      <ol class="timeline">${rows.map((r) => `<li><span class="tl-time">${esc(r.t)}</span><div class="tl-body">${r.html}</div></li>`).join("")}</ol>
      ${tokyo ? "" : `<button class="add-sortie" data-sortie-add="${date}">${ICON.plus}Ajouter une sortie</button>`}
      <h2 class="section-title">Mes notes</h2>
      <textarea class="notes" data-note="${date}" placeholder="Horaires de bus, dernier retour, une idée…" rows="3">${esc(note)}</textarea>
    `;
  }

  function openMoveSheet(id) {
    const from = state.date;
    const start = todayIso() > TRIP.start ? todayIso() : TRIP.start;
    let html = `<h2 class="r-title" style="font-size:24px">Déplacer « ${esc(SORTIES[id].t)} »</h2>
      <p class="section-sub" style="margin:4px 0 10px">Choisis le jour. Ses sorties à lui prennent la place libérée (celles du soir restent).</p>`;
    for (let d = parse(start); iso(d) <= TRIP.end; d = addDays(d, 1)) {
      const dt = iso(d); if (dt === from || inTokyo(dt)) continue;
      const so = sortiesOf(dt);
      html += `<button class="sheet-option" data-move-to="${dt}" data-mid="${id}">
        <span class="opt-date">${dateLabel(dt)}<small>${isKick(dt) ? "kick" : isGym(dt) ? "salle" : isWeekend(dt) ? "week-end" : ""}</small></span>
        <small class="ellip">${so.length ? so.map((s) => esc(s.t)).join(" · ") : "libre"}</small></button>`;
    }
    openSheet(html);
  }

  function openAddSheet(date) {
    const placed = new Set();
    for (let d = parse(TRIP.start); iso(d) <= TRIP.end; d = addDays(d, 1)) sortieIds(iso(d)).forEach((x) => placed.add(x));
    const unplaced = plan.unplaced.filter((x) => SORTIES[x] && !placed.has(x));
    const groups = {};
    Object.entries(SORTIES).filter(([k, s]) => s.b && !placed.has(k)).forEach(([k, s]) => (groups[s.b] ||= []).push([k, s]));
    const opt = ([k, s]) => `<button class="sheet-option" data-add-pick="${k}"><span>${esc(s.t)}<small style="display:block">${esc(s.d)}</small></span>${ICON.plus}</button>`;
    openSheet(`<h2 class="r-title" style="font-size:24px">Ajouter au ${dateLabel(date, true).toLowerCase()}</h2>
      ${unplaced.length ? `<div class="r-head"><h3>À recaser</h3></div>${unplaced.map((k) => opt([k, SORTIES[k]])).join("")}` : ""}
      ${Object.entries(groups).map(([g, items]) => `<div class="r-head"><h3>${esc(g)}</h3></div>${items.map(opt).join("")}`).join("")}`);
  }

  function renderGlobal() {
    const d0 = parse(state.date);
    const m = state.calMonth ?? (inTrip(state.date) ? d0.getMonth() : 9);
    const year = 2026;
    const days = new Date(year, m + 1, 0).getDate();
    const lead = dow(new Date(year, m, 1));
    const info = TRIP.months[m];
    const today = todayIso();
    let cells = "";
    for (let i = 0; i < lead; i++) cells += `<span class="cal-cell empty"></span>`;
    for (let i = 1; i <= days; i++) {
      const dt = iso(new Date(year, m, i));
      const so = sortiesOf(dt);
      const cls = !inTrip(dt) ? "off" : inTokyo(dt) ? "tokyo" : so.some((s) => s.night) ? "night" : so.some((s) => s.full) ? "full" : so.length ? "some" : "free";
      const sport = !inTrip(dt) ? "" : isKick(dt) ? "k" : isGym(dt) ? "s" : "";
      const allDone = so.length && so.every((s) => plan.done[s.id] === dt);
      cells += `<button class="cal-cell ${cls} ${dt === today ? "today" : ""}" data-goto-day="${dt}" aria-label="${dateLabel(dt, true)}">
        <b class="num">${i}</b>${sport ? `<i class="sp sp-${sport}"></i>` : ""}${allDone ? `<span class="cal-done">${ICON.check}</span>` : ""}</button>`;
    }
    let agenda = "", curWeek = "";
    for (let i = 1; i <= days; i++) {
      const dt = iso(new Date(year, m, i));
      if (!inTrip(dt)) continue;
      const wk = iso(mondayOf(parse(dt)));
      if (wk !== curWeek) { curWeek = wk; agenda += `<li class="ag-week">Semaine du ${weekRange(dt)}</li>`; }
      const so = sortiesOf(dt);
      const sp = inTokyo(dt) ? "" : isKick(dt) ? `<span class="mini k">Kick</span>` : isGym(dt) ? `<span class="mini s">Salle</span>` : "";
      agenda += `<li><button class="ag-row ${dt === today ? "today" : ""}" data-goto-day="${dt}">
        <span class="ag-date"><b>${DAY_SHORT[dow(parse(dt))]}</b><span class="num">${i}</span></span>
        <span class="ag-main">${inTokyo(dt) ? "<em>Tokyo</em>" : so.length ? so.map((s) => `<span class="${plan.done[s.id] === dt ? "ag-done" : ""}">${esc(s.t)}</span>`).join("") : "<em>Libre</em>"}</span>
        <span class="ag-side">${sp}${so.some((s) => s.pass) ? `<span class="mini p">Pass</span>` : ""}${so.some((s) => s.night) ? `<span class="mini n">Nuit</span>` : ""}</span>
      </button></li>`;
    }
    const evs = EVENTS.filter((e) => parse(e.from).getMonth() === m);
    return `
      <div class="month-nav">${[9, 10, 11].map((mm) => `<button data-cal-month="${mm}" aria-pressed="${mm === m}">${TRIP.months[mm].name}</button>`).join("")}</div>
      <section class="hero" style="padding-top:8px">
        <h1 class="hero-title">${info.name}</h1>
        <p class="section-sub" style="margin:0">${esc(info.theme)}. ${esc(info.intro)}</p>
      </section>
      <div class="cal">
        ${["L", "M", "M", "J", "V", "S", "D"].map((x) => `<span class="cal-h">${x}</span>`).join("")}
        ${cells}
      </div>
      <div class="legend">
        <span><i class="lg full"></i>Journée</span><span><i class="lg some"></i>Sortie</span><span><i class="lg night"></i>Nuit ailleurs</span>
        <span><i class="lg tokyo"></i>Tokyo</span><span><i class="sp sp-k"></i>Kick</span><span><i class="sp sp-s"></i>Salle</span>
      </div>
      ${evs.length ? `<h2 class="section-title">Dates clés</h2><ul class="events">${evs.map((e) => `<li class="${e.missed ? "missed" : ""}">
        <span class="ev-when">${esc(e.when)}</span><span><b>${esc(e.what)}</b>${e.where ? `<small>${esc(e.where)}</small>` : ""}</span></li>`).join("")}</ul>` : ""}
      <h2 class="section-title">Agenda</h2>
      <ul class="agenda">${agenda}</ul>
    `;
  }

  function renderResa() {
    const today = todayIso();
    const items = [...BOOKINGS].sort((a, b) => a.for.localeCompare(b.for));
    const nDone = items.filter((b) => plan.resa[b.id]).length;
    const left = (dt) => { const n = Math.round((parse(dt) - parse(today)) / 864e5); return n < 0 ? "passé" : n === 0 ? "aujourd'hui" : `dans ${n} j`; };
    return `
      <section class="hero">
        <h1 class="hero-title">À réserver</h1>
        <div class="progress"><i style="width:${(nDone / items.length) * 100}%"></i></div>
        <div class="progress-label num"><span>${nDone} / ${items.length} réservé</span></div>
      </section>
      ${items.map((b) => {
        const on = !!plan.resa[b.id];
        const urgent = !on && (parse(b.for) - parse(today)) / 864e5 <= 14;
        return `<button class="block resa ${on ? "on" : ""}" data-resa="${b.id}" aria-pressed="${on}">
          <span class="check">${ICON.check}</span>
          <span class="block-main"><span class="block-title">${esc(b.what)}</span>
          <span class="block-sub"><span class="${urgent ? "urgent" : ""}">Pour le ${dateLabel(b.for).toLowerCase()}, ${left(b.for)}</span>${b.cost ? `<br>${esc(b.cost)}` : ""}</span></span>
        </button>`;
      }).join("")}
      <h2 class="section-title">Ma check-list</h2>
      <p class="section-sub">Ce que tu ne veux pas oublier : à acheter, à vérifier, à préparer.</p>
      <form class="todo-add" id="todoForm"><input id="todoIn" type="text" placeholder="Ex. recharger la SUGOCA" aria-label="Nouvel élément"><button class="btn" type="submit" aria-label="Ajouter">${ICON.plus}</button></form>
      <div class="todo-list">${plan.todo.map((t, i) => `<div class="todo-row ${t.done ? "on" : ""}">
        <button class="check ${t.done ? "on" : ""}" data-todo="${i}" aria-pressed="${!!t.done}" aria-label="Cocher">${ICON.check}</button>
        <span class="block-title">${esc(t.text)}</span>
        <button class="todo-del" data-todo-del="${i}" aria-label="Supprimer">${ICON.x}</button></div>`).join("")}</div>
    `;
  }

  function renderInfos() {
    const pl = plan.places;
    const myPlace = (k, label, ph) => {
      const def = MY_PLACES[k];
      const cur = pl[k] ? { name: pl[k], q: pl[k] } : def;
      return `<div class="myplace">
      <label><span>${label}</span><input type="text" data-place="${k}" value="${esc(pl[k] || "")}" placeholder="${esc(def ? def.name : ph)}"></label>
      ${cur ? `<ul class="places slim">${placeRow(cur.name, cur.q, cur)}</ul>` : ""}
    </div>`;
    };
    return `
      <section class="hero"><h1 class="hero-title">Infos</h1></section>
      <h2 class="section-title" style="margin-top:0">Mes lieux</h2>
      <p class="section-sub">Écris le nom ou l'adresse pour changer de salle, ou pour ajouter ton club de kick.</p>
      ${myPlace("gym", "Salle de sport", "Nom ou adresse")}
      ${myPlace("kick", "Club de kick-boxing", "Nom ou adresse")}
      <details class="rules" open><summary>Le rythme ${ICON.down}</summary><ul>${TRIP_RULES.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>
      <details class="rules"><summary>Transports et SUGOCA ${ICON.down}</summary><ul>${TRANSPORT.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>
      <details class="rules"><summary>Pass JR Kyushu ${ICON.down}</summary>
        <table class="ctable"><thead><tr><th>Pass</th><th>Prix</th><th>Sans</th></tr></thead><tbody>
        ${PASSES.map((p) => `<tr><td><b>${esc(p.name)}</b><small>${esc(p.days)} · ${esc(p.covers)}</small></td><td class="num">${esc(p.price)}</td><td class="num">${esc(p.without)}</td></tr>`).join("")}
        </tbody></table>
        <ul>${PASS_NOTES.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></details>
      ${COSTS.map((g) => `<details class="rules"><summary>Budget : ${esc(g.group.toLowerCase())} ${ICON.down}</summary>
        <table class="ctable"><tbody>${g.rows.map(([a, b, c]) => `<tr><td>${esc(a)}${c ? `<small>${esc(c)}</small>` : ""}</td><td class="num">${esc(b)}</td></tr>`).join("")}</tbody></table></details>`).join("")}
      <p class="disclaimer">Prix en yens par personne, à vérifier avant d'acheter.</p>
    `;
  }

  function handlePlanClick(el, ds) {
    const rerender = () => { const y = window.scrollY; render(); window.scrollTo(0, y); };
    if (ds.planSeg) { state.planSeg = ds.planSeg; store.set("planSeg", ds.planSeg); render(true); return true; }
    if (ds.gotoTab) { goTab(ds.gotoTab); return true; }
    if (ds.gotoPlan) { state.planSeg = "jour"; store.set("planSeg", "jour"); goTab("planning"); return true; }
    if (ds.gotoDay) { state.planSeg = "jour"; store.set("planSeg", "jour"); state.date = ds.gotoDay; window.scrollTo({ top: 0 }); render(true); return true; }
    if (ds.calMonth) { state.calMonth = Number(ds.calMonth); render(); return true; }
    if (ds.sortieDone) {
      const id = ds.sortieDone; if (plan.done[id] === state.date) delete plan.done[id]; else plan.done[id] = state.date;
      savePlan(); rerender(); if (plan.done[id]) toast("Sortie faite"); return true;
    }
    if (ds.sortieMove) { openMoveSheet(ds.sortieMove); return true; }
    if (ds.moveTo) {
      const id = ds.mid, from = state.date, to = ds.moveTo;
      const fromList = sortieIds(from), toList = sortieIds(to);
      const toMoving = toList.filter((x) => !SORTIES[x].evening);
      plan.assign[from] = [...fromList.filter((x) => x !== id), ...toMoving];
      plan.assign[to] = [...toList.filter((x) => SORTIES[x].evening), id];
      savePlan(); closeSheet(); render(); toast(`Déplacée au ${dateLabel(to).toLowerCase()}`); return true;
    }
    if (ds.sortieRemove) {
      const id = ds.sortieRemove; plan.assign[state.date] = sortieIds(state.date).filter((x) => x !== id);
      if (!plan.unplaced.includes(id)) plan.unplaced.push(id);
      savePlan(); rerender(); toast("Retirée, à recaser via « Ajouter »"); return true;
    }
    if (ds.sortieAdd) { openAddSheet(ds.sortieAdd); return true; }
    if (ds.addPick) {
      const id = ds.addPick; plan.assign[state.date] = [...sortieIds(state.date), id];
      plan.unplaced = plan.unplaced.filter((x) => x !== id);
      savePlan(); closeSheet(); render(); toast("Sortie ajoutée"); return true;
    }
    if (ds.resa) { plan.resa[ds.resa] = !plan.resa[ds.resa]; savePlan(); rerender(); return true; }
    if (ds.todo) { const t = plan.todo[Number(ds.todo)]; t.done = !t.done; savePlan(); rerender(); return true; }
    if (ds.todoDel) { plan.todo.splice(Number(ds.todoDel), 1); savePlan(); rerender(); return true; }
    return false;
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
    let gymDone = 0, gymPlanned = 0, mealsDone = 0, cardioDone = 0, suppDone = 0, kickDone = 0;
    const lifts = {};
    for (let i = 0; i < 7; i++) {
      const dt = iso(addDays(mon, i));
      if (w[dt]) dayVals.push(`${DAY_SHORT[i]} ${fmt(w[dt], 1)}`);
      const key = sessionKeyFor(dt); const s = SESSIONS[key]; const L = log[dt];
      if (s.kind === "kick" && L && Object.values(L.extra).some(Boolean)) kickDone++;
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
    lines.push(`Séances muscu complètes : ${gymDone}/${gymPlanned} · kick : ${kickDone} · cardio : ${cardioDone}`);
    lines.push(`Repas cochés : ${mealsDone}/28`);
    const sortiesWeek = []; for (let i = 0; i < 7; i++) sortiesOf(iso(addDays(mon, i))).forEach((s) => sortiesWeek.push(s));
    if (sortiesWeek.length) lines.push(`Sorties faites : ${sortiesWeek.filter((s) => plan.done[s.id]).length}/${sortiesWeek.length}`);
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
    const views = { planning: renderPlanning, salle: renderSalle, repas: renderRepas, courses: renderCourses, compl: renderCompl, suivi: renderSuivi };
    v.innerHTML = views[state.tab]();
    if (animate) { v.classList.remove("enter"); void v.offsetWidth; v.classList.add("enter"); }
  }

  function setDate(date, animate = true) { state.date = date; render(animate); }

  /* ---------------- events ---------------- */
  function goTab(tab) { state.tab = tab; store.set("tab", tab); window.scrollTo({ top: 0 }); render(true); }
  $("#tabs").addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]"); if (!t) return;
    state.tab = t.dataset.tab; store.set("tab", state.tab);
    window.scrollTo({ top: 0 }); render(true);
  });
  $("#days").addEventListener("click", (e) => { const d = e.target.closest("[data-date]"); if (d) setDate(d.dataset.date); });
  $("#prevWeek").addEventListener("click", () => setDate(iso(addDays(parse(state.date), -7))));
  $("#nextWeek").addEventListener("click", () => setDate(iso(addDays(parse(state.date), 7))));

  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-set],[data-toggle-cue],[data-extra],[data-meal],[data-recipe],[data-seg],[data-shop],[data-action],[data-pick-session],[data-mult],[data-del-weight],[data-pantry],[data-date-go],[data-supp],[data-supp-open],[data-jar],[data-plan-seg],[data-goto-plan],[data-goto-day],[data-sortie-done],[data-sortie-move],[data-move-to],[data-sortie-remove],[data-sortie-add],[data-add-pick],[data-resa],[data-todo],[data-todo-del],[data-cal-month],[data-out-open],[data-meal-out],[data-goto-tab]");
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
    if (ds.mult) { openRecipe(ds.rid, Number(ds.mult), ds.slot || null); return; }
    if (ds.recipe) { openRecipe(ds.recipe, 1, ds.slot || null); return; }
    if (ds.outOpen) { openOutSheet(ds.outOpen); return; }
    if (ds.mealOut) {
      const k = `${state.date}:${ds.mealOut}`; plan.mealOut[k] = !mealOut(state.date, ds.mealOut); savePlan();
      closeSheet(); render(); toast(plan.mealOut[k] ? "Repas dehors" : "Repas à la maison"); return;
    }
    if (handlePlanClick(el, ds)) return;
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

  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-note]")) { plan.notes[e.target.dataset.note] = e.target.value; savePlan(); }
  });
  document.addEventListener("submit", (e) => {
    if (e.target.id !== "todoForm") return;
    e.preventDefault();
    const v = $("#todoIn").value.trim(); if (!v) return;
    plan.todo.push({ text: v, done: false }); savePlan(); render(); $("#todoIn").focus();
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-place]")) { plan.places[e.target.dataset.place] = e.target.value.trim(); savePlan(); render(); return; }
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
