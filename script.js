const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyxSbdzdXQxvVxsPQ8ZA34HoH5U7mR8TpLxYo0sC64X98yAG0POgda76cJq-9YLI46FCg/exec";

const botonesModulos =
  document.querySelectorAll(".modulo");

const moduloActivo =
  document.getElementById("moduloActivo");

const botonEscanear =
  document.getElementById("btnEscanear");

const estado =
  document.getElementById("estado");

const resultado =
  document.getElementById("resultado");

const opcionesParticipacion =
  document.getElementById(
    "opcionesParticipacion"
  );

const campoFormativo =
  document.getElementById("campoFormativo");

const tipoParticipacion =
  document.getElementById(
    "tipoParticipacion"
  );

let moduloSeleccionado = "";
let lectorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;

botonesModulos.forEach((boton) => {

  boton.addEventListener("click", () => {

    botonesModulos.forEach((item) => {
      item.classList.remove("activo");
    });

    boton.classList.add("activo");

    moduloSeleccionado =
      boton.dataset.modulo;

    moduloActivo.textContent =
      formatearModulo(moduloSeleccionado);

    resultado.innerHTML = "";

    botonEscanear.disabled = false;

    estado.textContent =
      "Módulo listo. Activa el lector NFC.";

    if (
      moduloSeleccionado ===
      "participacion"
    ) {
      opcionesParticipacion.classList.remove(
        "oculto"
      );
    } else {
      opcionesParticipacion.classList.add(
        "oculto"
      );
    }

  });

});

botonEscanear.addEventListener(
  "click",
  iniciarNFC
);

async function iniciarNFC() {

  if (!moduloSeleccionado) {
    estado.textContent =
      "❌ Primero selecciona un módulo.";
    return;
  }

  if (
    moduloSeleccionado ===
    "participacion"
  ) {

    if (
      !campoFormativo.value ||
      !tipoParticipacion.value
    ) {
      estado.textContent =
        "❌ Selecciona el campo formativo y el tipo de participación.";
      return;
    }

  }

  if (!("NDEFReader" in window)) {
    estado.textContent =
      "❌ Este dispositivo no es compatible con Web NFC.";
    return;
  }

  if (lectorActivo) {
    estado.textContent =
      "📡 El lector NFC ya está activo.";
    return;
  }

  try {

    lectorNFC = new NDEFReader();

    await lectorNFC.scan();

    lectorActivo = true;

    botonEscanear.textContent =
      "Lector NFC activo";

    botonEscanear.disabled = true;

    estado.textContent =
      "📡 Escáner activo. Acerca una tarjeta.";

    lectorNFC.onreading = procesarTarjeta;

    lectorNFC.onreadingerror = () => {
      estado.textContent =
        "❌ No se pudo leer la tarjeta. Intenta nuevamente.";
    };

  } catch (error) {

    estado.textContent =
      "❌ " + error.message;

  }

}

function procesarTarjeta(evento) {

  const uid =
    evento.serialNumber || "";

  if (!uid) {
    resultado.innerHTML =
      "Tarjeta detectada, pero no se encontró el UID.";
    return;
  }

  const datosRegistro = {
    uid: uid,
    modulo: moduloSeleccionado,
    fecha: new Date().toISOString()
  };

  if (
    moduloSeleccionado ===
    "participacion"
  ) {
    datosRegistro.campoFormativo =
      campoFormativo.value;

    datosRegistro.tipoParticipacion =
      tipoParticipacion.value;
  }

  console.log(
    "Registro preparado:",
    datosRegistro
  );

  enviarRegistro(datosRegistro);
}

function enviarRegistro(datos) {

  if (envioEnProceso) {
    return;
  }

  envioEnProceso = true;

  estado.textContent =
    "⏳ Enviando registro...";

  resultado.innerHTML = "";

  const nombreCallback =
    "respuestaAulaNFC_" + Date.now();

  const parametros = new URLSearchParams({
    accion: "registrarNFC",
    uid: datos.uid,
    modulo: datos.modulo,
    campoFormativo:
      datos.campoFormativo || "",
    tipoParticipacion:
      datos.tipoParticipacion || "",
    callback: nombreCallback,
    t: Date.now()
  });

  const url =
    URL_APPS_SCRIPT +
    "?" +
    parametros.toString();

  console.log("URL enviada:", url);

  const scriptJSONP =
    document.createElement("script");

  let respuestaRecibida = false;

  const temporizador = setTimeout(() => {

    if (respuestaRecibida) {
      return;
    }

    limpiarPeticion();

    estado.textContent =
      "❌ Apps Script no respondió.";

    resultado.innerHTML = `
      No se recibió confirmación del servidor.
      <br><br>
      Revisa la implementación de Apps Script.
    `;

    envioEnProceso = false;

  }, 15000);

  window[nombreCallback] = function (
    respuesta
  ) {

    respuestaRecibida = true;

    clearTimeout(temporizador);

    limpiarPeticion();

    console.log(
      "Respuesta de Apps Script:",
      respuesta
    );

    if (respuesta.exito) {

      estado.textContent =
        "📡 Registro guardado. Acerca otra tarjeta.";

      resultado.innerHTML = `
        ✅ ${respuesta.mensaje}
        <br><br>
        Alumno:
        ${respuesta.alumno || ""}
        <br>
        UID:
        ${respuesta.uid || datos.uid}
      `;

      vibrarTelefono();

    } else {

      estado.textContent =
        "❌ No se guardó el registro.";

      resultado.innerHTML = `
        ${respuesta.mensaje ||
          "El servidor rechazó el registro."}
        <br><br>
        UID:
        ${respuesta.uid || datos.uid}
      `;

    }

    envioEnProceso = false;
  };

  scriptJSONP.onerror = function () {

    if (respuestaRecibida) {
      return;
    }

    clearTimeout(temporizador);

    limpiarPeticion();

    estado.textContent =
      "❌ No se pudo conectar con Apps Script.";

    resultado.innerHTML = `
      La petición no llegó correctamente
      al servidor.
    `;

    envioEnProceso = false;
  };

  function limpiarPeticion() {

    if (scriptJSONP.parentNode) {
      scriptJSONP.parentNode.removeChild(
        scriptJSONP
      );
    }

    try {
      delete window[nombreCallback];
    } catch (error) {
      window[nombreCallback] = undefined;
    }
  }

  scriptJSONP.src = url;

  document.body.appendChild(scriptJSONP);
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
    navigator.vibrate(180);
  }

}

function formatearUID(uid) {

  return String(uid || "")
    .replace(
      /(.{2})(?=.)/g,
      "$1:"
    );
}
