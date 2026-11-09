#!/usr/bin/env python3
"""Arma el portal Aprender Siendo (ADR-009: núcleo común + áreas + herramientas).

  python3 app/build.py               → app/dist/            versión modular (la que se publica)
  python3 app/build.py --un-archivo  → app/dist-un-archivo/ un solo HTML con todo incrustado
                                       (demostración sin servidor y paquete de revisión de PSP-SR)
  python3 app/build.py --explorapalabras → app/dist-explorapalabras/Explorapalabras.html
                                       (el juego solo, para probar con doble clic)

Las imágenes, la fuente y los recursos se escriben en las fuentes como @@asset:<ruta>@@.
La versión modular los sirve como archivos (se descargan solo cuando aparecen en pantalla);
la de un archivo los incrusta. La interfaz es la misma en las dos.
"""
import base64, hashlib, json, pathlib, re, shutil, sys

root = pathlib.Path(__file__).parent
cfg = json.loads((root / "modulos.json").read_text())
UN_ARCHIVO = "--un-archivo" in sys.argv
# Recursos que una herramienta pide recién al abrirse (documentos de marcos aislados y sus datos).
RECURSOS = ["herramientas/isla-de-juegos/isla.html",
            "herramientas/explorapalabras/explorapalabras.html",
            "herramientas/explorapalabras/banco.json",
            "herramientas/explorapalabras/modulo.json"]
MIME = {".webp": "image/webp", ".png": "image/png", ".ttf": "font/ttf", ".woff2": "font/woff2"}
TOKEN = re.compile(r"@@asset:([^@]+)@@")
read = lambda rel: (root / rel).read_text()
sha = lambda b: hashlib.sha256(b).hexdigest()

