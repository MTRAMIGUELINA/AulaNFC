// ==========================================
// AULANFC v2.1
// MOTOR DE ESTADÍSTICAS
// ==========================================

/**
 * Atiende la solicitud web:
 * ?accion=obtenerResumenEstadistico
 *
 * @param {Object} parametros
 * @return {ContentService.TextOutput}
 */
function obtenerResumenEstadisticoWeb_(parametros) {
  try {
    const respuesta =
      obtenerResumenEstadistico_(
        parametros || {}
      );

    return responderJSONP_(
      parametros &&
      parametros.callback
        ? parametros.callback
        : "",
      respuesta
    );

  } catch (error) {
    console.error(
      "Error en obtenerResumenEstadisticoWeb_:",
      error
    );

    return responderJSONP_(
      parametros &&
      parametros.callback
        ? parametros.callback
        : "",
      {
        ok: false,
        exito: false,
        mensaje:
          "No fue posible obtener el resumen estadístico.",
        error:
          error && error.message
            ? error.message
            : String(error)
      }
    );
  }
}


/**
 * Función principal del motor estadístico.
 *
 * @param {Object} parametros
 * @return {Object}
 */
function obtenerResumenEstadistico_(parametros) {
  const idAlumno = String(
    parametros.idAlumno ||
    parametros.id ||
    ""
  ).trim();

  if (!idAlumno) {
    return {
      ok: false,
      exito: false,
      mensaje:
        "Debes seleccionar un alumno."
    };
  }

  const libro =
    SpreadsheetApp.openById(
      ID_HOJA_CALCULO
    );

  const periodo =
    obtenerPeriodoEstadistico_(
      parametros
    );

  return {
    ok: true,
    exito: true,
    mensaje:
      "Motor estadístico preparado.",
    idAlumno: idAlumno,
    periodo: periodo,

    asistencia:
      calcularAsistenciaEstadistica_(
        libro,
        idAlumno,
        periodo
      ),

    tareas:
      calcularTareasEstadisticas_(
        libro,
        idAlumno,
        periodo
      ),

    participaciones:
      calcularParticipacionesEstadisticas_(
        libro,
        idAlumno,
        periodo
      ),

    conducta:
      calcularConductaEstadistica_(
        libro,
        idAlumno,
        periodo
      ),

    lectura:
      calcularLecturaEstadistica_(
        libro,
        idAlumno,
        periodo
      )
  };
}


// ==========================================
// OBTENER PERÍODO ESTADÍSTICO
// ==========================================

function obtenerPeriodoEstadistico_(
  parametros
) {
  const tipo = String(
    parametros.periodo ||
    parametros.tipoPeriodo ||
    "ciclo"
  )
    .trim()
    .toLowerCase();

  // TODO EL CICLO ESCOLAR
  if (tipo === "ciclo") {
    return {
      tipo: "ciclo",
      fechaInicio: "",
      fechaFin: ""
    };
  }

  // SEMANA ACTUAL: LUNES A VIERNES
  if (tipo === "semana") {
    const hoy = new Date();

    hoy.setHours(
      0, 0, 0, 0
    );

    const diaSemana =
      hoy.getDay();

    // Domingo = 0
    // Lunes = 1
    // ...
    // Sábado = 6

    let diferenciaLunes;

    if (diaSemana === 0) {
      diferenciaLunes = -6;
    } else {
      diferenciaLunes =
        1 - diaSemana;
    }

    const lunes =
      new Date(hoy);

    lunes.setDate(
      hoy.getDate() +
      diferenciaLunes
    );

    const viernes =
      new Date(lunes);

    viernes.setDate(
      lunes.getDate() + 4
    );

    return {
      tipo: "semana",

      fechaInicio:
        formatearFechaEstadisticaISO_(
          lunes
        ),

      fechaFin:
        formatearFechaEstadisticaISO_(
          viernes
        )
    };
  }

  // PERÍODO PERSONALIZADO
  if (tipo === "personalizado") {
    return {
      tipo: "personalizado",

      fechaInicio: String(
        parametros.fechaInicio || ""
      ).trim(),

      fechaFin: String(
        parametros.fechaFin || ""
      ).trim()
    };
  }

  // RESPALDO
  return {
    tipo: "ciclo",
    fechaInicio: "",
    fechaFin: ""
  };
}

// ==========================================
// FORMATEAR FECHA YYYY-MM-DD
// ==========================================

function formatearFechaEstadisticaISO_(
  fecha
) {
  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return (
    anio +
    "-" +
    mes +
    "-" +
    dia
  );
}


// ==========================================
// VALIDAR FECHA DENTRO DEL PERÍODO
// ==========================================

