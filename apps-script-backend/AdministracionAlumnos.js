// ==========================================
// AULANFC v3
// ADMINISTRACIÓN DE ALUMNOS
// ==========================================


// ==========================================
// GENERAR SIGUIENTE ID
// ==========================================

function generarSiguienteIdAlumno_() {
  const libro =
    SpreadsheetApp.openById(
      ID_HOJA_CALCULO
    );

  const hoja =
    libro.getSheetByName(
      NOMBRE_HOJA_ALUMNOS
    );

  if (!hoja) {
    throw new Error(
      "No existe la hoja " +
      NOMBRE_HOJA_ALUMNOS +
      "."
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return "1";
  }

  const ids =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        1
      )
      .getDisplayValues()
      .flat()
      .map(function(valor) {
        return Number(
          String(valor || "").trim()
        );
      })
      .filter(function(valor) {
        return Number.isFinite(valor);
      });

  if (ids.length === 0) {
    return "1";
  }

  return String(
    Math.max.apply(
      null,
      ids
    ) + 1
  );
}


// ==========================================
// CREAR ALUMNO
// ==========================================

function crearAlumno_(parametros) {
  try {
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
          "No existe la hoja de alumnos."
      };
    }

    const nombre =
      String(
        parametros.nombre || ""
      ).trim();

    const apellidoPaterno =
      String(
        parametros.apellidoPaterno || ""
      ).trim();

    const apellidoMaterno =
      String(
        parametros.apellidoMaterno || ""
      ).trim();

    const fechaNacimiento =
      String(
        parametros.fechaNacimiento || ""
      ).trim();

    const grado =
      String(
        parametros.grado || ""
      ).trim();

    const grupo =
      limpiarGrupo_(
        parametros.grupo || ""
      );

    const uid =
      formatearUID_(
        parametros.uid || ""
      );

    const foto =
      String(
        parametros.foto || ""
      ).trim();

    if (
      !nombre ||
      !apellidoPaterno ||
      !grado ||
      !grupo
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Faltan datos obligatorios del alumno."
      };
    }

    const lock =
      LockService.getScriptLock();

    let lockAdquirido = false;
    let idAlumno = "";

    try {
      lockAdquirido =
        lock.tryLock(5000);

      if (!lockAdquirido) {
        return {
          ok: false,
          exito: false,
          mensaje:
            "No fue posible procesar el alta en este momento. Intenta nuevamente."
        };
      }

      // --------------------------------------
      // VALIDAR UID DUPLICADO BAJO LOCK
      // --------------------------------------

      if (uid) {
        const ultimaFila =
          hoja.getLastRow();

        if (ultimaFila >= 2) {
          const uids =
            hoja
              .getRange(
                2,
                8,
                ultimaFila - 1,
                1
              )
              .getDisplayValues()
              .flat();

          const uidDuplicado =
            uids.some(function(valor) {
              return (
                formatearUID_(valor) === uid
              );
            });

          if (uidDuplicado) {
            return {
              ok: false,
              exito: false,
              mensaje:
                "Esta tarjeta NFC ya está asignada a otro alumno."
            };
          }
        }
      }

      idAlumno =
        generarSiguienteIdAlumno_();

      hoja.appendRow([
        idAlumno,
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        fechaNacimiento,
        grado,
        grupo,
        uid,
        "ACTIVO",
        foto
      ]);

      SpreadsheetApp.flush();

    } finally {
      if (lockAdquirido) {
        lock.releaseLock();
      }
    }

    return {
      ok: true,
      exito: true,
      mensaje:
        "Alumno agregado correctamente.",
      idAlumno:
        idAlumno
    };

  } catch (error) {
    console.error(
      "Error en crearAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible agregar el alumno.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}


// ==========================================
// ACTUALIZAR ALUMNO
// ==========================================

function actualizarAlumno_(parametros) {
  try {
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
          "No existe la hoja de alumnos."
      };
    }

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    if (!idAlumno) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se recibió el ID del alumno."
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No hay alumnos registrados."
      };
    }

    const ids =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues()
        .flat();

    const indice =
      ids.findIndex(function(valor) {
        return (
          String(valor || "").trim() ===
          idAlumno
        );
      });

    if (indice === -1) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se encontró el alumno."
      };
    }

    const fila =
      indice + 2;

    const nombre =
      String(
        parametros.nombre || ""
      ).trim();

    const apellidoPaterno =
      String(
        parametros.apellidoPaterno || ""
      ).trim();

    const apellidoMaterno =
      String(
        parametros.apellidoMaterno || ""
      ).trim();

    const fechaNacimiento =
      String(
        parametros.fechaNacimiento || ""
      ).trim();

    const grado =
      String(
        parametros.grado || ""
      ).trim();

    const grupo =
      limpiarGrupo_(
        parametros.grupo || ""
      );

    const uid =
      formatearUID_(
        parametros.uid || ""
      );

    const foto =
      String(
        parametros.foto || ""
      ).trim();

    if (
      !nombre ||
      !apellidoPaterno ||
      !grado ||
      !grupo
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Faltan datos obligatorios del alumno."
      };
    }

    // --------------------------------------
    // COMPROBAR QUE EL UID NO PERTENEZCA
    // A OTRO ALUMNO
    // --------------------------------------

    if (uid) {
      const datosUID =
        hoja
          .getRange(
            2,
            1,
            ultimaFila - 1,
            8
          )
          .getDisplayValues();

      const duplicado =
        datosUID.some(function(registro) {

          const otroId =
            String(
              registro[0] || ""
            ).trim();

          const otroUID =
            formatearUID_(
              registro[7]
            );

          return (
            otroId !== idAlumno &&
            otroUID === uid
          );
        });

      if (duplicado) {
        return {
          ok: false,
          exito: false,
          mensaje:
            "Esta tarjeta NFC ya está asignada a otro alumno."
        };
      }
    }

    // Conservamos el estado actual.
    const estadoActual =
      String(
        hoja
          .getRange(
            fila,
            9
          )
          .getDisplayValue() ||
        "ACTIVO"
      )
        .trim()
        .toUpperCase();

    hoja
      .getRange(
        fila,
        2,
        1,
        9
      )
      .setValues([
        [
          nombre,
          apellidoPaterno,
          apellidoMaterno,
          fechaNacimiento,
          grado,
          grupo,
          uid,
          estadoActual,
          foto
        ]
      ]);

    SpreadsheetApp.flush();

    return {
      ok: true,
      exito: true,
      mensaje:
        "Datos del alumno actualizados correctamente."
    };

  } catch (error) {
    console.error(
      "Error en actualizarAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible actualizar el alumno.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}


// ==========================================
// CAMBIAR ESTADO DEL ALUMNO
// ==========================================

function cambiarEstadoAlumno_(parametros) {
  try {
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
          "No existe la hoja de alumnos."
      };
    }

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const nuevoEstado =
      String(
        parametros.estado || ""
      )
        .trim()
        .toUpperCase();

    if (
      nuevoEstado !== "ACTIVO" &&
      nuevoEstado !== "INACTIVO" &&
      nuevoEstado !== "BAJA DEFINITIVA"
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "El estado del alumno no es válido."
      };
    }

    const ultimaFila =
      hoja.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No hay alumnos registrados."
      };
    }

    const ids =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues()
        .flat();

    const indice =
      ids.findIndex(function(valor) {
        return (
          String(
            valor || ""
          ).trim() ===
          idAlumno
        );
      });

    if (indice === -1) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se encontró el alumno."
      };
    }

    hoja
      .getRange(
        indice + 2,
        9
      )
      .setValue(
        nuevoEstado
      );

    SpreadsheetApp.flush();

    let mensaje = "";

    if (
      nuevoEstado === "ACTIVO"
    ) {
      mensaje =
        "Alumno activado correctamente.";

    } else if (
      nuevoEstado === "INACTIVO"
    ) {
      mensaje =
        "Alumno inactivado correctamente.";

    } else if (
      nuevoEstado ===
      "BAJA DEFINITIVA"
    ) {
      mensaje =
        "Alumno dado de baja definitivamente. Su historial se conserva.";
    }

    return {
      ok: true,
      exito: true,
      mensaje:
        mensaje,
      estado:
        nuevoEstado
    };

  } catch (error) {
    console.error(
      "Error en cambiarEstadoAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible cambiar el estado del alumno.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}

// ==========================================
// RESPUESTA WEB: CREAR ALUMNO
// ==========================================

function crearAlumnoWeb_(parametros) {
  const respuesta =
    crearAlumno_(
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
// RESPUESTA WEB: ACTUALIZAR ALUMNO
// ==========================================

function actualizarAlumnoWeb_(parametros) {
  const respuesta =
    actualizarAlumno_(
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
// RESPUESTA WEB: CAMBIAR ESTADO
// ==========================================

function cambiarEstadoAlumnoWeb_(parametros) {
  const respuesta =
    cambiarEstadoAlumno_(
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
// ELIMINAR ALUMNO DEFINITIVAMENTE
// SOLO SI NO TIENE REGISTROS
// ==========================================

function eliminarAlumno_(parametros) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const hojaAlumnos =
      libro.getSheetByName(
        NOMBRE_HOJA_ALUMNOS
      );

    if (!hojaAlumnos) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No existe la hoja de alumnos."
      };
    }

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    if (!idAlumno) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se recibió el ID del alumno."
      };
    }

    // --------------------------------------
    // BUSCAR ALUMNO
    // --------------------------------------

    const ultimaFila =
      hojaAlumnos.getLastRow();

    if (ultimaFila < 2) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No hay alumnos registrados."
      };
    }

    const ids =
      hojaAlumnos
        .getRange(
          2,
          1,
          ultimaFila - 1,
          1
        )
        .getDisplayValues()
        .flat();

    const indice =
      ids.findIndex(function(valor) {
        return (
          String(valor || "").trim() ===
          idAlumno
        );
      });

    if (indice === -1) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se encontró el alumno."
      };
    }

    // --------------------------------------
    // COMPROBAR SI TIENE HISTORIAL
    // --------------------------------------

    const hojasConHistorial = [
      NOMBRE_HOJA_ASISTENCIAS,
      NOMBRE_HOJA_TAREAS,
      NOMBRE_HOJA_PARTICIPACIONES,
      NOMBRE_HOJA_CONDUCTA,
      NOMBRE_HOJA_LECTURA,
      "INCIDENCIAS",
      "RESULTADOS EXAMEN"
    ];

    const tieneHistorial =
      hojasConHistorial.some(
        function(nombreHoja) {

          const hoja =
            libro.getSheetByName(
              nombreHoja
            );

          if (
            !hoja ||
            hoja.getLastRow() < 2
          ) {
            return false;
          }

          const datos =
            hoja
              .getDataRange()
              .getDisplayValues();

          const encabezados =
            datos[0].map(
              function(valor) {
                return String(
                  valor || ""
                )
                  .trim()
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(
                    /[\u0300-\u036f]/g,
                    ""
                  );
              }
            );

          const posiblesEncabezados = [
            "id alumno",
            "id del alumno",
            "idalumno",
            "id"
          ];

          let indiceId = -1;

          for (
            let i = 0;
            i <
            posiblesEncabezados.length;
            i++
          ) {
            indiceId =
              encabezados.indexOf(
                posiblesEncabezados[i]
              );

            if (indiceId !== -1) {
              break;
            }
          }

          if (indiceId === -1) {
            return false;
          }

          for (
            let fila = 1;
            fila < datos.length;
            fila++
          ) {
            if (
              String(
                datos[fila][indiceId] ||
                ""
              ).trim() === idAlumno
            ) {
              return true;
            }
          }

          return false;
        }
      );

    if (tieneHistorial) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "Este alumno ya tiene registros asociados. No puede eliminarse definitivamente; déjalo como INACTIVO."
      };
    }

    // --------------------------------------
    // ELIMINAR
    // --------------------------------------

    hojaAlumnos.deleteRow(
      indice + 2
    );

    SpreadsheetApp.flush();

    return {
      ok: true,
      exito: true,
      mensaje:
        "Alumno eliminado definitivamente."
    };

  } catch (error) {
    console.error(
      "Error en eliminarAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible eliminar el alumno.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}

// ==========================================
// RESPUESTA WEB: ELIMINAR ALUMNO
// ==========================================

function eliminarAlumnoWeb_(
  parametros
) {
  const respuesta =
    eliminarAlumno_(
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