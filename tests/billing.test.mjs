// Pruebas de las reglas y del servicio de cobro. Uso: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { Billing } from "../server/supabase/functions/_shared/billing-rules.mjs";
import { startSubscription, cancelSubscription, withdraw, handleWebhook, getAccess, updateRateFromBna, BillingError } from "../server/supabase/functions/_shared/billing-service.mjs";

const DAY = Billing.DAY_MS;
const T0 = Date.UTC(2026, 10, 1, 12);

/* ---------- reglas ---------- */
test("precios: mensual US$ 20 y anual con 10 % de descuento (US$ 216)", () => {
  assert.equal(Billing.PLANS.mensual.usdCents, 2000);
  assert.equal(Billing.PLANS.anual.usdCents, 21600);
  assert.equal(Billing.priceArs("mensual", 1234.5), 24690);
  assert.equal(Billing.priceArs("anual", 1000), 216000);
});

test("sin tipo de cambio no hay precio (falla cerrado)", () => {
  for (const r of [null, undefined, 0, -1, NaN, "1000"]) assert.throws(() => Billing.priceArs("mensual", r));
  assert.throws(() => Billing.priceArs("vitalicio", 1000));
  assert.throws(() => Billing.priceArs("__proto__", 1000));
});

test("meses calendario y períodos pagos acumulables", () => {
  assert.equal(new Date(Billing.addMonths(Date.UTC(2027, 0, 31), 1)).toISOString().slice(0, 10), "2027-02-28");
  assert.equal(new Date(Billing.addMonths(Date.UTC(2028, 0, 31), 1)).toISOString().slice(0, 10), "2028-02-29");
  assert.equal(new Date(Billing.addMonths(Date.UTC(2026, 10, 1), 12)).toISOString().slice(0, 10), "2027-11-01");
  const p1 = Billing.extendPaidThrough(null, T0, "mensual");
  const p2 = Billing.extendPaidThrough(p1, T0 + DAY, "mensual"); // pago anticipado: no se pierde el mes
  assert.equal(new Date(p2).toISOString().slice(0, 10), "2027-01-01");
});

test("acceso: prueba, suscripción, gracia, cancelación y arrepentimiento", () => {
  const trialEnd = T0 + 15 * DAY;
  const a = (now, subscription, graceDays = 3) => Billing.accessStatus({ now, trialEnd, subscription, graceDays });
  assert.deepEqual([a(T0).access, a(T0).reason], [true, "prueba"]);
  assert.deepEqual([a(trialEnd).access, a(trialEnd).reason], [false, "prueba-vencida"]);
  const paid = { status: "activa", paidThrough: trialEnd + 30 * DAY, startedAt: trialEnd };
  assert.equal(a(trialEnd + DAY, paid).reason, "suscripcion");
  assert.equal(a(paid.paidThrough + DAY, paid).reason, "gracia");
  assert.equal(a(paid.paidThrough + 4 * DAY, paid).access, false);
  assert.equal(a(paid.paidThrough + DAY, paid, 0).access, false);
  const cancelled = { ...paid, status: "cancelada" };
  assert.equal(a(trialEnd + DAY, cancelled).access, true, "lo pagado se respeta");
  assert.equal(a(paid.paidThrough + DAY, cancelled).access, false, "cancelada no tiene gracia");
  assert.equal(a(trialEnd + DAY, { ...paid, status: "arrepentimiento" }).access, false);
  assert.equal(a(trialEnd + DAY, { status: "pendiente", paidThrough: null }).access, false, "pendiente de pago no habilita");
});

test("arrepentimiento solo dentro de los 10 días", () => {
  const s = { status: "activa", startedAt: T0 };
  assert.equal(Billing.canWithdraw(s, T0 + 10 * DAY), true);
  assert.equal(Billing.canWithdraw(s, T0 + 10 * DAY + 1), false);
  assert.equal(Billing.canWithdraw({ ...s, startedAt: null }, T0), false);
});

test("validación de la suscripción leída de Mercado Pago", () => {
  const exp = { userId: "u1", planId: "anual", amountArs: 216000 };
  const ok = Billing.preapprovalBody({ ...exp, payerEmail: "a@b.c", backUrl: "https://x" });
  assert.deepEqual(Billing.validatePreapproval(ok, exp), []);
  assert.deepEqual(Billing.validatePreapproval({ ...ok, auto_recurring: { ...ok.auto_recurring, transaction_amount: 1 } }, exp), ["monto"]);
  assert.deepEqual(Billing.validatePreapproval({ ...ok, external_reference: "u2:anual" }, exp), ["referencia"]);
  assert.deepEqual(Billing.validatePreapproval({ ...ok, auto_recurring: { ...ok.auto_recurring, frequency: 1, currency_id: "USD" } }, exp), ["moneda", "frecuencia"]);
});

