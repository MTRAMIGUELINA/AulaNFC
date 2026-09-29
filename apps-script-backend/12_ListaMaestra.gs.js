// ==========================================
// AULANFC v3
// LISTA MAESTRA MENSUAL DE ASISTENCIA
// ==========================================

/**
 * Genera el concentrado mensual de asistencia del grupo configurado.
 * Las asistencias se cruzan por ID del alumno y fecha; una celda vacía no
 * representa una falta.
 *
 * @param {number|string} mes Mes entre 1 y 12.
 * @param {number|string} anio Año con cuatro dígitos.
 * @param {string} cicloEscolar Ciclo escolar que se desea consultar.
 * @return {Object} Resultado de la generación.
 */
function generarListaMaestraAsistencia_(mes, anio, cicloEscolar) {
  const mesNumero = Number(mes);
  const anioNumero = Number(anio);
  const ciclo = String(cicloEscolar || "").trim();
  if (!Number.isInteger(mesNumero) || mesNumero < 1 || mesNumero > 12) throw new Error("El mes debe ser un número entre 1 y 12.");
  if (!Number.isInteger(anioNumero) || anioNumero < 1000 || anioNumero > 9999) throw new Error("El año debe tener cuatro dígitos.");
  if (!ciclo) throw new Error("Debes indicar el ciclo escolar.");

  const libro = obtenerBaseDocenteActual_();
  const hojaAlumnos = libro.getSheetByName(NOMBRE_HOJA_ALUMNOS);
  const hojaCalendario = libro.getSheetByName(NOMBRE_HOJA_CALENDARIO_ESCOLAR);
  const hojaAsistencias = libro.getSheetByName(NOMBRE_HOJA_ASISTENCIAS);
  if (!hojaAlumnos) throw new Error("No existe la hoja " + NOMBRE_HOJA_ALUMNOS + ".");
  if (!hojaCalendario) throw new Error("No existe la hoja " + NOMBRE_HOJA_CALENDARIO_ESCOLAR + ".");
  if (!hojaAsistencias) throw new Error("No existe la hoja " + NOMBRE_HOJA_ASISTENCIAS + ".");

  const configuracionRespuesta = obtenerConfiguracion_();
  const configuracion = configuracionRespuesta && configuracionRespuesta.ok ? configuracionRespuesta.configuracion || {} : {};
  const grado = String(configuracion.GRADO || "").trim();
  const grupo = limpiarGrupo_(configuracion.GRUPO || "");
  if (!grado || !grupo) throw new Error("Debes configurar GRADO y GRUPO antes de generar la lista maestra.");

  const zonaHoraria = Session.getScriptTimeZone();
  const alumnos = obtenerAlumnosActivosListaMaestra_(hojaAlumnos, grado, grupo);
  const fechas = obtenerDiasEscolaresListaMaestra_(hojaCalendario, mesNumero, anioNumero, ciclo, zonaHoraria);
  const indiceAsistencias = crearIndiceAsistenciasListaMaestra_(hojaAsistencias, ciclo, zonaHoraria);
  const matriz = construirMatrizListaMaestra_(alumnos, fechas, indiceAsistencias, ciclo, grado, grupo, mesNumero, anioNumero);

  let hojaLista = libro.getSheetByName(NOMBRE_HOJA_LISTA_MAESTRA);
  if (!hojaLista) hojaLista = libro.insertSheet(NOMBRE_HOJA_LISTA_MAESTRA);
  const filasAnteriores = hojaLista.getLastRow();
  const columnasAnteriores = hojaLista.getLastColumn();
  if (filasAnteriores > 0 && columnasAnteriores > 0) {
    const rangoAnterior = hojaLista.getRange(1, 1, filasAnteriores, columnasAnteriores);
    rangoAnterior.breakApart();
    rangoAnterior.clearContent();
  }
  hojaLista.getRange(1, 1, matriz.length, matriz[0].length).setValues(matriz);
  aplicarFormatoListaMaestra_(hojaLista, matriz.length, matriz[0].length);
  return { ok: true, exito: true, mensaje: "Lista maestra generada correctamente.", hoja: NOMBRE_HOJA_LISTA_MAESTRA, alumnos: alumnos.length, diasEscolares: fechas.length };
}

