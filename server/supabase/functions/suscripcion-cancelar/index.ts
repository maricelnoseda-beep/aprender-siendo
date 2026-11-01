// POST {} → cancela la suscripción en Mercado Pago. Lo pagado se respeta hasta su fin.
import { cancelSubscription } from "../_shared/billing-service.mjs";
import { mpClient, repo } from "../_shared/deps.ts";
import { appHandler } from "../_shared/handler.ts";

Deno.serve(appHandler(({ user, now }) => cancelSubscription({ user, now }, { repo: repo(), mp: mpClient() })));
