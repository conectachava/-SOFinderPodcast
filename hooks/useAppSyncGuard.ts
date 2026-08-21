import { useEffect, useRef } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface SyncGuardProps {
  userUid?: string;
  activeTab: string;
  reportText?: string;
  rawScript?: string;
  scriptLinesLength: number;
  onRecoverState: (data: any) => void;
  addToast: (title: string, description: string, type: "info" | "success" | "warning" | "error") => void;
}

export function useAppSyncGuard({
  userUid,
  activeTab,
  reportText,
  rawScript,
  scriptLinesLength,
  onRecoverState,
  addToast,
}: SyncGuardProps) {
  const discrepancyCounter = useRef(0);
  const lastStateRef = useRef({ activeTab, reportText, rawScript, scriptLinesLength });

  useEffect(() => {
    if (!userUid) return;
    
    lastStateRef.current = { activeTab, reportText, rawScript, scriptLinesLength };

    // Check for logical discrepancies in the pipeline
    let hasDiscrepancy = false;
    
    if (activeTab === "script" && (!reportText || reportText.length === 0)) {
      hasDiscrepancy = true;
    }
    
    if (activeTab === "studio" && (scriptLinesLength === 0 && (!rawScript || rawScript.length === 0))) {
      hasDiscrepancy = true;
    }

    if (hasDiscrepancy) {
      discrepancyCounter.current += 1;
    } else {
      discrepancyCounter.current = 0;
    }

    // If blocked/discrepant for ~3 consecutive checks (assuming fast re-renders, let's use a timeout)
    const timer = setTimeout(async () => {
      if (discrepancyCounter.current >= 2) {
        // Fetch from Firestore to attempt recovery
        try {
          const draftRef = doc(db, "users", userUid, "drafts", "currentSession");
          const snap = await getDoc(draftRef);
          if (snap.exists()) {
            const data = snap.data();
            
            // Only recover if Firestore actually has the data we're missing
            if (
              (activeTab === "script" && data.reportText) || 
              (activeTab === "studio" && (data.scriptLines?.length > 0 || data.rawScript))
            ) {
              onRecoverState({
                reportText: data.reportText,
                rawScript: data.rawScript,
                scriptLines: data.scriptLines
              });
              addToast("Sincronización de Emergencia", "Se detectó un bloqueo en la vista. Estado restaurado desde la nube.", "warning");
              discrepancyCounter.current = 0;
            } else {
                // If firestore is also empty, force sync what we have
                await setDoc(draftRef, {
                    reportText: reportText || "",
                    rawScript: rawScript || "",
                    updatedAt: serverTimestamp()
                }, { merge: true });
                discrepancyCounter.current = 0;
            }
          }
        } catch (error) {
          console.warn("AppSyncGuard failed to recover:", error);
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [activeTab, reportText, rawScript, scriptLinesLength, userUid, onRecoverState, addToast]);
}
