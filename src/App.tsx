import React, { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut, Menu, PlusSquare, ShieldAlert } from 'lucide-react';
import { auth } from './lib/firebase';
import {
  fetchWorkspaceData,
  resolveAndSyncUser,
  syncPendingPublicScans,
} from './lib/firestoreService';
import type { AuthUser, Batch, Client, DashboardData, Plaque } from './types';
import { LoginView } from './components/LoginView';
import { Sidebar, type NavSection } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { BatchesView } from './components/BatchesView';
import { PlaquesView } from './components/PlaquesView';
import { ClientsView } from './components/ClientsView';
import { RouterTesterView } from './components/RouterTesterView';
import { GenerateBatchModal } from './components/GenerateBatchModal';
import { PlaqueInspectorModal } from './components/PlaqueInspectorModal';
import { PlaquePrintModal } from './components/PlaquePrintModal';

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Panel principal',
  batches: 'Lotes de producción',
  plaques: 'Plaquitas y Enlaces',
  clients: 'Clientes y Abonos',
  router: 'Enrutador 301',
};

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [booting, setBooting] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [section, setSection] = useState<NavSection>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [plaques, setPlaques] = useState<Plaque[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [batchFilterId, setBatchFilterId] = useState<string | null>(null);
  const [clientFilterId, setClientFilterId] = useState<string | null>(null);
  const [showNewBatchModal, setShowNewBatchModal] = useState(false);
  const [inspectedPlaque, setInspectedPlaque] = useState<Plaque | null>(null);
  const [printContext, setPrintContext] = useState<{ title: string; plaques: Plaque[] } | null>(
    null
  );

  const loadWorkspaceData = useCallback(async (currentUser: AuthUser) => {
    if (currentUser.role === 'client' && !currentUser.clientId) {
      return;
    }
    setLoadingData(true);
    setDataError(null);
    try {
      await syncPendingPublicScans(currentUser);
      const res = await fetchWorkspaceData(currentUser);
      setClients(res.clients);
      setBatches(res.batches);
      setPlaques(res.plaques);
      setDashboardData(res.dashboard);
    } catch (err) {
      setDataError(
        err instanceof Error ? err.message : 'No se pudieron cargar los datos de Firestore.'
      );
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setDashboardData(null);
        setBatches([]);
        setPlaques([]);
        setClients([]);
        setAuthError(null);
        setBooting(false);
        return;
      }

      setBooting(true);
      setAuthError(null);
      try {
        const resolved = await resolveAndSyncUser(fbUser);
        setUser(resolved);
        await loadWorkspaceData(resolved);
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Error al verificar tu perfil en Firestore.'
        );
      } finally {
        setBooting(false);
      }
    });

    return () => unsubscribe();
  }, [loadWorkspaceData]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const refreshAll = () => {
    if (user) {
      loadWorkspaceData(user);
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-[#080D1A] flex items-center justify-center text-sm text-slate-400">
        Conectando con Firebase Firestore...
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (user.role === 'client' && !user.clientId) {
    return (
      <div className="min-h-screen bg-[#080D1A] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0E1628] border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
          <h1 className="font-display text-xl font-bold text-white">
            Cuenta pendiente de asignación
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Iniciaste sesión como <span className="font-mono text-slate-200">{user.email}</span>,
            pero un administrador debe vincular tu correo a un comercio en{' '}
            <strong>Clientes y Abonos</strong>.
          </p>
          {authError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5">
              {authError}
            </p>
          )}
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cambiar cuenta</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <>
      <div className="min-h-screen bg-[#080D1A] text-slate-100 flex no-print">
      <Sidebar
        user={user}
        activeSection={section}
        onNavigate={(next) => {
          if (next !== 'plaques') {
            setBatchFilterId(null);
            setClientFilterId(null);
          }
          setSection(next);
        }}
        onOpenNewBatch={() => setShowNewBatchModal(true)}
        onLogout={handleLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 px-4 sm:px-8 border-b border-slate-800/80 bg-[#080D1A]/95 backdrop-blur-xs flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menú"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-500 hidden sm:inline whitespace-nowrap">
                Nexo Pro
              </span>
              <span className="text-slate-600 hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-medium text-slate-200 truncate">
                {SECTION_TITLES[section]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowNewBatchModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <PlusSquare className="w-3.5 h-3.5" />
                <span>Generar lote</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-8 py-8 max-w-[1280px] w-full mx-auto">
          {dataError && (
            <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-xs text-rose-300">
              {dataError}
            </div>
          )}

          {section === 'overview' && (
            <DashboardView
              user={user}
              data={dashboardData}
              loading={loadingData}
              onNavigate={setSection}
              onOpenNewBatch={() => setShowNewBatchModal(true)}
              onInspectPlaque={(p) => setInspectedPlaque(p)}
            />
          )}

          {section === 'batches' && (
            <BatchesView
              user={user}
              batches={batches}
              plaques={plaques}
              loading={loadingData}
              onOpenNewBatch={() => setShowNewBatchModal(true)}
              onViewBatchPlaques={(batchId) => {
                setClientFilterId(null);
                setBatchFilterId(batchId);
                setSection('plaques');
              }}
              onPrintBatch={(batch) => {
                const batchPlaques = plaques.filter((p) => p.batchId === batch.id);
                if (batchPlaques.length > 0) {
                  setPrintContext({
                    title: `${batch.code} — ${batch.name}`,
                    plaques: batchPlaques,
                  });
                }
              }}
              onRefresh={refreshAll}
            />
          )}

          {section === 'plaques' && (
            <PlaquesView
              user={user}
              plaques={plaques}
              clients={clients}
              batches={batches}
              initialBatchFilter={batchFilterId}
              initialClientFilter={clientFilterId}
              loading={loadingData}
              onClearBatchFilter={() => setBatchFilterId(null)}
              onClearClientFilter={() => setClientFilterId(null)}
              onInspectPlaque={(p) => setInspectedPlaque(p)}
              onPrintPlaque={(p) =>
                setPrintContext({
                  title: `Placa ${p.serialCode}`,
                  plaques: [p],
                })
              }
              onRefresh={refreshAll}
            />
          )}

          {section === 'clients' && isAdmin && (
            <ClientsView
              user={user}
              clients={clients}
              loading={loadingData}
              onViewClientPlaques={(cid) => {
                setBatchFilterId(null);
                setClientFilterId(cid);
                setSection('plaques');
              }}
              onRefresh={refreshAll}
            />
          )}

          {section === 'router' && (
            <RouterTesterView user={user} plaques={plaques} onRefresh={refreshAll} />
          )}
        </main>
      </div>

      {showNewBatchModal && isAdmin && (
        <GenerateBatchModal
          user={user}
          existingBatchCount={batches.length}
          clients={clients}
          onClose={() => setShowNewBatchModal(false)}
          onCreated={refreshAll}
        />
      )}

      {inspectedPlaque && (
        <PlaqueInspectorModal
          user={user}
          plaque={inspectedPlaque}
          clients={clients}
          onClose={() => setInspectedPlaque(null)}
          onPrintPlaque={(p) =>
            setPrintContext({
              title: `Placa ${p.serialCode}`,
              plaques: [p],
            })
          }
          onUpdated={(updated) => {
            setInspectedPlaque(updated);
            refreshAll();
          }}
        />
      )}
    </div>

    {printContext && (
      <PlaquePrintModal
        title={printContext.title}
        plaques={printContext.plaques}
        onClose={() => setPrintContext(null)}
      />
    )}
    </>
  );
}