function obtenerAlumnosActivosListaMaestra_(hoja, grado, grupo) {
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 10).getDisplayValues()
    .filter(function(fila) { return String(fila[0] || "").trim() !== "" && String(fila[8] || "").trim().toUpperCase() === "ACTIVO" && String(fila[5] || "").trim() === grado && limpiarGrupo_(fila[6]) === grupo; })
    .map(function(fila) { return { id: String(fila[0] || "").trim(), nombre: String(fila[1] || "").trim(), apellidoPaterno: String(fila[2] || "").trim(), apellidoMaterno: String(fila[3] || "").trim() }; })
    .sort(function(a, b) { return compararTextoListaMaestra_(a.apellidoPaterno, b.apellidoPaterno) || compararTextoListaMaestra_(a.apellidoMaterno, b.apellidoMaterno) || compararTextoListaMaestra_(a.nombre, b.nombre); });
}

function obtenerDiasEscolaresListaMaestra_(hoja, mes, anio, ciclo, zonaHoraria) {
  if (hoja.getLastRow() < 2) return [];
  const datos = hoja.getRange(2, 1, hoja.getLastRow() - 1, 4).getValues();
  const fechasUnicas = {};
  datos.forEach(function(fila) {
    if (String(fila[1] || "").trim().toUpperCase() !== "SI" || String(fila[3] || "").trim().toUpperCase() !== ciclo.toUpperCase()) return;
    const clave = normalizarFechaListaMaestra_(fila[0], zonaHoraria);
    if (clave && Number(clave.slice(0, 4)) === anio && Number(clave.slice(5, 7)) === mes) fechasUnicas[clave] = true;
  });
  return Object.keys(fechasUnicas).sort();
}

function crearIndiceAsistenciasListaMaestra_(hoja, ciclo, zonaHoraria) {
  const indice = {};
  if (hoja.getLastRow() < 2) return indice;
  const rango = hoja.getRange(2, 1, hoja.getLastRow() - 1, 7);
  const valores = rango.getValues();
  const valoresVisibles = rango.getDisplayValues();
  valores.forEach(function(fila, indiceFila) {
    const id = String(valoresVisibles[indiceFila][2] || "").trim();
    const fecha = normalizarFechaListaMaestra_(fila[0], zonaHoraria);
    const cicloRegistro = String(valoresVisibles[indiceFila][6] || "").trim();
    if (id && fecha && cicloRegistro.toUpperCase() === ciclo.toUpperCase()) indice[id + "|" + fecha] = true;
  });
  return indice;
}

function construirMatrizListaMaestra_(alumnos, fechas, indiceAsistencias, ciclo, grado, grupo, mes, anio) {
  const columnas = 2 + fechas.length;
  const nombresMeses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const matriz = [];
  function filaConEtiqueta(etiqueta) { return [etiqueta].concat(new Array(columnas - 1).fill("")); }
  matriz.push(filaConEtiqueta("LISTA MAESTRA DE ASISTENCIA"));
  matriz.push(filaConEtiqueta("Ciclo escolar: " + ciclo));
  matriz.push(filaConEtiqueta("Grado: " + grado));
  matriz.push(filaConEtiqueta("Grupo: " + grupo));
  matriz.push(filaConEtiqueta("Mes: " + nombresMeses[mes - 1] + " de " + anio));
  matriz.push(["N.º", "NOMBRE DEL ALUMNO"].concat(fechas.map(function(fecha) { return fecha.slice(8, 10); })));
  alumnos.forEach(function(alumno, indice) {
    const nombreCompleto = [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno].filter(Boolean).join(" ");
    const fila = [indice + 1, nombreCompleto];
    fechas.forEach(function(fecha) { fila.push(indiceAsistencias[alumno.id + "|" + fecha] ? "✓" : ""); });
    matriz.push(fila);
  });
  return matriz;
}

function normalizarFechaListaMaestra_(valor, zonaHoraria) {
  if (Object.prototype.toString.call(valor) === "[object Date]") {
    if (isNaN(valor.getTime())) return "";
    return Utilities.formatDate(valor, zonaHoraria, "yyyy-MM-dd");
  }
  const texto = String(valor || "").trim();
  let coincidencia = texto.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if (coincidencia) return validarPartesFechaListaMaestra_(Number(coincidencia[1]), Number(coincidencia[2]), Number(coincidencia[3]));
  coincidencia = texto.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})$/);
  if (coincidencia) return validarPartesFechaListaMaestra_(Number(coincidencia[3]), Number(coincidencia[2]), Number(coincidencia[1]));
  return "";
}

function validarPartesFechaListaMaestra_(anio, mes, dia) {
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (fecha.getUTCFullYear() !== anio || fecha.getUTCMonth() + 1 !== mes || fecha.getUTCDate() !== dia) return "";
  return String(anio).padStart(4, "0") + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
}

