/* Registro manual grupal de Conducta: selección múltiple, envío individual.
 * No modifica el pase de lista de Asistencia ni el lector NFC.
 */
(() => {
  const $ = id => document.getElementById(id);
  const escapar = valor => String(valor ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const nombre = a => String(a.nombreCompleto || [a.nombre,a.apellidoPaterno,a.apellidoMaterno].filter(Boolean).join(' ') || 'Alumno').trim();
  const panel = $('panelRegistroManual'), abrir = $('btnBuscarManual');
  if (!panel || !abrir) return;
  let lista = [], ocupado = false;
  const bloque = document.createElement('section');
  bloque.id = 'listaManualConducta';
  bloque.hidden = true;
  bloque.innerHTML = `
    <p><strong>Selecciona los alumnos</strong> a quienes se aplicarán las conductas marcadas arriba.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
      <button type="button" id="conductaMarcarTodos">Seleccionar todos</button>
      <button type="button" id="conductaDesmarcarTodos">Desmarcar todos</button>
    </div>
    <p id="conductaEstado" role="status" aria-live="polite"></p>
    <div id="conductaAlumnos" style="max-height:55vh;overflow:auto"></div>
    <button type="button" id="conductaGuardar" disabled style="margin-top:12px">Guardar conducta</button>`;
  panel.appendChild(bloque);
  const contenedorConductas = document.createElement('div');
  contenedorConductas.id = 'conductaOpcionesMultiples';
  contenedorConductas.style.cssText = 'max-height:45vh;overflow:auto;border:1px solid #ddd;border-radius:10px;padding:8px;margin-top:10px';
  const seccionConducta = $('opcionesConducta');
  const selectorOriginal = $('tipoConducta');
  if (seccionConducta && selectorOriginal) {
    const titulo = document.createElement('p');
    titulo.textContent = 'Marca una o varias conductas:';
    seccionConducta.insertBefore(titulo, selectorOriginal);
    seccionConducta.insertBefore(contenedorConductas, selectorOriginal);
    // El desplegable se conserva para el registro individual NFC.
    const etiquetaNFC = document.createElement('p');
    etiquetaNFC.textContent = 'Para registrar con NFC, selecciona una conducta aquí:';
    seccionConducta.insertBefore(etiquetaNFC, selectorOriginal);
  }
  const originales = ['contadorManual','campoBusquedaManual','listaManual','alumnoManualSeleccionado','btnGuardarManual'];
  function mostrar(activo) {
    bloque.hidden = !activo;
    originales.forEach(id => { const el = $(id); if (el) el.style.display = activo ? 'none' : ''; });
    const etiqueta = panel.querySelector('label[for="campoBusquedaManual"]');
    if (etiqueta) etiqueta.style.display = activo ? 'none' : '';
  }
  const conductasSeleccionadas = () => [...contenedorConductas.querySelectorAll('input[data-conducta]:checked')].map(e => e.value);
  function dibujarConductas() {
    const selector = $('tipoConducta');
    const contenedor = $('conductaOpcionesMultiples');
    if (!selector || !contenedor) return;
    const grupos = [...selector.querySelectorAll('optgroup')];
    contenedor.innerHTML = grupos.map(grupo =>
      '<div style="margin-bottom:12px"><strong>' + escapar(grupo.label) + '</strong>' +
      [...grupo.querySelectorAll('option')].map(op =>
        '<label style="display:flex;gap:10px;align-items:flex-start;padding:7px 2px;cursor:pointer">' +
        '<input type="checkbox" data-conducta value="' + escapar(op.value) + '" style="margin-top:4px;width:19px;height:19px">' +
        '<span>' + escapar(op.textContent) + '</span></label>'
      ).join('') + '</div>'
    ).join('');
    contenedor.querySelectorAll('input').forEach(e => e.addEventListener('change', actualizar));
  }
  const seleccionados = () => [...bloque.querySelectorAll('input[data-id]:checked:not(:disabled)')];
  function actualizar() {
    const n = seleccionados().length;
    const totalConductas = conductasSeleccionadas().length;
    $('conductaGuardar').disabled = ocupado || !n || !totalConductas;
    $('conductaGuardar').textContent = ocupado ? 'Guardando...' : 'Guardar (' + n + ' alumnos · ' + totalConductas + ' conductas)';
    if (!ocupado) $('conductaEstado').textContent = n + ' de ' + lista.length + ' alumnos y ' + totalConductas + ' conductas seleccionadas.';
  }
  function dibujar() {
    $('conductaAlumnos').innerHTML = lista.map(a =>
      `<label style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #ddd;cursor:pointer">
        <input type="checkbox" data-id="${escapar(a.id)}" style="width:20px;height:20px">
        <span>${escapar(nombre(a))}</span></label>`
    ).join('');
    $('conductaAlumnos').querySelectorAll('input').forEach(e => e.addEventListener('change', actualizar));
    actualizar();
  }
  abrir.addEventListener('click', async evento => {
    if (typeof moduloSeleccionado === 'undefined' || moduloSeleccionado !== 'conducta') {
      mostrar(false); return;
    }
    evento.preventDefault();
    evento.stopImmediatePropagation();
    if (ocupado) return;
    mostrar(true);
    panel.classList.remove('oculto');
    $('conductaEstado').textContent = 'Cargando alumnos del grupo...';
    $('conductaAlumnos').innerHTML = '';
    $('conductaGuardar').disabled = true;
    try {
      const respuesta = await solicitarJSONP('obteneralumnosgrupoactivo');
      validarRespuesta(respuesta);
      lista = Array.isArray(respuesta.alumnos) ? respuesta.alumnos : [];
      dibujar();
      if (!lista.length) $('conductaEstado').textContent = 'No hay alumnos activos en el grupo.';
    } catch (error) {
      $('conductaEstado').textContent = 'No se pudo cargar la lista: ' + error.message;
    }
  }, true);
  $('conductaMarcarTodos').addEventListener('click', () => {
    bloque.querySelectorAll('input[data-id]:not(:disabled)').forEach(e => { e.checked = true; });
    actualizar();
  });
  $('conductaDesmarcarTodos').addEventListener('click', () => {
    bloque.querySelectorAll('input[data-id]:not(:disabled)').forEach(e => { e.checked = false; });
    actualizar();
  });
  $('conductaGuardar').addEventListener('click', async () => {
    if (ocupado) return;
    const ids = seleccionados().map(e => e.dataset.id);
    if (!ids.length) return;
    const conductas = conductasSeleccionadas();
    if (!conductas.length) { $('conductaEstado').textContent = 'Selecciona al menos una conducta.'; return; }
    // Un registro por alumno: todas las conductas quedan en el mismo campo de detalle.
    const tipo = conductas.join(' | ');
    ocupado = true;
    actualizar();
    let guardados = 0, errores = 0;
    const nombresGuardados = [];
    for (const id of ids) {
      const alumno = lista.find(a => String(a.id) === id);
      if (!alumno) { errores++; continue; }
      try {
        const parametros = {
          id, alumnoId:id, idAlumno:id, uid:alumno.uid || '',
          modulo:'conducta', tipoConducta:tipo, conducta:tipo,
          resultadoConducta:tipo, tipoRegistro:tipo, resultadoRegistro:tipo,
          tipoResultado:tipo, resultado:tipo, detalle:tipo, valor:tipo,
          registro:tipo, tipo:tipo
        };
        const respuesta = await solicitarJSONP('registrarManual', parametros);
        validarRespuesta(respuesta);
        guardados++;
        nombresGuardados.push(nombre(alumno));
        const casilla = [...bloque.querySelectorAll('input[data-id]')].find(e => e.dataset.id === id);
        if (casilla) {
          casilla.checked = false;
          casilla.disabled = true;
          casilla.closest('label').style.opacity = '.55';
        }
      } catch (_) { errores++; }
      $('conductaEstado').textContent = 'Procesados: ' + (guardados + errores) + ' de ' + ids.length + '.';
    }
    ocupado = false;
    actualizar();
    $('conductaEstado').textContent = 'Guardados: ' + guardados + '. Sin confirmar: ' + errores +
      (errores ? '. Verifica en el historial antes de reintentar.' : '.') +
      (nombresGuardados.length ? ' Confirmados: ' + nombresGuardados.join(', ') + '.' : '');
    if (guardados && $('estado')) $('estado').textContent = conductas.length + ' conductas registradas para ' + guardados + ' alumnos.';
  });
  dibujarConductas();
  $('btnCerrarManual')?.addEventListener('click', () => mostrar(false));
  document.querySelectorAll('[data-modulo]').forEach(b => b.addEventListener('click', () => mostrar(false)));
})();
