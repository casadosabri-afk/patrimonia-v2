import { createHmac, timingSafeEqual } from 'node:crypto';

const DEV_SECRET = 'patrimonia-demo-secret-change-me-in-production';

function secret(): string {
  return process.env.AUTH_SECRET ?? DEV_SECRET;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/**
 * Jeton de session signé.
 *
 * Le jeton ne contient qu'un identifiant d'utilisateur et une date d'émission :
 * ni le rôle ni le cabinet n'y figurent. Ces informations sont relues côté
 * serveur à chaque requête, de sorte qu'un jeton falsifié ou périmé ne puisse
 * jamais accorder de privilèges.
 */
export function createSessionToken(userId: string, issuedAt = Date.now()): string {
  const payload = `${userId}.${issuedAt}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

export interface SessionTokenPayload {
  userId: string;
  issuedAt: number;
}

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function verifySessionToken(token: string | undefined): SessionTokenPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  const expected = sign(payload);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== providedBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, providedBuffer)) return null;

  const [userId, issuedAtRaw] = payload.split('.');
  const issuedAt = Number(issuedAtRaw);
  if (!userId || !Number.isFinite(issuedAt)) return null;
  if (Date.now() - issuedAt > SESSION_MAX_AGE_SECONDS * 1000) return null;

  return { userId, issuedAt };
}
