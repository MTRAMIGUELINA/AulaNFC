// ==========================================
// AULANFC v3
// REGISTRO EN MÓDULOS
// ==========================================

/**
 * Dirige el registro al módulo correspondiente.
 */
function registrarEnModulo_(
  libro,
  modulo,
  alumno,
  uid,
  campoFormativo,
  actividad,
  tipoParticipacion,
  origenRegistro
) {
  const ahora = new Date();

  const origen = String(
    origenRegistro || "nfc"
  )
    .trim()
    .toLowerCase();

  switch (modulo) {
    case "asistencia":
      return registrarAsistencia_(
        libro,
        alumno,
        uid,
        ahora,
        origen
      );

    case "tareas":
  return registrarTarea_(
    libro,
    alumno,
    uid,
    ahora,
    actividad,
    tipoParticipacion
  );

    case "participacion":
      return registrarParticipacion_(
        libro,
        alumno,
        uid,
        ahora,
        campoFormativo,
        actividad,
        tipoParticipacion
      );

    case "conducta":
  return registrarConducta_(
    libro,
    alumno,
    uid,
    ahora,
    tipoParticipacion
  );

    case "lectura":
  return registrarLectura_(
    libro,
    alumno,
    uid,
    ahora,
    tipoParticipacion
  );

    default:
      throw new Error(
        "No se reconoció el módulo."
      );
  }
}


function registrarAsistencia_(
  libro,
  alumno,
  uid,
  ahora,
  origenRegistro
) {
  const encabezados = [
    "FECHA",
    "HORA",
    "ID",
    "NOMBRE",
    "ESTADO",
    "OBSERVACIONES",
    "CICLO ESCOLAR"
  ];

  const hoja = obtenerOCrearHoja_(
    libro,
    NOMBRE_HOJA_ASISTENCIAS,
    encabezados
  );

  const zonaHoraria =
    Session.getScriptTimeZone();

  const fechaHoy =
    Utilities.formatDate(
      ahora,
      zonaHoraria,
      "yyyy-MM-dd"
    );

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila >= 2) {
    const registros =
      hoja
        .getRange(
          2,
          1,
          ultimaFila - 1,
          6
        )
        .getValues();

    const yaRegistrado =
      registros.some(
        function(fila) {
          let fechaRegistro = "";

          if (fila[0] instanceof Date) {
            fechaRegistro =
              Utilities.formatDate(
                fila[0],
                zonaHoraria,
                "yyyy-MM-dd"
              );
          } else {
            fechaRegistro =
              String(
                fila[0] || ""
              ).trim();
          }

          const idRegistro =
            String(
              fila[2] || ""
            ).trim();

          return (
            fechaRegistro === fechaHoy &&
            idRegistro ===
              String(
                alumno.id
              ).trim()
          );
        }
      );

    if (yaRegistrado) {
      return {
        exito: false,
        mensaje:
          alumno.nombreCompleto +
          " ya tiene asistencia registrada hoy."
      };
    }
  }

  const observacion =
    String(origenRegistro || "nfc")
      .toLowerCase() === "manual"
      ? "Registro manual"
      : "Registro mediante NFC";
  
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

  hoja.appendRow([
  ahora,
  ahora,
  alumno.id,
  alumno.nombreCompleto,
  "Presente",
  observacion,
  cicloEscolar
]);

  formatearColumnasFechaHora_(
    hoja
  );

  return {
    exito: true,
    mensaje:
      "Asistencia registrada para " +
      alumno.nombreCompleto +
      "."
  };
}


function registrarTarea_(
  libro,
  alumno,
  uid,
  ahora,
  actividad,
  resultadoTarea
) {
  const resultado =
    String(resultadoTarea || "")
      .trim();

  registrarFilaModulo_(
    libro,
    NOMBRE_HOJA_TAREAS,
    [
      "Fecha",
      "Hora",
      "ID alumno",
      "Nombre del alumno",
      "Grado",
      "Grupo",
      "UID",
      "actividad",
      "Registro"
    ],
    [
      ahora,
      ahora,
      alumno.id,
      alumno.nombreCompleto,
      alumno.grado,
      alumno.grupo,
      formatearUID_(uid),
      actividad,
      resultado
    ]
  );

  return {
    exito: true,
    mensaje:
      resultado +
      " para " +
      alumno.nombreCompleto +
      "."
  };
}


// ==========================================
// REGISTRAR PARTICIPACIÓN
// ==========================================

function registrarParticipacion_(
  libro,
  alumno,
  uid,
  ahora,
  campoFormativo,
  actividad,
  tipoParticipacion
) {
  registrarFilaModulo_(
    libro,
    NOMBRE_HOJA_PARTICIPACIONES,
    [
      "Fecha",
      "Hora",
      "ID alumno",
      "Nombre del alumno",
      "Grado",
      "Grupo",
      "UID",
      "Campo formativo",
      "Actividad",
      "Tipo de participación"
    ],
    [
      ahora,
      ahora,
      alumno.id,
      alumno.nombreCompleto,
      alumno.grado,
      alumno.grupo,
      formatearUID_(uid),
      campoFormativo,
      actividad,
      tipoParticipacion
    ]
  );

  return {
    exito: true,
    mensaje:
      "Participación registrada para " +
      alumno.nombreCompleto +
      "."
  };
}

// ==========================================
// REGISTRAR CONDUCTA
// ==========================================

function registrarConducta_(
  libro,
  alumno,
  uid,
  ahora,
  incidencia
) {
  const resultado =
    String(
      incidencia || ""
    ).trim();

  registrarFilaModulo_(
    libro,
    NOMBRE_HOJA_CONDUCTA,
    [
      "Fecha",
      "Hora",
      "ID alumno",
      "Nombre del alumno",
      "Grado",
      "Grupo",
      "UID",
      "Registro"
    ],
    [
      ahora,
      ahora,
      alumno.id,
      alumno.nombreCompleto,
      alumno.grado,
      alumno.grupo,
      formatearUID_(uid),
      resultado
    ]
  );

  return {
    exito: true,
    mensaje:
      resultado +
      " para " +
      alumno.nombreCompleto +
      "."
  };
}


// ==========================================
// REGISTRAR LECTURA
// ==========================================

function registrarLectura_(
  libro,
  alumno,
  uid,
  ahora,
  actividadLectura
) {
  const resultado =
    String(
      actividadLectura || ""
    ).trim();

  registrarFilaModulo_(
    libro,
    NOMBRE_HOJA_LECTURA,
    [
      "Fecha",
      "Hora",
      "ID alumno",
      "Nombre del alumno",
      "Grado",
      "Grupo",
      "UID",
      "Registro"
    ],
    [
      ahora,
      ahora,
      alumno.id,
      alumno.nombreCompleto,
      alumno.grado,
      alumno.grupo,
      formatearUID_(uid),
      resultado
    ]
  );

  return {
    exito: true,
    mensaje:
      resultado +
      " para " +
      alumno.nombreCompleto +
      "."
  };
}