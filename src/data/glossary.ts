export interface GlossaryEntry {
  term: string;
  definition: string;
  category: string;
}

export const glossaryData: GlossaryEntry[] = [
  { term: "Ancrage", definition: "Processus par lequel un stimulus externe (toucher, son, image) est associé à un état interne (émotion, ressource). Permet de retrouver un état désiré à volonté en réactivant le stimulus.", category: "Technique" },
  { term: "Calibration", definition: "Observation fine et systématique des signaux non-verbaux d'une personne (micro-expressions, posture, respiration, ton de voix) pour détecter ses changements d'état interne.", category: "Compétence" },
  { term: "Carte du monde", definition: "Représentation subjective de la réalité propre à chaque individu, construite à travers ses filtres perceptuels (croyances, valeurs, expériences). « La carte n'est pas le territoire. »", category: "Concept" },
  { term: "Congruence", definition: "Alignement entre le message verbal et le comportement non-verbal d'une personne. État où toutes les parties internes sont en accord.", category: "Concept" },
  { term: "Croyance", definition: "Généralisation que nous faisons sur nous-mêmes, les autres ou le monde. Peut être aidante (ressource) ou limitante (obstacle). Opère souvent hors de la conscience.", category: "Concept" },
  { term: "Dissociation", definition: "Technique consistant à observer une expérience depuis l'extérieur, comme spectateur. Permet de réduire l'impact émotionnel d'un souvenir ou d'une situation.", category: "Technique" },
  { term: "Écologie", definition: "Vérification que le changement souhaité est compatible avec l'ensemble du système de la personne (valeurs, relations, santé). Respect de l'équilibre global.", category: "Concept" },
  { term: "État de ressource", definition: "État interne positif et puissant (confiance, calme, créativité) dans lequel la personne dispose de toutes ses capacités pour agir efficacement.", category: "Concept" },
  { term: "Intention positive", definition: "Présupposé fondamental en PNL : tout comportement, même problématique, a une fonction positive sous-jacente. L'objectif est de trouver des comportements alternatifs qui satisfont cette intention.", category: "Présupposé" },
  { term: "Ligne du temps (Timeline)", definition: "Représentation mentale spatiale de la façon dont une personne organise ses souvenirs passés, présents et futurs. Utilisée pour le travail thérapeutique sur les traumatismes et la planification.", category: "Technique" },
  { term: "Méta-modèle", definition: "Ensemble de questions linguistiques précises visant à clarifier, spécifier et enrichir la communication. Permet de retrouver l'expérience profonde derrière les mots (généralisations, distorsions, omissions).", category: "Modèle" },
  { term: "Méta-programme", definition: "Filtres inconscients qui déterminent comment nous traitons l'information et orientons notre attention. Exemples : global/détail, vers/loin de, interne/externe.", category: "Modèle" },
  { term: "Milton-modèle", definition: "Patterns linguistiques volontairement vagues et hypnotiques inspirés de Milton Erickson. Utilise des généralisations, des présuppositions et des ambiguïtés pour faciliter le changement inconscient.", category: "Modèle" },
  { term: "Modélisation", definition: "Processus central de la PNL : étudier et reproduire les stratégies, croyances et comportements d'une personne excellente dans un domaine pour les enseigner à d'autres.", category: "Concept" },
  { term: "Niveaux logiques", definition: "Modèle de Robert Dilts organisant l'expérience en niveaux hiérarchiques : environnement, comportements, capacités, croyances/valeurs, identité, transpersonnel.", category: "Modèle" },
  { term: "Parties (internes)", definition: "Métaphore désignant les différentes facettes de notre personnalité qui peuvent avoir des objectifs contradictoires. Le travail avec les parties vise l'intégration et la négociation.", category: "Concept" },
  { term: "Pont vers le futur", definition: "Technique de visualisation où la personne s'imagine dans une situation future en utilisant les nouvelles ressources acquises. Consolide les apprentissages.", category: "Technique" },
  { term: "Présupposés de la PNL", definition: "Ensemble de croyances opérationnelles qui guident la pratique PNL. Exemples : « La carte n'est pas le territoire », « Il n'y a pas d'échec, seulement du feedback ».", category: "Concept" },
  { term: "Rapport", definition: "Qualité de la relation de confiance et d'harmonie entre deux personnes. Se construit par la synchronisation, le respect et l'écoute active. Fondation de tout travail en PNL.", category: "Compétence" },
  { term: "Recadrage", definition: "Technique consistant à changer le cadre de référence d'une situation pour en modifier le sens et la réponse émotionnelle. Peut être de contexte (où ce comportement est-il utile ?) ou de contenu (quelle autre signification possible ?).", category: "Technique" },
  { term: "Stratégie", definition: "Séquence spécifique de représentations internes (visuelles, auditives, kinesthésiques) qu'une personne utilise pour accomplir une tâche. Peut être décodée et modifiée.", category: "Concept" },
  { term: "Submodalités", definition: "Caractéristiques fines des représentations sensorielles (luminosité, taille, distance pour le visuel ; volume, ton pour l'auditif ; pression, température pour le kinesthésique).", category: "Concept" },
  { term: "Synchronisation", definition: "Technique de création de rapport par l'ajustement subtil du langage corporel, du rythme vocal et du vocabulaire à ceux de l'interlocuteur.", category: "Compétence" },
  { term: "Système de représentation (VAKOG)", definition: "Les cinq canaux sensoriels par lesquels nous percevons et organisons l'information : Visuel, Auditif, Kinesthésique, Olfactif, Gustatif.", category: "Modèle" },
  { term: "Swish pattern", definition: "Technique utilisant les submodalités pour remplacer automatiquement une image déclencheur (état problème) par une image ressource (état désiré).", category: "Technique" },
];

export const glossaryCategories = [...new Set(glossaryData.map(e => e.category))].sort();
