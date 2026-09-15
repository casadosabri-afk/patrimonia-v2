import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { BrandingForm } from '@/components/admin/BrandingForm';

export const metadata: Metadata = { title: 'Branding' };
export const dynamic = 'force-dynamic';

export default async function BrandingPage() {
  const { access } = await requireAccess('admin');
  const firm = await getRepository().getFirm(access);
  if (!firm) notFound();

  return (
    <div>
      <PageHeader
        title="Branding"
        subtitle="Nom, couleurs, logo et coordonnées utilisés dans l’interface et les rapports."
      />
      <BrandingForm branding={firm.branding} />
    </div>
  );
}
