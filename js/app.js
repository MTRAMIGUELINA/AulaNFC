import { fetchStudents, sendManualRegistration, sendRegistration } from "./api.js?v=3.5.0";
import { isScannerActive, startScanner, stopScanner } from "./scanner.js?v=3.0.1";
import {
  addHistoryRecord,
  formatModule,
  getConductData,
  getElements,
  getParticipationData,
  getReadingData,
  getTaskData,
  lockConfiguration,
  setResult,
  setScannerButton,
  setScannerState,
  setSelectedModule,
  setStatus,
  vibrate
} from "./ui.js?v=3.3.0";

const elements = getElements();
const manual = {
  openButton: document.getElementById("btnRegistroManual"),
  panel: document.getElementById("panelRegistroManual"),
  closeButton: document.getElementById("btnCerrarManual"),
  search: document.getElementById("buscarAlumno"),
  results: document.getElementById("resultadosAlumnos"),
  confirmButton: document.getElementById("btnConfirmarManual")
};

let selectedModule = "";
let sending = false;
let feedbackTimer = null;
let students = [];
let selectedStudent = null;

setScannerState(false);

elements.moduleButtons.forEach((button) => {
  button.addEventListener("click", () => selectModule(button.dataset.modulo || ""));
});

elements.scanButton.addEventListener("click", toggleScanner);
manual.openButton.addEventListener("click", openManualPanel);
manual.closeButton.addEventListener("click", closeManualPanel);
manual.search.addEventListener("input", renderStudentResults);
manual.confirmButton.addEventListener("click", registerSelectedStudent);

function selectModule(moduleName) {
  if (isScannerActive()) return;

  selectedModule = moduleName;
  setSelectedModule(moduleName);
  clearFeedbackTimer();
  setResult("");
  setScannerButton({ disabled: false, text: "▶ ACTIVAR LECTOR" });
  manual.openButton.disabled = false;
  closeManualPanel();
  setStatus("Configura el registro y elige NFC o búsqueda manual.");
}

function validateSelection() {
  if (!selectedModule) {
    setStatus("❌ Primero selecciona un módulo.");
    return false;
  }

  if (selectedModule === "tareas" && !getTaskData().resultadoTarea) {
    setStatus("❌ Selecciona el resultado de la tarea.");
    return false;
  }

  if (selectedModule === "participacion") {
    const participation = getParticipationData();
    if (!participation.campoFormativo || !participation.tipoParticipacion) {
      setStatus("❌ Selecciona el campo formativo y el tipo de participación.");
      return false;
    }
  }

  if (selectedModule === "conducta" && !getConductData().incidencia) {
    setStatus("❌ Selecciona una incidencia de conducta.");
    return false;
  }

  if (selectedModule === "lectura" && !getReadingData().actividadLectura) {
    setStatus("❌ Selecciona el nivel de lectura.");
    return false;
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
    closeManualPanel();
    await startScanner({
      onReading: processCard,
      onReadingError: (message) => setStatus(`❌ ${message}`)
    });

    lockConfiguration(true);
    manual.openButton.disabled = true;
    setScannerState(true);
    setScannerButton({ disabled: false, text: "■ DESACTIVAR LECTOR", active: true });
    setStatus("📡 Lector activo. Acerca una tarjeta.");
  } catch (error) {
    console.error("Error al activar NFC:", error);
    setScannerState(false);
    setScannerButton({ disabled: false, text: "▶ ACTIVAR LECTOR" });
    manual.openButton.disabled = false;
    setStatus(`❌ ${error.message || "No se pudo activar el lector NFC."}`);
  }
}

function deactivateScanner() {
  clearFeedbackTimer();
  stopScanner();
  lockConfiguration(false);
  manual.openButton.disabled = !selectedModule;
  setScannerState(false);
  setScannerButton({ disabled: !selectedModule, text: "▶ ACTIVAR LECTOR", active: false });
  setStatus("⛔ Lector NFC desactivado. Puedes usar NFC o búsqueda manual.");
  setResult("");
  vibrate(80);
}

async function processCard(uid) {
  if (!isScannerActive() || sending || !validateSelection()) return;
  await registerStudent(uid, "NFC");
}

async function openManualPanel() {
  if (isScannerActive() || sending || !validateSelection()) return;

  manual.panel.classList.remove("oculto");
  manual.search.value = "";
  selectedStudent = null;
  manual.confirmButton.disabled = true;
  manual.results.innerHTML = '<p class="mensaje-busqueda">Cargando alumnos...</p>';
  manual.search.focus();

  if (!students.length) {
    try {
      const response = await fetchStudents();
      const list = Array.isArray(response) ? response : response.alumnos || response.data || [];
      students = list.map(normalizeStudent).filter((student) => student.id && student.nombre);
      
      alert("Alumnos cargados: " + students.length);

      if (!students.length) {
        throw new Error(response.mensaje || "No se recibió la lista de alumnos.");
      }
    } catch (error) {
      console.error("Error al obtener alumnos:", error);
      manual.results.innerHTML = `<p class="mensaje-busqueda confirmacion-error">${escapeHtml(error.message || "No se pudieron cargar los alumnos.")}</p>`;
      return;
    }
  }

  manual.results.innerHTML = '<p class="mensaje-busqueda">Escribe al menos dos letras.</p>';
}

function closeManualPanel() {
  manual.panel.classList.add("oculto");
  manual.search.value = "";
  manual.results.innerHTML = '<p class="mensaje-busqueda">Escribe al menos dos letras.</p>';
  selectedStudent = null;
  manual.confirmButton.disabled = true;
}

