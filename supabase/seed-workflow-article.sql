-- Article Ressource : Workflow de création collaborative
-- À exécuter dans Supabase SQL Editor ou via la page Resources (admin)

INSERT INTO resources (title, slug, content, category, sort_order, published)
VALUES (
  'Workflow de création collaborative',
  'workflow-creation-collaborative',
  '# Workflow de création collaborative

> Comment un savoir de terrain devient un modèle structuré dans la bibliothèque PNL Lab.

---

## Le principe

La plateforme PNL Lab R&D Collective repose sur un cycle vertueux : les praticiens partagent leurs découvertes de terrain, la communauté les valide, et les éditeurs les structurent en fiches formelles. Chaque fiche reste **vivante** — elle évolue avec la pratique.

---

## Exemple : le Recadrage Somatique

### Étape 1 — Partage informel (Forum)

Marie est praticienne PNL. Lors d''une séance, elle remarque qu''elle utilise une façon particulière de recadrer les croyances limitantes en passant par le corps. Elle poste dans la **Communauté**, catégorie "Modèles" :

> *"Aujourd''hui avec un client j''ai fait un truc intéressant. Au lieu de challenger la croyance verbalement, je lui ai demandé de localiser la croyance dans son corps, puis de décrire sa texture/couleur/poids. Ensuite on a travaillé directement sur la sensation. Le recadrage s''est fait tout seul, sans argumentation. Quelqu''un a déjà expérimenté ça ?"*

Pas de template, pas de structure. Son langage à elle.

### Étape 2 — Maturation communautaire

D''autres praticiens répondent dans les commentaires :

- **Paul** : *"Oui ! Je fais pareil mais je passe par le mouvement plutôt que la texture. Ça marche très bien avec les kinesthésiques."*
- **Sophie** : *"Ça me rappelle le travail de Feldenkrais. La croyance a une signature somatique, c''est cohérent avec les sous-modalités."*
- **Marc** : *"J''ai testé cette semaine avec 2 clients. Les deux ont dit que c''était plus naturel que le recadrage classique."*

La discussion mûrit. Plusieurs praticiens ont **validé sur le terrain**.

### Étape 3 — Décision de structuration

Un **éditeur** (ou un modérateur) juge que la discussion a assez de substance. Il clique sur le bouton **"Proposer comme modèle"** qui apparaît sous chaque post du forum.

Cela ouvre le formulaire de contribution, **pré-rempli** avec :
- Le titre et le contenu de la discussion d''origine
- Un bandeau indiquant la discussion source
- Les noms des contributeurs actifs peuvent être ajoutés au journal

### Étape 4 — Rédaction de la fiche

L''éditeur complète le brouillon avec les sections structurées :

| Champ | Exemple |
|-------|---------|
| **Titre** | Recadrage somatique |
| **Type** | Outil |
| **Protocole** | Les étapes détaillées |
| **Principe actif** | Le mécanisme central du changement |
| **Points de vigilance** | Contre-indications et limites |
| **Variantes** | Les adaptations proposées par les praticiens |
| **Complexité** | Intermédiaire |
| **Tags** | croyances, corps, sous-modalités, kinesthésique |

Elle soumet → statut **Brouillon**.

### Étape 5 — Revue et publication

Un admin fait progresser la fiche dans le workflow :

```
Brouillon → En révision → En test → Publié
```

À la publication, le **journal d''évolution** reçoit sa première entrée :

| Version | Date | Contributeurs | Note |
|---------|------|---------------|------|
| v0.1 | 2026-03-15 | Marie, Paul, Sophie, Marc | Création initiale à partir de la discussion communautaire |

### Étape 6 — Évolution vivante

3 mois plus tard, des feedbacks sur la fiche apportent du nouveau :
- Un praticien signale que ça ne marche pas bien avec les clients très dissociés
- Un autre propose une variante avec visualisation

Un éditeur met à jour la fiche et ajoute une entrée au journal :

| Version | Date | Contributeurs | Note |
|---------|------|---------------|------|
| v0.2 | 2026-06-10 | Marie, Lucie | Ajout point de vigilance (dissociation) + variante visualisation |
| v0.1 | 2026-03-15 | Marie, Paul, Sophie, Marc | Création initiale |

Les **contributeurs** sont automatiquement calculés depuis l''ensemble des entrées du journal et affichés dans l''onglet Historique.

---

## Les 3 cercles de contribution

Le système reconnaît trois niveaux de participation :

### Cercle 1 — Éditeurs
Petit groupe maintenant la bibliothèque. Ils créent et publient les fiches, assurent la cohérence du corpus. Ce sont les admins et modérateurs de la plateforme.

### Cercle 2 — Groupe R&D
Praticiens engagés qui proposent des modèles, testent ceux des autres, documentent leurs retours de terrain. Ils sont nommés comme contributeurs dans le journal.

### Cercle 3 — Communauté élargie
L''ensemble des membres de l''Atelier PNL. Ils lisent, commentent, pratiquent, partagent des observations qui alimentent les mises à jour.

---

## Résumé du workflow

```
1. Partage informel      → Forum (sans template)
2. Validation terrain     → Commentaires des pairs
3. Structuration          → Bouton "Proposer comme modèle"
4. Rédaction              → Formulaire avec sections enrichies
5. Publication            → Workflow de statuts + journal v0.1
6. Évolution              → Feedbacks → mises à jour → journal v0.2+
```

Chaque fiche publiée porte la trace de tous ses contributeurs et de chaque étape de son évolution.',
  'article',
  10,
  true
);
