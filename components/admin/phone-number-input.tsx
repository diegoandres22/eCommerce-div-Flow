// File: components/admin/phone-number-input.tsx
'use client';

import { useMemo, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  COUNTRIES,
  getCountryByCode,
  splitWhatsappNumber,
  type Country,
} from '@/lib/countries';

// Selector de teléfono con país (bandera + código de marcado automático).
// El valor que entra/sale sigue siendo un string "solo dígitos" (código de
// país + número local pegados, ej. "573001234567") -- el mismo formato que
// ya exige `configuracionTiendaSchema` y `lib/whatsapp.ts` -- así que no hace
// falta tocar el validador ni la API existente, solo la experiencia de carga.
export function PhoneNumberInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (fullDigits: string) => void;
}) {
  // Se inicializa una sola vez a partir del valor guardado (mismo patrón que
  // ProductColorEditor): el componente remonta cada vez que cambia el
  // registro que edita, así que no hace falta resincronizar en cada render.
  const [initial] = useState(() => splitWhatsappNumber(value));
  const [countryCode, setCountryCode] = useState(initial.country.code);
  const [localNumber, setLocalNumber] = useState(initial.localNumber);

  const country = useMemo<Country>(
    () => getCountryByCode(countryCode) ?? initial.country,
    [countryCode, initial.country]
  );

  const emit = (nextCountry: Country, nextLocal: string) => {
    onChange(`${nextCountry.dialCode}${nextLocal}`);
  };

  const handleCountryChange = (code: string) => {
    const nextCountry = getCountryByCode(code) ?? country;
    setCountryCode(nextCountry.code);
    emit(nextCountry, localNumber);
  };

  const handleLocalNumberChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setLocalNumber(digits);
    emit(country, digits);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      {/* Detalle premium: bandera grande del país seleccionado a un costado. */}
      <div className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border bg-muted/40 px-4 py-3 sm:w-24">
        <span className="text-4xl leading-none" aria-hidden>
          {country.flag}
        </span>
        <span className="text-center text-[11px] font-medium leading-tight text-muted-foreground">
          {country.name}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <Select value={country.code} onValueChange={handleCountryChange}>
          <SelectTrigger className="sm:w-40">
            <SelectValue>
              <span className="flex items-center gap-2">
                <span aria-hidden>{country.flag}</span>+{country.dialCode}
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map(c => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span aria-hidden>{c.flag}</span>
                  {c.name}
                  <span className="text-muted-foreground">+{c.dialCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          value={localNumber}
          onChange={e => handleLocalNumberChange(e.target.value)}
          placeholder="3001234567"
          inputMode="numeric"
          className="flex-1"
        />
      </div>
    </div>
  );
}
