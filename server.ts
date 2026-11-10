import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import QRCode from 'qrcode';

interface FirebaseAppletConfig {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

interface PendingPublicScan {
  id: string;
  slug: string;
  plaqueId: string;
  batchId: string;
  clientId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  os: string;
  channel: 'qr' | 'nfc' | 'direct';
  scannedAt: string;
}

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')) as FirebaseAppletConfig;

const DATA_DIR = path.resolve(process.cwd(), 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const PUBLIC_SCANS_PATH = path.join(DATA_DIR, 'public_scans.json');

function readPendingScans(): PendingPublicScan[] {
  try {
    if (!fs.existsSync(PUBLIC_SCANS_PATH)) return [];
    const raw = fs.readFileSync(PUBLIC_SCANS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePendingScans(scans: PendingPublicScan[]): void {
  fs.writeFileSync(PUBLIC_SCANS_PATH, JSON.stringify(scans), 'utf8');
}

const PORT = 3000;
const app = express();
app.set('trust proxy', true);
app.use(express.json());

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

function parseUserAgent(ua: string): { deviceType: 'mobile' | 'desktop' | 'tablet'; os: string } {
  const lower = ua.toLowerCase();
  let os = 'Otro';
  if (/iphone|ipad|ipod/.test(lower)) os = 'iOS';
  else if (/android/.test(lower)) os = 'Android';
  else if (/windows/.test(lower)) os = 'Windows';
  else if (/mac os|macintosh/.test(lower)) os = 'macOS';
  else if (/linux/.test(lower)) os = 'Linux';

  let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/ipad|tablet/.test(lower)) deviceType = 'tablet';
  else if (/mobi|iphone|android/.test(lower)) deviceType = 'mobile';

  return { deviceType, os };
}

function getBaseOrigin(req: express.Request): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function renderStatusHtml(title: string, message: string, slug?: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} — Nexo Pro</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #080d1a;
        color: #f1f5f9;
        font-family: system-ui, -apple-system, sans-serif;
        padding: 24px;
      }
      .card {
        max-width: 440px;
        width: 100%;
        background: #111827;
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: 16px;
        padding: 32px;
        text-align: center;
      }
      .brand {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.08em;
        color: #60a5fa;
        text-transform: uppercase;
        margin-bottom: 16px;
      }
      h1 { font-size: 22px; margin: 0 0 10px; }
      p { color: #94a3b8; font-size: 15px; line-height: 1.5; margin: 0 0 20px; }
      .slug {
        display: inline-block;
        font-family: monospace;
        font-size: 13px;
        color: #cbd5e1;
        background: #0b1120;
        border: 1px solid rgba(148, 163, 184, 0.2);
        padding: 6px 12px;
        border-radius: 8px;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="brand">Nexo Pro</div>
      <h1>${title}</h1>
      <p>${message}</p>
      ${slug ? `<div class="slug">/qr/${slug}</div>` : ''}
    </div>
  </body>
</html>`;
}

interface FirestoreRouteDoc {
  slug: string;
  plaqueId: string;
  batchId: string;
  clientId: string;
  targetUrl: string;
  status: string;
  redirectCode: number;
}

async function fetchRouteFromFirestore(slug: string): Promise<FirestoreRouteDoc | null> {
  const dbId = encodeURIComponent(firebaseConfig.firestoreDatabaseId || '(default)');
  const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${dbId}/documents/routes/${encodeURIComponent(
    slug
  )}?key=${firebaseConfig.apiKey}`;

  const resp = await fetch(url);
  if (resp.status === 404) return null;
  if (!resp.ok) {
    throw new Error(`Firestore lookup error ${resp.status}`);
  }
  const payload = (await resp.json()) as {
    fields?: Record<string, { stringValue?: string; integerValue?: string }>;
  };
  const f = payload.fields;
  if (!f) return null;

  return {
    slug: f.slug?.stringValue || slug,
    plaqueId: f.plaqueId?.stringValue || '',
    batchId: f.batchId?.stringValue || '',
    clientId: f.clientId?.stringValue || '',
    targetUrl: f.targetUrl?.stringValue || '',
    status: f.status?.stringValue || 'unassigned',
    redirectCode: Number(f.redirectCode?.integerValue || 301),
  };
}

// ============================================================================
// PUBLIC DYNAMIC ROUTER (READS LIVE FROM FIRESTORE /routes/{slug})
// ============================================================================
app.get('/qr/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug || '');
  if (!slug) {
    res.status(404).send(renderStatusHtml('Placa no encontrada', 'El código solicitado no es válido.'));
    return;
  }

  let route: FirestoreRouteDoc | null = null;
  try {
    route = await fetchRouteFromFirestore(slug);
  } catch {
    res
      .status(503)
      .send(
        renderStatusHtml(
          'Error temporal de conexión',
          'No se pudo consultar la base de datos de rutas. Intenta nuevamente en unos segundos.',
          slug
        )
      );
    return;
  }

  if (!route) {
    res
      .status(404)
      .send(
        renderStatusHtml(
          'Placa no registrada',
          'Este código QR o chip NFC no existe en la base de datos de Firestore.',
          slug
        )
      );
    return;
  }

  if (route.status === 'paused') {
    res
      .status(200)
      .send(
        renderStatusHtml(
          'Placa pausada temporalmente',
          'El comercio o administrador ha pausado esta redirección. Contacta al titular para reactivarla.',
          slug
        )
      );
    return;
  }

  if (!route.targetUrl || route.status === 'unassigned') {
    res
      .status(200)
      .send(
        renderStatusHtml(
          'Placa pendiente de activación',
          'Esta placa física aún no tiene una URL de destino configurada en el panel de control.',
          slug
        )
      );
    return;
  }

  // Record public scan event unless invoked by dashboard internal tester (which logs directly via Firestore SDK)
  const isTester = req.query.tester === '1';
  if (!isTester) {
    const ua = req.get('user-agent') || '';
    const { deviceType, os } = parseUserAgent(ua);
    const srcQuery = typeof req.query.src === 'string' ? req.query.src.toLowerCase() : '';
    const channel: 'qr' | 'nfc' | 'direct' =
      srcQuery === 'nfc' ? 'nfc' : srcQuery === 'direct' ? 'direct' : 'qr';

    const pending = readPendingScans();
    pending.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      slug,
      plaqueId: route.plaqueId,
      batchId: route.batchId,
      clientId: route.clientId,
      deviceType,
      os,
      channel,
      scannedAt: new Date().toISOString(),
    });
    writePendingScans(pending.slice(-500));
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const statusCode = route.redirectCode === 302 ? 302 : 301;
  res.redirect(statusCode, route.targetUrl);
});

// ============================================================================
// PUBLIC SCAN QUEUE SYNC & QR GENERATOR HELPERS
// ============================================================================
app.get('/api/public-scans', (_req, res) => {
  res.json({ scans: readPendingScans() });
});

app.post('/api/public-scans/ack', (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? new Set(req.body.ids.map(String)) : new Set<string>();
  const remaining = readPendingScans().filter((s) => !ids.has(s.id));
  writePendingScans(remaining);
  res.json({ ok: true, remaining: remaining.length });
});

app.post('/api/qr/generate', async (req, res) => {
  const slug = sanitizeSlug(String(req.body?.slug || ''));
  if (!slug) {
    res.status(400).json({ error: 'Slug inválido.' });
    return;
  }
  const origin = getBaseOrigin(req);
  const shortUrl = `${origin}/qr/${slug}`;
  const nfcUrl = `${origin}/qr/${slug}?src=nfc`;

  const svg = await QRCode.toString(shortUrl, {
    type: 'svg',
    margin: 2,
    width: 320,
    color: { dark: '#0B1120', light: '#FFFFFF' },
  });

  const pngDataUrl = await QRCode.toDataURL(shortUrl, {
    margin: 2,
    width: 640,
    color: { dark: '#0B1120', light: '#FFFFFF' },
  });

  res.json({ shortUrl, nfcUrl, svg, pngDataUrl });
});

app.post('/api/router/test/:slug', async (req, res) => {
  const slug = sanitizeSlug(req.params.slug || '');
  const channel = req.body?.channel === 'nfc' ? 'nfc' : 'qr';
  if (!slug) {
    res.status(400).json({ error: 'Slug inválido.' });
    return;
  }

  const startedAt = performance.now();
  const localUrl = `http://127.0.0.1:${PORT}/qr/${encodeURIComponent(slug)}?src=${channel}&tester=1`;
  const response = await fetch(localUrl, {
    method: 'GET',
    redirect: 'manual',
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  res.json({
    slug,
    requestUrl: `${getBaseOrigin(req)}/qr/${slug}?src=${channel}`,
    statusCode: response.status,
    locationHeader: response.headers.get('location'),
    cacheControl: response.headers.get('cache-control'),
    latencyMs,
  });
});

// ============================================================================
// VITE DEV MIDDLEWARE OR PRODUCTION STATIC SERVER
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nexo Pro (Firebase Firestore) running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
