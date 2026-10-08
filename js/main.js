// 화면 그리기 — 내용은 data.js(한국어)·data.en.js(영어), 이 파일은 배치만 담당합니다.
(function () {
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const q = new URLSearchParams(location.search).get("lang");
  const LANG = (q || store.get("hm-lang")) === "en" ? "en" : "ko";
  /* 영어판은 고를 때만 불러옵니다 */
  if (LANG === "en" && !window.SITE_EN) {
    const s = document.createElement("script");
    s.src = "js/data.en.js"; s.onload = () => start("en"); s.onerror = () => start("ko");
    document.head.appendChild(s);
  } else start(LANG);

  function start(lang) {
  const KO = window.SITE, S = lang === "en" ? window.SITE_EN : KO;
  const T = {
    ko: { all: "전체", aud: "대상", copied: "이메일 주소를 복사했습니다", selected: "주소를 선택했습니다", copy: "눌러서 주소 복사", kind: { site: "사이트", doc: "자료", article: "기사" }, qr: "QR 코드", hero: "소개", nav: "구역" },
    en: { all: "All", aud: "Audience", copied: "Email address copied", selected: "Address selected", copy: "Click to copy the address", kind: { site: "Site", doc: "Document", article: "Article" }, qr: "QR code", hero: "Introduction", nav: "Sections" }
  }[lang];
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const IMG = (f) => "img/" + f;
  const host = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ext = (u, t) => `<a class="ul" href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`;
  const items = (n) => `<i>${n}</i> ${n === 1 ? "item" : "items"}`;

  document.documentElement.lang = lang;
  if (lang === "en") document.title = "Hwang Miran";
  $(".hero").setAttribute("aria-label", T.hero);
  $("#nav").setAttribute("aria-label", T.nav);

  /* 소개 */
  $("#lead").textContent = S.intro.lead;
  $("#intro-body").textContent = S.intro.body;
  $("#now").innerHTML = S.intro.now.map((n) => `<div><dt class="label">${esc(n[0])}</dt><dd>${esc(n[1])}</dd></div>`).join("");

  /* 상단 메뉴: order에서 이력(life)을 뺀 순서 + Contact. 이름은 두 언어 모두 영어 */
  const NAV = { works: "Works", images: "Images" };
  KO.chapters.forEach((c) => (NAV[c.id] = c.en));
  $("#nav").innerHTML = [...KO.order.filter((id) => id !== "life"), "contact"]
    .map((id) => `<a href="#${id}">${esc(NAV[id] || "Contact")}</a>`).join("");

  /* 한/EN */
  const langBtn = $("#lang-btn");
  langBtn.innerHTML = `<span${lang === "ko" ? ' class="cur"' : ""}>한</span><span${lang === "en" ? ' class="cur"' : ""}>EN</span>`;
  langBtn.setAttribute("aria-label", lang === "ko" ? "English" : "한국어");
  langBtn.addEventListener("click", () => {
    const next = lang === "ko" ? "en" : "ko", on = $("#nav a.on");
    store.set("hm-lang", next);
    const u = new URL(location.href); u.searchParams.delete("lang"); if (next === "en") u.searchParams.set("lang", "en");
    u.hash = on ? on.getAttribute("href") : ""; location.href = u.toString();
    if (u.pathname === location.pathname && u.search === location.search) location.reload();
  });

  /* QR: tools/make_qr.py가 만든 표에 있는 주소만 */
  const QR = window.QR || {};
  const qrImg = (u, cls) => QR[u] ? `<span class="qr ${cls || ""}"><img src="${QR[u]}" alt="${esc(host(u))} ${T.qr}" loading="lazy"></span>` : "";
  const linkBlock = (links) => `<ul class="links">${links.map(([k, t, u]) => `
    <li>${qrImg(u)}<a href="${u}" target="_blank" rel="noopener"><span class="lk label">${T.kind[k] || ""}</span><span class="lt">${esc(t)} ↗</span><span class="lh">${esc(host(u).split("?")[0])}</span></a></li>`).join("")}</ul>`;

  /* 선별 작업 · 이미지 구역 머리 */
  ["works", "images"].forEach((id) => { const h = S.heads[id], sec = document.getElementById(id); $("h2", sec).textContent = h.title; $(".sec-head p", sec).textContent = h.blurb; });

  /* 선별 작업 */
  $("#projects").innerHTML = S.works.map((p) => {
    const pics = [p.img, p.img2].filter(Boolean);
    const facts = p.facts ? `<dl class="facts">${p.facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl>` : "";
    const lists = p.lists ? p.lists.map((l) => `<div class="sub"><span class="label">${esc(l.title)}</span><ul class="made">${l.items.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`).join("") : "";
    return `
    <article class="proj grid${pics.length ? "" : " no-img"}" id="${p.id}">
      <div class="meta"><span class="label">${esc(p.year)}</span><span class="label k">${esc(p.kind)}</span></div>
      <div class="txt">
        ${p.org ? `<p class="org">${esc(p.org)}</p>` : ""}
        <h3>${esc(p.title)}</h3>
        ${p.en && p.en !== p.title ? `<p class="en">${esc(p.en)}</p>` : ""}
        <p class="q">${esc(p.question)}</p>
        <p class="d">${esc(p.text)}</p>
        ${facts}
        ${lists}
        ${p.facts ? "" : `<ul class="made">${p.made.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`}
        ${p.links ? linkBlock(p.links) : ""}
      </div>
      ${pics.length ? `<div class="pics n${pics.length}">${pics.map((f) => `<figure><img loading="lazy" src="${IMG(f)}" alt="${esc(p.title)}"></figure>`).join("")}</div>` : ""}
    </article>`;
  }).join("");

  /* 장(章) */
  const row = (it) => {
    const [d, org, t, s, l, tech] = it;
    const qr = l ? qrImg(l, "sm") : "";
    return `<li class="${qr ? "has-qr" : ""}"><span class="d">${esc(d)}</span><span class="w">${org ? `<strong class="org">${esc(org)}</strong>` : ""}<b>${l ? ext(l, t) : esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ""}${tech ? `<span class="tech">${esc(tech)}</span>` : ""}</span>${qr}</li>`;
  };
  const threads = (g) => {
    const span = g.to - g.from + 1;
    let h = `<div class="threads-wrap"><div class="threads"><div class="tg-years" style="--n:${span}">`;
    for (let y = g.from; y <= g.to; y++) h += `<span>${y % 2 ? "" : y}</span>`;
    h += `</div>`;
    g.items.forEach((r) => {
      const s = r[0] - g.from, e = r[1] - g.from + 1;
      h += `<div class="tg-row" style="--n:${span}"><button class="tg-bar" type="button" style="grid-column:${s + 1} / ${e + 1}" data-tip="${esc(r[0] + "–" + r[1] + " · " + r[2] + ": " + r[3])}"><span class="tg-name">${esc(r[2])}</span></button></div>`;
    });
    return h + `</div></div><p class="thread-tip">${esc(g.items.map((r) => r[2]).join(" → "))}</p>`;
  };
  /* 강의: 연도 묶음 안에서 의뢰 기관별로 — 국가기관, 교육청, 대학, 학교, 그 밖의 순.
     영어판도 한국어판 기관명으로 정렬·묶어 두 판의 순서가 같습니다. */
  const RANK = (o) => /^(교육부|한국교육학술정보원|한국과학창의재단)/.test(o) ? 0 : /교육청|교육지원청/.test(o) ? 1 : /대학교$/.test(o) ? 2 : /학교$/.test(o) ? 3 : 4;
  const byOrg = (a, b) => RANK(a) - RANK(b) || a.localeCompare(b, "ko");
  const lectures = (g, gk) => {
    const by = new Map();
    g.items.map((r, i) => [gk.items[i][1], r]).sort((a, b) => byOrg(a[0], b[0]))
      .forEach(([k, r]) => { if (!by.has(k)) by.set(k, []); by.get(k).push(r); });
    return `<div class="lec">${[...by.values()].map((rs) => `
      <div class="lo"><p class="lo-h">${esc(rs[0][1])}</p><ul class="ledger">${rs.map(([aud, , t, s]) =>
        `<li data-aud="${esc(aud)}"><span class="d aud">${esc(aud)}</span><span class="w"><b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ""}</span></li>`).join("")}</ul></div>`).join("")}</div>`;
  };
  const cards = (g) => `<div class="cards">${(g.items.some((c) => c.aud) ? [...g.items].sort((a, b) => b.date.localeCompare(a.date)) : g.items).map((c) => `
    <article class="card"${c.aud ? ` data-aud="${esc(c.aud)}"` : ""}>
      <div class="cm"><span class="d">${esc(c.date)}</span>${c.aud ? `<span class="o">${esc(c.aud)}</span>` : ""}${c.org ? `<span class="o">${esc(c.org)}</span>` : ""}</div>
      <h4>${esc(c.title)}</h4>
      ${c.core && c.core.length ? `<ul class="core">${c.core.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
      ${c.imgs && c.imgs.length ? `<div class="cpics n${Math.min(c.imgs.length, 3)}">${c.imgs.map((m) => `<figure><img loading="lazy" src="${IMG(m[0])}" alt="${esc(m[1])}"><figcaption>${esc(m[1])}</figcaption></figure>`).join("")}</div>` : ""}
    </article>`).join("")}</div>`;
  const chapterHTML = (c, ci) => `
    <section class="sec wrap chapter" id="${c.id}">
      <div class="sec-head grid">
        <span class="idx label">${esc(c.en)}</span>
        <h2>${esc(c.ko)}</h2>
        <p>${esc(c.blurb)}</p>
        ${c.filter ? `<div class="filt" role="group" aria-label="${T.aud}">${[T.all, ...c.filter].map((f, i) => `<button class="pill" type="button" data-f="${i ? esc(f) : ""}" aria-pressed="${!i}">${esc(f)}</button>`).join("")}</div>` : ""}
      </div>
      ${c.groups.map((g, gi) => `
        <div class="group grid">
          <div class="gh"><h3>${esc(g.title)}</h3>${g.note ? `<p class="note">${esc(g.note)}</p>` : ""}<span class="label n">${g.kind === "threads" ? "" : items(g.items.length)}</span></div>
          <div class="gb">${g.kind === "threads" ? threads(g) : g.kind === "cards" ? cards(g) : g.kind === "lectures" ? lectures(g, KO.chapters[ci].groups[gi]) : `<ul class="ledger">${g.items.map(row).join("")}</ul>`}</div>
        </div>`).join("")}
    </section>`;
  $("#chapters").innerHTML = S.chapters.map(chapterHTML).join("");
  /* order대로 구역을 다시 놓습니다 */
  const main = $("main");
  KO.order.forEach((id) => { const el = document.getElementById(id); if (el) main.appendChild(el); });
  $("#chapters").remove();

  /* 대상 고르기: 고른 대상이 없는 기관·연도 묶음은 접습니다 */
  document.querySelectorAll(".filt").forEach((bar) => bar.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const f = b.dataset.f, sec = bar.closest("section");
    bar.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
    sec.querySelectorAll("[data-aud]").forEach((el) => (el.hidden = !!f && !el.dataset.aud.split("·").includes(f)));
    sec.querySelectorAll(".lo").forEach((o) => (o.hidden = !o.querySelector("li:not([hidden])")));
    sec.querySelectorAll(".group").forEach((g) => {
      if (!g.querySelector("[data-aud]")) return;
      const n = g.querySelectorAll("[data-aud]:not([hidden])").length;
      g.hidden = !n; $(".gh .n", g).innerHTML = items(n);
    });
  }));
  document.querySelectorAll(".threads").forEach((th) => {
    const tip = th.parentElement.nextElementSibling;
    const show = (e) => { const b = e.target.closest(".tg-bar"); if (b) tip.textContent = b.dataset.tip; };
    th.addEventListener("mouseover", show); th.addEventListener("focusin", show); th.addEventListener("click", show);
  });

  /* 이미지 */
  $("#gallery-grid").innerHTML = S.gallery.map((g) => `<figure><img loading="lazy" src="${IMG(g.img)}" alt="${esc(g.cap)}"><figcaption>${esc(g.cap)}</figcaption></figure>`).join("");

  /* 연락 */
  $("#updated").textContent = KO.updated;
  document.querySelectorAll("[data-email]").forEach((el) => { el.textContent = KO.email; el.title = T.copy; });
  $("#gh").href = KO.github;

  /* ── 동작 ───────────────────────────────── */
  const clock = $("#clock");
  const tick = () => { try { clock.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date()) + " KST"; } catch (e) {} };
  tick(); setInterval(tick, 30000);

  const mega = $("#mega");
  const fit = () => { mega.style.fontSize = "100px"; const w = mega.parentElement.clientWidth; mega.style.fontSize = Math.min(100 * (w / mega.scrollWidth), 360) + "px"; };
  fit(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit); addEventListener("resize", fit);

  const root = document.documentElement, themeBtn = $("#theme-btn");
  const saved = store.get("hm-theme"); if (saved) root.dataset.theme = saved;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncTheme = () => (themeBtn.textContent = isDark() ? "Light" : "Dark");
  syncTheme();
  themeBtn.addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("hm-theme", root.dataset.theme); syncTheme(); });

  const ov = $("#overlay"), gridBtn = $("#grid-btn");
  ov.querySelector(".grid").innerHTML = "<span></span>".repeat(12);
  const toggleGrid = () => { ov.hidden = !ov.hidden; gridBtn.setAttribute("aria-pressed", !ov.hidden); };
  gridBtn.addEventListener("click", toggleGrid);
  addEventListener("keydown", (e) => { if ((e.key === "g" || e.key === "G") && !e.target.closest("input,textarea") && !e.metaKey && !e.ctrlKey) toggleGrid(); });

  /* 지금 보고 있는 구역을 메뉴에 표시. 이력 구역에서는 아무것도 켜지 않고, 맨 끝에서는 Contact */
  const nav = $("#nav"), links = [...nav.querySelectorAll("a")];
  const mark = (id) => links.forEach((a) => {
    const on = a.getAttribute("href") === "#" + id;
    a.classList.toggle("on", on);
    if (on) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    if (on && nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
  });
  const io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) mark(en.target.id); }), { rootMargin: "-30% 0px -65% 0px" });
  document.querySelectorAll("main section.sec[id]").forEach((s) => io.observe(s));
  addEventListener("scroll", () => { if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) mark("contact"); }, { passive: true });

  const toast = $("#toast");
  const say = (t) => { toast.textContent = t; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); };
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => {
    const sel = () => { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say(T.selected); };
    if (navigator.clipboard) navigator.clipboard.writeText(KO.email).then(() => say(T.copied), sel); else sel();
  }));
  }
})();
