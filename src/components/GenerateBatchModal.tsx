import React, { useState } from 'react';
import { Layers, X } from 'lucide-react';
import {
  createBatchWithPlaques,
  sanitizeSlug,
  validateHttpUrl,
} from '../lib/firestoreService';
import {
  PLAQUE_TYPE_LABELS,
  type AuthUser,
  type BatchStatus,
  type Client,
  type PlaqueType,
} from '../types';

interface GenerateBatchModalProps {
  user: AuthUser;
  existingBatchCount: number;
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
}

export function GenerateBatchModal({
  user,
  existingBatchCount,
  clients,
  onClose,
  onCreated,
}: GenerateBatchModalProps) {
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState<string>('');
  const [plaqueType, setPlaqueType] = useState<PlaqueType>('google_reviews');
  const [prefix, setPrefix] = useState('comercio');
  const [quantity, setQuantity] = useState(10);
  const [defaultTargetUrl, setDefaultTargetUrl] = useState('');
  const [status, setStatus] = useState<BatchStatus>('active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanPrefix = sanitizeSlug(prefix);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (defaultTargetUrl.trim() && !validateHttpUrl(defaultTargetUrl.trim())) {
      setError('La URL de destino inicial debe comenzar con http:// o https://.');
      return;
    }

    setSubmitting(true);
    try {
      await createBatchWithPlaques(user.uid, existingBatchCount, clients, {
        name: name.trim(),
        clientId,
        plaqueType,
        prefix: cleanPrefix,
        quantity,
        defaultTargetUrl: defaultTargetUrl.trim(),
        status,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el lote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-blue-400" />
            <h2 className="font-display text-lg font-bold text-white">
              Generar lote de plaquitas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Nombre del lote
            </label>
            <input
              type="text"
              required
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Placas Mostrador Reseñas — Pizzería Roma"
              className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cliente asignado
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  const val = e.target.value;
                  setClientId(val);
                  const found = clients.find((c) => c.id === val);
                  if (found) setPrefix(sanitizeSlug(found.businessName));
                }}
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Stock sin asignar (genérico)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Tipo de placa física
              </label>
              <select
                value={plaqueType}
                onChange={(e) => setPlaqueType(e.target.value as PlaqueType)}
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                {Object.entries(PLAQUE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Prefijo de ruta corta
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="pizzeria-roma"
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Cantidad (1–200)
              </label>
              <input
                type="number"
                min={1}
                max={200}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.min(200, Math.max(1, Number(e.target.value) || 1)))}
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                URL destino inicial (opcional)
              </label>
              <input
                type="url"
                maxLength={1000}
                value={defaultTargetUrl}
                onChange={(e) => setDefaultTargetUrl(e.target.value)}
                placeholder="https://g.page/r/... o https://wa.me/..."
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Estado inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BatchStatus)}
                className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="active">Activo</option>
                <option value="production">En producción</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="rounded-xl bg-[#080D1A] border border-slate-800/90 p-3.5 text-xs text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Vista previa de rutas correlativas:</p>
            <p className="font-mono text-blue-400">
              /qr/{cleanPrefix}-01 ... /qr/{cleanPrefix}-
              {String(quantity).padStart(quantity >= 100 ? 3 : 2, '0')}
            </p>
            <p className="text-slate-500">
              Cada placa se registra en Firestore junto con su entrada pública en{' '}
              <span className="font-mono text-slate-400">/routes</span> para redirección HTTP 301.
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Generando...' : `Crear ${quantity} plaquitas`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
