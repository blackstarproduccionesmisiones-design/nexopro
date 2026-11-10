export type UserRole = 'admin' | 'client';
export type ClientStatus = 'active' | 'paused' | 'trial';
export type BatchStatus = 'active' | 'production' | 'inactive';
export type PlaqueType =
  | 'google_reviews'
  | 'digital_card'
  | 'qr_menu'
  | 'whatsapp_direct'
  | 'custom';
export type PlaqueStatus = 'active' | 'paused' | 'unassigned';

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  clientId: string;
  clientName?: string;
}

export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  category: string;
  plan: string;
  monthlyFee: number;
  status: ClientStatus;
  notes: string;
  portalEmail: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
  plaquesCount?: number;
  totalScans?: number;
  batchesCount?: number;
}

export interface Batch {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  authorizedEmail: string;
  plaqueType: PlaqueType;
  prefix: string;
  quantity: number;
  status: BatchStatus;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
  actualPlaques?: number;
  configuredCount?: number;
  totalScans?: number;
}

export interface Plaque {
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
  redirectCode: number;
  scansCount: number;
  lastScannedAt: string;
  ownerUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScanPoint {
  date: string;
  label: string;
  qr: number;
  nfc: number;
  total: number;
}

export interface DashboardData {
  kpis: {
    totalBatches: number;
    totalPlaques: number;
    configuredPlaques: number;
    activePlaques: number;
    totalScans: number;
    totalClients: number;
    activeClients: number;
    mrr: number;
  };
  chartSeries: ScanPoint[];
  osBreakdown: Array<{ os: string; count: number }>;
  recentBatches: Batch[];
  topPlaques: Plaque[];
}

export interface QrAssets {
  shortUrl: string;
  nfcUrl: string;
  svg: string;
  pngDataUrl: string;
}

export interface RouterTestResult {
  slug: string;
  requestUrl: string;
  statusCode: number;
  locationHeader: string | null;
  cacheControl: string | null;
  latencyMs: number;
}

export const PLAQUE_TYPE_LABELS: Record<PlaqueType, string> = {
  google_reviews: 'Reseñas Google',
  digital_card: 'Tarjeta Digital NFC',
  qr_menu: 'Menú QR',
  whatsapp_direct: 'WhatsApp Directo',
  custom: 'Enlace Personalizado',
};

export const PLAQUE_STATUS_LABELS: Record<PlaqueStatus, string> = {
  active: 'Activa',
  paused: 'Pausada',
  unassigned: 'Sin destino',
};

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  active: 'Activo',
  production: 'En producción',
  inactive: 'Inactivo',
};

export const CLIENT_STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'Activo',
  paused: 'Pausado',
  trial: 'Prueba',
};
