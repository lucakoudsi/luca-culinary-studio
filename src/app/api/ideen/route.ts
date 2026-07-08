import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getRequestUser } from '@/lib/get-request-user';
const supabase = createAdminClient();

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json([], { status: 401 });

  const { data, error } = await supabase
    .from('ideen')
    .select('*')
    .order('id', { ascending: false });
  if (error) return NextResponse.json([]);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase
    .from('ideen')
    .insert({
      text: body.text,
      tag:  body.tag ?? '',
      date: new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
