/* ==========================================================================
   billing-rules.mjs — Reglas de cobro de Aprender Siendo (FUENTE ÚNICA)

   Lo usan: las funciones del servidor (Supabase Edge Functions, Deno), las
   pruebas (Node) y la beta de demostración (app/build.py lo incrusta).
   Precios, acceso y verificación de pagos se deciden acá, en código.
   Nunca los decide un modelo de lenguaje (DEV-IA §4).

   Condiciones comerciales decididas por la responsable del proyecto
   (2026-11-01): suscripción mensual de US$ 20 y anual con 10 % de descuento.
   Cambiar estos valores es una decisión comercial: no se tocan sin su
   confirmación escrita.
   ========================================================================== */

const RULES_VERSION = "1.0.0";
const DAY_MS = 86400000;

// Montos en centavos de dólar para evitar errores de redondeo.
const MONTHLY_USD_CENTS = 2000;
const ANNUAL_DISCOUNT_PCT = 10;

const PLANS = Object.freeze({
  mensual: Object.freeze({ id: "mensual", label: "Mensual", months: 1, usdCents: MONTHLY_USD_CENTS }),
  anual: Object.freeze({
    id: "anual", label: "Anual", months: 12,
    usdCents: (MONTHLY_USD_CENTS * 12 * (100 - ANNUAL_DISCOUNT_PCT)) / 100
  })
});

// Mercado Pago en Argentina cobra en pesos: el precio en dólares se convierte
// con el tipo de cambio que fija la responsable (no se toma de internet).
const CURRENCY = "ARS";

function getPlan(planId) {
  if (!Object.prototype.hasOwnProperty.call(PLANS, planId)) throw new Error("Plan inexistente: " + planId);
  return PLANS[planId];
}

function assertRate(arsPerUsd) {
  if (typeof arsPerUsd !== "number" || !Number.isFinite(arsPerUsd) || arsPerUsd <= 0) {
    throw new Error("Tipo de cambio no configurado o inválido");
  }
}

/** Precio en pesos enteros (redondeo al peso). */
function priceArs(planId, arsPerUsd) {
  assertRate(arsPerUsd);
  return Math.round((getPlan(planId).usdCents * arsPerUsd) / 100);
}

/** Suma meses calendario en UTC (31/01 + 1 mes = 28 o 29/02). */
function addMonths(ms, months) {
  const d = new Date(ms);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime();
}

/** Nuevo "pagado hasta" tras un cobro aprobado. Nunca acorta un período ya pago. */
function extendPaidThrough(currentPaidThrough, paymentAt, planId) {
  const base = Math.max(currentPaidThrough || 0, paymentAt);
  return addMonths(base, getPlan(planId).months);
}

/* ---------- Estados ---------- */
// Estados de una suscripción de Mercado Pago (preapproval) → estados propios.
const MP_STATUS = Object.freeze({ pending: "pendiente", authorized: "activa", paused: "pausada", cancelled: "cancelada" });

function mapPreapprovalStatus(mpStatus) {
  return MP_STATUS[mpStatus] || "desconocido";
}

/**
 * Decide si una cuenta tiene acceso. Única regla de acceso del sistema.
 * - Durante la prueba gratuita: acceso.
 * - Con un período pago vigente: acceso, aunque haya cancelado (se respeta lo pagado).
 * - Suscripción activa con el cobro en reintento: acceso durante los días de gracia.
 * - Arrepentimiento (Ley 24.240 art. 34): sin acceso desde que se ejerce.
 */
function accessStatus({ now, trialEnd, subscription, graceDays = 0 }) {
  if (typeof now !== "number") throw new Error("Falta la fecha actual");
  if (trialEnd && now < trialEnd) return { access: true, reason: "prueba", until: trialEnd };
  const s = subscription;
  if (s && s.status !== "arrepentimiento" && s.paidThrough) {
    if (now < s.paidThrough) return { access: true, reason: "suscripcion", until: s.paidThrough };
    const graceEnd = s.paidThrough + Math.max(0, graceDays) * DAY_MS;
    if (s.status === "activa" && now < graceEnd) return { access: true, reason: "gracia", until: graceEnd };
  }
  return { access: false, reason: trialEnd && !s ? "prueba-vencida" : "sin-pago-vigente", until: null };
}

