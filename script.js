const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwFS992F1sKOWPE0Tv_kXtM-YPoAas8d9rUW4qKnxtwecNYDa0tQw_ykq0eUZcjuZbv7Q/exec";
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

botonesModulos.forEach((boton) => {

  boton.addEventListener("click", () => {

    botonesModulos.forEach((item) => {
      item.classList.remove("activo");
    });

    boton.classList.add("activo");

    moduloSeleccionado =
      boton.dataset.modulo;

    moduloActivo.textContent =
      moduloSeleccionado;

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

function enviarRegistro(datos) {
  estado.textContent =
    "⏳ Guardando registro...";

  resultado.innerHTML = "";

  const callback =
    "respuestaAulaNFC_" + Date.now();

  const parametros =
    new URLSearchParams({
      accion: "registrarNFC",
      uid: datos.uid,
      modulo: datos.modulo,
      campoFormativo:
        datos.campoFormativo || "",
      tipoParticipacion:
        datos.tipoParticipacion || "",
      callback: callback
    });

  const script =
    document.createElement("script");

  const temporizador =
    setTimeout(() => {
      limpiar();

      estado.textContent =
        "❌ El servidor tardó demasiado en responder.";
    }, 15000);

  function limpiar() {
    clearTimeout(temporizador);
    script.remove();
    delete window[callback];
  }

  window[callback] = function (
    respuesta
  ) {
    limpiar();

    if (!respuesta.exito) {
      estado.textContent =
        "❌ " + respuesta.mensaje;
      return;
    }

    estado.textContent =
      "📡 Escáner activo. Acerca otra tarjeta.";

    resultado.innerHTML = `
      ✅ Registro guardado
      <br><br>
      Módulo:
      ${formatearModulo(
        respuesta.modulo
      )}
      <br>
      UID:
      ${formatearUID(
        respuesta.uid
      )}
    `;

    vibrarTelefono();
  };

  script.onerror = function () {
    limpiar();

    estado.textContent =
      "❌ No se pudo conectar con AulaNFC.";
  };

  script.src =
    URL_APPS_SCRIPT +
    "?" +
    parametros.toString();

  document.body.appendChild(script);
}

function formatearUID(uid) {
  return String(uid || "")
    .replace(
      /(.{2})(?=.)/g,
      "$1:"
    );
}
