import { ModelType, MODEL_TYPE_LABELS } from '@/data/mockModels';

const typeClassMap: Record<ModelType, string> = {
  problematique: 'lab-type-problematique',
  outil: 'lab-type-outil',
  approche: 'lab-type-approche',
};

const TypeBadge = ({ type }: { type: ModelType }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeClassMap[type]}`}>
    {MODEL_TYPE_LABELS[type]}
  </span>
);

export default TypeBadge;
