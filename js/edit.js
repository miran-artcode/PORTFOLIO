// 사이트 편집 화면 — 한국어(js/data.js)·영어(js/data.en.js)를 칸으로 고치고 GitHub에 바로 저장합니다.
// 저장하면 GitHub Pages가 약 1분 안에 공개 사이트를 다시 만듭니다.
(function () {
  const REPO = "miran-artcode/PORTFOLIO", BRANCH = "main";
  const PAGES = "https://miran-artcode.github.io/PORTFOLIO/";
  const FILES = {
    ko: { path: "js/data.js", v: "SITE", label: "한국어" },
    en: { path: "js/data.en.js", v: "SITE_EN", label: "English" }
  };
  const DEFAULT_ORDER = ["life", "works", "write", "speak", "research", "teach", "make", "images"];
  // QR을 붙이는 주소: tools/make_qr.py와 같은 규칙
  const SITE_HOSTS = ["web.app", "netlify.app", "fliphtml5.com", "text.tsherpa.co.kr/high/book.html", "github.com/miran-artcode", "github.io"];

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: (k) => { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const P = (path) => path.join(".");
  const parseP = (s) => s.split(".").map((k) => (/^\d+$/.test(k) ? Number(k) : k));
  const getAt = (o, path) => path.reduce((a, k) => (a == null ? undefined : a[k]), o);
  function setAt(o, path, v) {
    const parent = getAt(o, path.slice(0, -1)), last = path[path.length - 1];
    if (Array.isArray(parent) && typeof last === "number") while (parent.length < last) parent.push("");
    parent[last] = v;
  }
  const today = () => { const d = new Date(); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}.`; };

  const S = {
    lang: store.get("hm-edit-lang") === "en" ? "en" : "ko",
    token: store.get("hm-gh-token") || "",
    login: "",
    base: null,      // { sha, header, text }
    baseJSON: "",
    data: null,
    force: false
  };
  const draftKey = () => "hm-draft-" + S.lang;

  /* ── 칸 모양 ─────────────────────────────── */
  const C = (label, key, w = "m", t = "text") => ({ label, key, w, t });
  const W = { s: "7.5em", m: "minmax(9em,1fr)", l: "minmax(11em,1.4fr)", xl: "minmax(14em,2.2fr)" };
  const SCHEMAS = {
    list: { cols: [C("일자", 0, "s"), C("주최·주관 기관", 1, "m"), C("제목", 2, "l"), C("설명", 3, "xl", "long"), C("링크", 4, "m"), C("기술", 5, "m")], blank: () => ["", "", "", ""] },
    lectures: { cols: [C("대상", 0, "s"), C("의뢰 기관", 1, "m"), C("강의명", 2, "l"), C("비고", 3, "m")], blank: () => ["", "", "", ""] },
    threads: { cols: [C("시작 연도", 0, "s", "num"), C("끝 연도", 1, "s", "num"), C("주제", 2, "l"), C("설명", 3, "xl", "long")], blank: () => [new Date().getFullYear(), new Date().getFullYear(), "", ""] },
    now: { cols: [C("이름", 0, "s"), C("내용", 1, "xl")], blank: () => ["", ""] },
    facts: { cols: [C("항목", 0, "m"), C("내용", 1, "xl", "long")], blank: () => ["", ""] },
    links: { cols: [C("종류 (site·doc·article)", 0, "s"), C("제목", 1, "l"), C("주소", 2, "l")], blank: () => ["site", "", ""] },
    lists: { cols: [C("제목", "title", "l"), C("항목 (한 줄에 하나)", "items", "xl", "lines")], blank: () => ({ title: "", items: [] }) },
    gallery: { cols: [C("이미지 파일", "img", "m"), C("설명", "cap", "xl")], blank: () => ({ img: "", cap: "" }) }
  };
  const CARD_FIELD = {
    date: C("날짜", "date", "s"), aud: C("대상", "aud", "s"), org: C("기관", "org", "m"), title: C("제목", "title", "l"),
    core: C("핵심 내용 (한 줄에 하나)", "core", "xl", "lines"), imgs: C("이미지 (파일 | 설명, 한 줄에 하나)", "imgs", "l", "pairs")
  };
  const isPairs = (a) => Array.isArray(a) && a.length > 0 && a.every(Array.isArray);
  function cardSchema(items) {
    const keys = [...new Set(items.flatMap((it) => (it && !Array.isArray(it) ? Object.keys(it) : [])))];
    const order = ["date", "aud", "org", "title", "core", "imgs"];
    const ks = [...order.filter((k) => keys.includes(k)), ...keys.filter((k) => !order.includes(k))];
    if (!ks.length) ks.push("date", "org", "title", "core", "imgs");
    const typeOf = (k) => (items.some((it) => isPairs(it && it[k])) ? "pairs" : items.some((it) => Array.isArray(it && it[k])) ? "lines" : "text");
    const cols = ks.map((k) => { const base = CARD_FIELD[k] || C(k, k, "m"), t = typeOf(k); return t === "text" ? base : { ...base, t }; });
    return { cols, blank: () => Object.fromEntries(cols.map((c) => [c.key, c.t === "lines" ? [] : ""])) };
  }
  function groupSchema(g) {
    if (g.kind === "lectures") return SCHEMAS.lectures;
    if (g.kind === "threads") return SCHEMAS.threads;
    if (g.kind === "cards") return cardSchema(g.items || []);
    return SCHEMAS.list;
  }
  const SCH = new Map(); // 배열 경로 → 칸 모양 (줄 추가할 때 씀)

  /* ── 화면 조각 ───────────────────────────── */
  function fld(path, col, extraCls = "", inTable = false) {
    const raw = getAt(S.data, path), t0 = col.t || "text", t = inTable && t0 === "text" ? "long" : t0;
    const val = t === "pairs" ? (Array.isArray(raw) ? raw.map((x) => (Array.isArray(x) ? x.join(" | ") : x)).join("\n") : raw ?? "")
      : t === "lines" ? (Array.isArray(raw) ? raw.join("\n") : raw ?? "") : raw ?? "";
    const p = P(path), lab = esc(col.label);
    const ctl = t === "long" || t === "lines" || t === "pairs"
      ? `<textarea data-p="${p}" data-t="${t}" aria-label="${lab}" rows="1">${esc(val)}</textarea>`
      : `<input data-p="${p}" data-t="${t}" aria-label="${lab}" value="${esc(val)}"${t === "num" ? ' inputmode="numeric"' : ""}>`;
    return `<label class="f ${extraCls}"><span class="lb">${lab}</span>${ctl}</label>`;
  }
  const ops = (what) => `<div class="ops"><button type="button" data-act="up" title="위로">↑</button><button type="button" data-act="down" title="아래로">↓</button><button type="button" data-act="del" title="${what} 삭제">삭제</button></div>`;
  const cols = (sch) => sch.cols.map((c) => W[c.w]).join(" ");

  function table(arrPath, sch, opts = {}) {
    const key = P(arrPath);
    SCH.set(key, sch);
    const arr = getAt(S.data, arrPath) || [];
    const head = `<div class="row head"><div class="cells" style="grid-template-columns:${cols(sch)}">${sch.cols.map((c) => `<span>${esc(c.label)}</span>`).join("")}</div><div></div></div>`;
    const rows = arr.map((_, i) => `<div class="row" data-arr="${key}" data-i="${i}"><div class="cells" style="grid-template-columns:${cols(sch)}">${sch.cols.map((c) => fld([...arrPath, i, c.key], c, "", true)).join("")}</div>${ops("줄")}</div>`).join("");
    const adds = `<div class="adds">${opts.top === false ? "" : `<button type="button" data-act="add-top" data-arr="${key}">+ 맨 위에 줄 추가</button>`}<button type="button" data-act="add-end" data-arr="${key}">+ 맨 아래에 줄 추가</button></div>`;
    return `<div class="tbl">${arr.length ? head : ""}${rows}${adds}</div>`;
  }

  function basicHTML() {
    const D = S.data, h = [];
    if (D.intro) {
      h.push(fld(["intro", "lead"], C("첫 문장", "lead", "xl", "long"), "wide"));
      h.push(fld(["intro", "body"], C("소개 글", "body", "xl", "long"), "wide"));
      if (D.intro.now) h.push(`<div class="sub"><h4>지금 하는 일</h4>${table(["intro", "now"], SCHEMAS.now, { top: false })}</div>`);
    }
    if ("email" in D) h.push(fld(["email"], C("이메일", "email")));
    if ("github" in D) h.push(fld(["github"], C("GitHub 주소", "github")));
    if (D.heads) for (const [k, name] of [["works", "선별 작업"], ["images", "이미지"]]) {
      if (!D.heads[k]) continue;
      h.push(fld(["heads", k, "title"], C(`${name} 구역 제목`, "title")));
      h.push(fld(["heads", k, "blurb"], C(`${name} 구역 설명`, "blurb", "xl", "long"), "wide"));
    }
    if ("updated" in D) h.push(`<p class="hint">최종 수정일(${esc(D.updated)})은 저장할 때 오늘 날짜로 바뀝니다.</p>`);
    return `<div class="fields">${h.join("")}</div>`;
  }

  function worksHTML() {
    const ws = S.data.works || [];
    const one = (w, i) => {
      const b = ["works", i], F = (k, label, wd = "m", t = "text", cls = "") => fld([...b, k], C(label, k, wd, t), cls);
      const parts = [
        `<div class="fields">`,
        F("title", "제목", "l"), F("en", "영문 제목", "l"), F("year", "연도", "s"), F("kind", "종류"), F("org", "기관"),
        F("img", "대표 이미지 파일"), F("img2", "두 번째 이미지 파일"),
        F("question", "질문", "xl", "long", "wide"), F("text", "설명", "xl", "long", "wide"), F("made", "만든 것 (한 줄에 하나)", "xl", "lines", "wide"),
        `</div>`,
        `<div class="sub"><h4>사실 정보 (항목 · 내용)</h4>${table([...b, "facts"], SCHEMAS.facts, { top: false })}</div>`,
        w.lists ? `<div class="sub"><h4>목록</h4>${table([...b, "lists"], SCHEMAS.lists, { top: false })}</div>` : "",
        `<div class="sub"><h4>링크 (QR은 저장할 때 자동으로 만듭니다)</h4>${table([...b, "links"], SCHEMAS.links, { top: false })}</div>`
      ];
      return `<article class="work" data-arr="works" data-i="${i}"><header><b>${esc(w.title || "(제목 없음)")}</b>${ops("작업")}</header>${parts.join("")}</article>`;
    };
    return ws.map(one).join("") + `<div class="adds"><button type="button" data-act="add-work">+ 선별 작업 추가</button></div>`;
  }

  function chapterHTML(ci) {
    const c = S.data.chapters[ci], base = ["chapters", ci];
    const head = `<div class="fields">${fld([...base, "ko"], C("구역 제목", "ko"))}${fld([...base, "blurb"], C("구역 설명", "blurb", "xl", "long"), "wide")}</div>`;
    const groups = (c.groups || []).map((g, gi) => {
      const gp = [...base, "groups", gi];
      const kindLabel = { lectures: "강의 목록", threads: "흐름 도식", cards: "카드" }[g.kind] || "";
      return `<div class="grp" data-arr="${P([...base, "groups"])}" data-i="${gi}">
        <header>${fld([...gp, "title"], C("묶음 이름", "title"), "gt")}${fld([...gp, "note"], C("묶음 설명 (없으면 비움)", "note", "xl"), "gn")}${kindLabel ? `<span class="kind">${kindLabel}</span>` : ""}${ops("묶음")}</header>
        ${table([...gp, "items"], groupSchema(g))}
      </div>`;
    }).join("");
    const gk = P([...base, "groups"]);
    return head + groups + `<div class="adds"><button type="button" data-act="add-group-top" data-arr="${gk}">+ 맨 위에 묶음 추가</button><button type="button" data-act="add-group-end" data-arr="${gk}">+ 맨 아래에 묶음 추가</button></div>`;
  }

  function renderAll() {
    SCH.clear();
    const D = S.data;
    const order = [...((S.lang === "ko" && D.order) || DEFAULT_ORDER)];
    (D.chapters || []).forEach((c) => { if (!order.includes(c.id)) order.push(c.id); });
    const secs = [["basic", "기본 정보", basicHTML()]];
    for (const id of order) {
      if (id === "works" && D.works) secs.push(["works", (D.heads && D.heads.works && D.heads.works.title) || "선별 작업", worksHTML()]);
      else if (id === "images" && D.gallery) { SCH.set("gallery", SCHEMAS.gallery); secs.push(["images", (D.heads && D.heads.images && D.heads.images.title) || "이미지", table(["gallery"], SCHEMAS.gallery)]); }
      else {
        const ci = (D.chapters || []).findIndex((c) => c.id === id);
        if (ci >= 0) secs.push([id, D.chapters[ci].ko || D.chapters[ci].en || id, chapterHTML(ci)]);
      }
    }
    $("#side").innerHTML = secs.map(([id, t]) => `<a href="#s-${id}">${esc(t)}</a>`).join("");
    $("#ed").innerHTML = secs.map(([id, t, h]) => `<section class="sec" id="s-${id}"><h2>${esc(t)}</h2>${h}</section>`).join("");
    applySearch();
  }

  function rerender(after) {
    const y = scrollY;
    renderAll();
    scrollTo(0, y);
    if (after) after();
  }

  /* ── 상태 표시 ───────────────────────────── */
  function say(html, kind = "") { const n = $("#notice"); n.className = kind; n.innerHTML = html; n.hidden = !html; }
  function setState(t) { $("#state").textContent = t; }
  let dirtyT;
  function changed() {
    clearTimeout(dirtyT);
    dirtyT = setTimeout(() => {
      const dirty = S.data && JSON.stringify(S.data) !== S.baseJSON;
      $("#save").disabled = !dirty;
      setState(dirty ? "저장하지 않은 수정이 있습니다 (이 컴퓨터에 임시 보관 중)" : "공개 사이트와 같습니다");
      if (dirty) store.set(draftKey(), JSON.stringify({ sha: S.base.sha, at: Date.now(), data: S.data }));
      else store.del(draftKey());
    }, 250);
  }
  const isDirty = () => S.data && JSON.stringify(S.data) !== S.baseJSON;

  /* ── GitHub ──────────────────────────────── */
  async function gh(path, opt = {}) {
    const headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", Authorization: "Bearer " + S.token };
    if (opt.body) headers["Content-Type"] = "application/json";
    let r;
    try { r = await fetch("https://api.github.com" + path, { ...opt, headers, cache: "no-store" }); }
    catch (e) { const er = new Error("인터넷 연결을 확인해 주세요."); er.net = true; throw er; }
    if (!r.ok) { const er = new Error(`GitHub 응답 ${r.status}: ${(await r.text()).slice(0, 160)}`); er.status = r.status; throw er; }
    return r.status === 204 ? null : r.json();
  }
  const b64dec = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  async function getFile(path) { const j = await gh(`/repos/${REPO}/contents/${path}?ref=${BRANCH}&t=${Date.now()}`); return { sha: j.sha, text: b64dec(j.content) }; }

  async function commitFiles(files, message) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ref = await gh(`/repos/${REPO}/git/ref/heads/${BRANCH}`);
      const head = await gh(`/repos/${REPO}/git/commits/${ref.object.sha}`);
      const tree = await gh(`/repos/${REPO}/git/trees`, { method: "POST", body: JSON.stringify({ base_tree: head.tree.sha, tree: files.map((f) => ({ path: f.path, mode: "100644", type: "blob", content: f.content })) }) });
      const commit = await gh(`/repos/${REPO}/git/commits`, { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }) });
      try { await gh(`/repos/${REPO}/git/refs/heads/${BRANCH}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) }); return commit; }
      catch (e) { if (e.status !== 422 || attempt === 2) throw e; } // 그 사이 다른 커밋이 들어오면 다시 시도
    }
  }

  function handleErr(e) {
    if (e.status === 401) { openConnect("GitHub 연결이 만료되었거나 토큰이 맞지 않습니다. 토큰을 다시 넣어 주세요."); return; }
    if (e.status === 403 || e.status === 404) { say(`저장할 권한이 없습니다. 토큰을 만들 때 저장소를 <b>PORTFOLIO</b>로 고르고, Contents 권한을 <b>Read and write</b>로 했는지 확인해 주세요.<br><small>${esc(e.message)}</small>`, "bad"); return; }
    say(`문제가 생겼습니다. ${esc(e.message)}`, "bad");
  }

  /* ── 불러오기 ────────────────────────────── */
  async function load(lang, opts = {}) {
    S.lang = lang; store.set("hm-edit-lang", lang);
    $$(".langs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === lang));
    const F = FILES[lang];
    setState("불러오는 중…"); say("");
    let text, sha = null;
    try {
      if (S.token) ({ sha, text } = await getFile(F.path));
      else text = await (await fetch(F.path + "?t=" + Date.now(), { cache: "no-store" })).text();
    } catch (e) { handleErr(e); return; }
    const r = SiteFile.read(text, F.v);
    S.base = { sha, header: r.header, text };
    S.baseJSON = JSON.stringify(r.data);
    S.data = r.data;
    S.force = false;
    const dr = (() => { try { return JSON.parse(store.get(draftKey()) || "null"); } catch (e) { return null; } })();
    if (!opts.dropDraft && dr && dr.data && JSON.stringify(dr.data) !== S.baseJSON) {
      const stale = sha && dr.sha && dr.sha !== sha;
      say(`${new Date(dr.at).toLocaleString("ko-KR")}에 고치다 저장하지 않은 내용이 있습니다.${stale ? " <b>그 뒤에 공개 사이트 내용이 바뀌었으니</b>, 이어서 하면 그사이 바뀐 부분을 덮어쓸 수 있습니다." : ""}
        <button type="button" data-act="draft-use">이어서 고치기</button> <button type="button" data-act="draft-drop">버리고 공개본으로</button>`, "warn");
      S.pendingDraft = dr;
    }
    renderAll();
    changed();
    if (!S.token) say((($("#notice").innerHTML && $("#notice").innerHTML + "<br>") || "") + "지금은 보기·미리보기만 됩니다. 저장하려면 오른쪽 위 <b>GitHub 연결</b>을 한 번 해 두세요.", $("#notice").className || "");
  }

  /* ── 저장 ────────────────────────────────── */
  const isEmpty = (v) => v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.every(isEmpty)) || (typeof v === "object" && !Array.isArray(v) && Object.values(v).every(isEmpty));
  function trimRow(r, min) { r = Array.from(r, (x) => (x === undefined ? "" : x)); while (r.length > min && r[r.length - 1] === "") r.pop(); return r; }
  function clean(D) {
    const lines = (a) => (Array.isArray(a) ? a.map((s) => String(s)).filter((s) => s.trim()) : a);
    (D.chapters || []).forEach((c) => (c.groups || []).forEach((g) => {
      if (g.note === "") delete g.note;
      g.items = (g.items || []).filter((it) => !isEmpty(it)).map((it) => {
        if (Array.isArray(it)) return trimRow(it, 4);
        for (const k of Object.keys(it)) if (Array.isArray(it[k])) it[k] = it[k].some(Array.isArray) ? it[k].filter((x) => !isEmpty(x)) : lines(it[k]);
        return it;
      });
    }));
    (D.works || []).forEach((w) => {
      if (w.made) w.made = lines(w.made);
      for (const k of ["facts", "links"]) if (w[k]) w[k] = w[k].filter((r) => !isEmpty(r)).map((r) => trimRow(r, k === "links" ? 3 : 2));
      if (w.lists) w.lists = w.lists.filter((l) => !isEmpty(l)).map((l) => ({ ...l, items: lines(l.items) }));
      if (w.facts && !w.facts.length) delete w.facts;
      if (w.lists && !w.lists.length) delete w.lists;
    });
    if (D.gallery) D.gallery = D.gallery.filter((g) => !isEmpty(g));
    if (D.intro && D.intro.now) D.intro.now = D.intro.now.filter((r) => !isEmpty(r));
    return D;
  }
  function summary(a, b) {
    const out = [];
    if (JSON.stringify(a.intro) !== JSON.stringify(b.intro) || a.email !== b.email || JSON.stringify(a.heads) !== JSON.stringify(b.heads)) out.push("기본 정보");
    if (JSON.stringify(a.works) !== JSON.stringify(b.works)) out.push("선별 작업");
    (b.chapters || []).forEach((c, ci) => {
      const ac = (a.chapters || []).find((x) => x.id === c.id);
      if (!ac) { out.push(c.ko || c.id); return; }
      if (ac.ko !== c.ko || ac.blurb !== c.blurb) out.push(c.ko || c.id);
      c.groups.forEach((g) => { const ag = ac.groups.find((x) => x.title === g.title); if (!ag || JSON.stringify(ag) !== JSON.stringify(g)) out.push(`${c.ko || c.id} › ${g.title}`); });
      if (ac.groups.length > c.groups.length) out.push(`${c.ko || c.id} › 묶음 삭제`);
    });
    if (JSON.stringify(a.gallery) !== JSON.stringify(b.gallery)) out.push("이미지");
    const u = [...new Set(out)];
    return (u.length ? u.slice(0, 4).join(", ") + (u.length > 4 ? ` 외 ${u.length - 4}곳` : "") : "내용 정리") + ` (${FILES[S.lang].label})`;
  }
  async function sha1hex(s) { const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(s)); return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, "0")).join(""); }
  async function qrFiles(text) {
    const urls = [...new Set(text.match(/https:\/\/[^"\s]+/g) || [])].filter((u) => SITE_HOSTS.some((h) => u.includes(h)));
    if (!urls.length || !window.qrcode || !(window.crypto && crypto.subtle)) return [];
    const q = await getFile("js/qr.js"); const w = {}; new Function("window", q.text)(w);
    const table = w.QR || {}, add = urls.filter((u) => !table[u]);
    if (!add.length) return [];
    const out = [];
    for (const u of add) {
      const name = "img/qr/" + (await sha1hex(u)).slice(0, 10) + ".svg";
      const qr = qrcode(0, "M"); qr.addData(u); qr.make();
      out.push({ path: name, content: '<?xml version="1.0" encoding="UTF-8"?>\n' + qr.createSvgTag(4, 4) + "\n" });
      table[u] = name;
    }
    const sorted = Object.fromEntries(Object.keys(table).sort().map((k) => [k, table[k]]));
    out.push({ path: "js/qr.js", content: "// tools/make_qr.py와 편집 화면(edit.html)이 만든 파일입니다. 직접 고치지 마세요.\nwindow.QR = " + JSON.stringify(sorted, null, 1) + ";\n" });
    return out;
  }

  async function save() {
    if (!S.token) { openConnect("저장하려면 GitHub 연결이 필요합니다. 처음 한 번만 하면 됩니다."); return; }
    const F = FILES[S.lang];
    $("#save").disabled = true; setState("저장하는 중…"); say("");
    try {
      const cur = await getFile(F.path);
      const same = S.base.sha ? cur.sha === S.base.sha : cur.text === S.base.text;
      if (!same && !S.force) {
        say(`편집을 시작한 뒤에 다른 곳(예: Claude 작업)에서 이 파일이 바뀌었습니다. 그대로 저장하면 그 변경을 덮어씁니다.
          <button type="button" data-act="force-save">내 수정으로 덮어쓰기</button> <button type="button" data-act="reload-latest">최신본 불러오기 (지금 수정은 버림)</button>`, "warn");
        setState("저장하지 않았습니다"); $("#save").disabled = false; return;
      }
      const out = clean(JSON.parse(JSON.stringify(S.data)));
      if ("updated" in out) out.updated = today();
      const text = SiteFile.write(S.base.header, F.v, out);
      SiteFile.read(text, F.v); // 다시 읽혀야 저장
      const files = [{ path: F.path, content: text }, ...(await qrFiles(text))];
      await commitFiles(files, "사이트에서 직접 수정: " + summary(JSON.parse(S.baseJSON), out));
      const fresh = await getFile(F.path);
      S.base = { sha: fresh.sha, header: S.base.header, text: fresh.text };
      S.data = out; S.baseJSON = JSON.stringify(out); S.force = false;
      store.del(draftKey());
      rerender(); changed();
      watchPages(F.path, text);
    } catch (e) { handleErr(e); setState("저장하지 않았습니다"); $("#save").disabled = !isDirty(); }
  }

  function watchPages(path, text) {
    const t0 = Date.now();
    say(`저장했습니다. 공개 사이트에 반영되는 중입니다… <span id="wait">0초</span>`, "ok");
    const tick = setInterval(async () => {
      const s = Math.round((Date.now() - t0) / 1000), w = $("#wait");
      if (w) w.textContent = s + "초";
      try {
        const live = await (await fetch(PAGES + path + "?t=" + Date.now(), { cache: "no-store" })).text();
        if (live === text) { clearInterval(tick); say(`공개 사이트에 반영됐습니다 (${s}초). <a href="${PAGES}${S.lang === "en" ? "?lang=en" : ""}" target="_blank" rel="noopener">사이트 보기 ↗</a>`, "ok"); }
      } catch (e) {}
      if (s > 300) { clearInterval(tick); say(`저장은 됐지만 5분이 지나도 공개 사이트가 아직 예전 내용입니다. 잠시 뒤 사이트를 새로고침해 보세요.`, "warn"); }
    }, 5000);
  }

  /* ── 연결 ────────────────────────────────── */
  function openConnect(msg) {
    $("#connect").hidden = false;
    $("#connect-msg").textContent = msg || "";
    $("#tok").focus();
  }
  async function connect() {
    const t = $("#tok").value.trim();
    if (!t) return;
    S.token = t;
    try {
      const me = await gh("/user").catch(() => null);
      await gh(`/repos/${REPO}/contents/js/data.js?ref=${BRANCH}`);
      store.set("hm-gh-token", t);
      S.login = me ? me.login : "";
      $("#connect").hidden = true; $("#tok").value = "";
      syncConn();
      const wasDirty = isDirty(), mine = S.data;
      await load(S.lang, { dropDraft: true });
      if (wasDirty) { S.data = mine; rerender(); changed(); }
      say("GitHub에 연결했습니다. 이제 저장할 수 있습니다.", "ok");
    } catch (e) {
      S.token = store.get("hm-gh-token") || "";
      $("#connect-msg").textContent = e.status === 401 ? "토큰이 맞지 않습니다. 복사한 값을 다시 붙여 넣어 주세요." : "이 토큰으로 PORTFOLIO 저장소를 읽지 못했습니다. 저장소 선택과 권한을 확인해 주세요.";
    }
  }
  function syncConn() {
    const b = $("#conn");
    b.textContent = S.token ? `연결됨${S.login ? " · " + S.login : ""}` : "GitHub 연결";
    b.classList.toggle("on", !!S.token);
  }

  /* ── 찾기 ────────────────────────────────── */
  function applySearch() {
    const q = ($("#q").value || "").trim().toLowerCase();
    const textOf = (el) => $$("input,textarea", el).map((x) => x.value).join(" ").toLowerCase();
    let n = 0;
    $$("#ed .row:not(.head)").forEach((r) => { const hit = !q || textOf(r).includes(q); r.hidden = !hit; if (q && hit) n++; });
    $$("#ed .work").forEach((w) => { const hit = !q || textOf(w).includes(q); w.hidden = !hit; if (hit) $$(".row", w).forEach((r) => (r.hidden = false)); });
    $$("#ed .grp").forEach((g) => { g.hidden = !!q && !$$(".row:not(.head)", g).some((r) => !r.hidden) && !textOf($("header", g)).includes(q); });
    $$("#ed .sec").forEach((s) => { s.hidden = !!q && !$$(".row:not(.head), .work, .f", s).some((x) => !x.hidden && (!x.matches(".f") || textOf(x).includes(q))); });
    $$("#ed .adds").forEach((a) => (a.hidden = !!q));
    $("#qn").textContent = q ? `${n}줄 찾음` : "";
  }

  /* ── 이벤트 ──────────────────────────────── */
  document.addEventListener("input", (e) => {
    const el = e.target.closest("[data-p]");
    if (el) {
      let v = el.value;
      if (el.dataset.t === "lines") v = v.split("\n").filter((s) => s.trim());
      if (el.dataset.t === "pairs") v = v.split("\n").filter((s) => s.trim()).map((l) => { const i = l.indexOf("|"); return i < 0 ? [l.trim(), ""] : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; });
      if (el.dataset.t === "num") { const n = Number(v); v = v.trim() !== "" && !isNaN(n) ? n : v; }
      setAt(S.data, parseP(el.dataset.p), v);
      changed();
      return;
    }
    if (e.target.id === "q") applySearch();
  });

  document.addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-act], button[data-lang]");
    if (!b) return;
    if (b.dataset.lang) {
      if (b.dataset.lang === S.lang) return;
      if (isDirty()) store.set(draftKey(), JSON.stringify({ sha: S.base.sha, at: Date.now(), data: S.data }));
      load(b.dataset.lang);
      return;
    }
    const act = b.dataset.act;
    if (act === "draft-use") { S.data = S.pendingDraft.data; say(""); rerender(); changed(); return; }
    if (act === "draft-drop") { store.del(draftKey()); say(""); load(S.lang, { dropDraft: true }); return; }
    if (act === "force-save") { S.force = true; say(""); save(); return; }
    if (act === "reload-latest") { store.del(draftKey()); load(S.lang, { dropDraft: true }); return; }
    if (act === "add-top" || act === "add-end") {
      const key = b.dataset.arr, ap = parseP(key);
      if (!Array.isArray(getAt(S.data, ap))) setAt(S.data, ap, []);
      const arr = getAt(S.data, ap), item = (SCH.get(key) || SCHEMAS.list).blank();
      act === "add-top" ? arr.unshift(item) : arr.push(item);
      const idx = act === "add-top" ? 0 : arr.length - 1;
      rerender(() => { const r = $(`.row[data-arr="${key}"][data-i="${idx}"]`); if (r) { r.scrollIntoView({ block: "center" }); const f = $("input,textarea", r); if (f) f.focus(); } });
      changed(); return;
    }
    if (act === "add-group-top" || act === "add-group-end") {
      const ap = parseP(b.dataset.arr), arr = getAt(S.data, ap);
      const near = act === "add-group-top" ? arr[0] : arr[arr.length - 1];
      const g = { title: "새 묶음", items: [] };
      if (near && near.kind === "lectures") g.kind = "lectures";
      act === "add-group-top" ? arr.unshift(g) : arr.push(g);
      rerender(); changed(); return;
    }
    if (act === "add-work") {
      S.data.works.push({ id: "work-" + Date.now().toString(36), title: "", en: "", year: "", kind: "", org: "", img: "", question: "", text: "", made: [], links: [] });
      rerender(() => { const w = $$(".work").pop(); if (w) { w.scrollIntoView({ block: "start" }); $("input", w).focus(); } });
      changed(); return;
    }
    const item = b.closest("[data-arr][data-i]");
    if (!item) return;
    const arr = getAt(S.data, parseP(item.dataset.arr)), i = Number(item.dataset.i);
    if (act === "up" && i > 0) [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
    else if (act === "down" && i < arr.length - 1) [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]];
    else if (act === "del") {
      if (!b.classList.contains("arm")) { b.classList.add("arm"); b.textContent = "정말 삭제"; setTimeout(() => { b.classList.remove("arm"); b.textContent = "삭제"; }, 3000); return; }
      arr.splice(i, 1);
    } else return;
    rerender(); changed();
  });

  window.SiteEdit = { clean }; // 시험용: 손대지 않은 내용은 저장해도 그대로여야 함
  $("#save").addEventListener("click", save);
  $("#preview").addEventListener("click", () => {
    if (isDirty()) store.set(draftKey(), JSON.stringify({ sha: S.base.sha, at: Date.now(), data: S.data }));
    const qs = [isDirty() ? "draft=1" : "", S.lang === "en" ? "lang=en" : ""].filter(Boolean).join("&");
    window.open("index.html" + (qs ? "?" + qs : ""), "hm-preview");
  });
  $("#conn").addEventListener("click", () => { if ($("#connect").hidden) openConnect(""); else $("#connect").hidden = true; });
  $("#tok-save").addEventListener("click", connect);
  $("#tok").addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
  $("#tok-forget").addEventListener("click", () => { store.del("hm-gh-token"); S.token = ""; S.login = ""; syncConn(); $("#connect").hidden = true; say("이 컴퓨터에서 GitHub 연결을 지웠습니다."); });
  addEventListener("beforeunload", (e) => { if (isDirty()) { e.preventDefault(); e.returnValue = ""; } });
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); if (!$("#save").disabled) save(); } });

  (async () => {
    syncConn();
    if (S.token) { try { const me = await gh("/user"); S.login = me.login; syncConn(); } catch (e) { if (e.status === 401) { S.token = ""; syncConn(); } } }
    load(S.lang);
  })();
})();
