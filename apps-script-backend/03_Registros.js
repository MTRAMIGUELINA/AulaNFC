// ==========================================
// AULANFC v3
// REGISTRO DESDE EL ESCÁNER NFC
// ==========================================

function registrarDesdeEscaner_(parametros) {
  try {
    const uid = normalizarUID_(
      parametros.uid
    );

    const modulo = String(
      parametros.modulo || ""
    )
      .trim()
      .toLowerCase();

    const campoFormativo = String(
  parametros.campoFormativo ||
  parametros.campo ||
  ""
).trim();

    const actividad =
  String(
    parametros.actividad || ""
  ).trim();

    const tipoRegistro = String(
  parametros.tipoRegistro ||
  parametros.tipoParticipacion ||
  parametros.tipoTarea ||
  parametros.resultadoTarea ||
  parametros.tipoConducta ||
  parametros.conducta ||
  parametros.tipoLectura ||
  parametros.lectura ||
  ""
).trim();

const tipoParticipacion = tipoRegistro;

    const libro = SpreadsheetApp.openById(
      ID_HOJA_CALCULO
    );

    // --------------------------------------
    // VALIDAR UID
    // --------------------------------------
    if (!uid) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "No se recibió el UID de la tarjeta."
        }
      );
    }

    // --------------------------------------
    // VALIDAR MÓDULO
    // --------------------------------------
    if (
      !MODULOS_PERMITIDOS.includes(
        modulo
      )
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "El módulo seleccionado no es válido."
        }
      );
    }

    // --------------------------------------
    // VALIDAR PARTICIPACIÓN
    // --------------------------------------
    if (
      modulo === "participacion" &&
      (
        !campoFormativo ||
        !tipoRegistro
      )
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "Falta seleccionar el campo formativo o el tipo de participación."
        }
      );
    }

    // --------------------------------------
    // BUSCAR ALUMNO
    // --------------------------------------
    const alumno = buscarAlumnoPorUID_(
      libro,
      uid
    );

    if (!alumno) {
      guardarEnBitacoraNFC_(
        libro,
        uid,
        modulo,
        campoFormativo,
        tipoRegistro,
        "UID no asignado a un alumno",
        null
      );

      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "La tarjeta no está asignada a ningún alumno.",
          uid: formatearUID_(uid)
        }
      );
    }

    // --------------------------------------
    // VALIDAR ESTADO DEL ALUMNO
    // --------------------------------------
    const estadoAlumno = String(
      alumno.estatus || ""
    )
      .trim()
      .toUpperCase();

    if (
      estadoAlumno &&
      estadoAlumno !== "ACTIVO"
    ) {
      guardarEnBitacoraNFC_(
        libro,
        uid,
        modulo,
        campoFormativo,
        tipoRegistro,
        "Alumno inactivo",
        alumno
      );

      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            alumno.nombreCompleto +
            " aparece como alumno inactivo.",
          nombre:
            alumno.nombreCompleto,
          alumno:
            alumno.nombreCompleto,
          uid:
            formatearUID_(uid)
        }
      );
    }

// --------------------------------------
// VALIDAR GRADO Y GRUPO CONFIGURADOS
// --------------------------------------

const respuestaConfiguracion =
  obtenerConfiguracion_();

if (
  !respuestaConfiguracion ||
  respuestaConfiguracion.ok !== true
) {
  return responderJSONP_(
    parametros.callback,
    {
      exito: false,
      ok: false,
      mensaje:
        "No fue posible verificar la configuración del grupo."
    }
  );
}

const configuracion =
  respuestaConfiguracion
    .configuracion || {};


// --------------------------------------
// NORMALIZAR GRADO CONFIGURADO
// --------------------------------------

const gradoConfigurado =
  String(
    configuracion.GRADO || ""
  )
    .trim()
    .replace(/[°º]/g, "")
    .replace(/\s+/g, "")
    .toUpperCase();


// --------------------------------------
// NORMALIZAR GRUPO CONFIGURADO
// --------------------------------------

const grupoConfigurado =
  limpiarGrupo_(
    configuracion.GRUPO || ""
  );


// --------------------------------------
// VERIFICAR QUE EXISTA CONFIGURACIÓN
// --------------------------------------

