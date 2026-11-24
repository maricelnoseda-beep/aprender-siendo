#!/usr/bin/env python3
"""Arma app/herramientas/chef/chef.html: estilos comunes de las aventuras (los de «Los cuatro exploradores», identidad del index 1)
más el cuerpo propio de «Chef en Acción» (scripts/chef_cuerpo.html). Se corre después de cambiar el cuerpo."""
import pathlib
raiz = pathlib.Path(__file__).resolve().parent.parent
ex = (raiz / "app/herramientas/exploradores/exploradores.html").read_text().split("\n")
ini = next(i for i, l in enumerate(ex) if l.startswith("<style>")) + 1
fin = next(i for i, l in enumerate(ex) if l.startswith("@media (prefers-reduced-motion"))
cab = (raiz / "scripts/chef_cabecera.html").read_text()
cuerpo = (raiz / "scripts/chef_cuerpo.html").read_text()
(raiz / "app/herramientas/chef/chef.html").write_text(cab + "\n".join(ex[ini:fin + 1]) + "\n" + cuerpo)
print("ok chef.html armado")