function compararTextoListaMaestra_(valorA, valorB) { return String(valorA || "").localeCompare(String(valorB || ""), "es", { sensitivity: "base" }); }

function aplicarFormatoListaMaestra_(hoja, filas, columnas) {
  hoja.getRange(1, 1).setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center");
  hoja.getRange(2, 1, 4, columnas).setFontWeight("bold");
  hoja.getRange(6, 1, 1, columnas).setBackground("#1f4e78").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setWrap(true);
  if (filas > 6) { hoja.getRange(7, 1, filas - 6, 1).setHorizontalAlignment("center"); if (columnas > 2) hoja.getRange(7, 3, filas - 6, columnas - 2).setHorizontalAlignment("center"); }
  hoja.getRange(6, 1, Math.max(1, filas - 5), columnas).setBorder(true, true, true, true, true, true).setVerticalAlignment("middle");
  hoja.setFrozenRows(6); hoja.setFrozenColumns(2); hoja.setColumnWidth(1, 45); hoja.setColumnWidth(2, 250);
  if (columnas > 2) hoja.setColumnWidths(3, columnas - 2, 38);
  hoja.setRowHeight(1, 28); hoja.setRowHeight(6, 34); hoja.setHiddenGridlines(true);
}

function probarListaMaestraSeptiembre2026() { console.log(generarListaMaestraAsistencia_(9, 2026, "2026-2027")); }

// ==========================================
// LISTA MAESTRA DE TAREAS
// ==========================================
function generarListaMaestraTareas_(cicloEscolar) {
  const ciclo = String(cicloEscolar || "").trim();
  if (!ciclo) throw new Error("Debes indicar el ciclo escolar.");
  const libro = obtenerBaseDocenteActual_();
  const hojaAlumnos = libro.getSheetByName(NOMBRE_HOJA_ALUMNOS);
  const hojaTareas = libro.getSheetByName(NOMBRE_HOJA_TAREAS);
  if (!hojaAlumnos) throw new Error("No existe la hoja " + NOMBRE_HOJA_ALUMNOS + ".");
  if (!hojaTareas) throw new Error("No existe la hoja " + NOMBRE_HOJA_TAREAS + ".");
  const configuracionRespuesta = obtenerConfiguracion_();
  const configuracion = configuracionRespuesta && configuracionRespuesta.ok ? configuracionRespuesta.configuracion || {} : {};
  const grado = String(configuracion.GRADO || "").trim();
  const grupo = limpiarGrupo_(configuracion.GRUPO || "");
  if (!grado || !grupo) throw new Error("Debes configurar GRADO y GRUPO antes de generar la lista maestra de tareas.");
  const alumnos = obtenerAlumnosActivosListaMaestra_(hojaAlumnos, grado, grupo);
  const datosTareas = obtenerDatosListaMaestraTareas_(hojaTareas, ciclo);
  const matriz = construirMatrizListaMaestraTareas_(alumnos, datosTareas.actividades, datosTareas.registros, ciclo, grado, grupo);
  const nombreHoja = "LISTA MAESTRA TAREAS";
  let hojaLista = libro.getSheetByName(nombreHoja);
  if (!hojaLista) hojaLista = libro.insertSheet(nombreHoja);
  const filasAnteriores = hojaLista.getLastRow(); const columnasAnteriores = hojaLista.getLastColumn();
  if (filasAnteriores > 0 && columnasAnteriores > 0) { const rangoAnterior = hojaLista.getRange(1, 1, filasAnteriores, columnasAnteriores); rangoAnterior.breakApart(); rangoAnterior.clearContent(); }
  hojaLista.getRange(1, 1, matriz.length, matriz[0].length).setValues(matriz);
  aplicarFormatoListaMaestraTareas_(hojaLista, matriz.length, matriz[0].length);
  return { ok: true, exito: true, mensaje: "Lista maestra de tareas generada correctamente.", hoja: nombreHoja, alumnos: alumnos.length, actividades: datosTareas.actividades.length };
}

