"use client";

import React from "react";
import { ShieldAlert, X, Sparkles, User } from "lucide-react";
import { useToast } from "./Toast";
import { useAuth } from "../app/AuthProvider";

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
}

export function AuthRequiredModal({ isOpen, onClose, featureName = "esta función avanzada" }: AuthRequiredModalProps) {
  const { addToast } = useToast();
  const { loginWithGoogle } = useAuth();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      const signedInUser = await loginWithGoogle();
      if (signedInUser) {
        addToast("Autenticación Completada", "Sesión iniciada con Google correctamente.", "success");
      }
      onClose();
    } catch (error) {
      console.error(error);
      addToast("Error de Autenticación", "No se pudo iniciar sesión con Google. Inténtalo de nuevo.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col p-6 space-y-6 text-center">
        <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Autenticación Requerida</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Para acceder a <span className="font-semibold text-indigo-600 dark:text-indigo-400">{featureName}</span> y asegurar tus datos en Firestore, debes iniciar sesión con tu cuenta de Google.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>Iniciar Sesión con Google</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs rounded-xl transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
