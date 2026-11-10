import fs from 'node:fs';
import path from 'node:path';

interface VercelReq {
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  redirect: (statusCode: number, url: string) => void;
}

interface FirebaseCfg {
  projectId: string;
  apiKey: string;
  firestoreDatabaseId: string;
}

function getFirebaseConfig(): FirebaseCfg {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_API_KEY) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      apiKey: process.env.FIREBASE_API_KEY,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)',
    };
  }
  const cfgPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
  return JSON.parse(fs.readFileSync(cfgPath, 'utf8')) as FirebaseCfg;
}

function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
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

export default async function handler(req: VercelReq, res: VercelRes) {
  const rawSlug = Array.isArray(req.query?.slug) ? req.query?.slug[0] : req.query?.slug;
  const slug = sanitizeSlug(String(rawSlug || ''));
  if (!slug) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(404).send(renderStatusHtml('Placa no encontrada', 'El código solicitado no es válido.'));
    return;
  }

  const cfg = getFirebaseConfig();
  const dbId = encodeURIComponent(cfg.firestoreDatabaseId || '(default)');
  const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${dbId}/documents/routes/${encodeURIComponent(
    slug
  )}?key=${cfg.apiKey}`;

  try {
    const resp = await fetch(url);
    if (resp.status === 404) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res
        .status(404)
        .send(
          renderStatusHtml(
            'Placa no registrada',
            'Este código QR o chip NFC no existe en la base de datos.',
            slug
          )
        );
      return;
    }

    if (!resp.ok) {
      throw new Error(`Firestore HTTP ${resp.status}`);
    }

    const payload = (await resp.json()) as {
      fields?: Record<string, { stringValue?: string; integerValue?: string }>;
    };
    const f = payload.fields;
    const targetUrl = f?.targetUrl?.stringValue || '';
    const status = f?.status?.stringValue || 'unassigned';
    const redirectCode = Number(f?.redirectCode?.integerValue || 301) === 302 ? 302 : 301;

    if (status === 'paused') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
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

    if (!targetUrl || status === 'unassigned') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
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

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.redirect(redirectCode, targetUrl);
  } catch {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res
      .status(503)
      .send(
        renderStatusHtml(
          'Error temporal de conexión',
          'No se pudo consultar la base de datos de rutas. Intenta nuevamente en unos segundos.',
          slug
        )
      );
  }
}
