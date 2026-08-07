import type { ScriptLine } from "@/app/api/script-writer/route";

export function parseRawScriptToLines(
  rawScript: string,
  defaultHost = "Paul",
  callers?: { name: string; gender?: string; accent?: string }[]
): ScriptLine[] {
  if (!rawScript || typeof rawScript !== "string") return [];

  const lines: ScriptLine[] = [];
  const rawLines = rawScript.split("\n").filter((l) => l.trim().length > 0);

  let currentTimeSeconds = 0;

  rawLines.forEach((lineStr, idx) => {
    const match = lineStr.match(/^([^:]+):\s*(.*)$/);
    if (match) {
      const speakerRaw = match[1].trim();
      let contentRaw = match[2].trim();

      let gender: "Male" | "Female" | undefined = undefined;
      let accent: string | undefined = undefined;
      let emotion: string | undefined = undefined;
      let sentiment: "neutral" | "enthusiastic" | "concerned" = "neutral";

      // Match caller config if available
      const matchingCaller = callers?.find(
        (c) => c.name.toLowerCase() === speakerRaw.toLowerCase()
      );
      if (matchingCaller) {
        if (matchingCaller.gender === "Female" || matchingCaller.gender === "Male") {
          gender = matchingCaller.gender;
        }
        if (matchingCaller.accent) {
          accent = matchingCaller.accent;
        }
      }

      if (contentRaw.includes("[Female]")) gender = "Female";
      if (contentRaw.includes("[Male]")) gender = "Male";

      const accentMatch = contentRaw.match(/\[Accent:\s*([^\]]+)\]/i);
      if (accentMatch) accent = accentMatch[1];

      const sentMatch = contentRaw.match(/\[Sentiment:\s*(enthusiastic|concerned|neutral)\]/i);
      if (sentMatch) {
        const matched = sentMatch[1].toLowerCase();
        if (matched === "enthusiastic" || matched === "concerned" || matched === "neutral") {
          sentiment = matched as "neutral" | "enthusiastic" | "concerned";
        }
      } else if (/enthusiastic|entusiasta/i.test(contentRaw)) {
        sentiment = "enthusiastic";
      } else if (/concerned|preocupad|alerta|riesgo/i.test(contentRaw)) {
        sentiment = "concerned";
      }

      const emotionMatch = contentRaw.match(/\[([a-záéíóúñA-ZÁÉÍÓÚÑ\s]{3,20})\]/);
      if (
        emotionMatch &&
        !emotionMatch[0].includes("Male") &&
        !emotionMatch[0].includes("Female") &&
        !emotionMatch[0].includes("Accent") &&
        !emotionMatch[0].includes("Sentiment")
      ) {
        emotion = emotionMatch[1];
      }

      if (sentiment === "neutral") {
        const lower = contentRaw.toLowerCase();
        if (
          /excelente|increíble|fascinante|éxito|entusiasta|emocionante|fantástico|revolucionario|bienvenidos|oportunidad|positivo|genial|me gusta|maravilla|prometedor/i.test(
            lower
          )
        ) {
          sentiment = "enthusiastic";
        } else if (
          /preocupaci|riesgo|alerta|duda|problema|cuestionamiento|sostenibilidad|amenaza|caída|pérdida|crític|error|falla|grave|difícil/i.test(
            lower
          )
        ) {
          sentiment = "concerned";
        }
      }

      const cleanText = contentRaw
        .replace(/\[Sentiment:\s*[^\]]+\]/gi, "")
        .replace(/\[Female\]/gi, "")
        .replace(/\[Male\]/gi, "")
        .replace(/\[Accent:\s*[^\]]+\]/gi, "")
        .replace(/\[[a-zA-Z\s]{2,20}\]/g, "")
        .trim();

      const isHost =
        speakerRaw.toLowerCase().includes(defaultHost.toLowerCase()) ||
        speakerRaw.toLowerCase().includes("paul") ||
        speakerRaw.toLowerCase().includes("host") ||
        speakerRaw.toLowerCase().includes("presentador");

      const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
      const lineDuration = Math.max(3, Math.round(wordCount / 2.2));

      const mins = Math.floor(currentTimeSeconds / 60);
      const secs = currentTimeSeconds % 60;
      const timestamp = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      lines.push({
        id: `line-${idx + 1}`,
        speaker: speakerRaw,
        speakerRole: isHost ? "host" : "caller",
        gender: gender || (isHost ? "Male" : idx % 2 === 0 ? "Female" : "Male"),
        accent: accent || (isHost ? "British" : "International"),
        emotion,
        sentiment,
        text: cleanText,
        timestamp,
      });

      currentTimeSeconds += lineDuration;
    } else if (lineStr.trim().length > 0) {
      // Fallback line if line doesn't match Speaker: Text
      const wordCount = lineStr.trim().split(/\s+/).filter(Boolean).length;
      const lineDuration = Math.max(3, Math.round(wordCount / 2.2));
      const mins = Math.floor(currentTimeSeconds / 60);
      const secs = currentTimeSeconds % 60;
      const timestamp = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      lines.push({
        id: `line-${idx + 1}`,
        speaker: defaultHost,
        speakerRole: "host",
        gender: "Male",
        accent: "British",
        sentiment: "neutral",
        text: lineStr.trim(),
        timestamp,
      });

      currentTimeSeconds += lineDuration;
    }
  });

  return lines;
}

