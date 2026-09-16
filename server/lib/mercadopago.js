// Thin wrapper around the official MercadoPago SDK. Keeps the access-token
// lookup and client construction in one place so routes just call plain
// functions instead of touching the SDK's class-based API directly.

import { MercadoPagoConfig, Preference, Payment, WebhookSignatureValidator } from 'mercadopago';

function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado');
  return new MercadoPagoConfig({ accessToken });
}

export function isConfigured() {
  return !!process.env.MERCADOPAGO_ACCESS_TOKEN;
}

export async function createPreference(body) {
  const preference = new Preference(getClient());
  return preference.create({ body });
}

export async function getPayment(id) {
  const payment = new Payment(getClient());
  return payment.get({ id });
}

// Throws InvalidWebhookSignatureError if the signature doesn't check out.
export function validateWebhookSignature(opts) {
  WebhookSignatureValidator.validate(opts);
}
