const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycby93u65Cl9bVCXjrxHaeKQvp90DC_ajvZq5UD2tC4_fseOEKbMZyJgoLJd-x0cj9pB2Pg/exec";
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

async function enviarRegistro(datos) {

  if (envioEnProceso) {
    return;
  }

  envioEnProceso = true;

  estado.textContent =
    "⏳ Enviando registro...";

  resultado.innerHTML = "";

  const parametros = new URLSearchParams({
    accion: "registrarNFC",
    uid: datos.uid,
    modulo: datos.modulo,
    campoFormativo:
      datos.campoFormativo || "",
    tipoParticipacion:
      datos.tipoParticipacion || "",
    _: Date.now()
  });

  const url =
    URL_APPS_SCRIPT +
    "?" +
    parametros.toString();

  try {

    await fetch(url, {
      method: "GET",
      mode: "no-cors",
      cache: "no-store"
    });

    estado.textContent =
      "📡 Registro enviado. Acerca otra tarjeta.";

    resultado.innerHTML = `
      ✅ Registro enviado
      <br><br>
      Módulo:
      ${formatearModulo(datos.modulo)}
      <br>
      UID:
      ${datos.uid}
    `;

    vibrarTelefono();

  } catch (error) {

    estado.textContent =
      "❌ No se pudo enviar el registro.";

    resultado.innerHTML =
      error.message;

  } finally {

    envioEnProceso = false;

  }

}

function formatearUID(uid) {
  return String(uid || "")
    .replace(
      /(.{2})(?=.)/g,
      "$1:"
    );
}
