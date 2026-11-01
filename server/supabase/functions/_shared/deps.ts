// deps.ts — Conecta billing-service con Supabase y con la API de Mercado Pago.
// Secretos: se leen del gestor de secretos de Supabase (`supabase secrets set`),
// nunca del código. En el entorno de prueba van credenciales de PRUEBA de
// Mercado Pago; las de producción las carga solo el responsable técnico.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.45.4";

const env = (k: string) => {
  const v = Deno.env.get(k);
  if (!v) throw new Error(`Falta el secreto ${k}`);
  return v;
};

export function admin(): SupabaseClient {
  return createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false },
    db: { schema: "billing" },
  });
}

/** Usuario autenticado a partir del token de la sesión (nunca de un parámetro). */
export async function currentUser(req: Request) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data, error } = await admin().auth.getUser(jwt);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? "" };
}

export function mpClient() {
  const token = env("MP_ACCESS_TOKEN");
  return async (method: string, path: string, body?: unknown, idempotencyKey?: string) => {
    const res = await fetch(`https://api.mercadopago.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`Mercado Pago ${method} ${path.split("/")[1]}: ${res.status}`);
    return await res.json();
  };
}

const toRow = (s: Record<string, unknown>) => {
  const map: Record<string, string> = {
    userId: "user_id", planId: "plan_id", amountArs: "amount_ars", usdCents: "usd_cents", arsPerUsd: "ars_per_usd",
    mpPreapprovalId: "mp_preapproval_id", consentAt: "consent_at", consentVersion: "consent_version",
    rulesVersion: "rules_version", startedAt: "started_at", paidThrough: "paid_through", cancelledAt: "cancelled_at",
    refundStatus: "refund_status", status: "status",
  };
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(s)) {
    if (!map[k]) continue;
    out[map[k]] = ["consentAt", "startedAt", "paidThrough", "cancelledAt"].includes(k) && v != null
      ? new Date(v as number).toISOString() : v;
  }
  return out;
};
const ms = (v: string | null) => (v ? Date.parse(v) : null);
// deno-lint-ignore no-explicit-any
const fromRow = (r: any) => r && ({
  id: r.id, userId: r.user_id, planId: r.plan_id, amountArs: Number(r.amount_ars), status: r.status,
  mpPreapprovalId: r.mp_preapproval_id, startedAt: ms(r.started_at), paidThrough: ms(r.paid_through),
  cancelledAt: ms(r.cancelled_at), refundStatus: r.refund_status,
});

export function repo() {
  const db = admin();
  const one = async (q: PromiseLike<{ data: unknown; error: unknown }>) => {
    const { data, error } = await q;
    if (error) throw error;
    return fromRow(data);
  };
  return {
    async getConfig() {
      const { data, error } = await db.from("config").select("ars_per_usd, grace_days").eq("id", 1).single();
      if (error) throw error;
      return { arsPerUsd: Number(data.ars_per_usd), graceDays: Number(data.grace_days) };
    },
    getSubscriptionByUser: (userId: string) =>
      one(db.from("subscriptions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle()),
    getSubscriptionByPreapproval: (id: string) =>
      one(db.from("subscriptions").select("*").eq("mp_preapproval_id", id).maybeSingle()),
    insertSubscription: (s: Record<string, unknown>) => one(db.from("subscriptions").insert(toRow(s)).select().single()),
    async updateSubscription(id: string, patch: Record<string, unknown>) {
      const { error } = await db.from("subscriptions").update(toRow(patch)).eq("id", id);
      if (error) throw error;
    },
    async recordWebhookEvent(e: { key: string; type: string; dataId: string; receivedAt: number }) {
      const { error } = await db.from("webhook_events").insert({ key: e.key, type: e.type, data_id: e.dataId });
      if (error && error.code === "23505") return false; // ya procesado
      if (error) throw error;
      return true;
    },
    async recordPayment(p: { mpPaymentId: string; subscriptionId: string; amountArs: number; paidAt: number }) {
      const { error } = await db.from("payments").insert({
        mp_payment_id: p.mpPaymentId, subscription_id: p.subscriptionId, amount_ars: p.amountArs, paid_at: new Date(p.paidAt).toISOString(),
      });
      if (error && error.code === "23505") return false;
      if (error) throw error;
      return true;
    },
    async flag(subscriptionId: string, detail: string) {
      await db.from("alerts").insert({ subscription_id: subscriptionId, detail });
    },
  };
}

export const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const cors = (origin: string) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
});
