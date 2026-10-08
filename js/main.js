// 화면 그리기 — 내용은 data.js, 이 파일은 배치만 담당합니다.
(function () {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const IMG = (f) => "img/" + f;
  const host = (u) => u.replace(/^https?:\/\//, "").replace(/\/$/, "");

  /* 소개 */
  $("#lead").textContent = S.intro.lead;
  $("#intro-body").textContent = S.intro.body;
  $("#now").innerHTML = S.intro.now.map((n) => `<div><dt class="label">${esc(n[0])}</dt><dd>${esc(n[1])}</dd></div>`).join("");

  /* 대표 작업 */
  $("#projects").innerHTML = S.projects.map((p) => {
    const pics = [p.img, p.img2].filter(Boolean);
    return `
    <article class="proj grid${pics.length ? "" : " no-img"}" id="${p.id}">
      <div class="meta">
        <span class="label">${esc(p.year)}</span>
        <span class="label">${esc(p.kind)}</span>
      </div>
      <div class="txt">
        <h3>${esc(p.title)}</h3>
        <p class="en">${esc(p.en)}</p>
        <p class="q">${esc(p.question)}</p>
        <p class="d">${esc(p.text)}</p>
        <ul class="made">${p.made.map((m) => `<li>${esc(m)}</li>`).join("")}</ul>
        ${p.link ? `<a class="ext" href="${p.link}" target="_blank" rel="noopener">${esc(host(p.link))} ↗</a>` : ""}
      </div>
      ${pics.length ? `<div class="pics n${pics.length}">${pics.map((f) => `<figure><img loading="lazy" src="${IMG(f)}" alt="${esc(p.title)}"></figure>`).join("")}</div>` : ""}
    </article>`;
  }).join("");

  /* 그 밖의 작업 */
  $("#arch").innerHTML = S.archive.map((a) => `
    <li class="grid"><span class="y label">${esc(a[0])}</span><span class="t">${a[3] ? `<a class="ul" href="${a[3]}" target="_blank" rel="noopener">${esc(a[1])} ↗</a>` : esc(a[1])}</span><span class="k">${esc(a[2])}</span></li>`).join("");

  /* 연구의 흐름: 연도 모눈 위의 선 */
  const T = S.threads, span = T.to - T.from + 1, th = $("#threads");
  let h = `<div class="tg-years" style="--n:${span}">`;
  for (let y = T.from; y <= T.to; y++) h += `<span class="${y % 2 ? "" : "on"}">${y % 2 ? "" : y}</span>`;
  h += `</div>`;
  T.rows.forEach((r, i) => {
    const s = r[0] - T.from, e = r[1] - T.from + 1;
    h += `<div class="tg-row" style="--n:${span}">
      <button class="tg-bar" type="button" style="grid-column:${s + 1} / ${e + 1}" data-tip="${esc(r[0] + "–" + r[1] + " · " + r[2] + ": " + r[3])}">
        <span class="tg-name">${esc(r[2])}</span></button></div>`;
  });
  th.innerHTML = h;
  const tip = $("#thread-tip");
  tip.textContent = T.rows.map((r) => r[2]).join(" → ");
  const showTip = (e) => { const b = e.target.closest(".tg-bar"); if (b) tip.textContent = b.dataset.tip; };
  th.addEventListener("mouseover", showTip); th.addEventListener("focusin", showTip); th.addEventListener("click", showTip);

  $("#ongoing").innerHTML = S.ongoing.map((o) => `<li><b>${esc(o[0])}</b><small>${esc(o[1])}</small></li>`).join("");
  $("#pubs").innerHTML = S.publications.map((p) => `
    <li><span class="y label">${esc(p.year)}</span><span class="w"><span class="k label">${esc(p.kind)}</span><span class="ti">${esc(p.title)}</span><span class="by">${esc(p.by)}</span></span></li>`).join("");

  /* 가르치는 일 */
  $("#approach").innerHTML = S.teaching.approach.map((a) => `<article><h3>${esc(a.title)}</h3><p>${esc(a.body)}</p></article>`).join("");
  $("#courses").innerHTML = S.teaching.courses.map((c) => `<li><b>${esc(c)}</b></li>`).join("");
  $("#talks").innerHTML = S.talks.map((t) => `<li><span class="d">${esc(t[0])}</span><span class="w"><b>${esc(t[1])}</b><small>${esc(t[2])}</small></span></li>`).join("");

  /* 이미지 */
  $("#gallery-grid").innerHTML = S.gallery.map((g) => `<figure><img loading="lazy" src="${IMG(g.img)}" alt="${esc(g.cap)}"><figcaption>${esc(g.cap)}</figcaption></figure>`).join("");

  /* 이력 */
  $("#cv-list").innerHTML = S.cv.map((g) => `
    <section class="block"><h3>${esc(g.title)}</h3><ul class="ledger">${g.items.map((it) => `<li><span class="d">${esc(it[0])}</span><span class="w"><b>${esc(it[1])}</b>${it[2] ? `<small>${esc(it[2])}</small>` : ""}</span></li>`).join("")}</ul></section>`).join("");

  /* 연락 */
  $("#updated").textContent = S.updated;
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = S.email));
  $("#gh").href = S.github;

  /* ── 동작 ───────────────────────────────── */
  const clock = $("#clock");
  const tick = () => { try { clock.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date()) + " KST"; } catch (e) {} };
  tick(); setInterval(tick, 30000);

  // 워드마크를 화면 폭에 꼭 맞춘다
  const mega = $("#mega");
  const fit = () => {
    mega.style.fontSize = "100px";
    const w = mega.parentElement.clientWidth;
    mega.style.fontSize = Math.min(100 * (w / mega.scrollWidth), 360) + "px";
  };
  fit();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit);
  addEventListener("resize", fit);

  // 테마
  const root = document.documentElement, themeBtn = $("#theme-btn");
  const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
  const saved = store.get("hm-theme");
  if (saved) root.dataset.theme = saved;
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncTheme = () => (themeBtn.textContent = isDark() ? "Light" : "Dark");
  syncTheme();
  themeBtn.addEventListener("click", () => { root.dataset.theme = isDark() ? "light" : "dark"; store.set("hm-theme", root.dataset.theme); syncTheme(); });

  // 모눈 보기
  const ov = $("#overlay"), gridBtn = $("#grid-btn");
  ov.querySelector(".grid").innerHTML = "<span></span>".repeat(12);
  const toggleGrid = () => { ov.hidden = !ov.hidden; gridBtn.setAttribute("aria-pressed", !ov.hidden); };
  gridBtn.addEventListener("click", toggleGrid);
  addEventListener("keydown", (e) => { if ((e.key === "g" || e.key === "G") && !e.target.closest("input,textarea") && !e.metaKey && !e.ctrlKey) toggleGrid(); });

  // 모바일 메뉴
  const nav = $("#nav"), menuBtn = $("#menu-btn");
  menuBtn.addEventListener("click", () => { const o = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", o); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", false); } });

  // 현재 구역 표시
  const links = [...nav.querySelectorAll("a")];
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll("main section.sec[id]").forEach((s) => io.observe(s));

  // 이메일 복사
  const toast = $("#toast");
  const say = (t) => { toast.textContent = t; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); };
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => {
    const sel = () => { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say("주소를 선택했습니다"); };
    if (navigator.clipboard) navigator.clipboard.writeText(S.email).then(() => say("이메일 주소를 복사했습니다"), sel); else sel();
  }));
})();
