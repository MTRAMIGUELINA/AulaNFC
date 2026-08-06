/* AulaNFC v2.1 - Conexión del Dashboard diario con Apps Script. */
(() => {
  let datosDashboard = null;
  let consultaDashboardEnProceso = false;

  function fechaHoyISO() {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function escapar(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function nombreAlumno(alumno) {
    return String(
      alumno?.nombreCompleto ||
      alumno?.nombre ||
      [alumno?.nombres, alumno?.apellidoPaterno, alumno?.apellidoMaterno].filter(Boolean).join(' ') ||
      'Alumno'
    ).replace(/\s+/g, ' ').trim();
  }

  function lista(valor) {
    return Array.isArray(valor) ? valor : [];
  }

  function ponerNumero(id, valor) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = String(Number(valor) || 0);
  }

  function pintarDashboard(respuesta) {
    const presentes = lista(respuesta.presentes || respuesta.alumnosPresentes);
    const faltantes = lista(respuesta.faltantes || respuesta.alumnosFaltantes);
    const sinParticipacion = lista(respuesta.sinParticipacion || respuesta.alumnosSinParticipacion);
    const tareasPendientes = lista(respuesta.tareasPendientes || respuesta.noCumplieronTareas);

    datosDashboard = {
      presentes,
      faltantes,
      participacion: sinParticipacion,
      tareas: tareasPendientes
    };

    ponerNumero('dashboardPresentes', presentes.length);
    ponerNumero('dashboardFaltantes', faltantes.length);
    ponerNumero('dashboardSinParticipacion', sinParticipacion.length);
    ponerNumero('dashboardTareasPendientes', tareasPendientes.length);

    const aviso = document.querySelector('.dashboard__aviso');
    if (aviso) aviso.textContent = '✅ Dashboard actualizado con los registros de hoy.';
  }

  function textoDetalle(tipo, alumno) {
    if (tipo !== 'tareas') return '';
    const resultado = String(
      alumno?.resultado ||
      alumno?.resultadoTarea ||
      alumno?.tipoTarea ||
      alumno?.detalle ||
      ''
    ).trim();
    return resultado;
  }

  function renderizarDetalle(tipo) {
    const listaDetalle = document.getElementById('listaDetalleDashboard');
    if (!listaDetalle) return;

    const alumnos = lista(datosDashboard?.[tipo]);

    if (!alumnos.length) {
      listaDetalle.innerHTML = '<div class="dashboard__alumno">No hay alumnos en esta categoría.</div>';
      return;
    }

    listaDetalle.innerHTML = alumnos.map((alumno) => {
      const nombre = nombreAlumno(alumno);
      const detalle = textoDetalle(tipo, alumno);
      const gradoGrupo = [alumno?.grado, alumno?.grupo].filter(Boolean).join('° ');
      const meta = [gradoGrupo, detalle].filter(Boolean).join(' · ');

      return `
        <div class="dashboard__alumno">
          <strong>${escapar(nombre)}</strong>
          ${meta ? `<small>${escapar(meta)}</small>` : ''}
        </div>`;
    }).join('');
  }

  async function cargarDashboardDiario(forzar = false) {
    if (consultaDashboardEnProceso || typeof solicitarJSONP !== 'function') return;
    if (datosDashboard && !forzar) return;

    consultaDashboardEnProceso = true;
    const aviso = document.querySelector('.dashboard__aviso');
    if (aviso) aviso.textContent = '⏳ Consultando registros de hoy...';

    try {
      const respuesta = await solicitarJSONP('obtenerDashboardDiario', {
        fecha: fechaHoyISO()
      });

      if (!respuesta || (respuesta.ok !== true && respuesta.exito !== true)) {
        throw new Error(respuesta?.mensaje || 'No fue posible cargar el Dashboard.');
      }

      pintarDashboard(respuesta);

      const detalleVisible = document.getElementById('detalleDashboard');
      if (detalleVisible && !detalleVisible.classList.contains('oculto')) {
        const titulo = document.getElementById('tituloDetalleDashboard')?.textContent || '';
        let tipo = '';
        if (/presentes/i.test(titulo)) tipo = 'presentes';
        else if (/faltantes/i.test(titulo)) tipo = 'faltantes';
        else if (/participaci/i.test(titulo)) tipo = 'participacion';
        else if (/tarea/i.test(titulo)) tipo = 'tareas';
        if (tipo) renderizarDetalle(tipo);
      }
    } catch (error) {
      if (aviso) aviso.textContent = `❌ ${error?.message || 'No fue posible cargar el Dashboard.'}`;
      datosDashboard = null;
    } finally {
      consultaDashboardEnProceso = false;
    }
  }

  function conectarVista() {
    const vista = document.getElementById('vistaDashboard');
    const botonMenu = document.getElementById('menuDashboard');
    if (!vista || !botonMenu) {
      setTimeout(conectarVista, 120);
      return;
    }

    if (vista.dataset.dashboardConexionInicializada === 'true') return;
    vista.dataset.dashboardConexionInicializada = 'true';

    botonMenu.addEventListener('click', () => {
      datosDashboard = null;
      setTimeout(() => cargarDashboardDiario(true), 0);
    });

    document.querySelectorAll('[data-dashboard-detalle]').forEach((tarjeta) => {
      tarjeta.addEventListener('click', () => {
        const tipo = tarjeta.dataset.dashboardDetalle;
        setTimeout(() => renderizarDetalle(tipo), 0);
      });
    });

    // Primera carga si la vista ya está abierta cuando se inicializa la conexión.
    if (!vista.classList.contains('oculto')) cargarDashboardDiario(true);
  }

  conectarVista();
})();
