const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyYdimHGfauQU-z9pwYYdzb60Bcod9lYHgIypsGhhj0Qy9hsQnLJ747IikxKr0El4ObbA/exec";
const $ = (id) => document.getElementById(id);

const botonesModulos = document.querySelectorAll('.modulo');
const botonEscanear = $('btnEscanear');
const btnBuscarManual = $('btnBuscarManual');
const btnCambiarModulo = $('btnCambiarModulo');
const resultadoConsultaHistorial = $('resultadoConsultaHistorial');
const listaHistorialGeneral = $('listaHistorialGeneral');
const btnDesplegarLista = $('btnDesplegarLista');

let moduloSeleccionado = '';
let lectorNFC = null;
let controladorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;
let ultimoUID = '';
let momentoUltimoEscaneo = 0;
let alumnos = [];
let alumnosCargados = false;
let registrosConsultaActual = [];
let consultaGeneralActiva = false;
let historialSesion = [];
let alumnoManualId = '';
let alumnoConsultaId = '';
let alumnoConsultaNombre = '';
let modoHistorialVisible = '';

inicializarFecha();

$('btnConsultarFecha').addEventListener('click', alternarHistorialFecha);
$('btnHistorialGeneral').addEventListener('click', alternarHistorialGeneral);
btnDesplegarLista.addEventListener('click', alternarListaCompleta);
$('btnAbrirBuscar').addEventListener('click', alternarBuscarAlumno);
$('btnCerrarBuscar').addEventListener('click', cerrarBuscarAlumno);
$('campoBusquedaAlumno').addEventListener('input', () => renderizarBusquedaConsulta($('campoBusquedaAlumno').value));
$('btnCerrarManual').addEventListener('click', cerrarRegistroManual);
btnBuscarManual.addEventListener('click', abrirRegistroManual);
$('campoBusquedaManual').addEventListener('input', () => renderizarBusquedaManual($('campoBusquedaManual').value));
$('btnGuardarManual').addEventListener('click', guardarRegistroManual);
botonEscanear.addEventListener('click', alternarLectorNFC);
btnCambiarModulo.addEventListener('click', mostrarTodosLosModulos);

botonesModulos.forEach((boton) => {
  boton.addEventListener('click', () => {
    botonesModulos.forEach((item) => item.classList.remove('activo'));
    boton.classList.add('activo');
    moduloSeleccionado = boton.dataset.modulo || '';
    $('moduloActivo').textContent = formatearModulo(moduloSeleccionado);
    mostrarOpcionesModulo();
    enfocarModuloSeleccionado(boton);
    botonEscanear.disabled = false;
    btnBuscarManual.disabled = false;
    $('resultado').innerHTML = '';
    $('estado').textContent = lectorActivo
      ? `📡 Lector activo para ${formatearModulo(moduloSeleccionado)}.`
      : 'Módulo listo. Activa el lector NFC o usa el registro manual.';
  });
});

function enfocarModuloSeleccionado(botonSeleccionado) {
  botonesModulos.forEach((boton) => {
    const esSeleccionado = boton === botonSeleccionado;
    boton.classList.toggle('modulo-seleccionado', esSeleccionado);
    boton.classList.toggle('modulo-oculto', !esSeleccionado);
  });

  btnCambiarModulo.classList.remove('oculto');
}

function mostrarTodosLosModulos() {
  botonesModulos.forEach((boton) => {
    boton.classList.remove('activo', 'modulo-seleccionado', 'modulo-oculto');
  });

  moduloSeleccionado = '';
  $('moduloActivo').textContent = 'Ninguno';

  $('opcionesTareas').classList.add('oculto');
  $('opcionesParticipacion').classList.add('oculto');
  $('opcionesConducta').classList.add('oculto');
  $('opcionesLectura').classList.add('oculto');

  btnCambiarModulo.classList.add('oculto');
  botonEscanear.disabled = true;
  btnBuscarManual.disabled = true;
  $('resultado').innerHTML = '';
  $('estado').textContent = 'Selecciona el tipo de registro que deseas realizar.';
}

function mostrarOpcionesModulo() {
  $('opcionesTareas').classList.toggle('oculto', moduloSeleccionado !== 'tareas');
  $('opcionesParticipacion').classList.toggle('oculto', moduloSeleccionado !== 'participacion');
  $('opcionesConducta').classList.toggle('oculto', moduloSeleccionado !== 'conducta');
  $('opcionesLectura').classList.toggle('oculto', moduloSeleccionado !== 'lectura');
}

