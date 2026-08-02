"use client";

import React, { useState } from "react";
import { Download, FileJson, FileText, Table, FileCode, Check, X, Sparkles, FolderArchive, Settings2 } from "lucide-react";
import { ScriptLine } from "@/app/api/script-writer/route";

export interface ProjectExportData {
  reportText?: string;
  rawScript?: string;
  scriptLines?: ScriptLine[];
  storyboardData?: any[];
  selectedPreset?: any;
  topic?: string;
}

interface ProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectData: ProjectExportData;
  onExportSuccess?: (formats: string[]) => void;
}

export function ProjectExportModal({
  isOpen,
  onClose,
  projectData,
  onExportSuccess,
}: ProjectExportModalProps) {
  const [exportJson, setExportJson] = useState(true);
  const [exportMarkdown, setExportMarkdown] = useState(true);
  const [exportCsv, setExportCsv] = useState(false);
  const [exportTxt, setExportTxt] = useState(false);

  const [includeTimecodes, setIncludeTimecodes] = useState(true);
  const [includeEmotions, setIncludeEmotions] = useState(true);
  const [filePrefix, setFilePrefix] = useState("SourceFinder_Podcast_Project");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const scriptCount = projectData.scriptLines?.length || 0;
  const storyboardCount = projectData.storyboardData?.length || 0;
  const reportLength = projectData.reportText?.length || 0;

  const handleDownload = () => {
    setIsExporting(true);
    const exportedFormats: string[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const cleanPrefix = filePrefix.trim() || "SourceFinder_Podcast";

    // 1. Export JSON
    if (exportJson) {
      const jsonContent = JSON.stringify(
        {
          version: "2.0",
          exportDate: new Date().toISOString(),
          topic: projectData.topic || projectData.selectedPreset?.topic || "Untitled Podcast",
          reportText: projectData.reportText || "",
          rawScript: projectData.rawScript || "",
          scriptLines: projectData.scriptLines || [],
          storyboardData: projectData.storyboardData || [],
          selectedPreset: projectData.selectedPreset || null,
        },
        null,
        2
      );
      downloadFile(`${cleanPrefix}_${timestamp}.json`, jsonContent, "application/json");
      exportedFormats.push("JSON");
    }

    // 2. Export Markdown Script
    if (exportMarkdown) {
      let md = `# ${projectData.topic || "Podcast Script"}\n`;
      md += `*Fecha de Exportación:* ${new Date().toLocaleDateString()}\n\n`;
      md += `--- \n\n`;

      if (projectData.scriptLines && projectData.scriptLines.length > 0) {
        md += `## Guión de Producción\n\n`;
        projectData.scriptLines.forEach((line) => {
          const time = includeTimecodes ? `[${line.timestamp || "00:00"}] ` : "";
          const emotion = includeEmotions && line.emotion ? ` *(${line.emotion})*` : "";
          md += `**${line.speaker}** (${line.speakerRole || "Speaker"})${emotion}:\n`;
          md += `${time}"${line.text}"\n\n`;
        });
      } else if (projectData.rawScript) {
        md += projectData.rawScript + "\n\n";
      } else {
        md += `*Sin guión generado.*\n\n`;
      }

      if (projectData.reportText) {
        md += `--- \n\n## Informe de Investigación\n\n${projectData.reportText}\n`;
      }

      downloadFile(`${cleanPrefix}_Script_${timestamp}.md`, md, "text/markdown");
      exportedFormats.push("Markdown Script");
    }

    // 3. Export CSV Storyboard
    if (exportCsv) {
      let csv = "Escena,Locutor,Diálogo,Cultura Visual / Cue,Efectos de Audio / SFX,Duración (s)\n";
      const scenes = projectData.storyboardData && projectData.storyboardData.length > 0
        ? projectData.storyboardData
        : (projectData.scriptLines || []).map((line, idx) => ({
            scene: idx + 1,
            speaker: line.speaker,
            dialogue: line.text,
            visualCue: "Plano medio con gráficos dinámicos",
            audioSfx: "Música de fondo sutil",
            duration: 5,
          }));

      scenes.forEach((s: any, idx: number) => {
        const esc = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;
        csv += `${s.scene || idx + 1},${esc(s.speaker)},${esc(s.dialogue || s.text)},${esc(s.visualCue || s.visual)},${esc(s.audioSfx || s.sfx)},${s.duration || 5}\n`;
      });

      downloadFile(`${cleanPrefix}_Storyboard_${timestamp}.csv`, csv, "text/csv;charset=utf-8;");
      exportedFormats.push("CSV Storyboard");
    }

    // 4. Export TXT Research Summary
    if (exportTxt) {
      let txt = `=========================================================\n`;
      txt += `SOURCEFINDER POD - INFORME EJECUTIVO & RESUMEN DE FUENTES\n`;
      txt += `=========================================================\n\n`;
      txt += `Tema: ${projectData.topic || "Podcast General"}\n`;
      txt += `Fecha: ${new Date().toLocaleString()}\n\n`;
      txt += `---------------------------------------------------------\n`;
      txt += `RESUMEN DE INVESTIGACIÓN DE FUENTES\n`;
      txt += `---------------------------------------------------------\n\n`;
      txt += projectData.reportText || "Sin datos de investigación disponibles.";
      txt += `\n\n=========================================================\n`;

      downloadFile(`${cleanPrefix}_Resumen_${timestamp}.txt`, txt, "text/plain");
      exportedFormats.push("TXT Report");
    }

    setTimeout(() => {
      setIsExporting(false);
      if (onExportSuccess && exportedFormats.length > 0) {
        onExportSuccess(exportedFormats);
      }
      onClose();
    }, 400);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedCount = [exportJson, exportMarkdown, exportCsv, exportTxt].filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportación de Proyecto</h3>
              <p className="text-xs text-slate-400">Selecciona los formatos y opciones de descarga</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Project Summary Badge */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-1">
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider block">
              Proyecto Actual
            </span>
            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {projectData.topic || projectData.selectedPreset?.topic || "Proyecto SourceFinder Pod"}
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono pt-1">
              <span>🎙️ {scriptCount} líneas de guión</span>
              <span>🎬 {storyboardCount} escenas</span>
              <span>📄 {Math.round(reportLength / 1000)}k car. investigación</span>
            </div>
          </div>

          {/* Formats Selection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              1. Formatos de Exportación
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* JSON */}
              <div
                onClick={() => setExportJson(!exportJson)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  exportJson
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileJson className={`w-4 h-4 ${exportJson ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-xs font-bold">JSON (.json)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Respaldo completo</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  exportJson ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700"
                }`}>
                  {exportJson && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* Markdown Script */}
              <div
                onClick={() => setExportMarkdown(!exportMarkdown)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  exportMarkdown
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className={`w-4 h-4 ${exportMarkdown ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-xs font-bold">Guión Markdown (.md)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Formato locución</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  exportMarkdown ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700"
                }`}>
                  {exportMarkdown && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* CSV Storyboard */}
              <div
                onClick={() => setExportCsv(!exportCsv)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  exportCsv
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Table className={`w-4 h-4 ${exportCsv ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-xs font-bold">Storyboard CSV (.csv)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Tabla de producción</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  exportCsv ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700"
                }`}>
                  {exportCsv && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>

              {/* TXT Research Summary */}
              <div
                onClick={() => setExportTxt(!exportTxt)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  exportTxt
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-white ring-1 ring-indigo-500"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className={`w-4 h-4 ${exportTxt ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                  <div>
                    <div className="text-xs font-bold">Resumen TXT (.txt)</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Informe ejecutivo</div>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                  exportTxt ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700"
                }`}>
                  {exportTxt && <Check className="w-3.5 h-3.5" />}
                </div>
              </div>
            </div>
          </div>

          {/* Export Options & Customization */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Settings2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>2. Opciones Personalizadas</span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Prefijo de Nombre de Archivo
                </label>
                <input
                  type="text"
                  value={filePrefix}
                  onChange={(e) => setFilePrefix(e.target.value)}
                  placeholder="Ej. SourceFinder_Podcast_Pro"
                  className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeTimecodes}
                    onChange={(e) => setIncludeTimecodes(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Incluir marcas de tiempo (timecodes)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeEmotions}
                    onChange={(e) => setIncludeEmotions(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Incluir acotaciones de tono y emoción</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleDownload}
            disabled={selectedCount === 0 || isExporting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? "Exportando..."
                : selectedCount === 0
                ? "Selecciona un formato"
                : `Exportar ${selectedCount} Archivo${selectedCount > 1 ? "s" : ""}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
