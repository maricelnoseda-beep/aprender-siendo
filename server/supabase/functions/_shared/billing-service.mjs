/* ==========================================================================
   billing-service.mjs — Lógica del servidor para cobros con Mercado Pago

   No depende de Supabase ni de Deno: recibe por parámetro el acceso a la base
   (repo) y a la API de Mercado Pago (mp). Así se prueba en Node con dobles de
   prueba (tests/billing.test.mjs) y se conecta en index.ts de cada función.

   Principios (DEV-IA §4, §6, §9):
   - El portal nunca ve ni guarda datos de tarjeta: el pago ocurre en la
     página de Mercado Pago (certificada PCI DSS).
   - El monto y el plan los fija el servidor. El navegador solo elige "mensual"
     o "anual".
   - Un aviso de Mercado Pago no se cree por su contenido: se verifica la firma
     y después se vuelve a leer el recurso desde la API con nuestra credencial.
   - Cada aviso y cada pago se procesan una sola vez (idempotencia).
   ========================================================================== */
import { Billing } from "./billing-rules.mjs";

export class BillingError extends Error {
  constructor(code, message, status = 400) { super(message); this.code = code; this.status = status; }
}

const OPEN = ["pendiente", "activa", "pausada"];

/** Alta: crea la suscripción en Mercado Pago y devuelve el enlace de pago. */
export async function startSubscription({ user, planId, consent, consentVersion, now }, { repo, mp, appUrl }) {
  if (!user || !user.id || !user.email) throw new BillingError("auth", "Sesión requerida", 401);
  if (!Object.prototype.hasOwnProperty.call(Billing.PLANS, planId)) throw new BillingError("plan", "Plan inexistente");
  // Ningún cobro sin consentimiento expreso (PSP-SR §8).
  if (consent !== true || !consentVersion) throw new BillingError("consent", "Falta la confirmación expresa del cobro");
  const current = await repo.getSubscriptionByUser(user.id);
  if (current && ["activa", "pausada"].includes(current.status)) {
    throw new BillingError("exists", "Ya tenés una suscripción en curso", 409);
  }
  const cfg = await repo.getConfig();
  const amountArs = Billing.priceArs(planId, cfg.arsPerUsd); // falla cerrado si no hay tipo de cambio
  // Un intento anterior que quedó sin pagar se cancela antes de crear otro,
  // para que nunca haya dos suscripciones que puedan cobrar.
  if (current && current.status === "pendiente") {
    await mp("PUT", `/preapproval/${encodeURIComponent(current.mpPreapprovalId)}`, { status: "cancelled" }, `reemplazo-${current.id}`);
    await repo.updateSubscription(current.id, { status: "cancelada", cancelledAt: now });
  }
  const body = Billing.preapprovalBody({ userId: user.id, planId, payerEmail: user.email, amountArs, backUrl: `${appUrl}/#suscripcion` });
  const pre = await mp("POST", "/preapproval", body, `alta-${user.id}-${planId}-${now}`);
  const errors = Billing.validatePreapproval(pre, { userId: user.id, planId, amountArs });
  if (errors.length || !pre.id || !pre.init_point) throw new BillingError("mp", "Respuesta inesperada del medio de pago", 502);
  const sub = await repo.insertSubscription({
    userId: user.id, planId, amountArs, usdCents: Billing.getPlan(planId).usdCents, arsPerUsd: cfg.arsPerUsd,
    status: "pendiente", mpPreapprovalId: pre.id, consentAt: now, consentVersion, rulesVersion: Billing.RULES_VERSION,
    startedAt: null, paidThrough: null
  });
  return { subscriptionId: sub.id, checkoutUrl: pre.init_point, amountArs, planId };
}

/** Baja de la suscripción: no se cobra más; el período ya pago se respeta. */
export async function cancelSubscription({ user, now }, { repo, mp }) {
  const sub = await repo.getSubscriptionByUser(user.id);
  if (!sub || !OPEN.includes(sub.status)) throw new BillingError("none", "No hay una suscripción para cancelar", 404);
  await mp("PUT", `/preapproval/${encodeURIComponent(sub.mpPreapprovalId)}`, { status: "cancelled" }, `baja-${sub.id}`);
  await repo.updateSubscription(sub.id, { status: "cancelada", cancelledAt: now });
  return { paidThrough: sub.paidThrough };
}

/**
 * Arrepentimiento (Ley 24.240 art. 34, Res. SCI 424/2020): dentro de los 10 días
 * de contratar. Cancela, corta el acceso y deja el reembolso pendiente para que
 * la administración lo ejecute en Mercado Pago (acción con dinero: control humano).
 */
