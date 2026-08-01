import React from "react";
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle } from "lucide-react";

interface SourceBadgeProps {
  score: number;
  qualified?: boolean;
}

export function SourceBadge({ score, qualified }: SourceBadgeProps) {
  let color = "bg-emerald-50 text-emerald-700 border-emerald-200";
  let barColor = "bg-emerald-500";
  let label = "High Confidence";
  
  if (score < 0.6) {
    color = "bg-rose-50 text-rose-700 border-rose-200";
    barColor = "bg-rose-500";
    label = "Low Confidence / Rejected";
  } else if (score < 0.8) {
    color = "bg-amber-50 text-amber-700 border-amber-200";
    barColor = "bg-amber-500";
    label = "Moderate Trust";
  }

  const widthPct = Math.min(Math.max(score * 100, 0), 100);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${color} w-fit`}>
        {score >= 0.6 ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        )}
        <span>{widthPct.toFixed(0)}% Trust</span>
        {qualified !== undefined && (
          <span className="ml-1 opacity-80">
            {qualified ? (
              <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
            ) : (
              <XCircle className="w-3 h-3 text-rose-600 inline" />
            )}
          </span>
        )}
      </span>
      <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barColor} rounded-full`} 
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
