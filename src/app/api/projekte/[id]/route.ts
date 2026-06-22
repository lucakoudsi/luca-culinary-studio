import { NextRequest } from 'next/server';
import { getDatabaseManager } from '@/lib/infra/db';
import ProjekteEndpoint from '@/lib/endpoints/projekte';

async function ep() {
  const db = getDatabaseManager();
  await db.ready;
  return new ProjekteEndpoint({ databaseManager: db });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return (await ep()).updateProjekt(params.id, req);
}

export async function DELETE(_r: Request, { params }: { params: { id: string } }) {
  return (await ep()).deleteProjekt(params.id);
}
