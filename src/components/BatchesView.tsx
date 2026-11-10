import React, { useState } from 'react';
import {
  Download,
  ExternalLink,
  Layers,
  PlusSquare,
  Search,
  Trash2,
} from 'lucide-react';
import {
  deleteBatchAndPlaques,
  downloadBatchCsvClient,
  updateBatchStatusDoc,
} from '../lib/firestoreService';
import {
  BATCH_STATUS_LABELS,
  PLAQUE_TYPE_LABELS,
  type AuthUser,
  type Batch,
  type BatchStatus,
  type Plaque,
} from '../types';

interface BatchesViewProps {
  user: AuthUser;
  batches: Batch[];
  plaques: Plaque[];
  loading: boolean;
  onOpenNewBatch: () => void;
  onViewBatchPlaques: (batchId: string) => void;
  onRefresh: () => void;
}

export function BatchesView({
  user,
  batches,
  plaques,
  loading,
  onOpenNewBatch,
  onViewBatchPlaques,
  onRefresh,
}: BatchesViewProps) {
  const isAdmin = user.role === 'admin';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BatchStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = batches.filter((b) => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.code.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      (b.clientName || '').toLowerCase().includes(q) ||
      b.prefix.toLowerCase().includes(q)
    );
  });

  const handleToggleStatus = async (batch: Batch) => {
    if (!isAdmin) return;
    setBusyId(batch.id);
    setError(null);
    const nextStatus: BatchStatus = batch.status === 'active' ? 'inactive' : 'active';
    try {
      await updateBatchStatusDoc(batch.id, nextStatus);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el lote.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (batch: Batch) => {
    if (!isAdmin) return;
    setBusyId(batch.id);
    setError(null);
    try {
      await deleteBatchAndPlaques(batch.id);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar el lote.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {isAdmin ? 'Mis lotes de producción' : 'Lotes asignados'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra series correlativas en Firestore, exporta enlaces para imprenta o revisa sus
            plaquitas.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onOpenNewBatch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusSquare className="w-4 h-4" />
            <span>Generar lote</span>
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código, lote, cliente o prefijo..."
            className="w-full bg-[#0E1628] border border-slate-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#0E1628] border border-slate-800 rounded-lg self-start">
          {(['all', 'active', 'production', 'inactive'] as const).map((st) => (
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
              {st === 'all' ? 'Todos' : BATCH_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-4 py-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0B1120]">
                <th className="py-3 px-4">Código / Lote</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Plaquitas</th>
                <th className="py-3 px-4 text-right">Lecturas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filtered.map((batch) => (
                <tr key={batch.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-400">
                        {batch.code}
                      </span>
                      <span className="font-medium text-white">{batch.name}</span>
                    </div>
                    <div className="mt-0.5 text-xs font-mono text-slate-500">
                      Prefijo: /qr/{batch.prefix}-*
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    {batch.clientName || 'Stock sin asignar'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {PLAQUE_TYPE_LABELS[batch.plaqueType]}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white whitespace-nowrap">
                    {batch.configuredCount ?? 0} / {batch.actualPlaques ?? batch.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                    {(batch.totalScans ?? 0).toLocaleString('es-ES')}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {isAdmin ? (
                      <button
                        type="button"
                        disabled={busyId === batch.id}
                        onClick={() => handleToggleStatus(batch)}
                        className={`text-xs font-medium cursor-pointer hover:underline ${
                          batch.status === 'active'
                            ? 'text-emerald-400'
                            : batch.status === 'production'
                            ? 'text-amber-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {BATCH_STATUS_LABELS[batch.status]}
                      </button>
                    ) : (
                      <span
                        className={`text-xs font-medium ${
                          batch.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {BATCH_STATUS_LABELS[batch.status]}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onViewBatchPlaques(batch.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                      >
                        <span>Ver plaquitas</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadBatchCsvClient(batch, plaques)}
                        title="Exportar CSV para imprenta"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          disabled={busyId === batch.id}
                          onClick={() => handleDelete(batch)}
                          aria-label={`Eliminar ${batch.code}`}
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
                  <td colSpan={7} className="py-12 text-center">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">
                      No se encontraron lotes con los filtros actuales.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
