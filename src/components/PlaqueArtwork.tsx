import React from 'react';
import { Nfc } from 'lucide-react';
import {
  PRINT_TEMPLATES,
  type PlaquePrintOptions,
  type PrintTemplateId,
} from '../lib/plaqueTemplates';
import type { Plaque } from '../types';

export function BrandVectorLogo({
  templateId,
  size = 44,
}: {
  templateId: PrintTemplateId;
  size?: number;
}) {
  if (templateId === 'google_reviews') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    );
  }

  if (templateId === 'instagram') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <defs>
          <linearGradient id="igLogoGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#515BD4" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#igLogoGrad)" />
        <rect x="10" y="10" width="28" height="28" rx="8" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <circle cx="24" cy="24" r="6.5" fill="none" stroke="#FFFFFF" strokeWidth="3" />
        <circle cx="33" cy="15" r="2" fill="#FFFFFF" />
      </svg>
    );
  }

  if (templateId === 'facebook') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#1877F2" />
        <path
          fill="#FFFFFF"
          d="M29.8 25.5l.8-5.2h-5v-3.4c0-1.4.7-2.8 2.9-2.8h2.3V9.6s-2.1-.4-4.1-.4c-4.1 0-6.8 2.5-6.8 7v4.1h-4.6v5.2h4.6V39h5.7V25.5h4.2z"
        />
      </svg>
    );
  }

  if (templateId === 'tiktok') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#090D16" stroke="#1E293B" strokeWidth="1.5" />
        <path
          fill="#25F4EE"
          d="M29.5 11c.9 2.6 2.9 4.5 5.5 5.1v4.2c-2-.1-3.9-.7-5.5-1.7v8.1c0 4.6-3.7 8.3-8.3 8.3s-8.3-3.7-8.3-8.3 3.7-8.3 8.3-8.3c.5 0 1 .1 1.5.2v4.3c-.5-.2-1-.3-1.5-.3-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V11h4.3z"
          transform="translate(-1.2 -1)"
        />
        <path
          fill="#FE2C55"
          d="M29.5 11c.9 2.6 2.9 4.5 5.5 5.1v4.2c-2-.1-3.9-.7-5.5-1.7v8.1c0 4.6-3.7 8.3-8.3 8.3s-8.3-3.7-8.3-8.3 3.7-8.3 8.3-8.3c.5 0 1 .1 1.5.2v4.3c-.5-.2-1-.3-1.5-.3-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V11h4.3z"
          transform="translate(1.2 1)"
        />
        <path
          fill="#FFFFFF"
          d="M29.5 11c.9 2.6 2.9 4.5 5.5 5.1v4.2c-2-.1-3.9-.7-5.5-1.7v8.1c0 4.6-3.7 8.3-8.3 8.3s-8.3-3.7-8.3-8.3 3.7-8.3 8.3-8.3c.5 0 1 .1 1.5.2v4.3c-.5-.2-1-.3-1.5-.3-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4V11h4.3z"
        />
      </svg>
    );
  }

  if (templateId === 'whatsapp_direct') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="22" fill="#25D366" />
        <path
          fill="#FFFFFF"
          fillRule="evenodd"
          d="M24 11.5c-6.9 0-12.5 5.5-12.5 12.3 0 2.3.6 4.4 1.8 6.3L11.5 36.5l6.6-1.7c1.8 1 3.8 1.5 5.9 1.5 6.9 0 12.5-5.5 12.5-12.3S30.9 11.5 24 11.5zm6.5 17.4c-.3.8-1.6 1.5-2.3 1.6-.6.1-1.4.2-2.2-.1-.5-.2-1.2-.4-2.1-.8-3.6-1.5-5.9-5.1-6.1-5.4-.2-.3-1.5-1.9-1.5-3.6s.9-2.5 1.3-2.9c.3-.4.7-.5 1-.5h.7c.2 0 .5-.1.8.6.3.7 1 2.5 1.1 2.7.1.2.1.4 0 .6-.1.2-.2.4-.4.6-.2.2-.4.4-.5.6-.2.2-.4.4-.2.7.2.4 1 1.6 2.1 2.6 1.4 1.3 2.6 1.7 3 1.9.4.2.6.1.8-.1.2-.2 1-1.1 1.2-1.5.3-.4.5-.3.8-.2.4.1 2.3 1.1 2.7 1.3.4.2.7.3.8.5.1.2.1 1-.2 1.8z"
        />
      </svg>
    );
  }

  if (templateId === 'qr_menu') {
    return (
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="2" y="2" width="44" height="44" rx="12" fill="#D97706" />
        <path
          stroke="#FFFFFF"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          d="M17 12v10m-3-10v6a3 3 0 0 0 6 0v-6m-3 10v14M31 12v24m0-24c3 2 4 6 4 10h-4"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <rect x="2" y="2" width="44" height="44" rx="12" fill="#2563EB" />
      <path
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        d="M19 18a8 8 0 0 1 0 12m5-16a13 13 0 0 1 0 20m5-24a18 18 0 0 1 0 28"
      />
    </svg>
  );
}

