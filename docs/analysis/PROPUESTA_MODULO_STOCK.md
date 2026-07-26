# Propuesta técnica: módulo de control de existencias (stock)

Evaluación del modelo de datos y flujos actuales, con una propuesta de arquitectura para un módulo de stock activable/desactivable por interruptor global, con descuento por evento operativo y soporte de variantes de color. Documento de análisis para discutir el enfoque antes de construirlo — no incluye código de implementación todavía.

## 1. Punto de partida: qué cambia respecto al MVP actual

Hay que decirlo directo: el MVP actual excluye explícitamente "control complejo de inventario" (así está en CLAUDE.md), y hoy el modelo `Product` no tiene ningún campo de cantidad. Lo único parecido a stock es `isOutOfStock`, un booleano manual sin relación con ningún conteo real — el admin lo tilda a mano, no se calcula de nada. Este módulo reemplaza esa pieza por un sistema real, pero el conmutador global que pediste es justamente lo que permite que siga siendo opcional: con el interruptor apagado, la tienda se comporta exactamente igual que hoy (incluido `isOutOfStock` manual, que no desaparece, se vuelve el modo "sin stock" por defecto).

Segundo punto a aclarar antes de diseñar nada, porque cambia la arquitectura: pediste descuento "considerando color, marca y modelo", pero en el esquema actual `marca` y `modelo` son atributos fijos del producto (un producto tiene una sola marca y un solo modelo, no son opciones seleccionables) — no son ejes de variante, son datos descriptivos. El único atributo que sí varía dentro de un mismo producto es `colores`, y hoy ni siquiera es una tabla real: es un string serializado (`"Negro:#171717,Blanco:#FFFFFF"`, ver `lib/product-colors.ts`) sin identidad propia por color, solo para pintar swatches.

Esto quiere decir que "stock por variante" en la práctica es "stock por color" (cuando el producto tiene colores) o "stock por producto" (cuando no los tiene) — no hay combinación marca×modelo×color porque marca/modelo no varían. Si en algún momento necesitás que marca/modelo también sean seleccionables (ej. el mismo producto en dos modelos distintos), eso es un cambio de modelo de datos más grande y no lo asumo acá; sigo la estructura actual.

## 2. Conmutador global

Nuevo campo en el singleton existente:

```prisma
model ConfiguracionTienda {
  // ...campos actuales sin cambios
  controlStockActivo Boolean @default(false)
}
```

Mismo patrón que `showBanner`: un booleano en `ConfiguracionTienda`, editable desde una pantalla nueva `/admin/inventario` (o una sección dentro de `/admin/settings`), leído server-side en cada punto donde el stock importa. Con `controlStockActivo = false`:

- El carrito no valida cantidades contra stock.
- No se descuenta nada en ningún evento.
- `isOutOfStock` sigue siendo el checkbox manual de siempre (comportamiento 100% actual, cero regresión).
- El admin no ve campos de "stock" en `product-manager.tsx` — se ocultan, no se borran (mismo criterio que ya usás para `mostrarFavoritos`/`mostrarColoresDeProducto` en `STORE_CONFIG`).

Con `controlStockActivo = true`, entra en vigencia todo lo de las secciones siguientes.

## 3. Modelo de datos propuesto

```prisma
model Product {
  // ...campos actuales sin cambios
  stock        Int?  // null = "no aplica" (producto sin colores, se ignora si el switch está apagado)
  stockMinimo  Int   @default(3) // umbral para alertas de "stock bajo"
}

model ProductColorStock {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  colorName String  // debe matchear un nombre presente en Product.colores
  stock     Int     @default(0)

  @@unique([productId, colorName])
  @@map("product_color_stock")
}
```

Decisión de diseño: no reemplazo `colores` (sigue siendo el string serializado que ya pinta los swatches) — sumo una tabla aparte `ProductColorStock` que solo existe para productos que sí tienen colores definidos, con una fila por color, referenciada por nombre (no por índice, para no romperse si el admin reordena los colores). Si un producto no tiene colores, el stock vive directo en `Product.stock` y `ProductColorStock` no se usa para ese producto. Evita forzar una fila de "variante" artificial para productos sin variantes reales.

`isOutOfStock` deja de ser un campo editable a mano cuando el switch está activo: pasa a ser **derivado** (`stock <= 0`, o la suma de `ProductColorStock` si tiene colores). La columna en la base de datos se mantiene tal cual (no se borra, para no romper el modo apagado), pero cuando `controlStockActivo = true`, el checkbox de `product-manager.tsx` se deshabilita y muestra el valor calculado en vez de aceptar edición manual — inconsistente permitir las dos fuentes de verdad a la vez.

