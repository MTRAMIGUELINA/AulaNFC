/* AulaNFC - Catálogo de actividades del módulo Tareas. */
(() => {
  const NUEVA = '__nueva__';
  let actividades = [];
  let cargando = null;

  const elemento = (id) => document.getElementById(id);

  function fechaLocalActual() {
    const ahora = new Date();
    return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
  }

  function claveActividad(actividad) {
    return `${String(actividad.titulo || '').trim()}\u0000${String(actividad.fechaActividad || '').trim()}`;
  }

  function etiquetaActividad(actividad) {
    const partes = String(actividad.fechaActividad || '').split('-');
    const fecha = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : actividad.fechaActividad;
    return `${actividad.titulo} · ${fecha || 'Sin fecha'}`;
  }

  function renderizarActividades(seleccion) {
    const select = elemento('actividadTarea');
    if (!select) return;
    const valor = seleccion || select.value;
    select.replaceChildren(new Option('Selecciona una actividad', ''));
    actividades.forEach((actividad) => {
      const opcion = new Option(etiquetaActividad(actividad), claveActividad(actividad));
      opcion.dataset.titulo = actividad.titulo;
      opcion.dataset.fechaActividad = actividad.fechaActividad;
      select.add(opcion);
    });
    select.value = valor;
  }

  async function cargarActividades(forzar = false) {
    if (cargando && !forzar) return cargando;
    const estado = elemento('estadoActividadesTarea');
    if (estado) estado.textContent = 'Cargando actividades…';
    cargando = window.solicitarJSONP('obtenerActividadesTareas')
      .then((respuesta) => {
        if (!respuesta || (respuesta.ok !== true && respuesta.exito !== true)) {
          throw new Error(respuesta?.mensaje || 'No se pudieron obtener las actividades.');
        }
        actividades = Array.isArray(respuesta.actividades) ? respuesta.actividades : [];
        renderizarActividades();
        if (estado) estado.textContent = actividades.length ? '' : 'Aún no hay actividades registradas.';
      })
      .catch((error) => {
        if (estado) estado.textContent = `No se pudo cargar el catálogo: ${error.message}`;
      })
      .finally(() => { cargando = null; });
    return cargando;
  }

  function alternarNuevaActividad(mostrar) {
    const campos = elemento('camposNuevaActividad');
    const boton = elemento('btnNuevaActividadTarea');
    if (!campos || !boton) return;
    campos.classList.toggle('oculto', !mostrar);
    boton.setAttribute('aria-expanded', String(mostrar));
    boton.textContent = mostrar ? 'Cancelar nueva actividad' : '+ Nueva actividad';
    if (mostrar) {
      elemento('actividadTarea').value = '';
      if (!elemento('fechaActividadTarea').value) elemento('fechaActividadTarea').value = fechaLocalActual();
      elemento('tituloActividadTarea').focus();
    }
  }

  function actividadElegida() {
    const select = elemento('actividadTarea');
    const opcion = select?.selectedOptions?.[0];
    if (!opcion || !select.value) return null;
    return { titulo: opcion.dataset.titulo || '', fechaActividad: opcion.dataset.fechaActividad || '' };
  }

  function datosActividad() {
    if (!elemento('camposNuevaActividad').classList.contains('oculto')) {
      return {
        titulo: String(elemento('tituloActividadTarea').value || '').trim(),
        fechaActividad: String(elemento('fechaActividadTarea').value || '').trim(),
        nueva: true
      };
    }
    return { ...(actividadElegida() || {}), nueva: false };
  }

  function conectar() {
    const boton = elemento('btnNuevaActividadTarea');
    if (!boton || boton.dataset.conectado) return false;
    boton.dataset.conectado = 'true';
    elemento('fechaActividadTarea').value = fechaLocalActual();
    boton.addEventListener('click', () => alternarNuevaActividad(elemento('camposNuevaActividad').classList.contains('oculto')));
    elemento('actividadTarea').addEventListener('change', () => {
      if (elemento('actividadTarea').value) alternarNuevaActividad(false);
    });

    const construirOriginal = window.construirParametrosRegistro;
    window.construirParametrosRegistro = function(base) {
      const parametros = construirOriginal(base);
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'tareas') {
        const actividad = datosActividad();
        const tipoTarea = String(elemento('tipoTarea')?.value || '').trim();
        parametros.actividad = actividad.titulo || '';
        parametros.fechaActividad = actividad.fechaActividad || '';
        parametros.tipoRegistro = tipoTarea;
        parametros.tipoParticipacion = tipoTarea;
        parametros.tipoTarea = tipoTarea;
        parametros.resultadoTarea = tipoTarea;
      }
      return parametros;
    };

    const validarOriginal = window.validarModulo;
    window.validarModulo = function() {
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'tareas') {
        const actividad = datosActividad();
        if (!actividad.titulo || !actividad.fechaActividad) {
          elemento('estado').textContent = actividad.nueva
            ? '❌ Escribe el título y la fecha de la actividad.'
            : '❌ Selecciona una actividad o crea una nueva.';
          (actividad.nueva ? elemento('tituloActividadTarea') : elemento('actividadTarea')).focus();
          return false;
        }
        const tipoTarea = String(elemento('tipoTarea')?.value || '').trim();
        if (!tipoTarea) {
          elemento('estado').textContent = '❌ Selecciona el resultado de la tarea.';
          elemento('tipoTarea')?.focus();
          return false;
        }
      }
      return validarOriginal();
    };

    const confirmarOriginal = window.confirmarRegistro;
    window.confirmirmarRegistro = window.confirmarRegistro;
    window.confirmarRegistro = function(nombre, modulo, metodo) {
      confirmarOriginal(nombre, modulo, metodo);
      if (modulo === 'tareas') {
        const actividad = datosActividad();
        if (actividad.nueva && actividad.titulo && actividad.fechaActividad) {
          const nueva = { titulo: actividad.titulo, fechaActividad: actividad.fechaActividad };
          if (!actividades.some((item) => claveActividad(item) === claveActividad(nueva))) actividades.unshift(nueva);
          renderizarActividades(claveActividad(nueva));
          alternarNuevaActividad(false);
          elemento('tituloActividadTarea').value = '';
        }
      }
    };

    document.querySelector('[data-modulo="tareas"]')?.addEventListener('click', () => cargarActividades());
    return true;
  }

  if (!conectar()) {
    const observador = new MutationObserver(() => {
      if (conectar()) observador.disconnect();
    });
    observador.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