function obtenerDatosListaMaestraTareas_(hoja, ciclo) {
  const resultado = { actividades: [], registros: {} };
  if (hoja.getLastRow() < 2) return resultado;
  const datos = hoja.getDataRange().getDisplayValues();
  const encabezados = datos[0].map(function(valor) { return String(valor || "").trim().toUpperCase(); });
  const indiceId = encabezados.indexOf("ID ALUMNO"); const indiceActividad = encabezados.indexOf("ACTIVIDAD");
  const indiceFechaActividad = encabezados.indexOf("FECHA ACTIVIDAD"); const indiceFecha = encabezados.indexOf("FECHA");
  const indiceRegistro = encabezados.indexOf("TIPO DE PARTICIPACION") !== -1 ? encabezados.indexOf("TIPO DE PARTICIPACION") : encabezados.indexOf("REGISTRO");
  const indiceCiclo = encabezados.indexOf("CICLO ESCOLAR");
  if (indiceId === -1 || indiceActividad === -1 || indiceRegistro === -1) throw new Error("La hoja TAREAS no contiene los encabezados necesarios.");
  const actividadesUnicas = {};
  datos.slice(1).forEach(function(fila) {
    const cicloRegistro = indiceCiclo !== -1 ? String(fila[indiceCiclo] || "").trim() : "";
    if (indiceCiclo !== -1 && cicloRegistro.toUpperCase() !== ciclo.toUpperCase()) return;
    const id = String(fila[indiceId] || "").trim(); const actividad = String(fila[indiceActividad] || "").trim(); const registro = String(fila[indiceRegistro] || "").trim();
    const fechaActividad = indiceFechaActividad !== -1 && String(fila[indiceFechaActividad] || "").trim() ? String(fila[indiceFechaActividad] || "").trim() : (indiceFecha !== -1 ? String(fila[indiceFecha] || "").trim() : "");
    if (!id || !actividad || !fechaActividad) return;
    const claveActividad = actividad.toLowerCase() + "|" + fechaActividad;
    if (!actividadesUnicas[claveActividad]) actividadesUnicas[claveActividad] = { clave: claveActividad, actividad: actividad, fecha: fechaActividad };
    resultado.registros[id + "|" + claveActividad] = registro || "—";
  });
  resultado.actividades = Object.keys(actividadesUnicas).map(function(clave) { return actividadesUnicas[clave]; }).sort(function(a, b) { return a.fecha.localeCompare(b.fecha) || a.actividad.localeCompare(b.actividad, "es", { sensitivity: "base" }); });
  return resultado;
}

function construirMatrizListaMaestraTareas_(alumnos, actividades, registros, ciclo, grado, grupo) {
  const columnas = 2 + actividades.length; const matriz = [];
  function filaConEtiqueta(etiqueta) { return [etiqueta].concat(new Array(columnas - 1).fill("")); }
  matriz.push(filaConEtiqueta("LISTA MAESTRA DE TAREAS")); matriz.push(filaConEtiqueta("Ciclo escolar: " + ciclo)); matriz.push(filaConEtiqueta("Grado: " + grado)); matriz.push(filaConEtiqueta("Grupo: " + grupo)); matriz.push(filaConEtiqueta("Actividades registradas: " + actividades.length));
  matriz.push(["N.º", "NOMBRE DEL ALUMNO"].concat(actividades.map(function(item) { return item.actividad + "\n" + item.fecha; })));
  alumnos.forEach(function(alumno, indice) { const nombreCompleto = [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno].filter(Boolean).join(" "); const fila = [indice + 1, nombreCompleto]; actividades.forEach(function(item) { const clave = alumno.id + "|" + item.clave; fila.push(Object.prototype.hasOwnProperty.call(registros, clave) ? registros[clave] : "—"); }); matriz.push(fila); });
  return matriz;
}

function aplicarFormatoListaMaestraTareas_(hoja, filas, columnas) {
  hoja.getRange(1, 1).setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center"); hoja.getRange(2, 1, 4, columnas).setFontWeight("bold");
  hoja.getRange(6, 1, 1, columnas).setBackground("#1f4e78").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  if (filas > 6) { hoja.getRange(7, 1, filas - 6, 1).setHorizontalAlignment("center"); if (columnas > 2) hoja.getRange(7, 3, filas - 6, columnas - 2).setHorizontalAlignment("center").setVerticalAlignment("middle"); }
  hoja.getRange(6, 1, Math.max(1, filas - 5), columnas).setBorder(true, true, true, true, true, true); hoja.setFrozenRows(6); hoja.setFrozenColumns(2); hoja.setColumnWidth(1, 45); hoja.setColumnWidth(2, 250); if (columnas > 2) hoja.setColumnWidths(3, columnas - 2, 115); hoja.setRowHeight(1, 28); hoja.setRowHeight(6, 55); hoja.setHiddenGridlines(true);
}

function probarListaMaestraTareas2026() { console.log(generarListaMaestraTareas_("2026-2027")); }
