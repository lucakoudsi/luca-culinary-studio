import { NextRequest } from 'next/server';
import { getDatabaseManager } from '@/lib/infra/db';
import ProjekteEndpoint from '@/lib/endpoints/projekte';

async function ep() {
  const db = getDatabaseManager();
  await db.ready;
  return new ProjekteEndpoint({ databaseManager: db });
}

export async function GET() {
  return (await ep()).listProjekte();
}

export async function POST(req: NextRequest) {
  return (await ep()).createProjekt(req);
}
