-- Table resources pour les articles
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  category text DEFAULT 'article',
  sort_order int DEFAULT 0,
  published boolean DEFAULT true,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published resources" ON resources FOR SELECT TO public USING (published = true);
CREATE POLICY "Manager read all resources" ON resources FOR SELECT TO authenticated
  USING (has_role('admin', auth.uid()) OR has_role('moderator', auth.uid()));
CREATE POLICY "Manager insert resources" ON resources FOR INSERT TO authenticated
  WITH CHECK (has_role('admin', auth.uid()) OR has_role('moderator', auth.uid()));
CREATE POLICY "Manager update resources" ON resources FOR UPDATE TO authenticated
  USING (has_role('admin', auth.uid()) OR has_role('moderator', auth.uid()));
CREATE POLICY "Manager delete resources" ON resources FOR DELETE TO authenticated
  USING (has_role('admin', auth.uid()) OR has_role('moderator', auth.uid()));

-- Seed : Guide du Modélisateur
INSERT INTO resources (title, slug, content, category, sort_order) VALUES (
  'Guide du Modélisateur',
  'guide-du-modelisateur',
  '# Guide du Modélisateur

Ce guide décrit le processus standard pour créer, documenter et soumettre un modèle PNL au Lab R&D. Suivez ces étapes pour contribuer des modèles de qualité à la communauté.

## 1. Identifier le phénomène

Observez et décrivez précisément le pattern, la compétence ou le processus que vous souhaitez modéliser. Collectez des exemples concrets et variés. Soyez spécifique : « Comment fait X pour obtenir Y dans le contexte Z ? »

## 2. Observer et collecter

Utilisez l''observation multi-niveaux (comportements, stratégies cognitives, croyances, états internes). Interviewez les experts. Filmez les démonstrations. Notez les patterns récurrents et les différences entre experts et novices.

## 3. Structurer le modèle

Organisez vos observations en une structure transmissible : prérequis, étapes séquentielles, points de décision, indicateurs de réussite. Distinguez les éléments essentiels des éléments accessoires.

## 4. Tester et itérer

Enseignez le modèle à des praticiens de différents niveaux. Observez ce qui fonctionne et ce qui pose problème. Recueillez les feedbacks structurés. Affinez le modèle sur la base des retours terrain.

## 5. Documenter et partager

Rédigez une documentation complète : contexte, protocole détaillé, cas d''application, contre-indications, résultats attendus. Soumettez au Lab R&D pour validation et publication.',
  'guide',
  1
);

