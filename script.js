const URL_APPS_SCRIPT = "https://script.google.com/macros/s/AKfycbyYdimHGfauQU-z9pwYYdzb60Bcod9lYHgIypsGhhj0Qy9hsQnLJ747IikxKr0El4ObbA/exec";

const $ = (id) => document.getElementById(id);
const botonesModulos = document.querySelectorAll('.modulo');
const moduloActivo = $('moduloActivo');
const botonEscanear = $('btnEscanear');
const btnBuscarManual = $('btnBuscarManual');
const estado = $('estado');
const resultado = $('resultado');
const opcionesParticipacion = $('opcionesParticipacion');
const campoFormativo = $('campoFormativo');
const tipoParticipacion = $('tipoParticipacion');
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

inicializarFecha();

$('btnConsultarFecha').addEventListener('click', consultarHistorialFecha);
$('btnHistorialGeneral').addEventListener('click', consultarHistorialGeneral);
btnDesplegarLista.addEventListener('click', alternarListaCompleta);
$('btnAbrirBuscar').addEventListener('click', abrirBuscarAlumno);
$('btnCerrarBuscar').addEventListener('click', () => $('vistaBuscar').classList.add('oculto'));
$('campoBusquedaAlumno').addEventListener('input', () => renderizarBusquedaConsulta($('campoBusquedaAlumno').value));
$('btnCerrarManual').addEventListener('click', () => $('panelRegistroManual').classList.add('oculto'));
btnBuscarManual.addEventListener('click', abrirRegistroManual);
$('campoBusquedaManual').addEventListener('input', () => renderizarBusquedaManual($('campoBusquedaManual').value));
botonEscanear.addEventListener('click', alternarLectorNFC);

botonesModulos.forEach((boton) => {
  boton.addEventListener('click', () => {
    botonesModulos.forEach((item) => item.classList.remove('activo'));
    boton.classList.add('activo');
    moduloSeleccionado = boton.dataset.modulo || '';
    moduloActivo.textContent = formatearModulo(moduloSeleccionado);
    opcionesParticipacion.classList.toggle('oculto', moduloSeleccionado !== 'participacion');
    botonEscanear.disabled = false;
    btnBuscarManual.disabled = false;
    resultado.innerHTML = '';
    estado.textContent = lectorActivo
      ? `📡 Lector activo para ${formatearModulo(moduloSeleccionado)}.`
      : 'Módulo listo. Activa el lector NFC o busca un alumno.';
  });
});

function inicializarFecha() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  $('fechaHistorial').value = local.toISOString().slice(0, 10);
}