if (
  !gradoConfigurado ||
  !grupoConfigurado
) {
  return responderJSONP_(
    parametros.callback,
    {
      exito: false,
      ok: false,
      mensaje:
        "Debes configurar GRADO y GRUPO antes de utilizar el lector NFC."
    }
  );
}


// --------------------------------------
// NORMALIZAR DATOS DEL ALUMNO
// --------------------------------------

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


// --------------------------------------
// VALIDAR QUE PERTENEZCA AL GRUPO ACTIVO
// --------------------------------------

if (
  gradoAlumno !==
    gradoConfigurado ||
  grupoAlumno !==
    grupoConfigurado
) {

  guardarEnBitacoraNFC_(
    libro,
    uid,
    modulo,
    campoFormativo,
    tipoRegistro,
    "Alumno fuera del grupo configurado",
    alumno
  );

  return responderJSONP_(
    parametros.callback,
    {
      exito: false,
      ok: false,

      mensaje:
        alumno.nombreCompleto +
        " no pertenece al grupo activo " +
        gradoConfigurado +
        "° " +
        grupoConfigurado +
        ".",

      nombre:
        alumno.nombreCompleto,

      alumno:
        alumno.nombreCompleto,

      gradoAlumno:
        gradoAlumno,

      grupoAlumno:
        grupoAlumno,

      gradoConfigurado:
        gradoConfigurado,

      grupoConfigurado:
        grupoConfigurado,

      uid:
        formatearUID_(uid)
    }
  );
}
    // --------------------------------------
    // REGISTRAR SEGÚN EL MÓDULO
    // --------------------------------------
    const resultadoRegistro =
  registrarEnModulo_(
    libro,
    modulo,
    alumno,
    uid,
    campoFormativo,
    actividad,
    tipoRegistro,
    "nfc"
  );

    // --------------------------------------
    // GUARDAR BITÁCORA
    // --------------------------------------
    guardarEnBitacoraNFC_(
      libro,
      uid,
      modulo,
      campoFormativo,
      tipoParticipacion,
      resultadoRegistro.mensaje,
      alumno
    );

    SpreadsheetApp.flush();

    const ahora = new Date();

    const zonaHoraria =
      Session.getScriptTimeZone();

    const horaRegistro =
      Utilities.formatDate(
        ahora,
        zonaHoraria,
        "HH:mm:ss"
      );

    // --------------------------------------
    // RESPUESTA AL CELULAR
    // --------------------------------------
    return responderJSONP_(
      parametros.callback,
      {
        exito:
          resultadoRegistro.exito,

        ok:
          resultadoRegistro.exito,

        mensaje:
          resultadoRegistro.mensaje,

        uid:
          formatearUID_(uid),

        modulo:
          obtenerNombreModulo_(
            modulo
          ),

        nombre:
          alumno.nombreCompleto,

        alumno:
          alumno.nombreCompleto,

        idAlumno:
          alumno.id,

        grado:
          alumno.grado,

        grupo:
          alumno.grupo,

        foto:
          alumno.foto || "",

        hora:
          horaRegistro
      }
    );

  } catch (error) {
    console.error(
      "Error en registrarDesdeEscaner_:",
      error
    );

    return responderJSONP_(
      parametros.callback,
      {
        exito: false,
        ok: false,
        mensaje:
          "Error al registrar: " +
          (
            error && error.message
              ? error.message
              : "Error desconocido."
          )
      }
    );
  }
}

// ==========================================
// REGISTRO MANUAL DE ALUMNOS
// ==========================================

