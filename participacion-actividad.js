/* AulaNFC - Catálogo de actividades exclusivo de Participación. */
(() => {
  const VALOR_NUEVA = '__nueva_actividad__';
  let actividades = [];

  function fechaLocalActual() {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }

  function fechaVisible(fecha) {
    const partes = String(fecha || '').split('-');
    return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : String(fecha || '');
  }

  function insertarCampos() {
    if (document.getElementById('actividadParticipacion')) return true;
    const campo = document.getElementById('campoFormativo');
    const contenedor = document.getElementById('opcionesParticipacion');
    const tipo = document.getElementById('tipoParticipacion');
    if (!campo || !contenedor || !tipo) return false;

    const titulo = document.createElement('h2');
    titulo.textContent = 'Actividad revisada';
    const selector = document.createElement('select');
    selector.id = 'actividadParticipacion';
    selector.disabled = true;
    selector.setAttribute('aria-label', 'Actividad revisada');

    const nuevos = document.createElement('div');
    nuevos.id = 'nuevaActividadParticipacion';
    nuevos.hidden = true;
    nuevos.innerHTML = [
      '<label class="etiqueta" for="tituloActividadParticipacion">Título de la actividad</label>',
      '<input class="buscador" id="tituloActividadParticipacion" maxlength="180" autocomplete="off" placeholder="Ej. Preguntas sobre el cuerpo humano">',
      '<label class="etiqueta" for="fechaActividadParticipacion">Fecha de la actividad</label>',
      '<input class="buscador" id="fechaActividadParticipacion" type="date">'
    ].join('');

    campo.insertAdjacentElement('afterend', selector);
    selector.insertAdjacentElement('beforebegin', titulo);
    selector.insertAdjacentElement('afterend', nuevos);
    selector.addEventListener('change', actualizarModoActividad);
    campo.addEventListener('change', cargarCatalogo);
    renderizarCatalogo();
    return true;
  }

  function renderizarCatalogo(seleccionActividad) {
    const selector = document.getElementById('actividadParticipacion');
    const campo = document.getElementById('campoFormativo');
    if (!selector || !campo) return;
    selector.innerHTML = '';
    selector.appendChild(new Option(campo.value ? 'Selecciona una actividad' : 'Primero selecciona un campo formativo', ''));
    actividades.forEach((actividad, indice) => {
      selector.appendChild(new Option(`${actividad.titulo} · ${fechaVisible(actividad.fechaActividad)}`, String(indice)));
    });
    selector.appendChild(new Option('+ Nueva actividad', VALOR_NUEVA));
    selector.disabled = !campo.value;

    if (seleccionActividad?.actividad && seleccionActividad?.fechaActividad) {
      const indice = actividades.findIndex((actividad) =>
        actividad.titulo === seleccionActividad.actividad &&
        actividad.fechaActividad === seleccionActividad.fechaActividad
      );
      if (indice !== -1) selector.value = String(indice);
    }

    actualizarModoActividad();
  }

  async function cargarCatalogo(seleccionActividad) {
    const campo = String(document.getElementById('campoFormativo')?.value || '').trim();
    actividades = [];
    renderizarCatalogo();
    if (!campo || typeof window.solicitarJSONP !== 'function') return;

    const selector = document.getElementById('actividadParticipacion');
    selector.options[0].textContent = 'Cargando actividades...';
    try {
      const respuesta = await window.solicitarJSONP('obtenerActividadesParticipacion', { campoFormativo: campo });
      if (typeof window.validarRespuesta === 'function') window.validarRespuesta(respuesta);
      actividades = Array.isArray(respuesta.actividades) ? respuesta.actividades : [];
      renderizarCatalogo(seleccionActividad);
    } catch (error) {
      renderizarCatalogo();
      selector.options[0].textContent = 'No se pudo cargar el catálogo';
      const estado = document.getElementById('estado');
      if (estado) estado.textContent = `❌ ${error.message || 'No se pudo cargar el catálogo de actividades.'}`;
    }
  }

  function actualizarModoActividad() {
    const selector = document.getElementById('actividadParticipacion');
    const nuevos = document.getElementById('nuevaActividadParticipacion');
    if (!selector || !nuevos) return;
    const esNueva = selector.value === VALOR_NUEVA;
    nuevos.hidden = !esNueva;
    if (esNueva && !document.getElementById('fechaActividadParticipacion').value) {
      document.getElementById('fechaActividadParticipacion').value = fechaLocalActual();
    }
  }

  function datosActividad() {
    const selector = document.getElementById('actividadParticipacion');
    if (!selector || !selector.value) return { actividad: '', fechaActividad: '' };
    if (selector.value === VALOR_NUEVA) {
      return {
        actividad: String(document.getElementById('tituloActividadParticipacion')?.value || '').trim(),
        fechaActividad: String(document.getElementById('fechaActividadParticipacion')?.value || '').trim()
      };
    }
    const elegida = actividades[Number(selector.value)];
    return elegida ? { actividad: elegida.titulo, fechaActividad: elegida.fechaActividad } : { actividad: '', fechaActividad: '' };
  }

  function conectarParametros() {
    if (window.__actividadParticipacionParametros || typeof window.construirParametrosRegistro !== 'function') return !!window.__actividadParticipacionParametros;
    const original = window.construirParametrosRegistro;
    window.construirParametrosRegistro = function(base) {
      const parametros = original(base);
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'participacion') {
        Object.assign(parametros, datosActividad());
      }
      return parametros;
    };
    window.__actividadParticipacionParametros = true;
    return true;
  }

  function conectarValidacion() {
    if (window.__actividadParticipacionValidacion || typeof window.validarModulo !== 'function') return !!window.__actividadParticipacionValidacion;
    const original = window.validarModulo;
    window.validarModulo = function() {
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'participacion') {
        const datos = datosActividad();
        if (!datos.actividad || !datos.fechaActividad) {
          const estado = document.getElementById('estado');
          if (estado) estado.textContent = '❌ Selecciona una actividad o captura su título y fecha.';
          document.getElementById(datos.actividad ? 'fechaActividadParticipacion' : 'actividadParticipacion')?.focus();
          return false;
        }
      }
      return original();
    };
    window.__actividadParticipacionValidacion = true;
    return true;
  }

  function conectarActualizacion() {
    if (window.__actividadParticipacionActualizacion || typeof window.confirmarRegistro !== 'function') return !!window.__actividadParticipacionActualizacion;
    const original = window.confirmarRegistro;
    window.confirmarRegistro = function(nombre, modulo, metodo) {
      const actividadActual = modulo === 'participacion' ? datosActividad() : null;
      const resultado = original.apply(this, arguments);
      if (modulo === 'participacion') cargarCatalogo(actividadActual);
      return resultado;
    };
    window.__actividadParticipacionActualizacion = true;
    return true;
  }

  function iniciar() {
    return insertarCampos() && conectarParametros() && conectarValidacion() && conectarActualizacion();
  }

  if (iniciar()) return;
  const observador = new MutationObserver(() => {
    if (iniciar()) observador.disconnect();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true });
})();
