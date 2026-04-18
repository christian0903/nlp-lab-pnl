# Instructions pour la conversion bilingue FR/EN

## Contexte

Ce dossier `nlp-lab-pnl` est le projet principal (PNL Lab R&D).
L'ancien repo `pnl-lab-collective` est obsolète et archivé.
Le site est déployé sur VPS OVH à https://lab.atelierpnl.eu.

## Ce qui est déjà fait

- [x] Copie du projet dans `nlp-lab-pnl`
- [x] `.env` configuré pour le nouveau projet Supabase (`khxmopvdcbzgoesvyngr`)
- [x] Schéma SQL mis à jour + bug `has_role` arguments corrigé
- [x] Schéma SQL exécuté dans Supabase
- [x] react-i18next installé et configuré (`src/i18n/`)
- [x] ~500 clés FR/EN dans `src/i18n/fr.json` et `src/i18n/en.json`
- [x] LanguageSwitcher FR|EN dans le header
- [x] Toutes les pages converties pour utiliser `t()` (~20 pages + 5 composants)
- [x] Type `DBModel` mis à jour avec `lang` + `translation_of`
- [x] Bibliothèque : filtre par langue + badge FR/EN sur les cartes
- [x] Fiche modèle : badge langue, lien "View in English/Voir en français"
- [x] Ressources : filtrage automatique par langue active
- [x] Question PNL bilingue (FR: territoire, EN: territory)

## Ce qui reste à faire

### ~~1. Initialiser la base Supabase~~ ✅

~~Exécuter `supabase/migrations/00_full_schema.sql`~~ Fait.
Créer les buckets storage (avatars, model-images) via le dashboard.

### 2. Installer react-i18next

```bash
cd ~/lab-atelierpnl/nlp-lab-pnl
npm install react-i18next i18next i18next-browser-languagedetector
```

Créer :
- `src/i18n/index.ts` — configuration i18next avec détection langue navigateur, fallback FR
- `src/i18n/fr.json` — toutes les chaînes françaises
- `src/i18n/en.json` — traductions anglaises

### 3. Extraire les chaînes de texte (~400)

Parcourir tous les fichiers `src/pages/*.tsx` et `src/components/**/*.tsx`.
Remplacer chaque texte en dur par `t('clé')`.

Fichiers principaux à traiter :
- `src/pages/Index.tsx` — hero, stats, bienvenue, fil d'actualités
- `src/pages/Library.tsx` — titres sections, filtres, labels
- `src/pages/ModelDetail.tsx` — onglets, boutons, labels, messages
- `src/pages/Community.tsx` — catégories, boutons, messages
- `src/pages/Contribute.tsx` — formulaire, labels, sections par type
- `src/pages/Auth.tsx` — login, signup, messages, question PNL
- `src/pages/Soutenir.tsx` — texte descriptif, boutons
- `src/pages/Profile.tsx` — labels formulaire
- `src/pages/PublicProfile.tsx` — labels
- `src/pages/Contributors.tsx` — titre, texte
- `src/pages/Resources.tsx` — labels
- `src/pages/Events.tsx` — labels
- `src/pages/Admin.tsx` — boutons, labels
- `src/pages/AdminDonations.tsx` — labels
- `src/pages/AdminAnnouncement.tsx` — labels
- `src/pages/ImportModel.tsx` — labels
- `src/components/lab/Header.tsx` — navigation items
- `src/components/lab/Footer.tsx` — liens
- `src/components/lab/AuthGuard.tsx` — message chargement
- `src/components/lab/ThemeSwitcher.tsx` — noms des thèmes
- `src/components/lab/NotificationBell.tsx` — titre, bouton

### 4. Toggle de langue dans le header

Ajouter un composant `LanguageSwitcher` dans le header (à côté du ThemeSwitcher).
Deux boutons : FR | EN. Langue persistée en localStorage.
Détection automatique de la langue du navigateur au premier accès.

### 5. Adapter le type DBModel

Dans `src/types/model.ts`, ajouter :
```typescript
lang: string;           // 'fr' | 'en'
translation_of: string | null;  // ID du modèle original si traduction
```

### 6. Adapter la bibliothèque

- Filtrer les modèles par `lang` (afficher ceux de la langue active)
- Si un modèle n'existe que dans une langue, l'afficher quand même avec un badge de langue
- Option : afficher les deux langues avec des badges FR/EN

### 7. Lien traduction sur les fiches modèle

Sur chaque fiche :
- Si une traduction existe (`translation_of` ou un modèle qui pointe vers ce modèle) → lien "View in English" / "Voir en français"
- Si pas de traduction → bouton "Traduire en anglais" / "Translate to French"
- Le bouton de traduction IA appelle Claude API pour traduire le contenu, puis crée un nouveau modèle avec `translation_of` = ID original

### 8. Adapter les ressources

Même logique que les modèles : `lang` + `translation_of`.
L'affichage filtre par langue active.

### 9. Question PNL bilingue

Dans `Auth.tsx`, adapter la question anti-bot :
- FR : "La carte n'est pas le ..." → territoire
- EN : "The map is not the ..." → territory

### 10. Documentation

- Séparer les guides : `guide-utilisateur-fr.md`, `guide-utilisateur-en.md`, `guide-admin-fr.md`, `guide-admin-en.md`
- La page Aide charge le bon fichier selon la langue

## Architecture des décisions

### Modèles
- Chaque modèle a une seule langue (`lang`)
- Un modèle peut être l'original (`translation_of = NULL`) ou une traduction (`translation_of = ID`)
- Les deux versions vivent indépendamment (peuvent évoluer séparément)
- La traduction IA est optionnelle, l'auteur peut écrire directement dans l'autre langue

### Forum
- Les posts ne sont PAS traduits — chacun écrit dans sa langue
- L'interface (boutons, labels) est traduite via i18next

### Langue par défaut
- FR par défaut
- Détection automatique de la langue du navigateur (`i18next-browser-languagedetector`)
- Toggle manuel FR/EN dans le header
- Choix persisté en localStorage

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `supabase/migrations/00_full_schema.sql` | Schéma complet avec colonnes bilingues |
| `donnees-modeles/skill-fiche-modele.md` | Skill de création de fiches |
| `src/lib/parseModelFiche.ts` | Parser d'import (accepte titres FR et clés techniques) |
| `public/guide-utilisateur.md` | Doc utilisateur FR (à dupliquer en EN) |
| `public/guide-admin.md` | Doc admin FR (à dupliquer en EN) |

## Nouveau projet Supabase

- **Projet** : nlp-lab-pnl
- **Ref** : khxmopvdcbzgoesvyngr
- **URL** : https://khxmopvdcbzgoesvyngr.supabase.co
- **Clé anon** : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoeG1vcHZkY2J6Z29lc3Z5bmdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDU0ODQsImV4cCI6MjA5MDk4MTQ4NH0.idLcfB3luk3Crq7JuelgqVthRfg1e7v_FNDhKJEK5OE

## Pour démarrer la prochaine session

```
cd ~/lab-atelierpnl/nlp-lab-pnl
claude
```

Puis dire : "Lis INSTRUCTIONS-BILINGUAL.md et commence la conversion bilingue."
