/* AulaNFC v3.1 - Fotos privadas de alumnos servidas por Apps Script. */
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

  function mostrarIniciales() {
    const imagen = document.getElementById('fotoFichaAlumno');
    const span = document.getElementById('inicialesFichaAlumno');
    const nombre = document.getElementById('nombreFichaAlumno')?.textContent || 'Alumno';

    if (imagen) {
      imagen.removeAttribute('src');
      imagen.classList.add('oculto');
    }

    if (span) {
      span.textContent = iniciales(nombre);
      span.classList.remove('oculto');
    }
  }

  function mostrarFoto(dataUrl) {
    const imagen = document.getElementById('fotoFichaAlumno');
    const span = document.getElementById('inicialesFichaAlumno');

    if (!imagen) return;

    imagen.onload = () => {
      imagen.classList.remove('oculto');
      span?.classList.add('oculto');
    };

    imagen.onerror = () => {
      mostrarIniciales();
    };

    imagen.src = dataUrl;
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
    if (idAlumno === ultimoAlumnoCargado) return;

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
        `data:${tipoMime};base64,${base64}`
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

  function reiniciarSiCambiaAlumno() {
    const idAlumno = String(
      document.getElementById('idFichaAlumno')?.textContent || ''
    ).trim();

    if (
      idAlumno &&
      idAlumno !== '—' &&
      idAlumno !== ultimoAlumnoCargado
    ) {
      setTimeout(cargarFotoPrivada, 0);
    }
  }

  const observador = new MutationObserver(() => {
    reiniciarSiCambiaAlumno();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class']
  });

  setTimeout(cargarFotoPrivada, 300);
})();
