"use client";

import React, { useState } from "react";
import { Star, Send, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { useToast } from "./Toast";
import { safeFetchJson } from "@/lib/utils";

interface FeedbackCardProps {
  topic: string;
  contentType: string;
  format: string;
  onSubmitted?: () => void;
}

export function FeedbackCard({
  topic,
  contentType,
  format,
  onSubmitted,
}: FeedbackCardProps) {
  const { addToast } = useToast();

  const [scriptRating, setScriptRating] = useState<number>(0);
  const [hoverScriptRating, setHoverScriptRating] = useState<number>(0);

  const [audioRating, setAudioRating] = useState<number>(0);
  const [hoverAudioRating, setHoverAudioRating] = useState<number>(0);

  const [comments, setComments] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (scriptRating === 0 || audioRating === 0) {
      addToast(
        "Calificación Incompleta",
        "Por favor califica tanto el guion como el audio final en escala de 1 a 5 estrellas.",
        "error"
      );
      return;
    }

    setSubmitting(true);

    const feedbackPayload = {
      topic,
      type: contentType,
      format,
      scriptRating,
      audioRating,
      comments: comments.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      // 1. Send feedback to backend API route
      const res = await safeFetchJson("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload),
      });

      if (!res.ok) {
        console.warn("API Feedback warning, fallback to local storage");
      }

      // 2. Local persistence in localStorage
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("sf_feedback_history");
          const history = stored ? JSON.parse(stored) : [];
          history.unshift(feedbackPayload);
          localStorage.setItem("sf_feedback_history", JSON.stringify(history.slice(0, 50)));
        } catch (e) {
          console.warn("LocalStorage save error:", e);
        }
      }

      setSubmitted(true);
      addToast(
        "Feedback Registrado",
        `Gracias por tu valoración (${scriptRating}/5 Guion, ${audioRating}/5 Audio). Tu opinión optimiza nuestros agentes.`,
        "success"
      );

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      addToast("Error al Enviar Feedback", "No se pudo conectar con el servidor.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (
    value: number,
    hoverValue: number,
    setValue: (val: number) => void,
    setHoverValue: (val: number) => void,
    label: string
  ) => {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
            {hoverValue || value ? `${hoverValue || value} / 5` : "Sin calificar"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hoverValue || value);
            return (
              <button
                key={star}
                type="button"
                onClick={() => setValue(star)}
                onMouseEnter={() => setHoverValue(star)}
                onMouseLeave={() => setHoverValue(0)}
                className="p-1 text-slate-300 hover:scale-110 transition-transform focus:outline-none cursor-pointer"
                title={`${star} Estrellas`}
              >
                <Star
                  className={`w-6 h-6 transition-colors ${
                    active
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-300 dark:text-slate-700 hover:text-amber-300"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (submitted) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800/80 shadow-sm space-y-3 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-2">
              ¡Feedback Registrado con Éxito!
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              Valoraciones asignadas: <strong>Guion ({scriptRating}/5)</strong>,{" "}
              <strong>Audio Final ({audioRating}/5)</strong>.
            </p>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-emerald-200/60 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300">
          <span className="font-mono">
            Parámetros: {topic} | {contentType} | {format}
          </span>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
          >
            Editar Calificación
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold border border-amber-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              Califica la Calidad del Generador (User Feedback)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tus puntuaciones afinan la precisión de los agentes SourceFinder y ScriptWriter.
            </p>
          </div>
        </div>

        {/* Generation parameters badges */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
            <strong>Tipo:</strong> {contentType}
          </span>
          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-700">
            <strong>Formato:</strong> {format}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
          {renderStars(
            scriptRating,
            hoverScriptRating,
            setScriptRating,
            setHoverScriptRating,
            "1. Calidad del Guion (Scriptwriter)"
          )}

          {renderStars(
            audioRating,
            hoverAudioRating,
            setAudioRating,
            setHoverAudioRating,
            "2. Calidad del Audio Final (Audio Deck)"
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            Comentarios o Sugerencias Opcionales
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            placeholder="¿Qué te pareció la fluidez del guion o el tono de las voces?..."
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Guardando Feedback..." : "Enviar Calificación"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