/* ---------- firma de avisos ---------- */
async function sign(secret, manifest) {
  const enc = new TextEncoder();
  const key = await webcrypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return Buffer.from(await webcrypto.subtle.sign("HMAC", key, enc.encode(manifest))).toString("hex");
}
async function signedHeaders(secret, dataId, now, requestId = "req-1") {
  const ts = String(Math.floor(now / 1000));
  const v1 = await sign(secret, Billing.signatureManifest({ dataId, requestId, ts }));
  return { "x-signature": `ts=${ts},v1=${v1}`, "x-request-id": requestId };
}

test("firma: válida, alterada, vieja o sin secreto", async () => {
  const h = await signedHeaders("s3cr3t", "ABC123", T0);
  const base = { secret: "s3cr3t", header: h["x-signature"], requestId: "req-1", dataId: "ABC123", now: T0, subtle: webcrypto.subtle };
  assert.equal(Billing.signatureManifest({ dataId: "ABC123", requestId: "r", ts: "1" }), "id:abc123;request-id:r;ts:1;");
  assert.equal((await Billing.verifyWebhookSignature(base)).ok, true);
  assert.equal((await Billing.verifyWebhookSignature({ ...base, dataId: "ABC124" })).ok, false);
  assert.equal((await Billing.verifyWebhookSignature({ ...base, secret: "otro" })).ok, false);
  assert.equal((await Billing.verifyWebhookSignature({ ...base, secret: "" })).ok, false);
  assert.equal((await Billing.verifyWebhookSignature({ ...base, now: T0 + 3600e3 })).ok, false);
  assert.equal((await Billing.verifyWebhookSignature({ ...base, header: "ts=1" })).ok, false);
});

/* ---------- servicio con dobles de Mercado Pago y de la base ---------- */
function fakes({ arsPerUsd = 1000, graceDays = 0, rateUpdatedAt = T0 } = {}) {
  const subs = [], payments = new Set(), events = new Set(), alerts = [], calls = [], rates = [];
  const cfg = { arsPerUsd, graceDays, rateUpdatedAt };
  const mpState = { preapprovals: {}, authorized: {} };
  const repo = {
    async getConfig() { return { ...cfg }; },
    async recordRate(r) { rates.push(r); },
    async setRate(r) { cfg.arsPerUsd = r.arsPerUsd; cfg.rateUpdatedAt = r.rateUpdatedAt; },
    async getSubscriptionByUser(u) { return subs.filter((s) => s.userId === u).at(-1) || null; },
    async getSubscriptionByPreapproval(id) { return subs.find((s) => s.mpPreapprovalId === id) || null; },
    async insertSubscription(s) { const r = { ...s, id: "sub" + subs.length }; subs.push(r); return r; },
    async updateSubscription(id, p) { Object.assign(subs.find((s) => s.id === id), p); },
    async recordWebhookEvent(e) { if (events.has(e.key)) return false; events.add(e.key); return true; },
    async recordPayment(p) { if (payments.has(p.mpPaymentId)) return false; payments.add(p.mpPaymentId); return true; },
    async flag(id, d) { alerts.push(d); }
  };
  const mp = async (method, path, body) => {
    calls.push([method, path, body]);
    if (method === "POST" && path === "/preapproval") {
      const id = "pre" + Object.keys(mpState.preapprovals).length;
      mpState.preapprovals[id] = { ...body, id, init_point: "https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_id=" + id };
      return mpState.preapprovals[id];
    }
    const [, kind, id] = path.split("/");
    if (method === "PUT") { Object.assign(mpState.preapprovals[id], body); return mpState.preapprovals[id]; }
    if (kind === "preapproval") return mpState.preapprovals[id];
    if (kind === "authorized_payments") return mpState.authorized[id];
    throw new Error("ruta no simulada " + path);
  };
  return { repo, mp, subs, alerts, calls, mpState, rates, cfg, deps: { repo, mp, appUrl: "https://beta.aprendersiendo.ar", secret: "s3cr3t" } };
}
const user = { id: "u1", email: "familia@ejemplo.test" };

