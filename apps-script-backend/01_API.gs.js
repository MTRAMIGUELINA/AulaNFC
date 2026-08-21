// ==========================================
// AULANFC v3
// API Y PUNTO DE ENTRADA
// ==========================================

/**
 * Atiende las solicitudes realizadas al Web App.
 *
 * Solicitudes API:
 * - ?accion=obtenerAlumnos
 * - ?accion=registrarNFC
 * - ?accion=registrarManual
 * - ?accion=obtenerHistorialAlumno&uid=UID_DEL_ALUMNO
 *
 * Vistas:
 * - Web App principal: Index
 * - Escáner móvil: ?vista=escaner
 */
function doGet(e) {
  const parametros =
    e && e.parameter
      ? e.parameter
      : {};

  try {
    const accion = String(
      parametros.accion || ""
    )
      .trim()
      .toLowerCase();

    // ======================================
    // API: OBTENER ALUMNOS
    // ======================================

    if (accion === "obteneralumnos") {
      return obtenerAlumnosWeb_(parametros);
    }

    // ======================================
    // API: REGISTRAR NFC
    // ======================================

    if (accion === "registrarnfc") {
      return registrarDesdeEscaner_(parametros);
    }

    // ======================================
    // API: REGISTRAR MANUAL
    // ======================================

    if (accion === "registrarmanual") {
      return registrarManualWeb_(parametros);
    }

    // ======================================
// API: OBTENER HISTORIAL DEL ALUMNO
// ======================================

if (accion === "obtenerhistorialalumno") {
  const idAlumno = String(
    parametros.id || ""
  ).trim();

  if (!idAlumno) {
    return responderJSONP_(
      parametros.callback,
      {
        ok: false,
        exito: false,
        mensaje:
          "Debes proporcionar el ID del alumno."
      }
    );
  }

  const respuesta =
  obtenerHistorialAlumno_(parametros);

  return responderJSONP_(
    parametros.callback,
    respuesta
  );
}


// ======================================
// API: OBTENER REPORTE DEL ALUMNO
// ======================================

if (accion === "obtenerreportealumno") {
  return obtenerReporteAlumnoWeb_(
    parametros
  );
}

// ======================================
// API: OBTENER HISTORIAL GENERAL
// ======================================

if (accion === "obtenerhistorialgeneral") {
  const respuesta =
    obtenerHistorialGeneral_(parametros);

  return responderJSONP_(
    parametros.callback,
    respuesta
  );
}


// ======================================
// API: OBTENER RESUMEN ESTADÍSTICO
// ======================================

if (
  accion ===
  "obtenerresumenestadistico"
) {
  return obtenerResumenEstadisticoWeb_(
    parametros
  );
}

// ======================================
// API: GUARDAR INCIDENCIA
// ======================================

if (
  accion ===
  "guardarincidencia"
) {
  return guardarIncidenciaWeb_(
    parametros
  );
}

// ======================================
// API: OBTENER DASHBOARD DIARIO
// ======================================

if (
  accion ===
  "obtenerdashboarddiario"
) {
  const respuesta =
    obtenerDashboardDiario_(
      parametros
    );

  return responderJSONP_(
    parametros.callback,
    respuesta
  );
}

// ======================================
// API: HISTORIAL DE INCIDENCIAS
// ======================================

if (
  accion ===
  "obtenerhistorialincidencias"
) {
  return obtenerHistorialIncidenciasWeb_(
    parametros
  );
}

// ======================================
// API: OBTENER RESULTADOS DE EXAMEN
// ======================================

if (
  accion ===
  "obtenerresultadosexamen"
) {
  return obtenerResultadosExamenWeb_(
    parametros
  );
}


// ======================================
// API: GUARDAR RESULTADOS DE EXAMEN
// ======================================

if (
  accion ===
  "guardarresultadosexamen"
) {
  return guardarResultadosExamenWeb_(
    parametros
  );
}

// ======================================
// API: ELIMINAR RESULTADO DE EXAMEN
// ======================================

if (
  accion ===
  "eliminarresultadosexamen"
) {
  return eliminarResultadoExamenWeb_(
    parametros
  );
}

// ======================================
// API: CREAR ALUMNO
// ======================================

if (
  accion ===
  "crearalumno"
) {
  return crearAlumnoWeb_(
    parametros
  );
}


// ======================================
// API: ACTUALIZAR ALUMNO
// ======================================

if (
  accion ===
  "actualizaralumno"
) {
  return actualizarAlumnoWeb_(
    parametros
  );
}


// ======================================
// API: CAMBIAR ESTADO DEL ALUMNO
// ======================================

if (
  accion ===
  "cambiarestadoalumno"
) {
  return cambiarEstadoAlumnoWeb_(
    parametros
  );
}

// ======================================
// API: ELIMINAR ALUMNO
// ======================================

if (
  accion ===
  "eliminaralumno"
) {
  return eliminarAlumnoWeb_(
    parametros
  );
}

// ======================================
// API: OBTENER CONFIGURACIÓN
// ======================================

if (
  accion ===
  "obtenerconfiguracion"
) {
  return obtenerConfiguracionWeb_(
    parametros
  );
}


// ======================================
// API: GUARDAR CONFIGURACIÓN
// ======================================

if (
  accion ===
  "guardarconfiguracion"
) {
  return guardarConfiguracionWeb_(
    parametros
  );
}

// ======================================
// API: ALUMNOS DEL GRUPO ACTIVO
// ======================================

if (
  accion ===
  "obteneralumnosgrupoactivo"
) {
  return obtenerAlumnosGrupoActivoWeb_(
    parametros
  );
}

// ======================================
// API: GUARDAR FOTO DEL ALUMNO
// ======================================

if (
  accion ===
  "guardarfotoalumno"
) {
  return guardarFotoAlumnoWeb_(
    parametros
  );
}

// ======================================
// API: OBTENER FOTO DEL ALUMNO
// ======================================

if (
  accion ===
  "obtenerfotoalumno"
) {
  return obtenerFotoAlumnoWeb_(
    parametros
  );
}

    // ======================================
    // ACCIÓN DE API NO RECONOCIDA
    // ======================================

    if (accion) {
      return responderJSONP_(
        parametros.callback,
        {
          ok: false,
          exito: false,
          mensaje:
            "La acción solicitada no existe.",
          accion: accion
        }
      );
    }

    // ======================================
    // VISTAS HTML
    // ======================================

    const vista = String(
      parametros.vista || ""
    )
      .trim()
      .toLowerCase();

    const archivoHTML =
      vista === "escaner"
        ? "Escaner"
        : "Index";

    return HtmlService
      .createTemplateFromFile(archivoHTML)
      .evaluate()
      .setTitle("AulaNFC")
      .setXFrameOptionsMode(
        HtmlService.XFrameOptionsMode.ALLOWALL
      );

  } catch (error) {
    console.error(
      "Error en doGet:",
      error
    );

    if (parametros.accion) {
      return responderJSONP_(
        parametros.callback,
        {
          ok: false,
          exito: false,
          mensaje:
            "Ocurrió un error al procesar la solicitud.",
          error:
            error && error.message
              ? error.message
              : String(error)
        }
      );
    }

    return HtmlService
      .createHtmlOutput(
        "<h2>AulaNFC</h2>" +
        "<p>No fue posible cargar la aplicación.</p>" +
        "<p>" +
        escaparHTML_(
          error && error.message
            ? error.message
            : String(error)
        ) +
        "</p>"
      )
      .setTitle("Error | AulaNFC");
  }
}

