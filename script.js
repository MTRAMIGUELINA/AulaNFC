const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyxSbdzdXQxvVxsPQ8ZA34HoH5U7mR8TpLxYo0sC64X98yAG0POgda76cJq-9YLI46FCg/exec";

const botonesModulos = document.querySelectorAll(".modulo");
const moduloActivo = document.getElementById("moduloActivo");
const botonEscanear = document.getElementById("btnEscanear");
const estado = document.getElementById("estado");
const resultado = document.getElementById("resultado");
const opcionesParticipacion = document.getElementById("opcionesParticipacion");
const campoFormativo = document.getElementById("campoFormativo");
const tipoParticipacion = document.getElementById("tipoParticipacion");

let moduloSeleccionado = "";
let lectorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;
let ultimoUID = "";
let momentoUltimoEscaneo = 0;

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

    estado.textContent = lectorActivo
      ? "📡 Escáner activo. Acerca una tarjeta."
      : "Módulo listo. Activa el lector NFC.";

    opcionesParticipacion.classList.toggle(
      "oculto",
      moduloSeleccionado !== "participacion"
    );
  });
});

botonEscanear.addEventListener("click", iniciarNFC);

async function iniciarNFC() {
  if (!moduloSeleccionado) {
    mostrarEstado("❌ Primero selecciona un módulo.");
    return;
  }

  if (!validarOpcionesParticipacion()) {
    return;
  }

  if (!("NDEFReader" in window)) {
    mostrarEstado("❌ Este dispositivo no es compatible con Web NFC.");
    return;
  }

  if (lectorActivo) {
    mostrarEstado("📡 El lector NFC ya está activo.");
    return;
  }

  try {
    lectorNFC = new NDEFReader();
    await lectorNFC.scan();

    lectorActivo = true;
    botonEscanear.textContent = "Lector NFC activo";
    botonEscanear.disabled = true;
    mostrarEstado("📡 Escáner activo. Acerca una tarjeta.");

    lectorNFC.onreading = procesarTarjeta;
    lectorNFC.onreadingerror = () => {
      mostrarEstado("❌ No se pudo leer la tarjeta. Intenta nuevamente.");
    };
  } catch (error) {
    console.error("Error al activar NFC:", error);
    lectorActivo = false;
    botonEscanear.disabled = false;
    botonEscanear.textContent = "Activar lector NFC";
    mostrarEstado(`❌ ${mensajeErrorNFC(error)}`);
  }
}

function procesarTarjeta(evento) {
  const uid = String(evento.serialNumber || "").trim();

  if (!uid) {
    mostrarResultadoError("Tarjeta detectada, pero no se encontró el UID.");
    return;
  }

  const ahora = Date.now();
  if (uid === ultimoUID && ahora - momentoUltimoEscaneo < 3000) {
    return;
  }

  if (envioEnProceso) {
    mostrarEstado("⏳ Espera a que termine el registro anterior.");
    return;
  }

  if (!moduloSeleccionado) {
    mostrarEstado("❌ Primero selecciona un módulo.");
    return;
  }

  if (!validarOpcionesParticipacion()) {
    return;
  }

  ultimoUID = uid;
  momentoUltimoEscaneo = ahora;

  enviarRegistro({
    uid,
    modulo: moduloSeleccionado,
    campoFormativo:
      moduloSeleccionado === "participacion" ? campoFormativo.value : "",
    tipoParticipacion:
      moduloSeleccionado === "participacion" ? tipoParticipacion.value : ""
  });
}

