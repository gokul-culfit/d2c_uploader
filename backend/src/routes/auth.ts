import type { Router, Request, Response } from 'express';
import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import * as jose from 'jose';

const ALLOWED_EMAIL_DOMAINS = ['@curefit.com', '@cultsport.com'];

function isAllowedEmail(email: string): boolean {
  const lower = email.trim().toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => lower.endsWith(d));
}

export type AuthUser = { email: string };

export function createAuthRouter(): Router {
  const router = express.Router();
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const jwtSecret = process.env.JWT_SECRET || 'd2c-uploader-secret-change-in-prod';

  if (!clientId) {
    // eslint-disable-next-line no-console
    console.warn('GOOGLE_CLIENT_ID not set; login will fail');
  }

  router.post('/api/auth/login', async (req: Request, res: Response) => {
    const { idToken } = req.body as { idToken?: string };

    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing idToken' });
    }

    if (!clientId) {
      return res.status(503).json({ success: false, error: 'Auth not configured' });
    }

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      const email = payload?.email;

      if (!email) {
        return res.status(400).json({ success: false, error: 'Email not in token' });
      }

      if (!isAllowedEmail(email)) {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Only @curefit.com and @cultsport.com emails are allowed.',
        });
      }

      const secret = new TextEncoder().encode(jwtSecret);
      const token = await new jose.SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .setIssuedAt()
        .sign(secret);

      return res.json({ success: true, token, email });
    } catch (err: unknown) {
      // eslint-disable-next-line no-console
      console.error('Auth login error', err);
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
  });

  return router;
}

export async function verifyJwt(token: string): Promise<AuthUser | null> {
  const jwtSecret = process.env.JWT_SECRET || 'd2c-uploader-secret-change-in-prod';
  const secret = new TextEncoder().encode(jwtSecret);
  try {
    const { payload } = await jose.jwtVerify(token, secret);
    const email = payload.email as string;
    if (!email || !isAllowedEmail(email)) return null;
    return { email };
  } catch {
    return null;
  }
}
