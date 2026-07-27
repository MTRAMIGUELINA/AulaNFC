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

elements.moduleButtons.forEach((button) => {
  button.addEventListener("click", () => selectModule(button.dataset.modulo || ""));
});

elements.scanButton.addEventListener("click", activateScanner);

function selectModule(moduleName) {
  selectedModule = moduleName;
  setSelectedModule(moduleName);

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
    const message = escapeHtml(
      response.mensaje || `${formatModule(registration.modulo)} registrada`
    );
    const time = escapeHtml(
      response.hora || new Date().toLocaleTimeString("es-MX")
    );

    setStatus("📡 Registro confirmado. Acerca otra tarjeta.");
    setResult(`
      ${studentName ? `<div>👤 <strong>${studentName}</strong></div><br>` : ""}
      <div>✅ ${message}</div>
      <div>Módulo: <strong>${escapeHtml(
        response.modulo || formatModule(registration.modulo)
      )}</strong></div>
      <div>UID: <strong>${escapeHtml(formatUid(registration.uid))}</strong></div>
      <div>🕒 ${time}</div>
    `);
    vibrate();
  } catch (error) {
    console.error("Error al registrar:", error);
    setStatus("❌ No se confirmó el registro.");
    setResult(`
      <div>❌ ${escapeHtml(error.message || "Error de conexión.")}</div>
      <div>UID: <strong>${escapeHtml(formatUid(registration.uid))}</strong></div>
    `);
  } finally {
    sending = false;
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
