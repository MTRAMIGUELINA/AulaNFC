/* AulaNFC v3 - Resultados de examen por periodo y campo formativo. */
(() => {
  let alumnosExamen = [];
  let cargando = false;

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function nombreAlumno(a) {
    return String(
      a.nombreCompleto ||
      [a.nombre, a.apellidoPaterno, a.apellidoMaterno].filter(Boolean).join(' ')
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
          <p>Captura las calificaciones del grupo por periodo y campo formativo.</p>
        </div>
        <button id="btnCerrarResultadosExamen" class="resultados-examen__cerrar" type="button" aria-label="Cerrar">✕</button>
      </header>

      <section class="resultados-examen__filtros">
        <label>
          <span>Periodo de evaluación</span>
          <select id="periodoResultadosExamen">
            <option value="">Selecciona un periodo</option>
            <option value="Primer trimestre">Primer trimestre</option>
            <option value="Segundo trimestre">Segundo trimestre</option>
            <option value="Tercer trimestre">Tercer trimestre</option>
          </select>
        </label>

        <label>
          <span>Campo formativo</span>
          <select id="campoResultadosExamen">
            <option value="">Selecciona un campo</option>
            <option value="Lenguajes">Lenguajes</option>
            <option value="Saberes y Pensamiento Científico">Saberes y Pensamiento Científico</option>
            <option value="Ética, Naturaleza y Sociedad">Ética, Naturaleza y Sociedad</option>
            <option value="De lo Humano a lo Comunitario">De lo Humano a lo Comunitario</option>
          </select>
        </label>
      </section>

      <p id="estadoResultadosExamen" class="resultados-examen__estado">Selecciona el periodo y el campo formativo.</p>

      <section id="panelCalificacionesExamen" class="resultados-examen__panel oculto">
        <div class="resultados-examen__encabezado-lista">
          <div>
            <h3 id="tituloListaResultadosExamen">Lista de alumnos</h3>
            <p id="subtituloListaResultadosExamen"></p>
          </div>
          <span id="contadorResultadosExamen">0 alumnos</span>
        </div>

        <div class="resultados-examen__tabla-cabecera">
          <span>Alumno</span>
          <span>Calificación</span>
        </div>
        <div id="listaResultadosExamen" class="resultados-examen__lista"></div>

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
    if (alumnosExamen.length || cargando) return;
    cargando = true;
    const estado = document.getElementById('estadoResultadosExamen');
    estado.textContent = '⏳ Cargando alumnos...';
    try {
      const r = await solicitarJSONP('obtenerAlumnos');
      if (!r || r.ok === false || r.exito === false) throw new Error(r?.mensaje || 'No se pudieron cargar los alumnos.');
      alumnosExamen = (Array.isArray(r.alumnos) ? r.alumnos : [])
        .filter((a) => a.activo !== false)
        .sort((a, b) => nombreAlumno(a).localeCompare(nombreAlumno(b), 'es', { sensitivity: 'base' }));
      estado.textContent = 'Selecciona el periodo y el campo formativo.';
      intentarCargarResultados();
    } catch (e) {
      estado.textContent = `❌ ${e?.message || 'No se pudieron cargar los alumnos.'}`;
    } finally {
      cargando = false;
    }
  }

  async function intentarCargarResultados() {
    const periodo = document.getElementById('periodoResultadosExamen')?.value || '';
    const campo = document.getElementById('campoResultadosExamen')?.value || '';
    const panel = document.getElementById('panelCalificacionesExamen');
    const estado = document.getElementById('estadoResultadosExamen');

    if (!periodo || !campo) {
      panel?.classList.add('oculto');
      estado.textContent = 'Selecciona el periodo y el campo formativo.';
      return;
    }

    if (!alumnosExamen.length) {
      await cargarAlumnos();
      if (!alumnosExamen.length) return;
    }

    estado.textContent = '⏳ Cargando calificaciones...';
    try {
      const r = await solicitarJSONP('obtenerresultadosexamen', {
        periodo,
        campoFormativo: campo
      });
      if (!r || r.ok === false || r.exito === false) throw new Error(r?.mensaje || 'No fue posible consultar las calificaciones.');
      const existentes = Array.isArray(r.resultados) ? r.resultados : [];
      renderizarLista(existentes, periodo, campo);
      panel.classList.remove('oculto');
      estado.textContent = existentes.length
        ? `✅ Se recuperaron ${existentes.length} calificaciones guardadas.`
        : 'Captura las calificaciones y presiona Guardar.';
    } catch (e) {
      panel?.classList.add('oculto');
      estado.textContent = `❌ ${e?.message || 'No fue posible consultar las calificaciones.'}`;
    }
  }

  function renderizarLista(existentes, periodo, campo) {
    const mapa = {};
    existentes.forEach((r) => { mapa[String(r.idAlumno || '').trim()] = String(r.calificacion || '').trim(); });

    document.getElementById('tituloListaResultadosExamen').textContent = campo;
    document.getElementById('subtituloListaResultadosExamen').textContent = periodo;
    document.getElementById('contadorResultadosExamen').textContent = `${alumnosExamen.length} alumnos`;

    document.getElementById('listaResultadosExamen').innerHTML = alumnosExamen.map((a, i) => {
      const id = String(a.id || '').trim();
      const valor = mapa[id] ?? '';
      const nombre = nombreAlumno(a);
      return `<label class="resultado-examen-alumno">
        <span class="resultado-examen-alumno__numero">${i + 1}</span>
        <span class="resultado-examen-alumno__datos">
          <strong>${esc(nombre)}</strong>
          <small>${esc(String(a.grado || ''))}° · Grupo ${esc(String(a.grupo || ''))} · ID ${esc(id)}</small>
        </span>
        <input class="resultado-examen-alumno__calificacion" type="number" inputmode="decimal" min="0" max="10" step="0.1" placeholder="—" value="${esc(valor)}" data-id="${esc(id)}" aria-label="Calificación de ${esc(nombre)}">
      </label>`;
    }).join('');
  }

  async function guardar() {
    const periodo = document.getElementById('periodoResultadosExamen')?.value || '';
    const campo = document.getElementById('campoResultadosExamen')?.value || '';
    const estado = document.getElementById('estadoResultadosExamen');
    const boton = document.getElementById('btnGuardarResultadosExamen');
    const inputs = [...document.querySelectorAll('.resultado-examen-alumno__calificacion')];

    const invalidos = inputs.filter((input) => {
      if (input.value === '') return false;
      const n = Number(input.value);
      return !Number.isFinite(n) || n < 0 || n > 10;
    });
    if (invalidos.length) {
      estado.textContent = '❌ Las calificaciones deben estar entre 0 y 10.';
      invalidos[0].focus();
      return;
    }

    const resultados = inputs
      .filter((input) => String(input.value).trim() !== '')
      .map((input) => {
        const alumno = alumnosExamen.find((a) => String(a.id) === String(input.dataset.id));
        return {
          idAlumno: String(alumno?.id || '').trim(),
          nombre: nombreAlumno(alumno || {}),
          grado: String(alumno?.grado || '').trim(),
          grupo: String(alumno?.grupo || '').trim(),
          calificacion: String(input.value).trim()
        };
      });

    if (!resultados.length) {
      estado.textContent = '❌ Captura al menos una calificación.';
      return;
    }

    boton.disabled = true;
    estado.textContent = '⏳ Guardando calificaciones...';
    try {
      const r = await solicitarJSONP('guardarresultadosexamen', {
        periodo,
        campoFormativo: campo,
        resultados: JSON.stringify(resultados)
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

    document.getElementById('periodoResultadosExamen').addEventListener('change', intentarCargarResultados);
    document.getElementById('campoResultadosExamen').addEventListener('change', intentarCargarResultados);
    document.getElementById('btnGuardarResultadosExamen').addEventListener('click', guardar);

    ['menuInicio', 'menuHistorial', 'menuResumenEstadistico'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', ocultarVista);
    });
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', esperarBase)
    : esperarBase();
})();
