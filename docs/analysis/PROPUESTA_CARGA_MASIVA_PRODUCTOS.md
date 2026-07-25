# Propuesta técnica: carga masiva de productos

Evaluación del backend, esquema de datos y validadores actuales, con una propuesta de arquitectura para tres flujos: importación desde Excel/CSV local, sincronización desde Google Sheets, y manejo de imágenes en lote. Es un documento de análisis para discutir el enfoque antes de construirlo — no incluye código todavía.

## 1. Punto de partida: qué ya existe y qué restringe el diseño

El modelo `Product` (`prisma/schema.prisma`) no tiene SKU ni control de stock (por diseño, ver "Exclusiones actuales" del proyecto): los campos obligatorios son `name`, `price`, `categoryId`, `marca` y `modelo`; `description`, `subCategoryId` y `colores` son opcionales. `images` es un array de URLs de texto — no hay upload de binarios embebido en el modelo, las imágenes ya están subidas a Supabase Storage *antes* de que el producto se guarde.

`lib/validators.ts#productSchema` es el único lugar que define qué es un producto válido (precio > 0, categoría obligatoria, imágenes que sean URLs bien formadas, etc.) y ya lo usan tanto `app/api/admin/products/route.ts` como `[id]/route.ts`. Cualquier importación masiva debe pasar por este mismo schema fila por fila — no por uno paralelo — para que un producto cargado por Excel sea indistinguible de uno cargado a mano.

La categoría se referencia por `categoryId` (string, cuid), pero el admin que llena un Excel no conoce esos IDs — solo conoce el *nombre* de la categoría. Esto obliga a una resolución nombre → id antes de validar, con una decisión pendiente de qué hacer si el nombre no matchea ninguna categoría existente (se detalla en la sección 3).

No hay ninguna librería de parseo de Excel/CSV ni de integración con Google instalada todavía (`xlsx`, `papaparse`, `googleapis`, etc.) — se parte de cero en ese aspecto.

## 2. Flujo A: archivo local (Excel / CSV)

### Librería de parseo

Recomiendo **`xlsx`** (SheetJS Community Edition): lee `.xlsx` y `.csv` con la misma API, es JavaScript puro (sin binarios nativos, lo cual importa porque el proyecto corre en funciones serverless de Vercel), y corre tanto en el navegador como en Node. Evita tener que mantener dos parsers distintos para dos formatos de archivo.

### Dónde parsear: en el navegador, no en el servidor

Propongo parsear el archivo del lado del cliente, inmediatamente después de soltarlo en el dropzone, para poder mostrar una **vista previa fila por fila antes de importar nada** — exactamente lo que pediste con "detectar filas corruptas antes de insertarlas". El usuario ve de entrada cuáles filas son válidas y cuáles no, sin esperar un viaje al servidor.

El archivo nunca se sube tal cual al backend. Lo que viaja al servidor es el array de filas ya parseado (JSON), a un endpoint nuevo tipo `POST /api/admin/products/bulk-import`. Ese endpoint **revalida todo con `productSchema` otra vez** — nunca se confía en que el frontend ya validó, mismo principio que ya aplica el resto del admin (Zod en el borde del servidor, siempre).

### Columnas de la plantilla

Mapeadas 1 a 1 contra `productSchema`, en español para que el cliente las entienda sin traducir:

| Columna Excel | Campo | Notas |
|---|---|---|
| Nombre | `name` | obligatorio |
| Descripción | `description` | opcional |
| Precio | `price` | número, > 0 |
| Categoría | `categoryId` | por **nombre**, se resuelve a id (ver más abajo) |
| Subcategoría | `subCategoryId` | opcional, por nombre, debe ser hija de Categoría |
| Marca | `marca` | obligatorio |
| Modelo | `modelo` | obligatorio |
| Colores | `colores` | opcional, formato `Nombre:#hex,Nombre:#hex` (reutiliza `lib/product-colors.ts` tal cual) |
| Imágenes | `images` | URLs separadas por coma o punto y coma (ver sección 4) |
| Activo | `isActive` | `SI`/`NO` |
| Agotado | `isOutOfStock` | `SI`/`NO` |

### Resolución de categoría por nombre

Antes de validar con Zod, cada fila necesita convertir "Categoría" (texto) en `categoryId` (id real). Propongo: matcheo case-insensitive contra `Category.name` existente. Si no hay match, la fila se marca como error ("La categoría 'X' no existe") en vez de crearla automáticamente por defecto — evita categorías basura por un typo. Como opción avanzada (checkbox "crear categorías que no existan"), se podría permitir creación automática, pero como default recomiendo fallar explícito.

### Vista previa y manejo de errores

Tabla de preview con una fila por producto: columna de estado (✓ válido / ✗ error con el motivo, usando `parsed.error.flatten()` igual que ya se usa en el resto del admin), y las filas inválidas no bloquean a las válidas — se importa lo que está bien y se lista aparte lo que falló, con motivo, para que el admin corrija y reintente solo esas filas.

### Inserción