function renderStudentResults() {
  selectedStudent = null;
  manual.confirmButton.disabled = true;
  const query = normalizeText(manual.search.value.trim());

  if (query.length < 2) {
    manual.results.innerHTML = '<p class="mensaje-busqueda">Escribe al menos dos letras.</p>';
    return;
  }

  const matches = students
    .filter((student) => normalizeText(student.nombre).includes(query))
    .slice(0, 12);

  if (!matches.length) {
    manual.results.innerHTML = '<p class="mensaje-busqueda">No se encontraron coincidencias.</p>';
    return;
  }

  manual.results.innerHTML = "";
  matches.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "alumno-resultado";
    button.innerHTML = `<strong>${escapeHtml(student.nombre)}</strong><small>${escapeHtml([student.grado, student.grupo].filter(Boolean).join(" ") || "Alumno")}</small>`;
    button.addEventListener("click", () => {
      manual.results.querySelectorAll(".alumno-resultado").forEach((item) => item.classList.remove("seleccionado"));
      button.classList.add("seleccionado");
      selectedStudent = student;
      manual.confirmButton.disabled = false;
    });
    manual.results.appendChild(button);
  });
}

async function registerSelectedStudent() {
  if (!selectedStudent || sending || !validateSelection()) return;

  const registration = buildRegistration("", "Manual");
  registration.idAlumno = selectedStudent.id;

  await registerStudent("", "Manual", selectedStudent, registration);
}

async function registerStudent(uid, method, fallbackStudent = null, preparedRegistration = null) {
  const registration = preparedRegistration || buildRegistration(uid, method);
  sending = true;
  clearFeedbackTimer();
  setStatus("⏳ Registrando...");
  manual.confirmButton.disabled = true;

  try {
    const response = method === "Manual"
      ? await sendManualRegistration(registration)
      : await sendRegistration(registration);
    const success = response.exito === true || response.ok === true;
    if (!success) throw new Error(response.mensaje || "Apps Script rechazó el registro.");

    const studentName = escapeHtml(response.nombre || response.alumno || fallbackStudent?.nombre || "Alumno");
    const grade = escapeHtml(response.grado || fallbackStudent?.grado || "");
    const group = escapeHtml(response.grupo || fallbackStudent?.grupo || "");
    const time = escapeHtml(response.hora || new Date().toLocaleTimeString("es-MX"));
    const schoolData = [grade, group].filter(Boolean).join(" ");
    const detail = `${getRegistrationDetail()} · ${method}`;

    setStatus(`✅ ${studentName}${schoolData ? ` — ${schoolData}` : ""}`);
    setResult(`<span class="confirmacion-rapida">Registro confirmado por ${method}</span>`);
    addHistoryRecord({ name: studentName, time, detail });
    vibrate();

    if (method === "Manual") closeManualPanel();

    feedbackTimer = window.setTimeout(() => {
      if (isScannerActive()) {
        setStatus("📡 Listo. Acerca la siguiente tarjeta.");
      } else {
        setStatus("Listo. Puedes registrar otro alumno.");
      }
      setResult("");
    }, 900);
  } catch (error) {
    console.error("Error al registrar:", error);
    setStatus(`❌ ${error.message || "No se pudo registrar."}`);
    setResult('<span class="confirmacion-error">Intenta nuevamente.</span>');
    if (method === "Manual") manual.confirmButton.disabled = false;
  } finally {
    sending = false;
  }
}

function buildRegistration(uid, method) {
  const task = getTaskData();
  const participation = getParticipationData();
  const conduct = getConductData();
  const reading = getReadingData();

  let genericType = "";
  if (selectedModule === "tareas") genericType = task.resultadoTarea;
  if (selectedModule === "participacion") genericType = participation.tipoParticipacion;
  if (selectedModule === "conducta") genericType = conduct.incidencia;
  if (selectedModule === "lectura") genericType = reading.actividadLectura;

  return {
    uid,
    modulo: selectedModule,
    campoFormativo: selectedModule === "participacion" ? participation.campoFormativo : "",
    tipoParticipacion: genericType,
    resultadoTarea: selectedModule === "tareas" ? task.resultadoTarea : "",
    incidencia: selectedModule === "conducta" ? conduct.incidencia : "",
    actividadLectura: selectedModule === "lectura" ? reading.actividadLectura : "",
    metodo: method
  };
}

function getRegistrationDetail() {
  if (selectedModule === "tareas") return escapeHtml(getTaskData().resultadoTarea);
  if (selectedModule === "participacion") {
    const participation = getParticipationData();
    return `${escapeHtml(participation.campoFormativo)} · ${escapeHtml(participation.tipoParticipacion)}`;
  }
  if (selectedModule === "conducta") return escapeHtml(getConductData().incidencia);
  if (selectedModule === "lectura") return escapeHtml(getReadingData().actividadLectura);
  return formatModule(selectedModule);
}

function normalizeStudent(student) {
  return {
    id: String(
      student.id ||
      student.Id ||
      student.idAlumno ||
      student.ID_ALUMNO ||
      ""
    ).trim(),

    uid: String(
      student.uid ||
      student.UID ||
      ""
    ).trim(),

    nombre: String(
      student.nombreCompleto ||
      student.nombre ||
      student.alumno ||
      student.Nombre ||
      student.Alumno ||
      ""
    ).trim(),

    grado: String(
      student.grado ||
      student.Grado ||
      ""
    ).trim(),

    grupo: String(
      student.grupo ||
      student.Grupo ||
      ""
    ).trim()
  };
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
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