function inicializarFecha() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  $('fechaHistorial').value = local.toISOString().slice(0, 10);
}

function ocultarHistorial() {
  resultadoConsultaHistorial.classList.add('oculto');
  listaHistorialGeneral.classList.add('oculto');
  btnDesplegarLista.classList.add('oculto');
  modoHistorialVisible = '';
}

async function alternarHistorialFecha() {
  if (modoHistorialVisible === 'fecha') {
    ocultarHistorial();
    return;
  }

  const fecha = $('fechaHistorial').value;
  if (!fecha) return;

  if (!alumnoConsultaId) {
    mostrarErrorHistorial(new Error('Primero busca y selecciona un alumno.'));
    return;
  }

  modoHistorialVisible = 'fecha';
  consultaGeneralActiva = false;
  prepararConsulta(`Consultando registros de ${alumnoConsultaNombre} del ${formatearFechaVisible(fecha)}...`);

  try {
    const respuesta = await solicitarJSONP('obtenerHistorialGeneral', {
      fecha,
      idAlumno: alumnoConsultaId
    });
    validarRespuesta(respuesta);
    mostrarResultadoHistorial(respuesta, `${alumnoConsultaNombre} · ${formatearFechaVisible(fecha)}`, true);
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

async function alternarHistorialGeneral() {
  if (modoHistorialVisible === 'general') {
    ocultarHistorial();
    return;
  }

  if (!alumnoConsultaId) {
    mostrarErrorHistorial(new Error('Primero busca y selecciona un alumno.'));
    return;
  }

  modoHistorialVisible = 'general';
  consultaGeneralActiva = true;
  prepararConsulta(`Consultando el historial general de ${alumnoConsultaNombre}...`);

  try {
    const respuesta = await solicitarJSONP('obtenerHistorialGeneral', {
      idAlumno: alumnoConsultaId
    });
    validarRespuesta(respuesta);
    mostrarResultadoHistorial(respuesta, `Historial general de ${alumnoConsultaNombre}`, false);
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

function prepararConsulta(mensaje) {
  resultadoConsultaHistorial.classList.remove('oculto');
  $('estadoHistorial').textContent = mensaje;
  actualizarResumen({}, 0);
  listaHistorialGeneral.classList.add('oculto');
  btnDesplegarLista.classList.add('oculto');
}

function mostrarResultadoHistorial(respuesta, titulo, mostrarListaDirecta) {
  registrosConsultaActual = Array.isArray(respuesta.registros)
    ? respuesta.registros
    : Array.isArray(respuesta.historial) ? respuesta.historial : [];
  actualizarResumen(respuesta.resumen || contarModulos(registrosConsultaActual), registrosConsultaActual.length);
  $('estadoHistorial').textContent = `${titulo}: ${registrosConsultaActual.length} ${registrosConsultaActual.length === 1 ? 'registro' : 'registros'}.`;
  listaHistorialGeneral.innerHTML = registrosConsultaActual.length
    ? registrosConsultaActual.map(crearTarjetaHistorial).join('')
    : '<div class="mensaje-lista">No hay registros para esta consulta.</div>';
  if (mostrarListaDirecta) {
    listaHistorialGeneral.classList.remove('oculto');
  } else {
    listaHistorialGeneral.classList.add('oculto');
    btnDesplegarLista.classList.remove('oculto');
    btnDesplegarLista.textContent = 'Desplegar lista completa';
  }
}

function alternarListaCompleta() {
  if (!consultaGeneralActiva) return;
  const oculta = listaHistorialGeneral.classList.toggle('oculto');
  btnDesplegarLista.textContent = oculta ? 'Desplegar lista completa' : 'Ocultar lista completa';
}

function mostrarErrorHistorial(error) {
  resultadoConsultaHistorial.classList.remove('oculto');
  $('estadoHistorial').textContent = 'No se pudo cargar el historial.';
  listaHistorialGeneral.classList.remove('oculto');
  listaHistorialGeneral.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message || 'Error de consulta')}</div>`;
}

async function alternarBuscarAlumno() {
  if (!$('vistaBuscar').classList.contains('oculto')) {
    cerrarBuscarAlumno();
    return;
  }
  $('vistaBuscar').classList.remove('oculto');
  $('fichaAlumno').classList.add('oculto');
  $('campoBusquedaAlumno').value = '';
  $('listaAlumnos').classList.add('oculto');
  $('contadorAlumnos').textContent = 'Escribe un nombre para buscar.';
  try {
    await cargarAlumnos();
    $('campoBusquedaAlumno').focus();
  } catch (error) {
    $('contadorAlumnos').textContent = error.message;
  }
}

function cerrarBuscarAlumno() {
  $('vistaBuscar').classList.add('oculto');
}

async function cargarAlumnos() {
  if (alumnosCargados) return;
  const respuesta = await solicitarJSONP('obtenerAlumnos');
  validarRespuesta(respuesta);
  alumnos = Array.isArray(respuesta.alumnos) ? respuesta.alumnos : [];
  alumnosCargados = true;
}

function renderizarBusquedaConsulta(termino) {
  const texto = normalizarTexto(termino);
  const lista = $('listaAlumnos');
  $('fichaAlumno').classList.add('oculto');
  if (texto.length < 2) {
    lista.classList.add('oculto');
    $('contadorAlumnos').textContent = 'Escribe al menos dos letras.';
    return;
  }
  const filtrados = alumnos.filter((a) => normalizarTexto(nombreCompleto(a)).includes(texto));
  $('contadorAlumnos').textContent = `${filtrados.length} coincidencias`;
  lista.classList.remove('oculto');
  lista.innerHTML = filtrados.length ? filtrados.map((a) => botonAlumnoHTML(a, 'consulta')).join('') : '<div class="mensaje-lista">No se encontraron alumnos.</div>';
  lista.querySelectorAll('[data-consulta-id]').forEach((boton) => boton.addEventListener('click', () => mostrarFichaBasica(boton.dataset.consultaId)));
}

function mostrarFichaBasica(id) {
  const alumno = alumnos.find((a) => String(a.id) === String(id));
  if (!alumno) return;

  alumnoConsultaId = String(alumno.id || '').trim();
  alumnoConsultaNombre = nombreCompleto(alumno);

  $('inicialesAlumno').textContent = iniciales(alumnoConsultaNombre);
  $('nombreAlumno').textContent = alumnoConsultaNombre;
  $('gradoGrupoAlumno').textContent = gradoGrupo(alumno);
  $('idAlumno').textContent = alumno.id || '—';
  $('uidAlumno').textContent = alumno.uid || 'Sin UID';
  $('estadoAlumno').textContent = alumno.activo === false || normalizarTexto(alumno.estatus) === 'inactivo' ? 'Inactivo' : 'Activo';
  $('fichaAlumno').classList.remove('oculto');
  ocultarHistorial();
}

async function abrirRegistroManual() {
  if (!validarModulo()) return;
  $('panelRegistroManual').classList.remove('oculto');
  alumnoManualId = '';
  $('campoBusquedaManual').value = '';
  $('listaManual').classList.add('oculto');
  $('alumnoManualSeleccionado').classList.add('oculto');
  $('btnGuardarManual').disabled = true;
  $('contadorManual').textContent = 'Escribe un nombre para buscar.';
  try {
    await cargarAlumnos();
    $('campoBusquedaManual').focus();
  } catch (error) {
    $('contadorManual').textContent = error.message;
  }
}

function cerrarRegistroManual() {
  $('panelRegistroManual').classList.add('oculto');
  alumnoManualId = '';
}

function renderizarBusquedaManual(termino) {
  const texto = normalizarTexto(termino);
  const lista = $('listaManual');
  alumnoManualId = '';
  $('btnGuardarManual').disabled = true;
  $('alumnoManualSeleccionado').classList.add('oculto');
  if (texto.length < 2) {
    lista.classList.add('oculto');
    $('contadorManual').textContent = 'Escribe al menos dos letras.';
    return;
  }
  const filtrados = alumnos.filter((a) => normalizarTexto(nombreCompleto(a)).includes(texto));
  $('contadorManual').textContent = `${filtrados.length} coincidencias`;
  lista.classList.remove('oculto');
  lista.innerHTML = filtrados.length ? filtrados.map((a) => botonAlumnoHTML(a, 'manual')).join('') : '<div class="mensaje-lista">No se encontraron alumnos.</div>';
  lista.querySelectorAll('[data-manual-id]').forEach((boton) => boton.addEventListener('click', () => seleccionarAlumnoManual(boton.dataset.manualId)));
}

function seleccionarAlumnoManual(id) {
  const alumno = alumnos.find((a) => String(a.id) === String(id));
  if (!alumno) return;
  alumnoManualId = String(id);
  $('alumnoManualSeleccionado').innerHTML = `<strong>Alumno seleccionado:</strong><br>${escaparHTML(nombreCompleto(alumno))}<br><small>${escaparHTML(gradoGrupo(alumno))}</small>`;
  $('alumnoManualSeleccionado').classList.remove('oculto');
  $('btnGuardarManual').disabled = false;
}

async function guardarRegistroManual() {
  if (!alumnoManualId || !validarModulo() || envioEnProceso) return;
  const moduloActual = moduloSeleccionado;
  const alumno = alumnos.find((a) => String(a.id) === String(alumnoManualId));
  if (!alumno) {
    $('estado').textContent = '❌ No se encontró el alumno seleccionado.';
    return;
  }

  envioEnProceso = true;
  $('btnGuardarManual').disabled = true;
  $('estado').textContent = '⏳ Guardando registro manual...';
  $('resultado').textContent = '';

  try {
    const parametros = construirParametrosRegistro({
      id: alumnoManualId,
      alumnoId: alumnoManualId,
      idAlumno: alumnoManualId,
      uid: alumno.uid || ''
    });

    if (moduloActual === 'conducta') {
      const tipoRegistro = String($('tipoConducta').value || '').trim();
      Object.assign(parametros, {
        modulo: 'conducta',
        tipoConducta: tipoRegistro,
        conducta: tipoRegistro,
        resultadoConducta: tipoRegistro,
        tipoRegistro,
        resultadoRegistro: tipoRegistro,
        tipoResultado: tipoRegistro,
        resultado: tipoRegistro,
        detalle: tipoRegistro,
        valor: tipoRegistro,
        registro: tipoRegistro,
        tipo: tipoRegistro
      });
    }

    if (moduloActual === 'lectura') {
      const tipoRegistro = String($('tipoLectura').value || '').trim();
      Object.assign(parametros, {
        modulo: 'lectura',
        tipoLectura: tipoRegistro,
        lectura: tipoRegistro,
        resultadoLectura: tipoRegistro,
        tipoRegistro,
        resultadoRegistro: tipoRegistro,
        tipoResultado: tipoRegistro,
        resultado: tipoRegistro,
        detalle: tipoRegistro,
        valor: tipoRegistro,
        registro: tipoRegistro,
        tipo: tipoRegistro
      });
    }

    const respuesta = await solicitarJSONP('registrarManual', parametros);
    validarRespuesta(respuesta);
    confirmarRegistro(respuesta.nombre || respuesta.nombreCompleto || nombreCompleto(alumno), moduloActual, 'Manual');
    cerrarRegistroManual();
  } catch (error) {
    $('estado').textContent = '❌ No se pudo guardar el registro manual.';
    $('resultado').textContent = error.message;
    $('btnGuardarManual').disabled = false;
  } finally {
    envioEnProceso = false;
  }
}

function construirParametrosRegistro(base) {
  return {
    ...base,
    modulo: moduloSeleccionado,
    tipoTarea: moduloSeleccionado === 'tareas' ? $('tipoTarea').value : '',
    resultadoTarea: moduloSeleccionado === 'tareas' ? $('tipoTarea').value : '',
    campoFormativo: moduloSeleccionado === 'participacion' ? $('campoFormativo').value : '',
    tipoParticipacion: moduloSeleccionado === 'participacion' ? $('tipoParticipacion').value : '',
    tipoConducta: moduloSeleccionado === 'conducta' ? $('tipoConducta').value : '',
    conducta: moduloSeleccionado === 'conducta' ? $('tipoConducta').value : '',
    tipoLectura: moduloSeleccionado === 'lectura' ? $('tipoLectura').value : '',
    lectura: moduloSeleccionado === 'lectura' ? $('tipoLectura').value : ''
  };
}

async function alternarLectorNFC() {
  if (lectorActivo) {
    desactivarLectorNFC();
    return;
  }
  if (!validarModulo()) return;
  if (!('NDEFReader' in window)) {
    $('estado').textContent = '❌ Este dispositivo no es compatible con Web NFC.';
    return;
  }
  try {
    controladorNFC = new AbortController();
    lectorNFC = new NDEFReader();
    await lectorNFC.scan({ signal: controladorNFC.signal });
    lectorActivo = true;
    botonEscanear.textContent = 'Desactivar lector NFC';
    botonEscanear.classList.add('activo-lector');
    $('estado').textContent = '📡 Lector NFC activo. Acerca una tarjeta.';
    lectorNFC.onreading = procesarTarjeta;
    lectorNFC.onreadingerror = () => $('estado').textContent = '❌ No se pudo leer la tarjeta.';
  } catch (error) {
    lectorActivo = false;
    botonEscanear.textContent = 'Activar lector NFC';
    $('estado').textContent = `❌ ${error.message || 'No se pudo activar el lector NFC.'}`;
  }
}

function desactivarLectorNFC() {
  if (controladorNFC) controladorNFC.abort();
  lectorActivo = false;
  lectorNFC = null;
  controladorNFC = null;
  botonEscanear.textContent = 'Activar lector NFC';
  botonEscanear.classList.remove('activo-lector');
  $('estado').textContent = 'Lector NFC desactivado.';
}

function procesarTarjeta(evento) {
  const uid = String(evento.serialNumber || '').trim();
  if (!uid) return;
  const ahora = Date.now();
  if (uid === ultimoUID && ahora - momentoUltimoEscaneo < 3000) return;
  ultimoUID = uid;
  momentoUltimoEscaneo = ahora;
  enviarRegistroNFC(uid);
}

async function enviarRegistroNFC(uid) {
  if (!validarModulo() || envioEnProceso) return;
  envioEnProceso = true;
  $('estado').textContent = '⏳ Enviando registro...';
  try {
    const respuesta = await solicitarJSONP('registrarNFC', construirParametrosRegistro({ uid }));
    validarRespuesta(respuesta);
    confirmarRegistro(respuesta.nombre || respuesta.nombreCompleto || 'Alumno', moduloSeleccionado, 'NFC');
  } catch (error) {
    $('estado').textContent = '❌ No se pudo confirmar el registro.';
    $('resultado').textContent = error.message;
  } finally {
    envioEnProceso = false;
  }
}

function validarModulo() {
  if (!moduloSeleccionado) {
    $('estado').textContent = '❌ Primero selecciona un módulo.';
    return false;
  }
  const validaciones = {
    tareas: [$('tipoTarea').value, 'Selecciona el resultado de la tarea.'],
    participacion: [$('campoFormativo').value && $('tipoParticipacion').value, 'Selecciona el campo formativo y el tipo de participación.'],
    conducta: [$('tipoConducta').value, 'Selecciona el tipo de conducta.'],
    lectura: [$('tipoLectura').value, 'Selecciona el resultado de lectura.']
  };
  const validacion = validaciones[moduloSeleccionado];
  if (validacion && !validacion[0]) {
    $('estado').textContent = `❌ ${validacion[1]}`;
    return false;
  }
  return true;
}

function confirmarRegistro(nombre, modulo, metodo) {
  $('estado').textContent = lectorActivo ? '📡 Registro confirmado. Acerca otra tarjeta.' : '✅ Registro confirmado.';
  $('resultado').innerHTML = `✅ Registro guardado<br><strong>${escaparHTML(nombre)}</strong><br>${escaparHTML(formatearModulo(modulo))} · ${metodo}`;
  historialSesion.unshift({ nombre, modulo, metodo, hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) });
  $('totalSesion').textContent = historialSesion.length;
  $('historialSesion').innerHTML = historialSesion.map((r) => `<article class="historial-item"><div class="historial-icono">${moduloPresentacion(r.modulo)}</div><div><strong>${escaparHTML(r.nombre)}</strong><p>${escaparHTML(formatearModulo(r.modulo))} · ${r.metodo}</p></div><time>${r.hora}</time></article>`).join('');
  if ('vibrate' in navigator) navigator.vibrate(180);
}

function botonAlumnoHTML(alumno, tipo) {
  const nombre = nombreCompleto(alumno);
  const atributo = tipo === 'manual' ? 'data-manual-id' : 'data-consulta-id';
  return `<button class="alumno-item" type="button" ${atributo}="${escaparHTML(alumno.id)}"><span class="avatar-pequeno">${iniciales(nombre)}</span><span><strong>${escaparHTML(nombre)}</strong><small>${escaparHTML(gradoGrupo(alumno))}</small></span></button>`;
}

function contarModulos(registros) {
  return registros.reduce((t, r) => {
    const m = normalizarTexto(r.modulo || r.tipo);
    if (m.includes('asistencia')) t.asistencias++;
    else if (m.includes('tarea')) t.tareas++;
    else if (m.includes('participacion')) t.participaciones++;
    else if (m.includes('conducta')) t.conductas++;
    else if (m.includes('lectura')) t.lecturas++;
    t.total++;
    return t;
  }, { asistencias: 0, tareas: 0, participaciones: 0, conductas: 0, lecturas: 0, total: 0 });
}

function actualizarResumen(resumen, total) {
  $('totalAsistencias').textContent = Number(resumen.asistencias ?? resumen.asistencia ?? 0);
  $('totalTareas').textContent = Number(resumen.tareas ?? resumen.tarea ?? 0);
  $('totalParticipaciones').textContent = Number(resumen.participaciones ?? resumen.participacion ?? 0);
  $('totalConductas').textContent = Number(resumen.conductas ?? resumen.conducta ?? 0);
  $('totalLecturas').textContent = Number(resumen.lecturas ?? resumen.lectura ?? 0);
  $('totalRegistrosConsulta').textContent = Number(resumen.total ?? total ?? 0);
}

function crearTarjetaHistorial(registro) {
  const modulo = registro.modulo || registro.tipo || 'Registro';
  const alumno = registro.nombre || registro.nombreCompleto || registro.alumno || 'Alumno';
  const detalle = registro.registro || registro.detalle || registro.valor || formatearModulo(modulo);
  const fechaHora = [registro.fecha, registro.hora].filter(Boolean).join(' · ');
  return `<article class="historial-item"><div class="historial-icono">${moduloPresentacion(modulo)}</div><div><strong>${escaparHTML(alumno)}</strong><p>${escaparHTML(formatearModulo(modulo))} · ${escaparHTML(detalle)}</p></div><time>${escaparHTML(fechaHora)}</time></article>`;
}

function validarRespuesta(respuesta) {
  if (!respuesta || (respuesta.exito !== true && respuesta.ok !== true)) throw new Error(respuesta?.mensaje || 'La operación no pudo completarse.');
}

function solicitarJSONP(accion, parametros = {}) {
  return new Promise((resolve, reject) => {
    const callback = `aulaNfc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');
    const timeout = setTimeout(() => finalizar(new Error('La solicitud tardó demasiado.')), 15000);
    function limpiar() { clearTimeout(timeout); delete window[callback]; script.remove(); }
    function finalizar(error, datos) { limpiar(); error ? reject(error) : resolve(datos); }
    window[callback] = (datos) => finalizar(null, datos);
    script.onerror = () => finalizar(new Error('No se pudo conectar con Apps Script.'));
    script.src = `${URL_APPS_SCRIPT}?${new URLSearchParams({ accion, ...parametros, callback, t: Date.now() })}`;
    document.body.appendChild(script);
  });
}

