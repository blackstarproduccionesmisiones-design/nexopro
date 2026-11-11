import QRCode from 'qrcode';
import type { Plaque, PlaqueType } from '../types';

export type PrintTemplateId =
  | 'google_reviews'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'whatsapp_direct'
  | 'qr_menu'
  | 'digital_card'
  | 'custom';

export type PlaqueSurfaceTheme = 'light' | 'dark' | 'brand';

export interface PrintTemplateConfig {
  id: PrintTemplateId;
  name: string;
  shortLabel: string;
  accentPrimary: string;
  accentSecondary: string;
  brandGradientCss: string;
  brandGradientStops: [string, string, string];
  defaultHeadline: string;
  defaultSubtitle: string;
  defaultInstruction: string;
  showStars?: boolean;
}

export const PRINT_TEMPLATES: Record<PrintTemplateId, PrintTemplateConfig> = {
  google_reviews: {
    id: 'google_reviews',
    name: 'Google Reseñas',
    shortLabel: 'Google',
    accentPrimary: '#4285F4',
    accentSecondary: '#FBBC05',
    brandGradientCss: 'linear-gradient(155deg, #4285F4 0%, #1A73E8 52%, #1557B0 100%)',
    brandGradientStops: ['#4285F4', '#1A73E8', '#1557B0'],
    defaultHeadline: '¡Califícanos en Google!',
    defaultSubtitle: 'Tu opinión nos ayuda a seguir creciendo',
    defaultInstruction: 'Escanea el QR o acerca tu celular NFC',
    showStars: true,
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    shortLabel: 'Instagram',
    accentPrimary: '#E1306C',
    accentSecondary: '#F77737',
    brandGradientCss: 'linear-gradient(145deg, #FF7A00 0%, #E1306C 50%, #7C3AED 100%)',
    brandGradientStops: ['#FF7A00', '#E1306C', '#7C3AED'],
    defaultHeadline: '¡Síguenos en Instagram!',
    defaultSubtitle: 'Etiquétanos y entérate de las novedades',
    defaultInstruction: 'Escanea el código o apoya tu teléfono',
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    shortLabel: 'Facebook',
    accentPrimary: '#1877F2',
    accentSecondary: '#00B4FF',
    brandGradientCss: 'linear-gradient(155deg, #00B4FF 0%, #1877F2 50%, #0A4DA6 100%)',
    brandGradientStops: ['#00B4FF', '#1877F2', '#0A4DA6'],
    defaultHeadline: '¡Síguenos en Facebook!',
    defaultSubtitle: 'Conecta con nuestra comunidad',
    defaultInstruction: 'Escanea el QR o acerca tu celular NFC',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    shortLabel: 'TikTok',
    accentPrimary: '#FE2C55',
    accentSecondary: '#25F4EE',
    brandGradientCss: 'linear-gradient(155deg, #080C14 0%, #05070B 60%, #101624 100%)',
    brandGradientStops: ['#080C14', '#05070B', '#101624'],
    defaultHeadline: '¡Síguenos en TikTok!',
    defaultSubtitle: 'Mira nuestros videos y promociones',
    defaultInstruction: 'Escanea el código o acerca tu celular',
  },
  whatsapp_direct: {
    id: 'whatsapp_direct',
    name: 'WhatsApp',
    shortLabel: 'WhatsApp',
    accentPrimary: '#25D366',
    accentSecondary: '#128C7E',
    brandGradientCss: 'linear-gradient(155deg, #00A884 0%, #16BA5A 52%, #128C7E 100%)',
    brandGradientStops: ['#00A884', '#16BA5A', '#128C7E'],
    defaultHeadline: '¡Escríbenos por WhatsApp!',
    defaultSubtitle: 'Atención directa, catálogo y pedidos',
    defaultInstruction: 'Escanea el QR o acerca tu celular NFC',
  },
  qr_menu: {
    id: 'qr_menu',
    name: 'Menú Digital QR',
    shortLabel: 'Menú QR',
    accentPrimary: '#D97706',
    accentSecondary: '#F59E0B',
    brandGradientCss: 'linear-gradient(155deg, #F59E0B 0%, #D97706 52%, #B45309 100%)',
    brandGradientStops: ['#F59E0B', '#D97706', '#B45309'],
    defaultHeadline: 'Nuestro Menú Digital',
    defaultSubtitle: 'Carta actualizada al instante',
    defaultInstruction: 'Escanea con tu cámara para ver la carta',
  },
  digital_card: {
    id: 'digital_card',
    name: 'Tarjeta Digital NFC',
    shortLabel: 'Tarjeta NFC',
    accentPrimary: '#2563EB',
    accentSecondary: '#38BDF8',
    brandGradientCss: 'linear-gradient(155deg, #38BDF8 0%, #2563EB 52%, #1E40AF 100%)',
    brandGradientStops: ['#38BDF8', '#2563EB', '#1E40AF'],
    defaultHeadline: 'Conecta con nosotros',
    defaultSubtitle: 'Guarda nuestro contacto y redes',
    defaultInstruction: 'Acerca tu celular NFC o escanea el QR',
  },
  custom: {
    id: 'custom',
    name: 'Personalizada',
    shortLabel: 'Nexo Pro',
    accentPrimary: '#3B82F6',
    accentSecondary: '#60A5FA',
    brandGradientCss: 'linear-gradient(155deg, #2563EB 0%, #1D4ED8 52%, #0F172A 100%)',
    brandGradientStops: ['#2563EB', '#1D4ED8', '#0F172A'],
    defaultHeadline: 'Escanea para acceder',
    defaultSubtitle: 'Enlace dinámico inteligente',
    defaultInstruction: 'Escanea el QR o apoya tu celular NFC',
  },
};

