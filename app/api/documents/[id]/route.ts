import { NextResponse } from 'next/server';
import { getSessionUser, toAccessContext } from '@/lib/auth/session';
import { getRepository } from '@/services/db';
import { getDemoStore } from '@/services/db/demoStore';
import { isSupabaseConfigured } from '@/lib/env';
import { getSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Téléchargement d'un document.
 *
 * L'autorisation est vérifiée côté serveur : le dépôt du document doit
 * appartenir au cabinet de l'utilisateur, et un client ne peut récupérer que
 * les pièces qui lui ont été explicitement partagées.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });

  const { id } = await params;
  const access = toAccessContext(user);
  const documents = await getRepository().listDocuments(access);
  const document = documents.find((item) => item.id === id);

  if (!document) {
    return NextResponse.json({ error: 'Document introuvable.' }, { status: 404 });
  }

  if (document.storagePath && isSupabaseConfigured()) {
    const supabase = await getSupabaseServerClient();
    const signed = await supabase?.storage
      .from('client-documents')
      .createSignedUrl(document.storagePath, 60);

    if (signed?.data?.signedUrl) return NextResponse.redirect(signed.data.signedUrl);
    return NextResponse.json({ error: 'Fichier indisponible.' }, { status: 404 });
  }

  const blob = getDemoStore().documentBlobs.get(id);
  if (!blob) {
    return NextResponse.json(
      {
        error:
          'Ce document appartient au jeu de démonstration : il est décrit dans PATRIMONIA mais aucun fichier n’y est associé.',
      },
      { status: 404 },
    );
  }

  const bytes = Uint8Array.from(Buffer.from(blob.base64, 'base64'));
  return new NextResponse(bytes.buffer as ArrayBuffer, {
    headers: {
      'Content-Type': blob.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(document.name)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
