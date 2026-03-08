export type ModelType = 'problematique' | 'outil' | 'approche';
export type ModelStatus = 'brouillon' | 'en_revision' | 'en_test' | 'publie' | 'en_evolution';

export interface PNLModel {
  id: string;
  title: string;
  type: ModelType;
  status: ModelStatus;
  version: string;
  description: string;
  author: string;
  coAuthors: string[];
  createdAt: string;
  updatedAt: string;
  variationsCount: number;
  feedbackCount: number;
  views: number;
  complexity: 'débutant' | 'intermédiaire' | 'avancé';
  tags: string[];
  sections?: {
    description?: string;
    patterns?: string;
    structure?: string;
    protocol?: string;
    prerequisites?: string;
    philosophy?: string;
    toolkit?: string;
    casStudies?: string;
  };
  changelog?: { version: string; date: string; changes: string; author: string }[];
}

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
  problematique: 'Problématique',
  outil: 'Outil',
  approche: 'Approche',
};

export const MODEL_STATUS_LABELS: Record<ModelStatus, string> = {
  brouillon: 'Brouillon',
  en_revision: 'En révision',
  en_test: 'En test',
  publie: 'Publié',
  en_evolution: 'En évolution',
};

export const mockModels: PNLModel[] = [
  {
    id: '1',
    title: 'Sabotage Inconscient',
    type: 'problematique',
    status: 'publie',
    version: '2.1.0',
    description: 'Modèle d\'identification et de résolution des patterns de sabotage inconscient. Ce modèle explore les mécanismes par lesquels une partie de l\'inconscient peut contrecarrer les objectifs conscients.',
    author: 'Dr. Marie Laurent',
    coAuthors: ['Jean Dupont', 'Sophie Martin'],
    createdAt: '2024-06-15',
    updatedAt: '2025-11-20',
    variationsCount: 12,
    feedbackCount: 34,
    views: 1250,
    complexity: 'avancé',
    tags: ['inconscient', 'patterns', 'écologie', 'parties'],
    sections: {
      description: 'Le sabotage inconscient se manifeste lorsqu\'une partie de nous travaille contre nos objectifs conscients. Ce phénomène est fréquent dans les situations de changement où l\'écologie interne n\'est pas respectée.',
      patterns: '1. Procrastination sélective\n2. Oublis stratégiques\n3. Auto-critique excessive\n4. Création d\'obstacles\n5. Symptômes physiques',
      structure: 'Le modèle s\'articule autour de 4 niveaux :\n- Niveau comportemental (ce qui est observable)\n- Niveau émotionnel (les affects sous-jacents)\n- Niveau croyances (les présupposés en jeu)\n- Niveau identitaire (les enjeux profonds)',
    },
    changelog: [
      { version: '2.1.0', date: '2025-11-20', changes: 'Ajout du niveau identitaire et cas cliniques', author: 'Dr. Marie Laurent' },
      { version: '2.0.0', date: '2025-08-10', changes: 'Refonte complète du modèle à 4 niveaux', author: 'Dr. Marie Laurent' },
      { version: '1.0.0', date: '2024-06-15', changes: 'Version initiale', author: 'Dr. Marie Laurent' },
    ],
  },
  {
    id: '2',
    title: 'Conflit Interne',
    type: 'problematique',
    status: 'en_evolution',
    version: '1.5.2',
    description: 'Modélisation des conflits entre parties internes, identification des intentions positives et protocole de négociation.',
    author: 'Jean Dupont',
    coAuthors: ['Dr. Marie Laurent'],
    createdAt: '2024-09-01',
    updatedAt: '2025-10-05',
    variationsCount: 8,
    feedbackCount: 21,
    views: 890,
    complexity: 'intermédiaire',
    tags: ['parties', 'négociation', 'intention positive', 'intégration'],
  },
  {
    id: '3',
    title: 'Procrastination Structurelle',
    type: 'problematique',
    status: 'en_test',
    version: '0.9.0',
    description: 'Analyse structurelle de la procrastination comme stratégie inconsciente de protection.',
    author: 'Sophie Martin',
    coAuthors: [],
    createdAt: '2025-01-10',
    updatedAt: '2025-12-01',
    variationsCount: 3,
    feedbackCount: 7,
    views: 340,
    complexity: 'débutant',
    tags: ['procrastination', 'motivation', 'temporal'],
  },
  {
    id: '4',
    title: 'Recadrage en 6 Étapes Revisité',
    type: 'outil',
    status: 'publie',
    version: '3.0.0',
    description: 'Version modernisée du recadrage en 6 étapes intégrant les dernières recherches en neurosciences.',
    author: 'Dr. Marie Laurent',
    coAuthors: ['Pierre Blanc', 'Nathalie Roy'],
    createdAt: '2024-03-20',
    updatedAt: '2025-09-15',
    variationsCount: 23,
    feedbackCount: 56,
    views: 2100,
    complexity: 'intermédiaire',
    tags: ['recadrage', 'protocole', 'neurosciences', 'parties'],
    sections: {
      protocol: '1. Identifier le comportement à changer\n2. Établir la communication avec la partie responsable\n3. Identifier l\'intention positive\n4. Générer de nouveaux comportements\n5. Vérification écologique\n6. Pont vers le futur',
      prerequisites: 'Rapport solide, état de ressource du praticien, calibration fine',
    },
  },
  {
    id: '5',
    title: 'Timeline Revisitée',
    type: 'outil',
    status: 'en_revision',
    version: '1.2.0',
    description: 'Nouvelle approche de la ligne du temps intégrant la dimension somatique et les dernières découvertes sur la mémoire.',
    author: 'Pierre Blanc',
    coAuthors: ['Jean Dupont'],
    createdAt: '2025-02-14',
    updatedAt: '2025-11-30',
    variationsCount: 5,
    feedbackCount: 12,
    views: 560,
    complexity: 'avancé',
    tags: ['timeline', 'mémoire', 'somatique', 'temporal'],
  },
  {
    id: '6',
    title: 'Ancrage Multi-Sensoriel',
    type: 'outil',
    status: 'publie',
    version: '2.0.0',
    description: 'Protocole d\'ancrage utilisant simultanément les canaux VAK pour un ancrage plus robuste et durable.',
    author: 'Nathalie Roy',
    coAuthors: [],
    createdAt: '2024-07-22',
    updatedAt: '2025-08-18',
    variationsCount: 9,
    feedbackCount: 28,
    views: 1560,
    complexity: 'débutant',
    tags: ['ancrage', 'VAK', 'sensoriel', 'ressources'],
  },
  {
    id: '7',
    title: 'Approche Narrative en PNL',
    type: 'approche',
    status: 'publie',
    version: '1.0.0',
    description: 'Intégration des principes de la thérapie narrative dans le cadre PNL pour enrichir le travail identitaire.',
    author: 'Dr. Marie Laurent',
    coAuthors: ['Sophie Martin'],
    createdAt: '2025-04-01',
    updatedAt: '2025-10-25',
    variationsCount: 5,
    feedbackCount: 18,
    views: 780,
    complexity: 'avancé',
    tags: ['narratif', 'identité', 'métaphore', 'recadrage'],
    sections: {
      philosophy: 'L\'approche narrative en PNL repose sur le principe que nos identités sont construites à travers les histoires que nous nous racontons. En combinant les outils PNL avec les techniques narratives, nous pouvons aider les clients à réécrire leurs récits limitants.',
      toolkit: '- Externalisation du problème\n- Cartographie des influences\n- Re-authoring avec ancrage\n- Cérémonie définitionnelle adaptée\n- Métaphores transformationnelles',
    },
  },
  {
    id: '8',
    title: 'Modélisation Générative',
    type: 'approche',
    status: 'en_test',
    version: '0.5.0',
    description: 'Cadre de modélisation qui intègre les niveaux logiques de Dilts avec l\'approche générative de Gilligan.',
    author: 'Jean Dupont',
    coAuthors: ['Pierre Blanc'],
    createdAt: '2025-06-15',
    updatedAt: '2025-12-05',
    variationsCount: 2,
    feedbackCount: 5,
    views: 290,
    complexity: 'avancé',
    tags: ['modélisation', 'génératif', 'niveaux logiques', 'Dilts'],
  },
  {
    id: '9',
    title: 'Phobies et Réponses Traumatiques',
    type: 'problematique',
    status: 'brouillon',
    version: '0.1.0',
    description: 'Cartographie des différents types de réponses phobiques et traumatiques, avec arbre de décision pour le choix du protocole.',
    author: 'Nathalie Roy',
    coAuthors: [],
    createdAt: '2025-11-01',
    updatedAt: '2025-12-06',
    variationsCount: 0,
    feedbackCount: 0,
    views: 45,
    complexity: 'avancé',
    tags: ['phobie', 'trauma', 'dissociation', 'protocole'],
  },
];
