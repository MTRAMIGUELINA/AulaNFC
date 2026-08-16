// ==========================================
// AULANFC v3
// MÓDULO DE ALUMNOS
// ==========================================

/**
 * Obtiene y organiza la lista de alumnos.
 *
 * Estructura esperada de la hoja ALUMNOS:
 * A: ID ALUMNO
 * B: NOMBRE
 * C: APELLIDO PATERNO
 * D: APELLIDO MATERNO
 * E: FECHA DE NACIMIENTO
 * F: GRADO
 * G: GRUPO
 * H: UID NFC
 * I: ACTIVO
 * J: FOTO
 *
 * @return {Object}
 */
function obtenerAlumnos_() {

  const libro =
    SpreadsheetApp.openById(
      ID_HOJA_CALCULO
    );

  const hoja =
    libro.getSheetByName(
      NOMBRE_HOJA_ALUMNOS
    );

  if (!hoja) {
    return {
      ok: false,
      exito: false,
      mensaje:
        "No existe la hoja " +
        NOMBRE_HOJA_ALUMNOS +
        ".",
      total: 0,
      alumnos: []
    };
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return {
      ok: true,
      exito: true,
      mensaje:
        "No hay alumnos registrados.",
      total: 0,
      alumnos: []
    };
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        10
      )
      .getDisplayValues();

  const alumnos =
    datos
      .filter(function(fila) {

        const id =
          String(
            fila[0] || ""
          ).trim();

        const nombre =
          String(
            fila[1] || ""
          ).trim();

        return (
          id !== "" &&
          nombre !== ""
        );
      })

      .map(function(
        fila,
        indice
      ) {

        const nombre =
          String(
            fila[1] || ""
          ).trim();

        const apellidoPaterno =
          String(
            fila[2] || ""
          ).trim();

        const apellidoMaterno =
          String(
            fila[3] || ""
          ).trim();

        const nombreCompleto =
          [
            nombre,
            apellidoPaterno,
            apellidoMaterno
          ]
            .filter(Boolean)
            .join(" ")
            .replace(
              /\s+/g,
              " "
            )
            .trim();

        return {

          fila:
            indice + 2,

          id:
            String(
              fila[0] || ""
            ).trim(),

          nombre:
            nombre,

          apellidoPaterno:
            apellidoPaterno,

          apellidoMaterno:
            apellidoMaterno,

          nombreCompleto:
            nombreCompleto,

          fechaNacimiento:
            String(
              fila[4] || ""
            ).trim(),

          grado:
            String(
              fila[5] || ""
            ).trim(),

          grupo:
            limpiarGrupo_(
              fila[6]
            ),

          uid:
            formatearUID_(
              fila[7]
            ),

          estado:
  String(
    fila[8] || "ACTIVO"
  )
    .trim()
    .toUpperCase(),

activo:
  String(
    fila[8] || "ACTIVO"
  )
    .trim()
    .toUpperCase() ===
  "ACTIVO",

          foto:
            String(
              fila[9] || ""
            ).trim()
        };
      })

      .sort(function(a, b) {
        return a.nombreCompleto
          .localeCompare(
            b.nombreCompleto,
            "es",
            {
              sensitivity:
                "base"
            }
          );
      });

  return {
    ok: true,
    exito: true,
    mensaje:
      "Alumnos obtenidos correctamente.",
    total:
      alumnos.length,
    alumnos:
      alumnos
  };
}

/**
 * Atiende la solicitud web:
 * ?accion=obtenerAlumnos
 *
 * @param {Object} parametros
 * @return {ContentService.TextOutput}
 */
function obtenerAlumnosWeb_(parametros) {
  const respuesta =
    obtenerAlumnos_();

  const callback =
    parametros &&
    parametros.callback
      ? String(
          parametros.callback
        ).trim()
      : "";

  return responderJSONP_(
    callback,
    respuesta
  );
}

// ==========================================
// OBTENER ALUMNOS DEL GRUPO CONFIGURADO
// ==========================================

function obtenerAlumnosGrupoActivo_() {
  try {

    // --------------------------------------
    // OBTENER TODOS LOS ALUMNOS
    // --------------------------------------

    const respuestaAlumnos =
      obtenerAlumnos_();

    if (
      !respuestaAlumnos ||
      respuestaAlumnos.ok !== true
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          respuestaAlumnos &&
          respuestaAlumnos.mensaje
            ? respuestaAlumnos.mensaje
            : "No fue posible obtener los alumnos.",
        total: 0,
        alumnos: []
      };
    }


    // --------------------------------------
    // OBTENER CONFIGURACIÓN
    // --------------------------------------

    const respuestaConfiguracion =
      obtenerConfiguracion_();

    if (
      !respuestaConfiguracion ||
      respuestaConfiguracion.ok !== true
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No fue posible obtener la configuración del grupo.",
        total: 0,
        alumnos: []
      };
    }

    const configuracion =
      respuestaConfiguracion
        .configuracion || {};


    // --------------------------------------
    // GRADO Y GRUPO CONFIGURADOS
    // --------------------------------------

    const gradoConfigurado =
  String(
    configuracion.GRADO || ""
  )
    .trim()
    .replace(/[°º]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();

    const grupoConfigurado =
      limpiarGrupo_(
        configuracion.GRUPO || ""
      );


    if (
      !gradoConfigurado ||
      !grupoConfigurado
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Debes configurar GRADO y GRUPO en ⚙️ Configuración.",
        total: 0,
        alumnos: []
      };
    }


    // --------------------------------------
    // FILTRAR ALUMNOS
    // --------------------------------------

    const alumnos =
      respuestaAlumnos.alumnos
        .filter(function(alumno) {

          const gradoAlumno =
  String(
    alumno.grado || ""
  )
    .trim()
    .replace(/[°º]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();

          const grupoAlumno =
            limpiarGrupo_(
              alumno.grupo || ""
            );

          return (
            alumno.activo === true &&
            gradoAlumno ===
              gradoConfigurado &&
            grupoAlumno ===
              grupoConfigurado
          );

        });


    // --------------------------------------
    // RESPUESTA
    // --------------------------------------

    return {
      ok: true,
      exito: true,

      mensaje:
        alumnos.length > 0
          ? "Alumnos del grupo obtenidos correctamente."
          : "No hay alumnos activos en el grupo configurado.",

      grado:
        gradoConfigurado,

      grupo:
        grupoConfigurado,

      total:
        alumnos.length,

      alumnos:
        alumnos
    };

  } catch (error) {

    console.error(
      "Error en obtenerAlumnosGrupoActivo_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener los alumnos del grupo configurado.",
      error:
        error &&
        error.message
          ? error.message
          : String(error),
      total: 0,
      alumnos: []
    };
  }
}


// ==========================================
// RESPUESTA WEB
// ==========================================

function obtenerAlumnosGrupoActivoWeb_(
  parametros
) {

  const respuesta =
    obtenerAlumnosGrupoActivo_();

  const callback =
    parametros &&
    parametros.callback
      ? String(
          parametros.callback
        ).trim()
      : "";

  return responderJSONP_(
    callback,
    respuesta
  );
}

// ==========================================
// CLIENTE HTML: OBTENER ALUMNOS
// ==========================================

/**
 * Función pública utilizada por google.script.run.
 *
 * @return {Object}
 */
function obtenerAlumnosCliente() {
  return obtenerAlumnos_();
}