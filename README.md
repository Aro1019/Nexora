# Nexora

> Plateforme CMS moderne pour créer, éditer et publier des sites internet — vitrines, blogs, portfolios et e-commerce — depuis une seule interface d'administration.

Monorepo TypeScript construit avec **Turborepo + pnpm**. L'admin et le moteur de rendu public sont deux apps Next.js 15 indépendantes qui partagent le même schéma Prisma, le même routeur tRPC et les mêmes types.

---

## ✨ Fonctionnalités

### Administration (`@nexora/admin` — port 3000)
- Authentification via **Better Auth** (email/mot de passe + Google + GitHub)
- Gestion **multi-sites** avec rôles (Propriétaire / Administrateur / Éditeur / Lecteur)
- **Éditeur de blocs** drag & drop : 9 blocs (hero, titre, paragraphe, image, bouton, espacement, séparateur, colonnes, vidéo)
  - Aperçu responsive bureau / tablette / mobile
  - Réordonnancement, duplication, suppression
- **Bibliothèque de médias** par site
- **Menus de navigation** (en-tête, pied de page, barre latérale) avec liens internes ou externes
- **Réglages** par site (thème, couleurs, polices, codes injectés, GA, réseaux sociaux)
- **Versionnage** des pages (snapshot publié + brouillon en cours)
- **Mode sombre** complet, animations soignées, palette Nexora (Midnight / Nexora Blue / Sky / Frost / Teal)

### Moteur de rendu public (`@nexora/site` — port 3001)
- Sites accessibles via `/s/[slug]` ou `/s/[slug]/[chemin]`
- Renderer SSR léger qui consomme le JSON de l'éditeur
- En-tête sticky avec menu desktop + drawer mobile, sous-menus déroulants
- Pied de page adaptatif (en colonnes si enfants, en ligne sinon)
- SEO : titre, méta-description, `og:image`, `noindex`
- Personnalisation à l'exécution via variables CSS injectées depuis `ReglagesSite`

---

## 🛠 Stack technique

| Couche | Choix |
|---|---|
| Monorepo | Turborepo 2 + pnpm workspaces |
| Frontend | Next.js 15 (App Router, Turbopack) · React 19 · Tailwind CSS 4 |
| API | tRPC v11 + superjson · Zod pour la validation |
| Auth | Better Auth |
| Base de données | PostgreSQL 16 · Prisma |
| Stockage fichiers | MinIO (S3-compatible) |
| Cache | Redis 7 |
| Drag & drop | @dnd-kit |
| Icônes | lucide-react |

---

## 📁 Structure du dépôt

```
nexora/
├── apps/
│   ├── admin/          # Tableau de bord (port 3000)
│   └── site/           # Moteur de rendu public (port 3001)
├── packages/
│   ├── api/            # Routeurs tRPC partagés
│   ├── auth/           # Configuration Better Auth
│   ├── db/             # Client Prisma + schéma
│   ├── storage/        # Couche S3/MinIO
│   ├── types/          # Types TypeScript partagés
│   ├── ui/             # Composants UI réutilisables
│   └── config/         # Configurations (TS, ESLint…)
├── docker/
│   └── docker-compose.yml   # Postgres + Redis + MinIO
├── turbo.json
├── pnpm-workspace.yaml
└── .env.example
```

---

## 🚀 Démarrage rapide

### Pré-requis
- **Node.js** ≥ 20
- **pnpm** ≥ 9.15 (`corepack enable && corepack prepare pnpm@9.15.0 --activate`)
- **Docker Desktop** (pour Postgres / Redis / MinIO)

### 1. Cloner & installer

```powershell
git clone <url-du-repo> nexora
cd nexora
pnpm install
```

### 2. Configurer l'environnement

```powershell
Copy-Item .env.example .env
# Éditer .env et générer un BETTER_AUTH_SECRET (au minimum 32 caractères aléatoires)
```

### 3. Démarrer les services

```powershell
cd docker
docker compose up -d
cd ..
```

Les conteneurs `nexora-postgres`, `nexora-redis` et `nexora-minio` doivent apparaître dans Docker.

### 4. Initialiser la base

```powershell
pnpm db:generate    # générer le client Prisma
pnpm db:push        # appliquer le schéma sur Postgres
```

### 5. Lancer en développement

```powershell
# Tout en parallèle (recommandé)
pnpm dev

# Ou par app
pnpm --filter @nexora/admin dev    # → http://localhost:3000
pnpm --filter @nexora/site dev     # → http://localhost:3001
```

Crée un compte sur `http://localhost:3000`, puis ton premier site. Une fois une page publiée, ouvre `http://localhost:3001/s/[slug]` pour la voir en ligne.

---

## 📜 Scripts utiles

| Commande | Effet |
|---|---|
| `pnpm dev` | Lance toutes les apps en parallèle |
| `pnpm build` | Build de production de toutes les apps |
| `pnpm lint` | Lint global (Turbo) |
| `pnpm db:generate` | Régénère le client Prisma |
| `pnpm db:push` | Applique le schéma sans migration |
| `pnpm db:migrate` | Crée et applique une nouvelle migration |
| `pnpm db:studio` | Ouvre Prisma Studio |
| `pnpm clean` | Supprime `.next` et `.turbo` partout |

Pour cibler une seule app :
```powershell
pnpm turbo build --filter=@nexora/admin
pnpm turbo dev --filter=@nexora/site
```

---

## 🎨 Conventions

- **Langue** : noms de fichiers, dossiers, fonctions, variables et commentaires **en français**
  (`gererSauvegarde`, `surChangement`, `barre-laterale.tsx`, `composants/editeur/`)
- **Pas de Radix / shadcn** : composants en React + Tailwind purs
- **Tailwind v4** avec `@theme` et `@custom-variant dark` (pas de `darkMode` en config)
- **Better Auth** : champs imposés par le framework conservés en anglais (`User.email`, `Session.userId`), tout le reste francisé via `@@map`
- **Routeurs tRPC** : `procedureProtegee` par défaut, `procedurePublique` uniquement pour les endpoints destinés au site public
- **IDs de blocs** : générés via `nanoid(10)`

---

## 🗺 Feuille de route

### ✅ Livré
- Auth + multi-sites + rôles
- Éditeur de blocs (9 types)
- Médias, navigation, réglages
- Mode sombre, animations, dashboard animé
- Moteur de rendu public avec navigation header/footer

### 🔜 En cours / à venir
- **Formulaires** : builder + table de soumissions + bloc `formulaire`
- **i18n multilingue** : sélecteur de langue + duplication par langue
- **Catégories & étiquettes** dans la navigation et les pages de blog
- **Polish éditeur** : édition inline, picker média, undo/redo
- **Domaines personnalisés** (résolution par hostname en production)
- **Déploiement** : guide de mise en production

---

## 📄 Licence

Projet privé — tous droits réservés.
