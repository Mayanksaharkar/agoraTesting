import { ReactNode } from 'react';

interface StatsWidgetProps {
  icon: ReactNode;
  label: string;
  value: number | string;
}

export default function StatsWidget({ icon, label, value }: StatsWidgetProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-display font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
