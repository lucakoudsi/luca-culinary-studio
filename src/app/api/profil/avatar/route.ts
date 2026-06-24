import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop() ?? 'jpg';
    const fileName = `${user.id}.${ext}`;
    const contentType = file.type || 'image/jpeg';

    const db = createAdminClient();

    const { error: uploadError } = await db.storage
      .from('avatars')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

    const { data: urlData } = db.storage.from('avatars').getPublicUrl(fileName);
    // Append cache-bust so the browser reloads the new image
    const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;

    await db.from('profiles').upsert({
      id: user.id,
      avatar_url,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ avatar_url });
  } catch (e) {
    console.error('[profil/avatar POST]', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
