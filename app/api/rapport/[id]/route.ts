import { NextResponse } from 'next/server';
import { getSessionUser, toAccessContext } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getClientOverview } from '@/services/portfolio';
import { projectGoal } from '@/lib/patrimony/goals';
import { buildClientReport } from '@/services/report/pdf';
import { fullName } from '@/lib/utils/format';

/** Génère le rapport patrimonial PDF d'un client, brandé aux couleurs du cabinet. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user || user.role === 'client') {
    return NextResponse.json({ error: 'Accès refusé.' }, { status: 403 });
  }

  const { id } = await params;
  const access = toAccessContext(user);
  const repository = getRepository();

  const [overview, firm, users] = await Promise.all([
    getClientOverview(access, id),
    repository.getFirm(access),
    repository.listUsers(access),
  ]);

  if (!overview || !firm) {
    return NextResponse.json({ error: 'Client introuvable.' }, { status: 404 });
  }

  const primaryLink = overview.record.client.advisors.find((link) => link.primary);
  const advisor = primaryLink ? users.find((item) => item.id === primaryLink.advisorId) : undefined;

  const actionPlan = overview.insights
    .slice(0, 5)
    .map((insight) => `${insight.title} — ${insight.suggestedAction}`);

  const pdf = buildClientReport({
    branding: firm.branding,
    client: overview.record.client,
    patrimony: overview.patrimony,
    investments: overview.investments,
    insights: overview.insights,
    score: overview.score,
    goals: overview.record.goals.map((goal) => projectGoal(goal)),
    advisorName: advisor ? fullName(advisor) : 'Non attribué',
    advisorComment: overview.record.client.notes,
    actionPlan,
    priceOrigin: overview.priceOrigin,
    priceProvider: overview.priceProvider,
  });

  await repository.recordAudit(access, {
    action: 'report.generate',
    targetType: 'client',
    targetId: id,
    targetLabel: fullName(overview.record.client),
  });

  const filename = `rapport-patrimonial-${overview.record.client.lastName.toLowerCase()}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