interface PlaqueArtworkProps {
  plaque: Plaque;
  qrDataUrl: string;
  options: PlaquePrintOptions;
  className?: string;
}

export function PlaqueArtwork({
  plaque,
  qrDataUrl,
  options,
  className = '',
}: PlaqueArtworkProps) {
  const tpl = PRINT_TEMPLATES[options.templateId];
  const isDark = options.surfaceTheme === 'dark';

  const topBarStyle = (): React.CSSProperties => {
    if (options.templateId === 'instagram') {
      return { background: 'linear-gradient(90deg, #F58529 0%, #DD2A7B 50%, #515BD4 100%)' };
    }
    if (options.templateId === 'whatsapp_direct') {
      return { background: 'linear-gradient(90deg, #25D366 0%, #128C7E 100%)' };
    }
    if (options.templateId === 'google_reviews') {
      return {
        background:
          'linear-gradient(90deg, #4285F4 0%, #4285F4 25%, #EA4335 25%, #EA4335 50%, #FBBC05 50%, #FBBC05 75%, #34A853 75%, #34A853 100%)',
      };
    }
    if (options.templateId === 'tiktok') {
      return {
        background: 'linear-gradient(90deg, #25F4EE 0%, #25F4EE 50%, #FE2C55 50%, #FE2C55 100%)',
      };
    }
    return { backgroundColor: tpl.accentPrimary };
  };

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden select-none ${
        isDark ? 'bg-[#0B1120] text-white' : 'bg-white text-slate-900'
      } ${className}`}
      style={{ aspectRatio: '2 / 3' }}
    >
      {/* Top brand color bar */}
      <div className="h-[2.2%] w-full shrink-0" style={topBarStyle()} />

      {/* Inner framed layout */}
      <div
        className={`flex-1 m-[3.6%] rounded-[4%] border flex flex-col items-center justify-between px-[6%] py-[5.5%] text-center ${
          isDark ? 'border-slate-700/70' : 'border-slate-200'
        }`}
      >
        {/* Top brand badge + Business name + CTA */}
        <div className="flex flex-col items-center space-y-1.5 w-full">
          <BrandVectorLogo templateId={options.templateId} size={42} />

          <p
            className={`text-[10px] font-bold tracking-[0.14em] uppercase truncate max-w-full pt-1 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {options.businessName || plaque.clientName || 'NEXO PRO'}
          </p>

          <h3 className="font-display text-lg sm:text-xl font-extrabold leading-tight tracking-tight max-w-full">
            {options.headline}
          </h3>

          {tpl.showStars ? (
            <div className="text-amber-400 text-lg tracking-widest leading-none pt-0.5" aria-label="5 estrellas">
              ★★★★★
            </div>
          ) : (
            <p
              className={`text-[11px] font-medium leading-snug max-w-[90%] ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {options.subtitle}
            </p>
          )}
        </div>

        {/* Central QR frame */}
        <div
          className="bg-white rounded-2xl p-[4.5%] w-[68%] aspect-square flex items-center justify-center shadow-xs"
          style={{ border: `3px solid ${tpl.accentPrimary}` }}
        >
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR ${plaque.slug}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 rounded-lg animate-pulse" />
          )}
        </div>

        {/* Instruction + Serial footer */}
        <div className="w-full space-y-1.5">
          <div className="flex items-center justify-center gap-1.5">
            {options.showNfcIcon && (
              <Nfc className="w-3.5 h-3.5 shrink-0" style={{ color: tpl.accentPrimary }} />
            )}
            <p className="text-xs font-bold leading-tight">{options.instruction}</p>
          </div>

          {tpl.showStars && options.subtitle && (
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {options.subtitle}
            </p>
          )}

          {options.showSerialFooter && (
            <p
              className={`text-[9px] font-mono tracking-tight pt-1 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              {plaque.serialCode} · /qr/{plaque.slug}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
