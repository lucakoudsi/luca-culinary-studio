// Sequelize removed — all data access uses Supabase directly.
export type DatabaseManager = never;
export function getDatabaseManager(): never {
  throw new Error('getDatabaseManager() is no longer available — use Supabase');
}