test("alta: exige consentimiento, el monto lo fija el servidor, sin duplicados", async () => {
  const f = fakes();
  await assert.rejects(startSubscription({ user, planId: "mensual", consent: false, consentVersion: "v1", now: T0 }, f.deps), (e) => e.code === "consent");
  await assert.rejects(startSubscription({ user, planId: "gratis", consent: true, consentVersion: "v1", now: T0 }, f.deps), (e) => e.code === "plan");
  const r = await startSubscription({ user, planId: "anual", consent: true, consentVersion: "v1", now: T0 }, f.deps);
  assert.equal(r.amountArs, 216000);
  assert.match(r.checkoutUrl, /^https:\/\/www\.mercadopago\.com\.ar\//);
  assert.equal(f.calls[0][2].auto_recurring.frequency, 12);
  assert.equal(f.subs[0].status, "pendiente");
  // Un intento sin pagar se reemplaza, cancelando el anterior en Mercado Pago.
  const r2 = await startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 + 1 }, f.deps);
  assert.equal(r2.amountArs, 20000);
  assert.equal(f.mpState.preapprovals.pre0.status, "cancelled");
  assert.equal(f.subs[0].status, "cancelada");
  // Con una suscripción activa no se puede crear otra.
  f.subs[1].status = "activa";
  await assert.rejects(startSubscription({ user, planId: "anual", consent: true, consentVersion: "v1", now: T0 + 2 }, f.deps), (e) => e.code === "exists");
});

test("alta sin tipo de cambio configurado: no crea nada", async () => {
  const f = fakes({ arsPerUsd: null, rateUpdatedAt: null });
  await assert.rejects(startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 }, f.deps), (e) => e.code === "rate");
  const g = fakes({ rateUpdatedAt: T0 - 6 * DAY }); // cotización vieja
  await assert.rejects(startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 }, g.deps), (e) => e.code === "rate");
  assert.equal(f.calls.length + g.calls.length, 0);
});

/* ---------- cotización oficial del BNA ---------- */
const bnaHtml = (compra, venta) => `<div id="billetes"><table class="table cotizacion"><thead><tr><th>Moneda</th><th>Compra</th><th>Venta</th></tr></thead>
  <tbody><tr><td class="tit">Dolar U.S.A</td><td>${compra}</td><td>${venta}</td></tr><tr><td class="tit">Euro</td><td>1.500,00</td><td>1.600,00</td></tr></tbody></table></div>
  <div id="divisas"><table><tr><td class="tit">Dolar U.S.A</td><td>9,00</td><td>9,50</td></tr></table></div>`;

test("BNA: lee el dólar billete (compra y venta) y rechaza formatos raros", () => {
  assert.equal(Billing.parseArNumber("1.440,50"), 1440.5);
  assert.equal(Billing.parseArNumber("1440,0000"), 1440);
  assert.ok(Number.isNaN(Billing.parseArNumber("abc")));
  assert.deepEqual(Billing.parseBnaBilletes(bnaHtml("1.410,00", "1.460,00")), { compra: 1410, venta: 1460 });
  assert.throws(() => Billing.parseBnaBilletes("<html>mantenimiento</html>"));
  assert.throws(() => Billing.parseBnaBilletes(bnaHtml("1.500,00", "1.400,00")), /inválidos/);
});

test("BNA: controles de salto y antigüedad", () => {
  assert.equal(Billing.checkNewRate(1000, 1100).ok, true);
  assert.equal(Billing.checkNewRate(1000, 1200).ok, false);
  assert.equal(Billing.checkNewRate(null, 1200).ok, true, "primera carga");
  assert.equal(Billing.checkNewRate(1000, 0).ok, false);
  assert.equal(Billing.rateIsFresh(T0, T0 + 5 * DAY), true);
  assert.equal(Billing.rateIsFresh(T0, T0 + 5 * DAY + 1), false);
  assert.equal(Billing.rateIsFresh(null, T0), false);
  assert.equal(Billing.GRACE_DAYS_DEFAULT, 3);
});