function registrarManualWeb_(parametros) {
  try {
    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const modulo =
      String(
        parametros.modulo || ""
      )
        .trim()
        .toLowerCase();

    const campoFormativo =
      String(
        parametros.campoFormativo || ""
      ).trim();

    const actividad =
     String(
       parametros.actividad || ""
      ).trim();

    const tipoRegistro =
  String(
    parametros.tipoRegistro ||
    parametros.resultado ||
    parametros.detalle ||
    parametros.valor ||
    parametros.registro ||
    parametros.tipoParticipacion ||
    parametros.resultadoParticipacion ||
    parametros.tipoTarea ||
    parametros.resultadoTarea ||
    parametros.tarea ||
    parametros.tipoConducta ||
    parametros.resultadoConducta ||
    parametros.conducta ||
    parametros.incidencia ||
    parametros.tipoLectura ||
    parametros.resultadoLectura ||
    parametros.lectura ||
    parametros.actividadLectura ||
    ""
  ).trim();

    // --------------------------------------
    // VALIDAR ID DEL ALUMNO
    // --------------------------------------
    if (!idAlumno) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "No se recibió el ID del alumno."
        }
      );
    }

    // --------------------------------------
    // VALIDAR MÓDULO
    // --------------------------------------
    if (
      !MODULOS_PERMITIDOS.includes(
        modulo
      )
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "El módulo seleccionado no es válido."
        }
      );
    }

    // --------------------------------------
    // VALIDAR DATOS DEL REGISTRO
    // --------------------------------------
    if (
  modulo !== "asistencia" &&
  modulo !== "participacion" &&
  !tipoRegistro
) {
  return responderJSONP_(
    parametros.callback,
    {
      exito: false,
      ok: false,
      mensaje:
        "Falta seleccionar el resultado o tipo de registro."
    }
  );
}
 
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    // --------------------------------------
    // BUSCAR ALUMNO POR ID
    // --------------------------------------
    const alumno =
      buscarAlumnoPorID_(
        libro,
        idAlumno
      );

    if (!alumno) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "No se encontró un alumno con el ID recibido.",
          idAlumno:
            idAlumno
        }
      );
    }

    // --------------------------------------
    // VALIDAR ESTADO DEL ALUMNO
    // --------------------------------------
    const estadoAlumno =
      String(
        alumno.estatus || ""
      )
        .trim()
        .toUpperCase();

    if (
      estadoAlumno &&
      estadoAlumno !== "ACTIVO"
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            alumno.nombreCompleto +
            " aparece como alumno inactivo.",
          nombre:
            alumno.nombreCompleto,
          alumno:
            alumno.nombreCompleto,
          idAlumno:
            alumno.id
        }
      );
    }

    // --------------------------------------
    // VALIDAR GRADO Y GRUPO CONFIGURADOS
    // --------------------------------------
    const respuestaConfiguracion =
      obtenerConfiguracion_();

    if (
      !respuestaConfiguracion ||
      respuestaConfiguracion.ok !== true
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "No fue posible verificar la configuración del grupo."
        }
      );
    }

    const configuracion =
      respuestaConfiguracion
        .configuracion || {};

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
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            "Debes configurar GRADO y GRUPO antes de registrar manualmente."
        }
      );
    }

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

    if (
      gradoAlumno !== gradoConfigurado ||
      grupoAlumno !== grupoConfigurado
    ) {
      return responderJSONP_(
        parametros.callback,
        {
          exito: false,
          ok: false,
          mensaje:
            alumno.nombreCompleto +
            " no pertenece al grupo activo " +
            gradoConfigurado +
            "° " +
            grupoConfigurado +
            "."
        }
      );
    }

    // --------------------------------------
    // REGISTRAR SEGÚN EL MÓDULO
    // --------------------------------------
    const resultadoRegistro =
      registrarEnModulo_(
        libro,
        modulo,
        alumno,
        alumno.uid || "",
        campoFormativo,
        actividad,
        tipoRegistro,
        "manual"
      );

    SpreadsheetApp.flush();

    const ahora =
      new Date();

    const zonaHoraria =
      Session.getScriptTimeZone();

    const horaRegistro =
      Utilities.formatDate(
        ahora,
        zonaHoraria,
        "HH:mm:ss"
      );

    // --------------------------------------
    // RESPUESTA AL NAVEGADOR
    // --------------------------------------
    return responderJSONP_(
      parametros.callback,
      {
        exito:
          resultadoRegistro.exito,

        ok:
          resultadoRegistro.exito,

        mensaje:
          resultadoRegistro.mensaje,

        metodo:
          "Manual",

        modulo:
          obtenerNombreModulo_(
            modulo
          ),

        nombre:
          alumno.nombreCompleto,

        alumno:
          alumno.nombreCompleto,

        idAlumno:
          alumno.id,

        grado:
          alumno.grado,

        grupo:
          alumno.grupo,

        foto:
          alumno.foto || "",

        hora:
          horaRegistro
      }
    );

  } catch (error) {
    console.error(
      "Error en registrarManualWeb_:",
      error
    );

    return responderJSONP_(
      parametros.callback,
      {
        exito: false,
        ok: false,
        mensaje:
          "Error al registrar manualmente: " +
          (
            error && error.message
              ? error.message
              : "Error desconocido."
          )
      }
    );
  }
}