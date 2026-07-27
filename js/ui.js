import { MODULE_NAMES } from "./config.js";

const elements = {
  moduleButtons: document.querySelectorAll(".modulo"),
  activeModule: document.getElementById("moduloActivo"),
  scanButton: document.getElementById("btnEscanear"),
  status: document.getElementById("estado"),
  result: document.getElementById("resultado"),
  participationOptions: document.getElementById("opcionesParticipacion"),
  formativeField: document.getElementById("campoFormativo"),
  participationType: document.getElementById("tipoParticipacion")
};

export function getElements() {
  return elements;
}

export function setSelectedModule(moduleName) {
  elements.moduleButtons.forEach((button) => {
    button.classList.toggle("activo", button.dataset.modulo === moduleName);
  });

  elements.activeModule.textContent = formatModule(moduleName);
  elements.result.innerHTML = "";
  elements.participationOptions.classList.toggle(
    "oculto",
    moduleName !== "participacion"
  );
}

export function setStatus(message) {
  elements.status.textContent = message;
}

export function setResult(message) {
  elements.result.innerHTML = message;
}

export function setScannerButton({ disabled, text }) {
  elements.scanButton.disabled = disabled;
  elements.scanButton.textContent = text;
}

export function getParticipationData() {
  return {
    campoFormativo: elements.formativeField.value,
    tipoParticipacion: elements.participationType.value
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

export function vibrate(duration = 180) {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
}
