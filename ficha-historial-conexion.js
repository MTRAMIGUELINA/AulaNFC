/* AulaNFC v2.1 - Conecta la Ficha del alumno con el Resumen estadístico existente. */
(() => {
  function esperar(ms) {
    return new Promise((resolver) => setTimeout(resolver, ms));
  }

  async function esperarHasta(condicion, limiteMs = 5000, intervaloMs = 100) {
    const inicio = Date.now();
    while (Date.now() - inicio < limiteMs) {
      if (condicion()) return true;
      await esperar(intervaloMs);
    }
    return false;
  }

  function esperarElementos() {
    const boton = document.getElementById('btnFichaHistorial');
    const ficha = document.getElementById('vistaFichaAlumno');

    if (!boton || !ficha) {
      setTimeout(esperarElementos, 120);
      return;
    }

    // El botón ahora abre el detalle estadístico completo del alumno.
    boton.innerHTML = '📊 Ver resumen completo';

    if (boton.dataset.resumenFichaInicializado === 'true') return;
    boton.dataset.resumenFichaInicializado = 'true';

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

    boton.addEventListener('click', abrirResumenDesdeFicha);
  }

  async function abrirResumenDesdeFicha() {
    const boton = document.getElementById('btnFichaHistorial');
    const id = String(document.getElementById('idFichaAlumno')?.textContent || '').trim();
    const nombre = String(document.getElementById('nombreFichaAlumno')?.textContent || '').trim();
    const estado = document.getElementById('estadoFichaAlumno');

    if (!id || id === '—') return;

    boton.disabled = true;
    if (estado) estado.textContent = '⏳ Abriendo resumen completo...';

    try {
      const opcionResumen = document.getElementById('menuResumenEstadistico');
      const vistaResumen = document.getElementById('vistaResumenEstadistico');

      if (!opcionResumen || !vistaResumen) {
        throw new Error('El Resumen estadístico todavía no está disponible.');
      }

      // Reutilizamos la navegación existente del menú para abrir la vista.
      opcionResumen.click();

      const listo = await esperarHasta(() => {
        const buscador = document.getElementById('busquedaAlumnoEstadisticas');
        const contador = document.getElementById('contadorAlumnosEstadisticas');
        return buscador && contador && !/cargando alumnos/i.test(contador.textContent || '');
      });

      if (!listo) {
        throw new Error('No fue posible preparar la búsqueda del alumno.');
      }

      // El resumen completo que sale desde la ficha abre por defecto todo el ciclo escolar.
      const selector = document.getElementById('periodoResumenEstadistico');
      if (selector) {
        selector.value = 'ciclo';
        selector.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Usamos el mismo buscador ya existente para que tanto menu-lateral.js como
      // resumen-estadistico-conexion.js reciban la selección de forma normal.
      const buscador = document.getElementById('busquedaAlumnoEstadisticas');
      buscador.value = nombre || id;
      buscador.dispatchEvent(new Event('input', { bubbles: true }));

      const opcionEncontrada = await esperarHasta(() =>
        document.querySelector(`[data-id-alumno-estadisticas="${CSS.escape(id)}"]`)
      );

      if (!opcionEncontrada) {
        throw new Error('No fue posible localizar al alumno en el Resumen estadístico.');
      }

      const botonAlumno = document.querySelector(
        `[data-id-alumno-estadisticas="${CSS.escape(id)}"]`
      );

      botonAlumno.click();

      if (vistaResumen) {
        vistaResumen.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (estado) estado.textContent = '✅ Resumen completo abierto.';

    } catch (error) {
      if (estado) {
        estado.textContent = `❌ ${error?.message || 'No fue posible abrir el resumen completo.'}`;
      }
      boton.disabled = false;
    }
  }

  esperarElementos();
})();
