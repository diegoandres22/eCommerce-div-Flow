// File: lib/countries.ts
// Lista curada de países (foco Hispanoamérica + mercados frecuentes) para el
// selector de WhatsApp del admin. Sin dependencias externas: la bandera es un
// emoji Unicode (se renderiza nativamente en cualquier SO/navegador moderno,
// sin descargar íconos ni afectar el bundle).
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  dialCode: string; // sin "+"
  flag: string; // emoji
}

export const COUNTRIES: Country[] = [
  { code: 'AR', name: 'Argentina', dialCode: '54', flag: '🇦🇷' },
  { code: 'BO', name: 'Bolivia', dialCode: '591', flag: '🇧🇴' },
  { code: 'BR', name: 'Brasil', dialCode: '55', flag: '🇧🇷' },
  { code: 'CA', name: 'Canadá', dialCode: '1', flag: '🇨🇦' },
  { code: 'CL', name: 'Chile', dialCode: '56', flag: '🇨🇱' },
  { code: 'CO', name: 'Colombia', dialCode: '57', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', dialCode: '506', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', dialCode: '53', flag: '🇨🇺' },
  { code: 'EC', name: 'Ecuador', dialCode: '593', flag: '🇪🇨' },
  { code: 'SV', name: 'El Salvador', dialCode: '503', flag: '🇸🇻' },
  { code: 'ES', name: 'España', dialCode: '34', flag: '🇪🇸' },
  { code: 'US', name: 'Estados Unidos', dialCode: '1', flag: '🇺🇸' },
  { code: 'GT', name: 'Guatemala', dialCode: '502', flag: '🇬🇹' },
  { code: 'HN', name: 'Honduras', dialCode: '504', flag: '🇭🇳' },
  { code: 'MX', name: 'México', dialCode: '52', flag: '🇲🇽' },
  { code: 'NI', name: 'Nicaragua', dialCode: '505', flag: '🇳🇮' },
  { code: 'PA', name: 'Panamá', dialCode: '507', flag: '🇵🇦' },
  { code: 'PY', name: 'Paraguay', dialCode: '595', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', dialCode: '51', flag: '🇵🇪' },
  { code: 'PR', name: 'Puerto Rico', dialCode: '1', flag: '🇵🇷' },
  { code: 'DO', name: 'República Dominicana', dialCode: '1', flag: '🇩🇴' },
  { code: 'UY', name: 'Uruguay', dialCode: '598', flag: '🇺🇾' },
  { code: 'VE', name: 'Venezuela', dialCode: '58', flag: '🇻🇪' },
];

export const DEFAULT_COUNTRY_CODE = 'CO';

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find(c => c.code === code);
}

// A partir de un número guardado en formato "solo dígitos, código + local"
// (ej. "573001234567"), intenta detectar el país probando el dialCode más
// largo primero (para no confundir "1" de EE.UU./Canadá/Rep. Dominicana con
// prefijos de 3 dígitos que también empiezan distinto). Si no matchea
// ninguno, se asume el país por defecto y todo el número como parte local.
export function splitWhatsappNumber(raw: string): {
  country: Country;
  localNumber: string;
} {
  const digits = raw.replace(/\D/g, '');
  const byDialCodeDesc = [...COUNTRIES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of byDialCodeDesc) {
    if (digits.startsWith(country.dialCode) && digits.length > country.dialCode.length) {
      return { country, localNumber: digits.slice(country.dialCode.length) };
    }
  }

  const fallback = getCountryByCode(DEFAULT_COUNTRY_CODE) ?? COUNTRIES[0];
  return { country: fallback as Country, localNumber: digits };
}
