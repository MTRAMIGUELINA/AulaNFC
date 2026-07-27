import { MODULE_NAMES } from "./config.js";

const elements = {
  moduleButtons: document.querySelectorAll(".modulo"),
  activeModule: document.getElementById("moduloActivo"),
  scanButton: document.getElementById("btnEscanear"),
  status: document.getElementById("estado"),
  result: document.getElementById("resultado"),
  participationOptions: document.getElementById("opcionesParticipacion"),
  formativeField: document.getElementById("campoFormativo"),
  participationType: document.getElementById("tipoParticipacion"),
  readingOptions: document.getElementById("opcionesLectura"),
  readingActivity: document.getElementById("actividadLectura"),
  scannerIndicator: document.getElementById("indicadorLector"),
  lockedNotice: document.getElementById("configBloqueada"),
  readingLockedNotice: document.getElementById("lecturaBloqueada"),
  historyList: document.getElementById("listaRegistros"),
  counter: document.getElementById("contadorRegistros")
};

let recordCount = 0;

export function getElements() {
  return elements;
}

export function setSelectedModule(moduleName) {
  elements.moduleButtons.forEach((button) => {
    button.classList.toggle("activo", button.dataset.modulo === moduleName);
  });

  elements.activeModule.textContent = formatModule(moduleName);
  elements.result.innerHTML = "";
  elements.participationOptions.classList.toggle("oculto", moduleName !== "participacion");
  elements.readingOptions.classList.toggle("oculto", moduleName !== "lectura");
}

export function setStatus(message) {
  elements.status.textContent = message;
}

export function setResult(message) {
  elements.result.innerHTML = message;
}

export function setScannerButton({ disabled, text, active = false }) {
  elements.scanButton.disabled = disabled;
  elements.scanButton.textContent = text;
  elements.scanButton.classList.toggle("detener", active);
}

export function setScannerState(active) {
  elements.scannerIndicator.textContent = active ? "🟢 ACTIVO" : "⚪ APAGADO";
  elements.scannerIndicator.classList.toggle("activo", active);
  elements.scannerIndicator.classList.toggle("apagado", !active);
}

export function lockConfiguration(locked) {
  elements.moduleButtons.forEach((button) => {
    button.disabled = locked;
  });
  elements.formativeField.disabled = locked;
  elements.participationType.disabled = locked;
  elements.readingActivity.disabled = locked;
  elements.lockedNotice.classList.toggle("oculto", !locked);
  elements.readingLockedNotice.classList.toggle("oculto", !locked);
}

export function addHistoryRecord({ name, time, detail = "" }) {
  recordCount += 1;
  elements.counter.textContent = `Registros: ${recordCount}`;

  const empty = elements.historyList.querySelector(".sin-registros");
  empty?.remove();

  const item = document.createElement("div");
  item.className = "registro-item";
  item.innerHTML = `
    <span class="registro-hora">${time}</span>
    <span class="registro-datos"><strong>✔ ${name}</strong>${detail ? `<small>${detail}</small>` : ""}</span>
  `;

  elements.historyList.prepend(item);

  while (elements.historyList.children.length > 8) {
    elements.historyList.lastElementChild?.remove();
  }
}

export function getParticipationData() {
  return {
    campoFormativo: elements.formativeField.value,
    tipoParticipacion: elements.participationType.value
  };
}

export function getReadingData() {
  return {
    actividadLectura: elements.readingActivity.value
  };
}

export function formatModule(moduleName) {
  return MODULE_NAMES[moduleName] || moduleName || "Ninguno";
}

export function formatUid(uid) {
  const clean = String(uid || "")
    .trim()
    .toUpperCase()
    .replace(/[^0-9A-F]/g, "");

  const parts = clean.match(/.{1,2}/g);
  return parts ? parts.join(":") : clean;
}

export function vibrate(duration = 100) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}