import QRCode from 'qrcode';

interface VercelReq {
  body?: { slug?: string };
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
  const slug = sanitizeSlug(String(req.body?.slug || ''));
  if (!slug) {
    res.status(400).json({ error: 'Slug inválido.' });
    return;
  }

  const origin = getOrigin(req);
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

  res.status(200).json({ shortUrl, nfcUrl, svg, pngDataUrl });
}
