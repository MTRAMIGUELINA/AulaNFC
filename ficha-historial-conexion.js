/* AulaNFC v2.1 - Conecta la Ficha del alumno con el historial general existente. */
(() => {
  function esperarElementos() {
    const boton = document.getElementById('btnFichaHistorial');
    const ficha = document.getElementById('vistaFichaAlumno');

    if (!boton || !ficha) {
      setTimeout(esperarElementos, 120);
      return;
    }

    if (boton.dataset.historialFichaInicializado === 'true') return;
    boton.dataset.historialFichaInicializado = 'true';

    const observarSeleccion = new MutationObserver(() => {
      const id = String(document.getElementById('idFichaAlumno')?.textContent || '').trim();
      boton.disabled = !id || id === '—';
    });

    const idFicha = document.getElementById('idFichaAlumno');
    if (idFicha) {
      observarSeleccion.observe(idFicha, {
        childList: true,
        characterData: true,
        subtree: true
      });
    }

    boton.addEventListener('click', abrirHistorialDesdeFicha);
  }

  async function abrirHistorialDesdeFicha() {
    const boton = document.getElementById('btnFichaHistorial');
    const id = String(document.getElementById('idFichaAlumno')?.textContent || '').trim();
    const estado = document.getElementById('estadoFichaAlumno');

    if (!id || id === '—') return;

    boton.disabled = true;
    if (estado) estado.textContent = '⏳ Abriendo historial completo...';

    try {
      if (typeof cargarAlumnos !== 'function' ||
          typeof mostrarFichaBasica !== 'function' ||
          typeof alternarHistorialGeneral !== 'function') {
        throw new Error('El historial todavía no está disponible.');
      }

      await cargarAlumnos();
      mostrarFichaBasica(id);

      const vistaFicha = document.getElementById('vistaFichaAlumno');
      const vistaResumen = document.getElementById('vistaResumenEstadistico');
      const vistaEscaner = document.getElementById('vistaEscaner');
      const pantallaHistorial = document.getElementById('pantallaHistorial');
      const botonAbrirHistorial = document.getElementById('btnAbrirHistorial');
      const vistaBuscar = document.getElementById('vistaBuscar');

      if (vistaFicha) vistaFicha.classList.add('oculto');
      if (vistaResumen) vistaResumen.classList.add('oculto');
      if (vistaEscaner) vistaEscaner.classList.add('oculto');

      if (pantallaHistorial?.classList.contains('oculto') && botonAbrirHistorial) {
        botonAbrirHistorial.click();
      }

      // Mostramos también la ficha básica del alumno dentro del historial.
      if (vistaBuscar) vistaBuscar.classList.remove('oculto');

      document.querySelectorAll('.menu-lateral__opcion').forEach((opcion) => {
        opcion.classList.toggle('activa', opcion.id === 'menuHistorial');
      });

      await alternarHistorialGeneral();

      if (pantallaHistorial) {
        pantallaHistorial.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (estado) estado.textContent = '✅ Historial abierto.';

    } catch (error) {
      if (estado) {
        estado.textContent = `❌ ${error?.message || 'No fue posible abrir el historial.'}`;
      }
      boton.disabled = false;
    }
  }

  esperarElementos();
})();