function estaDentroDelPeriodoEstadistico_(
  fecha,
  periodo
) {
  if (!fecha) {
    return false;
  }

  const fechaRegistro =
    convertirFechaEstadistica_(
      fecha
    );

  if (!fechaRegistro) {
    return false;
  }

  // Si no hay límites de fecha,
  // se considera todo el ciclo escolar.
  if (
    !periodo ||
    (
      !periodo.fechaInicio &&
      !periodo.fechaFin
    )
  ) {
    return true;
  }

  const fechaInicio =
    periodo.fechaInicio
      ? convertirFechaEstadistica_(
          periodo.fechaInicio
        )
      : null;

  const fechaFin =
    periodo.fechaFin
      ? convertirFechaEstadistica_(
          periodo.fechaFin
        )
      : null;

  // Eliminar horas para comparar
  // únicamente las fechas.
  fechaRegistro.setHours(
    0, 0, 0, 0
  );

  if (fechaInicio) {
    fechaInicio.setHours(
      0, 0, 0, 0
    );

    if (
      fechaRegistro < fechaInicio
    ) {
      return false;
    }
  }

  if (fechaFin) {
    fechaFin.setHours(
      23, 59, 59, 999
    );

    if (
      fechaRegistro > fechaFin
    ) {
      return false;
    }
  }

  return true;
}

// ==========================================
// CONVERTIR FECHA PARA ESTADÍSTICAS
// ==========================================

function convertirFechaEstadistica_(
  valor
) {
  if (!valor) {
    return null;
  }

  // Fecha real proveniente de Sheets
  if (
    Object.prototype.toString.call(
      valor
    ) === "[object Date]" &&
    !isNaN(valor.getTime())
  ) {
    return new Date(
      valor.getFullYear(),
      valor.getMonth(),
      valor.getDate()
    );
  }

  const texto =
    String(valor).trim();

  if (!texto) {
    return null;
  }

  // Formato YYYY-MM-DD
  let coincidencia =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/
    );

  if (coincidencia) {
    return new Date(
      Number(coincidencia[1]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[3])
    );
  }

  // Formato DD/MM/YYYY
  coincidencia =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

  if (coincidencia) {
    return new Date(
      Number(coincidencia[3]),
      Number(coincidencia[2]) - 1,
      Number(coincidencia[1])
    );
  }

  return null;
}


// ==========================================
// ASISTENCIA
// ==========================================

function calcularAsistenciaEstadistica_(
  libro,
  idAlumno,
  periodo
) {
  // ----------------------------------------
  // 1. OBTENER DÍAS ESCOLARES DEL PERÍODO
  // ----------------------------------------
  const diasEscolares =
    calcularDiasEscolares_(
      libro,
      periodo
    );

  // ----------------------------------------
  // 2. LEER ASISTENCIAS DEL ALUMNO
  // ----------------------------------------
  const registros =
    leerRegistrosModulo_(
      libro,
      NOMBRE_HOJA_ASISTENCIAS,
      idAlumno,
      periodo
    );

  // ----------------------------------------
  // 3. OBTENER FECHAS ÚNICAS DE ASISTENCIA
  // ----------------------------------------
  const fechasPresentes = {};

  registros.forEach(function(item) {
    const fecha =
      convertirFechaEstadistica_(
        item.fecha
      );

    if (!fecha) {
      return;
    }

    const clave =
      formatearFechaEstadisticaISO_(
        fecha
      );

    fechasPresentes[clave] = true;
  });

  // Cada fecha cuenta solamente una vez.
  const presentes =
    Object.keys(
      fechasPresentes
    ).length;

  // ----------------------------------------
  // 4. CALCULAR FALTAS
  // ----------------------------------------
  const faltas =
    Math.max(
      diasEscolares - presentes,
      0
    );

  // ----------------------------------------
  // 5. PORCENTAJE DE ASISTENCIA
  // ----------------------------------------
  const porcentajeAsistencia =
    diasEscolares > 0
      ? Math.round(
          (
            presentes /
            diasEscolares
          ) * 100
        )
      : 0;

  return {
    presentes: presentes,
    faltas: faltas,
    diasEscolares:
      diasEscolares,
    porcentajeAsistencia:
      porcentajeAsistencia
  };
}


// ==========================================
// TAREAS
// ==========================================

