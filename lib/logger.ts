"use client";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
  context?: string;
  stack?: string;
}

type LogListener = (entry: LogEntry) => void;

/**
 * Sanitizes log details or messages to prevent accidental exposure of sensitive keys or tokens
 */
function sanitizeSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data === "string") {
    return data
      .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, "AIzaSy***REDACTED***")
      .replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "jwt***REDACTED***")
      .replace(/((?:api_?key|password|secret|token|private_?key)\s*[:=]\s*)["']?[^\s"']+["']?/gi, "$1[REDACTED]");
  }
  if (typeof data === "object") {
    try {
      const sanitizedObj: Record<string, any> = Array.isArray(data) ? [] : {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey.includes("key") ||
          lowerKey.includes("password") ||
          lowerKey.includes("secret") ||
          lowerKey.includes("token") ||
          lowerKey.includes("credential") ||
          lowerKey.includes("private")
        ) {
          sanitizedObj[key] = "[REDACTED]";
        } else if (typeof value === "object" && value !== null) {
          sanitizedObj[key] = sanitizeSensitiveData(value);
        } else {
          sanitizedObj[key] = value;
        }
      }
      return sanitizedObj;
    } catch {
      return "[OBJECT REDACTED]";
    }
  }
  return data;
}

class CentralLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 200;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("sf_recent_logs");
        if (saved) {
          this.logs = JSON.parse(saved);
        }
      } catch (e) { }
    }
  }

  private emit(entry: LogEntry) {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("sf_recent_logs", JSON.stringify(this.logs.slice(0, 50)));
      } catch (e) { }
    }

    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (e) { }
    });
  }

  public log(level: LogLevel, message: string, details?: any, context = "App") {
    const cleanMessage = sanitizeSensitiveData(message);
    const cleanDetails = sanitizeSensitiveData(details);
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message: cleanMessage,
      details: cleanDetails,
      context,
      stack: cleanDetails?.stack || (cleanDetails instanceof Error ? cleanDetails.stack : undefined),
    };

    if (level === "error") {
      console.error(`[${context}] ${cleanMessage}`, cleanDetails || "");
    } else if (level === "warn") {
      console.warn(`[${context}] ${cleanMessage}`, cleanDetails || "");
    } else {
      console.log(`[${context}] ${cleanMessage}`, cleanDetails || "");
    }

    this.emit(entry);
  }

  public info(message: string, details?: any, context = "App") {
    this.log("info", message, details, context);
  }

  public warn(message: string, details?: any, context = "App") {
    this.log("warn", message, details, context);
  }

  public error(message: string, details?: any, context = "App") {
    this.log("error", message, details, context);
  }

  public debug(message: string, details?: any, context = "App") {
    this.log("debug", message, details, context);
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getRecentLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("sf_recent_logs");
      } catch (e) { }
    }
  }
}

export const logger = new CentralLogger();