Con las categorías ya resueltas a id y cada fila validada, uso `prisma.product.createMany` en lugar de un loop de `create` uno por uno — mucho más rápido para catálogos grandes. Para catálogos muy extensos (varios miles de filas), conviene trocear en lotes de ~200 por transacción, para no acercarse al límite de tiempo de ejecución de una función serverless.

### Dónde vive esto en el admin

Página nueva `/admin/products/import`, con un dropzone de archivo (mismo patrón visual que `components/admin/image-dropzone.tsx`, pero aceptando `.xlsx`/`.csv` en vez de imágenes), la tabla de preview, y un resumen final ("47 creados, 3 omitidos por error").

## 3. Flujo B: Google Sheets

Hay dos niveles de integración posibles, con una diferencia grande de complejidad entre ellos.

### Opción recomendada para ahora: CSV público con un botón

Google Sheets permite publicar una hoja como CSV accesible por URL (Archivo → Compartir → Publicar en la web → formato CSV), o directamente compartir con "cualquiera con el enlace" y usar la URL de exportación (`.../export?format=csv`). El admin pega ese link una sola vez en el panel, y cada vez que aprieta "Sincronizar ahora", el backend hace un `fetch` a esa URL, obtiene el CSV, y lo procesa con **el mismo pipeline de validación y preview del Flujo A** — la única diferencia es el origen de los bytes (un `fetch` en vez de un archivo subido).

Esto es literalmente "un botón, sin credenciales, sin OAuth, sin tokens que mantener" — cumple el pedido tal cual está planteado, con la contrapartida de que no hay sincronización automática en segundo plano (es manual, a demanda) y de que si el cliente cambia la estructura de columnas de su hoja, la próxima sincronización va a fallar con errores claros por fila, igual que un Excel mal armado.

### Opción más robusta (no recomendada para el MVP): Google Sheets API

Con OAuth2 o una cuenta de servicio se puede leer *y escribir* la hoja, y programar sincronizaciones automáticas (cron). El costo: hay que crear un proyecto en Google Cloud Console, generar credenciales, guardar tokens (o la clave de la cuenta de servicio) de forma segura por cliente, manejar expiración/renovación de tokens, y sumar la librería `googleapis` (pesada). Es infraestructura real de mantener, no algo que se resuelva en una tarde.

**Recomendación:** implementar la opción CSV público ahora (es casi gratis una vez construido el Flujo A, porque reutiliza el mismo pipeline), y dejar la API completa de Google como fase 2, solo si un cliente puntual necesita sincronización automática recurrente en vez de un botón manual.

## 4. Manejo de imágenes en lote

Acá está la restricción real: Supabase Storage necesita que el binario de la imagen se suba explícitamente — no existe un mecanismo donde "poner una URL en el Excel" haga que la imagen termine alojada en el bucket del cliente sin un paso de por medio. Hay tres estrategias, con distinto costo:

**a) URLs directas en la planilla (recomendada para la fase 1).** La columna "Imágenes" ya contiene links públicos, porque el admin subió esas fotos de antemano con el `ImageDropzone` que ya existe (tiene un botón "copiar enlace" pensado justo para esto) y las pegó en el Excel. Cero trabajo de backend nuevo: reutiliza `images: z.array(z.string().url())` tal cual está hoy. La única fricción es que subir 200 fotos una por una para copiar sus links sigue siendo manual — pero es un problema de "subir fotos", no de "cargar productos", y ya está resuelto por el dropzone actual.

**b) ZIP de imágenes + nombre de archivo como referencia.** El admin sube un `.zip` con todas las fotos (nombradas de forma predecible, ej. `producto-123-1.jpg`) junto al Excel, que referencia esos nombres en vez de URLs. El backend descomprime, sube cada imagen a Supabase, arma un mapeo nombre→URL, y recién ahí valida/inserta los productos. Resuelve el caso real de "tengo una carpeta de fotos y un Excel que las nombra", pero es bastante más trabajo (descompresión server-side, archivos grandes, riesgo de timeout en serverless) y no lo construiría de forma especulativa.

**c) Sin imágenes en la carga masiva.** El Excel crea el producto sin fotos, y se cargan después una por una en la edición individual. Es lo más simple de programar, pero para catálogos grandes vuelve a ser el trabajo manual que se quiere evitar — no resuelve el problema real.

**Recomendación:** construir (a) junto con el Flujo A — no agrega nada nuevo, solo respeta el contrato de datos que ya existe. Dejar (b) documentado como fase 2, a construir si un cliente concreto lo pide (consistente con no meter complejidad que nadie pidió todavía).

## 5. Resumen y próximo paso

Lo que más dolor real resuelve, con menor costo de construcción, en este orden:

1. Import de Excel/CSV local (Flujo A completo: dropzone, preview con errores por fila, resolución de categoría por nombre, inserción en lote) — resuelve el 90% del problema planteado (catálogos extensos cargados a mano).
2. Sincronización por CSV público de Google Sheets con un botón — casi gratis una vez construido el punto 1, porque reutiliza el mismo pipeline.
3. Fase 2, bajo demanda y no ahora: API completa de Google Sheets (OAuth/cuenta de servicio, sync automática) y carga de imágenes vía ZIP.

Si te parece bien este enfoque, lo implemento en ese orden — decime si querés que arranque por el punto 1.
