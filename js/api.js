import { CONFIG } from "./config.js";

export function sendRegistration(data) {
  return new Promise((resolve, reject) => {
    const callbackName = `aulaNfcCallback_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    const parameters = new URLSearchParams({
      accion: "registrarNFC",
      uid: data.uid,
      modulo: data.modulo,
      campoFormativo: data.campoFormativo || "",
      tipoParticipacion: data.tipoParticipacion || "",
      callback: callbackName,
      t: Date.now()
    });

    const script = document.createElement("script");
    const url = `${CONFIG.URL_APPS_SCRIPT}?${parameters.toString()}`;
    let finished = false;

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }

      delete window[callbackName];
    };

    const finish = (handler, value) => {
      if (finished) {
        return;
      }

      finished = true;
      window.clearTimeout(timeoutId);
      cleanup();
      handler(value);
    };

    window[callbackName] = (response) => {
      finish(resolve, response || {});
    };

    script.async = true;
    script.src = url;
    script.onerror = () => {
      finish(reject, new Error("Apps Script no respondió a la solicitud."));
    };

    const timeoutId = window.setTimeout(() => {
      finish(
        reject,
        new Error("La solicitud superó el tiempo máximo de espera.")
      );
    }, CONFIG.API_TIMEOUT_MS);

    document.head.appendChild(script);
  });
}
