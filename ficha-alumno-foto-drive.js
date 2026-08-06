/* AulaNFC v2.1 - Compatibilidad de fotos de alumnos con enlaces de Google Drive. */
(() => {
  function obtenerIdDrive(valor) {
    const texto = String(valor || '').trim();
    if (!texto) return '';

    const patrones = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)/,
      /\/d\/([a-zA-Z0-9_-]+)/,
      /^([a-zA-Z0-9_-]{20,})$/
    ];

    for (const patron of patrones) {
      const coincidencia = texto.match(patron);
      if (coincidencia && coincidencia[1]) return coincidencia[1];
    }

    return '';
  }

  function iniciales(nombre) {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'AL';
    return partes.length > 1
      ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
      : partes[0].slice(0, 2).toUpperCase();
  }

  function mostrarIniciales(contenedor) {
    const nombre = document.getElementById('nombreFichaAlumno')?.textContent || 'Alumno';
    contenedor.textContent = iniciales(nombre);
  }

  function corregirFoto() {
    const contenedor = document.getElementById('fotoFichaAlumno');
    if (!contenedor) return;

    const imagen = contenedor.querySelector('img');
    if (!imagen || imagen.dataset.driveProcesada === 'true') return;

    const original = imagen.getAttribute('src') || '';
    const idDrive = obtenerIdDrive(original);

    imagen.dataset.driveProcesada = 'true';

    if (!idDrive) {
      imagen.addEventListener('error', () => mostrarIniciales(contenedor), { once: true });
      return;
    }

    imagen.src = `https://drive.google.com/thumbnail?id=${encodeURIComponent(idDrive)}&sz=w500`;
    imagen.referrerPolicy = 'no-referrer';

    imagen.addEventListener('error', () => {
      mostrarIniciales(contenedor);
    }, { once: true });
  }

  const observador = new MutationObserver(() => corregirFoto());
  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  corregirFoto();
})();
