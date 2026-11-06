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
    selector.hidden = true;

    const lista = document.createElement('div');
    lista.id = 'listaActividadesParticipacion';
    lista.setAttribute('role', 'group');
    lista.setAttribute('aria-label', 'Selecciona las actividades revisadas');
    lista.style.cssText = 'display:grid;gap:8px;max-height:270px;overflow:auto;padding:10px;border:1px solid #b7cbe1;border-radius:12px;background:#fff';
    const botonNueva = document.createElement('button');
    botonNueva.type = 'button';
    botonNueva.id = 'btnNuevaActividadParticipacion';
    botonNueva.textContent = '+ Nueva actividad';
    botonNueva.style.cssText = 'margin-top:10px;padding:10px;border-radius:10px;border:1px solid #8bb5e5;background:#fff;color:#1769aa;font-weight:700';

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
    selector.insertAdjacentElement('afterend', lista);
    lista.insertAdjacentElement('afterend', botonNueva);
    botonNueva.insertAdjacentElement('afterend', nuevos);
    botonNueva.addEventListener('click', () => {
      selector.value = selector.value === VALOR_NUEVA ? '' : VALOR_NUEVA;
      actualizarModoActividad();
    });
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
    const lista = document.getElementById('listaActividadesParticipacion');
    if (lista) {
      lista.replaceChildren();
      if (!campo.value || !actividades.length) {
        const aviso = document.createElement('span');
        aviso.textContent = campo.value ? 'No hay actividades anteriores en este campo.' : 'Primero selecciona un campo formativo.';
        lista.appendChild(aviso);
      }
      actividades.forEach((actividad, indice) => {
        const etiqueta = document.createElement('label');
        etiqueta.style.cssText = 'display:flex;align-items:center;gap:10px;cursor:pointer;font-size:14px;padding:5px';
        const casilla = document.createElement('input');
        casilla.type = 'checkbox';
        casilla.value = String(indice);
        casilla.name = 'actividadParticipacionMultiple';
        casilla.style.cssText = 'width:19px;height:19px;flex-shrink:0;accent-color:#1976d2';
        const texto = document.createElement('span');
        texto.textContent = actividad.titulo + ' · ' + fechaVisible(actividad.fechaActividad);
        etiqueta.append(casilla, texto);
        lista.appendChild(etiqueta);
      });
    }

    if (seleccionActividad?.actividad && seleccionActividad?.fechaActividad) {
      const indice = actividades.findIndex((actividad) =>
        actividad.titulo === seleccionActividad.actividad &&
        actividad.fechaActividad === seleccionActividad.fechaActividad
      );
      if (indice !== -1) {
        selector.value = String(indice);
        const casilla = lista?.querySelector(`input[value="${indice}"]`);
        if (casilla) casilla.checked = true;
      }
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
    const lista = document.getElementById('listaActividadesParticipacion');
    if (lista) lista.style.display = esNueva ? 'none' : 'grid';
    const botonNueva = document.getElementById('btnNuevaActividadParticipacion');
    if (botonNueva) botonNueva.textContent = esNueva ? 'Cancelar nueva actividad' : '+ Nueva actividad';
    if (esNueva && !document.getElementById('fechaActividadParticipacion').value) {
      document.getElementById('fechaActividadParticipacion').value = fechaLocalActual();
    }
  }

  function datosActividades() {
    const selector = document.getElementById('actividadParticipacion');
    if (selector?.value === VALOR_NUEVA) {
      const actividad = String(document.getElementById('tituloActividadParticipacion')?.value || '').trim();
      const fechaActividad = String(document.getElementById('fechaActividadParticipacion')?.value || '').trim();
      return actividad && fechaActividad ? [{ actividad, fechaActividad }] : [];
    }
    return Array.from(document.querySelectorAll('input[name="actividadParticipacionMultiple"]:checked'))
      .map((casilla) => actividades[Number(casilla.value)])
      .filter(Boolean)
      .map((a) => ({ actividad: a.titulo, fechaActividad: a.fechaActividad }));
  }

  function datosActividad() {
    return datosActividades()[0] || { actividad: '', fechaActividad: '' };
  }

  // Se lee una copia de la selección al iniciar el guardado, no durante cada petición.
  window.obtenerActividadesParticipacionSeleccionadas = datosActividades;

  function conectarParametros() {
    if (window.__actividadParticipacionParametros || typeof window.construirParametrosRegistro !== 'function') return !!window.__actividadParticipacionParametros;
    const original = window.construirParametrosRegistro;
    window.construirParametrosRegistro = function(base) {
      const parametros = original(base);
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'participacion') {
        const seleccionadas = datosActividades();
        Object.assign(parametros, seleccionadas[0] || { actividad: '', fechaActividad: '' });
        parametros.actividadesSeleccionadas = JSON.stringify(seleccionadas);
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
        const nueva = document.getElementById('actividadParticipacion')?.value === VALOR_NUEVA;
        if (!datos.actividad || !datos.fechaActividad) {
          const estado = document.getElementById('estado');
          if (estado) estado.textContent = '❌ Selecciona una actividad o captura su título y fecha.';
          (nueva ? document.getElementById(datos.actividad ? 'fechaActividadParticipacion' : 'tituloActividadParticipacion') : document.querySelector('input[name="actividadParticipacionMultiple"]'))?.focus();
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
      // Mantener la actividad seleccionada al registrar varios alumnos.
      // El catálogo solo se vuelve a consultar al cambiar de campo formativo.
      return original.apply(this, arguments);
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
