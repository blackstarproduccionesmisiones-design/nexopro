import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import type {
  AuthUser,
  Batch,
  BatchStatus,
  Client,
  ClientStatus,
  DashboardData,
  Plaque,
  PlaqueStatus,
  PlaqueType,
  QrAssets,
  RouterTestResult,
  ScanPoint,
} from '../types';

const ADMIN_EMAIL = 'blackstarproducciones.misiones@gmail.com';

export function sanitizeSlug(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64) || 'placa'
  );
}

export function emailToDocId(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .slice(0, 128);
}

function makeDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function timestampToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export function validateHttpUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function resolveAndSyncUser(fbUser: FirebaseUser): Promise<AuthUser> {
  const email = (fbUser.email || '').trim().toLowerCase();
  const isRootAdmin = email === ADMIN_EMAIL && fbUser.emailVerified;
  const userRef = doc(db, 'users', fbUser.uid);

  let existingUser: Record<string, unknown> | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) existingUser = snap.data();
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`);
  }

  let role: 'admin' | 'client' = isRootAdmin ? 'admin' : 'client';
  let clientId = '';
  let clientAccessId = '';
  let clientName = '';

  if (!isRootAdmin && email) {
    const accessDocId = emailToDocId(email);
    try {
      const accessSnap = await getDoc(doc(db, 'clientPortalAccess', accessDocId));
      if (accessSnap.exists()) {
        const data = accessSnap.data();
        clientId = String(data.clientId || '');
        clientAccessId = accessDocId;
        clientName = String(data.businessName || '');
      }
    } catch {
      // No portal access record for this email yet
    }
  } else if (isRootAdmin) {
    role = 'admin';
  }

  if (!existingUser) {
    try {
      await setDoc(userRef, {
        uid: fbUser.uid,
        email,
        displayName: (fbUser.displayName || email.split('@')[0] || 'Usuario').slice(0, 120),
        role,
        clientId,
        clientAccessId,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${fbUser.uid}`);
    }
  } else {
    role = isRootAdmin ? 'admin' : (existingUser.role === 'admin' ? 'admin' : 'client');
    if (isRootAdmin && existingUser.role !== 'admin') {
      try {
        await updateDoc(userRef, { role: 'admin', clientId: '', clientAccessId: '' });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${fbUser.uid}`);
      }
    }
    if (!clientId && typeof existingUser.clientId === 'string') {
      clientId = existingUser.clientId;
    }
  }

  if (clientId && !clientName) {
    try {
      const clientSnap = await getDoc(doc(db, 'clients', clientId));
      if (clientSnap.exists()) {
        clientName = String(clientSnap.data().businessName || '');
      }
    } catch {
      // ignore if client doc missing
    }
  }

  if (role === 'admin') {
    await seedInitialFirestoreIfEmpty(fbUser.uid);
  }

  return {
    uid: fbUser.uid,
    name: fbUser.displayName || (email === ADMIN_EMAIL ? 'Jeann' : email.split('@')[0]),
    email,
    role,
    clientId,
    clientName: clientName || undefined,
  };
}

async function seedInitialFirestoreIfEmpty(adminUid: string): Promise<void> {
  try {
    const existingClients = await getDocs(query(collection(db, 'clients'), limit(1)));
    if (!existingClients.empty) return;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'clients');
  }

  const batch = writeBatch(db);
  const now = new Date();
  const daysAgo = (d: number, hour = 12) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    dt.setHours(hour, 15, 0, 0);
    return dt;
  };

  const clientsSeed = [
    {
      id: 'client_cafe_central',
      businessName: 'Café Central',
      contactName: 'Laura Gómez',
      email: 'laura@cafecentral.com',
      phone: '+54 9 11 4520-8812',
      category: 'Gastronomía',
      plan: 'Mensual Pro',
      monthlyFee: 29,
      status: 'active',
      notes: 'Mesas con menú QR y mostrador NFC para reseñas Google.',
      portalEmail: 'laura@cafecentral.com',
    },
    {
      id: 'client_clinica_sonrisa',
      businessName: 'Clínica Dental Sonrisa',
      contactName: 'Dr. Marcos Silva',
      email: 'contacto@clinicasonrisa.com',
      phone: '+54 9 11 6380-2104',
      category: 'Salud',
      plan: 'Empresarial',
      monthlyFee: 59,
      status: 'active',
      notes: 'Recepción y consultorios con placas NFC de Google Maps.',
      portalEmail: 'contacto@clinicasonrisa.com',
    },
    {
      id: 'client_barberia_clasico',
      businessName: 'Barbería El Clásico',
      contactName: 'Matías Rojas',
      email: 'hola@barberiaelclasico.com',
      phone: '+54 9 11 5192-3340',
      category: 'Servicios',
      plan: 'Básico',
      monthlyFee: 15,
      status: 'active',
      notes: 'Espejos con placa NFC para reseñas y turnos WhatsApp.',
      portalEmail: 'hola@barberiaelclasico.com',
    },
  ];

  for (const c of clientsSeed) {
    batch.set(doc(db, 'clients', c.id), {
      businessName: c.businessName,
      contactName: c.contactName,
      email: c.email,
      phone: c.phone,
      category: c.category,
      plan: c.plan,
      monthlyFee: c.monthlyFee,
      status: c.status,
      notes: c.notes,
      portalEmail: c.portalEmail,
      ownerUid: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const accessId = emailToDocId(c.portalEmail);
    batch.set(doc(db, 'clientPortalAccess', accessId), {
      email: c.portalEmail,
      clientId: c.id,
      businessName: c.businessName,
      createdByUid: adminUid,
      createdAt: serverTimestamp(),
    });
  }

  const batchesSeed = [
    {
      id: 'batch_001',
      code: 'Lote #001',
      name: 'Reseñas y Menú — Café Central',
      clientId: 'client_cafe_central',
      clientName: 'Café Central',
      authorizedEmail: 'laura@cafecentral.com',
      plaqueType: 'qr_menu',
      prefix: 'cafe-central',
      quantity: 4,
      status: 'active',
    },
    {
      id: 'batch_002',
      code: 'Lote #002',
      name: 'Placas Recepción NFC — Clínica Sonrisa',
      clientId: 'client_clinica_sonrisa',
      clientName: 'Clínica Dental Sonrisa',
      authorizedEmail: 'contacto@clinicasonrisa.com',
      plaqueType: 'google_reviews',
      prefix: 'sonrisa-nfc',
      quantity: 3,
      status: 'active',
    },
    {
      id: 'batch_003',
      code: 'Lote #003',
      name: 'Tarjetas NFC — Barbería El Clásico',
      clientId: 'client_barberia_clasico',
      clientName: 'Barbería El Clásico',
      authorizedEmail: 'hola@barberiaelclasico.com',
      plaqueType: 'digital_card',
      prefix: 'el-clasico',
      quantity: 3,
      status: 'active',
    },
  ];

  for (const b of batchesSeed) {
    batch.set(doc(db, 'batches', b.id), {
      code: b.code,
      name: b.name,
      clientId: b.clientId,
      clientName: b.clientName,
      authorizedEmail: b.authorizedEmail,
      plaqueType: b.plaqueType,
      prefix: b.prefix,
      quantity: b.quantity,
      status: b.status,
      ownerUid: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const plaquesSeed: Array<{
    id: string;
    serialCode: string;
    slug: string;
    batchId: string;
    batchCode: string;
    clientId: string;
    clientName: string;
    authorizedEmail: string;
    label: string;
    plaqueType: PlaqueType;
    targetUrl: string;
    status: PlaqueStatus;
    scansCount: number;
  }> = [
    {
      id: 'plaque_001',
      serialCode: 'DP-001-001',
      slug: 'cafe-central-01',
      batchId: 'batch_001',
      batchCode: 'Lote #001',
      clientId: 'client_cafe_central',
      clientName: 'Café Central',
      authorizedEmail: 'laura@cafecentral.com',
      label: 'Mostrador Caja — Reseñas Google',
      plaqueType: 'google_reviews',
      targetUrl: 'https://g.page/r/cafe-central-resenas/review',
      status: 'active',
      scansCount: 18,
    },
    {
      id: 'plaque_002',
      serialCode: 'DP-001-002',
      slug: 'cafe-central-02',
      batchId: 'batch_001',
      batchCode: 'Lote #001',
      clientId: 'client_cafe_central',
      clientName: 'Café Central',
      authorizedEmail: 'laura@cafecentral.com',
      label: 'Mesa 01 — Menú Digital',
      plaqueType: 'qr_menu',
      targetUrl: 'https://cafecentral.example.com/menu',
      status: 'active',
      scansCount: 12,
    },
    {
      id: 'plaque_003',
      serialCode: 'DP-001-003',
      slug: 'cafe-central-03',
      batchId: 'batch_001',
      batchCode: 'Lote #001',
      clientId: 'client_cafe_central',
      clientName: 'Café Central',
      authorizedEmail: 'laura@cafecentral.com',
      label: 'Mesa 02 — Pedidos WhatsApp',
      plaqueType: 'whatsapp_direct',
      targetUrl: 'https://wa.me/5491145208812?text=Hola%20Cafe%20Central',
      status: 'active',
      scansCount: 9,
    },
    {
      id: 'plaque_004',
      serialCode: 'DP-001-004',
      slug: 'cafe-central-04',
      batchId: 'batch_001',
      batchCode: 'Lote #001',
      clientId: 'client_cafe_central',
      clientName: 'Café Central',
      authorizedEmail: 'laura@cafecentral.com',
      label: 'Mesa Terraza — Sin asignar',
      plaqueType: 'qr_menu',
      targetUrl: '',
      status: 'unassigned',
      scansCount: 0,
    },
    {
      id: 'plaque_005',
      serialCode: 'DP-002-001',
      slug: 'sonrisa-nfc-01',
      batchId: 'batch_002',
      batchCode: 'Lote #002',
      clientId: 'client_clinica_sonrisa',
      clientName: 'Clínica Dental Sonrisa',
      authorizedEmail: 'contacto@clinicasonrisa.com',
      label: 'Recepción Principal — Google Maps',
      plaqueType: 'google_reviews',
      targetUrl: 'https://g.page/r/clinica-sonrisa/review',
      status: 'active',
      scansCount: 22,
    },
    {
      id: 'plaque_006',
      serialCode: 'DP-002-002',
      slug: 'sonrisa-nfc-02',
      batchId: 'batch_002',
      batchCode: 'Lote #002',
      clientId: 'client_clinica_sonrisa',
      clientName: 'Clínica Dental Sonrisa',
      authorizedEmail: 'contacto@clinicasonrisa.com',
      label: 'Consultorio 1 — Turnos WhatsApp',
      plaqueType: 'whatsapp_direct',
      targetUrl: 'https://wa.me/5491163802104?text=Hola%20quiero%20turno',
      status: 'active',
      scansCount: 14,
    },
    {
      id: 'plaque_007',
      serialCode: 'DP-002-003',
      slug: 'sonrisa-nfc-03',
      batchId: 'batch_002',
      batchCode: 'Lote #002',
      clientId: 'client_clinica_sonrisa',
      clientName: 'Clínica Dental Sonrisa',
      authorizedEmail: 'contacto@clinicasonrisa.com',
      label: 'Tarjeta NFC Dirección Médica',
      plaqueType: 'digital_card',
      targetUrl: 'https://clinicasonrisa.example.com/dr-silva',
      status: 'paused',
      scansCount: 5,
    },
    {
      id: 'plaque_008',
      serialCode: 'DP-003-001',
      slug: 'el-clasico-01',
      batchId: 'batch_003',
      batchCode: 'Lote #003',
      clientId: 'client_barberia_clasico',
      clientName: 'Barbería El Clásico',
      authorizedEmail: 'hola@barberiaelclasico.com',
      label: 'Estación 1 — Reseñas Google',
      plaqueType: 'google_reviews',
      targetUrl: 'https://g.page/r/barberia-el-clasico/review',
      status: 'active',
      scansCount: 15,
    },
    {
      id: 'plaque_009',
      serialCode: 'DP-003-002',
      slug: 'el-clasico-02',
      batchId: 'batch_003',
      batchCode: 'Lote #003',
      clientId: 'client_barberia_clasico',
      clientName: 'Barbería El Clásico',
      authorizedEmail: 'hola@barberiaelclasico.com',
      label: 'Tarjeta NFC Matías Rojas',
      plaqueType: 'digital_card',
      targetUrl: 'https://instagram.com/barberiaelclasico',
      status: 'active',
      scansCount: 10,
    },
    {
      id: 'plaque_010',
      serialCode: 'DP-003-003',
      slug: 'el-clasico-03',
      batchId: 'batch_003',
      batchCode: 'Lote #003',
      clientId: 'client_barberia_clasico',
      clientName: 'Barbería El Clásico',
      authorizedEmail: 'hola@barberiaelclasico.com',
      label: 'Stock Reserva #03',
      plaqueType: 'digital_card',
      targetUrl: '',
      status: 'unassigned',
      scansCount: 0,
    },
  ];

  const osChoices = ['iOS', 'Android', 'Android', 'iOS', 'macOS'];
  let scanCounter = 0;

  for (const p of plaquesSeed) {
    const lastScanIso = p.scansCount > 0 ? daysAgo(0, 10).toISOString() : '';
    batch.set(doc(db, 'plaques', p.id), {
      serialCode: p.serialCode,
      slug: p.slug,
      batchId: p.batchId,
      batchCode: p.batchCode,
      clientId: p.clientId,
      clientName: p.clientName,
      authorizedEmail: p.authorizedEmail,
      label: p.label,
      plaqueType: p.plaqueType,
      targetUrl: p.targetUrl,
      status: p.status,
      redirectCode: 301,
      scansCount: p.scansCount,
      lastScannedAt: lastScanIso,
      ownerUid: adminUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    batch.set(doc(db, 'routes', p.slug), {
      slug: p.slug,
      plaqueId: p.id,
      batchId: p.batchId,
      clientId: p.clientId,
      targetUrl: p.targetUrl,
      status: p.status,
      redirectCode: 301,
      updatedAt: serverTimestamp(),
    });

    // Seed representative scan events (capped to fit batch cleanly)
    const sampleScans = Math.min(p.scansCount, 6);
    for (let i = 0; i < sampleScans; i++) {
      scanCounter++;
      const os = osChoices[scanCounter % osChoices.length];
      const deviceType = os === 'macOS' ? 'desktop' : 'mobile';
      const channel = scanCounter % 3 === 0 ? 'nfc' : 'qr';
      const scanDate = daysAgo((scanCounter * 2) % 13, 10 + (i % 8));
      batch.set(doc(db, 'scans', `scan_seed_${scanCounter}`), {
        plaqueId: p.id,
        batchId: p.batchId,
        clientId: p.clientId,
        authorizedEmail: p.authorizedEmail,
        slug: p.slug,
        deviceType,
        os,
        channel,
        recordedByUid: adminUid,
        scannedAt: Timestamp.fromDate(scanDate),
      });
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed_initial_data');
  }
}

export async function syncPendingPublicScans(user: AuthUser): Promise<void> {
  try {
    const res = await fetch('/api/public-scans');
    if (!res.ok) return;
    const { scans } = (await res.json()) as {
      scans: Array<{
        id: string;
        slug: string;
        plaqueId: string;
        batchId: string;
        clientId: string;
        deviceType: 'mobile' | 'desktop' | 'tablet';
        os: string;
        channel: 'qr' | 'nfc' | 'direct';
        scannedAt: string;
      }>;
    };
    if (!scans || scans.length === 0) return;

    const syncedIds: string[] = [];
    for (const s of scans) {
      if (user.role !== 'admin' && s.clientId !== user.clientId) continue;
      try {
        const plaqueRef = doc(db, 'plaques', s.plaqueId);
        const plaqueSnap = await getDoc(plaqueRef);
        if (!plaqueSnap.exists()) {
          syncedIds.push(s.id);
          continue;
        }
        const plaqueData = plaqueSnap.data();
        const scanId = `pub_${s.id}`.replace(/[^a-zA-Z0-9_-]/g, '_');

        await setDoc(doc(db, 'scans', scanId), {
          plaqueId: s.plaqueId,
          batchId: s.batchId || String(plaqueData.batchId || ''),
          clientId: s.clientId || String(plaqueData.clientId || ''),
          authorizedEmail: String(plaqueData.authorizedEmail || ''),
          slug: s.slug,
          deviceType: s.deviceType,
          os: s.os.slice(0, 40),
          channel: s.channel,
          recordedByUid: user.uid,
          scannedAt: user.role === 'admin' ? Timestamp.fromDate(new Date(s.scannedAt)) : serverTimestamp(),
        });

        await updateDoc(plaqueRef, {
          scansCount: increment(1),
          lastScannedAt: s.scannedAt,
          updatedAt: serverTimestamp(),
        });
        syncedIds.push(s.id);
      } catch {
        // skip if permission or transient error
      }
    }

    if (syncedIds.length > 0) {
      await fetch('/api/public-scans/ack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: syncedIds }),
      });
    }
  } catch {
    // ignore background sync failures
  }
}

export async function fetchWorkspaceData(user: AuthUser): Promise<{
  clients: Client[];
  batches: Batch[];
  plaques: Plaque[];
  dashboard: DashboardData;
}> {
  const isAdmin = user.role === 'admin';
  const email = user.email.toLowerCase();

  let clients: Client[] = [];
  if (isAdmin) {
    try {
      const snap = await getDocs(collection(db, 'clients'));
      clients = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          businessName: String(data.businessName || ''),
          contactName: String(data.contactName || ''),
          email: String(data.email || ''),
          phone: String(data.phone || ''),
          category: String(data.category || ''),
          plan: String(data.plan || ''),
          monthlyFee: Number(data.monthlyFee || 0),
          status: (data.status || 'active') as ClientStatus,
          notes: String(data.notes || ''),
          portalEmail: String(data.portalEmail || ''),
          ownerUid: String(data.ownerUid || ''),
          createdAt: timestampToIso(data.createdAt),
          updatedAt: timestampToIso(data.updatedAt),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'clients');
    }
  }

  let batches: Batch[] = [];
  try {
    const q = isAdmin
      ? collection(db, 'batches')
      : query(collection(db, 'batches'), where('authorizedEmail', '==', email));
    const snap = await getDocs(q);
    batches = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        code: String(data.code || ''),
        name: String(data.name || ''),
        clientId: String(data.clientId || ''),
        clientName: String(data.clientName || ''),
        authorizedEmail: String(data.authorizedEmail || ''),
        plaqueType: (data.plaqueType || 'google_reviews') as PlaqueType,
        prefix: String(data.prefix || ''),
        quantity: Number(data.quantity || 0),
        status: (data.status || 'active') as BatchStatus,
        ownerUid: String(data.ownerUid || ''),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'batches');
  }

  let plaques: Plaque[] = [];
  try {
    const q = isAdmin
      ? collection(db, 'plaques')
      : query(collection(db, 'plaques'), where('authorizedEmail', '==', email));
    const snap = await getDocs(q);
    plaques = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        serialCode: String(data.serialCode || ''),
        slug: String(data.slug || ''),
        batchId: String(data.batchId || ''),
        batchCode: String(data.batchCode || ''),
        clientId: String(data.clientId || ''),
        clientName: String(data.clientName || ''),
        authorizedEmail: String(data.authorizedEmail || ''),
        label: String(data.label || ''),
        plaqueType: (data.plaqueType || 'google_reviews') as PlaqueType,
        targetUrl: String(data.targetUrl || ''),
        status: (data.status || 'unassigned') as PlaqueStatus,
        redirectCode: Number(data.redirectCode || 301),
        scansCount: Number(data.scansCount || 0),
        lastScannedAt: String(data.lastScannedAt || ''),
        ownerUid: String(data.ownerUid || ''),
        createdAt: timestampToIso(data.createdAt),
        updatedAt: timestampToIso(data.updatedAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'plaques');
  }

  let rawScans: Array<{ channel: string; os: string; scannedAt: string }> = [];
  try {
    const q = isAdmin
      ? collection(db, 'scans')
      : query(collection(db, 'scans'), where('authorizedEmail', '==', email));
    const snap = await getDocs(q);
    rawScans = snap.docs.map((d) => {
      const data = d.data();
      return {
        channel: String(data.channel || 'qr'),
        os: String(data.os || 'Otro'),
        scannedAt: timestampToIso(data.scannedAt),
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'scans');
  }

  // Enrich aggregates
  const plaquesByBatch = new Map<string, Plaque[]>();
  const plaquesByClient = new Map<string, Plaque[]>();
  for (const p of plaques) {
    if (p.batchId) {
      const list = plaquesByBatch.get(p.batchId) || [];
      list.push(p);
      plaquesByBatch.set(p.batchId, list);
    }
    if (p.clientId) {
      const list = plaquesByClient.get(p.clientId) || [];
      list.push(p);
      plaquesByClient.set(p.clientId, list);
    }
  }

  batches = batches
    .map((b) => {
      const list = plaquesByBatch.get(b.id) || [];
      return {
        ...b,
        actualPlaques: list.length || b.quantity,
        configuredCount: list.filter((p) => p.targetUrl && p.status !== 'unassigned').length,
        totalScans: list.reduce((sum, p) => sum + p.scansCount, 0),
      };
    })
    .sort((a, b) => b.code.localeCompare(a.code));

  clients = clients
    .map((c) => {
      const list = plaquesByClient.get(c.id) || [];
      return {
        ...c,
        plaquesCount: list.length,
        totalScans: list.reduce((sum, p) => sum + p.scansCount, 0),
        batchesCount: batches.filter((b) => b.clientId === c.id).length,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  plaques.sort((a, b) => b.scansCount - a.scansCount || a.serialCode.localeCompare(b.serialCode));

  // Build 14-day chart series
  const days: ScanPoint[] = [];
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      qr: 0,
      nfc: 0,
      total: 0,
    });
  }
  const dayMap = new Map(days.map((d) => [d.date, d]));
  const osCounts = new Map<string, number>();

  for (const s of rawScans) {
    const dayKey = s.scannedAt.slice(0, 10);
    const bucket = dayMap.get(dayKey);
    if (bucket) {
      if (s.channel === 'nfc') bucket.nfc += 1;
      else bucket.qr += 1;
      bucket.total += 1;
    }
    osCounts.set(s.os, (osCounts.get(s.os) || 0) + 1);
  }

  const osBreakdown = Array.from(osCounts.entries())
    .map(([os, count]) => ({ os, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  const dashboard: DashboardData = {
    kpis: {
      totalBatches: batches.length,
      totalPlaques: plaques.length,
      configuredPlaques: plaques.filter((p) => p.targetUrl && p.status !== 'unassigned').length,
      activePlaques: plaques.filter((p) => p.status === 'active').length,
      totalScans: plaques.reduce((sum, p) => sum + p.scansCount, 0),
      totalClients: isAdmin ? clients.length : 1,
      activeClients: isAdmin ? clients.filter((c) => c.status === 'active').length : 1,
      mrr: isAdmin
        ? clients.filter((c) => c.status === 'active').reduce((sum, c) => sum + c.monthlyFee, 0)
        : 0,
    },
    chartSeries: days,
    osBreakdown,
    recentBatches: batches.slice(0, 5),
    topPlaques: [...plaques].sort((a, b) => b.scansCount - a.scansCount).slice(0, 5),
  };

  return { clients, batches, plaques, dashboard };
}

export async function createClientDoc(
  ownerUid: string,
  payload: {
    businessName: string;
    contactName: string;
    email: string;
    phone: string;
    category: string;
    plan: string;
    monthlyFee: number;
    status: ClientStatus;
    notes: string;
    portalEmail?: string;
  }
): Promise<void> {
  const clientId = makeDocId('client');
  const cleanPortalEmail = (payload.portalEmail || payload.email).trim().toLowerCase().slice(0, 200);
  const wb = writeBatch(db);

  wb.set(doc(db, 'clients', clientId), {
    businessName: payload.businessName.trim().slice(0, 140),
    contactName: payload.contactName.trim().slice(0, 120),
    email: payload.email.trim().toLowerCase().slice(0, 200),
    phone: payload.phone.trim().slice(0, 40),
    category: payload.category.trim().slice(0, 60),
    plan: payload.plan.trim().slice(0, 60),
    monthlyFee: Math.max(0, Number(payload.monthlyFee) || 0),
    status: payload.status,
    notes: payload.notes.trim().slice(0, 500),
    portalEmail: cleanPortalEmail,
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (cleanPortalEmail) {
    const accessId = emailToDocId(cleanPortalEmail);
    wb.set(doc(db, 'clientPortalAccess', accessId), {
      email: cleanPortalEmail,
      clientId,
      businessName: payload.businessName.trim().slice(0, 140),
      createdByUid: ownerUid,
      createdAt: serverTimestamp(),
    });
  }

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clients/${clientId}`);
  }
}