export function inferTemplateFromPlaque(plaque: Plaque): PrintTemplateId {
  const url = (plaque.targetUrl || '').toLowerCase();
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('wa.me') || url.includes('whatsapp.com')) return 'whatsapp_direct';
  if (url.includes('g.page') || url.includes('google.com/maps')) return 'google_reviews';

  const hint = `${plaque.label || ''} ${plaque.slug || ''}`.toLowerCase();
  if (hint.includes('instagram') || /\big\b/.test(hint)) return 'instagram';
  if (hint.includes('facebook') || /\bfb\b/.test(hint)) return 'facebook';
  if (hint.includes('tiktok')) return 'tiktok';
  if (hint.includes('whatsapp') || /\bwsp\b/.test(hint)) return 'whatsapp_direct';
  if (hint.includes('menu') || hint.includes('menú') || hint.includes('carta')) return 'qr_menu';
  if (hint.includes('google') || hint.includes('reseña') || hint.includes('resena')) {
    return 'google_reviews';
  }

  const typeMap: Record<PlaqueType, PrintTemplateId> = {
    google_reviews: 'google_reviews',
    digital_card: 'digital_card',
    qr_menu: 'qr_menu',
    whatsapp_direct: 'whatsapp_direct',
    custom: 'custom',
  };
  return typeMap[plaque.plaqueType] || 'google_reviews';
}

export interface PlaquePrintOptions {
  templateId: PrintTemplateId;
  surfaceTheme: PlaqueSurfaceTheme;
  businessName: string;
  headline: string;
  subtitle: string;
  instruction: string;
  showNfcIcon: boolean;
  showSerialFooter: boolean;
}

