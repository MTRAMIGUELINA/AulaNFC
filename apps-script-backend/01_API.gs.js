// ==========================================
// AULANFC v3.4
// API Y PUNTO DE ENTRADA
// ==========================================

function doGet(e) {
  const parametros = e && e.parameter ? e.parameter : {};

  try {
    const accion = String(parametros.accion || "").trim().toLowerCase();

    // ======================================
    // S1-T2: IDENTIDAD / LOGIN PUBLICO
    // ======================================
    if (accion === "obtenerconfiglogin") {
      return obtenerConfiguracionLoginGoogleWeb_(parametros);
    }

    if (accion === "validarlogingoogle") {
      return validarLoginGoogleWeb_(parametros);
    }

    // ======================================
    // S1-T3: CANDADO CENTRAL DEL API
    // ======================================
    if (accion) {
      const autorizacion = autorizarSolicitudApi_(parametros);

      if (!autorizacion || !autorizacion.autorizado) {
        return responderAccesoApiDenegado_(parametros, autorizacion);
      }
    }

    // ======================================
    // API PROTEGIDA
    // ======================================
    if (accion === "obteneralumnos") {
      return obtenerAlumnosWeb_(parametros);
    }

    if (accion === "registrarnfc") {
      return registrarDesdeEscaner_(parametros);
    }

    if (accion === "registrarmanual") {
      return registrarManualWeb_(parametros);
    }

    if (accion === "obtenerhistorialalumno") {
      const idAlumno = String(parametros.id || "").trim();
      if (!idAlumno) {
        return responderJSONP_(parametros.callback, {
          ok: false,
          exito: false,
          mensaje: "Debes proporcionar el ID del alumno."
        });
      }

      return responderJSONP_(
        parametros.callback,
        obtenerHistorialAlumno_(parametros)
      );
    }

    if (accion === "obtenerreportealumno") {
      return obtenerReporteAlumnoWeb_(parametros);
    }

    if (accion === "obtenerhistorialgeneral") {
      return responderJSONP_(
        parametros.callback,
        obtenerHistorialGeneral_(parametros)
      );
    }

    if (accion === "obtenerresumenestadistico") {
      return obtenerResumenEstadisticoWeb_(parametros);
    }

    if (accion === "guardarincidencia") {
      return guardarIncidenciaWeb_(parametros);
    }

    if (accion === "obtenerdashboarddiario") {
      return responderJSONP_(
        parametros.callback,
        obtenerDashboardDiario_(parametros)
      );
    }

    if (accion === "obtenerhistorialincidencias") {
      return obtenerHistorialIncidenciasWeb_(parametros);
    }

    if (accion === "obtenerresultadosexamen") {
      return obtenerResultadosExamenWeb_(parametros);
    }

    if (accion === "guardarresultadosexamen") {
      return guardarResultadosExamenWeb_(parametros);
    }

    if (accion === "eliminarresultadosexamen") {
      return eliminarResultadoExamenWeb_(parametros);
    }

    if (accion === "crearalumno") {
      return crearAlumnoWeb_(parametros);
    }

    if (accion === "actualizaralumno") {
      return actualizarAlumnoWeb_(parametros);
    }

    if (accion === "cambiarestadoalumno") {
      return cambiarEstadoAlumnoWeb_(parametros);
    }

    if (accion === "eliminaralumno") {
      return eliminarAlumnoWeb_(parametros);
    }

    if (accion === "obtenerconfiguracion") {
      return obtenerConfiguracionWeb_(parametros);
    }

    if (accion === "guardarconfiguracion") {
      return guardarConfiguracionWeb_(parametros);
    }

    if (accion === "obteneralumnosgrupoactivo") {
      return obtenerAlumnosGrupoActivoWeb_(parametros);
    }

    if (accion === "guardarfotoalumno") {
      return guardarFotoAlumnoWeb_(parametros);
    }

    if (accion === "obtenerfotoalumno") {
      return obtenerFotoAlumnoWeb_(parametros);
    }

    if (accion) {
      return responderJSONP_(parametros.callback, {
        ok: false,
        exito: false,
        mensaje: "La acción solicitada no existe.",
        accion: accion
      });
    }

    // ======================================
    // VISTAS HTML DEL WEB APP
    // ======================================
    const vista = String(parametros.vista || "").trim().toLowerCase();
    const archivoHTML = vista === "escaner" ? "Escaner" : "Index";

    return HtmlService
      .createTemplateFromFile(archivoHTML)
      .evaluate()
      .setTitle("AulaNFC")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

  } catch (error) {
    console.error("Error en doGet:", error);

    if (parametros.accion) {
      return responderJSONP_(parametros.callback, {
        ok: false,
        exito: false,
        mensaje: "Ocurrió un error al procesar la solicitud.",
        error: error && error.message ? error.message : String(error)
      });
    }

    return HtmlService
      .createHtmlOutput(
        "<h2>AulaNFC</h2>" +
        "<p>No fue posible cargar la aplicación.</p>" +
        "<p>" +
        escaparHTML_(error && error.message ? error.message : String(error)) +
        "</p>"
      )
      .setTitle("Error | AulaNFC");
  }
}

function doPost(e) {
  const parametros = e && e.parameter ? e.parameter : {};

  try {
    const accion = String(parametros.accion || "").trim().toLowerCase();

    // S1-T3: todo POST requiere usuario autorizado.
    const autorizacion = autorizarSolicitudApi_(parametros);

    if (!autorizacion || !autorizacion.autorizado) {
      return responderPostAccesoApiDenegado_(autorizacion);
    }

    if (accion === "guardarfotoalumno") {
      return ContentService
        .createTextOutput(JSON.stringify(guardarFotoAlumno_(parametros)))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        exito: false,
        mensaje: "La acción POST solicitada no existe."
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        ok: false,
        exito: false,
        mensaje: "No fue posible procesar la solicitud.",
        error: error && error.message ? error.message : String(error)
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// INCLUIR ARCHIVOS HTML
// ==========================================
function include(nombreArchivo) {
  const nombre = String(nombreArchivo || "").trim();
  if (!nombre) return "";

  return HtmlService
    .createHtmlOutputFromFile(nombre)
    .getContent();
}

// ==========================================
// CARGAR VISTAS DEL MENÚ
// ==========================================
function cargarVista(nombreVista) {
  const nombre = String(nombreVista || "").trim();
  const vistasPermitidas = [
    "Dashboard",
    "Asistencia",
    "Tareas",
    "Participacion",
    "Conducta",
    "Lectura",
    "BuscarAlumno",
    "Reportes"
  ];

  if (vistasPermitidas.indexOf(nombre) === -1) {
    return (
      "<section class=\"mensaje-error\">" +
      "<h3>Vista no disponible</h3>" +
      "<p>El módulo solicitado no existe.</p>" +
      "</section>"
    );
  }

  try {
    return HtmlService
      .createHtmlOutputFromFile(nombre)
      .getContent();
  } catch (error) {
    console.error("Error al cargar la vista " + nombre + ":", error);

    return (
      "<section class=\"mensaje-error\">" +
      "<h3>No se pudo cargar el módulo</h3>" +
      "<p>" +
      escaparHTML_(error && error.message ? error.message : String(error)) +
      "</p>" +
      "</section>"
    );
  }
}

// ==========================================
// ESCAPAR TEXTO PARA HTML
// ==========================================
function escaparHTML_(texto) {
  return String(texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
