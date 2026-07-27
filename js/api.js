import { CONFIG } from "./config.js";

export async function sendRegistration(data) {
  const parameters = new URLSearchParams({
    accion: "registrarNFC",
    uid: data.uid,
    modulo: data.modulo,
    campoFormativo: data.campoFormativo || "",
    tipoParticipacion: data.tipoParticipacion || "",
    t: Date.now()
  });

  const url = `${CONFIG.URL_APPS_SCRIPT}?${parameters.toString()}`;

  await fetch(url, {
    method: "GET",
    mode: "no-cors",
    cache: "no-store",
    redirect: "follow"
  });

  return { url };
}
