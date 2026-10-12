// data.js · data.en.js를 편집 화면(edit.html)이 저장하는 모양과 똑같이 정리합니다.
// 내용은 바꾸지 않고 줄바꿈·들여쓰기만 맞춥니다. 사용: node tools/format_data.js
const fs = require("fs"), path = require("path"), assert = require("assert");
require(path.join(__dirname, "..", "js", "serialize.js"));
for (const [file, v] of [["js/data.js", "SITE"], ["js/data.en.js", "SITE_EN"]]) {
  const p = path.join(__dirname, "..", file);
  const text = fs.readFileSync(p, "utf8");
  const { header, data } = SiteFile.read(text, v);
  const out = SiteFile.write(header, v, data);
  assert.deepStrictEqual(SiteFile.read(out, v).data, data); // 내용이 같아야만 씀
  if (out !== text) { fs.writeFileSync(p, out); console.log(file, "정리함"); } else console.log(file, "이미 정리되어 있음");
}
