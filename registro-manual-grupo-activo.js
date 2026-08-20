/* AulaNFC v3.1 - Registro manual limitado al grado/grupo configurado. */
(() => {
  let alumnosGrupoActivo = [];
  let respaldoAlumnos = null;
  let respaldoAlumnosCargados = false;
  let sesionManualGrupoActiva = false;
  let versionSesionManual = 0;

  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const normalizar = (v) => String(v || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const nombre = (a) => String(
    a?.nombreCompleto ||
    [a?.nombre, a?.apellidoPaterno, a?.apellidoMaterno]
      .filter(Boolean)
      .join(' ') ||
    'Alumno'
  ).replace(/\s+/g, ' ').trim();

  const gradoGrupoLocal = (a) => {
    const grado = String(a?.grado || '').trim();
    const grupo = String(a?.grupo || '').trim();
    return grado && grupo
      ? `${grado} · Grupo ${grupo}`
      : grado || grupo || 'Sin grado y grupo';
  };

  const inicialesLocal = (texto) => {
    const partes = String(texto || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    return partes.length > 1
      ? (partes[0][0] + partes[1][0]).toUpperCase()
      : (partes[0] || 'AL').slice(0, 2).toUpperCase();
  };

  function respaldarListaGlobal() {
    if (sesionManualGrupoActiva) return;
    respaldoAlumnos = Array.isArray(alumnos) ? alumnos.slice() : [];
    respaldoAlumnosCargados = !!alumnosCargados;
    versionSesionManual += 1;
    sesionManualGrupoActiva = true;
  }

  function restaurarListaGlobal() {
    if (!sesionManualGrupoActiva) return;
    alumnos = Array.isArray(respaldoAlumnos) ? respaldoAlumnos : [];
    alumnosCargados = respaldoAlumnosCargados;
    respaldoAlumnos = null;
    respaldoAlumnosCargados = false;
    sesionManualGrupoActiva = false;
    versionSesionManual += 1;
  }

  async function cargarGrupoActivo() {
    const versionSolicitud = versionSesionManual;
    const respuesta = await solicitarJSONP('obteneralumnosgrupoactivo');
    validarRespuesta(respuesta);

    if (!sesionManualGrupoActiva || versionSolicitud !== versionSesionManual) {
      return null;
    }

    alumnosGrupoActivo = Array.isArray(respuesta.alumnos)
      ? respuesta.alumnos
      : [];

    // El flujo actual de guardado manual busca al alumno en la variable global.
    // Durante el panel manual la sustituimos temporalmente y la restauramos al cerrar.
    alumnos = alumnosGrupoActivo.slice();

    return respuesta;
  }

  async function abrirManualGrupoActivo(evento) {
    evento.preventDefault();
    evento.stopImmediatePropagation();

    if (!validarModulo()) return;

    const panel = document.getElementById('panelRegistroManual');
    const contador = document.getElementById('contadorManual');
    const buscador = document.getElementById('campoBusquedaManual');
    const lista = document.getElementById('listaManual');
    const seleccionado = document.getElementById('alumnoManualSeleccionado');
    const guardar = document.getElementById('btnGuardarManual');

    respaldarListaGlobal();
    const versionApertura = versionSesionManual;

    panel?.classList.remove('oculto');
    alumnoManualId = '';
    if (buscador) buscador.value = '';
    lista?.classList.add('oculto');
    seleccionado?.classList.add('oculto');
    if (guardar) guardar.disabled = true;
    if (contador) contador.textContent = '⏳ Cargando alumnos del grupo configurado...';

    try {
      const respuesta = await cargarGrupoActivo();
      if (!respuesta || !sesionManualGrupoActiva || versionApertura !== versionSesionManual) return;
      const grado = String(respuesta.grado || '').trim();
      const grupo = String(respuesta.grupo || '').trim();

      if (contador) {
        contador.textContent = alumnosGrupoActivo.length
          ? `${alumnosGrupoActivo.length} alumnos activos de ${grado}° ${grupo}. Escribe un nombre para buscar.`
          : `No hay alumnos activos registrados en ${grado}° ${grupo}.`;
      }

      buscador?.focus();
    } catch (error) {
      if (!sesionManualGrupoActiva || versionApertura !== versionSesionManual) return;
      if (contador) contador.textContent = error.message || 'No fue posible cargar el grupo configurado.';
      alumnosGrupoActivo = [];
      alumnos = [];
    }
  }

  function buscarManualGrupoActivo(evento) {
    evento.stopImmediatePropagation();

    const texto = normalizar(evento.target?.value || '');
    const lista = document.getElementById('listaManual');
    const contador = document.getElementById('contadorManual');
    const seleccionado = document.getElementById('alumnoManualSeleccionado');
    const guardar = document.getElementById('btnGuardarManual');

    alumnoManualId = '';
    if (guardar) guardar.disabled = true;
    seleccionado?.classList.add('oculto');

    if (texto.length < 2) {
      lista?.classList.add('oculto');
      if (contador) contador.textContent = 'Escribe al menos dos letras.';
      return;
    }

    const filtrados = alumnosGrupoActivo.filter((a) =>
      normalizar(nombre(a)).includes(texto)
    );

    if (contador) contador.textContent = `${filtrados.length} coincidencias`;
    if (!lista) return;

    lista.classList.remove('oculto');
    lista.innerHTML = filtrados.length
      ? filtrados.map((a) => {
          const nom = nombre(a);
          return `<button class="alumno-item" type="button" data-manual-grupo-id="${esc(a.id)}"><span class="avatar-pequeno">${esc(inicialesLocal(nom))}</span><span><strong>${esc(nom)}</strong><small>${esc(gradoGrupoLocal(a))}</small></span></button>`;
        }).join('')
      : '<div class="mensaje-lista">No se encontraron alumnos del grupo configurado.</div>';

    lista.querySelectorAll('[data-manual-grupo-id]').forEach((boton) => {
      boton.addEventListener('click', () => {
        const id = String(boton.dataset.manualGrupoId || '');
        const alumno = alumnosGrupoActivo.find((a) => String(a.id) === id);
        if (!alumno) return;

        alumnoManualId = id;
        if (seleccionado) {
          seleccionado.innerHTML = `<strong>Alumno seleccionado:</strong><br>${esc(nombre(alumno))}<br><small>${esc(gradoGrupoLocal(alumno))}</small>`;
          seleccionado.classList.remove('oculto');
        }
        if (guardar) guardar.disabled = false;
      });
    });
  }

  function inicializar() {
    const boton = document.getElementById('btnBuscarManual');
    const buscador = document.getElementById('campoBusquedaManual');
    const panel = document.getElementById('panelRegistroManual');

    if (!boton || !buscador || !panel) return false;
    if (boton.dataset.grupoActivoManual === 'true') return true;

    boton.dataset.grupoActivoManual = 'true';

    // Captura antes de los listeners originales de script.js.
    boton.addEventListener('click', abrirManualGrupoActivo, true);
    buscador.addEventListener('input', buscarManualGrupoActivo, true);

    // Al cerrarse el panel (botón cerrar o registro exitoso), recuperamos
    // la lista general para Historial y otras consultas.
    new MutationObserver(() => {
      if (panel.classList.contains('oculto')) {
        restaurarListaGlobal();
      }
    }).observe(panel, { attributes: true, attributeFilter: ['class'] });

    return true;
  }

  if (inicializar()) return;
  const observador = new MutationObserver(() => {
    if (inicializar()) observador.disconnect();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true });
})();
