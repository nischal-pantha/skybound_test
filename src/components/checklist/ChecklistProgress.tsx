import { CheckCircle, AlertTriangle } from "lucide-react";

interface ChecklistProgressProps {
  completed: number;
  total: number;
}

export const ChecklistProgress = ({ completed, total }: ChecklistProgressProps) => {
  const isComplete = completed === total && total > 0;
  const pct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="mt-6 pt-5 border-t border-border/40">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        isComplete ? 'bg-success/8 border-success/20' : 'bg-muted/30 border-border/40'
      }`}>
        {isComplete ? <CheckCircle className="h-5 w-5 text-success" /> : <AlertTriangle className="h-5 w-5 text-warning" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-sm font-semibold ${isComplete ? 'text-success' : 'text-foreground'}`}>
              {isComplete ? 'Complete' : 'In Progress'}
            </span>
            <span className="text-xs font-medium text-muted-foreground">{Math.round(pct)}%</span>
          </div>
          <div className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isComplete ? 'bg-success' : 'bg-warning'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">{completed} of {total} items</p>
        </div>
      </div>
    </div>
  );
};
