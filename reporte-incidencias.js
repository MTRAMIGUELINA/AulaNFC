/* AulaNFC v2.1 - Botón y formulario visual de Reporte de incidencias. */
(() => {
  function cargarEstilos() {
    if (document.getElementById('estilosReporteIncidencias')) return;
    const link = document.createElement('link');
    link.id = 'estilosReporteIncidencias';
    link.rel = 'stylesheet';
    link.href = 'reporte-incidencias.css?v=1';
    document.head.appendChild(link);
  }

  function fechaHoy() {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function agregarBoton() {
    if (document.getElementById('menuReporteIncidencias')) return true;
    const dashboard = document.getElementById('menuDashboard');
    const ficha = document.getElementById('menuFichaAlumno');
    const resumen = document.getElementById('menuResumenEstadistico');
    const referencia = dashboard || ficha || resumen;
    if (!referencia?.parentElement) return false;

    const boton = document.createElement('button');
    boton.id = 'menuReporteIncidencias';
    boton.type = 'button';
    boton.className = 'menu-lateral__opcion';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">📝</span><span>Reporte de incidencias</span>';
    referencia.insertAdjacentElement('afterend', boton);
    return true;
  }

  function crearVista() {
    if (document.getElementById('vistaReporteIncidencias')) return true;
    const contenedor = document.querySelector('.contenedor');
    const vistaEscaner = document.getElementById('vistaEscaner');
    if (!contenedor) return false;

    const vista = document.createElement('section');
    vista.id = 'vistaReporteIncidencias';
    vista.className = 'vista-incidencias oculto';
    vista.innerHTML = `
      <header class="incidencias__cabecera">
        <div>
          <h2>📝 Reporte de incidencias</h2>
          <p>Registra la situación, acuerdos y datos necesarios para generar el documento.</p>
        </div>
        <button id="btnCerrarReporteIncidencias" class="incidencias__cerrar" type="button" aria-label="Cerrar Reporte de incidencias">✕</button>
      </header>

      <form id="formReporteIncidencias" class="incidencias__formulario" autocomplete="off">
        <section class="incidencias__bloque">
          <h3>👤 Datos del alumno</h3>
          <div class="incidencias__grid">
            <div class="incidencias__campo incidencias__campo--completo">
              <label for="incidenciaAlumno">Alumno</label>
              <select id="incidenciaAlumno" class="incidencias__select">
                <option value="">Selecciona un alumno</option>
              </select>
            </div>
            <div class="incidencias__campo">
              <label for="incidenciaFecha">Fecha</label>
              <input id="incidenciaFecha" class="incidencias__input" type="date" value="${fechaHoy()}">
            </div>
            <div class="incidencias__campo">
              <label for="incidenciaTipo">Incidencia reportada</label>
              <select id="incidenciaTipo" class="incidencias__select">
                <option value="">Selecciona una opción</option>
                <option>Agresión física</option>
                <option>Agresión verbal</option>
                <option>Falta de respeto</option>
                <option>Incumplimiento de indicaciones</option>
                <option>Daño a materiales o instalaciones</option>
                <option>Conducta disruptiva</option>
                <option>Conflicto entre compañeros</option>
                <option>Otra</option>
              </select>
            </div>
          </div>
          <div id="incidenciaAlumnoSeleccionado" class="incidencias__seleccion oculto">
            <strong id="incidenciaNombreAlumno">Alumno</strong>
            <span id="incidenciaDatosAlumno">Grado · Grupo · ID</span>
          </div>
        </section>

        <section class="incidencias__bloque">
          <h3>📌 Descripción del incidente</h3>
          <div class="incidencias__campo">
            <label for="incidenciaDescripcion">Describe de forma clara qué ocurrió</label>
            <textarea id="incidenciaDescripcion" class="incidencias__textarea" placeholder="Escribe aquí los hechos observados, contexto y personas involucradas..."></textarea>
          </div>
        </section>

        <section class="incidencias__bloque">
          <h3>🤝 Acuerdos y compromisos</h3>
          <div class="incidencias__campo">
            <label for="incidenciaAcuerdos">Acuerdos establecidos con la familia y/o el alumno</label>
            <textarea id="incidenciaAcuerdos" class="incidencias__textarea incidencias__textarea--acuerdos" placeholder="Escribe aquí los acuerdos, compromisos y acciones de seguimiento..."></textarea>
          </div>
        </section>

        <section class="incidencias__bloque">
          <h3>✍️ Firmas en el documento impreso</h3>
          <div class="incidencias__firmas">
            <div class="incidencias__firma">Firma del docente</div>
            <div class="incidencias__firma">Firma del padre, madre o tutor</div>
          </div>
        </section>

        <div class="incidencias__acciones">
          <button id="btnGuardarIncidencia" class="incidencias__boton incidencias__boton--guardar" type="button" disabled>💾 Guardar reporte</button>
          <button id="btnPDFIncidencia" class="incidencias__boton incidencias__boton--pdf" type="button" disabled>📄 Generar PDF</button>
          <button id="btnLimpiarIncidencia" class="incidencias__boton incidencias__boton--limpiar" type="reset">Limpiar</button>
        </div>

        <p class="incidencias__aviso">Formulario visual preparado. En la siguiente fase conectaremos la lista real de alumnos y el guardado en Google Sheets.</p>
      </form>
    `;

    if (vistaEscaner) contenedor.insertBefore(vista, vistaEscaner);
    else contenedor.appendChild(vista);
    return true;
  }

  function ocultarOtrasVistas() {
    ['vistaResumenEstadistico','vistaFichaAlumno','vistaDashboard','vistaEscaner'].forEach(id => document.getElementById(id)?.classList.add('oculto'));
    const historial = document.getElementById('pantallaHistorial');
    const disparador = document.getElementById('btnAbrirHistorial');
    if (historial && !historial.classList.contains('oculto') && disparador) disparador.click();
  }

  function cerrarMenu() {
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded','false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden','true');
  }

  function mostrarVista() {
    ocultarOtrasVistas();
    const vista = document.getElementById('vistaReporteIncidencias');
    if (!vista) return;
    vista.classList.remove('oculto');
    vista.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function volverInicio() {
    document.getElementById('vistaReporteIncidencias')?.classList.add('oculto');
    document.getElementById('vistaEscaner')?.classList.remove('oculto');
    document.querySelectorAll('.menu-lateral__opcion').forEach(op => op.classList.toggle('activa',op.id==='menuInicio'));
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function inicializar() {
    cargarEstilos();
    if (!agregarBoton() || !crearVista()) return false;
    const boton = document.getElementById('menuReporteIncidencias');
    if (boton.dataset.incidenciasInicializado === 'true') return true;
    boton.dataset.incidenciasInicializado = 'true';

    boton.addEventListener('click', () => {
      document.querySelectorAll('.menu-lateral__opcion').forEach(op => op.classList.toggle('activa',op===boton));
      cerrarMenu();
      mostrarVista();
    });
    document.getElementById('btnCerrarReporteIncidencias')?.addEventListener('click',volverInicio);
    ['menuInicio','menuHistorial','menuResumenEstadistico','menuFichaAlumno','menuDashboard'].forEach(id => document.getElementById(id)?.addEventListener('click',() => document.getElementById('vistaReporteIncidencias')?.classList.add('oculto')));
    return true;
  }

  if (inicializar()) return;
  const observador = new MutationObserver(() => { if (inicializar()) observador.disconnect(); });
  observador.observe(document.documentElement,{childList:true,subtree:true});
})();
