// Checkout + integración con MercadoPago.
//
// - checkoutApiRouter: POST /checkout, POST /mercadopago/webhook (montado bajo /api)
// - checkoutRedirectRouter: GET /checkout/success|pending|failure (montado en la raíz,
//   son los back_urls literales a los que MercadoPago redirige al comprador)

import { Router } from 'express';
import { supabase } from '../supabase.js';
import { createPreference, getPayment, validateWebhookSignature, isConfigured } from '../lib/mercadopago.js';

const checkoutApiRouter = Router();
const checkoutRedirectRouter = Router();

function publicBaseUrl(req) {
  return process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

checkoutApiRouter.post('/checkout', async (req, res) => {
  try {
    const { name, email, phone, address, items } = req.body || {};
    if (!name || !String(name).trim() || !email || !String(email).trim() || !address || !String(address).trim()) {
      return res.status(400).json({ error: 'Faltan datos del pedido (nombre, email o dirección).' });
    }
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    const lineItems = [];
    let total = 0;
    for (const raw of items) {
      const productId = Number(raw.productId);
      const qty = Math.max(1, Math.min(99, Math.round(Number(raw.qty)) || 1));
      const { data: product, error } = await supabase.from('benjis_products').select('*').eq('id', productId).maybeSingle();
      if (error) throw error;
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

    const { data: order, error: insertErr } = await supabase.from('benjis_orders').insert({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : '',
      address: String(address).trim(),
      items: lineItems,
      total,
      status: 'pendiente'
    }).select().single();
    if (insertErr) throw insertErr;
    const orderId = order.id;

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
      await supabase.from('benjis_orders').update({ mp_preference_id: pref.id }).eq('id', orderId);
      res.json({ init_point: pref.init_point, orderId: Number(orderId) });
    } catch (err) {
      console.error('[checkout] MercadoPago createPreference failed:', err?.message || err);
      res.status(502).json({ error: 'No se pudo iniciar el pago con MercadoPago. Probá de nuevo en unos minutos.' });
    }
  } catch (err) {
    console.error('[checkout] Error:', err?.message || err);
    res.status(500).json({ error: 'Error inesperado procesando el pedido.' });
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
    await supabase.from('benjis_orders').update({ status, mp_payment_id: String(payment.id) }).eq('id', orderId);
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
