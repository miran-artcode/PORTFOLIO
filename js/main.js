// 화면 그리기 — 내용은 data.js, 이 파일은 배치만 담당합니다.
(function () {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const IMG = (f) => "img/" + f;
  const host = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const ext = (u, t) => `<a class="ul" href="${u}" target="_blank" rel="noopener">${esc(t)} ↗</a>`;

  /* 소개 */
  $("#lead").textContent = S.intro.lead;
  $("#intro-body").textContent = S.intro.body;
  $("#now").innerHTML = S.intro.now.map((n) => `<div><dt class="label">${esc(n[0])}</dt><dd>${esc(n[1])}</dd></div>`).join("");
  $("#how").textContent = S.intro.howToRead;
  $("#toc").innerHTML = [{ id: "works", en: "Selected Works", ko: "선별 작업" }, ...S.chapters, { id: "images", en: "Images", ko: "이미지" }]
    .map((c) => `<li><a href="#${c.id}"><span class="en">${esc(c.en)}</span><span class="ko">${esc(c.ko)}</span></a></li>`).join("");

  /* 선별 작업 */
  $("#projects").innerHTML = S.works.map((p) => {
    const pics = [p.img, p.img2].filter(Boolean);
    const facts = p.facts ? `<dl class="facts">${p.facts.map((f) => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join("")}</dl>` : "";
    const lists = p.lists ? p.lists.map((l) => `<div class="sub"><span class="label">${esc(l.title)}</span><ul class="made">${l.items.map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`).join("") : "";
    return `
    <article class="proj grid${pics.length ? "" : " no-img"}" id="${p.id}">
      <div class="meta"><span class="label">${esc(p.year)}</span><span class="label k">${esc(p.kind)}</span></div>
      <div class="txt">
        <h3>${esc(p.title)}</h3>
        <p class="en">${esc(p.en)}</p>
        <p class="q">${esc(p.question)}</p>
        <p class="d">${esc(p.text)}</p>
        ${facts}
        ${lists}
        ${p.facts ? "" : `<ul class="made">${p.made.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>`}
        ${p.link ? `<a class="ext" href="${p.link}" target="_blank" rel="noopener">${esc(host(p.link))} ↗</a>` : ""}
      </div>
      ${pics.length ? `<div class="pics n${pics.length}">${pics.map((f) => `<figure><img loading="lazy" src="${IMG(f)}" alt="${esc(p.title)}"></figure>`).join("")}</div>` : ""}
    </article>`;
  }).join("");

  /* 장(章) */
  const row = (it) => {
    const [d, t, s, l, tech] = it;
    return `<li><span class="d">${esc(d)}</span><span class="w"><b>${l ? ext(l, t) : esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ""}${tech ? `<span class="tech">${esc(tech)}</span>` : ""}</span></li>`;
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
  $("#chapters").innerHTML = S.chapters.map((c, i) => `
    <section class="sec wrap chapter" id="${c.id}">
      <div class="sec-head grid">
        <span class="idx label">${esc(c.en)}</span>
        <h2>${esc(c.ko)}</h2>
        <p>${esc(c.blurb)}</p>
      </div>
      ${c.groups.map((g) => `
        <div class="group grid">
          <div class="gh"><h3>${esc(g.title)}</h3>${g.note ? `<p class="note">${esc(g.note)}</p>` : ""}<span class="label n">${g.kind === "threads" ? "" : g.items.length + " items"}</span></div>
          <div class="gb">${g.kind === "threads" ? threads(g) : `<ul class="ledger">${g.items.map(row).join("")}</ul>`}</div>
        </div>`).join("")}
    </section>`).join("");
  document.querySelectorAll(".threads").forEach((th) => {
    const tip = th.parentElement.nextElementSibling;
    const show = (e) => { const b = e.target.closest(".tg-bar"); if (b) tip.textContent = b.dataset.tip; };
    th.addEventListener("mouseover", show); th.addEventListener("focusin", show); th.addEventListener("click", show);
  });

  /* 이미지 */
  $("#gallery-grid").innerHTML = S.gallery.map((g) => `<figure><img loading="lazy" src="${IMG(g.img)}" alt="${esc(g.cap)}"><figcaption>${esc(g.cap)}</figcaption></figure>`).join("");

  /* 연락 */
  $("#updated").textContent = S.updated;
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = S.email));
  $("#gh").href = S.github;

  /* ── 동작 ───────────────────────────────── */
  const clock = $("#clock");
  const tick = () => { try { clock.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date()) + " KST"; } catch (e) {} };
  tick(); setInterval(tick, 30000);

  const mega = $("#mega");
  const fit = () => { mega.style.fontSize = "100px"; const w = mega.parentElement.clientWidth; mega.style.fontSize = Math.min(100 * (w / mega.scrollWidth), 360) + "px"; };
  fit(); (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit); addEventListener("resize", fit);

  const root = document.documentElement, themeBtn = $("#theme-btn");
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
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

  const nav = $("#nav"), menuBtn = $("#menu-btn");
  menuBtn.addEventListener("click", () => { const o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); } });

  const links = [...nav.querySelectorAll("a")];
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("main section.sec[id]").forEach((s) => io.observe(s));

  const toast = $("#toast");
  const say = (t) => { toast.textContent = t; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); };
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => {
    const sel = () => { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say("주소를 선택했습니다"); };
    if (navigator.clipboard) navigator.clipboard.writeText(S.email).then(() => say("이메일 주소를 복사했습니다"), sel); else sel();
  }));
})();
