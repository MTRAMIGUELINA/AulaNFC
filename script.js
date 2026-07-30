const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyYdimHGfauQU-z9pwYYdzb60Bcod9lYHgIypsGhhj0Qy9hsQnLJ747IikxKr0El4ObbA/exec";

const botonesModulos = document.querySelectorAll(".modulo");
const moduloActivo = document.getElementById("moduloActivo");
const botonEscanear = document.getElementById("btnEscanear");
const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");
const opcionesParticipacion = document.getElementById("opcionesParticipacion");
const campoFormativo = document.getElementById("campoFormativo");
const tipoParticipacion = document.getElementById("tipoParticipacion");

const btnAbrirBuscar = document.getElementById("btnAbrirBuscar");
const btnCerrarBuscar = document.getElementById("btnCerrarBuscar");
const vistaBuscar = document.getElementById("vistaBuscar");
const campoBusquedaAlumno = document.getElementById("campoBusquedaAlumno");
const contadorAlumnos = document.getElementById("contadorAlumnos");
const listaAlumnos = document.getElementById("listaAlumnos");
const fichaAlumno = document.getElementById("fichaAlumno");
const listaHistorial = document.getElementById("listaHistorial");

const fechaHistorial = document.getElementById("fechaHistorial");
const btnConsultarFecha = document.getElementById("btnConsultarFecha");
const btnHistorialGeneral = document.getElementById("btnHistorialGeneral");
const estadoHistorial = document.getElementById("estadoHistorial");
const listaHistorialGeneral = document.getElementById("listaHistorialGeneral");

let moduloSeleccionado = "";
let lectorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;
let ultimoUID = "";
let momentoUltimoEscaneo = 0;
let alumnos = [];
let idAlumnoSeleccionado = "";
let alumnosCargados = false;

inicializarFecha();
consultarHistorialFecha();

btnAbrirBuscar.addEventListener("click", abrirBuscarAlumno);
btnCerrarBuscar.addEventListener("click", () => vistaBuscar.classList.add("oculto"));
btnConsultarFecha.addEventListener("click", consultarHistorialFecha);
btnHistorialGeneral.addEventListener("click", consultarHistorialGeneral);
fechaHistorial.addEventListener("change", consultarHistorialFecha);

function abrirBuscarAlumno() {
  vistaBuscar.classList.remove("oculto");
  vistaBuscar.scrollIntoView({ behavior: "smooth", block: "start" });
  if (!alumnosCargados) cargarAlumnos();
  else campoBusquedaAlumno.focus();
}

function inicializarFecha() {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);
  fechaHistorial.value = local.toISOString().slice(0, 10);
}

