import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { mockModels, ModelType, ModelStatus, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/data/mockModels';
import ModelCard from '@/components/lab/ModelCard';

const Library = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ModelType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ModelStatus | 'all'>('all');

  const filtered = useMemo(() => {
    return mockModels.filter((m) => {
      const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Bibliothèque de Modèles</h1>
        <p className="mt-1 text-muted-foreground">Explorez {mockModels.length} modèles PNL par type, statut et domaine</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm border border-border sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher un modèle ou un tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-ring focus:ring-2"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ModelType | 'all')}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="all">Tous les types</option>
            {(Object.entries(MODEL_TYPE_LABELS) as [ModelType, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ModelStatus | 'all')}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring focus:ring-2"
          >
            <option value="all">Tous les statuts</option>
            {(Object.entries(MODEL_STATUS_LABELS) as [ModelStatus, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((model, i) => (
            <ModelCard key={model.id} model={model} index={i} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <SlidersHorizontal className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Aucun modèle ne correspond à vos critères</p>
        </div>
      )}
    </div>
  );
};

export default Library;
