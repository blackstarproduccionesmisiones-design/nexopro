import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ArrowRight, Lock, ShieldCheck } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { BrandMark } from './Icons';

export function LoginView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.';
      if (msg.includes('popup-closed-by-user')) {
        setError('Cerraste la ventana de acceso antes de completar el inicio de sesión.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D1A] text-slate-100 flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-[#0E1628] border border-slate-800/80 rounded-2xl p-8 lg:p-10">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <BrandMark className="w-9 h-9" />
              <span className="font-display text-lg font-bold tracking-tight text-white">
                NEXO <span className="text-blue-400">PRO</span>
              </span>
            </div>

            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight max-w-xl">
              Control total sobre tus placas físicas NFC y códigos QR dinámicos.
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-xl">
              Base de datos en tiempo real con Firebase Firestore, enrutador HTTP 301 sin caché
              y portal multiusuario para comercios. Cambia enlaces de Google Maps o WhatsApp al
              instante sin reimprimir tus placas.
            </p>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <p className="text-xs font-semibold text-blue-400 tracking-wide">01. Enrutador 301</p>
              <p className="mt-1.5 text-sm text-slate-300 font-medium">Redirección instantánea</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Cada escaneo en <span className="font-mono text-slate-400">/qr/slug</span> consulta
                Firestore y redirige al destino vigente.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-400 tracking-wide">02. Lotes en nube</p>
              <p className="mt-1.5 text-sm text-slate-300 font-medium">Series correlativas</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Emite placas con serial único, QR descargable en SVG/PNG y exportación CSV para
                imprenta.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-400 tracking-wide">03. Multiusuario</p>
              <p className="mt-1.5 text-sm text-slate-300 font-medium">Reglas Zero-Trust</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                Cada comercio accede con su correo Google autorizado y edita solo sus propias
                placas.
              </p>
            </div>
          </div>
        </div>

        {/* Right column: Google Auth */}
        <div className="lg:col-span-5 bg-[#0E1628] border border-slate-800/80 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Acceso seguro con Firebase Authentication</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">Ingresar al panel</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Inicia sesión con tu cuenta de Google para acceder como administrador de la plataforma
              o como cliente comercial autorizado.
            </p>

            <div className="mt-8 space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
                  />
                </svg>
                <span>{loading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-xs text-rose-300">
                  {error}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                El administrador del panel maestro{' '}
                <span className="font-mono text-slate-200">
                  blackstarproducciones.misiones@gmail.com
                </span>{' '}
                tiene control completo y puede habilitar correos Google de clientes desde la
                pestaña <strong className="text-slate-200">Clientes y Abonos</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
