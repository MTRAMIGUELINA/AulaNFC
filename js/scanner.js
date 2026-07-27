import { CONFIG } from "./config.js";

let reader = null;
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

  reader = new NDEFReader();
  await reader.scan();
  active = true;

  reader.onreading = (event) => {
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
    onReadingError?.("No se pudo leer la tarjeta. Intenta nuevamente.");
  };
}
