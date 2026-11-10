import React from 'react';

export function BrandMark({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#131F38" stroke="#2563EB" strokeOpacity="0.45" strokeWidth="1.5" />
      <rect x="9" y="9" width="22" height="22" rx="5" fill="#1D4ED8" fillOpacity="0.18" stroke="#3B82F6" strokeWidth="1.5" />
      <path d="M14 14L26 26M26 14L14 26" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3" fill="#93C5FD" />
    </svg>
  );
}

export function BatchKpiArtwork() {
  return (
    <svg viewBox="0 0 56 56" fill="none" className="w-12 h-12 shrink-0" aria-hidden="true">
      <rect x="14" y="8" width="32" height="32" rx="6" transform="rotate(10 14 8)" fill="#1E3A8A" stroke="#3B82F6" strokeOpacity="0.5" />
      <rect x="10" y="12" width="32" height="32" rx="6" transform="rotate(4 10 12)" fill="#2563EB" fillOpacity="0.85" stroke="#60A5FA" strokeOpacity="0.5" />
      <rect x="8" y="14" width="32" height="32" rx="6" fill="#F8FAFC" />
      <rect x="14" y="20" width="7" height="7" rx="1.5" stroke="#0F172A" strokeWidth="2" />
      <rect x="27" y="20" width="7" height="7" rx="1.5" stroke="#0F172A" strokeWidth="2" />
      <rect x="14" y="33" width="7" height="7" rx="1.5" stroke="#0F172A" strokeWidth="2" />
      <path d="M27 33H30V36H27V33ZM31 36H34V40H31V36Z" fill="#0F172A" />
      <path d="M44 21C46.5 23.5 46.5 27.5 44 30" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
      <path d="M47.5 18.5C51.5 22.5 51.5 29 47.5 33" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PlaqueKpiArtwork() {
  return (
    <svg viewBox="0 0 56 56" fill="none" className="w-12 h-12 shrink-0" aria-hidden="true">
      <rect x="10" y="12" width="36" height="28" rx="6" fill="#1E293B" stroke="#3B82F6" strokeOpacity="0.45" />
      <path d="M10 19H25L29 23H46V35C46 38.3137 43.3137 41 40 41H16C12.6863 41 10 38.3137 10 35V19Z" fill="#38BDF8" fillOpacity="0.22" stroke="#38BDF8" strokeWidth="1.5" />
      <rect x="18" y="27" width="20" height="3" rx="1.5" fill="#93C5FD" />
      <rect x="18" y="33" width="12" height="2.5" rx="1.25" fill="#60A5FA" fillOpacity="0.7" />
    </svg>
  );
}

export function DestinationKpiArtwork() {
  return (
    <svg viewBox="0 0 56 56" fill="none" className="w-12 h-12 shrink-0" aria-hidden="true">
      <path d="M10 37L20 32L36 36L46 31V44L36 49L20 45L10 50V37Z" fill="#0EA5E9" fillOpacity="0.2" stroke="#38BDF8" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M28 10C22.4772 10 18 14.4772 18 20C18 27.5 28 38 28 38C28 38 38 27.5 38 20C38 14.4772 33.5228 10 28 10Z" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.6" />
      <circle cx="28" cy="20" r="4" fill="#F8FAFC" />
    </svg>
  );
}

export function ReadsKpiArtwork() {
  return (
    <svg viewBox="0 0 56 56" fill="none" className="w-12 h-12 shrink-0" aria-hidden="true">
      <rect x="12" y="10" width="32" height="10" rx="3" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.4" />
      <rect x="12" y="23" width="32" height="10" rx="3" fill="#1D4ED8" stroke="#60A5FA" strokeWidth="1.4" />
      <rect x="12" y="36" width="32" height="10" rx="3" fill="#2563EB" stroke="#93C5FD" strokeWidth="1.4" />
      <circle cx="18" cy="15" r="1.5" fill="#93C5FD" />
      <circle cx="18" cy="28" r="1.5" fill="#93C5FD" />
      <circle cx="18" cy="41" r="1.5" fill="#93C5FD" />
      <rect x="24" y="14" width="14" height="2" rx="1" fill="#BFDBFE" />
      <rect x="24" y="27" width="14" height="2" rx="1" fill="#BFDBFE" />
      <rect x="24" y="40" width="14" height="2" rx="1" fill="#BFDBFE" />
    </svg>
  );
}
