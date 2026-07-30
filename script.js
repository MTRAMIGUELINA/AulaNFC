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

const tabEscaner = document.getElementById("tabEscaner");
const tabBuscar = document.getElementById("tabBuscar");
const vistaEscaner = document.getElementById("vistaEscaner");
const vistaBuscar = document.getElementById("vistaBuscar");
const campoBusquedaAlumno = document.getElementById("campoBusquedaAlumno");
const contadorAlumnos = document.getElementById("contadorAlumnos");
const listaAlumnos = document.getElementById("listaAlumnos");
const fichaAlumno = document.getElementById("fichaAlumno");
const listaHistorial = document.getElementById("listaHistorial");

let moduloSeleccionado = "";
let lectorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;
let ultimoUID = "";
let momentoUltimoEscaneo = 0;
let alumnos = [];
let idAlumnoSeleccionado = "";
let alumnosCargados = false;

/* NAVEGACIÓN */
tabEscaner.addEventListener("click", () => cambiarVista("escaner"));
tabBuscar.addEventListener("click", () => cambiarVista("buscar"));

function cambiarVista(vista) {
  const buscar = vista === "buscar";
  vistaEscaner.classList.toggle("oculto", buscar);
  vistaBuscar.classList.toggle("oculto", !buscar);
  tabEscaner.classList.toggle("activo", !buscar);
  tabBuscar.classList.toggle("activo", buscar);
  if (buscar && !alumnosCargados) cargarAlumnos();
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
    opcionesParticipacion.classList.toggle(
      "oculto",
      moduloSeleccionado !== "participacion"
    );
  });
});

botonEscanear.addEventListener("click", iniciarNFC);

