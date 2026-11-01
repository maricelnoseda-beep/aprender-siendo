// Avisos de Mercado Pago. Se despliega SIN verificación de JWT (Mercado Pago no
// tiene sesión): la autenticidad se comprueba con la firma x-signature y el
// secreto MP_WEBHOOK_SECRET, y el estado se relee siempre desde la API.
import { handleWebhook } from "../_shared/billing-service.mjs";
import { json, mpClient, repo } from "../_shared/deps.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "metodo" });
  try {
    const url = new URL(req.url);
    const r = await handleWebhook({
      headers: { "x-signature": req.headers.get("x-signature") ?? "", "x-request-id": req.headers.get("x-request-id") ?? "" },
      query: Object.fromEntries(url.searchParams),
      body: await req.json().catch(() => ({})),
      now: Date.now(),
    }, { repo: repo(), mp: mpClient(), secret: Deno.env.get("MP_WEBHOOK_SECRET") ?? "" });
    return json(r.status, r.body);
  } catch (e) {
    console.error("webhook", (e as Error).message);
    return json(500, { error: "interno" }); // Mercado Pago reintenta
  }
});
