// data.js · data.en.js를 읽고, 늘 같은 모양으로 다시 씁니다.
// 편집 화면(edit.html)이 저장할 때 쓰고, tools/format_data.js도 같은 규칙을 씁니다.
(function (root) {
  const IDENT = /^[A-Za-z_$][\w$]*$/;
  const isPrim = (v) => v === null || typeof v !== "object";
  const key = (k) => (IDENT.test(k) ? k : JSON.stringify(k));

  // 짧은 값 묶음은 한 줄, 나머지는 한 단계씩 들여 씁니다.
  function ser(v, ind) {
    const pad = "  ".repeat(ind), pad1 = "  ".repeat(ind + 1);
    if (isPrim(v)) return JSON.stringify(v);
    if (Array.isArray(v)) {
      if (!v.length) return "[]";
      // 표의 한 줄(값 6개 이하)이나 짧은 목록은 한 줄로, 긴 문장 목록은 한 줄에 하나씩
      if (v.every(isPrim) && (v.length <= 6 || JSON.stringify(v).length <= 110)) return JSON.stringify(v);
      if (v.every(isPrim)) return "[\n" + v.map((x) => pad1 + JSON.stringify(x)).join(",\n") + "\n" + pad + "]";
      return "[\n" + v.map((x) => pad1 + ser(x, ind + 1)).join(",\n") + "\n" + pad + "]";
    }
    const ks = Object.keys(v);
    if (!ks.length) return "{}";
    const inline = "{ " + ks.map((k) => key(k) + ": " + JSON.stringify(v[k])).join(", ") + " }";
    if (ks.every((k) => isPrim(v[k])) && inline.length <= 110) return inline;
    return "{\n" + ks.map((k) => pad1 + key(k) + ": " + ser(v[k], ind + 1)).join(",\n") + "\n" + pad + "}";
  }

  // 파일 맨 위 설명 주석(header)은 그대로 두고 내용만 바꿉니다.
  function write(header, varName, obj) {
    return header.replace(/\s*$/, "") + "\n\nwindow." + varName + " = " + ser(obj, 0) + ";\n";
  }

  function read(text, varName) {
    const i = text.indexOf("window." + varName + " =");
    if (i < 0) throw new Error("파일에서 window." + varName + "를 찾지 못했습니다");
    const w = {};
    new Function("window", text)(w);
    if (!w[varName]) throw new Error("window." + varName + "가 비어 있습니다");
    return { header: text.slice(0, i), data: w[varName] };
  }

  root.SiteFile = { ser, write, read };
})(typeof window !== "undefined" ? window : globalThis);
