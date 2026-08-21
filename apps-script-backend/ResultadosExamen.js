// ==========================================
// AULANFC v3
// RESULTADOS DE EXAMEN
// Captura por alumno y trimestre
// ==========================================


// ==========================================
// OBTENER RESULTADOS DE EXAMEN
// ==========================================

function obtenerResultadosExamen_(parametros) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hoja =
      libro.getSheetByName(
        "RESULTADOS EXAMEN"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja RESULTADOS EXAMEN.",
        resultados: []
      };
    }

    const periodo =
      String(
        parametros.periodo || ""
      ).trim();

    const idAlumno =
      String(
        parametros.idAlumno ||
        parametros.id ||
        ""
      ).trim();

    const campoFormativo =
      String(
        parametros.campoFormativo || ""
      ).trim();

      // --------------------------------------
// OBTENER CICLO ESCOLAR ACTIVO
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

if (!cicloEscolar) {
  return {
    ok: false,
    exito: false,
    mensaje:
      "No hay un ciclo escolar configurado.",
    resultados: []
  };
}

    if (!periodo) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Debes seleccionar el trimestre.",
        resultados: []
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: true,
        exito: true,
        resultados: []
      };
    }

    const datos =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          9
        )
        .getDisplayValues();

    const resultados =
      datos
        .filter(function(fila) {

          const periodoFila =
            String(
              fila[0] || ""
            ).trim();

          const campoFila =
            String(
              fila[1] || ""
            ).trim();

          const idFila =
            String(
              fila[2] || ""
            ).trim();

          const cicloFila =
            String(
             fila[8] || ""
            ).trim();

          if (
            periodoFila !== periodo
          ) {
            return false;
          }

          if (
            cicloFila !== cicloEscolar
          ) {
            return false;
          }

          if (
            idAlumno &&
            idFila !== idAlumno
          ) {
            return false;
          }

          if (
            campoFormativo &&
            campoFila !== campoFormativo
          ) {
            return false;
          }

          return true;
        })
        .map(function(fila) {
          return {
            periodo:
              String(
                fila[0] || ""
              ).trim(),

            campoFormativo:
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

            calificacion:
              String(
                fila[6] || ""
              ).trim(),

            fechaCaptura:
              String(
                fila[7] || ""
              ).trim(),

            cicloEscolar:
              String(
               fila[8] || ""
              ).trim()  
          };
        });

    return {
      ok: true,
      exito: true,
      periodo: periodo,
      cicloEscolar: cicloEscolar,
      idAlumno: idAlumno,
      total: resultados.length,
      resultados: resultados
    };

  } catch (error) {
    console.error(
      "Error en obtenerResultadosExamen_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener los resultados de examen.",
      error:
        error && error.message
          ? error.message
          : String(error),
      resultados: []
    };
  }
}


// ==========================================
// GUARDAR RESULTADOS DE UN ALUMNO
// ==========================================

function guardarResultadosExamen_(
  parametros
) {
  let bloqueo = null;

  try {
    bloqueo =
      LockService.getScriptLock();

    if (!bloqueo.tryLock(10000)) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Hay otra operación de calificaciones en curso. Intenta nuevamente."
      };
    }

    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hoja =
      libro.getSheetByName(
        "RESULTADOS EXAMEN"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja RESULTADOS EXAMEN."
      };
    }

    const periodo =
      String(
        parametros.periodo || ""
      ).trim();

    const idAlumno =
      String(
        parametros.idAlumno ||
        parametros.id ||
        ""
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

    const calificaciones =
      Array.isArray(
        parametros.calificaciones
      )
        ? parametros.calificaciones
        : [];

    if (!periodo) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Debes seleccionar el trimestre."
      };
    }

    if (!idAlumno) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Debes seleccionar un alumno."
      };
    }

    if (
      calificaciones.length === 0
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se recibieron calificaciones."
      };
    }

    const calificacionesValidas =
      calificaciones.filter(
        function(item) {
          const campo =
            String(
              item.campoFormativo || ""
            ).trim();

          const calificacion =
            String(
              item.calificacion || ""
            ).trim();

          return (
            campo !== "" &&
            calificacion !== ""
          );
        }
      );

    if (
      calificacionesValidas.length === 0
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Captura al menos una calificación."
      };
    }

    // --------------------------------------
    // VALIDAR CALIFICACIONES
    // --------------------------------------

    for (
      let i = 0;
      i < calificacionesValidas.length;
      i++
    ) {
      const numero =
        Number(
          calificacionesValidas[i]
            .calificacion
        );

      if (
        !Number.isFinite(numero) ||
        numero < 0 ||
        numero > 10
      ) {
        return {
          ok: false,
          exito: false,
          mensaje:
            "Las calificaciones deben estar entre 0 y 10."
        };
      }
    }

    // --------------------------------------
    // FECHA DE CAPTURA
    // --------------------------------------

    const ahora =
      new Date();

    const zonaHoraria =
      Session.getScriptTimeZone();

    const fechaCaptura =
      Utilities.formatDate(
        ahora,
        zonaHoraria,
        "yyyy-MM-dd"
      );

    // --------------------------------------
