import React, { useState } from 'react';
import {
  ExternalLink,
  Plus,
  Printer,
  QrCode,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  createSinglePlaqueDoc,
  deletePlaqueDoc,
  validateHttpUrl,
} from '../lib/firestoreService';
import {
  PLAQUE_STATUS_LABELS,
  PLAQUE_TYPE_LABELS,
  type AuthUser,
  type Batch,
  type Client,
  type Plaque,
  type PlaqueStatus,
  type PlaqueType,
} from '../types';

interface PlaquesViewProps {
  user: AuthUser;
  plaques: Plaque[];
  clients: Client[];
  batches: Batch[];
  initialBatchFilter: string | null;
  initialClientFilter: string | null;
  loading: boolean;
  onClearBatchFilter: () => void;
  onClearClientFilter: () => void;
  onInspectPlaque: (plaque: Plaque) => void;
  onPrintPlaque: (plaque: Plaque) => void;
  onRefresh: () => void;
}

export function PlaquesView({
  user,
  plaques,
  clients,
  batches,
  initialBatchFilter,
  initialClientFilter,
  loading,
  onClearBatchFilter,
  onClearClientFilter,
  onInspectPlaque,
  onPrintPlaque,
  onRefresh,
}: PlaquesViewProps) {
  const isAdmin = user.role === 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PlaqueStatus>('all');
  const [clientFilter, setClientFilter] = useState<string>(initialClientFilter || 'all');

  const [showNewModal, setShowNewModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newType, setNewType] = useState<PlaqueType>('google_reviews');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeBatch = initialBatchFilter
    ? batches.find((b) => b.id === initialBatchFilter)
    : null;

  const filtered = plaques.filter((p) => {
    if (initialBatchFilter && p.batchId !== initialBatchFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (isAdmin && clientFilter !== 'all' && p.clientId !== clientFilter) {
      return false;
    }
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.label.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.serialCode.toLowerCase().includes(q) ||
      (p.targetUrl || '').toLowerCase().includes(q) ||
      (p.clientName || '').toLowerCase().includes(q)
    );
  });

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newTargetUrl.trim() && !validateHttpUrl(newTargetUrl.trim())) {
      setError('La URL de destino debe comenzar con http:// o https://.');
      return;
    }

    setCreating(true);
    try {
      await createSinglePlaqueDoc(user.uid, plaques.length, clients, {
        label: newLabel.trim(),
        slug: newSlug.trim(),
        clientId: newClientId,
        plaqueType: newType,
        targetUrl: newTargetUrl.trim(),
        redirectCode: 301,
      });
      setShowNewModal(false);
      setNewLabel('');
      setNewSlug('');
      setNewTargetUrl('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la placa.');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (plaque: Plaque) => {
    if (!isAdmin) return;
    try {
      await deletePlaqueDoc(plaque);
      onRefresh();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {isAdmin ? 'Plaquitas y Enlaces Dinámicos' : 'Mis plaquitas NFC y QR'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Cambia la URL de destino en Firestore en cualquier momento; las placas físicas ya
            impresas se actualizan al instante.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva placa individual</span>
          </button>
        )}
      </div>

      {activeBatch && (
        <div className="flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg bg-blue-600/10 border border-blue-500/30 text-xs text-blue-200">
          <span>
            Mostrando plaquitas del lote <strong>{activeBatch.code}</strong> — {activeBatch.name}
          </span>
          <button
            type="button"
            onClick={onClearBatchFilter}
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>Ver todas</span>
          </button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ruta, serial, etiqueta o URL..."
              className="w-full bg-[#0E1628] border border-slate-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {isAdmin && (
            <select
              value={clientFilter}
              onChange={(e) => {
                setClientFilter(e.target.value);
                if (e.target.value === 'all') onClearClientFilter();
              }}
              className="bg-[#0E1628] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0E1628] border border-slate-800 rounded-lg self-start">
          {(['all', 'active', 'unassigned', 'paused'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {st === 'all' ? 'Todas' : PLAQUE_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0B1120]">
                <th className="py-3 px-4">Serial / Etiqueta</th>
                <th className="py-3 px-4">Ruta corta</th>
                {isAdmin && <th className="py-3 px-4">Cliente</th>}
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">URL Destino</th>
                <th className="py-3 px-4 text-right">Lecturas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filtered.map((plaque) => (
                <tr key={plaque.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">{plaque.label}</div>
                    <div className="text-xs font-mono text-slate-500">
                      {plaque.serialCode}
                      {plaque.batchCode ? ` · ${plaque.batchCode}` : ''}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-blue-400 whitespace-nowrap">
                    /qr/{plaque.slug}
                  </td>
                  {isAdmin && (
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {plaque.clientName || 'Stock'}
                    </td>
                  )}
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {PLAQUE_TYPE_LABELS[plaque.plaqueType]}
                  </td>
                  <td className="py-3.5 px-4 max-w-[260px]">
                    {plaque.targetUrl ? (
                      <span className="text-xs font-mono text-slate-300 truncate block">
                        {plaque.targetUrl}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">Pendiente de asignar</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                    {plaque.scansCount.toLocaleString('es-ES')}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-xs font-medium ${
                        plaque.status === 'active'
                          ? 'text-emerald-400'
                          : plaque.status === 'paused'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {PLAQUE_STATUS_LABELS[plaque.status]}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onPrintPlaque(plaque)}
                        title="Diseñar e imprimir placa 10×15 cm"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-300 cursor-pointer whitespace-nowrap"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>10×15</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onInspectPlaque(plaque)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-xs font-medium text-blue-300 cursor-pointer whitespace-nowrap"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Editar / QR</span>
                      </button>
                      {plaque.targetUrl && plaque.status === 'active' && (
                        <a
                          href={`/qr/${plaque.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Probar redirección en nueva pestaña"
                          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDelete(plaque)}
                          aria-label={`Eliminar ${plaque.serialCode}`}
                          className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center">
                    <QrCode className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No hay plaquitas que coincidan con tu búsqueda.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Nueva placa individual</h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSingle} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Etiqueta de la placa
                </label>
                <input
                  type="text"
                  required
                  maxLength={140}
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Ej. Cartel Reseñas — Sucursal Centro"
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Ruta corta (slug)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={64}
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    placeholder="sucursal-centro"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Tipo de placa
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as PlaqueType)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {Object.entries(PLAQUE_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Cliente
                </label>
                <select
                  value={newClientId}
                  onChange={(e) => setNewClientId(e.target.value)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Stock sin asignar</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.businessName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  URL de destino (opcional)
                </label>
                <input
                  type="url"
                  maxLength={1000}
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  placeholder="https://g.page/r/..."
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer"
                >
                  {creating ? 'Creando...' : 'Crear placa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
