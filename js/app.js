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
  setStatus("⏳ Enviando registro...");
  setResult("");

  try {
    const response = await sendRegistration(registration);
    console.log("URL enviada:", response.url);

    setStatus("📡 Solicitud enviada. Acerca otra tarjeta.");
    setResult(`
      ✅ Solicitud enviada a Apps Script
      <br><br>
      Módulo: <strong>${formatModule(registration.modulo)}</strong>
      <br>
      UID: <strong>${formatUid(registration.uid)}</strong>
    `);
    vibrate();
  } catch (error) {
    console.error("Error al enviar:", error);
    setStatus("❌ No se pudo enviar la solicitud.");
    setResult(`Error de conexión:<br>${error.message}`);
  } finally {
    sending = false;
  }
}
