#!/usr/bin/env python3
"""Sección 0 de FEC-013 (bloqueante): búsqueda de nombres de la obra original en todo el repositorio.

Recorre todos los archivos de texto versionados (git ls-files), normaliza el texto (minúsculas, sin tildes)
y compara cada palabra y cada par de palabras seguidas contra huellas SHA-256 guardadas en
scripts/originalidad_huellas.json. Así el propio control no escribe los nombres que busca.

Sale con código 1 si encuentra alguno (bloquea CI) e informa archivo y línea, nunca el término.
Uso: python3 scripts/originalidad.py [archivos o carpetas extra a revisar]
"""
import hashlib, json, pathlib, re, subprocess, sys, unicodedata

raiz = pathlib.Path(__file__).resolve().parent.parent
cfg = json.loads((raiz / "scripts" / "originalidad_huellas.json").read_text())
HUELLAS, PREFIJO = set(cfg["huellas"]), cfg["prefijo"]
PALABRA = re.compile(r"[a-zñ0-9]+")
BINARIOS = {".png", ".webp", ".jpg", ".jpeg", ".gif", ".ttf", ".woff2", ".pdf", ".zip", ".docx", ".ico"}

def normalizar(t):
    t = t.lower().replace("ñ", "\u0001")
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) != "Mn")
    return t.replace("\u0001", "ñ")

def huella(t):
    return hashlib.sha256((PREFIJO + t).encode()).hexdigest()

def revisar(ruta):
    hallazgos = []
    try:
        texto = ruta.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return hallazgos
    for n, linea in enumerate(texto.splitlines(), 1):
        ps = PALABRA.findall(normalizar(linea))
        candidatos = ps + [a + b for a, b in zip(ps, ps[1:])]
        if any(huella(c) in HUELLAS for c in candidatos):
            hallazgos.append((str(ruta.relative_to(raiz)) if ruta.is_relative_to(raiz) else str(ruta), n))
    return hallazgos

def archivos():
    out = subprocess.run(["git", "ls-files", "-z"], cwd=raiz, capture_output=True, check=True).stdout.decode().split("\0")
    extra = []
    for a in sys.argv[1:]:
        p = pathlib.Path(a).resolve()
        extra += [q for q in p.rglob("*") if q.is_file()] if p.is_dir() else [p]
    return [raiz / f for f in out if f] + extra

total, hallazgos = 0, []
for f in archivos():
    if f.suffix.lower() in BINARIOS or not f.exists():
        continue
    total += 1
    hallazgos += revisar(f)
if hallazgos:
    print("FALLA sección 0 (FEC-013): aparecen nombres de la obra original en:")
    for a, n in hallazgos:
        print(f"  {a}:{n}")
    sys.exit(1)
print(f"ok sección 0: {total} archivos revisados, cero apariciones de nombres de la obra original")
