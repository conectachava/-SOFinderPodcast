"use client";

import React from "react";
import { Sparkles, AlertCircle, MessageSquare } from "lucide-react";

export type SentimentType = "neutral" | "enthusiastic" | "concerned";

export function getSentimentDetails(
  sentiment?: SentimentType | string,
  text: string = ""
) {
  let finalSentiment: SentimentType = "neutral";

  if (sentiment) {
    const lower = sentiment.toLowerCase();
    if (lower.includes("enthusiast") || lower.includes("entusiasta") || lower === "enthusiastic") {
      finalSentiment = "enthusiastic";
    } else if (lower.includes("concern") || lower.includes("preocupad") || lower === "concerned") {
      finalSentiment = "concerned";
    } else if (lower === "neutral") {
      finalSentiment = "neutral";
    }
  } else if (text) {
    const lowerText = text.toLowerCase();
    if (
      /excelente|increíble|fascinante|éxito|entusiasta|emocionante|fantástico|revolucionario|bienvenidos|oportunidad|positivo|genial|me gusta|maravilla|prometedor/i.test(
        lowerText
      )
    ) {
      finalSentiment = "enthusiastic";
    } else if (
      /preocupaci|riesgo|alerta|duda|problema|cuestionamiento|sostenibilidad|amenaza|caída|pérdida|crític|error|falla|grave|difícil/i.test(
        lowerText
      )
    ) {
      finalSentiment = "concerned";
    }
  }

  if (finalSentiment === "enthusiastic") {
    return {
      type: "enthusiastic" as const,
      label: "Entusiasta",
      Icon: Sparkles,
      badgeClass:
        "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80",
      iconClass: "text-amber-600 dark:text-amber-400",
      dotClass: "bg-amber-500",
    };
  }

  if (finalSentiment === "concerned") {
    return {
      type: "concerned" as const,
      label: "Preocupado",
      Icon: AlertCircle,
      badgeClass:
        "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80",
      iconClass: "text-rose-600 dark:text-rose-400",
      dotClass: "bg-rose-500",
    };
  }

  return {
    type: "neutral" as const,
    label: "Neutral",
    Icon: MessageSquare,
    badgeClass:
      "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-700/80",
    iconClass: "text-sky-600 dark:text-sky-400",
    dotClass: "bg-sky-500",
  };
}

interface SentimentBadgeProps {
  sentiment?: SentimentType | string;
  text?: string;
  showText?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function SentimentBadge({
  sentiment,
  text = "",
  showText = true,
  size = "sm",
  className = "",
}: SentimentBadgeProps) {
  const details = getSentimentDetails(sentiment, text);
  const IconComponent = details.Icon;

  const sizeClasses =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1"
      : "text-xs px-2.5 py-1 gap-1.5";

  const iconSizes = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-2xs ${details.badgeClass} ${sizeClasses} ${className}`}
      title={`Tono emocional detectado por Gemini: ${details.label}`}
    >
      <IconComponent className={`${iconSizes} ${details.iconClass} shrink-0`} />
      {showText && <span>{details.label}</span>}
    </span>
  );
}
