'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAccess } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { AccessDeniedError } from '@/services/db/access';

export interface BrandingState {
  error: string | null;
  success: boolean;
}

export const EMPTY_BRANDING_STATE: BrandingState = { error: null, success: false };

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur hexadécimale attendue, par exemple #00A97F');

const brandingSchema = z.object({
  firmName: z.string().trim().min(1, 'Le nom du cabinet est requis').max(120),
  logoUrl: z.union([z.url(), z.literal('')]).transform((value) => (value === '' ? null : value)),
  primaryColor: hexColor,
  accentColor: hexColor,
  contactEmail: z.email('Adresse e-mail invalide'),
  contactPhone: z.string().trim().max(30),
  website: z.union([z.url(), z.literal('')]).transform((value) => (value === '' ? null : value)),
  reportFooter: z.string().trim().min(1).max(500),
});

export async function updateBrandingAction(
  _state: BrandingState,
  formData: FormData,
): Promise<BrandingState> {
  const { access } = await requireAccess('admin');

  const parsed = brandingSchema.safeParse({
    firmName: formData.get('firmName'),
    logoUrl: formData.get('logoUrl') ?? '',
    primaryColor: formData.get('primaryColor'),
    accentColor: formData.get('accentColor'),
    contactEmail: formData.get('contactEmail'),
    contactPhone: formData.get('contactPhone') ?? '',
    website: formData.get('website') ?? '',
    reportFooter: formData.get('reportFooter'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Formulaire invalide.', success: false };
  }

  try {
    await getRepository().updateBranding(access, parsed.data);
  } catch (error) {
    return {
      error: error instanceof AccessDeniedError ? error.message : 'La mise à jour a échoué.',
      success: false,
    };
  }

  revalidatePath('/admin/branding');
  revalidatePath('/admin');
  revalidatePath('/dashboard');
  return { error: null, success: true };
}

export async function setUserActiveAction(userId: string, active: boolean): Promise<void> {
  const { access } = await requireAccess('admin');
  await getRepository().setUserActive(access, userId, active);
  revalidatePath('/admin/utilisateurs');
  revalidatePath('/admin');
}
