// ==========================================
// AULANFC v3
// MÓDULO DE REPORTES
// ==========================================

/**
 * Construye el reporte completo de un alumno.
 *
 * Recibe directamente el ID del alumno.
 *
 * @param {string|number} idAlumno
 * @return {Object}
 */
function obtenerReporteAlumno_(idAlumno) {
  const id = String(
    idAlumno || ""
  ).trim();

  if (!id) {
    return {
      ok: false,
      exito: false,
      mensaje:
        "No se recibió el ID del alumno.",
      alumno: null,
      resumen: {},
      historial: []
    };
  }

  /*
   * 09_Historial.gs recibe un objeto con
   * la propiedad idAlumno.
   */
  const resultadoHistorial =
    obtenerHistorialAlumno_({
      idAlumno: id
    });

  if (
    !resultadoHistorial ||
    resultadoHistorial.exito !== true
  ) {
    return {
      ok: false,
      exito: false,
      mensaje:
        resultadoHistorial &&
        resultadoHistorial.mensaje
          ? resultadoHistorial.mensaje
          : "No fue posible obtener el historial.",
      alumno:
        resultadoHistorial &&
        resultadoHistorial.alumno
          ? resultadoHistorial.alumno
          : null,
      resumen: {},
      historial: []
    };
  }

  const historialOriginal =
    Array.isArray(
      resultadoHistorial.historial
    )
      ? resultadoHistorial.historial
      : [];

  const historialPreparado =
    historialOriginal.map(
      prepararRegistroReporte_
    );

  ordenarHistorialReporte_(
    historialPreparado
  );

  return {
    ok: true,
    exito: true,
    mensaje:
      "Reporte obtenido correctamente.",

    alumno:
      resultadoHistorial.alumno || null,

    /*
     * Se mantiene vacío porque los resúmenes
     * se construirán en 11_Resumenes.gs.
     */
    resumen: {},

    totalRegistros:
      historialPreparado.length,

    historial:
      historialPreparado
  };
}


// ==========================================
// RESPUESTA WEB DEL REPORTE
// ==========================================

/**
 * Atiende la solicitud:
 *
 * ?accion=obtenerReporteAlumno&id=2
 *
 * @param {Object} parametros
 * @return {ContentService.TextOutput}
 */
function obtenerReporteAlumnoWeb_(
  parametros
) {
  const datos =
    parametros || {};

  const idAlumno = String(
    datos.id ||
    datos.idAlumno ||
    ""
  ).trim();

  const respuesta =
    obtenerReporteAlumno_(
      idAlumno
    );

  return responderJSONP_(
    datos.callback || "",
    respuesta
  );
}


// ==========================================
// PREPARAR REGISTRO
// ==========================================

/**
 * Normaliza cada registro para que todos
 * tengan exactamente la misma estructura.
 *
 * @param {Object} registro
 * @return {Object}
 */
function prepararRegistroReporte_(
  registro
) {
  const dato =
    registro || {};

  return {
    modulo: String(
      dato.modulo || ""
    ).trim(),

    fecha: String(
      dato.fecha || ""
    ).trim(),

    hora: String(
      dato.hora || ""
    ).trim(),

    registro: String(
      dato.registro || ""
    ).trim(),

    nombre: String(
      dato.nombre || ""
    ).trim(),

    grado: String(
      dato.grado || ""
    ).trim(),

    grupo: String(
      dato.grupo || ""
    ).trim(),

    uid: String(
      dato.uid || ""
    ).trim()
  };
}


// ==========================================
// ORDENAR HISTORIAL
// ==========================================

/**
 * Ordena el historial del registro más
 * reciente al más antiguo.
 *
 * @param {Object[]} historial
 * @return {Object[]}
 */
function ordenarHistorialReporte_(
  historial
) {
  historial.sort(function(a, b) {
    const fechaA =
      convertirFechaHoraReporte_(
        a.fecha,
        a.hora
      );

    const fechaB =
      convertirFechaHoraReporte_(
        b.fecha,
        b.hora
      );

    return (
      fechaB.getTime() -
      fechaA.getTime()
    );
  });

  return historial;
}


// ==========================================
// CONVERTIR FECHA Y HORA
// ==========================================

/**
 * Convierte los textos:
 *
 * fecha: dd/MM/yyyy
 * hora: HH:mm
 *
 * en un objeto Date.
 *
 * @param {string} fecha
 * @param {string} hora
 * @return {Date}
 */
function convertirFechaHoraReporte_(
  fecha,
  hora
) {
  const partesFecha = String(
    fecha || ""
  )
    .trim()
    .split("/");

  const partesHora = String(
    hora || ""
  )
    .trim()
    .split(":");

  if (partesFecha.length !== 3) {
    return new Date(0);
  }

  const dia =
    Number(partesFecha[0]);

  const mes =
    Number(partesFecha[1]) - 1;

  const anio =
    Number(partesFecha[2]);

  const horas =
    partesHora.length >= 1
      ? Number(partesHora[0]) || 0
      : 0;

  const minutos =
    partesHora.length >= 2
      ? Number(partesHora[1]) || 0
      : 0;

  if (
    !dia ||
    mes < 0 ||
    !anio
  ) {
    return new Date(0);
  }

  return new Date(
    anio,
    mes,
    dia,
    horas,
    minutos,
    0
  );
}
// ==========================================
// CLIENTE HTML: OBTENER REPORTE
// ==========================================

/**
 * Función pública utilizada por google.script.run.
 *
 * @param {string|number} idAlumno
 * @return {Object}
 */
function obtenerReporteAlumnoCliente(
  idAlumno
) {
  return obtenerReporteAlumno_(
    idAlumno
  );
}