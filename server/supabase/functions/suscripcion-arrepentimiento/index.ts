// POST {} → botón de arrepentimiento (10 días). Cancela y deja el reembolso pendiente para la administración.
import { withdraw } from "../_shared/billing-service.mjs";
import { mpClient, repo } from "../_shared/deps.ts";
import { appHandler } from "../_shared/handler.ts";

Deno.serve(appHandler(({ user, now }) => withdraw({ user, now }, { repo: repo(), mp: mpClient() })));
