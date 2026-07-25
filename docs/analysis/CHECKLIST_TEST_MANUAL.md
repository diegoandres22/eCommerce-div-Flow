# Checklist de prueba manual — últimas 20 funcionalidades

Marca cada casilla tras probarla. "Resultado esperado" es lo que debe pasar; si ves algo distinto, anota la diferencia para reportarla.

## Tienda pública

- [ ] **1. Login rediseñado** — Entra a `/auth/signin`. **Esperado:** el logo y el nombre de la tienda aparecen arriba, como título, fuera de la tarjeta del formulario; el texto dice "...con la cuenta" (sin "de prueba").
- [ ] **2. Favoritos desde tarjeta/ficha** — En `/products`, haz clic en el corazón de cualquier producto (tarjeta y también dentro de la ficha de detalle). **Esperado:** el corazón se pinta de rojo al activarse y vuelve a blanco al desactivarse; persiste si recargas la página.
- [ ] **3. Drawer de favoritos** — Haz clic en el ícono de corazón del navbar. **Esperado:** se abre un panel lateral con los productos marcados; el botón de borrar (🗑) los quita de la lista.
- [ ] **4. Compartir producto** — Entra a la ficha de cualquier producto. **Esperado:** ves 3 botones/íconos (WhatsApp, Facebook, copiar enlace); al copiar enlace debe aparecer una confirmación breve.
- [ ] **5. Buscador predictivo** — Haz clic en la barra de búsqueda del navbar y escribe el nombre de un producto existente. **Esperado:** aparece un dropdown con resultados (imagen + nombre + precio) sin recargar la página, a medida que escribes.
- [ ] **6. "También te puede interesar"** — Al final de la ficha de un producto que tenga otros productos en su misma categoría. **Esperado:** aparece un carrusel con hasta 4 productos relacionados, sin incluir el que estás viendo.
- [ ] **7. Banner de anuncio** — Actívalo desde `/admin/settings` (texto + interruptor "mostrar banner"), luego visita la tienda pública. **Esperado:** aparece una barra delgada arriba del navbar con el texto configurado; si lo desactivas, desaparece.
- [ ] **8. Navbar en una sola línea** — Abre la tienda en escritorio y en móvil (o achica la ventana). **Esperado:** todos los íconos (categorías, favoritos, carrito, tema) quedan en una sola fila, sin saltar de línea, en cualquier ancho.
- [ ] **16. Filtro de precio + orden** — En `/products`, `/category/[slug]` o resultados de búsqueda. **Esperado:** puedes ordenar por "Más recientes / Menor precio / Mayor precio" y filtrar escribiendo un mín/máx de precio; el contador "N productos" se actualiza en vivo.
- [ ] **17. Carrito animado** — Agrega un producto al carrito desde cualquier tarjeta o ficha. **Esperado:** el ícono del carrito rebota y el badge rojo tiene un destello (ping) al momento de agregar.
- [ ] **18. Badges no se recortan** — Fíjate en los círculos rojos de contador sobre los íconos de carrito y favoritos (con al menos 1 producto en cada uno). **Esperado:** el círculo se ve completo, no cortado por la mitad ni tapado por otro elemento.
- [ ] **19. Imágenes con skeleton y fade-in** — Recarga cualquier página con imágenes (catálogo, ficha de producto, banner del home) con la conexión simulada lenta (DevTools → Network → Slow 3G) o simplemente observando la primera carga. **Esperado:** ves un efecto de "brillo" (shimmer) mientras carga cada imagen, luego aparece con una transición suave, sin saltos bruscos. Si alguna imagen no existe/falla, debe mostrar un ícono de "Sin imagen" en vez de un ícono roto del navegador.
- [ ] **20. Carrito sin animación falsa al recargar** — Agrega 2-3 productos al carrito, luego **recarga la página completa (F5)**. **Esperado:** el badge muestra el número correcto de una vez, SIN que el ícono rebote/parpadee al cargar (antes lo hacía incorrectamente).

## Panel de administración (`/admin`)

- [ ] **9. Branding dinámico en admin** — Entra a `/admin` en escritorio y en móvil. **Esperado:** el sidebar (y el header móvil) muestran el logo + nombre real de la tienda, no el texto genérico "Admin Panel".
- [ ] **10. Subida de imágenes a Supabase** — En `/admin/products` o `/admin/banners`, crea/edita un registro y sube una imagen desde tu dispositivo con el botón "Subir desde el dispositivo". **Esperado:** la imagen se sube, se previsualiza y se guarda con una URL de `supabase.co`; se ve correctamente en la tienda pública.
- [ ] **11. Ficha de producto enriquecida** — Abre cualquier producto activo. **Esperado:** ves precio formateado, selector de color (decorativo), íconos de confianza (asesoría/compra segura/entrega), un acordeón "Especificaciones técnicas completas" que se expande/colapsa, y los campos "Detalle" y "Valor de referencia".
- [ ] **12. Precios masivos** — Ve a `/admin/bulk-pricing`. Prueba las 3 opciones de alcance (categoría, selección manual, catálogo completo) con un ajuste pequeño (ej. +1%) sobre un solo producto de prueba. **Esperado:** el contador "Esto afectará a N producto(s)" se actualiza en vivo; al aplicar, ves un mensaje de éxito y el precio cambia en la tabla de `/admin/products`.
- [ ] **13. Admin productos: layout y tabla oculta** — En `/admin/products`, fíjate que el botón "+ Nuevo producto" y el buscador estén en la misma fila (botón izquierda, buscador derecha). Haz clic en "+ Nuevo producto". **Esperado:** la tabla de abajo desaparece mientras el formulario está abierto, y vuelve a aparecer al Guardar o Cancelar.
- [ ] **14. Admin categorías: tabla oculta** — Repite la prueba anterior en `/admin/categories`. **Esperado:** mismo comportamiento (tabla oculta durante edición/creación).
- [ ] **15. Tablas con estilo premium** — Observa las tablas de `/admin/products` y `/admin/categories`. **Esperado:** bordes definidos alrededor de toda la tabla y encabezado con fondo distinto (gris claro en modo claro, gris oscuro en modo oscuro) y texto en negrita.

## Transversal (probar en ambos temas)

- [ ] Cambia entre modo claro y oscuro (ícono de sol/luna) y repite al menos 3 de las pruebas de arriba. **Esperado:** ningún componente nuevo se ve "roto" (texto ilegible, fondos blancos en modo oscuro, etc.).

---

Si algo no se comporta como el "resultado esperado", anota: qué página, qué pasos seguiste, y qué viste en su lugar — con eso lo reproduzco y lo corrijo directamente.
