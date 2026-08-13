// Session-based auth for the /admin panel. Single admin user, credentials
// from .env -- there's no user table, this isn't a multi-tenant system.

import session from 'express-session';
import { Router } from 'express';

export function sessionMiddleware() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET no configurado en .env (necesario para las sesiones del admin).');
  }
  return session({
    name: 'benjis.sid',
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 12 // 12h
    }
  });
}

export function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  res.status(401).json({ error: 'No autenticado.' });
}

const authRouter = Router();

authRouter.post('/admin/login', (req, res) => {
  const { user, password } = req.body || {};
  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  if (!expectedUser || !expectedPass) {
    return res.status(500).json({ error: 'Admin no configurado en el servidor (falta ADMIN_USER/ADMIN_PASS).' });
  }
  if (user !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
  req.session.isAdmin = true;
  res.json({ ok: true });
});

authRouter.post('/admin/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

authRouter.get('/admin/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

export default authRouter;
