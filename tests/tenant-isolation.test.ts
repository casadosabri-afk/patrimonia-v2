import { describe, expect, it, beforeEach } from 'vitest';
import { DemoRepository } from '@/services/db/demoRepository';
import { resetDemoStore } from '@/services/db/demoStore';
import { AccessDeniedError, type AccessContext } from '@/services/db/access';

const horizonAdvisor: AccessContext = {
  userId: 'user-advisor-thomas',
  firmId: 'firm-horizon',
  role: 'advisor',
  clientId: null,
};

const meridienAdvisor: AccessContext = {
  userId: 'user-advisor-meridien',
  firmId: 'firm-meridien',
  role: 'advisor',
  clientId: null,
};

const clientUser: AccessContext = {
  userId: 'user-client-dupont',
  firmId: 'firm-horizon',
  role: 'client',
  clientId: 'client-dupont',
};

describe('cloisonnement des cabinets', () => {
  let repository: DemoRepository;

  beforeEach(() => {
    resetDemoStore();
    repository = new DemoRepository();
  });

  it("ne renvoie que les clients du cabinet de l'utilisateur", async () => {
    const horizon = await repository.listClients(horizonAdvisor);
    const meridien = await repository.listClients(meridienAdvisor);

    expect(horizon.length).toBeGreaterThan(0);
    expect(meridien.length).toBeGreaterThan(0);
    expect(horizon.every((client) => client.firmId === 'firm-horizon')).toBe(true);
    expect(meridien.every((client) => client.firmId === 'firm-meridien')).toBe(true);

    const horizonIds = new Set(horizon.map((client) => client.id));
    expect(meridien.some((client) => horizonIds.has(client.id))).toBe(false);
  });

  it("refuse l'accès au dossier d'un autre cabinet", async () => {
    const clients = await repository.listClients(meridienAdvisor);
    const foreign = clients[0];
    expect(foreign).toBeDefined();

    expect(await repository.getClient(horizonAdvisor, foreign!.id)).toBeNull();
    expect(await repository.getClientRecord(horizonAdvisor, foreign!.id)).toBeNull();
  });

  it("empêche l'écriture sur un dossier d'un autre cabinet", async () => {
    const clients = await repository.listClients(meridienAdvisor);
    await expect(
      repository.setClientStatus(horizonAdvisor, clients[0]!.id, 'archive'),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('limite un utilisateur client à son propre dossier', async () => {
    const clients = await repository.listClients(clientUser);
    expect(clients).toHaveLength(1);
    expect(clients[0]?.id).toBe('client-dupont');
    expect(await repository.getClient(clientUser, 'client-garnier')).toBeNull();
  });

  it("n'expose jamais les alertes internes à un client", async () => {
    expect(await repository.listAlerts(clientUser, { status: 'tous' })).toHaveLength(0);
    expect((await repository.listAlerts(horizonAdvisor, { status: 'tous' })).length).toBeGreaterThan(0);
  });

  it('ne partage avec le client que les documents marqués visibles', async () => {
    const forClient = await repository.listDocuments(clientUser);
    expect(forClient.every((document) => document.visibleToClient)).toBe(true);
    expect(forClient.every((document) => document.clientId === 'client-dupont')).toBe(true);
  });

  it("n'autorise pas un client à écrire des données patrimoniales", async () => {
    await expect(
      repository.createInteraction(clientUser, {
        clientId: 'client-dupont',
        kind: 'note',
        title: 'Tentative',
        body: '',
        dueAt: null,
      }),
    ).rejects.toBeInstanceOf(AccessDeniedError);
  });

  it('journalise les actions dans le cabinet concerné uniquement', async () => {
    const clients = await repository.listClients(horizonAdvisor);
    await repository.setClientStatus(horizonAdvisor, clients[0]!.id, 'actif');

    const horizonAudit = await repository.listAudit(horizonAdvisor);
    const meridienAudit = await repository.listAudit(meridienAdvisor);

    expect(horizonAudit.length).toBeGreaterThan(0);
    expect(meridienAudit).toHaveLength(0);
  });

  it("permet au cabinet de gérer les objectifs de ses propres clients", async () => {
    const created = await repository.createGoal(horizonAdvisor, {
      clientId: 'client-dupont',
      kind: 'voyage',
      label: 'Objectif de test',
      targetAmount: 20000,
      currentAmount: 5000,
      monthlyContribution: 200,
      targetDate: '2030-01-01',
      priority: 'basse',
      notes: null,
    });

    const record = await repository.getClientRecord(horizonAdvisor, 'client-dupont');
    expect(record?.goals.some((goal) => goal.id === created.id)).toBe(true);

    await repository.updateGoal(horizonAdvisor, created.id, {
      clientId: 'client-dupont',
      kind: 'voyage',
      label: 'Objectif modifié',
      targetAmount: 25000,
      currentAmount: 5000,
      monthlyContribution: 250,
      targetDate: '2031-01-01',
      priority: 'moyenne',
      notes: 'Mis à jour',
    });

    const updated = await repository.getClientRecord(horizonAdvisor, 'client-dupont');
    expect(updated?.goals.find((goal) => goal.id === created.id)?.label).toBe('Objectif modifié');

    await repository.deleteGoal(horizonAdvisor, created.id);
    const after = await repository.getClientRecord(horizonAdvisor, 'client-dupont');
    expect(after?.goals.some((goal) => goal.id === created.id)).toBe(false);
  });

  it("empêche un autre cabinet de modifier un objectif", async () => {
    const record = await repository.getClientRecord(horizonAdvisor, 'client-dupont');
    const goal = record?.goals[0];
    expect(goal).toBeDefined();

    await expect(repository.deleteGoal(meridienAdvisor, goal!.id)).rejects.toBeInstanceOf(
      AccessDeniedError,
    );
  });

  it("refuse de consommer un jeton QR d'un autre cabinet côté lecture", async () => {
    const clients = await repository.listClients(horizonAdvisor);
    const token = await repository.createQrToken(horizonAdvisor, clients[0]!.id, 'client_file', 15);

    const consumed = await repository.consumeQrToken(token.token);
    expect(consumed?.firmId).toBe('firm-horizon');

    // Usage unique : la seconde consommation échoue.
    expect(await repository.consumeQrToken(token.token)).toBeNull();
  });
});
