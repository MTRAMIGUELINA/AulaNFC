// ==========================================
// AULANFC v3
// EXPORTACIÓN DE LISTAS MAESTRAS A PDF
// ==========================================

function obtenerListaMaestraPDFWeb_(parametros) {
  const callback = parametros && parametros.callback;
  try {
    const tipo = String(parametros && parametros.tipo || "").trim().toLowerCase();
    const ciclo = String(parametros && parametros.cicloEscolar || "").trim();
    if (!ciclo) throw new Error("Debes indicar el ciclo escolar.");

    let nombreHoja = "";
    if (tipo === "asistencia") {
      const mes = Number(parametros.mes);
      const anio = Number(parametros.anio);
      generarListaMaestraAsistencia_(mes, anio, ciclo);
      nombreHoja = NOMBRE_HOJA_LISTA_MAESTRA;
    } else if (tipo === "tareas") {
      generarListaMaestraTareas_(ciclo);
      nombreHoja = "LISTA MAESTRA TAREAS";
    } else if (tipo === "participacion") {
      const campo = String(parametros.campoFormativo || "").trim().toUpperCase();
      const hojas = {
        "LENGUAJES": "LISTA PARTICIPACIÓN - LENGUAJES",
        "SABERES Y PENSAMIENTO CIENTÍFICO": "LISTA PARTICIPACIÓN - SABERES",
        "ÉTICA, NATURALEZA Y SOCIEDADES": "LISTA PARTICIPACIÓN - ÉTICA",
        "DE LO HUMANO Y LO COMUNITARIO": "LISTA PARTICIPACIÓN - HUMANO"
      };
      nombreHoja = hojas[campo] || "";
      if (!nombreHoja) throw new Error("Selecciona un campo formativo válido.");
      generarListasMaestrasParticipacion_(ciclo);
    } else {
      throw new Error("Selecciona una lista válida para exportar.");
    }

    const libro = obtenerBaseDocenteActual_();
    const hoja = libro.getSheetByName(nombreHoja);
    if (!hoja || hoja.getLastRow() < 1 || hoja.getLastColumn() < 1) throw new Error("No fue posible preparar la lista seleccionada.");
    const matriz = hoja.getRange(1, 1, hoja.getLastRow(), hoja.getLastColumn()).getDisplayValues();
    const cfgResp = obtenerConfiguracion_();
    const cfg = cfgResp && cfgResp.ok ? cfgResp.configuracion || {} : {};

    return responderJSONP_(callback, {
      ok: true,
      exito: true,
      tipo: tipo,
      hoja: nombreHoja,
      matriz: matriz,
      configuracion: {
        ESCUELA: String(cfg.ESCUELA || ""),
        CCT: String(cfg.CCT || ""),
        TURNO: String(cfg.TURNO || ""),
        DOCENTE: String(cfg.DOCENTE || ""),
        GRADO: String(cfg.GRADO || ""),
        GRUPO: String(cfg.GRUPO || ""),
        CICLO_ESCOLAR: String(cfg.CICLO_ESCOLAR || ciclo)
      }
    });
  } catch (error) {
    console.error("Error al preparar lista maestra para PDF:", error);
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      mensaje: error && error.message ? error.message : String(error)
    });
  }
}
