// Tarea diaria: lee la cotización oficial del dólar (BNA, billete vendedor) y la
// aplica si pasa los controles. La llama solo pg_cron con el secreto CRON_SECRET.
import { Billing } from "../_shared/billing-rules.mjs";
import { updateRateFromBna } from "../_shared/billing-service.mjs";
import { json, repo } from "../_shared/deps.ts";

const BNA_URL = "https://www.bna.com.ar/Personas";

Deno.serve(async (req) => {
  const secret = Deno.env.get("CRON_SECRET") ?? "";
  if (req.method !== "POST" || !secret || !Billing.safeEqual(req.headers.get("x-cron-secret") ?? "", secret)) {
    return json(401, { error: "no autorizado" });
  }
  try {
    const r = await updateRateFromBna({ now: Date.now() }, {
      repo: repo(),
      fetchBnaHtml: async () => {
        const res = await fetch(BNA_URL, { headers: { "User-Agent": "AprenderSiendo-cotizacion/1.0" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.text();
      },
    });
    return json(200, r);
  } catch (e) {
    console.error("cotizacion", (e as Error).message);
    return json(500, { error: "interno" });
  }
});
