import { NextRequest } from 'next/server';
import { getDatabaseManager } from '@/lib/infra/db';
import ZutatenEndpoint from '@/lib/endpoints/zutaten';

async function ep() {
  const db = getDatabaseManager();
  await db.ready;
  return new ZutatenEndpoint({ databaseManager: db });
}

export async function GET() {
  return (await ep()).listZutaten();
}

export async function POST(req: NextRequest) {
  return (await ep()).createZutat(req);
}
