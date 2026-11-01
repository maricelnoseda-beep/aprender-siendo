// POST { plan: "mensual" | "anual", consentimiento: true, version_texto } → { checkoutUrl }
// El navegador redirige a checkoutUrl (página de Mercado Pago). Nunca recibe datos de tarjeta.
import { startSubscription } from "../_shared/billing-service.mjs";
import { mpClient, repo } from "../_shared/deps.ts";
import { appHandler } from "../_shared/handler.ts";

Deno.serve(appHandler(({ user, body, now }) =>
  startSubscription(
    { user, planId: String(body.plan ?? ""), consent: body.consentimiento === true, consentVersion: String(body.version_texto ?? ""), now },
    { repo: repo(), mp: mpClient(), appUrl: Deno.env.get("APP_URL") ?? "" },
  )
));
