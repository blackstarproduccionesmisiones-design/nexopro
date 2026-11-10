import React, { useEffect, useState } from 'react';
import {
  Activity,
  Check,
  Copy,
  Download,
  ExternalLink,
  Nfc,
  Save,
  X,
} from 'lucide-react';
import {
  generateQrForSlug,
  recordSimulatedScan,
  updatePlaqueDoc,
  validateHttpUrl,
} from '../lib/firestoreService';
import {
  PLAQUE_STATUS_LABELS,
  PLAQUE_TYPE_LABELS,
  type AuthUser,
  type Client,
  type Plaque,
  type PlaqueStatus,
  type PlaqueType,
  type QrAssets,
  type RouterTestResult,
} from '../types';

interface PlaqueInspectorModalProps {
  user: AuthUser;
  plaque: Plaque;
  clients: Client[];
  onClose: () => void;
  onUpdated: (updated: Plaque) => void;
}

export function PlaqueInspectorModal({
  user,
  plaque,
  clients,
  onClose,
  onUpdated,
}: PlaqueInspectorModalProps) {
  const isAdmin = user.role === 'admin';

  const [label, setLabel] = useState(plaque.label);
  const [slug, setSlug] = useState(plaque.slug);
  const [clientId, setClientId] = useState<string>(plaque.clientId || '');
  const [plaqueType, setPlaqueType] = useState<PlaqueType>(plaque.plaqueType);
  const [targetUrl, setTargetUrl] = useState(plaque.targetUrl);
  const [status, setStatus] = useState<PlaqueStatus>(plaque.status);
  const [redirectCode, setRedirectCode] = useState<number>(plaque.redirectCode || 301);

  const [qrAssets, setQrAssets] = useState<QrAssets | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<RouterTestResult | null>(null);
  const [liveCount, setLiveCount] = useState<number>(plaque.scansCount);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    generateQrForSlug(plaque.slug)
      .then((res) => {
        if (active) setQrAssets(res);
      })
      .catch(() => {
        // ignore qr load failure
      });
    return () => {
      active = false;
    };
  }, [plaque.slug]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedMsg(null);
    if (targetUrl.trim() && !validateHttpUrl(targetUrl.trim())) {
      setError('La URL de destino debe iniciar con http:// o https://.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePlaqueDoc(user, plaque, clients, {
        label,
        targetUrl,
        status: !targetUrl.trim() && status === 'active' ? 'unassigned' : status,
        ...(isAdmin
          ? {
              slug,
              clientId,
              plaqueType,
              redirectCode,
            }
          : {}),
      });
      setSavedMsg(
        'Destino guardado en Firestore. Los escaneos físicos ya redirigen al nuevo enlace.'
      );
      onUpdated(updated);
      const nextQr = await generateQrForSlug(updated.slug);
      setQrAssets(nextQr);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestRedirect = async (channel: 'qr' | 'nfc') => {
    setTesting(true);
    setError(null);
    try {
      const res = await recordSimulatedScan(user, plaque, channel);
      setTestResult(res);
      const nextCount = liveCount + 1;
      setLiveCount(nextCount);
      onUpdated({
        ...plaque,
        slug,
        targetUrl,
        status,
        scansCount: nextCount,
        lastScannedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo probar la redirección.');
    } finally {
      setTesting(false);
    }
  };

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(key);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  const downloadFile = (href: string, filename: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSvg = () => {
    if (!qrAssets?.svg) return;
    const blob = new Blob([qrAssets.svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, `${slug}-qr.svg`);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 text-xs font-mono text-blue-400">
              <span>{plaque.serialCode}</span>
              <span className="text-slate-600" aria-hidden="true">·</span>
              <span>/qr/{plaque.slug}</span>
            </div>
            <h2 className="font-display text-lg font-bold text-white truncate">
              {plaque.label}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar inspector"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Dynamic Destination & Routing Editor */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nombre / Ubicación física de la placa
              </label>
              <input
                type="text"
                required
                maxLength={140}
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  URL de destino dinámica (sin reimprimir)
                </label>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setTargetUrl('https://g.page/r/tu-negocio/review')}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    Google Reseñas
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={() => setTargetUrl('https://wa.me/5491100000000?text=Hola')}
                    className="text-emerald-400 hover:underline cursor-pointer"
                  >
                    WhatsApp
                  </button>
                </div>
              </div>
              <input
                type="url"
                maxLength={1000}
                value={targetUrl}
                onChange={(e) => {
                  setTargetUrl(e.target.value);
                  if (e.target.value.trim() && status === 'unassigned') {
                    setStatus('active');
                  }
                }}
                placeholder="https://g.page/r/... o https://wa.me/..."
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Estado de la placa
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PlaqueStatus)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(PLAQUE_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {isAdmin && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Código HTTP de redirección
                  </label>
                  <select
                    value={redirectCode}
                    onChange={(e) => setRedirectCode(Number(e.target.value))}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value={301}>HTTP 301 (Permanente + no-store)</option>
                    <option value={302}>HTTP 302 (Temporal)</option>
                  </select>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ruta corta (/qr/slug)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={64}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Cliente asignado
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.businessName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Categoría física
                </label>
                <select
                  value={plaqueType}
                  onChange={(e) => setPlaqueType(e.target.value as PlaqueType)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {Object.entries(PLAQUE_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {savedMsg && (
              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-300">
                {savedMsg}
              </div>
            )}

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar destino'}</span>
              </button>

              {qrAssets?.shortUrl && targetUrl && status === 'active' && (
                <a
                  href={`/qr/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-xs font-medium text-slate-200 transition-colors"
                >
                  <span>Abrir enlace real</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </form>

          {/* Right: Real QR Code, NFC URI, Download & Live 301 Test */}
          <div className="lg:col-span-5 bg-[#080D1A] border border-slate-800/90 rounded-xl p-5 flex flex-col justify-between space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-300">
                  Código QR físico estático
                </span>
                <span className="font-mono tabular-nums text-xs text-slate-400">
                  {liveCount.toLocaleString('es-ES')} lecturas
                </span>
              </div>

              <div className="bg-white rounded-xl p-3 w-44 h-44 mx-auto flex items-center justify-center">
                {qrAssets?.pngDataUrl ? (
                  <img
                    src={qrAssets.pngDataUrl}
                    alt={`Código QR para ${plaque.slug}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-slate-500">Generando QR...</span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={!qrAssets}
                  onClick={() =>
                    qrAssets && downloadFile(qrAssets.pngDataUrl, `${slug}-qr.png`)
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG</span>
                </button>
                <button
                  type="button"
                  disabled={!qrAssets}
                  onClick={downloadSvg}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>SVG Vector</span>
                </button>
              </div>
            </div>

            <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1">
                  URL para impresión QR
                </p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 bg-[#0E1628] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-blue-300 truncate">
                    {qrAssets?.shortUrl || `/qr/${slug}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText('qr', qrAssets?.shortUrl || `/qr/${slug}`)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Copiar URL QR"
                  >
                    {copiedField === 'qr' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
                  <Nfc className="w-3 h-3 text-emerald-400" />
                  <span>URI para grabar en chip NFC</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 bg-[#0E1628] border border-slate-800 rounded px-2.5 py-1.5 text-[11px] font-mono text-emerald-300 truncate">
                    {qrAssets?.nfcUrl || `/qr/${slug}?src=nfc`}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyText('nfc', qrAssets?.nfcUrl || `/qr/${slug}?src=nfc`)}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Copiar URI NFC"
                  >
                    {copiedField === 'nfc' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={testing}
                  onClick={() => handleTestRedirect('qr')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-blue-400" />
                  <span>{testing ? 'Probando...' : 'Simular QR (+1)'}</span>
                </button>
                <button
                  type="button"
                  disabled={testing}
                  onClick={() => handleTestRedirect('nfc')}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white cursor-pointer"
                >
                  <Nfc className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{testing ? 'Probando...' : 'Simular NFC (+1)'}</span>
                </button>
              </div>

              {testResult && (
                <div className="rounded-lg bg-[#0E1628] border border-slate-800 p-2.5 text-[11px] font-mono space-y-1">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>HTTP {testResult.statusCode}</span>
                    <span>{testResult.latencyMs} ms</span>
                  </div>
                  <div className="text-slate-400 truncate">
                    Location: {testResult.locationHeader || 'Página de estado'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
