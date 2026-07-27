import { sendRegistration } from "./api.js?v=3.0.1";
import { isScannerActive, startScanner, stopScanner } from "./scanner.js?v=3.0.1";
import {
  addHistoryRecord,
  formatModule,
  getElements,
  getParticipationData,
  lockConfiguration,
  setResult,
  setScannerButton,
  setScannerState,
  setSelectedModule,
  setStatus,
  vibrate
} from "./ui.js?v=3.0.1";

const elements = getElements();
let selectedModule = "";
let sending = false;
let feedbackTimer = null;

setScannerState(false);

elements.moduleButtons.forEach((button) => {
  button.addEventListener("click", () => selectModule(button.dataset.modulo || ""));
});

elements.scanButton.addEventListener("click", toggleScanner);

function selectModule(moduleName) {
  if (isScannerActive()) return;

  selectedModule = moduleName;
  setSelectedModule(moduleName);
  clearFeedbackTimer();
  setResult("");
  setScannerButton({ disabled: false, text: "▶ ACTIVAR LECTOR" });
  setStatus("Configura el registro y activa el lector NFC.");
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

async function toggleScanner() {
  if (isScannerActive()) {
    deactivateScanner();
    return;
  }

  await activateScanner();
}

async function activateScanner() {
  if (!validateSelection()) return;

  try {
    await startScanner({
      onReading: processCard,
      onReadingError: (message) => setStatus(`❌ ${message}`)
    });

    lockConfiguration(true);
    setScannerState(true);
    setScannerButton({ disabled: false, text: "■ DESACTIVAR LECTOR", active: true });
    setStatus("📡 Lector activo. Acerca una tarjeta.");
  } catch (error) {
    console.error("Error al activar NFC:", error);
    setScannerState(false);
    setScannerButton({ disabled: false, text: "▶ ACTIVAR LECTOR" });
    setStatus(`❌ ${error.message || "No se pudo activar el lector NFC."}`);
  }
}

function deactivateScanner() {
  clearFeedbackTimer();
  stopScanner();
  lockConfiguration(false);
  setScannerState(false);
  setScannerButton({ disabled: !selectedModule, text: "▶ ACTIVAR LECTOR", active: false });
  setStatus("⛔ Lector NFC desactivado. Las tarjetas serán ignoradas.");
  setResult("");
  vibrate(80);
}

async function processCard(uid) {
  if (!isScannerActive() || sending) return;
  if (!validateSelection()) return;

  const participation = getParticipationData();
  const registration = {
    uid,
    modulo: selectedModule,
    campoFormativo: selectedModule === "participacion" ? participation.campoFormativo : "",
    tipoParticipacion: selectedModule === "participacion" ? participation.tipoParticipacion : ""
  };

  sending = true;
  clearFeedbackTimer();
  setStatus("⏳ Registrando...");

  try {
    const response = await sendRegistration(registration);
    const success = response.exito === true || response.ok === true;

    if (!success) {
      throw new Error(response.mensaje || "Apps Script rechazó el registro.");
    }

    const studentName = escapeHtml(response.nombre || response.alumno || "Alumno");
    const grade = escapeHtml(response.grado || "");
    const group = escapeHtml(response.grupo || "");
    const time = escapeHtml(response.hora || new Date().toLocaleTimeString("es-MX"));
    const schoolData = [grade, group].filter(Boolean).join(" ");
    const detail = selectedModule === "participacion"
      ? `${escapeHtml(participation.campoFormativo)} · ${escapeHtml(participation.tipoParticipacion)}`
      : formatModule(selectedModule);

    setStatus(`✅ ${studentName}${schoolData ? ` — ${schoolData}` : ""}`);
    setResult(`<span class="confirmacion-rapida">Registro confirmado</span>`);
    addHistoryRecord({ name: studentName, time, detail });
    vibrate();

    feedbackTimer = window.setTimeout(() => {
      if (isScannerActive()) {
        setStatus("📡 Listo. Acerca la siguiente tarjeta.");
        setResult("");
      }
    }, 650);
  } catch (error) {
    console.error("Error al registrar:", error);
    setStatus(`❌ ${error.message || "No se pudo registrar."}`);
    setResult(`<span class="confirmacion-error">Acerca nuevamente la tarjeta.</span>`);
  } finally {
    sending = false;
  }
}

function clearFeedbackTimer() {
  if (feedbackTimer) {
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
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