async function consultarHistorialFecha() {
  const fecha = fechaHistorial.value;
  if (!fecha) return;
  prepararConsultaHistorial(`Consultando registros del ${formatearFechaVisible(fecha)}...`);
  try {
    const respuesta = await solicitarJSONP("obtenerHistorialGeneral", { fecha });
    validarRespuestaHistorial(respuesta);
    mostrarHistorialConsulta(respuesta, `Historial del ${formatearFechaVisible(fecha)}`);
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

async function consultarHistorialGeneral() {
  prepararConsultaHistorial("Consultando todo el historial...");
  try {
    const respuesta = await solicitarJSONP("obtenerHistorialGeneral");
    validarRespuestaHistorial(respuesta);
    mostrarHistorialConsulta(respuesta, "Historial general");
  } catch (error) {
    mostrarErrorHistorial(error);
  }
}

function prepararConsultaHistorial(mensaje) {
  estadoHistorial.textContent = mensaje;
  listaHistorialGeneral.innerHTML = '<div class="mensaje-lista">Cargando...</div>';
  btnConsultarFecha.disabled = true;
  btnHistorialGeneral.disabled = true;
}

function validarRespuestaHistorial(respuesta) {
  if (!respuesta || respuesta.exito !== true) {
    throw new Error(respuesta?.mensaje || "No fue posible consultar el historial.");
  }
}

function mostrarHistorialConsulta(respuesta, titulo) {
  const registros = Array.isArray(respuesta.registros)
    ? respuesta.registros
    : Array.isArray(respuesta.historial)
      ? respuesta.historial
      : [];
  const resumen = respuesta.resumen || contarModulos(registros);
  actualizarResumen(resumen, registros.length);
  estadoHistorial.textContent = `${titulo}: ${registros.length} ${registros.length === 1 ? "registro" : "registros"}.`;

  if (!registros.length) {
    listaHistorialGeneral.innerHTML = '<div class="mensaje-lista">No hay registros para esta consulta.</div>';
  } else {
    listaHistorialGeneral.innerHTML = registros.map(crearTarjetaHistorial).join("");
  }
  btnConsultarFecha.disabled = false;
  btnHistorialGeneral.disabled = false;
}

function mostrarErrorHistorial(error) {
  console.error("Error al consultar historial:", error);
  actualizarResumen({}, 0);
  estadoHistorial.textContent = "No se pudo cargar el historial.";
  listaHistorialGeneral.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message || "Error de consulta")}</div>`;
  btnConsultarFecha.disabled = false;
  btnHistorialGeneral.disabled = false;
}

function contarModulos(registros) {
  return registros.reduce((totales, registro) => {
    const modulo = normalizarTexto(registro.modulo);
    if (modulo.includes("asistencia")) totales.asistencias++;
    else if (modulo.includes("tarea")) totales.tareas++;
    else if (modulo.includes("participacion")) totales.participaciones++;
    else if (modulo.includes("conducta")) totales.conductas++;
    else if (modulo.includes("lectura")) totales.lecturas++;
    return totales;
  }, { asistencias: 0, tareas: 0, participaciones: 0, conductas: 0, lecturas: 0 });
}

function actualizarResumen(resumen, total) {
  document.getElementById("totalAsistencias").textContent = numeroResumen(resumen, "asistencias", "asistencia");
  document.getElementById("totalTareas").textContent = numeroResumen(resumen, "tareas", "tarea");
  document.getElementById("totalParticipaciones").textContent = numeroResumen(resumen, "participaciones", "participacion");
  document.getElementById("totalConductas").textContent = numeroResumen(resumen, "conductas", "conducta");
  document.getElementById("totalLecturas").textContent = numeroResumen(resumen, "lecturas", "lectura");
  document.getElementById("totalRegistrosConsulta").textContent = Number(resumen.total ?? total ?? 0);
}

function numeroResumen(resumen, plural, singular) {
  return Number(resumen?.[plural] ?? resumen?.[singular] ?? 0);
}

function crearTarjetaHistorial(registro) {
  const modulo = registro.modulo || registro.tipo || "Registro";
  const alumno = registro.nombre || registro.nombreCompleto || registro.alumno || "Alumno";
  const detalle = registro.registro || registro.detalle || registro.valor || formatearModulo(modulo);
  const fechaHora = [registro.fecha, registro.hora].filter(Boolean).join(" · ");
  return `<article class="historial-item"><div class="historial-icono">${moduloPresentacion(modulo)}</div><div><strong>${escaparHTML(alumno)}</strong><p>${escaparHTML(formatearModulo(modulo))} · ${escaparHTML(detalle)}</p></div><time>${escaparHTML(fechaHora)}</time></article>`;
}

/* ESCÁNER */
botonesModulos.forEach((boton) => {
  boton.addEventListener("click", () => {
    botonesModulos.forEach((item) => item.classList.remove("activo"));
    boton.classList.add("activo");
    moduloSeleccionado = boton.dataset.modulo || "";
    moduloActivo.textContent = formatearModulo(moduloSeleccionado);
    resultado.innerHTML = "";
    if (!lectorActivo) {
      botonEscanear.disabled = false;
      botonEscanear.textContent = "Activar lector NFC";
    }
    estado.textContent = "Módulo listo. Activa el lector NFC.";
    opcionesParticipacion.classList.toggle("oculto", moduloSeleccionado !== "participacion");
  });
});

botonEscanear.addEventListener("click", iniciarNFC);

async function iniciarNFC() {
  if (!moduloSeleccionado) {
    estado.textContent = "❌ Primero selecciona un módulo.";
    return;
  }
  if (moduloSeleccionado === "participacion" && (!campoFormativo.value || !tipoParticipacion.value)) {
    estado.textContent = "❌ Selecciona el campo formativo y el tipo de participación.";
    return;
  }
  if (!("NDEFReader" in window)) {
    estado.textContent = "❌ Este dispositivo no es compatible con Web NFC.";
    return;
  }
  if (lectorActivo) {
    estado.textContent = "📡 El lector NFC ya está activo.";
    return;
  }
  try {
    lectorNFC = new NDEFReader();
    await lectorNFC.scan();
    lectorActivo = true;
    botonEscanear.textContent = "Lector NFC activo";
    botonEscanear.disabled = true;
    estado.textContent = "📡 Escáner activo. Acerca una tarjeta.";
    lectorNFC.onreading = procesarTarjeta;
    lectorNFC.onreadingerror = () => {
      estado.textContent = "❌ No se pudo leer la tarjeta. Intenta nuevamente.";
    };
  } catch (error) {
    console.error("Error al activar NFC:", error);
    lectorActivo = false;
    botonEscanear.disabled = false;
    botonEscanear.textContent = "Activar lector NFC";
    estado.textContent = "❌ " + (error.message || "No se pudo activar el lector NFC.");
  }
}

function procesarTarjeta(evento) {
  const uid = String(evento.serialNumber || "").trim();
  if (!uid) {
    resultado.innerHTML = "❌ Tarjeta detectada, pero no se encontró el UID.";
    return;
  }
  const ahora = Date.now();
  if (uid === ultimoUID && ahora - momentoUltimoEscaneo < 3000) return;
  ultimoUID = uid;
  momentoUltimoEscaneo = ahora;
  if (envioEnProceso) {
    estado.textContent = "⏳ Espera a que termine el registro anterior.";
    return;
  }
  enviarRegistro({
    uid,
    modulo: moduloSeleccionado,
    campoFormativo: moduloSeleccionado === "participacion" ? campoFormativo.value : "",
    tipoParticipacion: moduloSeleccionado === "participacion" ? tipoParticipacion.value : ""
  });
}

function enviarRegistro(datos) {
  if (envioEnProceso) return;
  envioEnProceso = true;
  estado.textContent = "⏳ Enviando registro...";
  resultado.innerHTML = "";
  solicitarJSONP("registrarNFC", { ...datos })
    .then((respuesta) => {
      if (!respuesta || (respuesta.exito !== true && respuesta.ok !== true)) {
        throw new Error(respuesta?.mensaje || "Apps Script no confirmó el registro.");
      }
      estado.textContent = "📡 Registro confirmado. Acerca otra tarjeta.";
      resultado.innerHTML = `✅ ${escaparHTML(respuesta.mensaje || "Registro guardado")}<br><br><strong>${escaparHTML(respuesta.nombre || respuesta.nombreCompleto || "")}</strong><br>${formatearModulo(datos.modulo)} · ${formatearUID(datos.uid)}`;
      vibrarTelefono();
      consultarHistorialFecha();
    })
    .catch((error) => {
      console.error("Error al enviar:", error);
      estado.textContent = "❌ No se pudo confirmar el registro.";
      resultado.textContent = error.message;
    })
    .finally(() => { envioEnProceso = false; });
}

/* BUSCAR ALUMNO */
campoBusquedaAlumno.addEventListener("input", () => renderizarAlumnos(campoBusquedaAlumno.value));

function cargarAlumnos() {
  contadorAlumnos.textContent = "Cargando alumnos...";
  listaAlumnos.innerHTML = '<div class="mensaje-lista">Cargando...</div>';
  solicitarJSONP("obtenerAlumnos")
    .then((respuesta) => {
      if (!respuesta || respuesta.exito !== true) throw new Error(respuesta?.mensaje || "No fue posible obtener los alumnos.");
      alumnos = Array.isArray(respuesta.alumnos) ? respuesta.alumnos : [];
      alumnosCargados = true;
      renderizarAlumnos("");
      campoBusquedaAlumno.focus();
    })
    .catch((error) => {
      contadorAlumnos.textContent = "No disponible";
      listaAlumnos.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message)}</div>`;
    });
}