export async function updateClientStatusDoc(clientId: string, status: ClientStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'clients', clientId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}`);
  }
}

export async function authorizeClientPortalEmail(
  adminUid: string,
  client: Client,
  portalEmail: string
): Promise<void> {
  const cleanEmail = portalEmail.trim().toLowerCase().slice(0, 200);
  const accessId = emailToDocId(cleanEmail);
  const wb = writeBatch(db);

  wb.update(doc(db, 'clients', client.id), {
    portalEmail: cleanEmail,
    updatedAt: serverTimestamp(),
  });

  wb.set(doc(db, 'clientPortalAccess', accessId), {
    email: cleanEmail,
    clientId: client.id,
    businessName: client.businessName.slice(0, 140),
    createdByUid: adminUid,
    createdAt: serverTimestamp(),
  });

  // Update authorizedEmail on existing batches/plaques of this client
  const batchSnap = await getDocs(
    query(collection(db, 'batches'), where('clientId', '==', client.id))
  );
  batchSnap.forEach((d) => {
    wb.update(d.ref, { authorizedEmail: cleanEmail, updatedAt: serverTimestamp() });
  });

  const plaqueSnap = await getDocs(
    query(collection(db, 'plaques'), where('clientId', '==', client.id))
  );
  plaqueSnap.forEach((d) => {
    wb.update(d.ref, { authorizedEmail: cleanEmail, updatedAt: serverTimestamp() });
  });

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `clientPortalAccess/${accessId}`);
  }
}

export async function deleteClientDoc(clientId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clients', clientId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}`);
  }
}