// 10 x 15 cm at 300 DPI = 1181 x 1772 px
const CANVAS_W = 1181;
const CANVAS_H = 1772;

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBrandBadgeOnCanvas(
  ctx: CanvasRenderingContext2D,
  templateId: PrintTemplateId,
  cx: number,
  cy: number,
  size: number,
  surfaceTheme: PlaqueSurfaceTheme
) {
  ctx.save();
  ctx.translate(cx, cy);
  const scale = size / 48;
  ctx.scale(scale, scale);
  ctx.translate(-24, -24);

  const isBrand = surfaceTheme === 'brand';
  const isDark = surfaceTheme === 'dark';

  if (templateId === 'google_reviews') {
    if (isBrand) {
      // White backing circle so 4-color Google G pops cleanly on Google Blue
      ctx.beginPath();
      ctx.fillStyle = '#FFFFFF';
      ctx.arc(24, 24, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(24, 24);
      ctx.scale(0.68, 0.68);
      ctx.translate(-24, -24);
    }
    ctx.fillStyle = '#EA4335';
    ctx.fill(
      new Path2D(
        'M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z'
      )
    );
    ctx.fillStyle = '#4285F4';
    ctx.fill(
      new Path2D(
        'M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z'
      )
    );
    ctx.fillStyle = '#FBBC05';
    ctx.fill(
      new Path2D(
        'M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z'
      )
    );
    ctx.fillStyle = '#34A853';
    ctx.fill(
      new Path2D(
        'M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z'
      )
    );
  } else if (templateId === 'instagram') {
    const grad = ctx.createLinearGradient(0, 48, 48, 0);
    grad.addColorStop(0, '#F58529');
    grad.addColorStop(0.5, '#DD2A7B');
    grad.addColorStop(1, '#515BD4');
    roundRectPath(ctx, 2, 2, 44, 44, 12);
    ctx.fillStyle = grad;
    ctx.fill();
    if (isBrand) {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    roundRectPath(ctx, 10, 10, 28, 28, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(24, 24, 6.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(33, 15, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (templateId === 'facebook') {
    ctx.beginPath();
    ctx.fillStyle = isBrand ? '#FFFFFF' : '#1877F2';
    ctx.arc(24, 24, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isBrand ? '#1877F2' : '#FFFFFF';
    ctx.fill(
      new Path2D(
        'M29.8 25.5l.8-5.2h-5v-3.4c0-1.4.7-2.8 2.9-2.8h2.3V9.6s-2.1-.4-4.1-.4c-4.1 0-6.8 2.5-6.8 7v4.1h-4.6v5.2h4.6V39h5.7V25.5h4.2z'
      )
    );
  } else if (templateId === 'tiktok') {
    roundRectPath(ctx, 2, 2, 44, 44, 12);
    ctx.fillStyle = isDark || isBrand ? '#0F1522' : '#090D16';
    ctx.fill();
    if (isDark || isBrand) {
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const notePath = new Path2D(
      'M29.5 11c.9 2.6 2.9 4.5 5.5 5.1v4.2c-2-.1-3.9-.7-5.5-1.7v8.1c0 4.6-3.7 8.3-8.3 8.3s-8.3-3.7-8.3-8.3 3.7-8.3 8.3-8.3c.5 0 1 .1 1.5.2v4.3c-.5-.2-1-.3-1.5-.3-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V11h4.3z'
    );
    ctx.save();
    ctx.translate(-1.2, -1);
    ctx.fillStyle = '#25F4EE';
    ctx.fill(notePath);
    ctx.restore();
    ctx.save();
    ctx.translate(1.2, 1);
    ctx.fillStyle = '#FE2C55';
    ctx.fill(notePath);
    ctx.restore();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill(notePath);
  } else if (templateId === 'whatsapp_direct') {
    ctx.beginPath();
    ctx.fillStyle = '#25D366';
    ctx.arc(24, 24, 22, 0, Math.PI * 2);
    ctx.fill();
    if (isBrand) {
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.2;
      ctx.stroke();
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.fill(
      new Path2D(
        'M24 11.5c-6.9 0-12.5 5.5-12.5 12.3 0 2.3.6 4.4 1.8 6.3L11.5 36.5l6.6-1.7c1.8 1 3.8 1.5 5.9 1.5 6.9 0 12.5-5.5 12.5-12.3S30.9 11.5 24 11.5zm6.5 17.4c-.3.8-1.6 1.5-2.3 1.6-.6.1-1.4.2-2.2-.1-.5-.2-1.2-.4-2.1-.8-3.6-1.5-5.9-5.1-6.1-5.4-.2-.3-1.5-1.9-1.5-3.6s.9-2.5 1.3-2.9c.3-.4.7-.5 1-.5h.7c.2 0 .5-.1.8.6.3.7 1 2.5 1.1 2.7.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.5.6-.2.2-.4.4-.2.7.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.1.8-.1.2-.2 1-1.1 1.2-1.5.3-.4.5-.3.8-.2.4.1 2.3 1.1 2.7 1.3.4.2.7.3.8.5.1.2.1 1-.2 1.8z'
      ),
      'evenodd'
    );
  } else if (templateId === 'qr_menu') {
    roundRectPath(ctx, 2, 2, 44, 44, 12);
    ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.18)' : '#D97706';
    ctx.fill();
    if (isBrand) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(new Path2D('M17 12v10m-3-10v6a3 3 0 0 0 6 0v-6m-3 10v14M31 12v24m0-24c3 2 4 6 4 10h-4'));
  } else {
    const color = PRINT_TEMPLATES[templateId].accentPrimary;
    roundRectPath(ctx, 2, 2, 44, 44, 12);
    ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.18)' : color;
    ctx.fill();
    if (isBrand) {
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke(new Path2D('M19 18a8 8 0 0 1 0 12m5-16a13 13 0 0 1 0 20m5-24a18 18 0 0 1 0 28'));
  }

  ctx.restore();
}

function drawNfcCornerWaves(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  [14, 24, 34].forEach((radius) => {
    ctx.beginPath();
    ctx.arc(0, 0, radius, -0.7, 0.7);
    ctx.stroke();
  });
  ctx.restore();
}

export async function renderPlaqueToPngDataUrl(
  plaque: Plaque,
  shortUrl: string,
  options: PlaquePrintOptions
): Promise<string> {
  const tpl = PRINT_TEMPLATES[options.templateId];
  const isDark = options.surfaceTheme === 'dark';
  const isBrand = options.surfaceTheme === 'brand';

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo inicializar el lienzo 2D.');

  // Background
  if (isBrand) {
    const bgGrad = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
    bgGrad.addColorStop(0, tpl.brandGradientStops[0]);
    bgGrad.addColorStop(0.52, tpl.brandGradientStops[1]);
    bgGrad.addColorStop(1, tpl.brandGradientStops[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Decorative corner waves for TikTok brand card (cyan top-left, magenta bottom-right)
    if (options.templateId === 'tiktok') {
      ctx.save();
      ctx.fillStyle = 'rgba(37, 244, 238, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(360, 0);
      ctx.quadraticCurveTo(180, 140, 0, 320);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(254, 44, 85, 0.30)';
      ctx.beginPath();
      ctx.moveTo(CANVAS_W, CANVAS_H);
      ctx.lineTo(CANVAS_W - 380, CANVAS_H);
      ctx.quadraticCurveTo(CANVAS_W - 190, CANVAS_H - 160, CANVAS_W, CANVAS_H - 340);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (options.templateId === 'google_reviews') {
      // Google 4-color top bar accent even on brand blue
      const segW = CANVAS_W / 4;
      ctx.fillStyle = '#4285F4';
      ctx.fillRect(0, 0, segW, 24);
      ctx.fillStyle = '#EA4335';
      ctx.fillRect(segW, 0, segW, 24);
      ctx.fillStyle = '#FBBC05';
      ctx.fillRect(segW * 2, 0, segW, 24);
      ctx.fillStyle = '#34A853';
      ctx.fillRect(segW * 3, 0, segW, 24);
    } else {
      // Subtle radial light sheen for depth
      const sheen = ctx.createRadialGradient(
        CANVAS_W * 0.2,
        CANVAS_H * 0.15,
        40,
        CANVAS_W * 0.5,
        CANVAS_H * 0.5,
        CANVAS_H * 0.85
      );
      sheen.addColorStop(0, 'rgba(255,255,255,0.16)');
      sheen.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = sheen;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
  } else {
    ctx.fillStyle = isDark ? '#0B1120' : '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Top decorative accent bar on white / dark finishes
    if (options.templateId === 'instagram') {
      const grad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
      grad.addColorStop(0, '#F58529');
      grad.addColorStop(0.5, '#DD2A7B');
      grad.addColorStop(1, '#515BD4');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, 34);
    } else if (options.templateId === 'whatsapp_direct') {
      const grad = ctx.createLinearGradient(0, 0, CANVAS_W, 0);
      grad.addColorStop(0, '#25D366');
      grad.addColorStop(1, '#128C7E');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, 34);
    } else if (options.templateId === 'google_reviews') {
      const segW = CANVAS_W / 4;
      ctx.fillStyle = '#4285F4';
      ctx.fillRect(0, 0, segW, 34);
      ctx.fillStyle = '#EA4335';
      ctx.fillRect(segW, 0, segW, 34);
      ctx.fillStyle = '#FBBC05';
      ctx.fillRect(segW * 2, 0, segW, 34);
      ctx.fillStyle = '#34A853';
      ctx.fillRect(segW * 3, 0, segW, 34);
    } else if (options.templateId === 'tiktok') {
      ctx.fillStyle = '#25F4EE';
      ctx.fillRect(0, 0, CANVAS_W / 2, 34);
      ctx.fillStyle = '#FE2C55';
      ctx.fillRect(CANVAS_W / 2, 0, CANVAS_W / 2, 34);
    } else {
      ctx.fillStyle = tpl.accentPrimary;
      ctx.fillRect(0, 0, CANVAS_W, 34);
    }
  }

  // Subtle print frame
  ctx.strokeStyle = isBrand
    ? 'rgba(255,255,255,0.28)'
    : isDark
    ? 'rgba(148,163,184,0.22)'
    : 'rgba(15,23,42,0.12)';
  ctx.lineWidth = 4;
  roundRectPath(ctx, 42, 62, CANVAS_W - 84, CANVAS_H - 104, 44);
  ctx.stroke();

  // Top-right NFC wave indicator
  if (options.showNfcIcon) {
    drawNfcCornerWaves(
      ctx,
      CANVAS_W - 125,
      138,
      isBrand ? 'rgba(255,255,255,0.92)' : isDark ? '#94A3B8' : tpl.accentPrimary
    );
  }

  // Brand emblem at top
  drawBrandBadgeOnCanvas(
    ctx,
    options.templateId,
    CANVAS_W / 2,
    185,
    144,
    options.surfaceTheme
  );

  // Business name label
  ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.88)' : isDark ? '#94A3B8' : '#475569';
  ctx.font = '700 34px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    (options.businessName || plaque.clientName || 'NEXO PRO').toUpperCase(),
    CANVAS_W / 2,
    296
  );

  // Main Headline
  ctx.fillStyle = isBrand || isDark ? '#FFFFFF' : '#0F172A';
  ctx.font = '800 66px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(options.headline.slice(0, 32), CANVAS_W / 2, 382);

  // Optional Google 5-stars or Subtitle
  let qrTopY = 530;
  if (tpl.showStars) {
    ctx.fillStyle = '#FBBF24';
    ctx.font = '64px Arial, sans-serif';
    ctx.fillText('★ ★ ★ ★ ★', CANVAS_W / 2, 466);
    qrTopY = 536;
  } else {
    ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.9)' : isDark ? '#CBD5E1' : '#334155';
    ctx.font = '500 34px "DM Sans", Arial, sans-serif';
    ctx.fillText(options.subtitle.slice(0, 48), CANVAS_W / 2, 462);
  }

  // QR Container Box
  const qrBoxSize = 720;
  const qrBoxX = (CANVAS_W - qrBoxSize) / 2;
  ctx.fillStyle = '#FFFFFF';
  roundRectPath(ctx, qrBoxX, qrTopY, qrBoxSize, qrBoxSize, 42);
  ctx.fill();
  ctx.strokeStyle = isBrand ? 'rgba(255,255,255,0.85)' : tpl.accentPrimary;
  ctx.lineWidth = isBrand ? 6 : 8;
  roundRectPath(ctx, qrBoxX, qrTopY, qrBoxSize, qrBoxSize, 42);
  ctx.stroke();

  // Render real QR onto temp canvas
  const qrCanvas = document.createElement('canvas');
  await QRCode.toCanvas(qrCanvas, shortUrl, {
    width: 630,
    margin: 2,
    color: { dark: '#0B1120', light: '#FFFFFF' },
    errorCorrectionLevel: 'H',
  });
  ctx.drawImage(qrCanvas, (CANVAS_W - 630) / 2, qrTopY + 45, 630, 630);

  // Instruction & NFC footer strip
  const instY = qrTopY + qrBoxSize + 92;
  ctx.fillStyle = isBrand || isDark ? '#FFFFFF' : '#0F172A';
  ctx.font = '700 38px "Plus Jakarta Sans", Arial, sans-serif';
  ctx.fillText(options.instruction.slice(0, 42), CANVAS_W / 2, instY);

  if (tpl.showStars && options.subtitle) {
    ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.85)' : isDark ? '#94A3B8' : '#64748B';
    ctx.font = '500 30px "DM Sans", Arial, sans-serif';
    ctx.fillText(options.subtitle.slice(0, 52), CANVAS_W / 2, instY + 62);
  }

  // Serial footer
  const footerY = CANVAS_H - 110;
  if (options.showSerialFooter) {
    ctx.fillStyle = isBrand ? 'rgba(255,255,255,0.72)' : isDark ? '#64748B' : '#94A3B8';
    ctx.font = '500 24px "JetBrains Mono", monospace';
    const nfcTag = options.showNfcIcon ? 'NFC + QR  ·  ' : '';
    ctx.fillText(`${nfcTag}${plaque.serialCode}  ·  /qr/${plaque.slug}`, CANVAS_W / 2, footerY);
  }

  return canvas.toDataURL('image/png');
}
