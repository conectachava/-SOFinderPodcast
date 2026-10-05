"use client";

import React from "react";
import { Radio, ArrowRight, Sun, Moon, User, LogIn, Globe } from "lucide-react";

interface LandingHeaderProps {
  onLaunchStudio: () => void;
  onOpenLogin: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  language: string;
  onToggleLanguage: () => void;
  user?: any;
}

export function LandingHeader({
  onLaunchStudio,
  onOpenLogin,
  theme,
  onToggleTheme,
  language,
  onToggleLanguage,
  user,
}: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            SourceFinder Pod
          </span>
        </div>

        {/* Zone 2: 4-6 clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
          <a href="#solucion" className="hover:text-slate-900 dark:hover:text-white transition-colors">Investigación</a>
          <a href="#calculadora" className="hover:text-slate-900 dark:hover:text-white transition-colors">ROI</a>
          <a href="#comparativa" className="hover:text-slate-900 dark:hover:text-white transition-colors">Comparativa</a>
          <a href="#pricing" className="hover:text-slate-900 dark:hover:text-white transition-colors">Planes</a>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={onToggleTheme}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          
          <button
            onClick={onLaunchStudio}
            className="hidden sm:flex px-4 py-2 bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer items-center gap-2 group"
          >
            <span>Ir al Studio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
