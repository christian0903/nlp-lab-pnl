import { ModelType } from '@/data/mockModels';
import { useTranslation } from 'react-i18next';

const typeClassMap: Record<ModelType, string> = {
  problematique: 'lab-type-problematique',
  outil: 'lab-type-outil',
  approche: 'lab-type-approche',
};

const TypeBadge = ({ type }: { type: ModelType }) => {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeClassMap[type]}`}>
      {t('modelTypes.' + type)}
    </span>
  );
};

export default TypeBadge;
