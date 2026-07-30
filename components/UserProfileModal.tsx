"use client";

import React, { useState, useEffect } from "react";
import { User, Key, Check, X, Shield, Save, LogOut } from "lucide-react";

export interface UserProfile {
  name: string;
  email: string;
  preferredFormat: "Debate" | "Análisis" | "Opinión";
  customHostVoice: string;
  episodesCount: number;
  isLoggedIn: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  profile: initialProfile,
  onSaveProfile,
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [emailInput, setEmailInput] = useState(initialProfile.email || "");
  const [nameInput, setNameInput] = useState(initialProfile.name || "Productor General");

  if (!isOpen) return null;

  const handleLoginRegister = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: nameInput || "Productor General",
      email: emailInput || "productor@sourfinder.ai",
      isLoggedIn: true,
    };
    onSaveProfile(updated);
  };

  const handleLogout = () => {
    const updated: UserProfile = {
      ...profile,
      isLoggedIn: false,
    };
    onSaveProfile(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Perfil de Usuario & Preferencias</h3>
              <p className="text-xs text-slate-400">SourceFinder AI Studio User Account</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!profile.isLoggedIn ? (
            <form onSubmit={handleLoginRegister} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Inicia sesión o regístrate para guardar tu historial de podcasts, episodios generados y configuraciones personalizadas de voz.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre o Alias</label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Ej: Productor Principal"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="usuario@dominio.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Key className="w-4 h-4" />
                Registrarse / Iniciar Sesión
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              {/* Account Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{profile.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                      Activo
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{profile.email}</p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Episodios</span>
                  <span className="font-bold text-slate-900 text-base">{profile.episodesCount}</span>
                </div>
              </div>

              {/* Preferences Form */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferencias de Estudio</h4>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Formato por Defecto</label>
                  <select
                    value={profile.preferredFormat}
                    onChange={(e) =>
                      setProfile({ ...profile, preferredFormat: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
                  >
                    <option value="Análisis">Análisis (Mesa Redonda)</option>
                    <option value="Debate">Debate (Conflicto)</option>
                    <option value="Opinión">Opinión (Entrevista)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Moderador Principal</label>
                  <input
                    type="text"
                    value={profile.customHostVoice}
                    onChange={(e) => setProfile({ ...profile, customHostVoice: e.target.value })}
                    placeholder="Paul (Moderador británico)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Cerrar Sesión
                </button>

                <button
                  onClick={() => {
                    onSaveProfile(profile);
                    onClose();
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
