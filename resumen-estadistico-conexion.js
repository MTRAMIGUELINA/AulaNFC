/*
 * Conexión de la vista Resumen estadístico con Apps Script.
 * No modifica NFC, registro manual, historial ni la lógica de captura.
 */
(() => {
  let alumnoSeleccionadoId = '';
  let consultaEnProceso = false;

  function esperarVista() {
    const vista = document.getElementById('vistaResumenEstadistico');
    const lista = document.getElementById('listaAlumnosEstadisticas');
    const selector = document.getElementById('periodoResumenEstadistico');
    const botonAplicar = document.getElementById('btnAplicarPeriodoEstadisticas');

    if (!vista || !lista || !selector || !botonAplicar || typeof solicitarJSONP !== 'function') {
      setTimeout(esperarVista, 120);
      return;
    }

    inicializarConexion(vista, lista, selector, botonAplicar);
  }

  function inicializarConexion(vista, lista, selector, botonAplicar) {
    const aviso = vista.querySelector('.resumen-estadistico__aviso');

    if (aviso) {
      aviso.textContent = 'Selecciona un alumno para consultar sus estadísticas.';
    }

    lista.addEventListener('click', (evento) => {
      const botonAlumno = evento.target.closest('[data-id-alumno-estadisticas]');
      if (!botonAlumno) return;

      alumnoSeleccionadoId = String(
        botonAlumno.dataset.idAlumnoEstadisticas || ''
      ).trim();

      setTimeout(() => consultarResumenEstadistico(), 0);
    });

    selector.addEventListener('change', () => {
      if (selector.value !== 'personalizado' && alumnoSeleccionadoId) {
        consultarResumenEstadistico();
      }
    });

    botonAplicar.addEventListener('click', () => {
      if (selector.value === 'personalizado') {
        consultarResumenEstadistico();
      }
    });
  }

  async function consultarResumenEstadistico() {
    if (consultaEnProceso) return;

    const selector = document.getElementById('periodoResumenEstadistico');
    const aviso = document.querySelector('#vistaResumenEstadistico .resumen-estadistico__aviso');

    if (!alumnoSeleccionadoId) {
      mostrarEstado(aviso, 'Primero selecciona un alumno.', true);
      return;
    }

    const periodo = selector ? selector.value : 'ciclo';
    const parametros = {
      idAlumno: alumnoSeleccionadoId,
      periodo: periodo
    };

    if (periodo === 'personalizado') {
      const fechaInicio = document.getElementById('fechaInicialEstadisticas')?.value || '';
      const fechaFin = document.getElementById('fechaFinalEstadisticas')?.value || '';

      if (!fechaInicio || !fechaFin) {
        mostrarEstado(aviso, 'Selecciona la fecha inicial y la fecha final.', true);
        return;
      }

      if (fechaInicio > fechaFin) {
        mostrarEstado(aviso, 'La fecha inicial no puede ser posterior a la fecha final.', true);
        return;
      }

      parametros.fechaInicio = fechaInicio;
      parametros.fechaFin = fechaFin;
    }

    consultaEnProceso = true;
    mostrarEstado(aviso, '⏳ Consultando estadísticas...', false);

    try {
      const respuesta = await solicitarJSONP(
        'obtenerResumenEstadistico',
        parametros
      );

      validarRespuestaEstadistica(respuesta);
      pintarResumen(respuesta);
      mostrarEstado(aviso, '✅ Estadísticas actualizadas.', false);

    } catch (error) {
      mostrarEstado(
        aviso,
        error && error.message
          ? error.message
          : 'No fue posible cargar las estadísticas.',
        true
      );

    } finally {
      consultaEnProceso = false;
    }
  }

  function validarRespuestaEstadistica(respuesta) {
    if (!respuesta || (respuesta.ok !== true && respuesta.exito !== true)) {
      throw new Error(
        respuesta && respuesta.mensaje
          ? respuesta.mensaje
          : 'La consulta estadística no pudo completarse.'
      );
    }
  }

  function pintarResumen(respuesta) {
    pintarAsistencia(respuesta.asistencia || {});
    pintarTareas(respuesta.tareas || {});
    pintarParticipaciones(respuesta.participaciones || {});
    pintarConducta(respuesta.conducta || {});
    pintarLectura(respuesta.lectura || {});
  }

  function pintarAsistencia(datos) {
    const bloque = document.querySelector('.bloque-estadistico--asistencia');
    if (!bloque) return;

    const valores = bloque.querySelectorAll('.estadistica-simple strong');
    asignarTexto(valores[0], numero(datos.presentes));
    asignarTexto(valores[1], numero(datos.faltas));
  }

  function pintarTareas(datos) {
    const bloque = document.querySelector('.bloque-estadistico--tareas');
    if (!bloque) return;

    const valores = bloque.querySelectorAll('.estadistica-simple strong');
    const porcentaje = limitarPorcentaje(datos.porcentajeCumplimiento);

    asignarTexto(valores[0], numero(datos.entregadas));
    asignarTexto(valores[1], numero(datos.noEntregadas));
    asignarTexto(valores[2], numero(datos.incompletas));
    asignarTexto(valores[3], `${porcentaje}%`);

    const porcentajeCabecera = bloque.querySelector('.progreso-estadistico__cabecera strong');
    const barra = bloque.querySelector('.progreso-estadistico__barra');

    asignarTexto(porcentajeCabecera, `${porcentaje}%`);
    if (barra) barra.style.width = `${porcentaje}%`;
  }

  function pintarParticipaciones(datos) {
    const bloque = document.querySelector('.bloque-estadistico--participacion');
    if (!bloque) return;

    const cantidades = [
      numero(datos.lenguajes),
      numero(datos.saberes),
      numero(datos.etica),
      numero(datos.comunitario)
    ];

    const maximo = Math.max(...cantidades, 1);
    const progresos = bloque.querySelectorAll('.participaciones-lista .progreso-estadistico');

    progresos.forEach((progreso, indice) => {
      const cantidad = cantidades[indice] || 0;
      const valor = progreso.querySelector('.progreso-estadistico__cabecera strong');
      const barra = progreso.querySelector('.progreso-estadistico__barra');

      asignarTexto(valor, cantidad);
      if (barra) barra.style.width = `${Math.round((cantidad / maximo) * 100)}%`;
    });

    const total = bloque.querySelector('.estadistica-simple strong');
    asignarTexto(total, numero(datos.total));
  }

  function pintarConducta(datos) {
    const bloque = document.querySelector('.bloque-estadistico--conducta');
    if (!bloque) return;

    const valores = bloque.querySelectorAll('.estadistica-renglon strong');
    asignarTexto(valores[0], numero(datos.buenasConductas));
    asignarTexto(valores[1], numero(datos.llamadasAtencion));
    asignarTexto(valores[2], numero(datos.tarjetasAmarillas));
    asignarTexto(valores[3], numero(datos.tarjetasRojas));
  }

  function pintarLectura(datos) {
    const bloque = document.querySelector('.bloque-estadistico--lectura');
    if (!bloque) return;

    const valores = bloque.querySelectorAll('.estadistica-renglon strong');
    asignarTexto(valores[0], numero(datos.requiereApoyo));
    asignarTexto(valores[1], numero(datos.seAcercaEstandar));
    asignarTexto(valores[2], numero(datos.estandar));
    asignarTexto(valores[3], numero(datos.avanzado));

    const total = bloque.querySelector('.estadistica-simple strong');
    asignarTexto(total, numero(datos.total));
  }

  function mostrarEstado(elemento, mensaje, esError) {
    if (!elemento) return;
    elemento.textContent = mensaje;
    elemento.style.background = esError ? '#ffebee' : '#fff8e1';
    elemento.style.color = esError ? '#b71c1c' : '#7a5b00';
  }

  function numero(valor) {
    const convertido = Number(valor);
    return Number.isFinite(convertido) ? convertido : 0;
  }

  function limitarPorcentaje(valor) {
    return Math.max(0, Math.min(100, Math.round(numero(valor))));
  }

  function asignarTexto(elemento, valor) {
    if (elemento) elemento.textContent = String(valor);
  }

  esperarVista();
})();
