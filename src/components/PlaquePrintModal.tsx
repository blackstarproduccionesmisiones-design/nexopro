import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  X,
} from 'lucide-react';
import {
  inferTemplateFromPlaque,
  PRINT_TEMPLATES,
  renderPlaqueToPngDataUrl,
  type PlaquePrintOptions,
  type PlaqueSurfaceTheme,
  type PrintTemplateId,
} from '../lib/plaqueTemplates';
import type { Plaque } from '../types';
import { BrandVectorLogo, PlaqueArtwork } from './PlaqueArtwork';

interface PlaquePrintModalProps {
  title: string;
  plaques: Plaque[];
  onClose: () => void;
}

export function PlaquePrintModal({
  title,
  plaques,
  onClose,
}: PlaquePrintModalProps) {
  const firstPlaque = plaques[0];
  const initialTemplate = firstPlaque ? inferTemplateFromPlaque(firstPlaque) : 'google_reviews';
  const initialTplCfg = PRINT_TEMPLATES[initialTemplate];

  const [activeIdx, setActiveIdx] = useState(0);
  const [templateId, setTemplateId] = useState<PrintTemplateId>(initialTemplate);
  const [surfaceTheme, setSurfaceTheme] = useState<PlaqueSurfaceTheme>('light');
  const [businessName, setBusinessName] = useState(
    firstPlaque?.clientName || 'Tu Negocio'
  );
  const [headline, setHeadline] = useState(initialTplCfg.defaultHeadline);
  const [subtitle, setSubtitle] = useState(initialTplCfg.defaultSubtitle);
  const [instruction, setInstruction] = useState(initialTplCfg.defaultInstruction);
  const [showNfcIcon, setShowNfcIcon] = useState(true);
  const [showSerialFooter, setShowSerialFooter] = useState(true);
  const [printLayout, setPrintLayout] = useState<'10x15' | 'a4-grid'>('10x15');

  const [qrMap, setQrMap] = useState<Record<string, string>>({});
  const [downloadingPng, setDownloadingPng] = useState(false);

  const currentPlaque = plaques[activeIdx] || firstPlaque;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    let active = true;
    const generateAll = async () => {
      const next: Record<string, string> = {};
      for (const p of plaques) {
        const shortUrl = `${origin}/qr/${p.slug}`;
        try {
          next[p.id] = await QRCode.toDataURL(shortUrl, {
            width: 520,
            margin: 2,
            color: { dark: '#0B1120', light: '#FFFFFF' },
            errorCorrectionLevel: 'H',
          });
        } catch {
          next[p.id] = '';
        }
      }
      if (active) setQrMap(next);
    };
    generateAll();
    return () => {
      active = false;
    };
  }, [plaques, origin]);

  const handleSelectTemplate = (nextId: PrintTemplateId) => {
    setTemplateId(nextId);
    const cfg = PRINT_TEMPLATES[nextId];
    setHeadline(cfg.defaultHeadline);
    setSubtitle(cfg.defaultSubtitle);
    setInstruction(cfg.defaultInstruction);
    if (nextId === 'tiktok') setSurfaceTheme('dark');
    else if (nextId === 'google_reviews') setSurfaceTheme('light');
  };

  const options: PlaquePrintOptions = {
    templateId,
    surfaceTheme,
    businessName,
    headline,
    subtitle,
    instruction,
    showNfcIcon,
    showSerialFooter,
  };

  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadCurrentPng = async () => {
    if (!currentPlaque) return;
    setDownloadingPng(true);
    try {
      const dataUrl = await renderPlaqueToPngDataUrl(
        currentPlaque,
        `${origin}/qr/${currentPlaque.slug}`,
        options
      );
      triggerDownload(dataUrl, `${currentPlaque.slug}-${templateId}-10x15-300dpi.png`);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDownloadBatchPngs = async () => {
    setDownloadingPng(true);
    try {
      for (const p of plaques) {
        const dataUrl = await renderPlaqueToPngDataUrl(
          p,
          `${origin}/qr/${p.slug}`,
          options
        );
        triggerDownload(dataUrl, `${p.slug}-${templateId}-10x15-300dpi.png`);
        await new Promise((r) => setTimeout(r, 180));
      }
    } finally {
      setDownloadingPng(false);
    }
  };

  const handlePrintPdf = () => {
    window.print();
  };

  if (!currentPlaque) return null;

  return (
    <>
      <style>{`@media print { @page { size: ${
        printLayout === 'a4-grid' ? 'A4 portrait' : '100mm 150mm'
      }; margin: 0; } }`}</style>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto no-print">
        <div className="w-full max-w-5xl bg-[#0E1628] border border-slate-800 rounded-2xl overflow-hidden my-auto">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-mono text-blue-400">
                Formato imprenta 10 × 15 cm (100 × 150 mm · 300 DPI)
              </p>
              <h2 className="font-display text-lg font-bold text-white">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar estudio de impresión"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Design & Template Controls */}
            <div className="lg:col-span-7 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2.5">
                  1. Elige la plantilla de marca o red social
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {(Object.keys(PRINT_TEMPLATES) as PrintTemplateId[]).map((id) => {
                    const tpl = PRINT_TEMPLATES[id];
                    const selected = templateId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleSelectTemplate(id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          selected
                            ? 'bg-blue-600/15 border-blue-500 text-white'
                            : 'bg-[#080D1A] border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <BrandVectorLogo templateId={id} size={22} />
                        <span className="text-xs font-medium truncate">{tpl.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nombre del comercio / Marca
                  </label>
                  <input
                    type="text"
                    maxLength={40}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Acabado de la placa
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#080D1A] border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setSurfaceTheme('light')}
                      className={`py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                        surfaceTheme === 'light'
                          ? 'bg-white text-slate-900'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Fondo Blanco
                    </button>
                    <button
                      type="button"
                      onClick={() => setSurfaceTheme('dark')}
                      className={`py-1.5 rounded-md text-xs font-medium cursor-pointer ${
                        surfaceTheme === 'dark'
                          ? 'bg-slate-700 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Negro Mate
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Título principal
                  </label>
                  <input
                    type="text"
                    maxLength={36}
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Subtítulo / @Usuario
                  </label>
                  <input
                    type="text"
                    maxLength={52}
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="@tucomercio"
                    className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Indicación inferior
                </label>
                <input
                  type="text"
                  maxLength={46}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  className="w-full bg-[#080D1A] border border-slate-800 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-1 text-xs text-slate-300">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNfcIcon}
                    onChange={(e) => setShowNfcIcon(e.target.checked)}
                    className="rounded border-slate-700 bg-[#080D1A] text-blue-600"
                  />
                  <span>Mostrar ícono NFC</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSerialFooter}
                    onChange={(e) => setShowSerialFooter(e.target.checked)}
                    className="rounded border-slate-700 bg-[#080D1A] text-blue-600"
                  />
                  <span>Incluir serial y ruta corta al pie</span>
                </label>
              </div>

              {/* Print / Export Controls */}
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-400">
                    Formato al imprimir / guardar PDF:
                  </span>
                  <div className="flex items-center gap-1 p-1 bg-[#080D1A] border border-slate-800 rounded-lg self-start">
                    <button
                      type="button"
                      onClick={() => setPrintLayout('10x15')}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                        printLayout === '10x15'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      10×15 cm (1 por pág.)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrintLayout('a4-grid')}
                      className={`px-3 py-1 rounded text-xs font-medium cursor-pointer ${
                        printLayout === 'a4-grid'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      A4 (2 placas de 10×15)
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrintPdf}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>
                      Imprimir / PDF ({plaques.length}{' '}
                      {plaques.length === 1 ? 'placa' : 'placas'})
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={downloadingPng}
                    onClick={handleDownloadCurrentPng}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>{downloadingPng ? 'Generando...' : 'PNG 300 DPI (actual)'}</span>
                  </button>

                  {plaques.length > 1 && (
                    <button
                      type="button"
                      disabled={downloadingPng}
                      onClick={handleDownloadBatchPngs}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar las {plaques.length} en PNG</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Live 10 x 15 cm Preview */}
            <div className="lg:col-span-5 flex flex-col items-center">
              <div className="w-full max-w-[300px] rounded-xl overflow-hidden border border-slate-700/80 shadow-2xl">
                <PlaqueArtwork
                  plaque={currentPlaque}
                  qrDataUrl={qrMap[currentPlaque.id] || ''}
                  options={options}
                />
              </div>

              <div className="mt-4 flex items-center justify-between w-full max-w-[300px] text-xs text-slate-400">
                <span className="font-mono">100 × 150 mm</span>
                {plaques.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={activeIdx === 0}
                      onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-mono tabular-nums text-slate-200">
                      {activeIdx + 1} / {plaques.length}
                    </span>
                    <button
                      type="button"
                      disabled={activeIdx === plaques.length - 1}
                      onClick={() => setActiveIdx((i) => Math.min(plaques.length - 1, i + 1))}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className="font-mono text-slate-500">{currentPlaque.serialCode}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated 10x15cm Print Portal (visible only during @media print) */}
      {createPortal(
        <div
          id="print-sheet-root"
          className={printLayout === 'a4-grid' ? 'print-mode-a4-grid' : 'print-mode-10x15'}
        >
          {plaques.map((p) => (
            <div key={p.id} className="print-plaque-page">
              <PlaqueArtwork
                plaque={p}
                qrDataUrl={qrMap[p.id] || ''}
                options={options}
                className="w-full h-full"
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
