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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name (Google Cloud Light Style) */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#1a73e8] flex items-center justify-center text-white shadow-xs">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                SourceFinder Pod
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-blue-50 text-[#1a73e8] dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Google Cloud AI
              </span>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal hidden sm:inline-block">
              Inteligencia Periodística & Podcasts Multivoz
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
          <a
            href="#solucion"
            className="hover:text-[#1a73e8] transition-colors"
          >
            Investigación AI
          </a>
          <a
            href="#calculadora"
            className="hover:text-[#1a73e8] transition-colors"
          >
            Calculadora ROI
          </a>
          <a
            href="#comparativa"
            className="hover:text-[#1a73e8] transition-colors"
          >
            Comparativa
          </a>
          <a
            href="#pricing"
            className="hover:text-[#1a73e8] transition-colors"
          >
            Planes
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Language Switcher */}
          <button
            onClick={onToggleLanguage}
            title="Cambiar idioma"
            className="px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold uppercase tracking-wider flex items-center gap-1 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-[#1a73e8]" />
            <span>{language}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title="Alternar tema"
            className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-[#1a73e8]" />
            )}
          </button>

          {/* Login / User Status */}
          <button
            onClick={onOpenLogin}
            className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer hidden sm:flex"
          >
            {user ? (
              <>
                <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate max-w-[100px] font-semibold">
                  {user.displayName || user.email?.split("@")[0] || "Mi Cuenta"}
                </span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-[#1a73e8]" />
                <span>Ingresar</span>
              </>
            )}
          </button>

          {/* Launch Studio Google Cloud Primary CTA */}
          <button
            onClick={onLaunchStudio}
            className="px-4 py-2 rounded-md bg-[#1a73e8] hover:bg-[#1557b0] text-white font-medium text-xs tracking-wide shadow-xs flex items-center gap-2 transition-all cursor-pointer group active:scale-98"
          >
            <span>Ir al Studio</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
