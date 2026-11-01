// GET → { access, reason, until, subscription }. La fecha de fin de prueba sale del
// perfil del usuario en la base (nunca del navegador).
import { getAccess } from "../_shared/billing-service.mjs";
import { admin, repo } from "../_shared/deps.ts";
import { appHandler } from "../_shared/handler.ts";

Deno.serve(appHandler(async ({ user, now }) => {
  const { data } = await admin().from("trials").select("trial_end").eq("user_id", user.id).maybeSingle();
  const trialEnd = data?.trial_end ? Date.parse(data.trial_end) : null;
  return getAccess({ user, trialEnd, now }, { repo: repo() });
}));