function enviarRegistro(datos) {
  if (envioEnProceso) {
    return;
  }

  envioEnProceso = true;
  mostrarEstado("⏳ Registrando tarjeta...");
  resultado.innerHTML = "";

  const nombreCallback = `aulaNfcCallback_${Date.now()}_${Math.floor(
    Math.random() * 100000
  )}`;
  const script = document.createElement("script");
  let finalizado = false;

  const limpiar = () => {
    if (finalizado) return;
    finalizado = true;
    clearTimeout(temporizador);
    script.remove();
    delete window[nombreCallback];
    envioEnProceso = false;
  };

  window[nombreCallback] = (respuesta) => {
    limpiar();
    procesarRespuesta(respuesta, datos);
  };

  const parametros = new URLSearchParams({
    accion: "registrarNFC",
    uid: datos.uid,
    modulo: datos.modulo,
    campoFormativo: datos.campoFormativo || "",
    tipoParticipacion: datos.tipoParticipacion || "",
    callback: nombreCallback,
    t: String(Date.now())
  });

  script.src = `${URL_APPS_SCRIPT}?${parametros.toString()}`;
  script.async = true;
  script.onerror = () => {
    limpiar();
    mostrarEstado("❌ No se pudo conectar con AulaNFC.");
    mostrarResultadoError(
      "Revisa la conexión a internet y que el Web App de Apps Script esté desplegado."
    );
  };

  const temporizador = setTimeout(() => {
    limpiar();
    mostrarEstado("❌ Apps Script tardó demasiado en responder.");
    mostrarResultadoError("El registro no pudo confirmarse.");
  }, 15000);

  document.body.appendChild(script);
}

function procesarRespuesta(respuesta, datos) {
  const esExitosa = Boolean(respuesta && respuesta.exito);

  if (!esExitosa) {
    const mensaje =
      respuesta && respuesta.mensaje
        ? respuesta.mensaje
        : "Apps Script no confirmó el registro.";
    mostrarEstado("❌ No se guardó el registro.");
    mostrarResultadoError(mensaje);
    return;
  }

  const alumno =
    respuesta.nombre ||
    respuesta.alumno ||
    respuesta.nombreAlumno ||
    "Alumno identificado";
  const mensaje = respuesta.mensaje || "Registro guardado correctamente.";

  mostrarEstado("📡 Registro confirmado. Acerca otra tarjeta.");
  resultado.innerHTML = `
    <div class="registro-exitoso">
      <div class="icono-confirmacion">✅</div>
      <div class="nombre-alumno">${escaparHTML(alumno)}</div>
      <div class="mensaje-registro">${escaparHTML(mensaje)}</div>
      <div class="detalle-registro">
        <strong>${escaparHTML(formatearModulo(datos.modulo))}</strong><br>
        UID: ${escaparHTML(formatearUID(datos.uid))}
      </div>
    </div>
  `;

  vibrarTelefono();
}

function validarOpcionesParticipacion() {
  if (
    moduloSeleccionado === "participacion" &&
    (!campoFormativo.value || !tipoParticipacion.value)
  ) {
    mostrarEstado(
      "❌ Selecciona el campo formativo y el tipo de participación."
    );
    return false;
  }
  return true;
}

function mostrarEstado(mensaje) {
  estado.textContent = mensaje;
}

function mostrarResultadoError(mensaje) {
  resultado.innerHTML = `<div class="registro-error">${escaparHTML(mensaje)}</div>`;
}

function mensajeErrorNFC(error) {
  const nombre = error && error.name ? error.name : "";

  if (nombre === "NotAllowedError") {
    return "Debes permitir el uso de NFC en el navegador.";
  }
  if (nombre === "NotSupportedError") {
    return "Web NFC no está disponible en este dispositivo o navegador.";
  }
  if (nombre === "InvalidStateError") {
    return "El lector NFC ya está siendo utilizado.";
  }

  return error && error.message
    ? error.message
    : "No se pudo activar el lector NFC.";
}

function formatearModulo(modulo) {
  const nombres = {
    asistencia: "Asistencia",
    tareas: "Tareas",
    participacion: "Participación",
    conducta: "Conducta",
    lectura: "Lectura"
  };
  return nombres[modulo] || modulo;
}

function vibrarTelefono() {
  if ("vibrate" in navigator) {
    navigator.vibrate([120, 70, 120]);
  }
}

function formatearUID(uid) {
  const limpio = String(uid || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");

  if (!limpio) return "";
  const partes = limpio.match(/.{1,2}/g);
  return partes ? partes.join(":") : limpio;
}

function escaparHTML(valor) {
  return String(valor == null ? "" : valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
