const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyxSbdzdXQxvVxsPQ8ZA34HoH5U7mR8TpLxYo0sC64X98yAG0POgda76cJq-9YLI46FCg/exec";

/* ==========================================
   ELEMENTOS DE LA PÁGINA
========================================== */

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
  document.getElementById(
    "campoFormativo"
  );

const tipoParticipacion =
  document.getElementById(
    "tipoParticipacion"
  );

/* ==========================================
   VARIABLES DEL SISTEMA
========================================== */

let moduloSeleccionado = "";
let lectorNFC = null;
let lectorActivo = false;
let envioEnProceso = false;
let ultimoUID = "";
let momentoUltimoEscaneo = 0;

/* ==========================================
   SELECCIÓN DE MÓDULO
========================================== */

botonesModulos.forEach((boton) => {

  boton.addEventListener("click", () => {

    botonesModulos.forEach((item) => {
      item.classList.remove("activo");
    });

    boton.classList.add("activo");

    moduloSeleccionado =
      boton.dataset.modulo || "";

    moduloActivo.textContent =
      formatearModulo(
        moduloSeleccionado
      );

    resultado.innerHTML = "";

    if (!lectorActivo) {
      botonEscanear.disabled = false;

      botonEscanear.textContent =
        "Activar lector NFC";
    }

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

/* ==========================================
   ACTIVAR LECTOR NFC
========================================== */

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

    lectorNFC.onreading =
      procesarTarjeta;

    lectorNFC.onreadingerror = () => {

      estado.textContent =
        "❌ No se pudo leer la tarjeta. Intenta nuevamente.";

    };

  } catch (error) {

    console.error(
      "Error al activar NFC:",
      error
    );

    lectorActivo = false;

    botonEscanear.disabled = false;

    botonEscanear.textContent =
      "Activar lector NFC";

    estado.textContent =
      "❌ " +
      (
        error.message ||
        "No se pudo activar el lector NFC."
      );

  }

}

/* ==========================================
   PROCESAR TARJETA
========================================== */

function procesarTarjeta(evento) {

  const uid = String(
    evento.serialNumber || ""
  ).trim();

  if (!uid) {
    resultado.innerHTML =
      "❌ Tarjeta detectada, pero no se encontró el UID.";

    return;
  }

  /*
   * Evita registrar varias veces la misma
   * tarjeta en pocos segundos.
   */
  const ahora = Date.now();

  if (
    uid === ultimoUID &&
    ahora - momentoUltimoEscaneo < 3000
  ) {
    return;
  }

  ultimoUID = uid;
  momentoUltimoEscaneo = ahora;

  if (envioEnProceso) {
    estado.textContent =
      "⏳ Espera a que termine el registro anterior.";

    return;
  }

  if (!moduloSeleccionado) {
    estado.textContent =
      "❌ Primero selecciona un módulo.";

    return;
  }

  if (
    moduloSeleccionado ===
    "participacion" &&
    (
      !campoFormativo.value ||
      !tipoParticipacion.value
    )
  ) {
    estado.textContent =
      "❌ Selecciona el campo formativo y el tipo de participación.";

    return;
  }

  const datosRegistro = {
    uid: uid,
    modulo: moduloSeleccionado,
    campoFormativo: "",
    tipoParticipacion: ""
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

/* ==========================================
   ENVIAR REGISTRO A APPS SCRIPT
========================================== */

function enviarRegistro(datos) {

  if (envioEnProceso) {
    return;
  }

  envioEnProceso = true;

  estado.textContent =
    "⏳ Enviando registro...";

  resultado.innerHTML = "";

  const parametros =
    new URLSearchParams({
      accion: "registrarNFC",
      uid: datos.uid,
      modulo: datos.modulo,
      campoFormativo:
        datos.campoFormativo || "",
      tipoParticipacion:
        datos.tipoParticipacion || "",
      t: Date.now()
    });

  const url =
    URL_APPS_SCRIPT +
    "?" +
    parametros.toString();

  console.log(
    "URL enviada:",
    url
  );

  /*
   * Se carga Apps Script dentro de una
   * página invisible. Es equivalente a
   * abrir manualmente la dirección.
   */
  const marco =
    document.createElement("iframe");

  marco.style.position = "absolute";
  marco.style.width = "1px";
  marco.style.height = "1px";
  marco.style.border = "0";
  marco.style.opacity = "0";
  marco.style.pointerEvents = "none";
  marco.setAttribute(
    "aria-hidden",
    "true"
  );

  let finalizado = false;

  const temporizador =
    setTimeout(() => {

      if (finalizado) {
        return;
      }

      finalizado = true;

      eliminarMarco();

      estado.textContent =
        "⚠️ El servidor tardó demasiado.";

      resultado.innerHTML = `
        No se pudo confirmar el envío.
        <br><br>
        Revisa las hojas
        <strong>RegistrosNFC</strong>
        y
        <strong>ASISTENCIAS</strong>.
      `;

      envioEnProceso = false;

    }, 15000);

  marco.onload = function () {

    if (finalizado) {
      return;
    }

    finalizado = true;

    clearTimeout(temporizador);

    /*
     * Espera breve para que Apps Script
     * termine de escribir en Sheets.
     */
    setTimeout(() => {

      eliminarMarco();

      estado.textContent =
        "📡 Petición procesada. Acerca otra tarjeta.";

      resultado.innerHTML = `
        ✅ Registro enviado al servidor
        <br><br>
        Módulo:
        <strong>
          ${formatearModulo(
            datos.modulo
          )}
        </strong>
        <br>
        UID:
        <strong>
          ${formatearUID(
            datos.uid
          )}
        </strong>
      `;

      vibrarTelefono();

      envioEnProceso = false;

    }, 1200);

  };

  marco.onerror = function () {

    if (finalizado) {
      return;
    }

    finalizado = true;

    clearTimeout(temporizador);

    eliminarMarco();

    estado.textContent =
      "❌ No se pudo abrir Apps Script.";

    resultado.innerHTML = `
      La petición no pudo enviarse.
      <br><br>
      Revisa la conexión a Internet.
    `;

    envioEnProceso = false;

  };

  function eliminarMarco() {

    if (marco.parentNode) {
      marco.parentNode.removeChild(
        marco
      );
    }

  }

  /*
   * Primero se asigna la dirección
   * y después se agrega el iframe.
   */
  marco.src = url;

  document.body.appendChild(marco);
}

/* ==========================================
   FUNCIONES AUXILIARES
========================================== */

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

  const limpio = String(uid || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");

  if (!limpio) {
    return "";
  }

  const partes =
    limpio.match(/.{1,2}/g);

  return partes
    ? partes.join(":")
    : limpio;
}
