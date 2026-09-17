import { describe, expect, it, beforeEach } from 'vitest';
import { createSessionToken, verifySessionToken, SESSION_MAX_AGE_SECONDS } from '@/lib/auth/token';

describe('jeton de session', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'secret-de-test-suffisamment-long';
  });

  it('accepte un jeton fraîchement émis', () => {
    const token = createSessionToken('user-advisor-thomas');
    expect(verifySessionToken(token)?.userId).toBe('user-advisor-thomas');
  });

  it('refuse un jeton dont la signature a été altérée', () => {
    const token = createSessionToken('user-advisor-thomas');
    const [payload] = token.split('.');
    expect(verifySessionToken(`${payload}.signature-fabriquee`)).toBeNull();
  });

  it("refuse un jeton dont l'identifiant utilisateur a été remplacé", () => {
    const token = createSessionToken('user-client-dupont');
    const [, signature] = token.split('.');
    const forged = Buffer.from(`user-admin-horizon.${Date.now()}`).toString('base64url');
    expect(verifySessionToken(`${forged}.${signature}`)).toBeNull();
  });

  it('refuse un jeton expiré', () => {
    const issuedAt = Date.now() - (SESSION_MAX_AGE_SECONDS + 60) * 1000;
    expect(verifySessionToken(createSessionToken('user-advisor-thomas', issuedAt))).toBeNull();
  });

  it('refuse une valeur vide ou malformée', () => {
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken('')).toBeNull();
    expect(verifySessionToken('pas-un-jeton')).toBeNull();
  });
});
