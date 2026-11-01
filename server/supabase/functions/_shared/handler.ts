// handler.ts — Envoltorio común de las funciones de la app: CORS limitado al
// dominio de la app, sesión obligatoria y errores sin detalles internos.
import { BillingError } from "./billing-service.mjs";
import { cors, currentUser, json } from "./deps.ts";

type Ctx = { user: { id: string; email: string }; body: Record<string, unknown>; now: number };

export function appHandler(fn: (ctx: Ctx) => Promise<unknown>) {
  const origin = Deno.env.get("APP_URL") ?? "";
  return async (req: Request) => {
    const h = cors(origin);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    try {
      const user = await currentUser(req);
      if (!user) return withHeaders(json(401, { error: "sesion" }), h);
      const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
      return withHeaders(json(200, await fn({ user, body, now: Date.now() })), h);
    } catch (e) {
      if (e instanceof BillingError) return withHeaders(json(e.status, { error: e.code, message: e.message }), h);
      console.error("billing", (e as Error).message); // sin datos personales
      return withHeaders(json(500, { error: "interno" }), h);
    }
  };
}
function withHeaders(r: Response, h: Record<string, string>) {
  Object.entries(h).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}
