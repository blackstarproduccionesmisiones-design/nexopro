import React from 'react';
import {
  Activity,
  ArrowUpRight,
  ExternalLink,
  Layers,
  QrCode,
} from 'lucide-react';
import {
  BATCH_STATUS_LABELS,
  PLAQUE_STATUS_LABELS,
  PLAQUE_TYPE_LABELS,
  type AuthUser,
  type DashboardData,
  type Plaque,
} from '../types';
import {
  BatchKpiArtwork,
  DestinationKpiArtwork,
  PlaqueKpiArtwork,
  ReadsKpiArtwork,
} from './Icons';
import { ScanAreaChart } from './ScanAreaChart';
import type { NavSection } from './Sidebar';

interface DashboardViewProps {
  user: AuthUser;
  data: DashboardData | null;
  loading: boolean;
  onNavigate: (section: NavSection) => void;
  onOpenNewBatch: () => void;
  onInspectPlaque: (plaque: Plaque) => void;
}

export function DashboardView({
  user,
  data,
  loading,
  onNavigate,
  onOpenNewBatch,
  onInspectPlaque,
}: DashboardViewProps) {
  const isAdmin = user.role === 'admin';
  const kpis = data?.kpis;

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-blue-400">
            {isAdmin ? 'Panel Maestro · Firestore' : user.clientName || 'Portal de cliente'}
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Hola, {user.name.split(' ')[0]}
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-slate-400">
            {isAdmin
              ? 'Gestiona tus plaquitas NFC, códigos QR dinámicos y clientes sincronizados en la nube.'
              : 'Administra los enlaces de destino de tus placas físicas y revisa sus lecturas.'}
          </p>
        </div>

        {isAdmin && kpis && (
          <div className="flex items-center gap-6 text-sm text-slate-400 border border-slate-800/80 bg-[#0E1628] rounded-xl px-5 py-3">
            <div>
              <p className="text-xs text-slate-500">Clientes activos</p>
              <p className="font-mono tabular-nums text-lg font-semibold text-white">
                {kpis.activeClients} / {kpis.totalClients}
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-xs text-slate-500">Abonos mensuales</p>
              <p className="font-mono tabular-nums text-lg font-semibold text-emerald-400">
                ${kpis.mrr.toLocaleString('es-ES')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 4-column KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400">Lotes</p>
            <p className="mt-2 font-mono tabular-nums text-3xl font-bold text-white">
              {loading ? '—' : kpis?.totalBatches ?? 0}
            </p>
          </div>
          <BatchKpiArtwork />
        </div>

        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400">Plaquitas</p>
            <p className="mt-2 font-mono tabular-nums text-3xl font-bold text-white">
              {loading ? '—' : kpis?.totalPlaques ?? 0}
            </p>
          </div>
          <PlaqueKpiArtwork />
        </div>

        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400">Con destino</p>
            <p className="mt-2 font-mono tabular-nums text-3xl font-bold text-white">
              {loading ? '—' : kpis?.configuredPlaques ?? 0}
            </p>
          </div>
          <DestinationKpiArtwork />
        </div>

        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-400">Lecturas registradas</p>
            <p className="mt-2 font-mono tabular-nums text-3xl font-bold text-white">
              {loading ? '—' : (kpis?.totalScans ?? 0).toLocaleString('es-ES')}
            </p>
          </div>
          <ReadsKpiArtwork />
        </div>
      </div>

      {/* Primary action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isAdmin ? (
          <button
            type="button"
            onClick={onOpenNewBatch}
            className="group text-left bg-[#0E1628] hover:bg-[#121C33] border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <BatchKpiArtwork />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-white">Generar lote</h2>
                <p className="mt-0.5 text-sm text-slate-400 truncate">
                  Generar lote de plaquitas y números correlativos.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('plaques')}
            className="group text-left bg-[#0E1628] hover:bg-[#121C33] border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4 min-w-0">
              <QrCode className="w-10 h-10 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-lg font-semibold text-white">Editar destinos</h2>
                <p className="mt-0.5 text-sm text-slate-400 truncate">
                  Actualiza Google Maps, WhatsApp o Menú sin reimprimir.
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate(isAdmin ? 'batches' : 'router')}
          className="group text-left bg-[#0E1628] hover:bg-[#121C33] border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4 min-w-0">
            {isAdmin ? (
              <ReadsKpiArtwork />
            ) : (
              <Activity className="w-10 h-10 text-emerald-400 shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="font-display text-lg font-semibold text-white">
                {isAdmin ? 'Mis lotes' : 'Probar enrutador 301'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-400 truncate">
                {isAdmin
                  ? 'Ver, editar y exportar todos tus lotes.'
                  : 'Verifica la redirección HTTP 301 de tus placas en vivo.'}
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
        </button>
      </div>

      {/* Analytics + Recent Batches split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        <section className="xl:col-span-7 bg-[#0E1628] border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Panel de Análisis</h2>
              <p className="text-xs text-slate-400">
                Actividad diaria capturada por el enrutador HTTP 301
              </p>
            </div>
            {data?.osBreakdown && data.osBreakdown.length > 0 && (
              <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
                {data.osBreakdown.slice(0, 3).map((item) => (
                  <span key={item.os} className="font-mono tabular-nums">
                    {item.os}: <strong className="text-slate-200">{item.count}</strong>
                  </span>
                ))}
              </div>
            )}
          </div>

          <ScanAreaChart data={data?.chartSeries ?? []} />
        </section>

        <section className="xl:col-span-5 bg-[#0E1628] border border-slate-800/80 rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Últimos Lotes</h2>
              <p className="text-xs text-slate-400">Producción reciente y estado operativo</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('batches')}
              className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap cursor-pointer"
            >
              Ver todos
            </button>
          </div>

          {!data?.recentBatches?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <Layers className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-sm text-slate-400">No hay lotes creados todavía.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {data.recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="font-mono text-blue-400">{batch.code}</span>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="truncate">{batch.clientName || 'Stock sin asignar'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400 truncate">
                      {batch.quantity} plaquitas · {PLAQUE_TYPE_LABELS[batch.plaqueType]} ·{' '}
                      <span className="font-mono tabular-nums">
                        {batch.totalScans ?? 0} lecturas
                      </span>
                    </p>
                  </div>

                  <span
                    className={`text-xs font-medium whitespace-nowrap shrink-0 ${
                      batch.status === 'active'
                        ? 'text-emerald-400'
                        : batch.status === 'production'
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {BATCH_STATUS_LABELS[batch.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Top performing plaques */}
      <section className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-white">
              Plaquitas con más lecturas
            </h2>
            <p className="text-xs text-slate-400">
              Haz clic en cualquier placa para editar su URL de destino o descargar su código QR
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('plaques')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 whitespace-nowrap cursor-pointer"
          >
            Administrar plaquitas
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400">
                <th className="py-2.5 pr-4">Placa / Ruta</th>
                <th className="py-2.5 px-4">Cliente</th>
                <th className="py-2.5 px-4">Destino actual</th>
                <th className="py-2.5 px-4 text-right">Lecturas</th>
                <th className="py-2.5 px-4">Estado</th>
                <th className="py-2.5 pl-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {(data?.topPlaques ?? []).map((plaque) => (
                <tr key={plaque.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 pr-4">
                    <div className="font-medium text-white">{plaque.label}</div>
                    <div className="text-xs font-mono text-blue-400">/qr/{plaque.slug}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                    {plaque.clientName || 'Sin asignar'}
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    {plaque.targetUrl ? (
                      <span className="text-xs font-mono text-slate-400 truncate block">
                        {plaque.targetUrl}
                      </span>
                    ) : (
                      <span className="text-xs text-amber-400">Sin enlace configurado</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-white">
                    {plaque.scansCount.toLocaleString('es-ES')}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
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
                  <td className="py-3 pl-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onInspectPlaque(plaque)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      <span>Gestionar</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && (!data?.topPlaques || data.topPlaques.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-slate-500">
                    Todavía no existen plaquitas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
