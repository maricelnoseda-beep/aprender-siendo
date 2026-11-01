# Puesta en marcha del entorno de prueba (beta.aprendersiendo.ar)

Pasos que hace la responsable del proyecto. **Ningún token ni contraseña se le pasa a DEV-IA ni se escribe en mensajes:** se cargan directo en GitHub.

## 1. Dar acceso de Claude al repositorio
Instalar la app de Claude en GitHub para el repositorio `aprender-siendo`: https://github.com/apps/claude/installations/select_target → elegir la cuenta → "Only select repositories" → `aprender-siendo` → Install.

## 2. Token de Cloudflare (solo para publicar el entorno de prueba)
1. Cloudflare → ícono de perfil → **My Profile** → **API Tokens** → **Create Token**.
2. Plantilla **"Edit Cloudflare Workers"** o token personalizado con el permiso **Account → Cloudflare Pages → Edit**, limitado a tu cuenta.
3. Copiar el token (se ve una sola vez).
4. Copiar también el **Account ID**: Cloudflare → Workers & Pages → panel derecho "Account ID".

## 3. Cargarlos en GitHub
Repositorio → **Settings** → **Secrets and variables** → **Actions**:
- Pestaña **Secrets** → New repository secret → nombre `CLOUDFLARE_API_TOKEN`, valor: el token.
- Pestaña **Variables** → New repository variable → nombre `CLOUDFLARE_ACCOUNT_ID`, valor: el Account ID.

## 4. Entornos con control humano
Repositorio → **Settings** → **Environments**:
- `staging`: sin requisitos.
- `production`: activar **Required reviewers** (la supervisora y, cuando exista, el responsable técnico).

## 5. Dominio
Cuando el primer despliegue funcione: Cloudflare → Workers & Pages → `aprender-siendo-beta` → **Custom domains** → `beta.aprendersiendo.ar`. Requiere que el dominio aprendersiendo.ar use los servidores DNS de Cloudflare (lo indica Cloudflare al agregar el sitio).

Con esto, cada cambio aprobado en `main` publica la demostración en el entorno de prueba. Producción sigue bloqueada hasta las dos aprobaciones registradas.
