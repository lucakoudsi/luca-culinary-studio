import { NextRequest } from 'next/server';
import { getDatabaseManager } from '@/lib/infra/db';
import IdeenEndpoint from '@/lib/endpoints/ideen';

async function ep() {
  const db = getDatabaseManager();
  await db.ready;
  return new IdeenEndpoint({ databaseManager: db });
}

export async function GET() {
  return (await ep()).listIdeen();
}

export async function POST(req: NextRequest) {
  return (await ep()).createIdee(req);
}