// CICLO ESCOLAR
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

    // --------------------------------------
    // LEER REGISTROS EXISTENTES
    // --------------------------------------

    const ultimaFila =
      hoja.getLastRow();

    let datosExistentes = [];

    if (ultimaFila >= 2) {
      datosExistentes =
        hoja
          .getRange(
            2,
            1,
            ultimaFila - 1,
            9
          )
          .getDisplayValues();
    }

    let actualizados = 0;
    let nuevos = 0;

    // --------------------------------------
    // GUARDAR CADA CAMPO FORMATIVO
    // --------------------------------------

    calificacionesValidas.forEach(
      function(item) {

        const campoFormativo =
          String(
            item.campoFormativo || ""
          ).trim();

        const calificacion =
          String(
            item.calificacion || ""
          ).trim();

        let filaEncontrada = -1;

        for (
          let i = 0;
          i < datosExistentes.length;
          i++
        ) {
          const fila =
            datosExistentes[i];

          const periodoFila =
            String(
              fila[0] || ""
            ).trim();

          const campoFila =
            String(
              fila[1] || ""
            ).trim();

          const idFila =
            String(
              fila[2] || ""
            ).trim();

          const cicloFila =
            String(
             fila[8] || ""
            ).trim();

          if (
            periodoFila === periodo &&
            campoFila === campoFormativo &&
            idFila === idAlumno&&
            cicloFila === cicloEscolar
          ) {
            filaEncontrada =
              i + 2;

            break;
          }
        }

        // ----------------------------------
        // ACTUALIZAR SI YA EXISTE
        // ----------------------------------

        if (filaEncontrada !== -1) {

          hoja
            .getRange(
              filaEncontrada,
              1,
              1,
              9
            )
            .setValues([
              [
                periodo,
                campoFormativo,
                idAlumno,
                nombre,
                grado,
                grupo,
                calificacion,
                fechaCaptura,
                cicloEscolar

              ]
            ]);

          actualizados++;

        } else {

          // --------------------------------
          // CREAR NUEVO REGISTRO
          // --------------------------------

          hoja.appendRow([
            periodo,
            campoFormativo,
            idAlumno,
            nombre,
            grado,
            grupo,
            calificacion,
            fechaCaptura,
            cicloEscolar
          ]);

          nuevos++;

          datosExistentes.push([
            periodo,
            campoFormativo,
            idAlumno,
            nombre,
            grado,
            grupo,
            calificacion,
            fechaCaptura,
            cicloEscolar
          ]);
        }
      }
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      exito: true,
      mensaje:
        "Calificaciones guardadas correctamente.",
      idAlumno: idAlumno,
      periodo: periodo,
      total:
        calificacionesValidas.length,
      nuevos: nuevos,
      actualizados:
        actualizados
    };

  } catch (error) {
    console.error(
      "Error en guardarResultadosExamen_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible guardar las calificaciones.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  } finally {
    if (
      bloqueo &&
      bloqueo.hasLock()
    ) {
      bloqueo.releaseLock();
    }
  }
}


// ==========================================
// ELIMINAR UNA CALIFICACIÓN
// ==========================================

