# LUCA Culinary Studio

Next.js 14 (App Router) App zur Organisation von Rezepten, Projekten,
Zutaten, Fermentation und Wein-Pairing für eine kleine, geschlossene
Nutzergruppe (Registrierung nur nach Freigabe durch den Admin).

**Stack:** Next.js 14 / React 18 / TypeScript, Tailwind CSS, Zustand
(Client-State), Supabase (Auth + Postgres + Storage), Resend (E-Mails).

Im Repo liegt außerdem ein `backend/`-Ordner (Express + Sequelize +
sqlite3) sowie eine `database.sqlite` im Root — das ist ein **verworfener
früherer Ansatz** (siehe Commit `0194939 Remove sequelize, use Supabase
only`) und wird vom aktuellen `src/`-Code nicht mehr referenziert. Nicht
als aktive Datenquelle behandeln.

## Bereits umgesetzt

- **Rezept-Bild-Upload** (`/rezepte/neu`, `/rezepte/[id]/bearbeiten`):
  Client-seitige Kompression, Upload in Supabase Storage Bucket
  `rezept-bilder`. Musste zweimal gefixt werden (SSR-500 durch
  `next/dynamic`-Import + fehlende Session im Supabase-Client, siehe
  Konventionen unten).
- **Wein & Pairing**: regelbasierte Pairing-Engine (`src/lib/weinPairing.ts`,
  7 Regeln über 6 Food-/5 Wein-Geschmacksachsen, 0–100-Score +
  Begründungen), Weine-Tabelle in Supabase, Admin-CRUD unter
  `/admin/weine`, zwei Modi auf der Pairing-Seite ("frei" und
  "nach Rezept").
- **Rezept-Geschmacksprofile**: 6-Achsen-Profil (Säure, Süße, Bitterkeit,
  Umami, Schärfe, Salzigkeit) pro Rezept/Zutat, genutzt sowohl in
  `/mein-stil` als auch als Grundlage für den Wein-Pairing-Modus
  "nach Rezept" (`src/lib/recipeFlavorUtils.ts`).
- **SVG-Zutatenstammbaum** (`/zutatenstammbaum`): handgezeichnete SVG-Bäume
  pro Zutat (`src/lib/stammbaum/*.ts`: ei, karotte, kartoffel, pilz, tomate,
  zwiebel) mit bis zu 8 Zubereitungsmethoden-Slots, eigener Baum-Geometrie
  (`tree-geometry.ts`) und Hover-/3D-Feinschliff (mehrere Iterationen laut
  Git-Log).
- Diverse Bugfixes/Umbauten: Registrierungs-/Freigabe-Flow inkl.
  Re-Registrierung nach Löschung, RLS-Umstellung (alle API-Routen auf
  Service-Role-Client wegen RLS), Saison-Filter per RPC/JSONB, Dark Mode
  durchgängig, Profil-Avatar-Upload, Tier/Titel-Trennung.

## Konventionen

- **FKs auf `auth.users`, nicht `public.users`**: Es gibt keine eigene
  `users`-Tabelle. `profiles.id` referenziert direkt die Supabase-Auth-User-ID
  (`auth.users.id`); Ownership-Spalten wie `rezepte.user_id`,
  `projekte.user_id`, `fermentation.user_id` verweisen ebenfalls auf
  `auth.users.id`, nicht auf eine eigene Public-Tabelle.
- **Admin = `ADMIN_EMAIL`**, definiert in `src/config/roles.ts`
  (`luca.koudsi@gmail.com`). `getUserTier(email, stufe)` gibt für diese
  E-Mail immer Tier 99 zurück (darf alles), unabhängig vom
  `profiles.stufe`-Wert in der DB. Wichtig: Diese Prüfung greift nur, wenn
  die **echte** Auth-E-Mail übergeben wird (z. B. via
  `supabase.auth.getUser()` im Client oder `getRequestUser()` serverseitig)
  — nicht die JSON-Antwort von `/api/profil`, die aktuell kein `user`-Feld
  zurückgibt.
- **Zwei verschiedene Supabase-Clients, nicht verwechseln:** (ein dritter,
  `src/lib/supabase.ts` — anonymer Singleton-Client ohne Session, führte zu
  RLS-Fehlern beim Rezept-Bild-Upload — war seit Umstellung auf die beiden
  unten ungenutzt und wurde am 2026-07-19 entfernt)
  - `src/utils/supabase/client.ts` (`createBrowserClient`) — session-fähiger
    Client für Client-Components; für alles, was eine eingeloggte Identität
    braucht (Uploads in RLS-geschützte Storage-Buckets etc.).
  - `src/lib/supabase-admin.ts` (`createAdminClient`) — Service-Role-Client,
    serverseitig in API-Routes, umgeht RLS bewusst (u. a. weil viele Routen
    nach der RLS-Aktivierung sonst nicht mehr funktionierten).
- API-Routen filtern Owner-Daten manuell nach `user_id` (RLS wird durch den
  Service-Role-Client umgangen, die Zugriffskontrolle passiert im
  Route-Code, nicht in Postgres-Policies).

## Offene Aufgaben

Siehe `TO_CHANGE.md.txt` im Projektroot für offene Aufgaben/Notizen.
