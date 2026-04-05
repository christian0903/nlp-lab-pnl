# Guide Administrateur — PNL Lab R&D

> Documentation réservée aux administrateurs et modérateurs.

---

## Table des matières

1. [Rôles et permissions](#1-rôles-et-permissions)
2. [Tableau de bord admin](#2-tableau-de-bord-admin)
3. [Validation des modèles](#3-validation-des-modèles)
4. [Gestion des utilisateurs](#4-gestion-des-utilisateurs)
5. [Import de modèles](#5-import-de-modèles)
6. [Format des fiches d'import](#6-format-des-fiches-dimport)
7. [Gestion des images](#7-gestion-des-images)
8. [Paramètres](#8-paramètres)
9. [Export de données](#9-export-de-données)
10. [Gestion des donations](#10-gestion-des-donations)
11. [Annonce d'accueil](#11-annonce-daccueil)
12. [Fonctionnalités éditoriales](#12-fonctionnalités-éditoriales)
13. [Statistiques de visite](#13-statistiques-de-visite)
14. [PWA (Progressive Web App)](#14-pwa-progressive-web-app)
15. [Sécurité et clés API](#15-sécurité-et-clés-api)

---

## 1. Rôles et permissions

### Visiteur (non connecté)

- Consulter les modèles publiés et approuvés
- Lire les posts du forum
- Voir les événements
- Consulter les ressources
- Faire un don

### Utilisateur connecté

Tout ce qu'un visiteur peut faire, plus :
- Créer et modifier ses propres modèles
- Proposer des variantes et feedbacks
- Publier, modifier et supprimer ses posts dans le forum
- Liker et commenter
- S'inscrire aux événements
- Gérer son profil
- Recevoir des notifications

### Modérateur

Tout ce qu'un utilisateur peut faire, plus :
- Valider ou rejeter les modèles en attente
- Modifier et supprimer n'importe quel modèle ou post
- Proposer des modèles depuis le forum ("Proposer comme modèle")
- Gérer les articles Ressources (créer, modifier, supprimer)
- Créer et supprimer des événements
- Envoyer des emails aux participants
- Importer des modèles via fiche markdown
- Exporter les données en CSV
- Accéder au tableau de bord admin

**Le modérateur ne peut PAS** :
- Gérer les utilisateurs
- Modifier les paramètres de l'application
- Basculer le mode Stripe (test/live)

### Administrateur

Tout ce qu'un modérateur peut faire, plus :
- **Gérer les utilisateurs** : ajouter, supprimer, changer les rôles
- **Réinitialiser les mots de passe** des utilisateurs
- **Configurer les paramètres** de l'application
- **Gérer les donations** : voir le journal des dons, basculer test/live
- **Publier des annonces** sur la page d'accueil
- **Modifier la date de création** des modèles
- **Supprimer des modèles** définitivement

---

## 2. Tableau de bord admin

Accessible via le lien **Admin** dans la navigation.

### Statistiques

Six cartes :
- Modèles en attente de validation (mis en évidence)
- Modèles validés
- Total des modèles
- Nombre d'utilisateurs
- Nombre de posts forum
- Modèles publiés

Distribution par statut affichée en dessous.

### Onglets

- **Modèles en attente** : voir, valider ou rejeter
- **Modèles validés** : liste complète avec type, auteur, statut
- **Activité récente** : 8 derniers modèles modifiés
- **Utilisateurs** : tableau avec rôles
- **Images** : galerie avec remplacement/suppression
- **Paramètres** : configuration de l'application

### Boutons d'accès rapide

- **Annonce** : publier un message sur la page d'accueil
- **Donations** : gestion des paiements Stripe
- **Gérer les utilisateurs** : page dédiée
- **Importer un modèle** : import markdown
- **Guide admin** : documentation administrateur
- **Export CSV** : modèles, utilisateurs, posts

---

## 3. Validation des modèles

Quand un utilisateur soumet un modèle, il arrive en **attente de validation**.

### Depuis la bibliothèque

Les admins voient un bouton **"En attente (N)"** qui affiche les modèles non validés. Chaque carte a un bouton **"Valider"**.

### Depuis la fiche modèle

- Modèle en attente : bandeau orange avec bouton **Valider**
- Modèle validé : bandeau vert avec bouton **Remettre en attente**

### Depuis le tableau de bord

Onglet "Modèles en attente" avec actions Voir / Rejeter / Valider.

---

## 4. Gestion des utilisateurs

Accessible via **Admin → Gérer les utilisateurs** (administrateurs uniquement).

| Action | Description |
|--------|-------------|
| **Ajouter un utilisateur** | Créer un compte avec nom, email et mot de passe initial |
| **Changer le rôle** | Sélecteur : Utilisateur / Modérateur / Administrateur |
| **Modifier le nom** | Cliquer sur le crayon, Entrée pour sauvegarder |
| **Modifier l'email** | Cliquer sur le crayon, Entrée pour sauvegarder |
| **Reset mot de passe** | Envoie un email de réinitialisation |
| **Supprimer** | Supprime le profil et les rôles (avec confirmation) |

Informations visibles : avatar, nom, email, date d'inscription, dernière connexion, bio, expertise, UUID.

Note : impossible de modifier son propre rôle depuis cette page.

---

## 5. Import de modèles

### Accès

- **Admin → Importer un modèle**
- Ou depuis la page Contribuer → bouton **"Importer une fiche"** (admin uniquement)

### Workflow

1. Collez la fiche markdown (ou cliquez **Charger l'exemple**)
2. Cliquez **Prévisualiser**
3. Vérifiez : badge Création/Mise à jour, métadonnées, sections
4. Cliquez **Créer** ou **Mettre à jour**

### Détection automatique

L'import cherche par titre si le modèle existe déjà et bascule automatiquement entre création et mise à jour.

### Import comme variante

Si on arrive depuis le bouton "Créer une variante" → "Importer une fiche", le `parent_model_id` est automatiquement rattaché.

---

## 6. Format des fiches d'import

### Structure

```markdown
---
action: create | update
title: "Nom du modèle"
type: problematique | outil | approche
status: brouillon | en_revision | en_test | publie | en_evolution
version: "1.0.0"
complexity: débutant | intermédiaire | avancé
tags:
  - tag1
  - tag2
---

## Description

Description concise du modèle.

## Sections

### protocol

Étapes du protocole.

### active_principle

Mécanisme central du changement.
```

### Sections disponibles

| Section | Quand l'utiliser |
|---------|-----------------|
| `structure` | Architecture ou composants du modèle |
| `protocol` | Étapes d'exécution |
| `active_principle` | Mécanisme central qui produit le changement |
| `patterns` | Patterns comportementaux observés |
| `signals` | Signaux reconnaissables (corporels, verbaux) |
| `intervention_points` | Points d'intervention |
| `vigilance` | Contre-indications, erreurs fréquentes |
| `variants` | Variantes connues et adaptations |
| `philosophy` | Fondements théoriques |
| `creators` | Créateurs de l'approche |
| `prerequisites` | Conditions préalables |
| `toolkit` | Outils et techniques associés |

### Pertinence par type

| Section | Problématique | Outil | Approche |
|---------|:---:|:---:|:---:|
| `protocol` | Rare | **Essentiel** | Optionnel |
| `active_principle` | Rare | **Essentiel** | Optionnel |
| `patterns` | **Essentiel** | Optionnel | Optionnel |
| `signals` | **Essentiel** | Optionnel | Rare |
| `intervention_points` | **Essentiel** | Optionnel | Rare |
| `vigilance` | Optionnel | **Essentiel** | Optionnel |
| `philosophy` | Optionnel | Rare | **Essentiel** |
| `creators` | Rare | Rare | **Essentiel** |
| `toolkit` | Rare | Optionnel | **Essentiel** |

### Versionnement

| Situation | Règle |
|-----------|-------|
| Nouveau modèle | `1.0.0` |
| Corrections mineures | `1.0.1` |
| Ajout de contenu | `1.1.0` |
| Refonte majeure | `2.0.0` |

---

## 7. Gestion des images

Accessible via l'onglet **Images** dans le tableau de bord admin.

Pour chaque image :
- Miniature de prévisualisation
- Nom du fichier, taille et date
- **Remplacer** : uploader une nouvelle image au même emplacement
- **Supprimer** : retirer l'image du serveur
- **Copier URL** : copier l'adresse publique

---

## 8. Paramètres

| Paramètre | Description | Défaut |
|-----------|-------------|:------:|
| **Taille max des images** | Les images dépassant cette taille sont rejetées | 2 Mo |

---

## 9. Export de données

Trois exports CSV disponibles :
- **Modèles** : tous les modèles avec métadonnées
- **Utilisateurs** : liste des utilisateurs et rôles
- **Posts** : publications du forum

---

## 10. Gestion des donations

Accessible via **Admin → Donations**.

### Mode Stripe (test / live)

Un toggle permet de basculer entre mode test et mode live :
- **Mode test** : paiements simulés, carte de test `4242 4242 4242 4242`
- **Mode live** : paiements réels

Le basculement vers live demande une confirmation.

### Statistiques

- Nombre de paiements
- Total reçu
- Abonnements mensuels actifs

### Journal des dons

Tableau chronologique de tous les paiements reçus :
- Date, email, montant, type (unique/mensuel)

### Abonnements actifs

Liste des donations mensuelles en cours.

### Clés Stripe

Les clés sont stockées dans les **Supabase Secrets** (jamais dans le code) :
- `STRIPE_SECRET_KEY_TEST` : clé test
- `STRIPE_SECRET_KEY_LIVE` : clé live restreinte

Le mode actif est stocké dans `app_settings` (clé `stripe_mode`).

---

## 11. Annonce d'accueil

Accessible via **Admin → Annonce**.

Permet de publier un message visible par tous les visiteurs sur la page d'accueil, dans un bandeau coloré sous le hero.

### Fonctionnement

- Rédigez le message en **Markdown** (gras, liens, listes supportés)
- Cliquez **Publier l'annonce** pour l'afficher
- Cliquez **Supprimer l'annonce** pour masquer le bandeau
- Un bouton **Prévisualiser** montre le rendu avant publication
- Si le contenu est vide, le bandeau n'apparaît pas

Le bandeau s'adapte automatiquement au thème choisi par l'utilisateur (couleurs différentes par thème).

---

## 12. Fonctionnalités éditoriales

### Proposer comme modèle (depuis le forum)

Les admins/modérateurs voient un bouton **"Proposer comme modèle"** sous chaque post du forum. Cela crée un modèle pré-rempli avec le contenu de la discussion et un lien dans la table `post_model_links`.

### Journal d'évolution multi-auteurs

En mode édition, la section "Journal d'évolution" permet de :
- Décrire ce qui a changé
- Créditer plusieurs contributeurs via un sélecteur
- L'entrée est ajoutée automatiquement avec version et date

### Approche associée

Les outils et problématiques peuvent être rattachés à une approche via un sélecteur visible en mode édition et dans le formulaire de contribution. Sur la fiche d'une approche, un bloc affiche automatiquement tous les modèles rattachés.

### Traduction des modèles

Les administrateurs peuvent créer des traductions de modèles :

1. Ouvrez la fiche d'un modèle existant
2. Sous les tags, cliquez sur **"Créer la version anglaise"** (ou "Créer la version française")
3. Un nouveau modèle est créé dans l'autre langue, lié à l'original via `translation_of`
4. Le titre est copié, mais la description et les sections sont vides
5. Deux options pour rédiger la traduction :
   - **Modifier** : écrire directement dans l'éditeur
   - **Importer une fiche** : coller du markdown traduit via la page d'import

Une fois la traduction rédigée, les deux fiches affichent un lien pour basculer entre les versions (**"View in English"** / **"Voir en français"**).

#### Import avec choix de langue

La page d'import (**Admin → Importer un modèle**) dispose d'un sélecteur **FR | EN** qui définit la langue du modèle importé. Le badge de langue est visible dans la prévisualisation.

### Date de création (admin)

Les administrateurs peuvent modifier la **date de création** d'un modèle via le champ date en mode édition. Utile pour antidater des modèles qui existaient avant la plateforme.

### Modification des profils (admin)

Les administrateurs peuvent modifier le profil de n'importe quel utilisateur :
1. Allez sur la page **Contributeurs** ou le profil public d'un utilisateur
2. Cliquez sur **"Modifier le profil"** en haut à droite
3. Modifiez le CV, les liens personnels, la bio, l'expertise
4. Cliquez **Sauvegarder**

L'URL est `/profile?user=<userId>` — le paramètre `user` permet à l'admin d'éditer un profil autre que le sien.

### Protection anti-bot à l'inscription

Quatre mécanismes protègent le formulaire d'inscription :

| Protection | Fonctionnement |
|------------|----------------|
| **Honeypot** | Champ invisible rempli uniquement par les bots — inscription silencieusement bloquée |
| **Question PNL** | "La carte n'est pas le ..." — seul un praticien PNL connaît la réponse |
| **Validation du nom** | Rejette les noms suspects (chiffres seuls, URLs, caractères spéciaux) |
| **Confirmation email** | Le compte n'est actif qu'après clic sur le lien de confirmation dans l'email (paramètre "Confirm email" dans Supabase → Authentication → Providers → Email) |
| **Accès restreint** | Seules la page d'accueil, la page de connexion et la page de dons sont accessibles sans compte. Toutes les autres pages redirigent vers la connexion |

### Gestion des articles Ressources

Les admins/modérateurs peuvent créer, modifier et supprimer des articles markdown dans la section Ressources. Support de l'upload d'images dans le contenu.

---

## 13. Statistiques de visite

Le site utilise **Umami** (cloud.umami.is) pour les statistiques de visite. Umami est un outil open source, sans cookies, conforme RGPD — aucun bandeau de consentement n'est nécessaire.

### Accès

Connectez-vous sur **cloud.umami.is** avec le compte configuré. Le dashboard affiche :
- Pages vues et visiteurs uniques
- Sources de trafic (referrers)
- Pays et langues des visiteurs
- Appareils et navigateurs
- Pages les plus consultées

### Fonctionnement

Un script léger (~2 KB) est chargé dans chaque page. Il envoie les données de navigation à Umami Cloud sans stocker de cookies ni de données personnelles sur le navigateur du visiteur.

Le plan gratuit permet 10 000 événements par mois — largement suffisant pour le trafic actuel.

---

## 14. PWA (Progressive Web App)

Le site est installable comme une application mobile. Les fichiers PWA sont :

- **`manifest.json`** : nom, icone, couleurs, mode d'affichage (standalone)
- **`sw.js`** : service worker avec strategie network-first
  - Les requetes vers Supabase, Stripe et Umami ne sont jamais interceptees
  - Les pages visitees sont mises en cache pour un acces hors-ligne
  - Le cache est automatiquement nettoye lors des mises a jour

Le service worker ne modifie pas le comportement en ligne de l'application. Il sert uniquement de fallback quand le reseau est indisponible.

Pour forcer une mise a jour du cache apres un deploiement, incrementez `CACHE_NAME` dans `sw.js`.

---

## 15. Sécurité et clés API

### Clés côté client (publiques)

Stockées dans `.env` (non commité dans git) :
- `VITE_SUPABASE_URL` : URL du projet Supabase
- `VITE_SUPABASE_PUBLISHABLE_KEY` : clé anon Supabase (conçue pour être publique, protégée par RLS)

Un fichier `.env.example` documente les variables nécessaires sans les valeurs.

### Clés côté serveur (secrètes)

Stockées dans les **Supabase Secrets** (inaccessibles depuis le client) :
- `STRIPE_SECRET_KEY_TEST` : clé Stripe test
- `STRIPE_SECRET_KEY_LIVE` : clé Stripe live restreinte (permissions : Checkout Sessions Write, Products/Prices Read)
- `SUPABASE_SERVICE_ROLE_KEY` : clé service Supabase (auto-configurée)

### Edge Functions

Les fonctions Supabase Edge s'exécutent côté serveur :
- `create-donation` : crée une session Stripe Checkout (sans vérification JWT — accessible à tous)
- `list-donations` : liste les paiements Stripe (vérifie que l'utilisateur est admin dans le code)
- `send-event-email` : envoi d'emails aux participants
- `send-model-notification` : notifications de changement

### Bonnes pratiques

- Le `.env` est dans le `.gitignore` — ne jamais le commiter
- Les clés Stripe secrètes ne transitent jamais par le navigateur
- La clé live Stripe est restreinte (permissions minimales)
- Le mode test/live est contrôlable depuis l'interface admin

---

*PNL Lab R&D — Guide Administrateur*
