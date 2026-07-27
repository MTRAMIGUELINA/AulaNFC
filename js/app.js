import { sendRegistration } from "./api.js";
import { isScannerActive, startScanner } from "./scanner.js";
import {
  formatModule,
  formatUid,
  getElements,
  getParticipationData,
  setResult,
  setScannerButton,
  setSelectedModule,
  setStatus,
  vibrate
} from "./ui.js";

const elements = getElements();
let selectedModule = "";
let sending = false;
let readyTimer = null;

elements.moduleButtons.forEach((button) => {
  button.addEventListener("click", () => selectModule(button.dataset.modulo || ""));
});

elements.scanButton.addEventListener("click", activateScanner);

function selectModule(moduleName) {
  selectedModule = moduleName;
  setSelectedModule(moduleName);
  clearReadyTimer();

  if (!isScannerActive()) {
    setScannerButton({ disabled: false, text: "Activar lector NFC" });
    setStatus("Módulo listo. Activa el lector NFC.");
  } else {
    setStatus("📡 Escáner activo. Acerca una tarjeta.");
  }
}

function validateSelection() {
  if (!selectedModule) {
    setStatus("❌ Primero selecciona un módulo.");
    return false;
  }

  if (selectedModule === "participacion") {
    const participation = getParticipationData();

    if (!participation.campoFormativo || !participation.tipoParticipacion) {
      setStatus("❌ Selecciona el campo formativo y el tipo de participación.");
      return false;
    }
  }

  return true;
}

async function activateScanner() {
  if (!validateSelection()) {
    return;
  }

  if (isScannerActive()) {
    setStatus("📡 El lector NFC ya está activo.");
    return;
  }

  try {
    await startScanner({
      onReading: processCard,
      onReadingError: (message) => setStatus(`❌ ${message}`)
    });
    setScannerButton({ disabled: true, text: "Lector NFC activo" });
    setStatus("📡 Escáner activo. Acerca una tarjeta.");
  } catch (error) {
    console.error("Error al activar NFC:", error);
    setScannerButton({ disabled: false, text: "Activar lector NFC" });
    setStatus(`❌ ${error.message || "No se pudo activar el lector NFC."}`);
  }
}

async function processCard(uid) {
  if (sending) {
    setStatus("⏳ Espera a que termine el registro anterior.");
    return;
  }

  if (!validateSelection()) {
    return;
  }

  clearReadyTimer();

  const participation = getParticipationData();
  const registration = {
    uid,
    modulo: selectedModule,
    campoFormativo:
      selectedModule === "participacion" ? participation.campoFormativo : "",
    tipoParticipacion:
      selectedModule === "participacion" ? participation.tipoParticipacion : ""
  };

  sending = true;
  setStatus("⏳ Registrando tarjeta...");
  setResult("");

  try {
    const response = await sendRegistration(registration);
    const success = response.exito === true || response.ok === true;

    if (!success) {
      throw new Error(response.mensaje || "Apps Script rechazó el registro.");
    }

    const studentName = escapeHtml(response.nombre || response.alumno || "");
    const grade = escapeHtml(response.grado || "");
    const group = escapeHtml(response.grupo || "");
    const message = escapeHtml(
      response.mensaje || `${formatModule(registration.modulo)} registrada`
    );
    const time = escapeHtml(
      response.hora || new Date().toLocaleTimeString("es-MX")
    );
    const schoolData = [grade, group].filter(Boolean).join(" ");

    setStatus("✅ Registro confirmado.");
    setResult(`
      ${studentName ? `<div>👤 <strong>${studentName}</strong></div>` : ""}
      ${schoolData ? `<div>${schoolData}</div><br>` : "<br>"}
      <div>✅ ${message}</div>
      <div>Módulo: <strong>${escapeHtml(
        response.modulo || formatModule(registration.modulo)
      )}</strong></div>
      <div>UID: <strong>${escapeHtml(formatUid(registration.uid))}</strong></div>
      <div>🕒 ${time}</div>
    `);
    vibrate();
    scheduleReadyMessage();
  } catch (error) {
    console.error("Error al registrar:", error);
    setStatus("❌ No se confirmó el registro.");
    setResult(`
      <div>❌ ${escapeHtml(error.message || "Error de conexión.")}</div>
      <div>UID: <strong>${escapeHtml(formatUid(registration.uid))}</strong></div>
    `);
    scheduleReadyMessage(3500);
  } finally {
    sending = false;
  }
}

function scheduleReadyMessage(delay = 2500) {
  clearReadyTimer();
  readyTimer = window.setTimeout(() => {
    setStatus("📡 Listo. Acerca la siguiente tarjeta.");
  }, delay);
}

function clearReadyTimer() {
  if (readyTimer) {
    window.clearTimeout(readyTimer);
    readyTimer = null;
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
