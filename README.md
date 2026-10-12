# 황미란 Hwang Miran — Portfolio

미술·디자인 교육자이자 디자이너, 연구자 황미란의 포트폴리오 사이트입니다.

- 공개 주소: <https://miran-artcode.github.io/PORTFOLIO/>
- 정적 사이트(HTML·CSS·JS)라 빌드 과정이 없습니다.
- 내용은 `js/data.js`(한국어)와 `js/data.en.js`(영어)에 있습니다. 배치는 `js/main.js`, 디자인은 `css/style.css`.
- 이미지(`img/`)는 학생 얼굴·이름이 드러나지 않는 것만 씁니다.

## 직접 고치기: 편집 화면

<https://miran-artcode.github.io/PORTFOLIO/edit.html>

1. 처음 한 번만 오른쪽 위 **GitHub 연결**에 토큰을 넣습니다. 만드는 법은 그 화면에 나옵니다.
   - 저장소는 `PORTFOLIO` 하나만 고르고, 권한은 Contents: Read and write로 합니다.
2. 이력·강의·연구 같은 칸을 고칩니다.
   - 줄 추가, 삭제, 위아래 이동, 찾기가 됩니다.
   - 고친 내용은 그 컴퓨터에 자동으로 임시 보관됩니다.
3. **미리보기**를 누르면 저장하기 전 수정본을 실제 사이트 모양(`index.html?draft=1`)으로 봅니다.
4. **저장하기**(Ctrl+S)를 누르면 GitHub에 바로 기록되고, 약 1분 뒤 공개 사이트에 반영됩니다. 반영이 끝나면 화면이 알려 줍니다.
   - 새 사이트 주소를 넣으면 QR 코드도 자동으로 만들어집니다.

편집 화면 코드는 `edit.html`, `js/edit.js`, `js/serialize.js`(파일을 읽고 쓰는 규칙)입니다.

## 컴퓨터에서 직접 파일을 고칠 때 (Claude 작업 포함)

- 편집 화면에서 저장한 내용이 GitHub에 먼저 올라가 있을 수 있으니, 고치기 전에 반드시 `git pull`부터 합니다.
- 다 고친 뒤 `node tools/format_data.js`를 돌리면 편집 화면과 같은 모양으로 정리됩니다.
- 링크를 바꿨다면 `python tools/make_qr.py`로 QR 코드를 다시 만듭니다.

기준일: 2026.10.12.