function formatearModulo(modulo) {
  const m = normalizarTexto(modulo);
  return ({ asistencia: 'Asistencia', asistencias: 'Asistencia', tareas: 'Tareas', participacion: 'Participación', conducta: 'Conducta', lectura: 'Lectura' })[m] || modulo;
}
function moduloPresentacion(modulo) {
  const m = normalizarTexto(modulo);
  if (m.includes('asistencia')) return '🟢';
  if (m.includes('tarea')) return '🟡';
  if (m.includes('participacion')) return '🔵';
  if (m.includes('conducta')) return '🟣';
  if (m.includes('lectura')) return '🟠';
  return '📌';
}
function nombreCompleto(a) { return String(a?.nombreCompleto || [a?.nombre, a?.apellidoPaterno, a?.apellidoMaterno].filter(Boolean).join(' ') || 'Alumno').replace(/\s+/g, ' ').trim(); }
function gradoGrupo(a) { const g = String(a?.grado || '').trim(); const gr = String(a?.grupo || '').trim(); return g && gr ? `${g} · Grupo ${gr}` : g || gr || 'Sin grado y grupo'; }
function iniciales(nombre) { const p = String(nombre || '').trim().split(/\s+/).filter(Boolean); return p.length > 1 ? (p[0][0] + p[1][0]).toUpperCase() : (p[0] || 'AL').slice(0, 2).toUpperCase(); }
function normalizarTexto(texto) { return String(texto || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
function escaparHTML(texto) { return String(texto ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
function formatearFechaVisible(fechaISO) { const [a, m, d] = String(fechaISO).split('-'); return a && m && d ? `${d}/${m}/${a}` : fechaISO; }
