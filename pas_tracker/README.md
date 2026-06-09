# Pas Tracker

Petite application web pour suivre son nombre de pas quotidiens.
Authentification par pseudo et historique des 7 derniers jours, propulsés par Supabase.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Supabase (auth + base de données)

## Démarrage

1. Installer les dépendances :

   ```bash
   npm install
   ```

2. Copier `.env.example` vers `.env` et renseigner les clés de votre projet Supabase :

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Lancer le serveur de dev :

   ```bash
   npm run dev
   ```

## Schéma Supabase

L'application attend deux tables :

```sql
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  username text not null unique
);

create table steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  date date not null,
  count integer not null check (count >= 0),
  unique (user_id, date)
);
```

> **Important :** activez la Row Level Security (RLS) sur ces tables et ajoutez
> des policies restreignant chaque ligne à `auth.uid() = user_id` (et `= id` pour
> `profiles`). C'est la RLS qui garantit qu'un utilisateur ne voit que ses propres données.

## Scripts

- `npm run dev` — serveur de développement
- `npm run build` — build de production
- `npm run preview` — prévisualisation du build
- `npm run lint` — ESLint
