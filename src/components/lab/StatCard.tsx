import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: boolean;
}

const StatCard = ({ icon: Icon, label, value, accent }: StatCardProps) => (
  <div className="lab-card flex items-center gap-4 p-5">
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${accent ? 'bg-secondary/10' : 'bg-muted'}`}>
      <Icon className={`h-5 w-5 ${accent ? 'text-secondary' : 'text-muted-foreground'}`} />
    </div>
    <div>
      <p className="font-display text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default StatCard;
