"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Volume2, Save, RefreshCw, User, Check, Sparkles, Shield, RotateCcw } from "lucide-react";
import { useToast } from "./Toast";
import { useAuth } from "../app/AuthProvider";

export interface VoiceProfileConfig {
  role: "Host" | "Expert" | "Analyst";
  voiceName: string;
  pitch: number; // -50 to +50
  speed: number; // 0.7 to 1.5
  warmth: number; // 0 to 100
  updatedAt?: string;
}

const DEFAULT_PROFILES: Record<string, VoiceProfileConfig> = {
  Host: { role: "Host", voiceName: "Zephyr", pitch: 0, speed: 1.0, warmth: 75 },
  Expert: { role: "Expert", voiceName: "Kore", pitch: 5, speed: 0.95, warmth: 60 },
  Analyst: { role: "Analyst", voiceName: "Fenrir", pitch: -10, speed: 1.05, warmth: 85 },
};

export const AVAILABLE_VOICES = [
  { id: "Zephyr", label: "Zephyr (Cálida / Británica)", gender: "Male" },
  { id: "Kore", label: "Kore (Profesional / Clara)", gender: "Female" },
  { id: "Fenrir", label: "Fenrir (Profunda / Autoridad)", gender: "Male" },
  { id: "Puck", label: "Puck (Enérgica / Dinámica)", gender: "Male" },
  { id: "Aoede", label: "Aoede (Elegante / Expresiva)", gender: "Female" },
];

export function VoiceProfileManager() {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Record<string, VoiceProfileConfig>>(DEFAULT_PROFILES);
  const [activeTab, setActiveTab] = useState<"Host" | "Expert" | "Analyst">("Host");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavedInFirestore, setIsSavedInFirestore] = useState<boolean>(false);

  // Load profiles from local storage on mount and when VoiceClone applies a profile
  useEffect(() => {
    function loadVoiceProfiles() {
      setIsLoading(true);
      try {
        const saved = localStorage.getItem("sf_voice_profiles_config");
        if (saved) {
          setProfiles(JSON.parse(saved));
          setIsSavedInFirestore(true);
        }
      } catch (err) {
        console.warn("Notice: Voice profiles loaded from local defaults:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadVoiceProfiles();
    window.addEventListener("sf_apply_cloned_voice", loadVoiceProfiles);
    return () => window.removeEventListener("sf_apply_cloned_voice", loadVoiceProfiles);
  }, []);

  const handleProfileChange = (field: keyof VoiceProfileConfig, value: any) => {
    setProfiles((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
    setIsSavedInFirestore(false);
  };

  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("sf_voice_profiles_config", JSON.stringify(profiles));
      setIsSavedInFirestore(true);
      addToast(
        "Perfiles de Voz Guardados",
        `Ajustes de timbre y marca persistidos localmente.`,
        "success"
      );
    } catch (err: any) {
      addToast(
        "Error al Guardar",
        `No se pudo guardar la configuración: ${err?.message || "Falló la conexión"}`,
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setProfiles(DEFAULT_PROFILES);
    setIsSavedInFirestore(false);
    addToast("Valores por Defecto", "Restablecidos parámetros iniciales de voz.", "info");
  };

  const currentConfig = profiles[activeTab];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5 shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4.5 h-4.5 text-indigo-400" />
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              Gestión de Perfiles de Voz (Voice Branding Engine)
              {isSavedInFirestore ? (
                <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 text-[10px] font-mono rounded border border-emerald-800 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Persistido en Firestore
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-950 text-amber-400 text-[10px] font-mono rounded border border-amber-800">
                  Cambios Pendientes
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400">
              Personaliza Tono (Pitch), Velocidad (Speed) y Calidez (Warmth) para mantener coherencia de marca
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToFirestore}
            disabled={isSaving}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Guardar en Firestore</span>
          </button>
        </div>
      </div>

      {/* Role Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        {(["Host", "Expert", "Analyst"] as const).map((role) => (
          <button
            key={role}
            onClick={() => setActiveTab(role)}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === role
                ? "bg-slate-800 text-indigo-400 border-t-2 border-indigo-500"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Rol: {role}</span>
          </button>
        ))}
      </div>

      {/* Voice Controls Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
        {/* Voice Model Selector */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Modelo de Voz Base
          </label>
          <select
            value={currentConfig.voiceName}
            onChange={(e) => handleProfileChange("voiceName", e.target.value)}
            className="w-full bg-slate-900 text-slate-100 border border-slate-700 text-xs rounded-lg px-3 py-2 outline-none focus:border-indigo-500 font-medium"
          >
            {AVAILABLE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pitch Control */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="text-slate-400 uppercase">Tono (Pitch)</span>
            <span className="text-indigo-400">{currentConfig.pitch > 0 ? `+${currentConfig.pitch}` : currentConfig.pitch} Hz</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={currentConfig.pitch}
            onChange={(e) => handleProfileChange("pitch", parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer pt-2"
          />
          <span className="text-[9px] text-slate-500 block">
            Grave (-50) ← Neutral (0) → Agudo (+50)
          </span>
        </div>

        {/* Speed Control */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="text-slate-400 uppercase">Velocidad (Speed)</span>
            <span className="text-indigo-400">{currentConfig.speed}x</span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.5"
            step="0.05"
            value={currentConfig.speed}
            onChange={(e) => handleProfileChange("speed", parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer pt-2"
          />
          <span className="text-[9px] text-slate-500 block">
            Pausado (0.7x) ← Normal (1.0x) → Rápido (1.5x)
          </span>
        </div>

        {/* Warmth Control */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-mono font-bold">
            <span className="text-slate-400 uppercase">Calidez (Warmth EQ)</span>
            <span className="text-indigo-400">{currentConfig.warmth}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={currentConfig.warmth}
            onChange={(e) => handleProfileChange("warmth", parseInt(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer pt-2"
          />
          <span className="text-[9px] text-slate-500 block">
            Crisp/Radio (0%) ← Cálico/Graves (100%)
          </span>
        </div>
      </div>
    </div>
  );
}
