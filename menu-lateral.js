/* Menú lateral y vista visual del Resumen estadístico de AulaNFC v2.1. */
(() => {
  if (document.getElementById('menuLateral')) return;

  function cargarEstilo(ruta, id) {
    if (document.getElementById(id)) return;
    const enlace = document.createElement('link');
    enlace.id = id;
    enlace.rel = 'stylesheet';
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  cargarEstilo('menu-lateral.css?v=1', 'estilosMenuLateral');
  cargarEstilo('resumen-estadistico.css?v=1', 'estilosResumenEstadistico');

  const estructuraMenu = document.createElement('div');
  estructuraMenu.innerHTML = `
    <button
      id="btnMenuLateral"
      class="boton-menu-lateral"
      type="button"
      aria-label="Abrir menú"
      aria-controls="menuLateral"
      aria-expanded="false"
    >☰</button>

    <div id="fondoMenuLateral" class="fondo-menu-lateral" aria-hidden="true"></div>

    <aside
      id="menuLateral"
      class="menu-lateral"
      aria-label="Menú principal de AulaNFC"
      aria-hidden="true"
    >
      <div class="menu-lateral__cabecera">
        <div class="menu-lateral__marca">
          <div class="menu-lateral__logo" aria-hidden="true">📚</div>
          <div>
            <h2 class="menu-lateral__titulo">AulaNFC</h2>
            <span class="menu-lateral__version">Versión 2.1</span>
          </div>
        </div>
        <button
          id="btnCerrarMenuLateral"
          class="menu-lateral__cerrar"
          type="button"
          aria-label="Cerrar menú"
        >✕</button>
      </div>

      <nav class="menu-lateral__navegacion" aria-label="Opciones principales">
        <button id="menuInicio" class="menu-lateral__opcion activa" type="button">
          <span class="menu-lateral__icono" aria-hidden="true">🏠</span>
          <span>Inicio</span>
        </button>

        <button id="menuHistorial" class="menu-lateral__opcion" type="button">
          <span class="menu-lateral__icono" aria-hidden="true">📋</span>
          <span>Historial</span>
        </button>

        <button id="menuResumenEstadistico" class="menu-lateral__opcion" type="button">
          <span class="menu-lateral__icono" aria-hidden="true">📊</span>
          <span>Resumen estadístico</span>
        </button>
      </nav>
    </aside>`;

  while (estructuraMenu.firstChild) {
    document.body.appendChild(estructuraMenu.firstChild);
  }

  const contenedorPrincipal = document.querySelector('.contenedor');
  const vistaEscaner = document.getElementById('vistaEscaner');
  const pantallaHistorial = document.getElementById('pantallaHistorial');
  const disparadorHistorial = document.getElementById('btnAbrirHistorial');

  const vistaResumen = document.createElement('section');
  vistaResumen.id = 'vistaResumenEstadistico';
  vistaResumen.className = 'vista-resumen-estadistico oculto';
  vistaResumen.setAttribute('aria-labelledby', 'tituloResumenEstadistico');
  vistaResumen.innerHTML = `
    <header class="resumen-estadistico__cabecera">
      <div>
        <h2 id="tituloResumenEstadistico">📊 Resumen estadístico</h2>
        <p>Consulta visual por alumno y período.</p>
      </div>
      <button id="btnCerrarResumenEstadistico" class="resumen-estadistico__cerrar" type="button" aria-label="Cerrar resumen estadístico">✕</button>
    </header>

    <section class="resumen-estadistico__busqueda">
      <label class="resumen-estadistico__etiqueta" for="busquedaAlumnoEstadisticas">Buscar alumno</label>
      <input id="busquedaAlumnoEstadisticas" class="resumen-estadistico__buscador" type="search" placeholder="Escribe al menos dos letras..." autocomplete="off">
      <p id="contadorAlumnosEstadisticas" class="resumen-estadistico__contador">Escribe un nombre para buscar.</p>
      <div id="listaAlumnosEstadisticas" class="resumen-estadistico__lista oculto"></div>
      <div id="alumnoEstadisticasSeleccionado" class="resumen-estadistico__seleccionado oculto">
        <strong id="nombreAlumnoEstadisticas">Alumno seleccionado</strong>
        <span id="gradoGrupoAlumnoEstadisticas">—</span>
      </div>
    </section>

    <section class="resumen-estadistico__periodo">
      <label class="resumen-estadistico__etiqueta" for="periodoResumenEstadistico">Período</label>
      <select id="periodoResumenEstadistico" class="resumen-estadistico__selector">
        <option value="ciclo">Todo el ciclo escolar</option>
        <option value="semana">Semanal</option>
        <option value="personalizado">Personalizado</option>
      </select>

      <div id="fechasPersonalizadasEstadisticas" class="oculto">
        <div class="resumen-estadistico__fechas">
          <label>
            <span class="resumen-estadistico__etiqueta">Fecha inicial</span>
            <input id="fechaInicialEstadisticas" class="resumen-estadistico__fecha" type="date">
          </label>
          <label>
            <span class="resumen-estadistico__etiqueta">Fecha final</span>
            <input id="fechaFinalEstadisticas" class="resumen-estadistico__fecha" type="date">
          </label>
        </div>
        <button id="btnAplicarPeriodoEstadisticas" class="resumen-estadistico__aplicar" type="button">Aplicar período</button>
      </div>
      <p id="leyendaPeriodoEstadisticas" class="resumen-estadistico__leyenda-periodo">Período seleccionado: todo el ciclo escolar.</p>
    </section>

    <section class="resumen-estadistico__contenido" aria-live="polite">
      <p class="resumen-estadistico__aviso">Vista de diseño. Los valores se conectarán con Apps Script en la siguiente fase.</p>

      <section class="bloque-estadistico bloque-estadistico--asistencia">
        <h3 class="bloque-estadistico__titulo">🟢 Asistencia</h3>
        <div class="estadisticas-dos-columnas">
          <div class="estadistica-simple"><span>Total de presentes</span><strong>0</strong></div>
          <div class="estadistica-simple"><span>Total de faltas</span><strong>0</strong></div>
        </div>
      </section>

      <section class="bloque-estadistico bloque-estadistico--tareas">
        <h3 class="bloque-estadistico__titulo">🟡 Tareas</h3>
        <div class="estadisticas-dos-columnas">
          <div class="estadistica-simple"><span>Entregadas</span><strong>0</strong></div>
          <div class="estadistica-simple"><span>No entregadas</span><strong>0</strong></div>
          <div class="estadistica-simple"><span>Incompletas</span><strong>0</strong></div>
          <div class="estadistica-simple"><span>Cumplimiento</span><strong>0%</strong></div>
        </div>
        <div class="progreso-estadistico">
          <div class="progreso-estadistico__cabecera"><span>Porcentaje de cumplimiento</span><strong>0%</strong></div>
          <div class="progreso-estadistico__pista"><div class="progreso-estadistico__barra" style="width:0%"></div></div>
        </div>
      </section>

      <section class="bloque-estadistico bloque-estadistico--participacion">
        <h3 class="bloque-estadistico__titulo">🔵 Participaciones</h3>
        <div class="participaciones-lista">
          ${crearProgresoParticipacion('Lenguajes')}
          ${crearProgresoParticipacion('Saberes y Pensamiento Científico')}
          ${crearProgresoParticipacion('Ética, Naturaleza y Sociedad')}
          ${crearProgresoParticipacion('De lo Humano a lo Comunitario')}
        </div>
        <div class="estadistica-simple" style="margin-top:14px"><span>Total de participaciones</span><strong>0</strong></div>
      </section>

      <section class="bloque-estadistico bloque-estadistico--conducta">
        <h3 class="bloque-estadistico__titulo">🟣 Conducta</h3>
        <div class="conducta-lista">
          ${crearRenglonEstadistico('Buenas conductas')}
          ${crearRenglonEstadistico('Llamadas de atención')}
          ${crearRenglonEstadistico('Tarjetas amarillas')}
          ${crearRenglonEstadistico('Tarjetas rojas')}
        </div>
      </section>

      <section class="bloque-estadistico bloque-estadistico--lectura">
        <h3 class="bloque-estadistico__titulo">🟠 Lectura</h3>
        <div class="lectura-lista">
          ${crearRenglonEstadistico('Requiere apoyo')}
          ${crearRenglonEstadistico('Se acerca al estándar')}
          ${crearRenglonEstadistico('Estándar')}
          ${crearRenglonEstadistico('Avanzado')}
        </div>
        <div class="estadistica-simple" style="margin-top:14px"><span>Total de registros de lectura</span><strong>0</strong></div>
      </section>
    </section>`;

  if (contenedorPrincipal && vistaEscaner) {
    contenedorPrincipal.insertBefore(vistaResumen, vistaEscaner);
  } else if (contenedorPrincipal) {
    contenedorPrincipal.appendChild(vistaResumen);
  }

  const botonAbrir = document.getElementById('btnMenuLateral');
  const botonCerrar = document.getElementById('btnCerrarMenuLateral');
  const menu = document.getElementById('menuLateral');
  const fondo = document.getElementById('fondoMenuLateral');
  const opcionInicio = document.getElementById('menuInicio');
  const opcionHistorial = document.getElementById('menuHistorial');
  const opcionResumen = document.getElementById('menuResumenEstadistico');
  const botonCerrarResumen = document.getElementById('btnCerrarResumenEstadistico');
  const selectorPeriodo = document.getElementById('periodoResumenEstadistico');
  const fechasPersonalizadas = document.getElementById('fechasPersonalizadasEstadisticas');
  const leyendaPeriodo = document.getElementById('leyendaPeriodoEstadisticas');
  const buscadorEstadisticas = document.getElementById('busquedaAlumnoEstadisticas');
  const listaEstadisticas = document.getElementById('listaAlumnosEstadisticas');
  const contadorEstadisticas = document.getElementById('contadorAlumnosEstadisticas');

  let alumnosEstadisticas = [];
  let alumnosEstadisticasCargados = false;
  let ultimaSolicitudAlumnosEstadisticas = 0;

  if (disparadorHistorial) disparadorHistorial.classList.add('menu-disparador-oculto');

  function crearProgresoParticipacion(nombre) {
    return `<div class="progreso-estadistico"><div class="progreso-estadistico__cabecera"><span>${nombre}</span><strong>0</strong></div><div class="progreso-estadistico__pista"><div class="progreso-estadistico__barra" style="width:0%"></div></div></div>`;
  }

  function crearRenglonEstadistico(nombre) {
    return `<div class="estadistica-renglon"><span>${nombre}</span><strong>0</strong></div>`;
  }

  function abrirMenu() {
    menu.classList.add('abierto');
    fondo.classList.add('visible');
    document.body.classList.add('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    botonCerrar.focus();
  }

  function cerrarMenu(devolverFoco = true) {
    menu.classList.remove('abierto');
    fondo.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (devolverFoco) botonAbrir.focus();
  }

  function marcarOpcionActiva(opcion) {
    menu.querySelectorAll('.menu-lateral__opcion').forEach((boton) => {
      boton.classList.toggle('activa', boton === opcion);
    });
  }

  function ocultarResumen() {
    vistaResumen.classList.add('oculto');
    if (vistaEscaner) vistaEscaner.classList.remove('oculto');
  }

  function mostrarInicio() {
    ocultarResumen();
    if (pantallaHistorial && !pantallaHistorial.classList.contains('oculto') && disparadorHistorial) {
      disparadorHistorial.click();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function mostrarResumen() {
    if (pantallaHistorial && !pantallaHistorial.classList.contains('oculto') && disparadorHistorial) {
      disparadorHistorial.click();
    }
    if (vistaEscaner) vistaEscaner.classList.add('oculto');
    vistaResumen.classList.remove('oculto');
    vistaResumen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    document.getElementById('alumnoEstadisticasSeleccionado')?.classList.add('oculto');
    buscadorEstadisticas.value = '';
    listaEstadisticas.classList.add('oculto');
    cargarAlumnosEstadisticas(true);
  }

  async function cargarAlumnosEstadisticas(forzar = false) {
    if ((alumnosEstadisticasCargados && !forzar) || typeof solicitarJSONP !== 'function') return;
    const numeroSolicitud = ++ultimaSolicitudAlumnosEstadisticas;
    contadorEstadisticas.textContent = 'Cargando alumnos...';
    try {
      const respuesta = await solicitarJSONP('obtenerAlumnos');
      if (respuesta && (respuesta.exito === false || respuesta.ok === false)) {
        throw new Error(respuesta.mensaje || 'No se pudieron cargar los alumnos.');
      }
      if (numeroSolicitud !== ultimaSolicitudAlumnosEstadisticas) return;
      alumnosEstadisticas = Array.isArray(respuesta.alumnos) ? respuesta.alumnos : [];
      alumnosEstadisticasCargados = true;
      contadorEstadisticas.textContent = 'Escribe un nombre para buscar.';
    } catch (error) {
      if (numeroSolicitud === ultimaSolicitudAlumnosEstadisticas) {
        contadorEstadisticas.textContent = error.message || 'No se pudieron cargar los alumnos.';
      }
    }
  }

  function textoNormalizado(valor) {
    return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  function nombreAlumno(alumno) {
    return String(alumno.nombreCompleto || [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno].filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
  }

  function gradoGrupoAlumno(alumno) {
    return [alumno.grado, alumno.grupo].filter(Boolean).join('° ') || 'Sin grado y grupo';
  }

  function escapar(valor) {
    return String(valor || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function buscarAlumnosEstadisticas() {
    const termino = textoNormalizado(buscadorEstadisticas.value);
    if (termino.length < 2) {
      listaEstadisticas.classList.add('oculto');
      contadorEstadisticas.textContent = 'Escribe al menos dos letras.';
      return;
    }

    const coincidencias = alumnosEstadisticas.filter((alumno) => textoNormalizado(nombreAlumno(alumno)).includes(termino));
    contadorEstadisticas.textContent = `${coincidencias.length} coincidencias`;
    listaEstadisticas.classList.remove('oculto');
    listaEstadisticas.innerHTML = coincidencias.length
      ? coincidencias.map((alumno) => `<button class="resumen-estadistico__alumno-opcion" type="button" data-id-alumno-estadisticas="${escapar(alumno.id)}"><strong>${escapar(nombreAlumno(alumno))}</strong><small>${escapar(gradoGrupoAlumno(alumno))}</small></button>`).join('')
      : '<div class="mensaje-lista">No se encontraron alumnos.</div>';

    listaEstadisticas.querySelectorAll('[data-id-alumno-estadisticas]').forEach((boton) => {
      boton.addEventListener('click', () => seleccionarAlumnoEstadisticas(boton.dataset.idAlumnoEstadisticas));
    });
  }

  function seleccionarAlumnoEstadisticas(id) {
    const alumno = alumnosEstadisticas.find((item) => String(item.id) === String(id));
    if (!alumno) return;
    document.getElementById('nombreAlumnoEstadisticas').textContent = nombreAlumno(alumno);
    document.getElementById('gradoGrupoAlumnoEstadisticas').textContent = gradoGrupoAlumno(alumno);
    document.getElementById('alumnoEstadisticasSeleccionado').classList.remove('oculto');
    listaEstadisticas.classList.add('oculto');
    buscadorEstadisticas.value = '';
    contadorEstadisticas.textContent = 'Alumno seleccionado.';
  }

  function actualizarPeriodo() {
    const valor = selectorPeriodo.value;
    fechasPersonalizadas.classList.toggle('oculto', valor !== 'personalizado');
    if (valor === 'ciclo') leyendaPeriodo.textContent = 'Período seleccionado: todo el ciclo escolar.';
    if (valor === 'semana') leyendaPeriodo.textContent = 'Período seleccionado: semana actual.';
    if (valor === 'personalizado') leyendaPeriodo.textContent = 'Selecciona la fecha inicial y la fecha final.';
  }

  botonAbrir.addEventListener('click', () => menu.classList.contains('abierto') ? cerrarMenu() : abrirMenu());
  botonCerrar.addEventListener('click', () => cerrarMenu());
  fondo.addEventListener('click', () => cerrarMenu());

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) cerrarMenu();
  });

  opcionInicio.addEventListener('click', () => {
    marcarOpcionActiva(opcionInicio);
    cerrarMenu(false);
    mostrarInicio();
  });

  if (disparadorHistorial) {
    opcionHistorial.addEventListener('click', () => {
      marcarOpcionActiva(opcionHistorial);
      cerrarMenu(false);
      ocultarResumen();
      const historialEstaOculto = !pantallaHistorial || pantallaHistorial.classList.contains('oculto');
      if (historialEstaOculto) disparadorHistorial.click();
      else pantallaHistorial.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  opcionResumen.addEventListener('click', () => {
    marcarOpcionActiva(opcionResumen);
    cerrarMenu(false);
    mostrarResumen();
  });

  botonCerrarResumen.addEventListener('click', () => {
    marcarOpcionActiva(opcionInicio);
    mostrarInicio();
  });

  selectorPeriodo.addEventListener('change', actualizarPeriodo);
  buscadorEstadisticas.addEventListener('input', buscarAlumnosEstadisticas);

  document.getElementById('btnAplicarPeriodoEstadisticas').addEventListener('click', () => {
    const inicio = document.getElementById('fechaInicialEstadisticas').value;
    const fin = document.getElementById('fechaFinalEstadisticas').value;
    leyendaPeriodo.textContent = inicio && fin
      ? `Período personalizado: ${inicio} a ${fin}.`
      : 'Selecciona ambas fechas para aplicar el período.';
  });
})();