async function consultarHistorialFecha() {
  const fecha = $('fechaHistorial').value;
  if (!fecha) return;
  consultaGeneralActiva = false;
  prepararConsulta(`Consultando registros del ${formatearFechaVisible(fecha)}...`);
  try {
    const respuesta = await solicitarJSONP('obtenerHistorialGeneral', { fecha });
    validarRespuesta(respuesta);
    mostrarResultadoHistorial(respuesta, `Historial del ${formatearFechaVisible(fecha)}`, true);
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

async function consultarHistorialGeneral() {
  consultaGeneralActiva = true;
  prepararConsulta('Consultando todos los registros...');
  try {
    const respuesta = await solicitarJSONP('obtenerHistorialGeneral');
    validarRespuesta(respuesta);
    mostrarResultadoHistorial(respuesta, 'Historial general', false);
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

function prepararConsulta(mensaje) {
  resultadoConsultaHistorial.classList.remove('oculto');
  $('estadoHistorial').textContent = mensaje;
  actualizarResumen({}, 0);
  listaHistorialGeneral.classList.add('oculto');
  listaHistorialGeneral.innerHTML = '<div class="mensaje-lista">Cargando...</div>';
  btnDesplegarLista.classList.add('oculto');
  $('btnConsultarFecha').disabled = true;
  $('btnHistorialGeneral').disabled = true;
}

function mostrarResultadoHistorial(respuesta, titulo, mostrarListaDirecta) {
  registrosConsultaActual = Array.isArray(respuesta.registros)
    ? respuesta.registros
    : Array.isArray(respuesta.historial) ? respuesta.historial : [];
  const resumen = respuesta.resumen || contarModulos(registrosConsultaActual);
  actualizarResumen(resumen, registrosConsultaActual.length);
  $('estadoHistorial').textContent = `${titulo}: ${registrosConsultaActual.length} ${registrosConsultaActual.length === 1 ? 'registro' : 'registros'}.`;
  listaHistorialGeneral.innerHTML = registrosConsultaActual.length
    ? registrosConsultaActual.map(crearTarjetaHistorial).join('')
    : '<div class="mensaje-lista">No hay registros para esta consulta.</div>';

  if (mostrarListaDirecta) {
    listaHistorialGeneral.classList.remove('oculto');
    btnDesplegarLista.classList.add('oculto');
  } else {
    listaHistorialGeneral.classList.add('oculto');
    btnDesplegarLista.classList.remove('oculto');
    btnDesplegarLista.textContent = 'Desplegar lista completa';
  }
  habilitarBotonesHistorial();
}

function alternarListaCompleta() {
  if (!consultaGeneralActiva) return;
  const quedaOculta = listaHistorialGeneral.classList.toggle('oculto');
  btnDesplegarLista.textContent = quedaOculta ? 'Desplegar lista completa' : 'Ocultar lista completa';
}

function mostrarErrorHistorial(error) {
  console.error(error);
  resultadoConsultaHistorial.classList.remove('oculto');
  $('estadoHistorial').textContent = 'No se pudo cargar el historial.';
  listaHistorialGeneral.classList.remove('oculto');
  listaHistorialGeneral.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message || 'Error de consulta')}</div>`;
  habilitarBotonesHistorial();
}

function habilitarBotonesHistorial() {
  $('btnConsultarFecha').disabled = false;
  $('btnHistorialGeneral').disabled = false;
}

function abrirBuscarAlumno() {
  $('vistaBuscar').classList.remove('oculto');
  $('fichaAlumno').classList.add('oculto');
  $('campoBusquedaAlumno').value = '';
  $('listaAlumnos').classList.add('oculto');
  $('contadorAlumnos').textContent = 'Escribe un nombre para buscar.';
  cargarAlumnos().then(() => $('campoBusquedaAlumno').focus());
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
  $('inicialesAlumno').textContent = iniciales(nombreCompleto(alumno));
  $('nombreAlumno').textContent = nombreCompleto(alumno);
  $('gradoGrupoAlumno').textContent = gradoGrupo(alumno);
  $('idAlumno').textContent = alumno.id || '—';
  $('uidAlumno').textContent = alumno.uid || 'Sin UID';
  $('estadoAlumno').textContent = alumno.activo === false || normalizarTexto(alumno.estatus) === 'inactivo' ? 'Inactivo' : 'Activo';
  $('fichaAlumno').classList.remove('oculto');
}

async function abrirRegistroManual() {
  if (!validarModulo()) return;
  $('panelRegistroManual').classList.remove('oculto');
  $('campoBusquedaManual').value = '';
  $('listaManual').classList.add('oculto');
  $('contadorManual').textContent = 'Escribe un nombre para buscar.';
  try {
    await cargarAlumnos();
    $('campoBusquedaManual').focus();
  } catch (error) {
    $('contadorManual').textContent = error.message;
  }
}

function renderizarBusquedaManual(termino) {
  const texto = normalizarTexto(termino);
  const lista = $('listaManual');
  if (texto.length < 2) {
    lista.classList.add('oculto');
    $('contadorManual').textContent = 'Escribe al menos dos letras.';
    return;
  }
  const filtrados = alumnos.filter((a) => normalizarTexto(nombreCompleto(a)).includes(texto));
  $('contadorManual').textContent = `${filtrados.length} coincidencias`;
  lista.classList.remove('oculto');
  lista.innerHTML = filtrados.length ? filtrados.map((a) => botonAlumnoHTML(a, 'manual')).join('') : '<div class="mensaje-lista">No se encontraron alumnos.</div>';
  lista.querySelectorAll('[data-manual-id]').forEach((boton) => boton.addEventListener('click', () => registrarManual(boton.dataset.manualId)));
}

async function registrarManual(id) {
  if (!validarModulo() || envioEnProceso) return;
  const alumno = alumnos.find((a) => String(a.id) === String(id));
  envioEnProceso = true;
  estado.textContent = '⏳ Registrando manualmente...';
  try {
    const respuesta = await solicitarJSONP('registrarManual', {
      id,
      modulo: moduloSeleccionado,
      campoFormativo: moduloSeleccionado === 'participacion' ? campoFormativo.value : '',
      tipoParticipacion: moduloSeleccionado === 'participacion' ? tipoParticipacion.value : ''
    });
    validarRespuesta(respuesta);
    const nombre = respuesta.nombre || respuesta.nombreCompleto || nombreCompleto(alumno || {});
    confirmarRegistro(nombre, moduloSeleccionado, 'Manual');
    $('panelRegistroManual').classList.add('oculto');
  } catch (error) {
    estado.textContent = '❌ No se pudo registrar.';
    resultado.textContent = error.message;
  } finally {
    envioEnProceso = false;
  }
}

async function alternarLectorNFC() {
  if (lectorActivo) {
    desactivarLectorNFC();
    return;
  }
  if (!validarModulo()) return;
  if (!('NDEFReader' in window)) {
    estado.textContent = '❌ Este dispositivo no es compatible con Web NFC.';
    return;
  }
  try {
    controladorNFC = new AbortController();
    lectorNFC = new NDEFReader();
    await lectorNFC.scan({ signal: controladorNFC.signal });
    lectorActivo = true;
    botonEscanear.textContent = 'Desactivar lector NFC';
    botonEscanear.classList.add('activo-lector');
    estado.textContent = '📡 Lector NFC activo. Acerca una tarjeta.';
    lectorNFC.onreading = procesarTarjeta;
    lectorNFC.onreadingerror = () => estado.textContent = '❌ No se pudo leer la tarjeta.';
  } catch (error) {
    lectorActivo = false;
    botonEscanear.textContent = 'Activar lector NFC';
    estado.textContent = `❌ ${error.message || 'No se pudo activar el lector NFC.'}`;
  }
}

function desactivarLectorNFC() {
  if (controladorNFC) controladorNFC.abort();
  lectorActivo = false;
  lectorNFC = null;
  controladorNFC = null;
  botonEscanear.textContent = 'Activar lector NFC';
  botonEscanear.classList.remove('activo-lector');
  estado.textContent = 'Lector NFC desactivado.';
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
  estado.textContent = '⏳ Enviando registro...';
  try {
    const respuesta = await solicitarJSONP('registrarNFC', {
      uid,
      modulo: moduloSeleccionado,
      campoFormativo: moduloSeleccionado === 'participacion' ? campoFormativo.value : '',
      tipoParticipacion: moduloSeleccionado === 'participacion' ? tipoParticipacion.value : ''
    });
    validarRespuesta(respuesta);
    confirmarRegistro(respuesta.nombre || respuesta.nombreCompleto || 'Alumno', moduloSeleccionado, 'NFC');
  } catch (error) {
    estado.textContent = '❌ No se pudo confirmar el registro.';
    resultado.textContent = error.message;
  } finally {
    envioEnProceso = false;
  }
}

function confirmarRegistro(nombre, modulo, metodo) {
  estado.textContent = lectorActivo ? '📡 Registro confirmado. Acerca otra tarjeta.' : '✅ Registro confirmado.';
  resultado.innerHTML = `✅ Registro guardado<br><strong>${escaparHTML(nombre)}</strong><br>${escaparHTML(formatearModulo(modulo))} · ${metodo}`;
  historialSesion.unshift({ nombre, modulo, metodo, hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) });
  renderizarHistorialSesion();
  if ('vibrate' in navigator) navigator.vibrate(180);
}

function renderizarHistorialSesion() {
  $('totalSesion').textContent = historialSesion.length;
  $('historialSesion').innerHTML = historialSesion.map((r) => `<article class="historial-item"><div class="historial-icono">${moduloPresentacion(r.modulo)}</div><div><strong>${escaparHTML(r.nombre)}</strong><p>${escaparHTML(formatearModulo(r.modulo))} · ${r.metodo}</p></div><time>${r.hora}</time></article>`).join('');
}

function validarModulo() {
  if (!moduloSeleccionado) {
    estado.textContent = '❌ Primero selecciona un módulo.';
    return false;
  }
  if (moduloSeleccionado === 'participacion' && (!campoFormativo.value || !tipoParticipacion.value)) {
    estado.textContent = '❌ Selecciona el campo formativo y el tipo de participación.';
    return false;
  }
  return true;
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