HEAD = """<title>Aprender Siendo Beta</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Aprender Siendo: versión beta de demostración con datos ficticios.">
<meta name="robots" content="noindex, nofollow">
"""
def page(head, body):
    return ('<!doctype html>\n<html lang="es-AR">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + "</head>\n<body>\n" + body + "</body>\n</html>\n")

def catalogo(resolver):
    cat = json.loads(read(cfg["catalogo_animales"]))
    for g in cat:
        for a in g["animals"]:
            a["faces"] = [resolver(f) for f in a["faces"]]
    return json.dumps(cat, ensure_ascii=False, separators=(",", ":"))

if "--explorapalabras" in sys.argv:
    # El juego solo, en un archivo: identidad (Nunito y símbolo) incrustada, banco y parámetros adentro.
    datauri = lambda rel: "data:%s;base64,%s" % (MIME[pathlib.Path(rel).suffix], base64.b64encode((root / rel).read_bytes()).decode())
    js = lambda t: t.replace("<", "\\u003c")
    html = read("herramientas/explorapalabras/explorapalabras.html")
    html = html.replace("__BRAND_FONT__", TOKEN.sub(lambda m: datauri(m.group(1)), read("nucleo/estilos/identidad.css")), 1)
    html = (html.replace("__BANCO__", js(json.dumps(json.loads(read("herramientas/explorapalabras/banco.json")), ensure_ascii=False)), 1)
                .replace("__MODULO__", js(json.dumps(json.loads(read("herramientas/explorapalabras/modulo.json")), ensure_ascii=False)), 1)
                .replace("__INICIO__", "{}", 1))
    out = root / "dist-explorapalabras"; out.mkdir(exist_ok=True)
    (out / "Explorapalabras.html").write_text(html)
    print("ok explorapalabras", (out / "Explorapalabras.html").stat().st_size, "bytes")
    sys.exit()

if UN_ARCHIVO:
    datauri = lambda rel: "data:%s;base64,%s" % (MIME[pathlib.Path(rel).suffix], base64.b64encode((root / rel).read_bytes()).decode())
    inline = lambda t: TOKEN.sub(lambda m: datauri(m.group(1)), t)
    styles = "".join('<style%s>%s</style>\n' % (f' id="{s["id"]}"' if s.get("id") else "", inline(read(s["archivo"]))) for s in cfg["estilos"])
    incrustados = {r: read(r) for r in RECURSOS}
    js = "\n".join(inline(read(f)) for f in cfg["scripts"])
    body = ('<div id="app" aria-live="off"></div>\n'
            '<script id="animal-catalog" type="application/json">' + catalogo(datauri) + "</script>\n"
            "<script>\n\"use strict\";\nwindow.RECURSOS_INCRUSTADOS = " + json.dumps(incrustados).replace("<", "\\u003c") + ";\n" + js + "\n</script>\n")
    out = root / "dist-un-archivo"; out.mkdir(exist_ok=True)
    (out / "index.html").write_text(page(HEAD + styles, body))
    (out / "artifact.html").write_text(HEAD + styles + body)
    print("ok un archivo", (out / "index.html").stat().st_size, "bytes")
    sys.exit()

# ---------------- versión modular ----------------
dist = root / "dist"
if dist.exists(): shutil.rmtree(dist)
dist.mkdir()
copiados = {}  # ruta publicada → sha256

def publicar(rel, data=None):
    data = (root / rel).read_bytes() if data is None else data
    (dist / rel).parent.mkdir(parents=True, exist_ok=True)
    (dist / rel).write_bytes(data)
    copiados[rel] = sha(data)
    return rel + "?v=" + copiados[rel][:10]

def asset(rel):
    if rel == "nucleo/fuentes/Nunito.ttf": rel = "nucleo/fuentes/Nunito.woff2"   # misma fuente, empaque comprimido
    return copiados.get(rel) and rel + "?v=" + copiados[rel][:10] or publicar(rel)

def relativo(desde, rel):  # ruta de un recurso vista desde un CSS
    up = len(pathlib.PurePosixPath(desde).parent.parts)
    return "../" * up + rel

head = HEAD
for s in cfg["estilos"]:
    css = read(s["archivo"]).replace('format("truetype")', 'format("woff2")')
    css = TOKEN.sub(lambda m: relativo(s["archivo"], asset(m.group(1))), css)
    ref = publicar(s["archivo"], css.encode())
    head += '<link rel="stylesheet"%s href="%s">\n' % (' id="brand-css"' if s.get("id") == "brand-font" else "", ref)
for r in RECURSOS: publicar(r)
scripts = ""
for f in cfg["scripts"]:
    ref = publicar(f, TOKEN.sub(lambda m: asset(m.group(1)), read(f)).encode())
    scripts += '<script defer src="%s"></script>\n' % ref
for extra in ["nucleo/fuentes/OFL.txt"]: publicar(extra)
body = ('<div id="app" aria-live="off"></div>\n'
        '<script id="animal-catalog" type="application/json">' + catalogo(asset) + "</script>\n" + scripts)
(dist / "index.html").write_text(page(head, body))
copiados["index.html"] = sha((dist / "index.html").read_bytes())

# Manifiesto: huella de cada archivo y de cada módulo (base de la aprobación por módulo).
def modulo_de(rel):
    p = rel.split("/")
    return "/".join(p[:2]) if p[0] in ("areas", "herramientas") else p[0] if p[0] in ("nucleo", "contenido") else "portal"
mods = {}
for rel in sorted(copiados): mods.setdefault(modulo_de(rel), {})[rel] = copiados[rel]
man = {"version": cfg["version"], "modulos": []}
for m, files in sorted(mods.items()):
    meta_p = root / m / "modulo.json"
    meta = json.loads(meta_p.read_text()) if meta_p.exists() else {"id": m}
    man["modulos"].append({**meta, "ruta": m, "huella": sha("".join(f"{k}:{v}\n" for k, v in files.items()).encode()), "archivos": files})
(dist / "manifiesto.json").write_text(json.dumps(man, ensure_ascii=False, indent=1) + "\n")
total = sum((dist / r).stat().st_size for r in copiados)
print("ok modular", len(copiados), "archivos,", total, "bytes; huella del manifiesto", sha((dist / "manifiesto.json").read_bytes())[:16])
