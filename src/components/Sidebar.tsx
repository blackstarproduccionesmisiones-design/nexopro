import React from 'react';
import {
  Activity,
  Layers,
  LayoutDashboard,
  LogOut,
  PlusSquare,
  QrCode,
  Users,
  X,
} from 'lucide-react';
import type { AuthUser } from '../types';
import { BrandMark } from './Icons';

export type NavSection =
  | 'overview'
  | 'batches'
  | 'plaques'
  | 'clients'
  | 'router';

interface SidebarProps {
  user: AuthUser;
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onOpenNewBatch: () => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  user,
  activeSection,
  onNavigate,
  onOpenNewBatch,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const isAdmin = user.role === 'admin';

  const navItems: Array<{
    id: NavSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
  }> = [
    { id: 'overview', label: 'Panel principal', icon: LayoutDashboard },
    { id: 'batches', label: isAdmin ? 'Mis lotes' : 'Lotes asignados', icon: Layers },
    { id: 'plaques', label: isAdmin ? 'Plaquitas y Enlaces' : 'Mis plaquitas', icon: QrCode },
    { id: 'clients', label: 'Clientes y Abonos', icon: Users, adminOnly: true },
    { id: 'router', label: 'Enrutador 301', icon: Activity },
  ];

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin);

  const handleNav = (id: NavSection) => {
    onNavigate(id);
    onCloseMobile();
  };

  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#0B1120] border-r border-slate-800/80 w-[260px]">
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark className="w-8 h-8 shrink-0" />
          <span className="font-display text-base font-bold tracking-tight text-white whitespace-nowrap">
            NEXO <span className="text-blue-400">PRO</span>
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar menú"
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        {isAdmin && (
          <div>
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onOpenNewBatch();
              }}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <PlusSquare className="w-4 h-4 shrink-0" />
              <span>Generar lote</span>
            </button>
          </div>
        )}

        <nav className="space-y-1" aria-label="Navegación principal">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNav(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-800/80 space-y-3">
        <div className="px-2">
          <p className="text-sm font-semibold text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 truncate">
            {isAdmin ? 'Administrador Maestro' : user.clientName || 'Portal Cliente'} · {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:shrink-0">{sidebarBody}</aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
