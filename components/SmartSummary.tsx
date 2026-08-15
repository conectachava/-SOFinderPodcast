import React, { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { safeFetchJson } from "@/lib/utils";

export function SmartSummary({ report }: { report: string | null }) {
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!report) return;

    const fetchSummary = async () => {
      setLoading(true);
      try {
        const response = await safeFetchJson("/api/smart-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: report }),
        });
        if (response.ok) {
          setTakeaways(response.data.takeaways || []);
        }
      } catch (e) {
        console.error("Summary fetch failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [report]);

  if (!report) return null;

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 h-full">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-amber-500" />
        SmartSummary
      </h3>
      {loading ? (
        <p className="text-xs text-slate-500">Generando resumen...</p>
      ) : (
        <ul className="space-y-2">
          {takeaways.map((t, i) => (
            <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-700">
              {t.replace(/^\d+\.\s*/, "")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
