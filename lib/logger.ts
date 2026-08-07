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
      } catch (e) {}
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
      } catch (e) {}
    }

    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (e) {}
    });
  }

  public log(level: LogLevel, message: string, details?: any, context = "App") {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      context,
      stack: details?.stack || (details instanceof Error ? details.stack : undefined),
    };

    if (level === "error") {
      console.error(`[${context}] ${message}`, details || "");
    } else if (level === "warn") {
      console.warn(`[${context}] ${message}`, details || "");
    } else {
      console.log(`[${context}] ${message}`, details || "");
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
      } catch (e) {}
    }
  }
}

export const logger = new CentralLogger();