function renderizarAlumnos(termino) {
  const texto = normalizarTexto(termino);
  const filtrados = alumnos.filter((alumno) => normalizarTexto(nombreCompleto(alumno)).includes(texto));
  contadorAlumnos.textContent = `${filtrados.length} ${filtrados.length === 1 ? "alumno" : "alumnos"}`;
  if (!filtrados.length) {
    listaAlumnos.innerHTML = '<div class="mensaje-lista">No se encontraron alumnos.</div>';
    return;
  }
  listaAlumnos.innerHTML = filtrados.map((alumno) => {
    const nombre = nombreCompleto(alumno);
    const activo = String(alumno.id) === idAlumnoSeleccionado ? " activo" : "";
    return `<button class="alumno-item${activo}" type="button" data-id="${escaparHTML(alumno.id)}"><span class="avatar-pequeno">${iniciales(nombre)}</span><span><strong>${escaparHTML(nombre)}</strong><small>${escaparHTML(gradoGrupo(alumno))}</small></span></button>`;
  }).join("");
  listaAlumnos.querySelectorAll(".alumno-item").forEach((boton) => boton.addEventListener("click", () => seleccionarAlumno(boton.dataset.id)));
}

function seleccionarAlumno(id) {
  idAlumnoSeleccionado = String(id || "");
  renderizarAlumnos(campoBusquedaAlumno.value);
  fichaAlumno.classList.remove("oculto");
  listaHistorial.innerHTML = '<div class="mensaje-lista">Cargando historial...</div>';
  solicitarJSONP("obtenerReporteAlumno", { id: idAlumnoSeleccionado })
    .then((respuesta) => {
      if (!respuesta || respuesta.exito !== true) throw new Error(respuesta?.mensaje || "No fue posible obtener la ficha.");
      mostrarFicha(respuesta);
    })
    .catch((error) => {
      listaHistorial.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message)}</div>`;
    });
}

function mostrarFicha(respuesta) {
  const alumno = respuesta.alumno || {};
  const historial = Array.isArray(respuesta.historial) ? respuesta.historial : [];
  const nombre = nombreCompleto(alumno);
  document.getElementById("inicialesAlumno").textContent = iniciales(nombre);
  document.getElementById("nombreAlumno").textContent = nombre;
  document.getElementById("gradoGrupoAlumno").textContent = gradoGrupo(alumno);
  document.getElementById("idAlumno").textContent = alumno.id || "—";
  document.getElementById("uidAlumno").textContent = alumno.uid || "Sin UID";
  document.getElementById("estadoAlumno").textContent = alumno.activo === false || String(alumno.estatus || "").toUpperCase() === "INACTIVO" ? "Inactivo" : "Activo";
  document.getElementById("totalHistorial").textContent = `${historial.length} ${historial.length === 1 ? "registro" : "registros"}`;
  listaHistorial.innerHTML = historial.length
    ? historial.map(crearTarjetaHistorial).join("")
    : '<div class="mensaje-lista">Este alumno todavía no tiene registros.</div>';
}

function solicitarJSONP(accion, parametros = {}) {
  return new Promise((resolve, reject) => {
    const callback = `aulaNfcCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => finalizar(new Error("La solicitud tardó demasiado.")), 15000);
    function limpiar() { clearTimeout(timeout); delete window[callback]; script.remove(); }
    function finalizar(error, datos) { limpiar(); error ? reject(error) : resolve(datos); }
    window[callback] = (datos) => finalizar(null, datos);
    script.onerror = () => finalizar(new Error("No se pudo conectar con Apps Script."));
    const query = new URLSearchParams({ accion, ...parametros, callback, t: Date.now() });
    script.src = `${URL_APPS_SCRIPT}?${query.toString()}`;
    document.body.appendChild(script);
  });
}

