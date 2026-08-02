"use client";

import React, { useState, useEffect } from "react";
import { Radio, Sparkles, ArrowRight, CheckCircle2, Lock, Cpu, Mail, Phone, LockKeyhole, UserPlus, LogIn, KeyRound, HelpCircle, Calculator, ShieldCheck, Layers, FileText } from "lucide-react";
import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  signInAnonymously
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "./Toast";
import { LandingHero } from "./LandingHero";

interface LoginPageProps {
  onBypassGuest?: () => void;
}

type AuthMode = "social" | "email" | "phone";

export function LoginPage({ onBypassGuest }: LoginPageProps) {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<AuthMode>("social");
  const [loadingMethod, setLoadingMethod] = useState<string | null>(null);
  const [showLandingModal, setShowLandingModal] = useState(false);

  // Email form state
  const [emailMode, setEmailMode] = useState<"login" | "register" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneStep, setPhoneStep] = useState<"send" | "verify">("send");

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          console.warn("Recaptcha cleanup notice:", e);
        }
      }
    };
  }, []);

  // Google Login
  const handleGoogleLogin = async () => {
    setLoadingMethod("google");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      addToast("¡Bienvenido!", "Sesión iniciada con éxito mediante Google.", "success");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/popup-closed-by-user") {
        addToast("Aviso", "Ventana de autenticación cerrada.", "info");
      } else {
        addToast("Error de Acceso", error.message || "No se pudo iniciar sesión con Google.", "error");
      }
    } finally {
      setLoadingMethod(null);
    }
  };

  // Facebook Login
  const handleFacebookLogin = async () => {
    setLoadingMethod("facebook");
    try {
      const provider = new FacebookAuthProvider();
      await signInWithPopup(auth, provider);
      addToast("¡Bienvenido!", "Sesión iniciada con éxito mediante Facebook.", "success");
    } catch (error: any) {
      console.error(error);
      if (error.code === "auth/popup-closed-by-user") {
        addToast("Aviso", "Ventana de autenticación cerrada.", "info");
      } else if (error.code === "auth/account-exists-with-different-credential") {
        addToast("Aviso de cuenta", "Ya existe una cuenta registrada con este correo usando otro proveedor.", "info");
      } else {
        addToast("Error Facebook", "No se pudo completar el acceso con Facebook. Intenta de nuevo.", "error");
      }
    } finally {
      setLoadingMethod(null);
    }
  };

  // Email/Password Submit
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast("Campo requerido", "Ingresa un correo electrónico válido.", "info");
      return;
    }

    if (emailMode === "reset") {
      setLoadingMethod("email");
      try {
        await sendPasswordResetEmail(auth, email);
        addToast("Correo Enviado", `Hemos enviado un enlace de recuperación a ${email}.`, "success");
        setEmailMode("login");
      } catch (error: any) {
        addToast("Error de Recuperación", error.message || "No se pudo enviar el correo de restablecimiento.", "error");
      } finally {
        setLoadingMethod(null);
      }
      return;
    }

    if (!password) {
      addToast("Campos requeridos", "Ingresa tu contraseña.", "info");
      return;
    }

    setLoadingMethod("email");
    try {
      if (emailMode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
        addToast("¡Bienvenido!", "Sesión iniciada correctamente con correo.", "success");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        addToast("Cuenta creada", "Tu cuenta se ha registrado exitosamente.", "success");
      }
    } catch (error: any) {
      console.error("Email auth error:", error);
      let errMsg = "Credenciales incorrectas o error en el servicio.";
      if (error.code === "auth/email-already-in-use") {
        errMsg = "Este correo electrónico ya está registrado. Intenta iniciar sesión.";
      } else if (error.code === "auth/weak-password") {
        errMsg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errMsg = "Correo o contraseña incorrectos.";
      }
      addToast("Error de Autenticación", errMsg, "error");
    } finally {
      setLoadingMethod(null);
    }
  };

  // Phone Auth Step 1: Send SMS
  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      addToast("Número Inválido", "Ingresa tu número telefónico completo con clave de país (ej: +5215512345678).", "info");
      return;
    }

    setLoadingMethod("phone");
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
      }

      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phoneNumber.startsWith("+") ? phoneNumber.trim() : `+${phoneNumber.trim()}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      
      setConfirmationResult(confirmation);
      setPhoneStep("verify");
      addToast("Código Enviado", `Hemos enviado un código SMS de verificación a ${formattedPhone}.`, "success");
    } catch (error: any) {
      console.error("Phone Auth error:", error);
      let msg = "No se pudo enviar el SMS. Verifica que el número tenga clave internacional.";
      if (error.code === "auth/invalid-phone-number") {
        msg = "El formato del número telefónico es inválido. Usa formato E.164 (+XX XXXXXXXXXX).";
      }
      addToast("Error de SMS", msg, "error");
    } finally {
      setLoadingMethod(null);
    }
  };

  // Phone Auth Step 2: Verify Code
  const handleVerifySmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.trim().length < 4) {
      addToast("Código requerido", "Ingresa el código de 6 dígitos enviado a tu teléfono.", "info");
      return;
    }

    if (!confirmationResult) {
      addToast("Error", "Solicita nuevamente un código de verificación SMS.", "error");
      setPhoneStep("send");
      return;
    }

    setLoadingMethod("phone-verify");
    try {
      await confirmationResult.confirm(verificationCode.trim());
      addToast("¡Teléfono verificado!", "Sesión iniciada con éxito.", "success");
    } catch (error: any) {
      console.error("SMS Verify error:", error);
      addToast("Código Incorrecto", "El código SMS ingresado no es válido o ya ha expirado.", "error");
    } finally {
      setLoadingMethod(null);
    }
  };

  // Guest Login
  const handleGuestLogin = async () => {
    setLoadingMethod("guest");
    try {
      await signInAnonymously(auth);
      if (onBypassGuest) {
        onBypassGuest();
      }
      addToast("Modo Invitado", "Has ingresado de forma anónima. Tus datos se mantendrán durante la sesión actual.", "success");
    } catch (error) {
      console.error(error);
      addToast("Modo Invitado", "Usando acceso directo local.", "info");
      if (onBypassGuest) {
        onBypassGuest();
      }
    } finally {
      setLoadingMethod(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden">
      {/* Container for invisible reCAPTCHA */}
      <div id="recaptcha-container"></div>

      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Radio className="w-5 h-5 animate-pulse text-amber-300" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-2">
              SourceFinder Pod <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">PRO v3.5</span>
            </h1>
            <p className="text-xs text-slate-400">Plataforma Estratégica de Podcasts & Auditoría de Fuentes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLandingModal(!showLandingModal)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Calculator className="w-3.5 h-3.5 text-amber-400" />
            <span>{showLandingModal ? "Volver al Login" : "Ver Dolor, Solución y Planes"}</span>
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auth SSL Protected</span>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      {showLandingModal ? (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 z-10">
          <LandingHero onStartNow={() => setShowLandingModal(false)} />
        </main>
      ) : (
        <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col lg:flex-row items-center justify-center gap-12 z-10">
          {/* Left Column: Strategic Value Proposition */}
          <div className="flex-1 space-y-8 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>Plataforma #1 de Automatización de Podcasts con Gemini 2.0</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Elimina las <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-amber-300 to-indigo-400">18 Horas de Caos</span> en cada episodio de tu Podcast.
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              SourceFinder Pod unifica en 1 solo clic la investigación de fuentes verified con Google Search Grounding, redacción multivoz de guiones de impacto, síntesis de audio HD y storyboard visual.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-rose-400 font-bold uppercase">Sin SourceFinder</span>
                  <span className="text-[10px] font-mono text-slate-500">18+ Horas</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Búsqueda caótica de enlaces, riesgo de fake news, monólogos aburridos y edición costosa.</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 space-y-2 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">Con SourceFinder</span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">3 Minutos</span>
                </div>
                <p className="text-xs text-slate-300 font-medium">Fuentes auditadas, guión multivoz inmediato, consola de masterización y cero alucinaciones.</p>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={() => setShowLandingModal(true)}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1.5 cursor-pointer"
              >
                <Calculator className="w-4 h-4" />
                <span>Calcular Ahorro en Tokens & Comparar con Descript / ElevenLabs</span>
              </button>
            </div>
          </div>

          {/* Right Column: Multi-Method Auth Box */}
          <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center backdrop-blur-md relative">
            <div className="space-y-1.5">
              <div className="w-12 h-12 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/30 shadow-inner">
                <Radio className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Inicia Sesión en el Sistema</h3>
              <p className="text-xs text-slate-400">Acceso seguro multicanal para podcasters & creadores</p>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-950/90 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("social")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "social" ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Redes Social
              </button>
              <button
                onClick={() => setActiveTab("email")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "email" ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setActiveTab("phone")}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  activeTab === "phone" ? "bg-indigo-600 text-white shadow-md font-bold" : "text-slate-400 hover:text-white"
                }`}
              >
                Teléfono
              </button>
            </div>

            {/* TAB 1: SOCIAL LOGINS (Google, Facebook) */}
            {activeTab === "social" && (
              <div className="space-y-3 pt-1">
                {/* Google Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loadingMethod !== null}
                  className={`w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
                    loadingMethod === "google" ? "opacity-70" : ""
                  }`}
                >
                  {loadingMethod === "google" ? (
                    <svg className="animate-spin w-4 h-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  )}
                  <span>{loadingMethod === "google" ? "Conectando Google..." : "Continuar con Google"}</span>
                </button>

                {/* Facebook Button */}
                <button
                  onClick={handleFacebookLogin}
                  disabled={loadingMethod !== null}
                  className={`w-full py-3.5 px-4 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
                    loadingMethod === "facebook" ? "opacity-70" : ""
                  }`}
                >
                  {loadingMethod === "facebook" ? (
                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span>{loadingMethod === "facebook" ? "Conectando Facebook..." : "Continuar con Facebook"}</span>
                </button>
              </div>
            )}

            {/* TAB 2: EMAIL & PASSWORD / RESET */}
            {activeTab === "email" && (
              <form onSubmit={handleEmailAuth} className="space-y-3 pt-1 text-left">
                <div className="flex items-center justify-between text-xs text-slate-400 font-semibold px-0.5">
                  <span>
                    {emailMode === "login" ? "Iniciar Sesión" : emailMode === "register" ? "Crear nueva cuenta" : "Recuperar contraseña"}
                  </span>
                  <div className="flex items-center gap-2">
                    {emailMode !== "reset" && (
                      <button
                        type="button"
                        onClick={() => setEmailMode("reset")}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        ¿Olvidaste clave?
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setEmailMode(emailMode === "login" ? "register" : "login")}
                      className="text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      {emailMode === "login" ? <UserPlus className="w-3 h-3" /> : <LogIn className="w-3 h-3" />}
                      <span>{emailMode === "login" ? "Crear cuenta" : "Tengo cuenta"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {emailMode !== "reset" && (
                    <div className="relative">
                      <LockKeyhole className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loadingMethod !== null}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loadingMethod === "email" ? (
                    <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : emailMode === "login" ? (
                    <LogIn className="w-4 h-4" />
                  ) : emailMode === "register" ? (
                    <UserPlus className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>
                    {loadingMethod === "email"
                      ? "Procesando..."
                      : emailMode === "login"
                      ? "Entrar con Correo"
                      : emailMode === "register"
                      ? "Registrar Cuenta"
                      : "Enviar Correo Recuperación"}
                  </span>
                </button>
              </form>
            )}

            {/* TAB 3: PHONE NUMBER (SMS) */}
            {activeTab === "phone" && (
              <div className="pt-1 text-left space-y-3">
                {phoneStep === "send" ? (
                  <form onSubmit={handleSendSms} className="space-y-3">
                    <p className="text-[11px] text-slate-400">
                      Ingresa tu número celular con código internacional (+52, +1, +34, etc) para recibir un mensaje SMS.
                    </p>

                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingMethod !== null}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingMethod === "phone" ? (
                        <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>{loadingMethod === "phone" ? "Enviando SMS..." : "Enviar Código SMS"}</span>
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySmsCode} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-slate-300 font-semibold">
                        Código enviado a <span className="text-amber-400">{phoneNumber}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setPhoneStep("send")}
                        className="text-[10px] text-indigo-400 hover:underline cursor-pointer"
                      >
                        Cambiar número
                      </button>
                    </div>

                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Código de 6 dígitos"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loadingMethod !== null}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loadingMethod === "phone-verify" ? (
                        <svg className="animate-spin w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>{loadingMethod === "phone-verify" ? "Verificando..." : "Confirmar y Entrar"}</span>
                    </button>
                  </form>
                )}
              </div>
            )}

            {/* Divider & Guest Demo Button */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase">o probar demo inmediata</span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={loadingMethod !== null}
              className={`w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs rounded-xl transition-colors border border-slate-800 flex items-center justify-center gap-2 cursor-pointer ${
                loadingMethod === "guest" ? "opacity-70" : ""
              }`}
            >
              {loadingMethod === "guest" ? (
                <svg className="animate-spin w-4 h-4 text-slate-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                "🚀"
              )}
              <span>{loadingMethod === "guest" ? "Ingresando..." : "Ingresar como Invitado (Modo Demo)"}</span>
            </button>

            <p className="text-[11px] text-slate-500 pt-1">
              Al continuar, aceptas los términos de uso y privacidad de SourceFinder Pod.
            </p>
          </div>
        </main>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>SourceFinder Pod © 2026 • Conecta Chava • VSNRY LABS • Todos los derechos reservados.</p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLandingModal(true)}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Ahorro & Token Calculator
          </button>
          <span>•</span>
          <span className="font-mono text-[10px]">Powered by Google Gemini AI Engine</span>
        </div>
      </footer>
    </div>
  );
}

