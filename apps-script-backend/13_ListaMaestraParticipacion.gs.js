// ==========================================
// AULANFC v3
// LISTAS MAESTRAS DE PARTICIPACIÓN
// ==========================================

function generarListasMaestrasParticipacion_(cicloEscolar) {
  const ciclo = String(cicloEscolar || "").trim();
  if (!ciclo) throw new Error("Debes indicar el ciclo escolar.");

  const libro = obtenerBaseDocenteActual_();
  const hojaAlumnos = libro.getSheetByName(NOMBRE_HOJA_ALUMNOS);
  const hojaParticipaciones = libro.getSheetByName("PARTICIPACIONES");
  if (!hojaAlumnos) throw new Error("No existe la hoja " + NOMBRE_HOJA_ALUMNOS + ".");
  if (!hojaParticipaciones) throw new Error("No existe la hoja PARTICIPACIONES.");

  const cfgResp = obtenerConfiguracion_();
  const cfg = cfgResp && cfgResp.ok ? cfgResp.configuracion || {} : {};
  const grado = String(cfg.GRADO || "").trim();
  const grupo = limpiarGrupo_(cfg.GRUPO || "");
  if (!grado || !grupo) throw new Error("Debes configurar GRADO y GRUPO antes de generar las listas maestras de participación.");

  const alumnos = obtenerAlumnosActivosListaMaestra_(hojaAlumnos, grado, grupo);
  const campos = [
    { clave: "LENGUAJES", hoja: "LISTA PARTICIPACIÓN - LENGUAJES" },
    { clave: "SABERES Y PENSAMIENTO CIENTÍFICO", hoja: "LISTA PARTICIPACIÓN - SABERES" },
    { clave: "ÉTICA, NATURALEZA Y SOCIEDADES", hoja: "LISTA PARTICIPACIÓN - ÉTICA" },
    { clave: "DE LO HUMANO Y LO COMUNITARIO", hoja: "LISTA PARTICIPACIÓN - HUMANO" }
  ];

  const resultados = [];
  campos.forEach(function(campo) {
    const datos = obtenerDatosListaMaestraParticipacion_(hojaParticipaciones, ciclo, campo.clave);
    const matriz = construirMatrizListaMaestraParticipacion_(alumnos, datos.actividades, datos.registros, ciclo, grado, grupo, campo.clave);
    let hoja = libro.getSheetByName(campo.hoja);
    if (!hoja) hoja = libro.insertSheet(campo.hoja);
    const ultimaFila = hoja.getLastRow();
    const ultimaColumna = hoja.getLastColumn();
    if (ultimaFila > 0 && ultimaColumna > 0) {
      const rangoAnterior = hoja.getRange(1, 1, ultimaFila, ultimaColumna);
      rangoAnterior.breakApart();
      rangoAnterior.clearContent();
      rangoAnterior.clearFormat();
    }
    hoja.getRange(1, 1, matriz.length, matriz[0].length).setValues(matriz);
    aplicarFormatoListaMaestraParticipacion_(hoja, matriz.length, matriz[0].length);
    resultados.push({ hoja: campo.hoja, actividades: datos.actividades.length, advertencias: datos.advertencias });
  });

  return { ok: true, exito: true, mensaje: "Listas maestras de participación generadas correctamente.", alumnos: alumnos.length, hojas: resultados };
}