export async function createBatchWithPlaques(
  ownerUid: string,
  existingBatchCount: number,
  clients: Client[],
  payload: {
    name: string;
    clientId: string;
    plaqueType: PlaqueType;
    prefix: string;
    quantity: number;
    defaultTargetUrl: string;
    status: BatchStatus;
  }
): Promise<void> {
  const batchId = makeDocId('batch');
  const nextNum = existingBatchCount + 1;
  const code = `Lote #${String(nextNum).padStart(3, '0')}`;
  const cleanPrefix = sanitizeSlug(payload.prefix);
  const qty = Math.min(200, Math.max(1, Math.floor(payload.quantity)));

  const client = clients.find((c) => c.id === payload.clientId) || null;
  const clientId = client ? client.id : '';
  const clientName = client ? client.businessName.slice(0, 140) : '';
  const authorizedEmail = client ? (client.portalEmail || client.email).toLowerCase() : '';
  const cleanUrl = payload.defaultTargetUrl.trim().slice(0, 1000);

  const typeLabels: Record<PlaqueType, string> = {
    google_reviews: 'Reseñas Google',
    digital_card: 'Tarjeta NFC',
    qr_menu: 'Menú QR',
    whatsapp_direct: 'WhatsApp',
    custom: 'Placa Dinámica',
  };

  const wb = writeBatch(db);
  wb.set(doc(db, 'batches', batchId), {
    code,
    name: payload.name.trim().slice(0, 160),
    clientId,
    clientName,
    authorizedEmail,
    plaqueType: payload.plaqueType,
    prefix: cleanPrefix,
    quantity: qty,
    status: payload.status,
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const padLen = qty >= 100 ? 3 : 2;
  const uniqueSuffix = Date.now().toString(36).slice(-3);

  for (let i = 1; i <= qty; i++) {
    const idxStr = String(i).padStart(padLen, '0');
    const serialCode = `NP-${String(nextNum).padStart(3, '0')}-${String(i).padStart(3, '0')}`;
    let slug = sanitizeSlug(`${cleanPrefix}-${idxStr}`);
    // Check if slug already exists in routes
    const routeCheck = await getDoc(doc(db, 'routes', slug));
    if (routeCheck.exists()) {
      slug = sanitizeSlug(`${cleanPrefix}-${uniqueSuffix}-${idxStr}`);
    }

    const plaqueId = makeDocId('plaque');
    const plaqueStatus: PlaqueStatus = cleanUrl
      ? payload.status === 'inactive'
        ? 'paused'
        : 'active'
      : 'unassigned';

    wb.set(doc(db, 'plaques', plaqueId), {
      serialCode,
      slug,
      batchId,
      batchCode: code,
      clientId,
      clientName,
      authorizedEmail,
      label: `${typeLabels[payload.plaqueType]} #${idxStr}`.slice(0, 140),
      plaqueType: payload.plaqueType,
      targetUrl: cleanUrl,
      status: plaqueStatus,
      redirectCode: 301,
      scansCount: 0,
      lastScannedAt: '',
      ownerUid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    wb.set(doc(db, 'routes', slug), {
      slug,
      plaqueId,
      batchId,
      clientId,
      targetUrl: cleanUrl,
      status: plaqueStatus,
      redirectCode: 301,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `batches/${batchId}`);
  }
}

export async function updateBatchStatusDoc(batchId: string, status: BatchStatus): Promise<void> {
  try {
    await updateDoc(doc(db, 'batches', batchId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `batches/${batchId}`);
  }
}

export async function deleteBatchAndPlaques(batchId: string): Promise<void> {
  const wb = writeBatch(db);
  wb.delete(doc(db, 'batches', batchId));
  const pSnap = await getDocs(query(collection(db, 'plaques'), where('batchId', '==', batchId)));
  pSnap.forEach((d) => {
    const slug = String(d.data().slug || '');
    wb.delete(d.ref);
    if (slug) wb.delete(doc(db, 'routes', slug));
  });
  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `batches/${batchId}`);
  }
}

export async function createSinglePlaqueDoc(
  ownerUid: string,
  existingCount: number,
  clients: Client[],
  payload: {
    label: string;
    slug: string;
    clientId: string;
    plaqueType: PlaqueType;
    targetUrl: string;
    redirectCode: 301 | 302;
  }
): Promise<void> {
  const cleanSlug = sanitizeSlug(payload.slug);
  const existingRoute = await getDoc(doc(db, 'routes', cleanSlug));
  if (existingRoute.exists()) {
    throw new Error('Esa ruta corta ya está en uso por otra placa.');
  }

  const client = clients.find((c) => c.id === payload.clientId) || null;
  const plaqueId = makeDocId('plaque');
  const serialCode = `NP-IND-${String(existingCount + 1).padStart(4, '0')}`;
  const cleanUrl = payload.targetUrl.trim().slice(0, 1000);
  const status: PlaqueStatus = cleanUrl ? 'active' : 'unassigned';

  const wb = writeBatch(db);
  wb.set(doc(db, 'plaques', plaqueId), {
    serialCode,
    slug: cleanSlug,
    batchId: '',
    batchCode: '',
    clientId: client ? client.id : '',
    clientName: client ? client.businessName.slice(0, 140) : '',
    authorizedEmail: client ? (client.portalEmail || client.email).toLowerCase() : '',
    label: payload.label.trim().slice(0, 140),
    plaqueType: payload.plaqueType,
    targetUrl: cleanUrl,
    status,
    redirectCode: payload.redirectCode,
    scansCount: 0,
    lastScannedAt: '',
    ownerUid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  wb.set(doc(db, 'routes', cleanSlug), {
    slug: cleanSlug,
    plaqueId,
    batchId: '',
    clientId: client ? client.id : '',
    targetUrl: cleanUrl,
    status,
    redirectCode: payload.redirectCode,
    updatedAt: serverTimestamp(),
  });

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `plaques/${plaqueId}`);
  }
}

export async function updatePlaqueDoc(
  user: AuthUser,
  existing: Plaque,
  clients: Client[],
  updates: {
    label: string;
    targetUrl: string;
    status: PlaqueStatus;
    slug?: string;
    clientId?: string;
    plaqueType?: PlaqueType;
    redirectCode?: number;
  }
): Promise<Plaque> {
  const isAdmin = user.role === 'admin';
  const cleanUrl = updates.targetUrl.trim().slice(0, 1000);
  let nextStatus = updates.status;
  if (!cleanUrl && nextStatus === 'active') nextStatus = 'unassigned';

  const wb = writeBatch(db);
  const plaqueRef = doc(db, 'plaques', existing.id);
  const nowIso = new Date().toISOString();

  if (!isAdmin) {
    wb.update(plaqueRef, {
      label: updates.label.trim().slice(0, 140),
      targetUrl: cleanUrl,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    wb.update(doc(db, 'routes', existing.slug), {
      targetUrl: cleanUrl,
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    try {
      await wb.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `plaques/${existing.id}`);
    }

    return {
      ...existing,
      label: updates.label.trim().slice(0, 140),
      targetUrl: cleanUrl,
      status: nextStatus,
      updatedAt: nowIso,
    };
  }

  // Admin full update
  const nextSlug = updates.slug ? sanitizeSlug(updates.slug) : existing.slug;
  if (nextSlug !== existing.slug) {
    const slugCheck = await getDoc(doc(db, 'routes', nextSlug));
    if (slugCheck.exists()) {
      throw new Error('Ya existe otra placa con esa ruta corta.');
    }
    wb.delete(doc(db, 'routes', existing.slug));
  }

  const client =
    updates.clientId !== undefined
      ? clients.find((c) => c.id === updates.clientId) || null
      : clients.find((c) => c.id === existing.clientId) || null;

  const nextClientId = client ? client.id : '';
  const nextClientName = client ? client.businessName.slice(0, 140) : '';
  const nextAuthorizedEmail = client ? (client.portalEmail || client.email).toLowerCase() : '';
  const nextType = updates.plaqueType || existing.plaqueType;
  const nextRedirect = updates.redirectCode === 302 ? 302 : 301;

  wb.update(plaqueRef, {
    label: updates.label.trim().slice(0, 140),
    slug: nextSlug,
    clientId: nextClientId,
    clientName: nextClientName,
    authorizedEmail: nextAuthorizedEmail,
    plaqueType: nextType,
    targetUrl: cleanUrl,
    status: nextStatus,
    redirectCode: nextRedirect,
    updatedAt: serverTimestamp(),
  });

  wb.set(doc(db, 'routes', nextSlug), {
    slug: nextSlug,
    plaqueId: existing.id,
    batchId: existing.batchId,
    clientId: nextClientId,
    targetUrl: cleanUrl,
    status: nextStatus,
    redirectCode: nextRedirect,
    updatedAt: serverTimestamp(),
  });

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `plaques/${existing.id}`);
  }

  return {
    ...existing,
    label: updates.label.trim().slice(0, 140),
    slug: nextSlug,
    clientId: nextClientId,
    clientName: nextClientName,
    authorizedEmail: nextAuthorizedEmail,
    plaqueType: nextType,
    targetUrl: cleanUrl,
    status: nextStatus,
    redirectCode: nextRedirect,
    updatedAt: nowIso,
  };
}

export async function deletePlaqueDoc(plaque: Plaque): Promise<void> {
  const wb = writeBatch(db);
  wb.delete(doc(db, 'plaques', plaque.id));
  if (plaque.slug) {
    wb.delete(doc(db, 'routes', plaque.slug));
  }
  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `plaques/${plaque.id}`);
  }
}

export async function recordSimulatedScan(
  user: AuthUser,
  plaque: Plaque,
  channel: 'qr' | 'nfc'
): Promise<RouterTestResult> {
  const res = await fetch(`/api/router/test/${encodeURIComponent(plaque.slug)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel }),
  });
  if (!res.ok) {
    throw new Error('No se pudo probar la redirección en el servidor.');
  }
  const result = (await res.json()) as RouterTestResult;

  // Record scan directly in Firestore
  const scanId = makeDocId('scan');
  const wb = writeBatch(db);
  wb.set(doc(db, 'scans', scanId), {
    plaqueId: plaque.id,
    batchId: plaque.batchId,
    clientId: plaque.clientId,
    authorizedEmail: plaque.authorizedEmail,
    slug: plaque.slug,
    deviceType: 'mobile',
    os: 'iOS',
    channel,
    recordedByUid: user.uid,
    scannedAt: serverTimestamp(),
  });

  wb.update(doc(db, 'plaques', plaque.id), {
    scansCount: increment(1),
    lastScannedAt: new Date().toISOString(),
    updatedAt: serverTimestamp(),
  });

  try {
    await wb.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `scans/${scanId}`);
  }

  return result;
}

export async function generateQrForSlug(slug: string): Promise<QrAssets> {
  const res = await fetch('/api/qr/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug }),
  });
  if (!res.ok) {
    throw new Error('No se pudo generar el código QR.');
  }
  return (await res.json()) as QrAssets;
}

export function downloadBatchCsvClient(batch: Batch, allPlaques: Plaque[]): void {
  const origin = window.location.origin;
  const rows = allPlaques.filter((p) => p.batchId === batch.id);
  const lines = [
    ['Serial', 'Etiqueta', 'Slug', 'URL Corta Dinámica (QR/NFC)', 'URL Destino Actual', 'Estado', 'Lecturas'].join(
      ','
    ),
  ];

  for (const p of rows) {
    lines.push(
      [
        p.serialCode,
        `"${p.label.replace(/"/g, '""')}"`,
        p.slug,
        `${origin}/qr/${p.slug}`,
        `"${(p.targetUrl || '').replace(/"/g, '""')}"`,
        p.status,
        String(p.scansCount),
      ].join(',')
    );
  }

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${batch.prefix}-plaquitas.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
