#!/usr/bin/env python3
"""Draco Store build step.
Reads  src/  (index.html, css/, js/)  and writes  dist/  with ONE minified CSS file and ONE minified JS file.
Usage:  python3 build.py        (optional:  pip install rjsmin rcssmin   for stronger minifying)
Note: minifying makes the code harder to read, but a browser must still be able to run it, so it can never be truly hidden.
Real protection is the database security rules (row-level security). Never put a secret key in any file."""
import hashlib, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).parent
SRC, DIST = ROOT / "src", ROOT / "dist"

def light_js(code):   # safe fallback: drop full-line comments and indentation only
    out = []
    for line in code.splitlines():
        t = line.strip()
        if not t or t.startswith("//") or (t.startswith("/*") and t.endswith("*/")): continue
        out.append(t if not t.startswith("*") else t)
    return "\n".join(out) + "\n"

def light_css(code):
    code = re.sub(r"/\*.*?\*/", "", code, flags=re.S)
    return re.sub(r"\s+", " ", code).strip() + "\n"

def node_ok(code):
    try:
        p = pathlib.Path("/tmp/_draco_check.js"); p.write_text(code)
        return subprocess.run(["node", "--check", str(p)], capture_output=True).returncode == 0
    except FileNotFoundError:
        return True   # node not installed: cannot verify, trust the minifier

order = [n for n in (SRC / "js" / "ORDER.txt").read_text().split() if n]
js = "\n".join((SRC / "js" / n).read_text() for n in order)
css = (SRC / "css" / "styles.css").read_text()

try:
    import rjsmin, rcssmin
    min_js, min_css = rjsmin.jsmin(js), rcssmin.cssmin(css)
    if not node_ok(min_js):
        print("Strong minifier produced invalid code; using the safe method instead.")
        min_js, min_css = light_js(js), light_css(css)
    else:
        print("Minified with rjsmin/rcssmin.")
except ImportError:
    min_js, min_css = light_js(js), light_css(css)
    print("rjsmin/rcssmin not installed; used the safe light method.")

if not node_ok(min_js): sys.exit("Build stopped: the JavaScript has an error.")

if DIST.exists(): shutil.rmtree(DIST)
DIST.mkdir()
vjs, vcss = hashlib.sha256(min_js.encode()).hexdigest()[:10], hashlib.sha256(min_css.encode()).hexdigest()[:10]
(DIST / "app.min.js").write_text(min_js); (DIST / "styles.min.css").write_text(min_css)
html = (SRC / "index.html").read_text()
html = re.sub(r'<link rel="stylesheet" href="css/styles.css">', f'<link rel="stylesheet" href="styles.min.css?v={vcss}">', html)
html = re.sub(r'(<script src="js/[^"]+" defer></script>\n)+', f'<script src="app.min.js?v={vjs}" defer></script>\n', html)
(DIST / "index.html").write_text(html)
print(f"Built dist/: index.html, styles.min.css ({len(min_css)} bytes), app.min.js ({len(min_js)} bytes). Upload the dist folder to your host.")
