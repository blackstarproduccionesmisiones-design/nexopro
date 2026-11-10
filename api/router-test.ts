interface VercelReq {
  query?: Record<string, string | string[] | undefined>;
  body?: { channel?: string };
  headers: Record<string, string | string[] | undefined>;
}

interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
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

function getOrigin(req: VercelReq): string {
  if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL') {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const protoHeader = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) || 'https';
  const hostHeader = req.headers['x-forwarded-host'] || req.headers.host;
  const host = (Array.isArray(hostHeader) ? hostHeader[0] : hostHeader) || 'localhost';
  return `${proto}://${host}`;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  const rawSlug = Array.isArray(req.query?.slug) ? req.query?.slug[0] : req.query?.slug;
  const slug = sanitizeSlug(String(rawSlug || ''));
  const channel = req.body?.channel === 'nfc' ? 'nfc' : 'qr';
  if (!slug) {
    res.status(400).json({ error: 'Slug inválido.' });
    return;
  }

  const origin = getOrigin(req);
  const targetEndpoint = `${origin}/qr/${encodeURIComponent(slug)}?src=${channel}&tester=1`;

  const startedAt = performance.now();
  const response = await fetch(targetEndpoint, {
    method: 'GET',
    redirect: 'manual',
  });
  const latencyMs = Math.round(performance.now() - startedAt);

  res.status(200).json({
    slug,
    requestUrl: `${origin}/qr/${slug}?src=${channel}`,
    statusCode: response.status,
    locationHeader: response.headers.get('location'),
    cacheControl: response.headers.get('cache-control'),
    latencyMs,
  });
}