export async function withdraw({ user, now }, { repo, mp }) {
  const sub = await repo.getSubscriptionByUser(user.id);
  if (!Billing.canWithdraw(sub, now)) throw new BillingError("plazo", "Fuera del plazo de arrepentimiento o sin suscripción", 409);
  if (OPEN.includes(sub.status)) {
    await mp("PUT", `/preapproval/${encodeURIComponent(sub.mpPreapprovalId)}`, { status: "cancelled" }, `arrep-${sub.id}`);
  }
  await repo.updateSubscription(sub.id, { status: "arrepentimiento", cancelledAt: now, refundStatus: "pendiente" });
  return { refund: "pendiente" };
}

/** Estado de acceso de una cuenta (lo consulta la app y lo replica la base). */
export async function getAccess({ user, trialEnd, now }, { repo }) {
  const [sub, cfg] = await Promise.all([repo.getSubscriptionByUser(user.id), repo.getConfig()]);
  return { ...Billing.accessStatus({ now, trialEnd, subscription: sub, graceDays: cfg.graceDays }), subscription: sub && publicView(sub) };
}

function publicView(s) {
  return { planId: s.planId, status: s.status, amountArs: s.amountArs, paidThrough: s.paidThrough, startedAt: s.startedAt };
}

/**
 * Aviso de Mercado Pago. Devuelve { status, body } para responder.
 * 401 si la firma no es válida; 200 en lo demás (incluso si se ignora),
 * para que Mercado Pago no reintente avisos que ya procesamos.
 */
export async function handleWebhook({ headers, query, body, now }, { repo, mp, secret }) {
  const type = query.type || query.topic || body?.type;
  const dataId = String(query["data.id"] || body?.data?.id || "");
  const requestId = headers["x-request-id"] || "";
  const sig = await Billing.verifyWebhookSignature({ secret, header: headers["x-signature"], requestId, dataId, now });
  if (!sig.ok) return { status: 401, body: { error: "firma" } };
  if (!dataId || !type) return { status: 200, body: { ignored: "incompleto" } };
  const first = await repo.recordWebhookEvent({ key: `${type}:${dataId}:${requestId}`, type, dataId, receivedAt: now });
  if (!first) return { status: 200, body: { duplicate: true } };

  if (type === "subscription_preapproval") {
    const pre = await mp("GET", `/preapproval/${encodeURIComponent(dataId)}`);
    const sub = await repo.getSubscriptionByPreapproval(pre.id);
    if (!sub) return { status: 200, body: { ignored: "desconocida" } };
    const errors = Billing.validatePreapproval(pre, { userId: sub.userId, planId: sub.planId, amountArs: sub.amountArs });
    if (errors.length) { await repo.flag(sub.id, "preapproval no coincide: " + errors.join(",")); return { status: 200, body: { flagged: errors } }; }
    const status = Billing.mapPreapprovalStatus(pre.status);
    if (sub.status === "arrepentimiento" || status === "desconocido") return { status: 200, body: { ignored: "estado" } };
    const patch = { status };
    if (status === "activa" && !sub.startedAt) patch.startedAt = now;
    if (status === "cancelada" && !sub.cancelledAt) patch.cancelledAt = now;
    await repo.updateSubscription(sub.id, patch);
    return { status: 200, body: { updated: status } };
  }

  if (type === "subscription_authorized_payment") {
    const ap = await mp("GET", `/authorized_payments/${encodeURIComponent(dataId)}`);
    const sub = await repo.getSubscriptionByPreapproval(ap.preapproval_id);
    if (!sub) return { status: 200, body: { ignored: "desconocida" } };
    const approved = ap.payment && ap.payment.status === "approved";
    if (!approved) return { status: 200, body: { ignored: "no aprobado" } };
    if (ap.currency_id !== Billing.CURRENCY || Number(ap.transaction_amount) !== sub.amountArs) {
      await repo.flag(sub.id, `pago ${ap.id} con monto o moneda distintos`);
      return { status: 200, body: { flagged: "monto" } };
    }
    if (sub.status === "arrepentimiento") return { status: 200, body: { ignored: "arrepentimiento" } };
    const paidAt = Date.parse(ap.debit_date || ap.date_created) || now;
    const isNew = await repo.recordPayment({ mpPaymentId: String(ap.payment.id), subscriptionId: sub.id, amountArs: sub.amountArs, paidAt });
    if (!isNew) return { status: 200, body: { duplicate: "pago" } };
    const paidThrough = Billing.extendPaidThrough(sub.paidThrough, paidAt, sub.planId);
    await repo.updateSubscription(sub.id, { paidThrough, startedAt: sub.startedAt || paidAt });
    return { status: 200, body: { paidThrough } };
  }

  return { status: 200, body: { ignored: type } };
}
