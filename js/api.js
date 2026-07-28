import { CONFIG } from "./config.js";

export function sendRegistration(data) {
  return jsonpRequest({
    accion: "registrarNFC",
    uid: data.uid,
    modulo: data.modulo,
    campoFormativo: data.campoFormativo || "",
    tipoParticipacion: data.tipoParticipacion || "",
    resultadoTarea: data.resultadoTarea || "",
    incidencia: data.incidencia || "",
    actividadLectura: data.actividadLectura || "",
    metodo: "NFC"
  });
}

export function sendManualRegistration(data) {
  return jsonpRequest({
    accion: "registrarManual",
    idAlumno: data.idAlumno,
    modulo: data.modulo,
    campoFormativo: data.campoFormativo || "",
    tipoParticipacion: data.tipoParticipacion || "",
    resultadoTarea: data.resultadoTarea || "",
    incidencia: data.incidencia || "",
    actividadLectura: data.actividadLectura || "",
    metodo: "Manual"
  });
}

export function fetchStudents() {
  return jsonpRequest({ accion: "obtenerAlumnos" });
}

function jsonpRequest(data) {
  return new Promise((resolve, reject) => {
    const callbackName = `aulaNfcCallback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const parameters = new URLSearchParams({
      ...data,
      callback: callbackName,
      t: Date.now()
    });

    const script = document.createElement("script");
    const url = `${CONFIG.URL_APPS_SCRIPT}?${parameters.toString()}`;
    let finished = false;

    const cleanup = () => {
      script.remove();
      delete window[callbackName];
    };

    const finish = (handler, value) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeoutId);
      cleanup();
      handler(value);
    };

    window[callbackName] = (response) => finish(resolve, response || {});
    script.async = true;
    script.src = url;
    script.onerror = () => finish(reject, new Error("Apps Script no respondió a la solicitud."));

    const timeoutId = window.setTimeout(() => {
      finish(reject, new Error("La solicitud superó el tiempo máximo de espera."));
    }, CONFIG.API_TIMEOUT_MS);

    document.head.appendChild(script);
  });
}
