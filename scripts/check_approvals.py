#!/usr/bin/env python3
"""Bloqueo técnico del pase a producción (DEV-IA §8).

Uso: check_approvals.py <versión> <archivo_artefacto>
El artefacto es app/dist/manifiesto.json (versión modular, ADR-009): antes de comparar
su huella se verifica que cada archivo publicado coincida con la huella que figura en él,
así ningún archivo cambia sin cambiar la huella aprobada.
Exige en approvals/<versión>.md dos registros APROBACIÓN (Supervisora clínica y
Responsable técnico) con DECISIÓN: Aprobado, la misma VERSIÓN y la HUELLA SHA-256
exacta del artefacto que se va a desplegar. Si falta algo, sale con error.
"""
import hashlib, pathlib, re, sys

def main():
    if len(sys.argv) != 3:
        sys.exit("Uso: check_approvals.py <versión> <archivo_artefacto>")
    version, artifact = sys.argv[1], pathlib.Path(sys.argv[2])
    digest = hashlib.sha256(artifact.read_bytes()).hexdigest()
    if artifact.name == "manifiesto.json":
        import json
        man = json.loads(artifact.read_text(encoding="utf-8"))
        for mod in man["modulos"]:
            for rel, h in mod["archivos"].items():
                f = artifact.parent / rel
                if not f.exists() or hashlib.sha256(f.read_bytes()).hexdigest() != h:
                    sys.exit(f"BLOQUEADO: {rel} no coincide con el manifiesto.")
        listed = {rel for mod in man["modulos"] for rel in mod["archivos"]}
        extra = [str(f.relative_to(artifact.parent)) for f in artifact.parent.rglob("*") if f.is_file() and f.name != "manifiesto.json" and str(f.relative_to(artifact.parent)) not in listed]
        if extra:
            sys.exit(f"BLOQUEADO: archivos fuera del manifiesto: {', '.join(extra[:5])}")
    rec = pathlib.Path(__file__).resolve().parent.parent / "approvals" / f"{version}.md"
    if not rec.exists():
        sys.exit(f"BLOQUEADO: no existe {rec.name}. Sin registro de aprobación no hay pase a producción.")
    blocks = [b for b in re.split(r"(?m)^APROBACIÓN\s*$", rec.read_text(encoding="utf-8")) if "QUIÉN:" in b]
    def field(b, k):
        m = re.search(rf"(?m)^{k}:\s*(.+)$", b)
        return m.group(1).strip() if m else ""
    ok = {}
    for b in blocks:
        who = field(b, "QUIÉN")
        if field(b, "VERSIÓN") == version and field(b, "DECISIÓN").startswith("Aprobado") and field(b, "HUELLA") == digest:
            ok[who] = True
    missing = [r for r in ("Supervisora clínica", "Responsable técnico") if not ok.get(r)]
    if missing:
        sys.exit(f"BLOQUEADO: falta aprobación válida de {', '.join(missing)} para {version} (huella {digest}).")
    print(f"Aprobaciones verificadas para {version} (huella {digest}).")

if __name__ == "__main__":
    main()