/** Plazo de arrepentimiento: 10 días corridos desde la contratación (Ley 24.240 art. 34). */
const WITHDRAWAL_DAYS = 10;
function canWithdraw(subscription, now) {
  return !!(subscription && subscription.startedAt && subscription.status !== "arrepentimiento" &&
    now - subscription.startedAt <= WITHDRAWAL_DAYS * DAY_MS);
}

/* ---------- Verificación de lo que informa Mercado Pago ---------- */
function externalReference(userId, planId) { return `${userId}:${planId}`; }

/**
 * Compara una suscripción leída de la API de Mercado Pago con lo que el
 * servidor espera. Devuelve la lista de diferencias (vacía = válida).
 * Así un monto, plan o usuario alterado nunca habilita acceso.
 */
function validatePreapproval(pre, { userId, planId, amountArs }) {
  const errors = [];
  const plan = getPlan(planId);
  const ar = pre && pre.auto_recurring;
  if (!pre) return ["sin datos"];
  if (pre.external_reference !== externalReference(userId, planId)) errors.push("referencia");
  if (!ar) return errors.concat("sin auto_recurring");
  if (ar.currency_id !== CURRENCY) errors.push("moneda");
  if (Number(ar.transaction_amount) !== amountArs) errors.push("monto");
  if (ar.frequency_type !== "months" || Number(ar.frequency) !== plan.months) errors.push("frecuencia");
  return errors;
}

/** Cuerpo para crear la suscripción en Mercado Pago. El monto sale del servidor, nunca del navegador. */
function preapprovalBody({ userId, planId, payerEmail, amountArs, backUrl }) {
  const plan = getPlan(planId);
  return {
    reason: `Aprender Siendo — plan ${plan.label.toLowerCase()}`,
    external_reference: externalReference(userId, planId),
    payer_email: payerEmail,
    back_url: backUrl,
    status: "pending",
    auto_recurring: { frequency: plan.months, frequency_type: "months", transaction_amount: amountArs, currency_id: CURRENCY }
  };
}

/* ---------- Firma de los avisos (webhooks) de Mercado Pago ---------- */
function parseSignatureHeader(header) {
  const out = {};
  String(header || "").split(",").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  });
  return { ts: out.ts || "", v1: out.v1 || "" };
}

/** Plantilla firmada por Mercado Pago: id:<data.id>;request-id:<x-request-id>;ts:<ts>; (se omiten las partes ausentes). */
function signatureManifest({ dataId, requestId, ts }) {
  let m = "";
  if (dataId) m += `id:${/^[a-z0-9]+$/i.test(dataId) ? String(dataId).toLowerCase() : dataId};`;
  if (requestId) m += `request-id:${requestId};`;
  if (ts) m += `ts:${ts};`;
  return m;
}

function hex(buf) { return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Verifica la firma HMAC-SHA256 de un aviso. Rechaza si falta el secreto,
 * si la firma no coincide o si el aviso es más viejo que la tolerancia.
 */
async function verifyWebhookSignature({ secret, header, requestId, dataId, now, toleranceSec = 600, subtle = globalThis.crypto.subtle }) {
  if (!secret) return { ok: false, why: "sin secreto configurado" };
  const { ts, v1 } = parseSignatureHeader(header);
  if (!ts || !v1) return { ok: false, why: "encabezado incompleto" };
  const tsMs = Number(ts) > 1e12 ? Number(ts) : Number(ts) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(now - tsMs) > toleranceSec * 1000) return { ok: false, why: "fuera de tiempo" };
  const enc = new TextEncoder();
  const key = await subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = hex(await subtle.sign("HMAC", key, enc.encode(signatureManifest({ dataId, requestId, ts }))));
  return safeEqual(sig, v1.toLowerCase()) ? { ok: true } : { ok: false, why: "firma inválida" };
}

export const Billing = Object.freeze({
  RULES_VERSION, DAY_MS, PLANS, ANNUAL_DISCOUNT_PCT, CURRENCY, WITHDRAWAL_DAYS,
  getPlan, priceArs, addMonths, extendPaidThrough, mapPreapprovalStatus, accessStatus, canWithdraw,
  externalReference, validatePreapproval, preapprovalBody,
  parseSignatureHeader, signatureManifest, verifyWebhookSignature, safeEqual
});
