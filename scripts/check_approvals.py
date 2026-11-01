#!/usr/bin/env python3
"""Bloqueo técnico del pase a producción (DEV-IA §8).

Uso: check_approvals.py <versión> <archivo_artefacto>
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
