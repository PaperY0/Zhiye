"""Build the Zhiye project document PDF from docs/submission/zhiye-project-doc.html.

Steps:
  1. Print the HTML to PDF with headless Chrome (A4, CSS @page margins).
  2. Stamp a footer (document title + page number) onto every page.

Why the footer is stamped instead of drawn by CSS: Chrome's print-to-PDF CLI has no
header/footer template support, and CSS `@page` margin boxes are not implemented.
Chrome also emits an un-restored flipped CTM (`.24 0 0 -.24 0 841.92 cm`) at the
start of every page's content stream, so the stamp has to reset the CTM first.

Usage:  python scripts/build-doc-pdf.py
"""

from __future__ import annotations

import os
import re
import shutil
import subprocess
import sys
import tempfile

from pypdf import PdfReader, PdfWriter
from pypdf.generic import DecodedStreamObject, DictionaryObject, NameObject

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC_DIR = os.path.join(ROOT, "docs", "submission")
HTML = os.path.join(DOC_DIR, "zhiye-project-doc.html")
OUT = os.path.join(DOC_DIR, "知野-课堂复盘数字员工-项目文档.pdf")
FOOTER_TEXT = "Zhiye · Classroom Recap Digital Employee"

CHROME_CANDIDATES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]


def find_browser() -> str:
    for path in CHROME_CANDIDATES:
        if os.path.exists(path):
            return path
    found = shutil.which("chrome") or shutil.which("msedge") or shutil.which("chromium")
    if not found:
        raise SystemExit("未找到 Chrome/Edge，无法打印 PDF")
    return found


def print_html(html_path: str, pdf_path: str) -> None:
    browser = find_browser()
    url = "file:///" + html_path.replace("\\", "/")
    subprocess.run(
        [
            browser,
            "--headless=new",
            "--disable-gpu",
            "--no-sandbox",
            "--no-proxy-server",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=20000",
            "--print-to-pdf=" + pdf_path,
            "--no-pdf-header-footer",
            url,
        ],
        check=True,
        capture_output=True,
        timeout=300,
    )


def ctm_inverse(orig: bytes) -> str:
    """Return a `cm` that undoes Chrome's leading flipped CTM, or '' when absent."""
    head = orig[:200].decode("latin-1", "replace")
    match = re.search(r"([-\d.]+)\s+0\s+0\s+([-\d.]+)\s+0\s+([-\d.]+)\s+cm", head)
    if not match:
        return ""
    a, d, f = (float(match.group(i)) for i in (1, 2, 3))
    if a == 0 or d == 0:
        return ""
    return f"{1 / a:.7f} 0 0 {1 / d:.7f} 0 {-f / d:.7f} cm"


def stamp_footer(src: str, dst: str) -> int:
    reader = PdfReader(src)
    writer = PdfWriter()
    writer.append(reader)
    total = len(writer.pages)

    for index, page in enumerate(writer.pages, start=1):
        label = f"{index} / {total}"
        font = DictionaryObject(
            {
                NameObject("/Type"): NameObject("/Font"),
                NameObject("/Subtype"): NameObject("/Type1"),
                NameObject("/BaseFont"): NameObject("/Helvetica"),
            }
        )
        resources = DictionaryObject(page["/Resources"])
        fonts = DictionaryObject(resources["/Font"])
        fonts[NameObject("/F1")] = font
        resources[NameObject("/Font")] = fonts
        page[NameObject("/Resources")] = writer._add_object(resources)

        original = page["/Contents"].get_data()
        reset = ctm_inverse(original)
        right_x = 564.0 - len(label) * 7.0 * 0.556
        draw = (
            f"q {reset} "
            f"BT /F1 7 Tf 0 Tr 0.45 0.5 0.46 rg 31.5 15 Td ({FOOTER_TEXT}) Tj ET "
            f"BT /F1 7 Tf 0 Tr 0.30 0.40 0.33 rg {right_x:.2f} 15 Td ({label}) Tj ET Q\n"
        ).encode("latin-1")

        combined = DecodedStreamObject()
        combined.set_data(original + b"\n" + draw)
        page[NameObject("/Contents")] = writer._add_object(combined)

    with open(dst, "wb") as handle:
        writer.write(handle)
    return total


def main() -> int:
    if not os.path.exists(HTML):
        raise SystemExit(f"缺少 HTML 源文件：{HTML}")
    with tempfile.TemporaryDirectory() as tmp:
        base = os.path.join(tmp, "base.pdf")
        print("1/2 打印 HTML → PDF …")
        print_html(HTML, base)
        print("2/2 添加页脚与页码 …")
        pages = stamp_footer(base, OUT)
    print(f"完成：{OUT}（{pages} 页，{os.path.getsize(OUT) / 1024 / 1024:.2f} MB）")
    if pages > 20:
        print("警告：页数超过 20 页上限", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
