# Documentation Technique — PNL Lab R&D Collective

> Plateforme collaborative de recherche et développement en Programmation Neuro-Linguistique (PNL).

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Base de données](#4-base-de-données)
5. [Authentification et autorisation](#5-authentification-et-autorisation)
6. [Pages et routage](#6-pages-et-routage)
7. [Composants](#7-composants)
8. [Hooks personnalisés](#8-hooks-personnalisés)
9. [Gestion d'état](#9-gestion-détat)
10. [Système de notifications temps réel](#10-système-de-notifications-temps-réel)
11. [Fonctionnalités métier](#11-fonctionnalités-métier)
12. [Intégrations externes](#12-intégrations-externes)
13. [Configuration et déploiement](#13-configuration-et-déploiement)
14. [Tests](#14-tests)

---

## 1. Vue d'ensemble

**PNL Lab R&D Collective** est une application web monopage (SPA) permettant à une communauté de praticiens PNL de :

- **Créer, soumettre et faire évoluer des modèles** PNL (problématiques, outils, approches)
- **Collaborer** via un système de variations, feedbacks et discussions
- **Gérer un workflow de publication** avec validation par des administrateurs
- **Participer à des événements** (ateliers, formations)
- **Consulter un glossaire** de référence PNL

L'application est entièrement en **français** et cible un public de praticiens et chercheurs en PNL.

---

## 2. Stack technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| **Framework UI** | React | 18.3.1 |
| **Langage** | TypeScript | 5.8.3 |
| **Bundler** | Vite (SWC) | 5.4.19 |
| **Routage** | React Router DOM | 6.30.1 |
| **CSS** | Tailwind CSS | 3.4.17 |
| **Composants UI** | shadcn/ui (Radix UI) | — |
| **Animations** | Framer Motion | 12.35.1 |
| **Icônes** | Lucide React | 0.462.0 |
| **Graphiques** | Recharts | 2.15.4 |
| **Formulaires** | React Hook Form + Zod | 7.61.1 |
| **État serveur** | TanStack React Query | 5.83.0 |
| **Backend** | Supabase (PostgreSQL) | 2.98.0 |
| **Notifications toast** | Sonner | 1.7.4 |
| **Dates** | date-fns | 3.6.0 |
| **Tests** | Vitest + Testing Library | 3.2.4 |

---

## 3. Architecture du projet

```
nlp-lab-pnl/
├── src/
│   ├── App.tsx                    # Routage principal (React Router)
│   ├── main.tsx                   # Point d'entrée React
│   ├── index.css                  # Styles globaux, variables CSS, thème
│   │
│   ├── pages/                     # 12 pages (voir §6)
│   │   ├── Index.tsx
│   │   ├── Library.tsx
│   │   ├── ModelDetail.tsx
│   │   ├── Community.tsx
│   │   ├── Events.tsx
│   │   ├── Contribute.tsx
│   │   ├── Admin.tsx
│   │   ├── Auth.tsx
│   │   ├── Profile.tsx
│   │   ├── Resources.tsx
│   │   ├── ResetPassword.tsx
│   │   └── NotFound.tsx
│   │
│   ├── components/
│   │   ├── lab/                   # Composants métier (7)
│   │   │   ├── Header.tsx
│   │   │   ├── ModelCard.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── TypeBadge.tsx
│   │   ├── ui/                    # shadcn/ui (57 composants)
│   │   └── NavLink.tsx
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx         # Provider d'authentification
│   │
│   ├── hooks/
│   │   ├── useAdmin.ts            # Vérification rôle admin
│   │   ├── use-mobile.tsx         # Détection mobile (768px)
│   │   └── use-toast.ts           # Gestion des toasts
│   │
│   ├── lib/
│   │   ├── utils.ts               # Utilitaire cn() (clsx + tailwind-merge)
│   │   └── parseModelFiche.ts     # Parsing des fiches modèles
│   │
│   ├── types/
│   │   └── model.ts               # Interfaces TypeScript des modèles
│   │
│   ├── data/
│   │   ├── mockModels.ts          # Données de démonstration (9 modèles)
│   │   └── glossary.ts            # Glossaire PNL (33+ termes)
│   │
│   ├── integrations/supabase/
│   │   ├── client.ts              # Client Supabase configuré
│   │   └── types.ts               # Types auto-générés depuis le schéma
│   │
│   └── test/
│       ├── setup.ts
│       └── example.test.ts
│
├── supabase/
│   ├── migrations/                # 8 migrations SQL séquentielles
│   ├── functions/                 # Edge Functions (notifications email)
│   └── config.toml
│
├── public/                        # Assets statiques
├── scripts/                       # Scripts de déploiement
└── [fichiers de config]           # package.json, vite.config.ts, tailwind.config.ts, etc.
```

---

## 4. Base de données

### Schéma relationnel (PostgreSQL via Supabase)

#### Tables principales

**`profiles`** — Profils utilisateurs
| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | UUID (PK, FK → auth.users) | Identifiant utilisateur |
| `display_name` | TEXT | Nom affiché |
| `avatar_url` | TEXT | URL de l'avatar |
| `bio` | TEXT | Biographie |
| `expertise` | TEXT[] | Domaines d'expertise |
| `created_at` / `updated_at` | TIMESTAMPTZ | Horodatage |

**`models`** — Modèles PNL (entité centrale)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant unique |
| `user_id` | UUID (FK → auth.users) | Utilisateur ayant créé/importé le modèle |
| `title` | TEXT | Titre du modèle |
| `summary` | TEXT | Courte présentation du modèle (markdown) |
| `description` | TEXT | Contenu complet en markdown (rubriques recommandées : Description, Protocole détaillé, Principe actif, Points de vigilance, Prérequis, Sources) |
| `author_name` | TEXT | Auteur du modèle (texte libre, distinct de user_id) |
| `type` | ENUM | `problematique` \| `outil` \| `approche` |
| `status` | ENUM | `brouillon` \| `en_revision` \| `en_test` \| `publie` \| `en_evolution` |
| `version` | TEXT | Version sémantique (ex: 1.0.0) |
| `complexity` | TEXT | Niveau de complexité |
| `tags` | TEXT[] | Étiquettes |
| `links` | JSONB | Liens externes associés |
| `lang` | TEXT | Langue du modèle (`fr` ou `en`) |
| `translation_of` | UUID (FK → models, nullable) | Référence au modèle original si c'est une traduction |
| `approche_id` | UUID (FK → models, nullable) | Lien vers un modèle de type approche |
| `parent_model_id` | UUID (FK → models, nullable) | Lien vers le modèle parent (pour les variantes) |
| `changelog` | JSONB | Historique des versions |
| `approved` | BOOLEAN | Approuvé par un admin |
| `views_count` | INTEGER | Nombre de vues |
| `variations_count` | INTEGER | Nombre de variations |
| `feedback_count` | INTEGER | Nombre de feedbacks |

**`model_variations`** — Variations de modèles (table historique)

> **Note :** Les variantes sont désormais gérées comme des modèles à part entière avec le champ `parent_model_id` pointant vers le modèle parent. Cette table est conservée pour compatibilité mais n'est plus utilisée pour les nouvelles variantes.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `model_id` | UUID (FK → models) | Modèle parent |
| `user_id` | UUID (FK → auth.users) | Auteur de la variation |
| `title` | TEXT | Titre |
| `description` | TEXT | Description de la variation |

**`model_versions`** — Historique des versions (snapshots)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `model_id` | UUID (FK → models) | Modèle concerné |
| `version` | TEXT | Numéro de version (UNIQUE avec model_id) |
| `title` | TEXT | Titre au moment du snapshot |
| `summary` | TEXT | Résumé au moment du snapshot |
| `description` | TEXT | Contenu complet au moment du snapshot |
| `author_name` | TEXT | Auteur au moment du snapshot |
| `type` | ENUM | Type du modèle |
| `status` | ENUM | Statut au moment du snapshot |
| `complexity` | TEXT | Complexité |
| `tags` | TEXT[] | Étiquettes |
| `links` | JSONB | Liens externes |
| `changelog` | JSONB | Historique des changements |
| `notes` | TEXT | Notes de version (ce qui a changé) |
| `created_by` | UUID (FK → auth.users) | Auteur du snapshot |
| `created_at` | TIMESTAMPTZ | Date de création du snapshot |

Contrainte : `UNIQUE(model_id, version)` — un seul snapshot par numéro de version.

**`model_feedbacks`** — Retours sur les modèles
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `model_id` | UUID (FK → models) | Modèle concerné |
| `user_id` | UUID (FK → auth.users) | Auteur du feedback |
| `content` | TEXT | Contenu du feedback |
| `rating` | INTEGER (1-5) | Note |

**`model_notifications`** — Notifications temps réel
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `user_id` | UUID (FK → auth.users) | Destinataire |
| `model_id` | UUID (FK → models) | Modèle concerné |
| `type` | TEXT | `feedback` \| `variation` \| `post` \| `status_change` |
| `message` | TEXT | Texte de la notification |
| `actor_id` | UUID | Auteur de l'action |
| `read` | BOOLEAN | Lu / non lu |

**`forum_posts`** — Publications du forum
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `user_id` | UUID (FK → auth.users) | Auteur |
| `title` | TEXT | Titre |
| `content` | TEXT | Contenu |
| `category` | TEXT | Catégorie (general, modeles, experiences, questions, ressources) |
| `model_id` | UUID (FK → models, nullable) | Lien optionnel vers un modèle |
| `likes_count` | INTEGER | Nombre de likes |
| `comments_count` | INTEGER | Nombre de commentaires |

**`post_comments`** — Commentaires de forum
| Colonne | Type | Description |
|---------|------|-------------|
| `post_id` | UUID (FK → forum_posts) | Publication concernée |
| `user_id` | UUID (FK → auth.users) | Auteur |
| `content` | TEXT | Contenu du commentaire |

**`post_model_links`** — Liens M:N entre posts et modèles
| Colonne | Type | Description |
|---------|------|-------------|
| `post_id` | UUID (FK → forum_posts) | Publication |
| `model_id` | UUID (FK → models) | Modèle lié |

**`post_likes`** — Likes des publications
| Colonne | Type | Description |
|---------|------|-------------|
| `post_id` | UUID (FK → forum_posts) | Publication |
| `user_id` | UUID (FK → auth.users) | Utilisateur |

**`events`** — Événements
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID (PK) | Identifiant |
| `title` | TEXT | Titre |
| `description` | TEXT | Description |
| `event_date` | TIMESTAMPTZ | Date de l'événement |
| `duration_minutes` | INTEGER | Durée en minutes |
| `zoom_link` | TEXT | Lien Zoom |
| `max_participants` | INTEGER | Nombre max de participants |
| `created_by` | UUID (FK → auth.users) | Organisateur |

**`event_registrations`** — Inscriptions aux événements
| Colonne | Type | Description |
|---------|------|-------------|
| `event_id` | UUID (FK → events) | Événement |
| `user_id` | UUID (FK → auth.users) | Participant inscrit |

**`user_roles`** — Rôles utilisateurs
| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | UUID (FK → auth.users) | Utilisateur |
| `role` | TEXT | `admin` \| `moderator` \| `user` |

### Diagramme des relations

```
auth.users ──┬── profiles (1:1)
             ├── models (1:N) ──┬── model_variations (1:N, historique)
             │                  ├── model_versions (1:N, snapshots)
             │                  ├── model_feedbacks (1:N)
             │                  ├── model_notifications (1:N)
             │                  └── post_model_links (M:N ↔ forum_posts)
             │   models ──┬── parent_model_id (auto-référence, variantes)
             │            ├── translation_of (auto-référence, traductions)
             │            └── approche_id (auto-référence, lien approche)
             ├── forum_posts (1:N) ──┬── post_comments (1:N)
             │                       ├── post_likes (1:N)
             │                       └── post_model_links (M:N ↔ models)
             ├── events (1:N) ── event_registrations (N:N)
             └── user_roles (1:N)
```

### Sécurité (Row Level Security)

Toutes les tables utilisent des **politiques RLS** PostgreSQL :

| Règle | Description |
|-------|-------------|
| Lecture publique | Modèles approuvés, posts, événements visibles par tous |
| Lecture propriétaire | Brouillons visibles uniquement par leur auteur |
| Lecture admin | Les admins voient tout (modèles en attente, etc.) |
| Écriture authentifiée | Seuls les utilisateurs connectés peuvent créer |
| Modification propriétaire | Seul l'auteur peut modifier/supprimer ses contenus |
| Modification admin | Les admins peuvent modifier/supprimer tout contenu |

### Migrations

8 migrations SQL séquentielles dans `supabase/migrations/` :

1. Création des profils utilisateurs
2. Forum (posts, commentaires, likes)
3. Modèles PNL (table principale)
4. Rôles utilisateurs
5. Variations et feedbacks
6. Événements et inscriptions
7. Notifications modèles
8. Stockage avatars (bucket Supabase Storage)

---

## 5. Authentification et autorisation

### Flux d'authentification

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Auth.tsx    │────▸│ AuthContext   │────▸│ Supabase Auth│
│  (UI)       │◂────│ (Provider)   │◂────│ (Backend)    │
└─────────────┘     └──────────────┘     └──────────────┘
```

**Méthodes disponibles :**
- `signUp(email, password, displayName)` — Inscription avec nom affiché
- `signIn(email, password)` — Connexion
- `signOut()` — Déconnexion
- Persistance automatique de session (localStorage)
- Rafraîchissement automatique des tokens

### Modèle d'autorisation

```
Visiteur (non connecté)
  └── Lecture des modèles approuvés, posts, événements, glossaire

Utilisateur authentifié
  └── Tout ce qu'un visiteur peut faire
  └── Créer/modifier ses modèles
  └── Poster des feedbacks et variations
  └── Participer au forum
  └── S'inscrire aux événements
  └── Gérer son profil

Administrateur
  └── Tout ce qu'un utilisateur peut faire
  └── Approuver / rejeter des modèles
  └── Gérer les rôles utilisateurs
  └── Accéder au tableau de bord admin
  └── Gérer les événements
  └── Voir les statistiques globales
```

**Note :** Le premier utilisateur inscrit obtient automatiquement le rôle `admin`.

### Hook `useAdmin()`

Vérifie le rôle admin via un appel RPC Supabase (`has_role('admin')`) et retourne un booléen.

---

## 6. Pages et routage

### Configuration (React Router v6)

| Route | Page | Accès | Description |
|-------|------|-------|-------------|
| `/` | `Index` | Public | Accueil : hero, statistiques, Kanban, modèles récents |
| `/library` | `Library` | Public | Bibliothèque de modèles avec recherche et filtres |
| `/model/:id` | `ModelDetail` | Public | Détail d'un modèle, feedbacks, variations, discussions |
| `/contribute` | `Contribute` | Authentifié | Formulaire de soumission de modèle |
| `/community` | `Community` | Public | Forum communautaire par catégories |
| `/events` | `Events` | Public | Événements avec inscription |
| `/resources` | `Resources` | Public | Glossaire PNL, guide de modélisation, critères qualité |
| `/admin` | `Admin` | Admin | Approbation modèles, gestion rôles, statistiques |
| `/admin/import` | `ImportModel` | Admin | Import de modèles |
| `/auth` | `Auth` | Public | Connexion / inscription / mot de passe oublié |
| `/profile` | `Profile` | Authentifié | Profil utilisateur (avatar, bio, expertise) |
| `/reset-password` | `ResetPassword` | Public | Réinitialisation de mot de passe |
| `*` | `NotFound` | Public | Page 404 |

---

## 7. Composants

### Composants métier (`src/components/lab/`)

| Composant | Rôle |
|-----------|------|
| **Header** | Barre de navigation principale. Navigation responsive, menu mobile, lien admin conditionnel, cloche de notifications, contrôles d'authentification. |
| **ModelCard** | Carte de modèle PNL. Affiche type, statut, tags, version, auteur, compteurs (vues, variations, feedbacks). Animation Framer Motion au chargement. |
| **NotificationBell** | Cloche de notifications temps réel. Abonnement Supabase Realtime, badge non-lu, icônes par type, marquage "tout lu", formatage relatif du temps. |
| **KanbanBoard** | Tableau Kanban à 5 colonnes représentant le workflow des modèles (Brouillon → En révision → En test → Publié → En évolution). |
| **StatCard** | Carte statistique (icône + label + valeur). Utilisée sur la page d'accueil et le dashboard admin. |
| **StatusBadge** | Badge coloré indiquant le statut d'un modèle. |
| **TypeBadge** | Badge coloré indiquant le type d'un modèle (Problématique, Outil, Approche). |
| **ImageUploader** | Composant d'upload d'images (avatars, illustrations). |
| **LangBadge** | Badge indiquant la langue du modèle (FR / EN). |

### Composants UI (`src/components/ui/`)

57 composants **shadcn/ui** basés sur Radix UI, incluant :

- **Formulaires :** Input, Textarea, Button, Checkbox, RadioGroup, Select, Toggle, Switch, Label, Form
- **Dialogues :** Dialog, AlertDialog, Drawer, Sheet
- **Navigation :** Tabs, Breadcrumb, NavigationMenu, Menubar
- **Affichage :** Table, Card, Badge, Avatar, Pagination
- **Feedback :** Toast, Toaster, Sonner, Alert, Progress, Skeleton
- **Layout :** Sidebar, ScrollArea, Resizable, Separator
- **Avancés :** Command (cmdk), Carousel, Chart (Recharts), Calendar, Popover, ContextMenu
- **Autres :** InputOTP, Collapsible, AspectRatio, HoverCard, Tooltip

---

## 8. Hooks personnalisés

| Hook | Fichier | Description |
|------|---------|-------------|
| `useAuth()` | `contexts/AuthContext.tsx` | Accès à l'état d'authentification (`user`, `session`, `loading`) et aux méthodes (`signUp`, `signIn`, `signOut`) |
| `useAdmin()` | `hooks/useAdmin.ts` | Retourne `{ isAdmin: boolean, loading: boolean }`. Appel RPC `has_role('admin')` |
| `useIsMobile()` | `hooks/use-mobile.tsx` | Détection du breakpoint mobile (< 768px) via `matchMedia` |
| `useToast()` | `hooks/use-toast.ts` | Gestion des notifications toast (pattern reducer). Actions : `toast()`, `dismiss()`, `update()` |

---

## 9. Gestion d'état

| Pattern | Usage |
|---------|-------|
| **React Context** | Authentification globale (`AuthContext`) |
| **useState** | État local des composants (formulaires, filtres, modals) |
| **useEffect** | Effets de bord : requêtes Supabase, abonnements temps réel |
| **useReducer** | Logique complexe (gestion des toasts) |
| **TanStack Query** | Configuré pour la gestion du cache et des requêtes serveur |
| **Supabase Realtime** | Abonnements WebSocket pour les notifications en direct |

---

## 10. Système de notifications temps réel

### Architecture

```
Action utilisateur (feedback, variation, post, changement statut)
        │
        ▼
  INSERT dans model_notifications
        │
        ├──▸ Supabase Realtime (WebSocket)
        │         │
        │         ▼
        │    NotificationBell.tsx
        │    (mise à jour UI instantanée)
        │
        └──▸ Supabase Edge Function
              send-model-notification
                    │
                    ▼
              Envoi d'email au propriétaire du modèle
```

### Types de notifications

| Type | Déclencheur |
|------|------------|
| `feedback` | Nouveau feedback sur un modèle |
| `variation` | Nouvelle variation proposée |
| `post` | Nouveau post lié à un modèle |
| `status_change` | Changement de statut d'un modèle |

### Fonctionnement côté client

1. Le composant `NotificationBell` s'abonne au canal Supabase Realtime filtré par `user_id`
2. À chaque insertion dans `model_notifications`, la liste est rafraîchie
3. Un badge affiche le nombre de notifications non lues
4. L'utilisateur peut marquer toutes les notifications comme lues

---

## 11. Fonctionnalités métier

### Workflow des modèles PNL

```
  Brouillon ──▸ En révision ──▸ En test ──▸ Publié ──▸ En évolution
     │              │              │           │            │
     └──────────────┴──────────────┴───────────┴────────────┘
                    (retour possible à chaque étape)
```

- **Brouillon** : Modèle en cours de rédaction
- **En révision** : Soumis pour relecture par la communauté
- **En test** : En phase de test et validation
- **Publié** : Validé et visible par tous
- **En évolution** : Publié mais en cours d'amélioration

### Types de modèles

| Type | Label | Description |
|------|-------|-------------|
| `problematique` | Problématique | Questionnement ou défi en PNL |
| `outil` | Outil | Technique ou outil pratique |
| `approche` | Approche | Cadre méthodologique ou théorique |

### Versionnement

- Format **sémantique** (ex: `1.0.0`, `1.1.0`, `2.0.0`)
- Les versions sont stockées comme **snapshots** dans la table `model_versions`. Un snapshot est créé uniquement lorsque le numéro de version est modifié.
- Chaque snapshot inclut l'intégralité des champs du modèle à cet instant, ainsi que des **notes de version** optionnelles décrivant ce qui a changé.
- Historique complet consultable sur la page de détail

### Système de contribution

Le formulaire de contribution (`Contribute.tsx`) utilise un champ `description` en markdown. Ce champ est pré-rempli avec les rubriques recommandées (Description, Protocole détaillé, Principe actif, Points de vigilance, Prérequis, Sources). Le nom de l'auteur (`author_name`) est un champ texte libre, distinct de l'utilisateur connecté qui est l'importateur/créateur de la fiche.

**Preview :** Le mode édition dispose d'une popup de prévisualisation permettant de voir le rendu markdown avant de sauvegarder.

### Forum communautaire

- **5 catégories** : Général, Modèles, Expériences, Questions, Ressources
- Système de **likes** et **commentaires**
- Liaison optionnelle d'un post à un modèle existant
- Affichage de l'auteur avec avatar et nom

### Événements

- Création par les administrateurs
- Inscription des utilisateurs (avec limite de participants)
- Lien Zoom intégré
- Envoi d'emails aux participants

### Glossaire PNL

33+ termes définis avec :
- Nom du terme
- Définition
- Catégorie de classement

---

## 12. Intégrations externes

### Supabase

| Service | Usage |
|---------|-------|
| **Auth** | Authentification email/mot de passe, sessions, tokens |
| **Database** | PostgreSQL avec RLS pour toutes les tables |
| **Realtime** | WebSocket pour les notifications en direct |
| **Storage** | Bucket `avatars` pour les photos de profil |
| **Edge Functions** | Envoi d'emails de notification |
| **Vault** | Stockage sécurisé de la clé de service (pour les Edge Functions) |

### Variables d'environnement

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL de l'instance Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (anon key) Supabase |

---

## 13. Configuration et déploiement

### Scripts NPM

```bash
npm run dev          # Serveur de développement (port 8080)
npm run build        # Build de production (Vite)
npm run preview      # Prévisualisation du build
npm run lint         # Linting ESLint
npm run test         # Tests Vitest (run)
npm run test:watch   # Tests en mode watch
npm run deploy:zip   # Script de déploiement
```

### Thème et design system

**Polices :**
- Display : **Space Grotesk**
- Body : **Inter**

**Palette de couleurs personnalisée :**
- `lab-navy` / `lab-navy-light` — Couleur principale
- `lab-teal` / `lab-teal-light` — Couleur secondaire
- `lab-cyan` — Accent
- `lab-warm` — Tons chauds
- `lab-success` — Succès
- `lab-surface` — Surfaces

**Gradients CSS :** `hero`, `accent`, `warm`, `card`

**Ombres :** `sm`, `md`, `lg`, `glow`

### Déploiement

L'application est déployée sur un **VPS OVH** avec **Nginx**. Le déploiement s'effectue via le script `scripts/deploy.sh` (build + rsync + copie vers `/var/www/nlp-lab-pnl`).

**URL de production :** https://lab.atelierpnl.eu

---

## 14. Tests

### Configuration

- **Framework :** Vitest 3.2.4
- **Utilitaires :** @testing-library/react, @testing-library/jest-dom
- **Setup :** `src/test/setup.ts`

### Exécution

```bash
npm run test         # Exécution unique
npm run test:watch   # Mode surveillance
```

---

## Annexes

### Diagramme d'architecture global

```
┌─────────────────────────────────────────────────────────┐
│                     NAVIGATEUR                          │
│                                                         │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐   │
│  │  React   │  │  React    │  │  Supabase         │   │
│  │  Router  │  │  Query    │  │  Realtime (WS)    │   │
│  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘   │
│       │              │                  │               │
│  ┌────┴──────────────┴──────────────────┴───────────┐  │
│  │              React Application                    │  │
│  │  Pages ◂──▸ Composants ◂──▸ Hooks ◂──▸ Context  │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ HTTPS / WSS
┌─────────────────────────┼───────────────────────────────┐
│                    SUPABASE                              │
│                         │                                │
│  ┌──────────┐  ┌───────┴────┐  ┌───────────────────┐   │
│  │   Auth   │  │ PostgreSQL │  │  Edge Functions   │   │
│  │          │  │  + RLS     │  │  (notifications)  │   │
│  └──────────┘  └────────────┘  └───────────────────┘   │
│                                                         │
│  ┌──────────┐  ┌────────────┐  ┌───────────────────┐   │
│  │ Realtime │  │  Storage   │  │     Vault         │   │
│  │  (WS)    │  │ (avatars)  │  │  (secrets)        │   │
│  └──────────┘  └────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

*Documentation générée le 18 avril 2026 — PNL Lab R&D Collective*
