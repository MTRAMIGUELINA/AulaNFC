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
  origenRegistro,
  fechaActividad
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
        tipoParticipacion,
        fechaActividad
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

  const zonaHoraria =
    Session.getScriptTimeZone();

  const fechaHoy =
    Utilities.formatDate(
      ahora,
      zonaHoraria,
      "yyyy-MM-dd"
    );

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

  const lock =
    LockService.getScriptLock();

  let lockAdquirido = false;
  let hoja;

  try {
    lockAdquirido =
      lock.tryLock(5000);

    if (!lockAdquirido) {
      throw new Error(
        "No fue posible guardar la asistencia en este momento. Intenta nuevamente."
      );
    }

    hoja = obtenerOCrearHoja_(
      libro,
      NOMBRE_HOJA_ASISTENCIAS,
      encabezados
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

    hoja.appendRow([
      ahora,
      ahora,
      alumno.id,
      alumno.nombreCompleto,
      "Presente",
      observacion,
      cicloEscolar
    ]);

    SpreadsheetApp.flush();

  } finally {
    if (lockAdquirido) {
      lock.releaseLock();
    }
  }

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

function fechaClaveParticipacion_(valor) {
  const texto = String(valor || "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[1] + "-" + iso[2] + "-" + iso[3];
  const visible = texto.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (visible) return visible[3] + "-" + visible[2].padStart(2, "0") + "-" + visible[1].padStart(2, "0");
  return texto;
}

function participacionYaRegistrada_(libro, alumno, campoFormativo, actividad, fechaActividad) {
  if (!fechaActividad) return false;
  const hoja = libro.getSheetByName(NOMBRE_HOJA_PARTICIPACIONES);
  if (!hoja || hoja.getLastRow() < 2) return false;
  const datos = hoja.getDataRange().getDisplayValues();
  const encabezados = datos[0].map(function(v) {
    return String(v || "").trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  });
  const columna = function(nombre) { return encabezados.indexOf(nombre); };
  const iAlumno = columna("ID ALUMNO");
  const iCampo = columna("CAMPO FORMATIVO");
  const iActividad = columna("ACTIVIDAD");
  const iFecha = columna("FECHA ACTIVIDAD");
  if ([iAlumno, iCampo, iActividad, iFecha].some(function(i) { return i < 0; })) return false;
  const normalizar = function(v) {
    return String(v || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  };
  const fecha = fechaClaveParticipacion_(fechaActividad);
  for (let i = 1; i < datos.length; i++) {
    const fila = datos[i];
    if (String(fila[iAlumno]).trim() === String(alumno.id).trim() &&
        normalizar(fila[iCampo]) === normalizar(campoFormativo) &&
        normalizar(fila[iActividad]) === normalizar(actividad) &&
        fechaClaveParticipacion_(fila[iFecha]) === fecha) return true;
  }
  return false;
}

function registrarParticipacion_(
  libro,
  alumno,
  uid,
  ahora,
  campoFormativo,
  actividad,
  tipoParticipacion,
  fechaActividad
) {
  if (participacionYaRegistrada_(libro, alumno, campoFormativo, actividad, fechaActividad)) {
    return {
      exito: true,
      omitido: true,
      mensaje: "La actividad ya estaba registrada para este alumno."
    };
  }
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
    ],
    { "FECHA ACTIVIDAD": fechaActividad || "" }
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