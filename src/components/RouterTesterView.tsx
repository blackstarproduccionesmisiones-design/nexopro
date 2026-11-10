import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  ExternalLink,
  Nfc,
  QrCode,
} from 'lucide-react';
import { recordSimulatedScan } from '../lib/firestoreService';
import type { AuthUser, Plaque, RouterTestResult } from '../types';

interface RouterTesterViewProps {
  user: AuthUser;
  plaques: Plaque[];
  onRefresh: () => void;
}

export function RouterTesterView({ user, plaques, onRefresh }: RouterTesterViewProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(plaques[0]?.slug || '');
  const [channel, setChannel] = useState<'qr' | 'nfc'>('qr');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<(RouterTestResult & { scansCount: number }) | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedPlaque = plaques.find((p) => p.slug === selectedSlug) || plaques[0];

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlaque) return;
    setLoading(true);
    setError(null);
    try {
      const res = await recordSimulatedScan(user, selectedPlaque, channel);
      setResult({ ...res, scansCount: selectedPlaque.scansCount + 1 });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al probar el enrutador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
          Enrutador Dinámico HTTP 301
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Simula el escaneo de un código QR o toque NFC y verifica la resolución en vivo contra
          Firebase Firestore sin caché.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleRunTest}
          className="lg:col-span-6 bg-[#0E1628] border border-slate-800/80 rounded-xl p-6 space-y-5"
        >
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Seleccionar placa registrada
            </label>
            <select
              value={selectedSlug || selectedPlaque?.slug || ''}
              onChange={(e) => {
                setSelectedSlug(e.target.value);
                setResult(null);
              }}
              className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {plaques.map((p) => (
                <option key={p.id} value={p.slug}>
                  {p.serialCode} — /qr/{p.slug} ({p.label})
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-300 mb-2">
              Canal de entrada físico
            </span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setChannel('qr')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  channel === 'qr'
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                    : 'bg-[#080D1A] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>Escaneo QR</span>
              </button>
              <button
                type="button"
                onClick={() => setChannel('nfc')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  channel === 'nfc'
                    ? 'bg-emerald-600/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-[#080D1A] border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Nfc className="w-4 h-4" />
                <span>Toque NFC</span>
              </button>
            </div>
          </div>

          {selectedPlaque && (
            <div className="rounded-xl bg-[#080D1A] border border-slate-800 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Ruta física en placa</span>
                <span className="font-mono text-blue-400">/qr/{selectedPlaque.slug}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-400">
                <span>Destino actual en Firestore</span>
                <span className="font-mono text-slate-200 truncate">
                  {selectedPlaque.targetUrl || 'Sin configurar'}
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading || plaques.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Activity className="w-4 h-4" />
              <span>{loading ? 'Resolviendo...' : 'Ejecutar redirección en vivo'}</span>
            </button>

            {selectedPlaque && selectedPlaque.targetUrl && selectedPlaque.status === 'active' && (
              <a
                href={`/qr/${selectedPlaque.slug}?src=${channel}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200"
              >
                <span>Abrir en navegador</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </form>

        <div className="lg:col-span-6 bg-[#0E1628] border border-slate-800/80 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">
              Respuesta del servidor
            </h2>
            {result && (
              <span className="font-mono text-xs text-emerald-400">
                HTTP {result.statusCode} · {result.latencyMs} ms
              </span>
            )}
          </div>

          {!result ? (
            <div className="rounded-xl bg-[#080D1A] border border-slate-800 p-8 text-center text-sm text-slate-500">
              Ejecuta una prueba para inspeccionar las cabeceras HTTP 301 desde Firestore y el
              registro automático de la lectura.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-[#080D1A] border border-slate-800 p-4 font-mono text-xs space-y-2 overflow-x-auto">
                <div className="text-slate-400">
                  GET <span className="text-blue-400">/qr/{result.slug}?src={channel}</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    HTTP/1.1 {result.statusCode}{' '}
                    {result.statusCode === 301
                      ? 'Moved Permanently'
                      : result.statusCode === 302
                      ? 'Found'
                      : 'OK'}
                  </span>
                </div>
                {result.locationHeader && (
                  <div className="text-slate-300 break-all">
                    <span className="text-slate-500">Location:</span> {result.locationHeader}
                  </div>
                )}
                {result.cacheControl && (
                  <div className="text-slate-400">
                    <span className="text-slate-500">Cache-Control:</span> {result.cacheControl}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Lecturas totales de esta placa</span>
                <span className="font-mono tabular-nums text-base font-bold text-white">
                  {result.scansCount.toLocaleString('es-ES')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
