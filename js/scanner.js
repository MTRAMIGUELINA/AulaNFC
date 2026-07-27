import { CONFIG } from "./config.js";

let reader = null;
let controller = null;
let active = false;
let lastUid = "";
let lastScanAt = 0;

export function isScannerActive() {
  return active;
}

export async function startScanner({ onReading, onReadingError }) {
  if (!("NDEFReader" in window)) {
    throw new Error("Este dispositivo no es compatible con Web NFC.");
  }

  if (active) {
    return;
  }

  controller = new AbortController();
  reader = new NDEFReader();
  await reader.scan({ signal: controller.signal });
  active = true;

  reader.onreading = (event) => {
    if (!active) return;

    const uid = String(event.serialNumber || "").trim();

    if (!uid) {
      onReadingError?.("Tarjeta detectada, pero no se encontró el UID.");
      return;
    }

    const now = Date.now();
    const duplicated =
      uid === lastUid && now - lastScanAt < CONFIG.DUPLICATE_WINDOW_MS;

    if (duplicated) {
      return;
    }

    lastUid = uid;
    lastScanAt = now;
    onReading(uid);
  };

  reader.onreadingerror = () => {
    if (active) {
      onReadingError?.("No se pudo leer la tarjeta. Intenta nuevamente.");
    }
  };
}

export function stopScanner() {
  active = false;

  if (reader) {
    reader.onreading = null;
    reader.onreadingerror = null;
  }

  if (controller) {
    controller.abort();
  }

  reader = null;
  controller = null;
  lastUid = "";
  lastScanAt = 0;
}
