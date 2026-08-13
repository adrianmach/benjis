// Checkout + MercadoPago integration.
//
// - checkoutApiRouter: POST /checkout, POST /mercadopago/webhook (mounted under /api)
// - checkoutRedirectRouter: GET /checkout/success|pending|failure (mounted at root,
//   these are the literal back_urls MercadoPago redirects the buyer to)

import { Router } from 'express';
import { getDb } from '../db.js';
import { createPreference, getPayment, validateWebhookSignature, isConfigured } from '../lib/mercadopago.js';

const checkoutApiRouter = Router();
const checkoutRedirectRouter = Router();

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

checkoutApiRouter.post('/checkout', async (req, res) => {
  const { name, email, phone, address, items } = req.body || {};
  if (!name || !String(name).trim() || !email || !String(email).trim() || !address || !String(address).trim()) {
    return res.status(400).json({ error: 'Faltan datos del pedido (nombre, email o dirección).' });
  }
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  const db = getDb();
  const lineItems = [];
  let total = 0;
  for (const raw of items) {
    const productId = Number(raw.productId);
    const qty = Math.max(1, Math.min(99, Math.round(Number(raw.qty)) || 1));
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
    if (!product) return res.status(400).json({ error: `Producto ${productId} no encontrado.` });
    if (product.status !== 'published') return res.status(400).json({ error: `"${product.name}" no está disponible para compra.` });
    if (product.price == null) return res.status(400).json({ error: `"${product.name}" todavía no tiene precio configurado.` });
    const unitPrice = product.price;
    total += unitPrice * qty;
    lineItems.push({ productId, name: product.name, size: raw.size || null, qty, unitPrice });
  }

  if (!isConfigured()) {
    return res.status(500).json({ error: 'MercadoPago no está configurado en el servidor (falta MERCADOPAGO_ACCESS_TOKEN).' });
  }

  const createdAt = new Date().toISOString();
  const insert = db.prepare(`INSERT INTO orders (name, email, phone, address, items, total, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?)`);
  const info = insert.run(String(name).trim(), String(email).trim(), phone ? String(phone).trim() : '', String(address).trim(), JSON.stringify(lineItems), total, createdAt);
  const orderId = info.lastInsertRowid;

  const base = publicBaseUrl(req);
  try {
    const pref = await createPreference({
      items: lineItems.map(li => ({
        id: String(li.productId),
        title: li.name + (li.size ? ` (talle ${li.size})` : ''),
        quantity: li.qty,
        unit_price: li.unitPrice,
        currency_id: 'UYU'
      })),
      payer: { name: String(name).trim(), email: String(email).trim() },
      external_reference: String(orderId),
      back_urls: {
        success: `${base}/checkout/success`,
        pending: `${base}/checkout/pending`,
        failure: `${base}/checkout/failure`
      },
      auto_return: 'approved',
      notification_url: `${base}/api/mercadopago/webhook`
    });
    db.prepare('UPDATE orders SET mp_preference_id = ? WHERE id = ?').run(pref.id, orderId);
    res.json({ init_point: pref.init_point, orderId });
  } catch (err) {
    console.error('[checkout] MercadoPago createPreference failed:', err?.message || err);
    res.status(502).json({ error: 'No se pudo iniciar el pago con MercadoPago. Probá de nuevo en unos minutos.' });
  }
});

checkoutApiRouter.post('/mercadopago/webhook', async (req, res) => {
  try {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const dataId = req.query['data.id'] || req.body?.data?.id;
    if (secret) {
      try {
        validateWebhookSignature({
          xSignature: req.headers['x-signature'],
          xRequestId: req.headers['x-request-id'],
          dataId,
          secret
        });
      } catch (sigErr) {
        console.warn('[webhook] Firma inválida:', sigErr.message);
        return res.sendStatus(401);
      }
    }
    const type = req.query.type || req.body?.type;
    if (type !== 'payment' || !dataId) return res.sendStatus(200);

    const payment = await getPayment(dataId);
    const orderId = Number(payment.external_reference);
    if (!orderId) return res.sendStatus(200);

    const status = payment.status === 'approved' ? 'aprobado' : payment.status === 'rejected' ? 'rechazado' : 'pendiente';
    const db = getDb();
    db.prepare('UPDATE orders SET status = ?, mp_payment_id = ? WHERE id = ?').run(status, String(payment.id), orderId);
    res.sendStatus(200);
  } catch (err) {
    console.error('[webhook] Error procesando notificación:', err?.message || err);
    res.sendStatus(200); // ack de todos modos para que MP no reintente en loop; queda logueado
  }
});

for (const result of ['success', 'pending', 'failure']) {
  checkoutRedirectRouter.get(`/checkout/${result}`, (req, res) => {
    const ref = req.query.external_reference ? `&ref=${encodeURIComponent(req.query.external_reference)}` : '';
    res.redirect(`/?order=${result}${ref}`);
  });
}

export { checkoutApiRouter, checkoutRedirectRouter };
