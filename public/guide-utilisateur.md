# Guide Utilisateur — PNL Lab R&D Collective

> Plateforme collaborative de recherche et développement en Programmation Neuro-Linguistique.

---

## Table des matières

1. [Premiers pas](#1-premiers-pas)
2. [Navigation](#2-navigation)
3. [Accueil](#3-accueil)
4. [Bibliothèque de modèles](#4-bibliothèque-de-modèles)
5. [Détail d'un modèle](#5-détail-dun-modèle)
6. [Contribuer un modèle](#6-contribuer-un-modèle)
7. [Importer un modèle (admin)](#7-importer-un-modèle-admin)
8. [Communauté](#8-communauté)
9. [Événements](#9-événements)
10. [Ressources](#10-ressources)
11. [Profil](#11-profil)
12. [Notifications](#12-notifications)
13. [Administration](#13-administration)
14. [Rôles et permissions](#14-rôles-et-permissions)
15. [Format des fiches d'import](#15-format-des-fiches-dimport)

---

## 1. Premiers pas

### Créer un compte

1. Cliquez sur **Se connecter** en haut à droite
2. Cliquez sur **S'inscrire**
3. Remplissez :
   - **Nom d'affichage** : votre nom tel qu'il apparaîtra sur la plateforme
   - **Email** : votre adresse email
   - **Mot de passe** : minimum 6 caractères
4. Cliquez sur **Créer le compte**

Le premier utilisateur inscrit sur la plateforme reçoit automatiquement le rôle **administrateur**.

### Se connecter

1. Cliquez sur **Se connecter**
2. Entrez votre email et mot de passe
3. Cliquez sur **Se connecter**

### Mot de passe oublié

1. Sur la page de connexion, cliquez sur **Mot de passe oublié ?**
2. Entrez votre email
3. Cliquez sur **Envoyer le lien**
4. Consultez votre boîte mail et suivez le lien de réinitialisation

---

## 2. Navigation

La barre de navigation en haut de l'écran donne accès à toutes les sections :

| Lien | Description |
|------|-------------|
| **Accueil** | Tableau de bord avec statistiques et vue Kanban |
| **Bibliothèque** | Explorer et rechercher les modèles PNL |
| **Événements** | Consulter et s'inscrire aux événements |
| **Contribuer** | Proposer un nouveau modèle |
| **Communauté** | Forum de discussion |
| **Ressources** | Glossaire PNL, guide et critères qualité |

En haut à droite, les utilisateurs connectés voient également :
- La **cloche de notifications** (avec badge de compteur)
- Le lien **Admin** (visible uniquement pour les administrateurs)
- Le lien vers leur **profil**
- Le bouton **Déconnexion**

Sur mobile, la navigation se replie dans un menu hamburger.

---

## 3. Accueil

La page d'accueil offre une vue d'ensemble de l'activité de la plateforme.

### Statistiques

Quatre cartes affichent en temps réel :
- **Modèles** : nombre total de modèles
- **Publiés** : modèles au statut "Publié"
- **Variations** : nombre total de variations proposées
- **Contributeurs** : nombre de contributeurs uniques

### Modèles en développement (Kanban)

Un tableau Kanban à 5 colonnes montre la progression des modèles dans le pipeline :

| Colonne | Signification |
|---------|---------------|
| Brouillon | Modèle en cours de rédaction |
| En révision | Soumis pour relecture |
| En test | En phase de validation |
| Publié | Validé et accessible à tous |
| En évolution | Publié mais en cours d'amélioration |

Cliquez sur un modèle dans le Kanban pour accéder à sa fiche détaillée.

### Modèles récents

Les 6 derniers modèles ajoutés sont affichés sous forme de cartes avec leur type, statut, tags et statistiques.

---

## 4. Bibliothèque de modèles

### Rechercher un modèle

Utilisez la **barre de recherche** pour filtrer par titre ou tag.

### Filtrer

Deux menus déroulants permettent de combiner les filtres :
- **Type** : Tous les types / Problématique / Outil / Approche
- **Statut** : Tous les statuts / Brouillon / En révision / En test / Publié / En évolution

### Informations affichées

Chaque carte de modèle montre :
- Type (badge coloré)
- Statut
- Titre et description (2 lignes max)
- Tags (3 premiers affichés)
- Version, auteur
- Compteurs : vues, variations, feedbacks

### Actions admin

Les administrateurs voient un bouton **En attente (N)** qui bascule l'affichage vers les modèles en attente de validation. Chaque modèle en attente peut être validé directement depuis sa carte.

---

## 5. Détail d'un modèle

La page de détail d'un modèle est organisée en onglets.

### En-tête

Affiche le titre, la description, les badges (type, statut, version), les tags, l'auteur et les compteurs (vues, variations, feedbacks).

#### Bouton Modifier

Si vous êtes **administrateur** ou **auteur du modèle**, un bouton **Modifier** apparaît en haut à droite. Il ouvre un formulaire d'édition inline permettant de modifier :
- Titre
- Type (Problématique / Outil / Approche)
- Complexité (Débutant / Intermédiaire / Avancé)
- Version
- Description
- Sections (dynamiques selon le type)
- Tags

Cliquez sur **Enregistrer** pour sauvegarder ou **Annuler** pour revenir à l'affichage.

#### Gestion du statut

Les administrateurs et auteurs peuvent changer le statut du modèle en cliquant sur l'un des boutons de progression :

```
Brouillon → En révision → En test → Publié → En évolution
```

#### Validation admin

Pour les modèles en attente, les administrateurs voient un bandeau de validation avec un bouton **Valider**.

### Onglet Présentation

Affiche les sections du modèle (structure, protocole, prérequis, etc.) dans des blocs distincts. Les sections affichées dépendent de ce qui a été renseigné.

### Onglet Historique

Affiche le changelog du modèle : version, date et description des changements pour chaque entrée.

### Onglet Variations

Les utilisateurs connectés peuvent **proposer une variation** du modèle :
1. Cliquez sur **Proposer une variation**
2. Remplissez le titre et la description
3. Cliquez sur **Soumettre**

Toutes les variations sont listées avec leur auteur et date.

### Onglet Feedback

Les utilisateurs connectés peuvent **donner un feedback** :
1. Cliquez sur **Donner un feedback**
2. Attribuez une note de 1 à 5 étoiles
3. Rédigez votre retour d'expérience
4. Cliquez sur **Envoyer**

Tous les feedbacks sont listés avec la note, l'auteur et la date.

---

## 6. Contribuer un modèle

Accessible via le menu **Contribuer** (nécessite d'être connecté).

### Formulaire

| Champ | Description | Obligatoire |
|-------|-------------|:-----------:|
| Titre | Nom du modèle (max 200 car.) | Oui |
| Type | Problématique, Outil ou Approche | Oui |
| Complexité | Débutant, Intermédiaire ou Avancé | Non |
| Description | Présentation du modèle (max 5000 car.) | Oui |
| Sections | Dépendent du type choisi (voir ci-dessous) | Non |
| Tags | Mots-clés séparés par des virgules | Non |

### Sections par type

| Type | Sections proposées |
|------|-------------------|
| **Problématique** | Patterns identifiés, Prérequis |
| **Outil** | Protocole détaillé, Prérequis |
| **Approche** | Philosophie et principes, Prérequis |

### Workflow de publication

1. Vous soumettez votre modèle → statut **En attente de validation**
2. Un administrateur valide → le modèle passe en **Brouillon**
3. Vous faites progresser le modèle : Brouillon → En révision → En test → **Publié**

---

## 7. Importer un modèle (admin)

L'import permet de créer ou mettre à jour un modèle à partir d'une **fiche markdown structurée**. Cette fonctionnalité est réservée aux administrateurs.

### Accès

1. Allez dans **Admin**
2. Cliquez sur **Importer un modèle**

### Workflow d'import

1. **Collez** la fiche markdown dans la zone de texte (ou cliquez sur **Charger l'exemple** pour voir le format)
2. Cliquez sur **Prévisualiser**
3. Vérifiez la prévisualisation :
   - Le badge indique s'il s'agit d'une **Création** ou d'une **Mise à jour**
   - Les métadonnées (type, statut, version, tags) sont affichées
   - Les sections sont prévisualisées
4. Cliquez sur **Créer le modèle** ou **Mettre à jour le modèle**

### Détection automatique

L'import détecte intelligemment si le modèle existe déjà en cherchant par titre :

| Fiche indique | Modèle existe ? | Résultat | Message |
|---------------|:--------------:|----------|---------|
| `action: create` | Non | Création | "Aucun modèle existant — nouveau modèle" |
| `action: create` | Oui | Mise à jour | Avertissement : le modèle sera mis à jour, pas de doublon |
| `action: update` | Oui | Mise à jour | "Modèle existant trouvé" |
| `action: update` | Non | Création | Avertissement : un nouveau modèle sera créé |

Les modèles créés par import sont automatiquement **approuvés**.

### Format de la fiche

Voir la section [Format des fiches d'import](#15-format-des-fiches-dimport) pour le détail du format markdown attendu.

---

## 8. Communauté

Le forum communautaire permet aux membres de partager des discussions, questions et retours d'expérience.

### Catégories

| Catégorie | Description |
|-----------|-------------|
| Général | Discussions libres |
| Modèles | Discussions autour des modèles PNL |
| Expériences | Retours d'expérience terrain |
| Questions | Questions à la communauté |
| Ressources | Partage de ressources utiles |

### Créer un post

1. Cliquez sur **Nouveau post** (nécessite d'être connecté)
2. Remplissez :
   - **Titre** (max 200 car.)
   - **Contenu** (max 5000 car.)
   - **Catégorie** (sélecteur)
   - **Modèle associé** (optionnel — lie le post à un modèle existant)
3. Cliquez sur **Publier**

### Interagir

- **Liker** un post : cliquez sur le bouton coeur (cliquez à nouveau pour retirer le like)
- **Commenter** : cliquez sur l'icône commentaire, puis rédigez votre commentaire et cliquez sur envoyer
- **Filtrer** : cliquez sur une catégorie pour ne voir que ses posts

---

## 9. Événements

La section Événements permet de planifier et s'inscrire à des ateliers et formations.

### Consulter les événements

Les événements sont organisés en deux groupes :
- **Événements à venir** : triés par date
- **Événements passés** : archivés

Chaque événement affiche : titre, description, date, heure, durée et nombre de participants inscrits.

### S'inscrire

1. Cliquez sur **S'inscrire** sur un événement à venir
2. Le lien Zoom devient visible après inscription
3. Pour vous désinscrire, cliquez sur **Se désinscrire**

L'inscription est désactivée quand le nombre maximum de participants est atteint.

### Créer un événement (admin)

Les administrateurs peuvent créer des événements en remplissant :

| Champ | Description |
|-------|-------------|
| Titre | Nom de l'événement (max 200 car.) |
| Description | Détail de l'événement (max 2000 car.) |
| Date | Date de l'événement |
| Heure | Heure de début (défaut : 19h00) |
| Durée | De 15 à 480 minutes |
| Lien Zoom | URL de la visioconférence |
| Max participants | Limite optionnelle |

### Envoyer un email aux participants (admin)

Les administrateurs peuvent envoyer un email à tous les inscrits d'un événement :
1. Cliquez sur l'icône email de l'événement
2. Remplissez le sujet et le contenu
3. Cliquez sur **Envoyer**

---

## 10. Ressources

La section Ressources contient trois onglets.

### Guide du Modélisateur

Un guide en 5 étapes pour créer un modèle PNL :

1. **Identifier le phénomène** — Observer une compétence ou un comportement remarquable
2. **Observer et collecter** — Recueillir des données sensorielles précises (VAKOG)
3. **Structurer** — Organiser les patterns dans un modèle cohérent
4. **Tester et itérer** — Valider avec d'autres praticiens, ajuster
5. **Documenter** — Rédiger une fiche complète et partageable

### Glossaire PNL

Un glossaire de **33+ termes** PNL avec :
- **Recherche** par nom de terme ou contenu de définition
- **Filtre par catégorie**
- Définition détaillée pour chaque terme (cliquez pour déplier)

### Critères de qualité

8 critères pour évaluer la qualité d'un modèle PNL :

1. Basé sur l'observation (pas seulement théorique)
2. Protocole détaillé permettant la réplication
3. Prérequis et contre-indications clairement établis
4. Au moins 3 cas d'usage documentés
5. Respect de l'éthique PNL
6. Validation écologique intégrée
7. Variations contextuelles mentionnées
8. Description honnête des limites

---

## 11. Profil

Accessible en cliquant sur **Profil** dans la navigation (utilisateur connecté).

### Informations modifiables

| Champ | Description |
|-------|-------------|
| **Avatar** | Cliquez sur l'icône appareil photo pour uploader une image (max 2 Mo) |
| **Nom d'affichage** | Votre nom sur la plateforme (max 100 car.) |
| **Bio** | Courte présentation (max 500 car., compteur affiché) |
| **Expertise** | Tags de compétences. Tapez un mot-clé et appuyez sur Entrée ou cliquez sur Ajouter. Cliquez sur × pour retirer un tag. |

Cliquez sur **Enregistrer** pour sauvegarder vos modifications.

---

## 12. Notifications

### Cloche de notifications

Une cloche dans la barre de navigation affiche le nombre de notifications non lues (badge rouge). Cliquez dessus pour ouvrir le panneau.

### Types de notifications

| Type | Déclencheur |
|------|------------|
| Feedback | Quelqu'un a posté un feedback sur votre modèle |
| Variation | Quelqu'un a proposé une variation de votre modèle |
| Post | Un post du forum a été lié à votre modèle |
| Changement de statut | Le statut de votre modèle a changé |

### Actions

- Cliquez sur une notification pour accéder au modèle concerné
- Cliquez sur **Tout marquer comme lu** pour effacer le badge
- Les 20 dernières notifications sont affichées
- Les notifications arrivent **en temps réel** (pas besoin de rafraîchir la page)

---

## 13. Administration

La page Admin est accessible uniquement aux administrateurs via le lien **Admin** dans la navigation.

### Tableau de bord

Six cartes statistiques :
- Modèles en attente de validation (mis en évidence)
- Modèles validés
- Total des modèles
- Nombre d'utilisateurs
- Nombre de posts forum
- Modèles publiés

Distribution par statut affichée en dessous.

### Onglets

#### Modèles en attente

Liste des modèles non encore validés. Pour chaque modèle :
- **Voir** : accéder à la fiche détaillée
- **Rejeter** : supprimer le modèle
- **Valider** : approuver le modèle (il devient visible dans la bibliothèque)

#### Modèles validés

Liste de tous les modèles approuvés avec leur type, auteur, statut, vues et feedbacks. Cliquez pour accéder au détail.

#### Activité récente

Les 8 derniers modèles modifiés avec indicateur de statut d'approbation.

#### Utilisateurs

Tableau de tous les utilisateurs avec :
- Nom et avatar
- Date d'inscription
- Rôle actuel (Admin ou Utilisateur)
- Bouton **Promouvoir admin** / **Retirer admin** (impossible de modifier son propre rôle)

### Export de données

Trois boutons permettent d'exporter les données en CSV :
- **Modèles CSV** : tous les modèles avec métadonnées
- **Utilisateurs CSV** : liste des utilisateurs et rôles
- **Posts CSV** : publications du forum

### Import de modèle

Le bouton **Importer un modèle** mène à la page d'import markdown (voir section [7](#7-importer-un-modèle-admin)).

---

## 14. Rôles et permissions

### Visiteur (non connecté)

- Consulter les modèles publiés et approuvés
- Lire les posts du forum
- Voir les événements
- Consulter le glossaire et les ressources

### Utilisateur connecté

Tout ce qu'un visiteur peut faire, plus :
- Créer et modifier ses propres modèles
- Proposer des variations et feedbacks
- Publier et commenter dans le forum
- Liker des posts
- S'inscrire aux événements
- Gérer son profil
- Recevoir des notifications

### Administrateur

Tout ce qu'un utilisateur peut faire, plus :
- Valider ou rejeter les modèles en attente
- Modifier n'importe quel modèle
- Créer et supprimer des événements
- Envoyer des emails aux participants
- Gérer les rôles des utilisateurs
- Importer des modèles via fiche markdown
- Exporter les données en CSV
- Accéder au tableau de bord admin

---

## 15. Format des fiches d'import

Les fiches d'import utilisent un format markdown avec un frontmatter YAML.

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
  - tag3
---

## Description

Description concise du modèle en 1 à 3 phrases.

## Sections

### structure

Structure et composants du modèle.

### protocol

Étapes numérotées du protocole.

### patterns

Patterns comportementaux observés.

### philosophy

Fondements théoriques et philosophiques.

### prerequisites

Prérequis pour utiliser ce modèle.

### toolkit

Outils et techniques associés.
```

### Champs du frontmatter

| Champ | Valeurs possibles | Obligatoire |
|-------|-------------------|:-----------:|
| `action` | `create` (nouveau) ou `update` (modifier) | Oui |
| `title` | Texte libre entre guillemets | Oui |
| `type` | `problematique`, `outil`, `approche` | Oui |
| `status` | `brouillon`, `en_revision`, `en_test`, `publie`, `en_evolution` | Oui |
| `version` | Versionnement sémantique (ex: `"1.0.0"`) | Oui |
| `complexity` | `débutant`, `intermédiaire`, `avancé` | Oui |
| `tags` | Liste YAML de mots-clés | Non |

### Sections disponibles

N'incluez que les sections pour lesquelles vous avez du contenu. Il n'est pas nécessaire de toutes les remplir.

| Section | Quand l'utiliser |
|---------|-----------------|
| `structure` | Architecture ou composants du modèle |
| `protocol` | Étapes d'exécution ou de mise en oeuvre |
| `patterns` | Patterns comportementaux ou linguistiques observés |
| `philosophy` | Fondements théoriques, références aux auteurs |
| `prerequisites` | Connaissances, compétences ou conditions préalables |
| `toolkit` | Outils et techniques associés à une approche |

### Pertinence des sections par type

| Section | Problématique | Outil | Approche |
|---------|:---:|:---:|:---:|
| `structure` | Pertinent | Pertinent | Pertinent |
| `protocol` | Rare | **Essentiel** | Optionnel |
| `patterns` | **Essentiel** | Optionnel | Optionnel |
| `philosophy` | Optionnel | Rare | **Essentiel** |
| `prerequisites` | Pertinent | Pertinent | Pertinent |
| `toolkit` | Rare | Optionnel | **Essentiel** |

### Versionnement

| Situation | Règle |
|-----------|-------|
| Nouveau modèle | `1.0.0` |
| Corrections mineures | Incrémenter le patch : `1.0.1` |
| Ajout de contenu | Incrémenter le minor : `1.1.0` |
| Refonte majeure | Incrémenter le major : `2.0.0` |

### Exemple complet

```markdown
---
action: create
title: "Le SOCCER"
type: outil
status: en_revision
version: "1.1.0"
complexity: avancé
tags:
  - SCORE
  - systémique
  - Bateson
---

## Description

Variante du SCORE remplaçant la cause par deux types de conditions
(initiales et de maintien), adoptant un paradigme systémique autopoïétique.

## Sections

### structure

Le SOCCER remplace le C (Cause) du SCORE par :

- **Conditions Initiales (Ci)** : ce qui amène le système dans l'état problème
- **Conditions de Maintien (Cm)** : ce qui maintient le système dans cet état

### protocol

1. **S — Symptôme** : Quel est le problème ?
2. **O — Objectif** : Que voulez-vous à la place ?
3. **C — Conditions Initiales** : Quelles conditions ont amené ce problème ?
4. **C — Conditions de Maintien** : Qu'est-ce qui maintient cet état ?
5. **E — Effets** : Quels effets produira le changement ?
6. **R — Ressources** : De quoi avez-vous besoin ?

### prerequisites

Connaissance du SCORE. Notions de systémique et d'homéostasie.
```

---

*PNL Lab R&D Collective — Guide Utilisateur*