function calcularTareasEstadisticas_(
  libro,
  idAlumno,
  periodo
) {
  const registros =
    leerRegistrosModulo_(
      libro,
      NOMBRE_HOJA_TAREAS,
      idAlumno,
      periodo
    );

  let entregadas = 0;
  let noEntregadas = 0;
  let incompletas = 0;

  registros.forEach(function(item) {
    const valor =
      normalizarEncabezadoHistorial_(
        item.registro
      );

    if (
      valor === "entrego" ||
      valor === "entregada" ||
      valor === "entregado"
    ) {
      entregadas++;

    } else if (
      valor === "no entrego" ||
      valor === "no entregada" ||
      valor === "no entregado"
    ) {
      noEntregadas++;

    } else if (
      valor === "incompleta" ||
      valor === "incompleto"
    ) {
      incompletas++;
    }
  });

  const total =
    entregadas +
    noEntregadas +
    incompletas;

  const porcentajeCumplimiento =
    total > 0
      ? Math.round(
          (entregadas / total) * 100
        )
      : 0;

  return {
    entregadas: entregadas,
    noEntregadas: noEntregadas,
    incompletas: incompletas,
    total: total,
    porcentajeCumplimiento:
      porcentajeCumplimiento
  };
}

// ==========================================
// PARTICIPACIONES
// ==========================================

function calcularParticipacionesEstadisticas_(
  libro,
  idAlumno,
  periodo
) {
  const registros =
    leerRegistrosModulo_(
      libro,
      NOMBRE_HOJA_PARTICIPACIONES,
      idAlumno,
      periodo
    );

  // ----------------------------------------
  // CONTEO POR CAMPO FORMATIVO
  // ----------------------------------------
  let lenguajes = 0;
  let saberes = 0;
  let etica = 0;
  let comunitario = 0;

  // ----------------------------------------
  // CONTEO POR TIPO DE PARTICIPACIÓN
  // ----------------------------------------
  let participo = 0;
  let excelenteParticipacion = 0;
  let apoyoAlEquipo = 0;

  registros.forEach(function(item) {
    const campo =
      normalizarEncabezadoHistorial_(
        item.campoFormativo
      );

    const tipo =
      normalizarEncabezadoHistorial_(
        item.registro
      );

    // --------------------------------------
    // CLASIFICAR CAMPO FORMATIVO
    // --------------------------------------
    if (campo === "lenguajes") {
      lenguajes++;

    } else if (
      campo ===
      "saberes y pensamiento cientifico"
    ) {
      saberes++;

    } else if (
      campo ===
      "etica naturaleza y sociedad"
    ) {
      etica++;

    } else if (
      campo ===
      "de lo humano a lo comunitario"
    ) {
      comunitario++;
    }

    // --------------------------------------
    // CLASIFICAR TIPO DE PARTICIPACIÓN
    // --------------------------------------
    if (tipo === "participo") {
      participo++;

    } else if (
      tipo ===
      "excelente participacion"
    ) {
      excelenteParticipacion++;

    } else if (
      tipo ===
      "apoyo al equipo"
    ) {
      apoyoAlEquipo++;
    }
  });

  const total =
    participo +
    excelenteParticipacion +
    apoyoAlEquipo;

  // ----------------------------------------
  // CAMPO FORMATIVO MÁS FRECUENTE
  // --------------------------------------
  const campos = [
    {
      nombre: "Lenguajes",
      total: lenguajes
    },
    {
      nombre:
        "Saberes y Pensamiento Científico",
      total: saberes
    },
    {
      nombre:
        "Ética, Naturaleza y Sociedad",
      total: etica
    },
    {
      nombre:
        "De lo Humano a lo Comunitario",
      total: comunitario
    }
  ];

  campos.sort(function(a, b) {
    return b.total - a.total;
  });

  const campoPredominante =
    campos.length > 0 &&
    campos[0].total > 0
      ? campos[0].nombre
      : "";

  // ----------------------------------------
  // TIPO DE PARTICIPACIÓN MÁS FRECUENTE
  // ----------------------------------------
  const tipos = [
    {
      nombre: "Participó",
      total: participo
    },
    {
      nombre:
        "Excelente participación",
      total:
        excelenteParticipacion
    },
    {
      nombre: "Apoyo al equipo",
      total: apoyoAlEquipo
    }
  ];

  tipos.sort(function(a, b) {
    return b.total - a.total;
  });

  const tipoPredominante =
    tipos.length > 0 &&
    tipos[0].total > 0
      ? tipos[0].nombre
      : "";

  return {
    // Por campo formativo
    lenguajes: lenguajes,
    saberes: saberes,
    etica: etica,
    comunitario: comunitario,

    // Por tipo
    participo: participo,
    excelenteParticipacion:
      excelenteParticipacion,
    apoyoAlEquipo: apoyoAlEquipo,

    // Totales y síntesis
    total: total,
    campoPredominante:
      campoPredominante,
    tipoPredominante:
      tipoPredominante
  };
}