test("tarea diaria: aplica la venta del BNA, o conserva el valor anterior y alerta", async () => {
  const f = fakes({ arsPerUsd: 1400, rateUpdatedAt: T0 - DAY });
  let html = bnaHtml("1.410,00", "1.460,00");
  const deps = { repo: f.repo, fetchBnaHtml: async () => html };
  assert.deepEqual(await updateRateFromBna({ now: T0 }, deps), { applied: true, arsPerUsd: 1460 });
  assert.equal(f.cfg.rateUpdatedAt, T0);
  html = bnaHtml("2.900,00", "3.000,00"); // salto > 15 %: probable error de lectura
  assert.equal((await updateRateFromBna({ now: T0 + DAY }, deps)).applied, false);
  assert.equal(f.cfg.arsPerUsd, 1460);
  html = "<html>error</html>";
  assert.equal((await updateRateFromBna({ now: T0 + 2 * DAY }, deps)).applied, false);
  assert.equal(f.alerts.length, 2);
  assert.equal(f.rates.length, 2);
});

test("aviso: firma inválida → 401 y no cambia nada", async () => {
  const f = fakes();
  await startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 }, f.deps);
  f.mpState.preapprovals.pre0.status = "authorized";
  const headers = await signedHeaders("otro-secreto", "pre0", T0);
  const r = await handleWebhook({ headers, query: { type: "subscription_preapproval", "data.id": "pre0" }, body: {}, now: T0 }, f.deps);
  assert.equal(r.status, 401);
  assert.equal(f.subs[0].status, "pendiente");
});

test("circuito completo: autorización, pago, duplicados, monto alterado, baja", async () => {
  const f = fakes();
  await startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 }, f.deps);
  const hook = async (type, id, requestId = "r-" + Math.random()) =>
    handleWebhook({ headers: await signedHeaders("s3cr3t", id, T0, requestId), query: { type, "data.id": id }, body: {}, now: T0 }, f.deps);

  // El cuerpo del aviso no importa: se relee desde la API.
  f.mpState.preapprovals.pre0.status = "authorized";
  assert.equal((await hook("subscription_preapproval", "pre0")).body.updated, "activa");
  assert.equal(f.subs[0].paidThrough, null, "autorizar no es pagar");

  f.mpState.authorized.ap1 = { id: "ap1", preapproval_id: "pre0", currency_id: "ARS", transaction_amount: 20000,
    debit_date: new Date(T0).toISOString(), payment: { id: 991, status: "approved" } };
  const r1 = await hook("subscription_authorized_payment", "ap1");
  assert.equal(new Date(r1.body.paidThrough).toISOString().slice(0, 10), "2026-12-01");
  const same = await hook("subscription_authorized_payment", "ap1", "otro-req");
  assert.equal(same.body.duplicate, "pago", "el mismo pago no suma dos meses");

  f.mpState.authorized.ap2 = { ...f.mpState.authorized.ap1, id: "ap2", transaction_amount: 1, payment: { id: 992, status: "approved" } };
  assert.equal((await hook("subscription_authorized_payment", "ap2")).body.flagged, "monto");
  assert.equal(f.alerts.length, 1);

  f.mpState.authorized.ap3 = { ...f.mpState.authorized.ap1, id: "ap3", payment: { id: 993, status: "rejected" } };
  assert.equal((await hook("subscription_authorized_payment", "ap3")).body.ignored, "no aprobado");

  const acc = await getAccess({ user, trialEnd: T0 - DAY, now: T0 + DAY }, f.deps);
  assert.equal(acc.reason, "suscripcion");

  const c = await cancelSubscription({ user, now: T0 + DAY }, f.deps);
  assert.equal(f.mpState.preapprovals.pre0.status, "cancelled");
  assert.equal(f.subs[0].status, "cancelada");
  assert.equal(c.paidThrough, f.subs[0].paidThrough);
  assert.equal((await getAccess({ user, trialEnd: T0 - DAY, now: T0 + 2 * DAY }, f.deps)).access, true);
});

test("arrepentimiento: cancela, corta el acceso y deja reembolso pendiente", async () => {
  const f = fakes();
  await startSubscription({ user, planId: "mensual", consent: true, consentVersion: "v1", now: T0 }, f.deps);
  Object.assign(f.subs[0], { status: "activa", startedAt: T0, paidThrough: T0 + 30 * DAY });
  await withdraw({ user, now: T0 + 2 * DAY }, f.deps);
  assert.equal(f.subs[0].status, "arrepentimiento");
  assert.equal(f.subs[0].refundStatus, "pendiente");
  assert.equal(f.mpState.preapprovals.pre0.status, "cancelled");
  assert.equal((await getAccess({ user, trialEnd: T0 - DAY, now: T0 + 3 * DAY }, f.deps)).access, false);
  await assert.rejects(withdraw({ user, now: T0 + 3 * DAY }, f.deps), BillingError);
});