## 4. El evento de descuento: la decisión más importante de esta propuesta — **DECIDIDO: modo manual**

Acá está el punto que más te conviene decidir con cuidado, porque no hay pasarela de pago: el flujo actual termina en un link de WhatsApp, no en una confirmación de pago real. Eso significa que "el cliente hizo clic en Pedir por WhatsApp" **no es lo mismo** que "el cliente compró" — puede abrir WhatsApp y arrepentirse, no tener stock físico real la persona que atiende, negociar otra cantidad en el chat, etc. Descontar stock automáticamente en ese clic es fácil de construir pero le va a mentir al admin sobre cuánto tiene realmente disponible.

Confirmado: **descuento manual, al confirmar la venta desde `/admin/leads`**. Cada `Lead` ya registra qué se cotizó; agrego un botón "Marcar como vendido" en esa tabla que, al presionarlo, descuenta el stock de esos items específicos (transacción atómica vía `prisma.$transaction`, evita condición de carrera si dos ventas se confirman casi al mismo tiempo) y marca el lead como `confirmado`. El admin lo aprieta después de que la venta realmente se cierra por WhatsApp — es el único momento donde el sistema sabe con certeza que la venta pasó. También incluye "Revertir" (si se anula una venta ya confirmada, vuelve a sumar el stock).

Queda descartado el modo automático (descuento en el clic de "Pedir por WhatsApp") por lo ya explicado: sobre-descontaría con pedidos que nunca se concretan. No se construye ni siquiera como opción secundaria — un solo mecanismo, sin sub-toggle, menos superficie para mantener.

Para el modo manual necesito extender el modelo `Lead` con un campo `estado` (`pendiente` / `confirmado` / `cancelado`), hoy inexistente porque el modelo solo es un rastro de intención, sin estados.

## 5. Validaciones en el carrito (comprador)

Con el switch activo, sin importar el modo de descuento elegido:

- El selector de color en la ficha de producto (`components/product-color-swatches.tsx`) deshabilita (tachado, no clickeable) cualquier color con `stock = 0`, leyendo `ProductColorStock`.
- El input de cantidad en el carrito (`cart-checkout.tsx`) tiene un `max` igual al stock disponible del color elegido (o del producto, si no tiene colores) — el botón `+` se deshabilita al llegar al tope, igual que ya se deshabilita el `-` en `quantity <= 1`.
- Si el stock cambió entre que el producto se agregó al carrito y el momento de pedir por WhatsApp (dos pestañas abiertas, otro comprador se adelantó), se revalida server-side antes de generar el link — si algo ya no alcanza, se avisa en el propio carrito en vez de dejar pedir por WhatsApp una cantidad que ya no existe.
- Badge visual en `product-card.tsx` y en la ficha de detalle: "Últimas N unidades" cuando el stock está por debajo de `stockMinimo`, "Agotado" cuando llega a 0 (mismo lugar visual que hoy usa `isOutOfStock`, ahora alimentado por el valor derivado).

## 6. Experiencia del administrador

- **`product-manager.tsx`:** si el producto no tiene colores, un input numérico simple de stock. Si tiene colores, un editor por color (mismo patrón visual que `product-color-editor.tsx`: una fila por color con nombre + swatch, ahora con un input de cantidad al lado de cada uno) en vez de un solo número.
- **Alertas de stock bajo:** card nueva en el dashboard (`app/admin/page.tsx`), mismo patrón visual que "Enlaces rotos" (acento de advertencia), listando los productos con `stock <= stockMinimo`, ordenados de menor a mayor.
- **Ajustes manuales (entradas de mercadería, correcciones de conteo físico):** el mismo input de `product-manager.tsx` sirve para esto — no hace falta un flujo separado de "entrada de stock" en esta fase; es edición directa del número.
- **Kardex / historial de movimientos:** no lo incluyo en esta fase. Registrar cada alta/baja de stock con motivo (venta, ajuste manual, devolución) es útil pero es una tabla y una UI aparte — lo dejo como fase 3, a construir si hace falta trazabilidad real y no solo el número actual.
- **Herramienta de stock masivo:** mismo concepto que `/admin/bulk-pricing` (ajustar por categoría, selección manual o catálogo completo), pero para stock en vez de precio. Reutiliza gran parte de esa UI ya construida. Fase 2, no bloqueante para lanzar el módulo.

## 7. Fases de implementación

