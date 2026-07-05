import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
const supabase = createAdminClient();

export async function DELETE(_r: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('ideen').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