async function iniciarNFC() {
  if (!moduloSeleccionado) {
    estado.textContent = "❌ Primero selecciona un módulo.";
    return;
  }
  if (
    moduloSeleccionado === "participacion" &&
    (!campoFormativo.value || !tipoParticipacion.value)
  ) {
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
  if (!moduloSeleccionado) {
    estado.textContent = "❌ Primero selecciona un módulo.";
    return;
  }
  const datosRegistro = {
    uid,
    modulo: moduloSeleccionado,
    campoFormativo: moduloSeleccionado === "participacion" ? campoFormativo.value : "",
    tipoParticipacion: moduloSeleccionado === "participacion" ? tipoParticipacion.value : ""
  };
  enviarRegistro(datosRegistro);
}

function enviarRegistro(datos) {
  if (envioEnProceso) return;
  envioEnProceso = true;
  estado.textContent = "⏳ Enviando registro...";
  resultado.innerHTML = "";

  solicitarJSONP("registrarNFC", {
    uid: datos.uid,
    modulo: datos.modulo,
    campoFormativo: datos.campoFormativo,
    tipoParticipacion: datos.tipoParticipacion,
    t: Date.now()
  })
    .then((respuesta) => {
      if (!respuesta || (respuesta.exito !== true && respuesta.ok !== true)) {
        throw new Error(respuesta?.mensaje || "Apps Script no confirmó el registro.");
      }
      estado.textContent = "📡 Registro confirmado. Acerca otra tarjeta.";
      resultado.innerHTML = `✅ ${escaparHTML(respuesta.mensaje || "Registro guardado")}<br><br><strong>${escaparHTML(respuesta.nombre || respuesta.nombreCompleto || "")}</strong><br>${formatearModulo(datos.modulo)} · ${formatearUID(datos.uid)}`;
      vibrarTelefono();
    })
    .catch((error) => {
      console.error("Error al enviar:", error);
      estado.textContent = "❌ No se pudo confirmar el registro.";
      resultado.textContent = error.message;
    })
    .finally(() => {
      envioEnProceso = false;
    });
}

/* BUSCAR ALUMNO */
campoBusquedaAlumno.addEventListener("input", () => renderizarAlumnos(campoBusquedaAlumno.value));

function cargarAlumnos() {
  contadorAlumnos.textContent = "Cargando alumnos...";
  listaAlumnos.innerHTML = '<div class="mensaje-lista">Cargando...</div>';
  solicitarJSONP("obtenerAlumnos")
    .then((respuesta) => {
      if (!respuesta || respuesta.exito !== true) {
        throw new Error(respuesta?.mensaje || "No fue posible obtener los alumnos.");
      }
      alumnos = Array.isArray(respuesta.alumnos) ? respuesta.alumnos : [];
      alumnosCargados = true;
      renderizarAlumnos("");
    })
    .catch((error) => {
      contadorAlumnos.textContent = "No disponible";
      listaAlumnos.innerHTML = `<div class="mensaje-lista error">${escaparHTML(error.message)}</div>`;
    });
}

function renderizarAlumnos(termino) {
  const texto = normalizarTexto(termino);
  const filtrados = alumnos.filter((alumno) =>
    normalizarTexto(nombreCompleto(alumno)).includes(texto)
  );
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

  listaAlumnos.querySelectorAll(".alumno-item").forEach((boton) => {
    boton.addEventListener("click", () => seleccionarAlumno(boton.dataset.id));
  });
}

function seleccionarAlumno(id) {
  idAlumnoSeleccionado = String(id || "");
  renderizarAlumnos(campoBusquedaAlumno.value);
  fichaAlumno.classList.remove("oculto");
  listaHistorial.innerHTML = '<div class="mensaje-lista">Cargando historial...</div>';

  solicitarJSONP("obtenerReporteAlumno", { id: idAlumnoSeleccionado })
    .then((respuesta) => {
      if (!respuesta || respuesta.exito !== true) {
        throw new Error(respuesta?.mensaje || "No fue posible obtener la ficha.");
      }
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
  document.getElementById("estadoAlumno").textContent =
    alumno.activo === false || String(alumno.estatus || "").toUpperCase() === "INACTIVO"
      ? "Inactivo"
      : "Activo";
  document.getElementById("totalHistorial").textContent = `${historial.length} ${historial.length === 1 ? "registro" : "registros"}`;

  if (!historial.length) {
    listaHistorial.innerHTML = '<div class="mensaje-lista">Este alumno todavía no tiene registros.</div>';
    return;
  }
  listaHistorial.innerHTML = historial.map((registro) => {
    const presentacion = moduloPresentacion(registro.modulo);
    return `<article class="historial-item"><div class="historial-icono">${presentacion}</div><div><strong>${escaparHTML(registro.modulo || "Registro")}</strong><p>${escaparHTML(registro.registro || "Registro guardado")}</p></div><time>${escaparHTML([registro.fecha, registro.hora].filter(Boolean).join(" · "))}</time></article>`;
  }).join("");
}

/* JSONP: compatible con GitHub Pages y Apps Script */
function solicitarJSONP(accion, parametros = {}) {
  return new Promise((resolve, reject) => {
    const callback = `aulaNfcCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeout = setTimeout(() => finalizar(new Error("La solicitud tardó demasiado.")), 15000);

    function limpiar() {
      clearTimeout(timeout);
      delete window[callback];
      script.remove();
    }
    function finalizar(error, datos) {
      limpiar();
      error ? reject(error) : resolve(datos);
    }

    window[callback] = (datos) => finalizar(null, datos);
    script.onerror = () => finalizar(new Error("No se pudo conectar con Apps Script."));

    const query = new URLSearchParams({ accion, ...parametros, callback, t: Date.now() });
    script.src = `${URL_APPS_SCRIPT}?${query.toString()}`;
    document.body.appendChild(script);
  });
}

function formatearModulo(modulo) {
  return ({ asistencia: "Asistencia", tareas: "Tareas", participacion: "Participación", conducta: "Conducta", lectura: "Lectura" })[modulo] || modulo;
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
function vibrarTelefono() {
  if ("vibrate" in navigator) navigator.vibrate(180);
}
function formatearUID(uid) {
  const limpio = String(uid || "").trim().toUpperCase().replace(/[^0-9A-F]/g, "");
  const partes = limpio.match(/.{1,2}/g);
  return partes ? partes.join(":") : limpio;
}