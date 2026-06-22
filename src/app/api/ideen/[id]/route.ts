import { getDatabaseManager } from '@/lib/infra/db';
import IdeenEndpoint from '@/lib/endpoints/ideen';

async function ep() {
  const db = getDatabaseManager();
  await db.ready;
  return new IdeenEndpoint({ databaseManager: db });
}

export async function DELETE(_r: Request, { params }: { params: { id: string } }) {
  return (await ep()).deleteIdee(params.id);
}
