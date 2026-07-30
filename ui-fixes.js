const resumenHistorialUI = document.getElementById("resumenHistorial");
const estadoHistorialUI = document.getElementById("estadoHistorial");
const listaHistorialGeneralUI = document.getElementById("listaHistorialGeneral");
const fechaHistorialUI = document.getElementById("fechaHistorial");
const btnConsultarFechaUI = document.getElementById("btnConsultarFecha");
const btnHistorialGeneralUI = document.getElementById("btnHistorialGeneral");
const btnAbrirBuscarUI = document.getElementById("btnAbrirBuscar");
const btnCerrarBuscarUI = document.getElementById("btnCerrarBuscar");
const campoBusquedaAlumnoUI = document.getElementById("campoBusquedaAlumno");
const contadorAlumnosUI = document.getElementById("contadorAlumnos");
const listaAlumnosUI = document.getElementById("listaAlumnos");
const fichaAlumnoUI = document.getElementById("fichaAlumno");

function ocultarResultadoHistorial() {
  resumenHistorialUI?.classList.add("oculto");
  estadoHistorialUI?.classList.add("oculto");
  listaHistorialGeneralUI?.classList.add("oculto");
}

function mostrarResultadoHistorial() {
  resumenHistorialUI?.classList.remove("oculto");
  estadoHistorialUI?.classList.remove("oculto");
  listaHistorialGeneralUI?.classList.remove("oculto");
}

function limpiarBusquedaAlumno() {
  if (campoBusquedaAlumnoUI) campoBusquedaAlumnoUI.value = "";
  contadorAlumnosUI?.classList.add("oculto");
  listaAlumnosUI?.classList.add("oculto");
  fichaAlumnoUI?.classList.add("oculto");
}

function controlarResultadosBusqueda() {
  const texto = String(campoBusquedaAlumnoUI?.value || "").trim();
  const debeMostrar = texto.length >= 2;
  contadorAlumnosUI?.classList.toggle("oculto", !debeMostrar);
  listaAlumnosUI?.classList.toggle("oculto", !debeMostrar);
  if (!debeMostrar) fichaAlumnoUI?.classList.add("oculto");
}

ocultarResultadoHistorial();
limpiarBusquedaAlumno();

// Cambiar la fecha no ejecuta una consulta automática.
fechaHistorialUI?.addEventListener("change", (evento) => {
  evento.stopImmediatePropagation();
  ocultarResultadoHistorial();
}, true);

btnConsultarFechaUI?.addEventListener("click", mostrarResultadoHistorial);
btnHistorialGeneralUI?.addEventListener("click", mostrarResultadoHistorial);

btnAbrirBuscarUI?.addEventListener("click", () => {
  limpiarBusquedaAlumno();
  window.setTimeout(() => campoBusquedaAlumnoUI?.focus(), 0);
});

btnCerrarBuscarUI?.addEventListener("click", limpiarBusquedaAlumno);
campoBusquedaAlumnoUI?.addEventListener("input", controlarResultadosBusqueda);

// El código principal carga los alumnos en segundo plano. Este observador evita
// que la lista completa aparezca mientras no se hayan escrito al menos 2 letras.
if (listaAlumnosUI) {
  new MutationObserver(controlarResultadosBusqueda).observe(listaAlumnosUI, {
    childList: true,
    subtree: true
  });
}