function normalizarEncabezadoListaParticipacion_(valor) {
  return String(valor || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizarCampoListaParticipacion_(valor) {
  return normalizarEncabezadoListaParticipacion_(valor).replace(/\s+/g, " ");
}

function obtenerDatosListaMaestraParticipacion_(hoja, ciclo, campoFormativo) {
  const resultado = { actividades: [], registros: {}, advertencias: 0 };
  if (hoja.getLastRow() < 2) return resultado;

  const rango = hoja.getDataRange();
  const valores = rango.getValues();
  const visibles = rango.getDisplayValues();
  const encabezados = visibles[0].map(normalizarEncabezadoListaParticipacion_);

  function indice() {
    for (let i = 0; i < arguments.length; i++) {
      const posicion = encabezados.indexOf(normalizarEncabezadoListaParticipacion_(arguments[i]));
      if (posicion !== -1) return posicion;
    }
    return -1;
  }

  const iFecha = indice("FECHA");
  const iHora = indice("HORA");
  const iId = indice("ID ALUMNO", "ID");
  const iCampo = indice("CAMPO FORMATIVO");
  const iActividad = indice("ACTIVIDAD");
  const iTipo = indice("TIPO DE PARTICIPACION", "TIPO DE PARTICIPACIÓN");
  const iCiclo = indice("CICLO ESCOLAR");
  const iFechaActividad = indice("FECHA ACTIVIDAD");

  if ([iId, iCampo, iActividad, iTipo, iCiclo].some(function(indiceColumna) { return indiceColumna === -1; })) {
    throw new Error("La hoja PARTICIPACIONES no contiene los encabezados necesarios.");
  }

  const zona = Session.getScriptTimeZone();
  const actividades = {};
  const elegidos = {};

  for (let filaNumero = 1; filaNumero < visibles.length; filaNumero++) {
    const fila = visibles[filaNumero];
    const cicloRegistro = String(fila[iCiclo] || "").trim();
    if (!cicloRegistro) { resultado.advertencias++; continue; }
    if (cicloRegistro.toUpperCase() !== ciclo.toUpperCase()) continue;
    if (normalizarCampoListaParticipacion_(fila[iCampo]) !== normalizarCampoListaParticipacion_(campoFormativo)) continue;

    const id = String(fila[iId] || "").trim();
    const actividad = String(fila[iActividad] || "").trim();
    const tipo = String(fila[iTipo] || "").trim();
    let fechaActividad = "";
    if (iFechaActividad !== -1) fechaActividad = normalizarFechaListaMaestra_(valores[filaNumero][iFechaActividad], zona);
    if (!fechaActividad && iFecha !== -1) fechaActividad = normalizarFechaListaMaestra_(valores[filaNumero][iFecha], zona);
    if (!id || !actividad || !fechaActividad) continue;

    const claveActividad = actividad.toLowerCase() + "|" + fechaActividad;
    if (!actividades[claveActividad]) actividades[claveActividad] = { clave: claveActividad, actividad: actividad, fecha: fechaActividad };

    let fechaRegistro = "";
    if (iFecha !== -1) fechaRegistro = normalizarFechaListaMaestra_(valores[filaNumero][iFecha], zona);
    const hora = iHora !== -1 ? String(fila[iHora] || "").trim() : "";
    const orden = (fechaRegistro || "0000-00-00") + "T" + (hora || "00:00:00") + "|" + String(filaNumero).padStart(8, "0");
    const claveRegistro = id + "|" + claveActividad;
    if (!elegidos[claveRegistro] || orden >= elegidos[claveRegistro].orden) elegidos[claveRegistro] = { orden: orden, tipo: tipo };
  }

  Object.keys(elegidos).forEach(function(clave) { resultado.registros[clave] = elegidos[clave].tipo; });
  resultado.actividades = Object.keys(actividades).map(function(clave) { return actividades[clave]; }).sort(function(a, b) {
    return a.fecha.localeCompare(b.fecha) || a.actividad.localeCompare(b.actividad, "es", { sensitivity: "base" });
  });
  return resultado;
}

function construirMatrizListaMaestraParticipacion_(alumnos, actividades, registros, ciclo, grado, grupo, campo) {
  const columnas = 4 + actividades.length;
  const matriz = [];
  function filaInformativa(texto) { return [texto].concat(new Array(columnas - 1).fill("")); }
  matriz.push(filaInformativa("LISTA MAESTRA DE PARTICIPACIÓN"));
  matriz.push(filaInformativa("Campo formativo: " + campo));
  matriz.push(filaInformativa("Ciclo escolar: " + ciclo));
  matriz.push(filaInformativa("Última actualización: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm")));
  matriz.push(filaInformativa("Grado: " + grado + "    Grupo: " + grupo));
  matriz.push(["ID ALUMNO", "NOMBRE", "GRADO", "GRUPO"].concat(actividades.map(function(actividad) { return actividad.actividad + "\n" + actividad.fecha; })));
  alumnos.forEach(function(alumno) {
    const nombre = [alumno.nombre, alumno.apellidoPaterno, alumno.apellidoMaterno].filter(Boolean).join(" ");
    const fila = [alumno.id, nombre, grado, grupo];
    actividades.forEach(function(actividad) { fila.push(registros[alumno.id + "|" + actividad.clave] || ""); });
    matriz.push(fila);
  });
  return matriz;
}

function aplicarFormatoListaMaestraParticipacion_(hoja, filas, columnas) {
  hoja.getRange(1, 1, 1, columnas).merge().setFontSize(16).setFontWeight("bold").setHorizontalAlignment("center");
  hoja.getRange(2, 1, 4, columnas).setFontWeight("bold");
  hoja.getRange(6, 1, 1, columnas).setBackground("#1f4e78").setFontColor("#ffffff").setFontWeight("bold").setHorizontalAlignment("center").setVerticalAlignment("middle").setWrap(true);
  if (filas > 6) hoja.getRange(7, 1, filas - 6, columnas).setVerticalAlignment("middle");
  if (filas > 6 && columnas > 4) hoja.getRange(7, 5, filas - 6, columnas - 4).setHorizontalAlignment("center").setWrap(true);
  hoja.getRange(6, 1, Math.max(1, filas - 5), columnas).setBorder(true, true, true, true, true, true);
  hoja.setFrozenRows(6);
  hoja.setFrozenColumns(0);
  hoja.setColumnWidth(1, 85);
  hoja.setColumnWidth(2, 250);
  hoja.setColumnWidth(3, 65);
  hoja.setColumnWidth(4, 65);
  if (columnas > 4) hoja.setColumnWidths(5, columnas - 4, 125);
  hoja.setRowHeight(1, 28);
  hoja.setRowHeight(6, 55);
  hoja.setHiddenGridlines(true);
}

function actualizarListasMaestrasParticipacionWeb_(parametros) {
  const callback = parametros && parametros.callback;
  try {
    const ciclo = String(parametros && parametros.cicloEscolar || "").trim();
    if (!ciclo) return responderJSONP_(callback, { ok: false, exito: false, mensaje: "Debes indicar el ciclo escolar." });
    return responderJSONP_(callback, generarListasMaestrasParticipacion_(ciclo));
  } catch (error) {
    console.error("Error al actualizar listas maestras de participación:", error);
    return responderJSONP_(callback, { ok: false, exito: false, mensaje: error && error.message ? error.message : String(error) });
  }
}

function probarListasMaestrasParticipacion2026() {
  console.log(generarListasMaestrasParticipacion_("2026-2027"));
}
