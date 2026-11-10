import React, { useState } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import {
  authorizeClientPortalEmail,
  createClientDoc,
  deleteClientDoc,
  updateClientStatusDoc,
} from '../lib/firestoreService';
import {
  CLIENT_STATUS_LABELS,
  type AuthUser,
  type Client,
  type ClientStatus,
} from '../types';

interface ClientsViewProps {
  user: AuthUser;
  clients: Client[];
  loading: boolean;
  onViewClientPlaques: (clientId: string) => void;
  onRefresh: () => void;
}

export function ClientsView({
  user,
  clients,
  loading,
  onViewClientPlaques,
  onRefresh,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [portalTargetClient, setPortalTargetClient] = useState<Client | null>(null);

  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('Gastronomía');
  const [plan, setPlan] = useState('Mensual Pro');
  const [monthlyFee, setMonthlyFee] = useState(29);
  const [status, setStatus] = useState<ClientStatus>('active');
  const [portalEmail, setPortalEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editPortalEmail, setEditPortalEmail] = useState('');
  const [portalSaved, setPortalSaved] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.businessName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  const activeMrr = clients
    .filter((c) => c.status === 'active')
    .reduce((acc, c) => acc + (c.monthlyFee || 0), 0);

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createClientDoc(user.uid, {
        businessName,
        contactName,
        email,
        phone,
        category,
        plan,
        monthlyFee,
        status,
        notes,
        portalEmail: portalEmail || email,
      });
      setShowCreateModal(false);
      setBusinessName('');
      setContactName('');
      setEmail('');
      setPhone('');
      setPortalEmail('');
      setNotes('');
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (client: Client) => {
    const nextStatus: ClientStatus = client.status === 'active' ? 'paused' : 'active';
    await updateClientStatusDoc(client.id, nextStatus);
    onRefresh();
  };

  const handleDelete = async (client: Client) => {
    await deleteClientDoc(client.id);
    onRefresh();
  };

  const openPortalModal = (client: Client) => {
    setPortalTargetClient(client);
    setEditPortalEmail(client.portalEmail || client.email);
    setPortalSaved(null);
    setError(null);
  };

  const handleSavePortalAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalTargetClient) return;
    setSubmitting(true);
    setError(null);
    try {
      await authorizeClientPortalEmail(user.uid, portalTargetClient, editPortalEmail);
      setPortalSaved(
        `Correo ${editPortalEmail.trim().toLowerCase()} autorizado para ingresar con Google.`
      );
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al configurar el acceso.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            Clientes y Abonos Mensuales
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Administra los comercios en Firestore y autoriza sus cuentas de Google para el portal
            privado.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-4">
          <p className="text-xs text-slate-400">Total comercios</p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-white">
            {clients.length}
          </p>
        </div>
        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-4">
          <p className="text-xs text-slate-400">Cuentas activas</p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-emerald-400">
            {clients.filter((c) => c.status === 'active').length}
          </p>
        </div>
        <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl p-4">
          <p className="text-xs text-slate-400">Ingreso mensual recurrente (MRR)</p>
          <p className="mt-1 font-mono tabular-nums text-2xl font-bold text-white">
            ${activeMrr.toLocaleString('es-ES')}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar negocio, contacto o rubro..."
          className="w-full bg-[#0E1628] border border-slate-800 rounded-lg pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="bg-[#0E1628] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-medium text-slate-400 bg-[#0B1120]">
                <th className="py-3 px-4">Negocio / Contacto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Plan / Abono</th>
                <th className="py-3 px-4 text-right">Plaquitas</th>
                <th className="py-3 px-4 text-right">Lecturas</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Portal / Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-sm">
              {filtered.map((client) => (
                <tr key={client.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{client.businessName}</div>
                    <div className="text-xs text-slate-400">
                      {client.contactName} · {client.email}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                    {client.category}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-slate-200">{client.plan}</span>
                    <span className="text-slate-600 mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-emerald-400">
                      ${client.monthlyFee}/mes
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-white">
                    {client.plaquesCount ?? 0}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums font-semibold text-white">
                    {(client.totalScans ?? 0).toLocaleString('es-ES')}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(client)}
                      className={`text-xs font-medium cursor-pointer hover:underline ${
                        client.status === 'active'
                          ? 'text-emerald-400'
                          : client.status === 'trial'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {CLIENT_STATUS_LABELS[client.status]}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openPortalModal(client)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-blue-300 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>{client.portalEmail ? 'Google autorizado' : 'Dar acceso'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewClientPlaques(client.id)}
                        className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 cursor-pointer"
                      >
                        Plaquitas
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(client)}
                        aria-label={`Eliminar ${client.businessName}`}
                        className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">No hay clientes registrados.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden my-auto">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Registrar cliente</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre del comercio
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={140}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Pizzería Don Antonio"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre de contacto
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Ej. Antonio Pérez"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo de contacto
                  </label>
                  <input
                    type="email"
                    required
                    maxLength={200}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="antonio@gmail.com"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Gastronomía">Gastronomía</option>
                    <option value="Salud">Salud</option>
                    <option value="Servicios">Servicios</option>
                    <option value="Retail">Retail</option>
                    <option value="Hotelería">Hotelería</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Plan contratado
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlan(val);
                      if (val === 'Básico') setMonthlyFee(15);
                      else if (val === 'Mensual Pro') setMonthlyFee(29);
                      else setMonthlyFee(59);
                    }}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Básico">Básico</option>
                    <option value="Mensual Pro">Mensual Pro</option>
                    <option value="Empresarial">Empresarial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Abono mensual ($)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value) || 0)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-mono tabular-nums text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Correo Google autorizado para portal
                  </label>
                  <input
                    type="email"
                    maxLength={200}
                    value={portalEmail}
                    onChange={(e) => setPortalEmail(e.target.value)}
                    placeholder="Si es el mismo, déjalo vacío"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Estado
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ClientStatus)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="trial">Prueba</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Notas internas
                </label>
                <input
                  type="text"
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles de entrega o configuración..."
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {portalTargetClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-white">
                Acceso con Google — {portalTargetClient.businessName}
              </h2>
              <button
                type="button"
                onClick={() => setPortalTargetClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSavePortalAccess} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Cuando el comercio inicie sesión con este correo de Google, Firestore restringirá su
                acceso únicamente a sus propias placas, lotes y lecturas.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Correo Google autorizado
                </label>
                <input
                  type="email"
                  required
                  maxLength={200}
                  value={editPortalEmail}
                  onChange={(e) => setEditPortalEmail(e.target.value)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 text-xs text-rose-300">
                  {error}
                </div>
              )}
              {portalSaved && (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 text-xs text-emerald-300">
                  {portalSaved}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPortalTargetClient(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold cursor-pointer"
                >
                  {submitting ? 'Autorizando...' : 'Autorizar correo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