function eliminarResultadoExamen_(
  parametros
) {
  let bloqueo = null;

  try {
    parametros =
      parametros || {};

    const periodo =
      String(
        parametros.periodo || ""
      ).trim();

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const campoFormativo =
      String(
        parametros.campoFormativo || ""
      ).trim();

    const periodosValidos = [
      "Primer trimestre",
      "Segundo trimestre",
      "Tercer trimestre"
    ];

    const camposValidos = [
      "Lenguajes",
      "Saberes y Pensamiento Científico",
      "Ética, Naturaleza y Sociedad",
      "De lo Humano a lo Comunitario"
    ];

    if (!periodo) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "Debes seleccionar el trimestre."
      };
    }

    if (
      periodosValidos.indexOf(periodo) === -1
    ) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "El trimestre indicado no es válido."
      };
    }

    if (!idAlumno) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "Debes seleccionar un alumno."
      };
    }

    if (!campoFormativo) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "Debes indicar el campo formativo."
      };
    }

    if (
      camposValidos.indexOf(
        campoFormativo
      ) === -1
    ) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "El campo formativo indicado no es válido."
      };
    }

    bloqueo =
      LockService.getScriptLock();

    if (!bloqueo.tryLock(10000)) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "Hay otra operación de calificaciones en curso. Intenta nuevamente."
      };
    }

    const respuestaConfiguracion =
      obtenerConfiguracion_();

    const cicloEscolar =
      respuestaConfiguracion &&
      respuestaConfiguracion.ok === true
        ? String(
            respuestaConfiguracion
              .configuracion
              ?.CICLO_ESCOLAR || ""
          ).trim()
        : "";

    if (!cicloEscolar) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "No hay un ciclo escolar configurado."
      };
    }

    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hoja =
      libro.getSheetByName(
        "RESULTADOS EXAMEN"
      );

    if (!hoja) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        mensaje:
          "No existe la hoja RESULTADOS EXAMEN."
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    let filasCoincidentes = [];

    if (ultimaFila >= 2) {
      const datos =
        hoja
          .getRange(
            2,
            1,
            ultimaFila - 1,
            9
          )
          .getDisplayValues();

      datos.forEach(
        function(fila, indice) {
          const coincide =
            String(fila[0] || "").trim() === periodo &&
            String(fila[1] || "").trim() === campoFormativo &&
            String(fila[2] || "").trim() === idAlumno &&
            String(fila[8] || "").trim() === cicloEscolar;

          if (coincide) {
            filasCoincidentes.push(
              indice + 2
            );
          }
        }
      );
    }

    if (
      filasCoincidentes.length === 0
    ) {
      return {
        ok: true,
        exito: true,
        eliminado: false,
        yaNoExistia: true,
        mensaje:
          "La calificación ya no existía.",
        periodo: periodo,
        idAlumno: idAlumno,
        campoFormativo: campoFormativo,
        cicloEscolar: cicloEscolar
      };
    }

    if (
      filasCoincidentes.length > 1
    ) {
      return {
        ok: false,
        exito: false,
        eliminado: false,
        conflicto: true,
        mensaje:
          "Se encontraron registros duplicados. No se eliminó ninguna calificación."
      };
    }

    hoja.deleteRow(
      filasCoincidentes[0]
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      exito: true,
      eliminado: true,
      mensaje:
        "Calificación eliminada correctamente.",
      periodo: periodo,
      idAlumno: idAlumno,
      campoFormativo: campoFormativo,
      cicloEscolar: cicloEscolar
    };

  } catch (error) {
    console.error(
      "Error en eliminarResultadoExamen_:",
      error
    );

    return {
      ok: false,
      exito: false,
      eliminado: false,
      mensaje:
        "No fue posible eliminar la calificación.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  } finally {
    if (
      bloqueo &&
      bloqueo.hasLock()
    ) {
      bloqueo.releaseLock();
    }
  }
}


// ==========================================
// RESPUESTA WEB:
// OBTENER RESULTADOS
// ==========================================

function obtenerResultadosExamenWeb_(
  parametros
) {
  const respuesta =
    obtenerResultadosExamen_(
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
// RESPUESTA WEB:
// GUARDAR RESULTADOS
// ==========================================

function guardarResultadosExamenWeb_(
  parametros
) {
  let calificaciones = [];

  try {
    calificaciones =
      JSON.parse(
        parametros.calificaciones ||
        "[]"
      );
  } catch (error) {
    calificaciones = [];
  }

  const respuesta =
    guardarResultadosExamen_({
      periodo:
        parametros.periodo,

      idAlumno:
        parametros.idAlumno,

      nombre:
        parametros.nombre,

      grado:
        parametros.grado,

      grupo:
        parametros.grupo,

      calificaciones:
        calificaciones
    });

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}


// ==========================================
// RESPUESTA WEB:
// ELIMINAR UNA CALIFICACIÓN
// ==========================================

function eliminarResultadoExamenWeb_(
  parametros
) {
  const respuesta =
    eliminarResultadoExamen_({
      periodo:
        parametros.periodo,

      idAlumno:
        parametros.idAlumno,

      campoFormativo:
        parametros.campoFormativo
    });

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}