// ==========================================
// CONDUCTA
// ==========================================

function calcularConductaEstadistica_(
  libro,
  idAlumno,
  periodo
) {
  const registros =
    leerRegistrosModulo_(
      libro,
      NOMBRE_HOJA_CONDUCTA,
      idAlumno,
      periodo
    );

  let buenasConductas = 0;
  let llamadasAtencion = 0;
  let tarjetasAmarillas = 0;
  let tarjetasRojas = 0;

  registros.forEach(function(item) {
    const valor =
      normalizarEncabezadoHistorial_(
        item.registro
      );

    if (valor === "buena conducta") {
      buenasConductas++;

    } else if (
      valor === "llamada de atencion"
    ) {
      llamadasAtencion++;

    } else if (
      valor === "tarjeta amarilla"
    ) {
      tarjetasAmarillas++;

    } else if (
      valor === "tarjeta roja"
    ) {
      tarjetasRojas++;
    }
  });

  const total =
    buenasConductas +
    llamadasAtencion +
    tarjetasAmarillas +
    tarjetasRojas;

  let resumen = "";

  if (total > 0) {
    const incidencias =
      llamadasAtencion +
      tarjetasAmarillas +
      tarjetasRojas;

    if (buenasConductas > incidencias) {
      resumen =
        "Predominan las buenas conductas.";

    } else if (tarjetasRojas > 0) {
      resumen =
        "Requiere seguimiento en conducta.";

    } else if (
      tarjetasAmarillas > 0 ||
      llamadasAtencion > buenasConductas
    ) {
      resumen =
        "Presenta incidencias que requieren seguimiento.";

    } else {
      resumen =
        "Conducta equilibrada.";
    }
  }

  return {
    buenasConductas: buenasConductas,
    llamadasAtencion: llamadasAtencion,
    tarjetasAmarillas: tarjetasAmarillas,
    tarjetasRojas: tarjetasRojas,
    total: total,
    resumen: resumen
  };
}

// ==========================================
// LECTURA
// ==========================================

function calcularLecturaEstadistica_(
  libro,
  idAlumno,
  periodo
) {
  const registros =
    leerRegistrosModulo_(
      libro,
      NOMBRE_HOJA_LECTURA,
      idAlumno,
      periodo
    );

  let requiereApoyo = 0;
  let seAcercaEstandar = 0;
  let estandar = 0;
  let avanzado = 0;

  registros.forEach(function(item) {
    const valor =
      normalizarEncabezadoHistorial_(
        item.registro
      );

    if (
      valor === "requiere apoyo"
    ) {
      requiereApoyo++;

    } else if (
      valor === "se acerca al estandar"
    ) {
      seAcercaEstandar++;

    } else if (
      valor === "estandar"
    ) {
      estandar++;

    } else if (
      valor === "avanzado"
    ) {
      avanzado++;
    }
  });

  const total =
    requiereApoyo +
    seAcercaEstandar +
    estandar +
    avanzado;

  // ----------------------------------------
  // NIVEL PREDOMINANTE
  // ----------------------------------------

  const niveles = [
    {
      nombre: "Requiere apoyo",
      total: requiereApoyo
    },
    {
      nombre: "Se acerca al estándar",
      total: seAcercaEstandar
    },
    {
      nombre: "Estándar",
      total: estandar
    },
    {
      nombre: "Avanzado",
      total: avanzado
    }
  ];

  niveles.sort(function(a, b) {
    return b.total - a.total;
  });

  const nivelPredominante =
    niveles.length > 0 &&
    niveles[0].total > 0
      ? niveles[0].nombre
      : "";

  return {
    requiereApoyo: requiereApoyo,
    seAcercaEstandar: seAcercaEstandar,
    estandar: estandar,
    avanzado: avanzado,
    total: total,
    nivelPredominante:
      nivelPredominante
  };
}

// ==========================================
// CALCULAR DÍAS ESCOLARES
// ==========================================

