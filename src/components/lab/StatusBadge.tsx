import { ModelStatus } from '@/data/mockModels';
import { useTranslation } from 'react-i18next';

const statusClassMap: Record<ModelStatus, string> = {
  brouillon: 'lab-status-draft',
  en_revision: 'lab-status-review',
  en_test: 'lab-status-testing',
  publie: 'lab-status-published',
  en_evolution: 'lab-status-evolving',
};

const StatusBadge = ({ status }: { status: ModelStatus }) => {
  const { t } = useTranslation();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassMap[status]}`}>
      {t('modelStatuses.' + status)}
    </span>
  );
};

export default StatusBadge;
