import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DBModel, MODEL_STATUS_LABELS, ModelStatus } from '@/types/model';
import TypeBadge from './TypeBadge';

const columns: { status: ModelStatus; icon: string }[] = [
  { status: 'brouillon', icon: '📝' },
  { status: 'en_revision', icon: '🔍' },
  { status: 'en_test', icon: '🧪' },
  { status: 'publie', icon: '✅' },
  { status: 'en_evolution', icon: '🔄' },
];

const KanbanBoard = () => {
  const [models, setModels] = useState<DBModel[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('models')
        .select('*')
        .order('updated_at', { ascending: false });
      if (data) setModels(data as unknown as DBModel[]);
    };
    fetch();
  }, []);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(({ status, icon }) => {
        const col = models.filter((m) => m.status === status);
        return (
          <div key={status} className="min-w-[220px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <h4 className="font-display text-sm font-semibold text-foreground">
                {MODEL_STATUS_LABELS[status]}
              </h4>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                {col.length}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {col.map((model) => (
                <Link
                  key={model.id}
                  to={`/model/${model.id}`}
                  className="lab-card block p-3"
                >
                  <TypeBadge type={model.type as any} />
                  <p className="mt-2 text-sm font-medium text-foreground leading-snug">{model.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">v{model.version}</p>
                </Link>
              ))}
              {col.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  Aucun modèle
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
