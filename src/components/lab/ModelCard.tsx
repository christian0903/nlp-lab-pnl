import { Link } from 'react-router-dom';
import { Eye, MessageSquare, GitBranch } from 'lucide-react';
import { PNLModel, MODEL_TYPE_LABELS, MODEL_STATUS_LABELS } from '@/data/mockModels';
import StatusBadge from './StatusBadge';
import TypeBadge from './TypeBadge';

interface ModelCardProps {
  model: PNLModel;
  index?: number;
}

const ModelCard = ({ model, index = 0 }: ModelCardProps) => {
  return (
    <Link
      to={`/model/${model.id}`}
      className="lab-card block p-5 opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <TypeBadge type={model.type} />
        <StatusBadge status={model.status} />
      </div>

      <h3 className="mb-1.5 font-display text-lg font-semibold text-foreground leading-snug">
        {model.title}
      </h3>
      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{model.description}</p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {model.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {tag}
          </span>
        ))}
        {model.tags.length > 3 && (
          <span className="text-xs text-muted-foreground">+{model.tags.length - 3}</span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-xs text-muted-foreground">
          v{model.version} · {model.author.split(' ')[0]}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {model.views}
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3.5 w-3.5" /> {model.variationsCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {model.feedbackCount}
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ModelCard;
