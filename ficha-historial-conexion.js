/* AulaNFC v2.1 - Navegación Ficha del alumno <-> Resumen estadístico. */
(() => {
  let abiertoDesdeFicha = false;

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

  function obtenerBotonVolver() {
    let boton = document.getElementById('btnVolverFichaDesdeResumen');
    if (boton) return boton;

    const vistaResumen = document.getElementById('vistaResumenEstadistico');
    if (!vistaResumen) return null;

    boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'btnVolverFichaDesdeResumen';
    boton.textContent = '← Volver a ficha del alumno';
    boton.className = 'resumen-estadistico__aplicar oculto';
    boton.style.margin = '0 0 14px';
    boton.style.width = 'auto';
    boton.style.padding = '11px 16px';
    boton.setAttribute('aria-label', 'Volver a la ficha del alumno seleccionado');

    const cabecera = vistaResumen.querySelector('.resumen-estadistico__cabecera');
    if (cabecera && cabecera.parentNode) {
      cabecera.parentNode.insertBefore(boton, cabecera.nextSibling);
    } else {
      vistaResumen.insertBefore(boton, vistaResumen.firstChild);
    }

    boton.addEventListener('click', volverAFicha);
    return boton;
  }

  function mostrarBotonVolver(mostrar) {
    const boton = obtenerBotonVolver();
    if (!boton) return;
    boton.classList.toggle('oculto', !mostrar);
  }

  function volverAFicha() {
    const vistaFicha = document.getElementById('vistaFichaAlumno');
    const vistaResumen = document.getElementById('vistaResumenEstadistico');
    const vistaEscaner = document.getElementById('vistaEscaner');

    if (vistaResumen) vistaResumen.classList.add('oculto');
    if (vistaEscaner) vistaEscaner.classList.add('oculto');
    if (vistaFicha) {
      vistaFicha.classList.remove('oculto');
      vistaFicha.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    document.querySelectorAll('.menu-lateral__opcion').forEach((opcion) => {
      opcion.classList.toggle('activa', opcion.id === 'menuFichaAlumno');
    });

    abiertoDesdeFicha = false;
    mostrarBotonVolver(false);
  }

  function esperarElementos() {
    const boton = document.getElementById('btnFichaHistorial');
    const ficha = document.getElementById('vistaFichaAlumno');

    if (!boton || !ficha) {
      setTimeout(esperarElementos, 120);
      return;
    }

    boton.innerHTML = '📊 Ver resumen completo';
    obtenerBotonVolver();

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

    // Si el Resumen se abre directamente desde el menú, el regreso contextual no aparece.
    const opcionResumen = document.getElementById('menuResumenEstadistico');
    if (opcionResumen) {
      opcionResumen.addEventListener('click', () => {
        if (!abiertoDesdeFicha) mostrarBotonVolver(false);
      });
    }
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

      abiertoDesdeFicha = true;
      opcionResumen.click();

      const listo = await esperarHasta(() => {
        const buscador = document.getElementById('busquedaAlumnoEstadisticas');
        const contador = document.getElementById('contadorAlumnosEstadisticas');
        return buscador && contador && !/cargando alumnos/i.test(contador.textContent || '');
      });

      if (!listo) {
        throw new Error('No fue posible preparar la búsqueda del alumno.');
      }

      const selector = document.getElementById('periodoResumenEstadistico');
      if (selector) {
        selector.value = 'ciclo';
        selector.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const buscador = document.getElementById('busquedaAlumnoEstadisticas');
      buscador.value = nombre || id;
      buscador.dispatchEvent(new Event('input', { bubbles: true }));

      const opcionEncontrada = await esperarHasta(() =>
        document.querySelector(`[data-id-alumno-estadisticas="${CSS.escape(id)}"]`)
      );

      if (!opcionEncontrada) {
        throw new Error('No fue posible localizar al alumno en el Resumen estadístico.');
      }

      document.querySelector(
        `[data-id-alumno-estadisticas="${CSS.escape(id)}"]`
      ).click();

      mostrarBotonVolver(true);
      vistaResumen.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (estado) estado.textContent = '✅ Resumen completo abierto.';

    } catch (error) {
      abiertoDesdeFicha = false;
      mostrarBotonVolver(false);
      if (estado) {
        estado.textContent = `❌ ${error?.message || 'No fue posible abrir el resumen completo.'}`;
      }
      boton.disabled = false;
    }
  }

  esperarElementos();
})();
