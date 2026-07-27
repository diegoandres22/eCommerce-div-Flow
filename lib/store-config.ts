// File: lib/store-config.ts
//
// Datos del cliente. Esto es lo único que hay que llenar a mano al adaptar
// esta tienda (proyecto clonado) para un cliente nuevo -- no hace falta
// tocar ningún componente ni ningún otro archivo.
//
// Para el logo: no va acá. Reemplazá directamente los archivos
// public/images/logolight.png (versión para tema claro) y
// public/images/logodark.png (versión para tema oscuro) por los del
// cliente, manteniendo esos mismos nombres.

export const STORE_CONFIG = {
  // ── Datos básicos ──
  nombre: 'E-commerce Store',
  slogan: 'Todo lo que buscas, a un mensaje de WhatsApp',
  // Descripción corta: aparece en buscadores (Google) y al compartir el link en redes.
  descripcion:
    'Compra fácil y rápido: elige tus productos y confirma tu pedido directo por WhatsApp.',

  // ── Colores de marca (formato hexadecimal, ej: #1D4ED8) ──
  // Se usan en botones, links y detalles de acento en toda la tienda. No
  // hace falta dar una versión para modo claro y otra para oscuro: el mismo
  // color de marca se usa en los dos, solo cambia el fondo de la página
  // (eso ya lo maneja el interruptor de tema, no es parte de estos datos).
  colorPrimario: '#1c1917',
  colorSecundario: '#f5f5f4',
  colorAcento: '#f5f5f4',

  // ── Contacto y redes sociales ──
  // Dejá vacío ('') lo que el cliente no tenga. El número de WhatsApp NO va
  // acá: ese se carga desde el panel de administración de la propia tienda
  // (/admin/settings), porque es un dato que el dueño puede necesitar
  // cambiar él mismo sin pedirle ayuda a un desarrollador.
  correoSoporte: '',
  telefono: '',
  direccion: '',
  instagram: '',
  tiktok: '',
  facebook: '',

  // ── Secciones activas ──
  // true = la sección se muestra, false = queda oculta en toda la tienda.
  mostrarBannerAnuncios: true,
  mostrarFavoritos: true,
  mostrarVistosRecientemente: true,
  mostrarColoresDeProducto: true,

  // ── Acceso al panel de administración ──
  // true = además de Google, se puede entrar a /admin con correo y
  // contraseña (ver ADMIN_LOGIN_EMAIL/ADMIN_PASSWORD_HASH en .env). Pensado
  // para clientes que piden explícitamente esta opción -- por defecto, en un
  // cliente nuevo, dejalo en false y que el acceso sea solo por Google.
  permitirLoginConCredenciales: true,
};

export type StoreConfig = typeof STORE_CONFIG;
