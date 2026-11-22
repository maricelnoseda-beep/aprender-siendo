#!/usr/bin/env python3
"""Lista de ítems nuevos y cambiados del banco de «Los cuatro exploradores» (para PSP-SR, RT-CEX-001-R v1.1 Parte F.4).
Uso: python3 scripts/exploradores_cambios.py > docs/herramientas/RT-CEX-001_cambios_banco_v0.3.0.md"""
import json, pathlib
D = pathlib.Path(__file__).resolve().parent.parent / "app" / "herramientas" / "exploradores"
B = json.loads((D / "banco.json").read_text())
NOM = {"objetos": "1 · Objetos", "sombras": "2 · Sombras", "niebla": "3 · Niebla", "jardin": "4 · Jardín", "laberinto": "5 · Laberinto", "fabrica": "6 · Fábrica",
       "cofre_cuales": "7A · Cofre, ¿cuáles?", "cofre_orden": "7B · Cofre, orden", "pistas_relampago": "8A · Pistas relámpago", "pistas_nuevas": "8B · Pistas nuevas"}
G = {"facil": "Fácil", "intermedio": "Intermedio", "dificil": "Difícil"}
todos = [(v, g, it) for v, gs in B["variantes"].items() for g, its in gs.items() for it in its]
nuevos = [x for x in todos if x[2].get("cambio_v030") == "nuevo (D.1)"]
cambiados = [x for x in todos if x[2].get("cambio_v030") and x[2]["cambio_v030"] != "nuevo (D.1)"]
sin = [x for x in todos if not x[2].get("cambio_v030")]
print("# Banco v0.3.0 de «Los cuatro exploradores»: ítems nuevos y cambiados\n")
print(f"Generado desde banco.json. Total: **{len(todos)} ítems**. Sin cambios respecto de v0.2.0: **{len(sin)}**. Cambiados: **{len(cambiados)}**. Nuevos: **{len(nuevos)}**.\n")
print("«Validado» = PSP-SR ya lo validó o el cambio es su texto literal. «A revisar» = DEV-IA armó el contenido y PSP-SR todavía no lo vio (B.2.1).\n")
print("## 1. Ítems cambiados\n\n| Ítem | Juego y grado | Estado | Qué cambió | Consigna |\n| --- | --- | --- | --- | --- |")
for v, g, it in cambiados:
    est = "Validado" if it["estado_clinico"] == "validado por PSP-SR" else "A revisar"
    print(f"| {it['id']} | {NOM[v]} · {G[g]} | {est} | {it['cambio_v030']} | {it['consigna']} |")
print("\n## 2. Ítems nuevos (todos a revisar)\n\n| Ítem | Juego y grado | Rutas | Consigna | Detalle |\n| --- | --- | --- | --- | --- |")
for v, g, it in nuevos:
    det = []
    if it.get("letra_forma"): det.append(f"letra {it['letra_forma']}, rasgo {it['rasgo']}")
    elif it.get("rasgo"): det.append(f"rasgo {it['rasgo']}")
    if it.get("cantidad") and v in ("jardin",): det.append(f"{it['cantidad']} objetivos en {len(it['elementos'])} elementos")
    if it.get("tipo"): det.append(f"tipo {it['tipo']}")
    rutas = ", ".join(it.get("rutas") or ["3-5", "6-8", "9-12"])
    print(f"| {it['id']} | {NOM[v]} · {G[g]} | {rutas} | {it['consigna']} | {'; '.join(det)} |")
