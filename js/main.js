// 화면 그리기 — 내용은 data.js, 이 파일은 배치만 담당합니다.
(function () {
  const S = window.SITE;
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const IMG = (f) => "img/" + f;

  /* hero */
  $("#meta").innerHTML = S.meta.map((m) => `<div><span class="label">${esc(m.label)}</span>${m.html || esc(m.value)}</div>`).join("");
  $("#roles").innerHTML = S.roles.map((r, i) => `
    <div><span class="label num">0${i + 1} / ${esc(r.en)}</span>
      <h2>${esc(r.en)}<small>${esc(r.ko)}</small></h2>
      <p>${esc(r.body)}</p></div>`).join("");
  $("#figures").innerHTML = S.figures.map((f) => `
    <li><b>${esc(f.num)}<sub>${esc(f.unit || "")}</sub></b><span>${esc(f.label)}</span><em>${esc(f.note || "")}</em></li>`).join("");

  /* statement */
  $("#statement").innerHTML = S.statement;
  $("#beliefs").innerHTML = S.beliefs.map((b, i) => `
    <article><span class="label num">${String(i + 1).padStart(2, "0")}</span><h3>${esc(b.title)}</h3><p>${esc(b.body)}</p></article>`).join("");

  /* matrix: 해마다 어떤 영역에서 일했는지 */
  const M = S.matrix, years = [];
  for (let y = M.from; y <= M.to; y++) years.push(y);
  const mx = $("#matrix");
  mx.style.setProperty("--years", years.length);
  let h = `<span></span>` + years.map((y) => `<span class="yh${y % 5 === 0 || y === M.to ? " k" : ""}">${y}</span>`).join("");
  M.rows.forEach((r) => {
    h += `<span class="rowh">${esc(r.label)}</span>`;
    years.forEach((y) => {
      const v = r.cells[y];
      const n = v ? v[0] : 0, note = v ? v[1] : "";
      h += `<span class="cell" data-n="${n}" data-tip="${esc(y + " · " + r.label + (note ? " — " + note : ""))}" ${n ? 'tabindex="0"' : ""}></span>`;
    });
  });
  mx.innerHTML = h;
  const mw = mx.parentElement; requestAnimationFrame(() => (mw.scrollLeft = mw.scrollWidth)); // 좁은 화면에선 최근 연도부터
  const tip = $("#matrix-tip");
  const showTip = (e) => { const t = e.target.closest(".cell"); if (t && t.dataset.n !== "0") tip.textContent = t.dataset.tip; };
  mx.addEventListener("mouseover", showTip);
  mx.addEventListener("focusin", showTip);
  mx.addEventListener("click", showTip);

  /* work index */
  const counts = {};
  S.work.forEach((w) => (counts[w.cat] = (counts[w.cat] || 0) + 1));
  const filters = $("#filters");
  filters.innerHTML = [{ id: "all", label: "전체" }, ...S.categories].map((c) =>
    `<button class="pill" type="button" id="f-${c.id}" data-f="${c.id}" aria-pressed="${c.id === "all"}">${esc(c.label)}<span class="c num">${c.id === "all" ? S.work.length : counts[c.id] || 0}</span></button>`).join("");
  const catLabel = Object.fromEntries(S.categories.map((c) => [c.id, c.label]));
  const list = $("#work-list");
  list.innerHTML = S.work.map((w, i) => `
    <li data-cat="${w.cat}" ${w.img ? `data-img="${IMG(w.img)}"` : ""}>
      <button class="row grid" type="button" aria-expanded="false" id="w-${i}">
        <span class="n num">${String(i + 1).padStart(3, "0")}</span>
        <span class="t"><span class="plus" aria-hidden="true">+</span> ${esc(w.title)}</span>
        <span class="s">${esc(w.sub)}</span>
        <span class="c label">${esc(catLabel[w.cat])}</span>
        <span class="y num">${esc(w.period)}</span>
      </button>
      <div class="detail grid">
        ${w.img ? `<div class="fig"><img loading="lazy" src="${IMG(w.img)}" alt="${esc(w.title)}"></div>` : ""}
        <div class="body${w.img ? "" : " full"}">
          <ul class="pts">${w.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
          <div class="tags">${(w.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          ${w.link ? `<a class="ext" href="${w.link}" target="_blank" rel="noopener">${esc(w.link.replace(/^https?:\/\//, ""))} ↗</a>` : ""}
        </div>
      </div>
    </li>`).join("");
  list.addEventListener("click", (e) => {
    const b = e.target.closest(".row"); if (!b) return;
    const li = b.parentElement, open = !li.classList.contains("open");
    li.classList.toggle("open", open); b.setAttribute("aria-expanded", open);
  });
  filters.addEventListener("click", (e) => {
    const b = e.target.closest("[data-f]"); if (!b) return;
    filters.querySelectorAll("[data-f]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    list.querySelectorAll(":scope > li").forEach((li) => (li.hidden = b.dataset.f !== "all" && li.dataset.cat !== b.dataset.f));
  });
  // 마우스를 따라오는 미리보기
  const peek = $("#peek"), peekImg = peek.querySelector("img");
  list.addEventListener("mousemove", (e) => {
    const li = e.target.closest("li[data-img]");
    if (!li || li.classList.contains("open") || e.target.closest(".detail")) { peek.classList.remove("on"); return; }
    if (peekImg.getAttribute("src") !== li.dataset.img) peekImg.src = li.dataset.img;
    peek.style.left = e.clientX + 180 + "px"; peek.style.top = e.clientY + "px";
    peek.classList.add("on");
  });
  list.addEventListener("mouseleave", () => peek.classList.remove("on"));

  /* apps */
  $("#apps").innerHTML = S.apps.map((a) => `
    <a class="app" href="${a.url}" target="_blank" rel="noopener">
      <div class="shot"><img loading="lazy" src="${IMG(a.img)}" alt="${esc(a.name)} 화면"></div>
      <div class="cap"><h3>${esc(a.name)}</h3><span class="label num">${esc(a.year)} ↗</span><p>${esc(a.desc)}</p><p class="label">${esc(a.url.replace(/^https?:\/\//, ""))}</p></div>
    </a>`).join("");

  $("#apps-more-n").textContent = S.appsMore.length;
  $("#apps-more").innerHTML = S.appsMore.map((a) => `<li><span class="d">${esc(a[0])}</span><span class="w"><b>${esc(a[1])}</b><small>${esc(a[2])}${a[3] ? ` · <a class="ul" href="${a[3]}" target="_blank" rel="noopener">${esc(a[3].replace(/^https?:\/\//, ""))} ↗</a>` : ""}</small></span></li>`).join("");

  /* research */
  $("#pubs").innerHTML = S.pubs.map((p) => `
    <li class="grid"><span class="y num">${esc(p.year)}</span><span class="k label">${esc(p.kind)}</span><span class="ti">${esc(p.title)}</span><span class="by">${esc(p.by)}</span></li>`).join("");

  const ledger = (items) => items.map((it) => `<li><span class="d">${esc(it[0])}</span><span class="w"><b>${esc(it[1])}</b>${it[2] ? `<small>${esc(it[2])}</small>` : ""}</span></li>`).join("");
  const blocks = (el, groups) => {
    el.innerHTML = groups.map((g) => `
      <section class="block ${g.size || ""}"><h3>${esc(g.title)}<span class="label num">${g.items.length}</span></h3>
        <ul class="ledger ${g.wideDate ? "wide-d" : ""}">${ledger(g.items)}</ul></section>`).join("");
  };
  blocks($("#research-list"), S.research);

  /* talks */
  const ty = $("#talk-years");
  ty.style.setProperty("--n", S.talks.byYear.length);
  ty.innerHTML = S.talks.byYear.map((y) => `<div><span class="label num">${esc(y[0])}</span><b class="num">${esc(y[1])}</b><span class="label">${esc(y[2])}</span></div>`).join("");
  blocks($("#talks-list"), S.talks.groups);

  /* gallery */
  $("#gallery-grid").innerHTML = S.gallery.map((g, i) => `
    <figure><img loading="lazy" src="${IMG(g.img)}" alt="${esc(g.cap)}"><figcaption><span class="num">${String(i + 1).padStart(2, "0")}</span><span>${esc(g.cap)}</span></figcaption></figure>`).join("");

  /* cv */
  blocks($("#cv-list"), S.cv);

  /* voices */
  $("#voices").innerHTML = S.voices.map((v) => `<q>${esc(v)}</q>`).join("");

  /* footer */
  $("#updated").textContent = S.updated;
  document.querySelectorAll("[data-email]").forEach((el) => (el.textContent = S.email));

  /* ── 동작 ───────────────────────────────── */
  // 서울 현재 시각
  const clock = document.getElementById("clock");
  const tick = () => { try { clock.textContent = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" }).format(new Date()) + " KST"; } catch (e) {} };
  if (clock) { tick(); setInterval(tick, 30000); }

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
  document.querySelectorAll("main section[id]").forEach((s) => io.observe(s));

  // 이메일 복사
  const toast = $("#toast");
  const say = (t) => { toast.textContent = t; toast.classList.add("on"); setTimeout(() => toast.classList.remove("on"), 1800); };
  document.querySelectorAll(".copy").forEach((b) => b.addEventListener("click", () => {
    const sel = () => { const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r); say("주소를 선택했습니다. 복사해 쓰세요"); };
    if (navigator.clipboard) navigator.clipboard.writeText(S.email).then(() => say("이메일 주소를 복사했습니다"), sel); else sel();
  }));
})();
