// ==========================================
// AULANFC v3
// MÓDULO DE INCIDENCIAS
// ==========================================

function guardarIncidencia_(parametros) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hoja =
      libro.getSheetByName(
        "INCIDENCIAS"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja INCIDENCIAS."
      };
    }

    const fecha =
      String(
        parametros.fecha || ""
      ).trim();

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const nombre =
      String(
        parametros.nombre || ""
      ).trim();

    const grado =
      String(
        parametros.grado || ""
      ).trim();

    const grupo =
      String(
        parametros.grupo || ""
      ).trim();

    const incidencia =
      String(
        parametros.incidencia || ""
      ).trim();

    const descripcion =
      String(
        parametros.descripcion || ""
      ).trim();

      const accionesTomadas =
  String(
    parametros.accionesTomadas || ""
  ).trim();

    const acuerdos =
      String(
        parametros.acuerdos || ""
      ).trim();

    if (
      !fecha ||
      !idAlumno ||
      !nombre ||
      !incidencia ||
      !descripcion ||
      !accionesTomadas ||
      !acuerdos
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Faltan datos obligatorios para guardar la incidencia."
      };
    }

    // --------------------------------------
// OBTENER CICLO ESCOLAR
// --------------------------------------

let cicloEscolar = "";

try {
  const respuestaConfiguracion =
    obtenerConfiguracion_();

  if (
    respuestaConfiguracion &&
    respuestaConfiguracion.ok === true
  ) {
    cicloEscolar =
      String(
        respuestaConfiguracion
          .configuracion
          ?.CICLO_ESCOLAR || ""
      ).trim();
  }

} catch (error) {
  console.error(
    "No fue posible obtener el ciclo escolar:",
    error
  );
}

    const lock =
      LockService.getScriptLock();

    const lockObtenido =
      lock.tryLock(5000);

    if (!lockObtenido) {
      throw new Error(
        "No fue posible adquirir el bloqueo para guardar la incidencia."
      );
    }

    let folio;

    try {
      folio =
        generarFolioIncidencia_(
          hoja
        );

      hoja.appendRow([
  folio,
  fecha,
  idAlumno,
  nombre,
  grado,
  grupo,
  incidencia,
  descripcion,
  accionesTomadas,
  acuerdos,
  cicloEscolar
]);

      SpreadsheetApp.flush();

    } finally {
      lock.releaseLock();
    }

    return {
      ok: true,
      exito: true,
      mensaje:
        "Incidencia guardada correctamente.",
      folio: folio
    };

  } catch (error) {
    console.error(
      "Error en guardarIncidencia_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible guardar la incidencia.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}


// ==========================================
// GENERAR FOLIO AUTOMÁTICO
// ==========================================

function generarFolioIncidencia_(
  hoja
) {
  const anio =
    new Date().getFullYear();

  const ultimaFila =
    hoja.getLastRow();

  let consecutivo = 1;

  if (ultimaFila >= 2) {
    const folios =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues()
        .flat();

    const prefijo =
      "INC-" +
      anio +
      "-";

    const numeros =
      folios
        .filter(function(folio) {
          return String(folio)
            .startsWith(
              prefijo
            );
        })
        .map(function(folio) {
          return Number(
            String(folio)
              .replace(
                prefijo,
                ""
              )
          );
        })
        .filter(function(numero) {
          return Number.isFinite(
            numero
          );
        });

    if (numeros.length > 0) {
      consecutivo =
        Math.max.apply(
          null,
          numeros
        ) + 1;
    }
  }

  return (
    "INC-" +
    anio +
    "-" +
    String(
      consecutivo
    ).padStart(
      4,
      "0"
    )
  );
}


// ==========================================
// RESPUESTA WEB
// ==========================================

function guardarIncidenciaWeb_(
  parametros
) {
  const respuesta =
    guardarIncidencia_(
      parametros || {}
    );

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}

// ==========================================
// OBTENER HISTORIAL DE INCIDENCIAS
// ==========================================

function obtenerHistorialIncidencias_(
  parametros
) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hoja =
      libro.getSheetByName(
        "INCIDENCIAS"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja INCIDENCIAS.",
        registros: []
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: true,
        exito: true,
        registros: []
      };
    }

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const desde =
      String(
        parametros.desde || ""
      ).trim();

    const hasta =
      String(
        parametros.hasta || ""
      ).trim();

    const datos =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          11
        )
        .getDisplayValues();

    const registros =
      datos
        .map(function(fila) {
          return {
            folio:
              String(
                fila[0] || ""
              ).trim(),

            fecha:
              String(
                fila[1] || ""
              ).trim(),

            idAlumno:
              String(
                fila[2] || ""
              ).trim(),

            nombre:
              String(
                fila[3] || ""
              ).trim(),

            grado:
              String(
                fila[4] || ""
              ).trim(),

            grupo:
              String(
                fila[5] || ""
              ).trim(),

            incidencia:
              String(
                fila[6] || ""
              ).trim(),

            descripcion:
              String(
                fila[7] || ""
              ).trim(),

            accionesTomadas:
              String(
                fila[8] || ""
              ).trim(),

            acuerdos:
              String(
                fila[9] || ""
              ).trim(),

            cicloEscolar:
              String(
                fila[10] || ""
              ).trim()
          };
        })
        .filter(function(registro) {

          if (
            idAlumno &&
            registro.idAlumno !==
              idAlumno
          ) {
            return false;
          }

          if (
            desde &&
            registro.fecha < desde
          ) {
            return false;
          }

          if (
            hasta &&
            registro.fecha > hasta
          ) {
            return false;
          }

          return true;
        })
        .sort(function(a, b) {
          return String(
            b.fecha
          ).localeCompare(
            String(
              a.fecha
            )
          );
        });

    return {
      ok: true,
      exito: true,
      total:
        registros.length,
      registros:
        registros
    };

  } catch (error) {
    console.error(
      "Error en obtenerHistorialIncidencias_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener el historial de incidencias.",
      error:
        error &&
        error.message
          ? error.message
          : String(error),
      registros: []
    };
  }
}


// ==========================================
// RESPUESTA WEB:
// OBTENER HISTORIAL DE INCIDENCIAS
// ==========================================

function obtenerHistorialIncidenciasWeb_(
  parametros
) {
  const respuesta =
    obtenerHistorialIncidencias_(
      parametros || {}
    );

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}