1. **Fase 1 (núcleo del módulo):** `controlStockActivo` en `ConfiguracionTienda`, `Product.stock`/`stockMinimo`, `ProductColorStock`, `isOutOfStock` derivado, validaciones de cantidad en carrito, badges dinámicos, modo manual de descuento vía botón "Marcar como vendido" en `/admin/leads` (incluye el campo `estado` en `Lead`).
2. **Fase 2:** sub-toggle de modo automático (descuento en el clic de WhatsApp), alertas de stock bajo en el dashboard, herramienta de ajuste masivo de stock.
3. **Fase 3, bajo demanda:** kardex/historial de movimientos con motivo, reversión granular de ventas confirmadas.

## 8. Reposición de stock: el modelo que usa MercadoLibre

En ML, "Stock disponible" es un campo que el vendedor edita directamente desde "Mis publicaciones" en cualquier momento, sin importar en qué valor esté. Cuando llega a 0, la publicación **no se pausa ni se despublica sola**: sigue indexada, visible, buscable — solo el botón de compra queda inhabilitado y aparece "Sin stock disponible". Para volver a vender, el vendedor no "reactiva" nada como paso aparte: simplemente edita el número de stock a la cantidad real que tiene, y la publicación vuelve a estar comprable de inmediato. Pausar una publicación es una acción manual totalmente independiente (el vendedor decide sacarla del catálogo por otro motivo) — stock en 0 y publicación pausada son dos cosas separadas que no se disparan una a la otra.

Esto es exactamente el mismo principio que ya propuse en la sección 3 con `isOutOfStock` derivado, y es la razón por la que lo diseñé así en vez de como un flag manual: si el estado "agotado" fuera un campo aparte que hay que destildar a mano, existiría el riesgo real de reponer el stock y olvidarse de destildarlo (el producto seguiría mostrando "Agotado" con stock > 0, o al revés). Al ser derivado 100% del número, reponer stock **es** reactivar — no hay un segundo paso, ni un switch que se pueda desincronizar del número real. Lo mismo aplica a `isActive`: sigue siendo un eje totalmente independiente del stock, tal como en ML.

Trasladado a este proyecto, "reponer stock" se resuelve en tres niveles, de más simple a más específico:

**a) Edición directa (el camino principal, igual que ML).** El mismo input numérico de `product-manager.tsx` que usás para cargar el stock inicial sirve para reponerlo — no hay un formulario ni un flujo distinto para "alta" vs "reposición". El admin ve el producto marcado "Agotado" en la tabla, entra a editar, cambia `stock` de `0` a `50`, guarda, y el producto ya es comprable. Para productos con colores, lo mismo mismo pero por fila de `ProductColorStock`.

**b) Acción rápida sobre la fila "Agotado" (para el caso más común: llegó mercadería).** En vez de obligar a abrir el modal completo de edición solo para sumar unidades, propongo un botón inline en la columna de stock de la tabla — un ícono "+" que abre un mini-input (`+ 20`, por ejemplo) directo sobre la fila, sin salir de la tabla. Mismo patrón de interacción que ya usás en `banner-manager.tsx` para el switch `isActive` (cambio optimista, sin navegar a otra pantalla). Reduce fricción justo en el momento en que el admin está reponiendo varios productos seguidos después de recibir un pedido de su proveedor.

**c) Reposición masiva (fase 2, ya prevista en la sección 6).** La herramienta de stock masivo estilo `/admin/bulk-pricing` no solo debería "fijar" un valor — para reponer mercadería tiene más sentido un modo "sumar N unidades" a la selección (por categoría, manual o catálogo completo), distinto de "fijar en N" que sirve para correcciones de conteo físico. Son dos operaciones semánticamente distintas (recibí una caja con 30 unidades más *vs.* conté físicamente y hay 12) y conviene que la UI las distinga en vez de forzar al admin a calcular la suma a mano.

Sin registro de movimientos (`StockMovement`/kardex) en ningún alcance de esta propuesta: la trazabilidad de por qué un producto tiene tal cantidad queda fuera de alcance por decisión explícita. Si más adelante hace falta auditar reposiciones/ajustes, se evalúa como un módulo aparte — no forma parte de esta implementación.

## 9. Resumen y próximo paso

Decisiones cerradas: descuento **manual** desde `/admin/leads` (sección 4), **sin** registro de movimientos (sección 8). Con esto ya no quedan puntos abiertos — el alcance completo de la Fase 1 es: `controlStockActivo` en `ConfiguracionTienda`, `Product.stock`/`stockMinimo`, `ProductColorStock`, `isOutOfStock` derivado, validaciones de cantidad en carrito, badges dinámicos, botón "Marcar como vendido"/"Revertir" en Leads (con `Lead.estado`), edición directa de stock y acción rápida "+N" en `product-manager.tsx`.

Puedo arrancar por la migración de Prisma (nuevos campos + `ProductColorStock` + `Lead.estado`) en cuanto me confirmes que sí.
