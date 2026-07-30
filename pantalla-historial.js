(() => {
  const botonAbrir = document.getElementById('btnAbrirHistorial');
  const botonCerrar = document.getElementById('btnCerrarHistorial');
  const pantalla = document.getElementById('pantallaHistorial');

  if (!botonAbrir || !botonCerrar || !pantalla) return;

  const botonConsultarFecha = document.getElementById('btnConsultarFecha');
  const botonHistorialGeneral = document.getElementById('btnHistorialGeneral');
  const estadoHistorial = document.getElementById('estadoHistorial');
  const listaHistorial = document.getElementById('listaHistorialGeneral');
  const botonDesplegar = document.getElementById('btnDesplegarLista');
  const listaAlumnos = document.getElementById('listaAlumnos');
  const campoBusquedaAlumno = document.getElementById('campoBusquedaAlumno');
  const contadorAlumnos = document.getElementById('contadorAlumnos');
  const listaManual = document.getElementById('listaManual');
  const campoBusquedaManual = document.getElementById('campoBusquedaManual');
  const contadorManual = document.getElementById('contadorManual');

  let consultaFechaPendiente = false;
  let listaFechaActiva = false;

  function abrirHistorial() {
    pantalla.classList.remove('oculto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    botonAbrir.textContent = '📚 OCULTAR HISTORIAL';
    pantalla.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cerrarHistorial() {
    pantalla.classList.add('oculto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    botonAbrir.textContent = '📚 HISTORIAL';

    const vistaBuscar = document.getElementById('vistaBuscar');
    const resultado = document.getElementById('resultadoConsultaHistorial');
    const lista = document.getElementById('listaHistorialGeneral');
    const desplegar = document.getElementById('btnDesplegarLista');

    if (vistaBuscar) vistaBuscar.classList.add('oculto');
    if (resultado) resultado.classList.add('oculto');
    if (lista) lista.classList.add('oculto');
    if (desplegar) desplegar.classList.add('oculto');

    consultaFechaPendiente = false;
    listaFechaActiva = false;
  }

  botonAbrir.addEventListener('click', () => {
    if (pantalla.classList.contains('oculto')) {
      abrirHistorial();
    } else {
      cerrarHistorial();
    }
  });

  botonCerrar.addEventListener('click', cerrarHistorial);

  if (listaAlumnos) {
    listaAlumnos.addEventListener('click', (evento) => {
      const alumnoSeleccionado = evento.target.closest('[data-consulta-id]');
      if (!alumnoSeleccionado) return;

      listaAlumnos.classList.add('oculto');

      if (campoBusquedaAlumno) {
        campoBusquedaAlumno.value = '';
      }

      if (contadorAlumnos) {
        contadorAlumnos.textContent = 'Alumno seleccionado.';
      }
    });
  }

  if (listaManual) {
    listaManual.addEventListener('click', (evento) => {
      const alumnoSeleccionado = evento.target.closest('[data-manual-id]');
      if (!alumnoSeleccionado) return;

      listaManual.classList.add('oculto');

      if (campoBusquedaManual) {
        campoBusquedaManual.value = '';
      }

      if (contadorManual) {
        contadorManual.textContent = 'Alumno seleccionado.';
      }
    });
  }

  if (botonConsultarFecha && estadoHistorial && listaHistorial && botonDesplegar) {
    botonConsultarFecha.addEventListener('click', () => {
      consultaFechaPendiente = true;
      listaFechaActiva = true;
    });

    if (botonHistorialGeneral) {
      botonHistorialGeneral.addEventListener('click', () => {
        consultaFechaPendiente = false;
        listaFechaActiva = false;
      });
    }

    const observadorHistorial = new MutationObserver(() => {
      const texto = estadoHistorial.textContent || '';

      if (
        consultaFechaPendiente &&
        !texto.includes('Consultando') &&
        /\bregistro(s)?\b/i.test(texto)
      ) {
        listaHistorial.classList.add('oculto');
        botonDesplegar.classList.remove('oculto');
        botonDesplegar.textContent = 'Desplegar lista completa';
        consultaFechaPendiente = false;
      }
    });

    observadorHistorial.observe(estadoHistorial, {
      childList: true,
      characterData: true,
      subtree: true
    });

    botonDesplegar.addEventListener('click', () => {
      if (!listaFechaActiva) return;

      const estaOculta = listaHistorial.classList.toggle('oculto');
      botonDesplegar.textContent = estaOculta
        ? 'Desplegar lista completa'
        : 'Ocultar lista completa';
    });
  }
})();