export function reconstructRawScriptFromLines(lines: ScriptLine[]): string {
  if (!lines || lines.length === 0) return "";
  return lines.map((l) => `${l.speaker}: ${l.text}`).join("\n\n");
}

export function calculateEstimatedDurationFromLines(lines: ScriptLine[]): {
  totalWords: number;
  wordCount: number;
  totalSeconds: number;
  formattedDuration: string;
  estimatedDurationFormatted: string;
} {
  if (!lines || lines.length === 0) {
    return {
      totalWords: 0,
      wordCount: 0,
      totalSeconds: 0,
      formattedDuration: "0:00 min",
      estimatedDurationFormatted: "0:00 min",
    };
  }

  const totalWords = lines.reduce((acc, l) => {
    const words = l.text ? l.text.trim().split(/\s+/).filter(Boolean).length : 0;
    return acc + words;
  }, 0);

  // ~140 words per minute average speaking rate
  const totalSeconds = Math.round((totalWords / 140) * 60);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds} min`;

  return {
    totalWords,
    wordCount: totalWords,
    totalSeconds,
    formattedDuration,
    estimatedDurationFormatted: formattedDuration,
  };
}

/**
 * Automatically splits long script paragraphs into smaller, logical script lines
 * based on punctuation (. ! ? ; or commas) to improve TTS synthesis quality.
 */
export function splitLongScriptParagraphs(
  lines: ScriptLine[],
  maxWordsPerLine = 20
): ScriptLine[] {
  if (!lines || lines.length === 0) return [];

  const result: ScriptLine[] = [];
  let currentTimeSeconds = 0;

  lines.forEach((line) => {
    const text = line.text?.trim() || "";
    const words = text.split(/\s+/).filter(Boolean);

    if (words.length <= maxWordsPerLine) {
      const lineDuration = Math.max(3, Math.round(words.length / 2.2));
      const mins = Math.floor(currentTimeSeconds / 60);
      const secs = currentTimeSeconds % 60;
      const timestamp = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      result.push({
        ...line,
        id: `line-${result.length + 1}`,
        timestamp,
      });

      currentTimeSeconds += lineDuration;
      return;
    }

    // Split long text by sentence punctuation (. ! ?)
    const rawSegments = text.split(/(?<=[.!?;\n])\s+/).filter((s) => s.trim().length > 0);

    const chunkTexts: string[] = [];
    let currentChunk = "";

    rawSegments.forEach((segment) => {
      const combined = currentChunk ? `${currentChunk} ${segment}` : segment;
      const combinedWords = combined.split(/\s+/).filter(Boolean).length;

      if (combinedWords <= maxWordsPerLine) {
        currentChunk = combined;
      } else {
        if (currentChunk) {
          chunkTexts.push(currentChunk);
        }

        // If a single segment is still long, split by comma
        if (segment.split(/\s+/).filter(Boolean).length > maxWordsPerLine) {
          const commaParts = segment.split(/(?<=[,])\s+/).filter((s) => s.trim().length > 0);
          let subChunk = "";
          commaParts.forEach((part) => {
            const subCombined = subChunk ? `${subChunk} ${part}` : part;
            if (subCombined.split(/\s+/).filter(Boolean).length <= maxWordsPerLine) {
              subChunk = subCombined;
            } else {
              if (subChunk) chunkTexts.push(subChunk);
              subChunk = part;
            }
          });
          if (subChunk) chunkTexts.push(subChunk);
          currentChunk = "";
        } else {
          currentChunk = segment;
        }
      }
    });

    if (currentChunk) {
      chunkTexts.push(currentChunk);
    }

    chunkTexts.forEach((chunkText) => {
      const chunkWords = chunkText.trim().split(/\s+/).filter(Boolean).length;
      const lineDuration = Math.max(3, Math.round(chunkWords / 2.2));
      const mins = Math.floor(currentTimeSeconds / 60);
      const secs = currentTimeSeconds % 60;
      const timestamp = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      result.push({
        ...line,
        id: `line-${result.length + 1}`,
        text: chunkText.trim(),
        timestamp,
      });

      currentTimeSeconds += lineDuration;
    });
  });

  return result;
}

