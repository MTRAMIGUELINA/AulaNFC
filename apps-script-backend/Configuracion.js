// ==========================================
// AULANFC v3
// CONFIGURACIÓN GENERAL DE ESCUELA / DOCENTE
// ==========================================

// ==========================================
// OBTENER CONFIGURACIÓN
// ==========================================

function obtenerConfiguracion_() {
  try {
    const libro =
      obtenerBaseDocenteActual_();

    const hoja =
      libro.getSheetByName(
        "CONFIGURACION"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja CONFIGURACION.",
        configuracion: {}
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: true,
        exito: true,
        mensaje:
          "No hay configuración registrada.",
        configuracion: {}
      };
    }

    const datos =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          2
        )
        .getDisplayValues();

    const configuracion = {};

    datos.forEach(function(fila) {
      const clave =
        String(
          fila[0] || ""
        )
          .trim()
          .toUpperCase();

      const valor =
        String(
          fila[1] || ""
        ).trim();

      if (clave) {
        configuracion[clave] =
          valor;
      }
    });

    return {
      ok: true,
      exito: true,
      mensaje:
        "Configuración obtenida correctamente.",
      configuracion:
        configuracion
    };

  } catch (error) {
    console.error(
      "Error en obtenerConfiguracion_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener la configuración.",
      error:
        error && error.message
          ? error.message
          : String(error),
      configuracion: {}
    };
  }
}

// ==========================================
// GUARDAR CONFIGURACIÓN
// ==========================================

function guardarConfiguracion_(
  parametros
) {
  try {
    const libro =
      obtenerBaseDocenteActual_();

    const hoja =
      libro.getSheetByName(
        "CONFIGURACION"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja CONFIGURACION."
      };
    }

    const configuracion = {
      ESCUELA:
        String(
          parametros.escuela || ""
        ).trim(),

      CCT:
        String(
          parametros.cct || ""
        ).trim(),

      ZONA:
        String(
          parametros.zona || ""
        ).trim(),

      SECTOR:
        String(
          parametros.sector || ""
        ).trim(),

      TURNO:
        String(
          parametros.turno || ""
        ).trim(),

      LOCALIDAD:
        String(
          parametros.localidad || ""
        ).trim(),

      ESTADO:
        String(
          parametros.estado || ""
        ).trim(),

      DOCENTE:
        String(
          parametros.docente || ""
        ).trim(),

      GRADO:
        String(
          parametros.grado || ""
        ).trim(),

      GRUPO:
        String(
          parametros.grupo || ""
        ).trim(),

      CICLO_ESCOLAR:
        String(
          parametros.cicloEscolar || ""
        ).trim()
    };

    const ultimaFila =
      hoja.getLastRow();

    const datosActuales =
      ultimaFila >= 2
        ? hoja
            .getRange(
              2,
              1,
              ultimaFila - 1,
              2
            )
            .getDisplayValues()
        : [];

    const mapaFilas = {};

    datosActuales.forEach(
      function(fila, indice) {
        const clave =
          String(
            fila[0] || ""
          )
            .trim()
            .toUpperCase();

        if (clave) {
          mapaFilas[clave] =
            indice + 2;
        }
      }
    );

    Object.keys(
      configuracion
    ).forEach(function(clave) {
      const valor =
        configuracion[clave];

      if (mapaFilas[clave]) {
        hoja
          .getRange(
            mapaFilas[clave],
            2
          )
          .setValue(
            valor
          );

      } else {
        hoja.appendRow([
          clave,
          valor
        ]);
      }
    });

    SpreadsheetApp.flush();

    return {
      ok: true,
      exito: true,
      mensaje:
        "Configuración guardada correctamente.",
      configuracion:
        configuracion
    };

  } catch (error) {
    console.error(
      "Error en guardarConfiguracion_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible guardar la configuración.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}

// ==========================================
// RESPUESTA WEB: OBTENER CONFIGURACIÓN
// ==========================================

function obtenerConfiguracionWeb_(
  parametros
) {
  const respuesta =
    obtenerConfiguracion_();

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}

// ==========================================
// RESPUESTA WEB: GUARDAR CONFIGURACIÓN
// ==========================================

function guardarConfiguracionWeb_(
  parametros
) {
  const respuesta =
    guardarConfiguracion_(
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
