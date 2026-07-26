const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbzEmz6mm_N6L0RyNTqpQdZn0SIFdrWQNjgwLv9liTdi2WaT68i-jK__Lr4EOdL0M3qcrg/exec";
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

let envioEnProceso = false;

function enviarRegistro(datos) {

  if (envioEnProceso) {
    return;
  }

  envioEnProceso = true;

  estado.textContent =
    "⏳ Guardando registro...";

  resultado.innerHTML = "";

  const parametros = new URLSearchParams({
    accion: "registrarNFC",
    uid: datos.uid,
    modulo: datos.modulo,
    campoFormativo:
      datos.campoFormativo || "",
    tipoParticipacion:
      datos.tipoParticipacion || "",
    callback: "respuestaAulaNFC",
    _: Date.now()
  });

  const etiquetaScript =
    document.createElement("script");

  etiquetaScript.id =
    "conexionAulaNFC";

  etiquetaScript.src =
    URL_APPS_SCRIPT +
    "?" +
    parametros.toString();

  etiquetaScript.onerror = function () {

    envioEnProceso = false;

    etiquetaScript.remove();

    estado.textContent =
      "❌ No se pudo recibir la respuesta de AulaNFC.";
  };

  document.body.appendChild(
    etiquetaScript
  );
}

function respuestaAulaNFC(respuesta) {

  envioEnProceso = false;

  const etiquetaScript =
    document.getElementById(
      "conexionAulaNFC"
    );

  if (etiquetaScript) {
    etiquetaScript.remove();
  }

  if (!respuesta || !respuesta.exito) {

    estado.textContent =
      "❌ " +
      (
        respuesta?.mensaje ||
        "No se pudo guardar el registro."
      );

    return;
  }

  estado.textContent =
    "📡 Registro guardado. Acerca otra tarjeta.";

  resultado.innerHTML = `
    ✅ Registro guardado correctamente
    <br><br>
    Módulo:
    ${formatearModulo(respuesta.modulo)}
    <br>
    UID:
    ${formatearUID(respuesta.uid)}
  `;

  vibrarTelefono();
}

function formatearUID(uid) {
  return String(uid || "")
    .replace(
      /(.{2})(?=.)/g,
      "$1:"
    );
}
