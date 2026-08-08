// File: lib/consent.ts
//
// Estado de consentimiento de cookies no esenciales (analytics, tracking).
// El proyecto ya usa @vercel/analytics y @vercel/speed-insights -- este
// helper existe para condicionar cualquier script de este tipo a que el
// visitante haya elegido "Aceptar" primero. No es específico de ningún
// cliente: se mantiene genérico para que sobreviva al clonado del proyecto.
export type ConsentChoice = 'accepted' | 'rejected';

const STORAGE_KEY = 'store-cookie-consent';

export function getStoredConsent(): ConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === 'accepted' || value === 'rejected' ? value : null;
}

export function storeConsent(choice: ConsentChoice) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, choice);
}

// Usar esto antes de inyectar cualquier script de analytics/tracking:
//   if (hasAnalyticsConsent()) { /* cargar acá, nunca antes */ }
export function hasAnalyticsConsent(): boolean {
  return getStoredConsent() === 'accepted';
}
