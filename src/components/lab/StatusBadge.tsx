import { ModelStatus, MODEL_STATUS_LABELS } from '@/data/mockModels';

const statusClassMap: Record<ModelStatus, string> = {
  brouillon: 'lab-status-draft',
  en_revision: 'lab-status-review',
  en_test: 'lab-status-testing',
  publie: 'lab-status-published',
  en_evolution: 'lab-status-evolving',
};

const StatusBadge = ({ status }: { status: ModelStatus }) => (
  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClassMap[status]}`}>
    {MODEL_STATUS_LABELS[status]}
  </span>
);

export default StatusBadge;