function calcularDiasEscolares_(
  libro,
  periodo
) {
  const hoja =
    libro.getSheetByName(
      "CALENDARIO_ESCOLAR"
    );

  if (!hoja) {
    return 0;
  }

  const datos =
    hoja.getDataRange().getValues();

  if (datos.length < 2) {
    return 0;
  }

  const encabezados =
    datos[0].map(function(valor) {
      return normalizarEncabezadoHistorial_(
        valor
      );
    });

  const indiceFecha =
    buscarIndiceHistorial_(
      encabezados,
      [
        "fecha"
      ]
    );

  const indiceDiaEscolar =
    buscarIndiceHistorial_(
      encabezados,
      [
        "dia escolar",
        "día escolar"
      ]
    );
  
  // --------------------------------------
// CICLO ESCOLAR
// --------------------------------------

const indiceCicloEscolar =
  buscarIndiceHistorial_(
    encabezados,
    [
      "ciclo escolar",
      "ciclo"
    ]
  );

const cicloEscolarActivo =
  obtenerCicloEscolarHistorial_();

  if (
  indiceFecha === -1 ||
  indiceDiaEscolar === -1 ||
  indiceCicloEscolar === -1
) {
  return 0;
}

if (!cicloEscolarActivo) {
  return 0;
}

  let total = 0;

  for (
    let fila = 1;
    fila < datos.length;
    fila++
  ) {
    const fecha =
      datos[fila][indiceFecha];

    const esDiaEscolar =
      normalizarEncabezadoHistorial_(
        datos[fila][indiceDiaEscolar]
      );
      
    const cicloRegistro =
  String(
    datos[fila][
      indiceCicloEscolar
    ] || ""
  ).trim();

if (
  !cicloRegistro ||
  cicloRegistro !== cicloEscolarActivo
) {
  continue;
}

    if (
      esDiaEscolar !== "si"
    ) {
      continue;
    }

    if (
      !estaDentroDelPeriodoEstadistico_(
        fecha,
        periodo
      )
    ) {
      continue;
    }

    total++;
  }

  return total;
}

// ==========================================
// LEER REGISTROS DE UN MÓDULO
// ==========================================

function leerRegistrosModulo_(
  libro,
  nombreHoja,
  idAlumno,
  periodo
) {

  const hoja =
    libro.getSheetByName(
      nombreHoja
    );

  if (!hoja) {
    return [];
  }

  const datos =
    hoja.getDataRange().getValues();

  if (datos.length < 2) {
    return [];
  }

  const encabezados =
    datos[0].map(function(valor) {
      return normalizarEncabezadoHistorial_(
        valor
      );
    });

  const indiceFecha =
    buscarIndiceHistorial_(
      encabezados,
      [
        "fecha",
        "fecha de registro",
        "dia"
      ]
    );

  const indiceIdAlumno =
    buscarIndiceHistorial_(
      encabezados,
      [
        "id alumno",
        "id del alumno",
        "idalumno",
        "id"
      ]
    );

  const indiceRegistro =
    buscarIndiceHistorial_(
      encabezados,
      [
        "tipo de participacion",
        "tipo de participación",
        "tipo de tarea",
        "resultado de tarea",
        "tipo de conducta",
        "tipo de lectura",
        "resultado de lectura",
        "registro",
        "resultado",
        "detalle",
        "observacion",
        "observación",
        "estado"
      ]
    );

  const indiceCampo =
    buscarIndiceHistorial_(
      encabezados,
      [
        "campo formativo",
        "campoformativo"
      ]
    );

    // --------------------------------------
// CICLO ESCOLAR
// --------------------------------------

const indiceCicloEscolar =
  buscarIndiceHistorial_(
    encabezados,
    [
      "ciclo escolar",
      "ciclo"
    ]
  );

const cicloEscolarActivo =
  obtenerCicloEscolarHistorial_();

  const registros = [];

  for (
    let fila = 1;
    fila < datos.length;
    fila++
  ) {

    const registro =
      datos[fila];

    const id =
      indiceIdAlumno !== -1
        ? String(
            registro[
              indiceIdAlumno
            ] || ""
          ).trim()
        : "";

    if (
      id !==
      String(idAlumno).trim()
    ) {
      continue;
    }

    // --------------------------------------
// FILTRAR POR CICLO ESCOLAR ACTIVO
// --------------------------------------

if (cicloEscolarActivo) {

  if (indiceCicloEscolar === -1) {
    continue;
  }

  const cicloRegistro =
    String(
      registro[
        indiceCicloEscolar
      ] || ""
    ).trim();

  if (
    !cicloRegistro ||
    cicloRegistro !== cicloEscolarActivo
  ) {
    continue;
  }
}

    const fecha =
      indiceFecha !== -1
        ? registro[indiceFecha]
        : "";

    if (
      !estaDentroDelPeriodoEstadistico_(
        fecha,
        periodo
      )
    ) {
      continue;
    }

    registros.push({

      fecha: fecha,

      registro:
        indiceRegistro !== -1
          ? String(
              registro[
                indiceRegistro
              ] || ""
            ).trim()
          : "",

      campoFormativo:
        indiceCampo !== -1
          ? String(
              registro[
                indiceCampo
              ] || ""
            ).trim()
          : ""

    });

  }

  return registros;

}