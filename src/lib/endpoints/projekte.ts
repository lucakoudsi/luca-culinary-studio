import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseManager } from '../infra/db';

class ProjekteEndpoint {
  private db: DatabaseManager;

  constructor({ databaseManager }: { databaseManager: DatabaseManager }) {
    this.db = databaseManager;
  }

  async listProjekte(): Promise<NextResponse> {
    try {
      const rows = await this.db.Projekte.model.findAll();
      return NextResponse.json(rows);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async createProjekt(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const row = await this.db.Projekte.model.create({
        ...body,
        createdAt: new Date().toISOString().slice(0, 10),
        recipeIds: body.recipeIds ?? [],
        menuIds:   body.menuIds   ?? [],
        notes:     body.notes     ?? [],
      });
      return NextResponse.json(row, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async updateProjekt(id: string, req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      await this.db.Projekte.model.update(body, { where: { id } });
      const updated = await this.db.Projekte.model.findByPk(id);
      if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(updated);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async deleteProjekt(id: string): Promise<NextResponse> {
    try {
      await this.db.Projekte.model.destroy({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }
}

export default ProjekteEndpoint;
