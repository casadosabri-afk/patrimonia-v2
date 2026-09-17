import { describe, expect, it } from 'vitest';
import {
  canAdministerFirm,
  canReadClient,
  canWriteClientData,
  type AccessContext,
} from '@/services/db/access';

const admin: AccessContext = { userId: 'a', firmId: 'firm-1', role: 'admin', clientId: null };
const advisor: AccessContext = { userId: 'b', firmId: 'firm-1', role: 'advisor', clientId: null };
const client: AccessContext = { userId: 'c', firmId: 'firm-1', role: 'client', clientId: 'client-1' };

describe('matrice de permissions', () => {
  it("réserve l'administration du cabinet au rôle administrateur", () => {
    expect(canAdministerFirm(admin)).toBe(true);
    expect(canAdministerFirm(advisor)).toBe(false);
    expect(canAdministerFirm(client)).toBe(false);
  });

  it("réserve l'écriture des données patrimoniales au cabinet", () => {
    expect(canWriteClientData(admin)).toBe(true);
    expect(canWriteClientData(advisor)).toBe(true);
    expect(canWriteClientData(client)).toBe(false);
  });

  it('limite un client à son propre dossier', () => {
    expect(canReadClient(client, 'client-1')).toBe(true);
    expect(canReadClient(client, 'client-2')).toBe(false);
  });

  it('autorise le personnel du cabinet sur tous les dossiers du cabinet', () => {
    expect(canReadClient(advisor, 'client-2')).toBe(true);
    expect(canReadClient(admin, 'client-2')).toBe(true);
  });
});