-- Seed : Glossaire PNL
INSERT INTO resources (title, slug, content, category, sort_order) VALUES (
  'Glossaire PNL',
  'glossaire-pnl',
  '# Glossaire PNL

## Concepts

### Carte du monde
Représentation subjective de la réalité propre à chaque individu, construite à travers ses filtres perceptuels (croyances, valeurs, expériences). « La carte n''est pas le territoire. »

### Congruence
Alignement entre le message verbal et le comportement non-verbal d''une personne. État où toutes les parties internes sont en accord.

### Croyance
Généralisation que nous faisons sur nous-mêmes, les autres ou le monde. Peut être aidante (ressource) ou limitante (obstacle). Opère souvent hors de la conscience.

### Écologie
Vérification que le changement souhaité est compatible avec l''ensemble du système de la personne (valeurs, relations, santé). Respect de l''équilibre global.

### État de ressource
État interne positif et puissant (confiance, calme, créativité) dans lequel la personne dispose de toutes ses capacités pour agir efficacement.

### Modélisation
Processus central de la PNL : étudier et reproduire les stratégies, croyances et comportements d''une personne excellente dans un domaine pour les enseigner à d''autres.

### Parties (internes)
Métaphore désignant les différentes facettes de notre personnalité qui peuvent avoir des objectifs contradictoires. Le travail avec les parties vise l''intégration et la négociation.

### Présupposés de la PNL
Ensemble de croyances opérationnelles qui guident la pratique PNL. Exemples : « La carte n''est pas le territoire », « Il n''y a pas d''échec, seulement du feedback ».

### Stratégie
Séquence spécifique de représentations internes (visuelles, auditives, kinesthésiques) qu''une personne utilise pour accomplir une tâche. Peut être décodée et modifiée.

### Submodalités
Caractéristiques fines des représentations sensorielles (luminosité, taille, distance pour le visuel ; volume, ton pour l''auditif ; pression, température pour le kinesthésique).

## Techniques

### Ancrage
Processus par lequel un stimulus externe (toucher, son, image) est associé à un état interne (émotion, ressource). Permet de retrouver un état désiré à volonté en réactivant le stimulus.

### Dissociation
Technique consistant à observer une expérience depuis l''extérieur, comme spectateur. Permet de réduire l''impact émotionnel d''un souvenir ou d''une situation.

### Ligne du temps (Timeline)
Représentation mentale spatiale de la façon dont une personne organise ses souvenirs passés, présents et futurs. Utilisée pour le travail thérapeutique sur les traumatismes et la planification.

### Pont vers le futur
Technique de visualisation où la personne s''imagine dans une situation future en utilisant les nouvelles ressources acquises. Consolide les apprentissages.

### Recadrage
Technique consistant à changer le cadre de référence d''une situation pour en modifier le sens et la réponse émotionnelle. Peut être de contexte (où ce comportement est-il utile ?) ou de contenu (quelle autre signification possible ?).

### Swish pattern
Technique utilisant les submodalités pour remplacer automatiquement une image déclencheur (état problème) par une image ressource (état désiré).

## Compétences

### Calibration
Observation fine et systématique des signaux non-verbaux d''une personne (micro-expressions, posture, respiration, ton de voix) pour détecter ses changements d''état interne.

### Rapport
Qualité de la relation de confiance et d''harmonie entre deux personnes. Se construit par la synchronisation, le respect et l''écoute active. Fondation de tout travail en PNL.

### Synchronisation
Technique de création de rapport par l''ajustement subtil du langage corporel, du rythme vocal et du vocabulaire à ceux de l''interlocuteur.

## Modèles

### Méta-modèle
Ensemble de questions linguistiques précises visant à clarifier, spécifier et enrichir la communication. Permet de retrouver l''expérience profonde derrière les mots (généralisations, distorsions, omissions).

### Méta-programme
Filtres inconscients qui déterminent comment nous traitons l''information et orientons notre attention. Exemples : global/détail, vers/loin de, interne/externe.

### Milton-modèle
Patterns linguistiques volontairement vagues et hypnotiques inspirés de Milton Erickson. Utilise des généralisations, des présuppositions et des ambiguïtés pour faciliter le changement inconscient.

### Niveaux logiques
Modèle de Robert Dilts organisant l''expérience en niveaux hiérarchiques : environnement, comportements, capacités, croyances/valeurs, identité, transpersonnel.

### Système de représentation (VAKOG)
Les cinq canaux sensoriels par lesquels nous percevons et organisons l''information : Visuel, Auditif, Kinesthésique, Olfactif, Gustatif.

## Présupposés

### Intention positive
Présupposé fondamental en PNL : tout comportement, même problématique, a une fonction positive sous-jacente. L''objectif est de trouver des comportements alternatifs qui satisfont cette intention.',
  'glossaire',
  2
);

-- Seed : Critères de qualité
INSERT INTO resources (title, slug, content, category, sort_order) VALUES (
  'Critères de qualité d''un modèle',
  'criteres-de-qualite',
  '# Critères de qualité d''un modèle

Chaque modèle soumis au Lab R&D est évalué selon ces critères. Ils garantissent la rigueur et l''utilité pratique des modèles publiés.

1. **Basé sur l''observation** — Le modèle est basé sur l''observation directe (pas uniquement théorique)
2. **Protocole reproductible** — Le protocole est suffisamment détaillé pour être reproduit par un praticien formé
3. **Prérequis identifiés** — Les prérequis et contre-indications sont clairement identifiés
4. **Cas documentés** — Au moins 3 cas d''application documentés avec résultats
5. **Éthique PNL** — Le modèle respecte les présupposés éthiques de la PNL
6. **Vérification écologique** — La vérification écologique est intégrée au processus
7. **Variations contextuelles** — Les variations contextuelles sont mentionnées
8. **Limites honnêtes** — Les limites du modèle sont honnêtement décrites',
  'guide',
  3
);
