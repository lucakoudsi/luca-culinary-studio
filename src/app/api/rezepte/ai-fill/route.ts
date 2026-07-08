import { NextRequest } from 'next/server';
import { getRequestUser } from '@/lib/get-request-user';

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) {
    return Response.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  return Response.json({
    error: 'KI-Funktion wird bald verfügbar sein.',
    available: false,
  }, { status: 503 });
}
