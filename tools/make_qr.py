# data.js에 있는 실제 사이트 주소마다 QR 코드(SVG)를 만들고 js/qr.js에 주소→파일 표를 씁니다.
# 사용: python tools/make_qr.py   (링크를 바꾼 뒤 다시 실행)
import re, hashlib, json, pathlib
import qrcode, qrcode.image.svg

ROOT = pathlib.Path(__file__).resolve().parent.parent
SITE_HOSTS = ("web.app", "netlify.app", "fliphtml5.com", "text.tsherpa.co.kr/high/book.html", "github.com/miran-artcode", "github.io")

src = (ROOT / "js" / "data.js").read_text(encoding="utf-8")
urls = sorted({u for u in re.findall(r'https://[^"\s]+', src) if any(h in u for h in SITE_HOSTS)})
out = ROOT / "img" / "qr"; out.mkdir(parents=True, exist_ok=True)
table = {}
for u in urls:
    name = hashlib.sha1(u.encode()).hexdigest()[:10] + ".svg"
    qr = qrcode.QRCode(border=1, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data(u); qr.make(fit=True)
    qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(out / name)
    table[u] = "img/qr/" + name
(ROOT / "js" / "qr.js").write_text("// tools/make_qr.py가 만든 파일입니다. 직접 고치지 마세요.\nwindow.QR = " + json.dumps(table, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
print(len(table), "QR codes")
