import { NextRequest, NextResponse } from 'next/server';
import type { DatabaseManager } from '../infra/db';

class RezeptEndpoint {
  private db: DatabaseManager;

  constructor({ databaseManager }: { databaseManager: DatabaseManager }) {
    this.db = databaseManager;
  }

  async listRezepte(): Promise<NextResponse> {
    try {
      const rows = await this.db.Rezepte.model.findAll();
      return NextResponse.json(rows);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async getRezeptById(id: string): Promise<NextResponse> {
    try {
      const row = await this.db.Rezepte.model.findByPk(id);
      if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(row);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async createRezept(req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const row = await this.db.Rezepte.model.create({
        ...body,
        lastEdited: new Date().toISOString().slice(0, 10),
        views: 0,
      });
      return NextResponse.json(row, { status: 201 });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async updateRezept(id: string, req: NextRequest): Promise<NextResponse> {
    try {
      const body = await req.json();
      const [n] = await this.db.Rezepte.model.update(
        { ...body, lastEdited: new Date().toISOString().slice(0, 10) },
        { where: { id } }
      );
      if (n === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      const updated = await this.db.Rezepte.model.findByPk(id);
      return NextResponse.json(updated);
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }

  async deleteRezept(id: string): Promise<NextResponse> {
    try {
      const n = await this.db.Rezepte.model.destroy({ where: { id } });
      if (n === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: 'DB error' }, { status: 500 });
    }
  }
}

export default RezeptEndpoint;