function formatearModulo(modulo) {
  return ({ asistencia: "Asistencia", asistencias: "Asistencia", tareas: "Tareas", participacion: "Participación", participación: "Participación", conducta: "Conducta", lectura: "Lectura" })[normalizarTexto(modulo)] || modulo;
}
function moduloPresentacion(modulo) {
  const nombre = normalizarTexto(modulo);
  if (nombre.includes("asistencia")) return "🟢";
  if (nombre.includes("tarea")) return "🟡";
  if (nombre.includes("participacion")) return "🔵";
  if (nombre.includes("conducta")) return "🟣";
  if (nombre.includes("lectura")) return "🟠";
  return "📌";
}
function nombreCompleto(alumno) {
  return String(alumno?.nombreCompleto || [alumno?.nombre, alumno?.apellidoPaterno, alumno?.apellidoMaterno].filter(Boolean).join(" ") || "Alumno").replace(/\s+/g, " ").trim();
}
function gradoGrupo(alumno) {
  const grado = String(alumno?.grado || "").trim();
  const grupo = String(alumno?.grupo || "").trim();
  return grado && grupo ? `${grado} · Grupo ${grupo}` : grado || grupo || "Sin grado y grupo";
}
function iniciales(nombre) {
  const partes = String(nombre || "").trim().split(/\s+/).filter(Boolean);
  return partes.length > 1 ? (partes[0][0] + partes[1][0]).toUpperCase() : (partes[0] || "AL").slice(0, 2).toUpperCase();
}
function normalizarTexto(texto) {
  return String(texto || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function escaparHTML(texto) {
  return String(texto ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function vibrarTelefono() { if ("vibrate" in navigator) navigator.vibrate(180); }
function formatearUID(uid) {
  const limpio = String(uid || "").trim().toUpperCase().replace(/[^0-9A-F]/g, "");
  const partes = limpio.match(/.{1,2}/g);
  return partes ? partes.join(":") : limpio;
}
function formatearFechaVisible(fechaISO) {
  const [anio, mes, dia] = String(fechaISO).split("-");
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : fechaISO;
}