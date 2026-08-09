/* AulaNFC v3 - Resultados de examen por alumno y trimestre. */
(() => {
  let alumnosExamen = [];
  let alumnoSeleccionado = null;
  let cargandoAlumnos = false;

  const CAMPOS = [
    'Lenguajes',
    'Saberes y Pensamiento Científico',
    'Ética, Naturaleza y Sociedad',
    'De lo Humano a lo Comunitario'
  ];

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalizar = (v) => String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  function nombreAlumno(a) {
    return String(
      a?.nombreCompleto ||
      [a?.nombre, a?.apellidoPaterno, a?.apellidoMaterno].filter(Boolean).join(' ')
    ).replace(/\s+/g, ' ').trim();
  }

  function esperarBase() {
    const menu = document.getElementById('menuLateral');
    const nav = menu?.querySelector('.menu-lateral__navegacion');
    const contenedor = document.querySelector('.contenedor');
    if (!menu || !nav || !contenedor || typeof solicitarJSONP !== 'function') {
      setTimeout(esperarBase, 120);
      return;
    }
    if (document.getElementById('menuResultadosExamen')) return;
    crearBotonMenu(nav);
    crearVista(contenedor);
    conectarEventos();
  }

  function crearBotonMenu(nav) {
    const boton = document.createElement('button');
    boton.id = 'menuResultadosExamen';
    boton.className = 'menu-lateral__opcion';
    boton.type = 'button';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">📝</span><span>Resultados de examen</span>';
    nav.appendChild(boton);
  }

  function crearVista(contenedor) {
    const vista = document.createElement('section');
    vista.id = 'vistaResultadosExamen';
    vista.className = 'resultados-examen oculto';
    vista.innerHTML = `
      <header class="resultados-examen__cabecera">
        <div>
          <h2>📝 Resultados de examen</h2>
          <p>Selecciona un trimestre y un alumno para capturar sus cuatro campos formativos.</p>
        </div>
        <button id="btnCerrarResultadosExamen" class="resultados-examen__cerrar" type="button" aria-label="Cerrar">✕</button>
      </header>

      <section class="resultados-examen__filtros">
        <label>
          <span>Trimestre</span>
          <select id="periodoResultadosExamen">
            <option value="">Selecciona un trimestre</option>
            <option value="Primer trimestre">Primer trimestre</option>
            <option value="Segundo trimestre">Segundo trimestre</option>
            <option value="Tercer trimestre">Tercer trimestre</option>
          </select>
        </label>
      </section>

      <section class="resultados-examen__filtros">
        <label style="grid-column:1/-1">
          <span>Buscar alumno</span>
          <input id="busquedaAlumnoResultadosExamen" type="search" placeholder="Escribe al menos dos letras..." autocomplete="off">
        </label>
      </section>

      <p id="estadoResultadosExamen" class="resultados-examen__estado">Selecciona un trimestre y busca un alumno.</p>
      <div id="listaBusquedaResultadosExamen" class="resultados-examen__lista oculto"></div>

      <section id="panelCalificacionesExamen" class="resultados-examen__panel oculto">
        <div class="resultados-examen__encabezado-lista">
          <div>
            <h3 id="nombreAlumnoResultadosExamen">Alumno</h3>
            <p id="datosAlumnoResultadosExamen"></p>
          </div>
          <span id="trimestreAlumnoResultadosExamen"></span>
        </div>

        <div id="camposResultadosExamen" class="resultados-examen__lista"></div>

        <div class="resultados-examen__acciones">
          <button id="btnGuardarResultadosExamen" type="button">💾 Guardar calificaciones</button>
        </div>
      </section>`;

    const vistaEscaner = document.getElementById('vistaEscaner');
    if (vistaEscaner) contenedor.insertBefore(vista, vistaEscaner);
    else contenedor.appendChild(vista);
  }

  function ocultarVista() {
    document.getElementById('vistaResultadosExamen')?.classList.add('oculto');
  }

  function cerrarHistorialSiAbierto() {
    const historial = document.getElementById('pantallaHistorial');
    const disparador = document.getElementById('btnAbrirHistorial');
    if (historial && !historial.classList.contains('oculto') && disparador) disparador.click();
  }

  function mostrarVista() {
    cerrarHistorialSiAbierto();
    document.getElementById('vistaEscaner')?.classList.add('oculto');
    document.getElementById('vistaResumenEstadistico')?.classList.add('oculto');
    const vista = document.getElementById('vistaResultadosExamen');
    vista?.classList.remove('oculto');
    vista?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    cargarAlumnos();
  }

  function marcarActivo() {
    const menu = document.getElementById('menuLateral');
    const boton = document.getElementById('menuResultadosExamen');
    menu?.querySelectorAll('.menu-lateral__opcion').forEach((b) => b.classList.toggle('activa', b === boton));
  }

  function cerrarMenu() {
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded', 'false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden', 'true');
  }

  async function cargarAlumnos() {
    if (alumnosExamen.length || cargandoAlumnos) return;
    cargandoAlumnos = true;
    const estado = document.getElementById('estadoResultadosExamen');
    estado.textContent = '⏳ Cargando alumnos...';
    try {
      const r = await solicitarJSONP('obtenerAlumnos');
      if (!r || r.ok === false || r.exito === false) throw new Error(r?.mensaje || 'No se pudieron cargar los alumnos.');
      alumnosExamen = (Array.isArray(r.alumnos) ? r.alumnos : [])
        .filter((a) => a.activo !== false)
        .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b), 'es', { sensitivity: 'base' }));
      estado.textContent = 'Selecciona un trimestre y busca un alumno.';
    } catch (e) {
      estado.textContent = `❌ ${e?.message || 'No se pudieron cargar los alumnos.'}`;
    } finally {
      cargandoAlumnos = false;
    }
  }

  function buscarAlumnos() {
    const termino = normalizar(document.getElementById('busquedaAlumnoResultadosExamen')?.value || '');
    const lista = document.getElementById('listaBusquedaResultadosExamen');
    const estado = document.getElementById('estadoResultadosExamen');
    document.getElementById('panelCalificacionesExamen')?.classList.add('oculto');
    alumnoSeleccionado = null;

    if (termino.length < 2) {
      lista.classList.add('oculto');
      lista.innerHTML = '';
      estado.textContent = 'Escribe al menos dos letras para buscar.';
      return;
    }

    const coincidencias = alumnosExamen.filter((a) => normalizar(nombreAlumno(a)).includes(termino));
    lista.classList.remove('oculto');
    lista.innerHTML = coincidencias.length
      ? coincidencias.map((a) => `<button type="button" class="resultado-examen-alumno" data-id-alumno-examen="${esc(a.id)}"><span class="resultado-examen-alumno__datos"><strong>${esc(nombreAlumno(a))}</strong><small>${esc(String(a.grado || ''))}° · Grupo ${esc(String(a.grupo || ''))} · ID ${esc(String(a.id || ''))}</small></span></button>`).join('')
      : '<div class="mensaje-lista">No se encontraron alumnos.</div>';
    estado.textContent = `${coincidencias.length} coincidencia(s).`;

    lista.querySelectorAll('[data-id-alumno-examen]').forEach((b) => {
      b.addEventListener('click', () => seleccionarAlumno(b.dataset.idAlumnoExamen));
    });
  }

  async function seleccionarAlumno(id) {
    const periodo = document.getElementById('periodoResultadosExamen')?.value || '';
    const estado = document.getElementById('estadoResultadosExamen');
    if (!periodo) {
      estado.textContent = '❌ Primero selecciona el trimestre.';
      document.getElementById('periodoResultadosExamen')?.focus();
      return;
    }

    alumnoSeleccionado = alumnosExamen.find((a) => String(a.id) === String(id)) || null;
    if (!alumnoSeleccionado) return;

    document.getElementById('listaBusquedaResultadosExamen')?.classList.add('oculto');
    document.getElementById('busquedaAlumnoResultadosExamen').value = '';
    document.getElementById('nombreAlumnoResultadosExamen').textContent = nombreAlumno(alumnoSeleccionado);
    document.getElementById('datosAlumnoResultadosExamen').textContent = `${alumnoSeleccionado.grado || ''}° · Grupo ${alumnoSeleccionado.grupo || ''} · ID ${alumnoSeleccionado.id || ''}`;
    document.getElementById('trimestreAlumnoResultadosExamen').textContent = periodo;
    document.getElementById('panelCalificacionesExamen').classList.remove('oculto');

    renderizarCampos([]);
    estado.textContent = '⏳ Cargando calificaciones del alumno...';

    try {
      const r = await solicitarJSONP('obtenerresultadosexamen', {
        periodo,
        idAlumno: String(alumnoSeleccionado.id || '').trim()
      });
      if (!r || r.ok === false || r.exito === false) throw new Error(r?.mensaje || 'No fue posible consultar las calificaciones.');
      const existentes = Array.isArray(r.resultados) ? r.resultados : [];
      renderizarCampos(existentes);
      estado.textContent = existentes.length
        ? '✅ Se recuperaron las calificaciones guardadas de este alumno.'
        : 'Captura las calificaciones de los cuatro campos formativos.';
    } catch (e) {
      estado.textContent = `❌ ${e?.message || 'No fue posible consultar las calificaciones.'}`;
    }
  }

  function renderizarCampos(existentes) {
    const mapa = {};
    existentes.forEach((r) => {
      mapa[String(r.campoFormativo || '').trim()] = String(r.calificacion || '').trim();
    });

    document.getElementById('camposResultadosExamen').innerHTML = CAMPOS.map((campo, i) => `
      <label class="resultado-examen-alumno">
        <span class="resultado-examen-alumno__numero">${i + 1}</span>
        <span class="resultado-examen-alumno__datos"><strong>${esc(campo)}</strong></span>
        <input class="resultado-examen-alumno__calificacion" type="number" inputmode="decimal" min="0" max="10" step="0.1" placeholder="—" value="${esc(mapa[campo] ?? '')}" data-campo="${esc(campo)}" aria-label="Calificación de ${esc(campo)}">
      </label>`).join('');
  }

  function cambiarTrimestre() {
    document.getElementById('panelCalificacionesExamen')?.classList.add('oculto');
    document.getElementById('listaBusquedaResultadosExamen')?.classList.add('oculto');
    document.getElementById('busquedaAlumnoResultadosExamen').value = '';
    alumnoSeleccionado = null;
    const periodo = document.getElementById('periodoResultadosExamen')?.value || '';
    document.getElementById('estadoResultadosExamen').textContent = periodo
      ? 'Busca y selecciona un alumno.'
      : 'Selecciona un trimestre y busca un alumno.';
  }

  async function guardar() {
    const periodo = document.getElementById('periodoResultadosExamen')?.value || '';
    const estado = document.getElementById('estadoResultadosExamen');
    const boton = document.getElementById('btnGuardarResultadosExamen');

    if (!periodo || !alumnoSeleccionado) {
      estado.textContent = '❌ Selecciona el trimestre y un alumno.';
      return;
    }

    const inputs = [...document.querySelectorAll('#camposResultadosExamen .resultado-examen-alumno__calificacion')];
    const invalidos = inputs.filter((input) => {
      if (String(input.value).trim() === '') return false;
      const n = Number(input.value);
      return !Number.isFinite(n) || n < 0 || n > 10;
    });
    if (invalidos.length) {
      estado.textContent = '❌ Las calificaciones deben estar entre 0 y 10.';
      invalidos[0].focus();
      return;
    }

    const calificaciones = inputs
      .filter((input) => String(input.value).trim() !== '')
      .map((input) => ({
        campoFormativo: String(input.dataset.campo || '').trim(),
        calificacion: String(input.value).trim()
      }));

    if (!calificaciones.length) {
      estado.textContent = '❌ Captura al menos una calificación.';
      return;
    }

    boton.disabled = true;
    estado.textContent = '⏳ Guardando calificaciones...';
    try {
      const r = await solicitarJSONP('guardarresultadosexamen', {
        periodo,
        idAlumno: String(alumnoSeleccionado.id || '').trim(),
        nombre: nombreAlumno(alumnoSeleccionado),
        grado: String(alumnoSeleccionado.grado || '').trim(),
        grupo: String(alumnoSeleccionado.grupo || '').trim(),
        calificaciones: JSON.stringify(calificaciones)
      });
      if (!r || r.ok === false || r.exito === false) throw new Error(r?.mensaje || 'No fue posible guardar las calificaciones.');
      estado.textContent = `✅ ${r.mensaje || 'Calificaciones guardadas correctamente.'}`;
    } catch (e) {
      estado.textContent = `❌ ${e?.message || 'No fue posible guardar las calificaciones.'}`;
    } finally {
      boton.disabled = false;
    }
  }

  function conectarEventos() {
    document.getElementById('menuResultadosExamen').addEventListener('click', () => {
      marcarActivo();
      cerrarMenu();
      mostrarVista();
    });

    document.getElementById('btnCerrarResultadosExamen').addEventListener('click', () => {
      ocultarVista();
      document.getElementById('vistaEscaner')?.classList.remove('oculto');
      const inicio = document.getElementById('menuInicio');
      document.getElementById('menuLateral')?.querySelectorAll('.menu-lateral__opcion').forEach((b) => b.classList.toggle('activa', b === inicio));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('periodoResultadosExamen').addEventListener('change', cambiarTrimestre);
    document.getElementById('busquedaAlumnoResultadosExamen').addEventListener('input', buscarAlumnos);
    document.getElementById('btnGuardarResultadosExamen').addEventListener('click', guardar);

    ['menuInicio', 'menuHistorial', 'menuResumenEstadistico'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', ocultarVista);
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', esperarBase)
    : esperarBase();
})();
