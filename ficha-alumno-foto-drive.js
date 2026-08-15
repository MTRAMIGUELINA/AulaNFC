/* AulaNFC v3.2 - Fotos privadas de alumnos en Ficha del alumno. */
(() => {
  let ultimoAlumnoCargado = '';
  let cargaEnCurso = false;

  function iniciales(nombre) {
    const partes = String(nombre || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return 'AL';
    return partes.length > 1
      ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
      : partes[0].slice(0, 2).toUpperCase();
  }

  function obtenerContenedor() {
    return document.getElementById('fotoFichaAlumno');
  }

  function mostrarIniciales() {
    const contenedor = obtenerContenedor();
    if (!contenedor) return;

    const nombre = document.getElementById('nombreFichaAlumno')?.textContent || 'Alumno';
    contenedor.innerHTML = '';
    contenedor.textContent = iniciales(nombre);
    contenedor.dataset.fotoPrivada = '';
  }

  function mostrarFoto(dataUrl, idAlumno) {
    const contenedor = obtenerContenedor();
    if (!contenedor) return;

    const nombre = document.getElementById('nombreFichaAlumno')?.textContent || 'Alumno';
    const imagen = document.createElement('img');

    imagen.alt = `Foto de ${nombre}`;
    imagen.src = dataUrl;
    imagen.style.width = '100%';
    imagen.style.height = '100%';
    imagen.style.objectFit = 'cover';
    imagen.style.display = 'block';

    imagen.onload = () => {
      contenedor.innerHTML = '';
      contenedor.appendChild(imagen);
      contenedor.dataset.fotoPrivada = idAlumno || '';
    };

    imagen.onerror = () => {
      mostrarIniciales();
    };
  }

  async function cargarFotoPrivada() {
    if (cargaEnCurso) return;
    if (typeof solicitarJSONP !== 'function') return;

    const contenido = document.getElementById('contenidoFichaAlumno');
    if (!contenido || contenido.classList.contains('oculto')) return;

    const idAlumno = String(
      document.getElementById('idFichaAlumno')?.textContent || ''
    ).trim();

    if (!idAlumno || idAlumno === '—') return;

    const contenedor = obtenerContenedor();
    if (
      idAlumno === ultimoAlumnoCargado &&
      contenedor?.dataset.fotoPrivada === idAlumno
    ) {
      return;
    }

    ultimoAlumnoCargado = idAlumno;
    cargaEnCurso = true;
    mostrarIniciales();

    try {
      const respuesta = await solicitarJSONP('obtenerfotoalumno', {
        idAlumno
      });

      if (
        !respuesta ||
        respuesta.ok === false ||
        respuesta.exito === false ||
        respuesta.tieneFoto !== true ||
        !respuesta.base64
      ) {
        mostrarIniciales();
        return;
      }

      const tipoMime = String(
        respuesta.tipoMime || 'image/jpeg'
      ).trim();

      const base64 = String(
        respuesta.base64 || ''
      ).trim();

      if (!base64) {
        mostrarIniciales();
        return;
      }

      mostrarFoto(
        `data:${tipoMime};base64,${base64}`,
        idAlumno
      );

    } catch (error) {
      console.error(
        'No fue posible cargar la foto privada del alumno:',
        error
      );
      mostrarIniciales();
    } finally {
      cargaEnCurso = false;
    }
  }

  function detectarCambioAlumno() {
    const idAlumno = String(
      document.getElementById('idFichaAlumno')?.textContent || ''
    ).trim();

    if (!idAlumno || idAlumno === '—') return;

    const contenedor = obtenerContenedor();
    if (
      idAlumno !== ultimoAlumnoCargado ||
      contenedor?.dataset.fotoPrivada !== idAlumno
    ) {
      setTimeout(cargarFotoPrivada, 20);
    }
  }

  const observador = new MutationObserver(detectarCambioAlumno);

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class']
  });

  window.addEventListener('load', () => {
    setTimeout(cargarFotoPrivada, 400);
  });

  setTimeout(cargarFotoPrivada, 600);
})();
