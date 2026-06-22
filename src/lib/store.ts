'use client';
import { create } from 'zustand';
import type { Recipe, Idea, Ingredient, CreativeResult, GeneratedMenu, Project, ProjectNote } from '@/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const api = {
  get:    (url: string)             => fetch(url).then(r => r.json()),
  post:   (url: string, body: unknown) => fetch(url, { method: 'POST',   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  put:    (url: string, body: unknown) => fetch(url, { method: 'PUT',    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
  delete: (url: string)             => fetch(url, { method: 'DELETE' }).then(r => r.json()),
};

// ─── Store Interface ──────────────────────────────────────────────────────────

interface StoreState {
  // Data
  recipes:     Recipe[];
  ideas:       Idea[];
  ingredients: Ingredient[];
  projects:    Project[];

  // UI filters — Recipes
  searchQuery:    string;
  filterCategory: string;
  filterStatus:   string;

  // UI filters — Zutaten
  ingredientSearch:         string;
  ingredientSeasonFilter:   string;
  ingredientCategoryFilter: string;

  // Ephemeral (not persisted)
  creativeResults: CreativeResult[];
  generatedMenus:  GeneratedMenu[];

  // ── Fetch ─────────────────────────────────────────────────────────────────
  fetchRecipes:     () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchIdeas:       () => Promise<void>;
  fetchProjects:    () => Promise<void>;

  // ── Recipes ──────────────────────────────────────────────────────────────
  setSearchQuery:    (q: string) => void;
  setFilterCategory: (c: string) => void;
  setFilterStatus:   (s: string) => void;
  getFilteredRecipes: () => Recipe[];
  addRecipe:    (recipe: Omit<Recipe, 'id' | 'lastEdited' | 'views'>) => Promise<void>;
  updateRecipe: (id: number, updates: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: number) => Promise<void>;

  // ── Ideas ─────────────────────────────────────────────────────────────────
  addIdea: (text: string, tag: string) => Promise<void>;

  // ── Kreativlabor (in-memory) ──────────────────────────────────────────────
  addCreativeResult:    (r: Omit<CreativeResult, 'id' | 'generatedAt' | 'saved'>) => void;
  saveCreativeResult:   (id: number) => void;
  deleteCreativeResult: (id: number) => void;

  // ── Zutaten ───────────────────────────────────────────────────────────────
  setIngredientSearch:         (q: string) => void;
  setIngredientSeasonFilter:   (s: string) => void;
  setIngredientCategoryFilter: (c: string) => void;
  getFilteredIngredients: () => Ingredient[];
  addIngredient: (i: Omit<Ingredient, 'id'>) => Promise<void>;

  // ── Menügenerator (in-memory) ─────────────────────────────────────────────
  addGeneratedMenu:    (m: Omit<GeneratedMenu, 'id' | 'createdAt' | 'saved'>) => void;
  saveGeneratedMenu:   (id: number) => void;
  deleteGeneratedMenu: (id: number) => void;

  // ── Projekte ──────────────────────────────────────────────────────────────
  addProject:    (p: Omit<Project, 'id' | 'createdAt' | 'notes' | 'recipeIds' | 'menuIds'>) => Promise<void>;
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  addProjectNote:            (projectId: number, text: string) => Promise<void>;
  deleteProjectNote:         (projectId: number, noteId: number) => Promise<void>;
  addRecipeToProject:        (projectId: number, recipeId: number) => Promise<void>;
  removeRecipeFromProject:   (projectId: number, recipeId: number) => Promise<void>;
  addMenuToProject:          (projectId: number, menuId: number) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<StoreState>((set, get) => ({
  recipes:     [],
  ideas:       [],
  ingredients: [],
  projects:    [],
  searchQuery:    '',
  filterCategory: 'Alle',
  filterStatus:   'Alle',
  ingredientSearch:         '',
  ingredientSeasonFilter:   'Alle',
  ingredientCategoryFilter: 'Alle',
  creativeResults: [],
  generatedMenus:  [],

  // ── Fetch ─────────────────────────────────────────────────────────────────
  fetchRecipes:     async () => { try { const d = await api.get('/api/rezepte');  set({ recipes:     Array.isArray(d) ? d : [] }); } catch { set({ recipes:     [] }); } },
  fetchIngredients: async () => { try { const d = await api.get('/api/zutaten');  set({ ingredients: Array.isArray(d) ? d : [] }); } catch { set({ ingredients: [] }); } },
  fetchIdeas:       async () => { try { const d = await api.get('/api/ideen');    set({ ideas:       Array.isArray(d) ? d : [] }); } catch { set({ ideas:       [] }); } },
  fetchProjects:    async () => { try { const d = await api.get('/api/projekte'); set({ projects:    Array.isArray(d) ? d : [] }); } catch { set({ projects:    [] }); } },

  // ── Recipes ──────────────────────────────────────────────────────────────
  setSearchQuery:    q => set({ searchQuery: q }),
  setFilterCategory: c => set({ filterCategory: c }),
  setFilterStatus:   s => set({ filterStatus: s }),

  getFilteredRecipes: () => {
    const { recipes, searchQuery, filterCategory, filterStatus } = get();
    return recipes.filter(r => {
      const matchSearch   = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchCategory = filterCategory === 'Alle' || r.category === filterCategory;
      const matchStatus   = filterStatus   === 'Alle' || r.status   === filterStatus;
      return matchSearch && matchCategory && matchStatus;
    });
  },

  addRecipe: async recipe => {
    const created = await api.post('/api/rezepte', recipe);
    set(s => ({ recipes: [...s.recipes, created] }));
  },

  updateRecipe: async (id, updates) => {
    const updated = await api.put(`/api/rezepte/${id}`, updates);
    set(s => ({ recipes: s.recipes.map(r => r.id === id ? { ...r, ...updated } : r) }));
  },

  deleteRecipe: async id => {
    await api.delete(`/api/rezepte/${id}`);
    set(s => ({ recipes: s.recipes.filter(r => r.id !== id) }));
  },

  // ── Ideas ─────────────────────────────────────────────────────────────────
  addIdea: async (text, tag) => {
    const created = await api.post('/api/ideen', { text, tag });
    set(s => ({ ideas: [created, ...s.ideas] }));
  },

  // ── Kreativlabor (in-memory) ──────────────────────────────────────────────
  addCreativeResult: r => set(s => ({ creativeResults: [{ ...r, id: Date.now(), generatedAt: new Date().toISOString().slice(0, 10), saved: false }, ...s.creativeResults] })),
  saveCreativeResult:   id => set(s => ({ creativeResults: s.creativeResults.map(r => r.id === id ? { ...r, saved: true } : r) })),
  deleteCreativeResult: id => set(s => ({ creativeResults: s.creativeResults.filter(r => r.id !== id) })),

  // ── Zutaten ───────────────────────────────────────────────────────────────
  setIngredientSearch:         q => set({ ingredientSearch: q }),
  setIngredientSeasonFilter:   s => set({ ingredientSeasonFilter: s }),
  setIngredientCategoryFilter: c => set({ ingredientCategoryFilter: c }),

  getFilteredIngredients: () => {
    const { ingredients, ingredientSearch, ingredientSeasonFilter, ingredientCategoryFilter } = get();
    return ingredients.filter(i => {
      const aromas = Array.isArray(i.aromaprofil) ? i.aromaprofil : [];
      const saison = Array.isArray(i.saison) ? i.saison : [];
      const matchSearch = !ingredientSearch || i.name.toLowerCase().includes(ingredientSearch.toLowerCase()) || aromas.some(a => a.toLowerCase().includes(ingredientSearch.toLowerCase()));
      const matchSeason = ingredientSeasonFilter === 'Alle' || saison.includes(ingredientSeasonFilter);
      const matchCat    = ingredientCategoryFilter === 'Alle' || i.kategorie === ingredientCategoryFilter;
      return matchSearch && matchSeason && matchCat;
    });
  },

  addIngredient: async i => {
    const created = await api.post('/api/zutaten', i);
    set(s => ({ ingredients: [...s.ingredients, created] }));
  },

  // ── Menügenerator (in-memory) ─────────────────────────────────────────────
  addGeneratedMenu:    m  => set(s => ({ generatedMenus: [{ ...m, id: Date.now(), createdAt: new Date().toISOString().slice(0, 10), saved: false }, ...s.generatedMenus] })),
  saveGeneratedMenu:   id => set(s => ({ generatedMenus: s.generatedMenus.map(m => m.id === id ? { ...m, saved: true } : m) })),
  deleteGeneratedMenu: id => set(s => ({ generatedMenus: s.generatedMenus.filter(m => m.id !== id) })),

  // ── Projekte ──────────────────────────────────────────────────────────────
  addProject: async p => {
    const created = await api.post('/api/projekte', p);
    set(s => ({ projects: [...s.projects, created] }));
  },

  updateProject: async (id, updates) => {
    const updated = await api.put(`/api/projekte/${id}`, updates);
    set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, ...updated } : p) }));
  },

  deleteProject: async id => {
    await api.delete(`/api/projekte/${id}`);
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }));
  },

  addProjectNote: async (projectId, text) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) return;
    const note: ProjectNote = { id: Date.now(), text, date: new Date().toISOString().slice(0, 10) };
    const notes = [...project.notes, note];
    // Optimistic update
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, notes } : p) }));
    await api.put(`/api/projekte/${projectId}`, { ...project, notes });
  },

  deleteProjectNote: async (projectId, noteId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) return;
    const notes = project.notes.filter(n => n.id !== noteId);
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, notes } : p) }));
    await api.put(`/api/projekte/${projectId}`, { ...project, notes });
  },

  addRecipeToProject: async (projectId, recipeId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project || project.recipeIds.includes(recipeId)) return;
    const recipeIds = [...project.recipeIds, recipeId];
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, recipeIds } : p) }));
    await api.put(`/api/projekte/${projectId}`, { ...project, recipeIds });
  },

  removeRecipeFromProject: async (projectId, recipeId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project) return;
    const recipeIds = project.recipeIds.filter(id => id !== recipeId);
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, recipeIds } : p) }));
    await api.put(`/api/projekte/${projectId}`, { ...project, recipeIds });
  },

  addMenuToProject: async (projectId, menuId) => {
    const project = get().projects.find(p => p.id === projectId);
    if (!project || project.menuIds.includes(menuId)) return;
    const menuIds = [...project.menuIds, menuId];
    set(s => ({ projects: s.projects.map(p => p.id === projectId ? { ...p, menuIds } : p) }));
    await api.put(`/api/projekte/${projectId}`, { ...project, menuIds });
  },
}));
