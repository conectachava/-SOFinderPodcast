"use client";

import React, { useState, useEffect } from "react";
import { User, Key, Check, X, Shield, Save, LogOut, Clock, Users } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { useAuth, UserProfileWithStatus } from "../app/AuthProvider";

export interface UserProfile {
  name: string;
  email: string;
  preferredFormat: "Debate" | "Análisis" | "Opinión";
  customHostVoice: string;
  episodesCount: number;
  isLoggedIn?: boolean;
  autoArchive?: boolean;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearSession?: () => void;
}

export function UserProfileModal({
  isOpen,
  onClose,
  onClearSession,
}: UserProfileModalProps) {
  const { user, profile: authProfile, isAdmin, setProfile } = useAuth();
  const [localProfile, setLocalProfile] = useState<UserProfileWithStatus | null>(authProfile);
  const [activeTab, setActiveTab] = useState<"profile" | "admin">("profile");
  const [pendingUsers, setPendingUsers] = useState<UserProfileWithStatus[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const loadPendingUsers = async () => {
    setLoadingUsers(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList: UserProfileWithStatus[] = [];
      usersSnap.forEach((doc) => {
        const data = doc.data() as UserProfileWithStatus;
        if (data.status === "pending") {
          usersList.push({ ...data, uid: doc.id });
        }
      });
      setPendingUsers(usersList);
    } catch (error) {
      console.error("Error loading pending users", error);
    }
    setLoadingUsers(false);
  };
  
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProfile(authProfile);
  }, [authProfile]);

  useEffect(() => {
    if (isAdmin && activeTab === "admin") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPendingUsers();
    }
  }, [isAdmin, activeTab]);

  const handleApproveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { status: "approved" });
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error approving user", error);
    }
  };

  const handleRejectUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, "users", uid), { status: "rejected" });
      setPendingUsers(pendingUsers.filter(u => u.uid !== uid));
    } catch (error) {
      console.error("Error rejecting user", error);
    }
  };

  if (!isOpen) return null;

  const handleLoginRegister = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleSave = () => {
    if (localProfile) {
      setProfile(localProfile);
    }
    onClose();
  };

  const isPending = authProfile?.status === "pending" && !isAdmin;
  const isRejected = authProfile?.status === "rejected" && !isAdmin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400 border border-slate-700">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Perfil de Usuario</h3>
              <p className="text-xs text-slate-400">SourceFinder AI Studio</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Tabs */}
        {isAdmin && user && (
          <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === "profile" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              Mi Perfil
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === "admin" ? "text-slate-900 border-b-2 border-slate-900" : "text-slate-500 hover:text-slate-700"}`}
            >
              <Shield className="w-3.5 h-3.5" />
              Administración
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {!user ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Inicia sesión con Google para guardar tu historial y solicitar acceso al sistema. Las solicitudes deben ser aprobadas por un administrador.
              </div>
              <button
                onClick={handleLoginRegister}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <Key className="w-4 h-4" />
                Iniciar Sesión con Google
              </button>
            </div>
          ) : activeTab === "profile" ? (
            <div className="space-y-5">
              {/* Account Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{authProfile?.name || user.displayName}</span>
                    {isAdmin ? (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200 flex items-center gap-1">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : authProfile?.status === "approved" ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                        Aprobado
                      </span>
                    ) : authProfile?.status === "rejected" ? (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-full border border-rose-200">
                        Rechazado
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{authProfile?.email || user.email}</p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Episodios</span>
                  <span className="font-bold text-slate-900 text-base">{authProfile?.episodesCount || 0}</span>
                </div>
              </div>

              {isPending && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex gap-3">
                  <Clock className="w-5 h-5 text-amber-500 shrink-0" />
                  <p>Tu solicitud de acceso está pendiente de revisión por parte de un administrador. No podrás generar podcasts hasta que sea aprobada.</p>
                </div>
              )}

              {isRejected && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex gap-3">
                  <X className="w-5 h-5 text-rose-500 shrink-0" />
                  <p>Tu solicitud de acceso ha sido rechazada.</p>
                </div>
              )}

              {/* Preferences Form */}
              {localProfile && !isPending && !isRejected && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Preferencias de Estudio</h4>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Formato por Defecto</label>
                    <select
                      value={localProfile.preferredFormat}
                      onChange={(e) =>
                        setLocalProfile({ ...localProfile, preferredFormat: e.target.value as any })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
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
                      value={localProfile.customHostVoice}
                      onChange={(e) => setLocalProfile({ ...localProfile, customHostVoice: e.target.value })}
                      placeholder="Paul (Moderador británico)"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-xs font-medium text-slate-800">Auto-archivar Episodios</span>
                      <span className="text-[10px] text-slate-500">Mueve episodios &gt; 30 días al Cloud Archive</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!localProfile.autoArchive}
                      onChange={(e) => setLocalProfile({ ...localProfile, autoArchive: e.target.checked })}
                      className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex flex-wrap items-center justify-between border-t border-slate-200 gap-2">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleLogout}
                    className="text-xs text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 hover:underline"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </button>
                  {onClearSession && (
                    <button
                      onClick={() => {
                        onClearSession();
                        onClose();
                      }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 hover:underline"
                      title="Wipe current draft state and reset workspace"
                    >
                      🗑️ Limpiar Sesión Activa
                    </button>
                  )}
                </div>
                {(!isPending && !isRejected) && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Usuarios Pendientes</h4>
                <button onClick={loadPendingUsers} className="text-[10px] text-slate-500 hover:text-slate-900 underline">
                  Refrescar
                </button>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8 text-xs text-slate-500">Cargando solicitudes...</div>
              ) : pendingUsers.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No hay solicitudes pendientes</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingUsers.map((pendingUser) => (
                    <div key={pendingUser.uid} className="p-3 border border-slate-200 rounded-xl bg-white shadow-sm flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{pendingUser.name}</p>
                        <p className="text-[10px] text-slate-500">{pendingUser.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectUser(pendingUser.uid!)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Rechazar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleApproveUser(pendingUser.uid!)}
                          className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aprobar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
