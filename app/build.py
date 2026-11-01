#!/usr/bin/env python3
"""Arma la beta en un solo archivo HTML (sin dependencias externas salvo Google Fonts)."""
import pathlib, re
root = pathlib.Path(__file__).parent
src = root / "src"
css = (src / "styles.css").read_text()

# Reglas de cobro: fuente única compartida con el servidor. Se incrustan como
# objeto global Billing (sin "export") para que la beta use exactamente las mismas.
rules = (root.parent / "server/supabase/functions/_shared/billing-rules.mjs").read_text()
rules, n = re.subn(r"(?m)^export const Billing = ", "return ", rules)
assert n == 1, "billing-rules.mjs debe terminar con 'export const Billing = ...'"
billing = "const Billing = (() => {\n" + rules + "\n})();\n"

js = billing + "\n".join((src / f).read_text() for f in ["content.js", "store.js", "followup.js", "illustrations.js", "avatars.js", "activities.js", "app.js"])
head = """<title>Aprender Siendo Beta</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Aprender Siendo: versión beta de demostración con datos ficticios.">
<meta name="robots" content="noindex, nofollow">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&family=Manrope:wght@600;700;800&display=swap">
<style>
""" + css + "\n</style>"
body = '<div id="app" aria-live="off"></div>\n<script>\n"use strict";\n' + js + "\n</script>"
dist = root / "dist"; dist.mkdir(exist_ok=True)
(dist / "artifact.html").write_text(head + "\n" + body + "\n")
(dist / "index.html").write_text('<!doctype html>\n<html lang="es-AR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
    + head + "\n</head>\n<body>\n" + body + "\n</body>\n</html>\n")
print("ok", (dist / "index.html").stat().st_size, "bytes")
