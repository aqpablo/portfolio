"""
Genera dist/portfolio.html: una versión del sitio en UN solo archivo
(estilos, código, contenido e imágenes incrustados). Sirve para mandarla
por mail o abrirla con doble clic sin servidor.

Uso:  python tools/build-single.py
"""
import base64, json, mimetypes, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
site = json.loads((ROOT / 'content/site.json').read_text(encoding='utf-8'))

def inline(src):
    p = ROOT / src
    if src.startswith('data:') or not p.exists():
        return src
    mime = mimetypes.guess_type(p.name)[0] or 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(p.read_bytes()).decode()

for case in site.get('cases', []):
    for block in case.get('detail', {}).get('blocks', []):
        for fig in block.get('figures', []) or []:
            for img in fig.get('images', []):
                img['src'] = inline(img['src'])

html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'css/styles.css').read_text(encoding='utf-8')
js = (ROOT / 'js/app.js').read_text(encoding='utf-8')
data = json.dumps(site, ensure_ascii=False).replace('</', '<\\/')

html = html.replace('<link rel="stylesheet" href="css/styles.css">', f'<style>\n{css}</style>')
html = html.replace('<script src="js/app.js"></script>', f'<script>window.__SITE__={data};</script>\n<script>\n{js}</script>')
out = ROOT / 'dist/portfolio.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'Listo: {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)')