function doPost(e) {
  const parametros =
    e && e.parameter
      ? e.parameter
      : {};

  try {

    const accion =
      String(
        parametros.accion || ""
      )
        .trim()
        .toLowerCase();

    if (
      accion ===
      "guardarfotoalumno"
    ) {

      const respuesta =
        guardarFotoAlumno_(
          parametros
        );

      return ContentService
        .createTextOutput(
          JSON.stringify(
            respuesta
          )
        )
        .setMimeType(
          ContentService.MimeType.JSON
        );
    }

    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          exito: false,
          mensaje:
            "La acción POST solicitada no existe."
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );

  } catch (error) {

    return ContentService
      .createTextOutput(
        JSON.stringify({
          ok: false,
          exito: false,
          mensaje:
            "No fue posible procesar la solicitud.",
          error:
            error &&
            error.message
              ? error.message
              : String(error)
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }
}

// ==========================================
// INCLUIR ARCHIVOS HTML
// ==========================================

function include(nombreArchivo) {
  const nombre = String(
    nombreArchivo || ""
  ).trim();

  if (!nombre) {
    return "";
  }

  return HtmlService
    .createHtmlOutputFromFile(nombre)
    .getContent();
}


// ==========================================
// CARGAR VISTAS DEL MENÚ
// ==========================================

function cargarVista(nombreVista) {
  const nombre = String(
    nombreVista || ""
  ).trim();

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

  if (
    vistasPermitidas.indexOf(nombre) === -1
  ) {
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
    console.error(
      "Error al cargar la vista " +
      nombre +
      ":",
      error
    );

    return (
      "<section class=\"mensaje-error\">" +
      "<h3>No se pudo cargar el módulo</h3>" +
      "<p>" +
      escaparHTML_(
        error && error.message
          ? error.message
          : String(error)
      ) +
      "</p>" +
      "</section>"
    );
  }
}


// ==========================================
// ESCAPAR TEXTO PARA HTML
// ==========================================

function escaparHTML_(texto) {
  return String(
    texto || ""
  )
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
