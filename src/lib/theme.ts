export type ThemeMode = 'light' | 'dark' | 'auto';

// Einzige Quelle der Wahrheit fuer "Auto": zeitbasiert (6-18 Uhr = hell).
// Hinweis: der Inline-Script in src/app/layout.tsx dupliziert diese Logik
// bewusst (er muss vor dem React-Bundle laufen, um FOUC zu vermeiden) -
// bei Aenderungen hier auch dort nachziehen.
export function getAutoTheme(): 'light' | 'dark' {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'light' : 'dark';
}

export function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'dark' ? 'dark' : mode === 'light' ? 'light' : getAutoTheme();
}

export function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme', resolveTheme(mode));
  localStorage.setItem('theme', mode);
}
