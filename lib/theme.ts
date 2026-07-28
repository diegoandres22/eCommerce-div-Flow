// File: lib/theme.ts
import type { StoreConfig } from '@/lib/store-config';

// Convierte un color hexadecimal ("#1D4ED8") al formato "H S% L%" que ya
// usan las variables CSS de styles/globals.css (ej. "222.2 47.4% 11.2%"),
// para que tailwind.config.ts (que envuelve todo en hsl(var(--x))) siga
// funcionando sin cambios.
function hexToHsl(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

// Luminancia perceptual YIQ (fórmula estándar) -- true si el color es lo
// bastante claro como para necesitar un texto oscuro encima (y, al revés,
// como para NO contrastar sobre un fondo claro).
function isLightColor(hex: string): boolean {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150;
}

// Decide si el texto sobre ese color debe ser casi-negro o casi-blanco.
// Evita tener que pedirle al cliente un color de texto combinado para cada
// color de marca -- se calcula solo.
function readableForeground(hex: string): string {
  return isLightColor(hex) ? '0 0% 9%' : '0 0% 98%';
}

// Variante de --primary pensada para texto/ícono/borde usado DIRECTO sobre
// el fondo de página o de card (ej. un link "Ver todo", un ícono suelto) --
// no para un botón bg-primary, donde el color de marca sí debe verse igual
// en los dos temas (eso lo sigue resolviendo --primary tal cual, sin tocar).
// --primary se mantiene fijo entre temas a propósito (ver generateThemeStyleTag
// más abajo), pero eso significa que si el color de marca es oscuro (como
// suele pasar), un texto/ícono con ese color queda invisible en dark mode --
// literalmente oscuro sobre oscuro. Acá se resuelve UNA vez a nivel de
// token, no parchando cada componente: si el color de marca no va a
// contrastar contra el fondo de este tema puntual, se usa var(--foreground)
// en su lugar (que sí cambia con el tema por diseño) en vez de intentar
// aclarar/oscurecer artificialmente un hue arbitrario.
function accentForBackground(hex: string, backgroundIsDark: boolean): string {
  const readable = backgroundIsDark ? isLightColor(hex) : !isLightColor(hex);
  return readable ? hexToHsl(hex) : 'var(--foreground)';
}

// Genera el bloque de CSS que sobreescribe los colores de marca (primario,
// secundario, acento) definidos por defecto en styles/globals.css, a partir
// de STORE_CONFIG. Se inyecta como <style> en el <head> de app/layout.tsx:
// misma especificidad que las reglas de globals.css, pero declarado después
// en el documento, así que gana por cascada sin necesitar !important.
//
// El mismo color se aplica en :root y en .dark a propósito (ver comentario
// en store-config.ts): el color de marca no cambia con el tema, solo el
// fondo de la página -- y eso ya lo resuelve el toggle de tema existente,
// sin intervención de este archivo.
export function generateThemeStyleTag(config: StoreConfig): string {
  const pairs: [string, string][] = [
    ['primario', config.colorPrimario],
    ['secundario', config.colorSecundario],
    ['acento', config.colorAcento],
  ];
  const cssVarByName: Record<string, string> = {
    primario: '--primary',
    secundario: '--secondary',
    acento: '--accent',
  };

  const declarationsFor = (backgroundIsDark: boolean) =>
    pairs
      .map(([name, hex]) => {
        const cssVar = cssVarByName[name];
        return `${cssVar}: ${hexToHsl(hex)}; ${cssVar}-foreground: ${readableForeground(hex)};`;
      })
      .join(' ') +
    // Solo hace falta la variante "accent" para el color primario -- es el
    // único que se usa como texto/ícono suelto en la interfaz (secundario y
    // acento son fondos de UI, no colores de marca para texto).
    ` --primary-accent: ${accentForBackground(config.colorPrimario, backgroundIsDark)};`;

  return `:root { ${declarationsFor(false)} } .dark { ${declarationsFor(true)} }`;
}
