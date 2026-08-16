// ==========================================
// OBTENER HISTORIAL DEL ALUMNO
// ==========================================

function obtenerHistorialAlumno_(parametros) {

  const libro = SpreadsheetApp.openById(ID_HOJA_CALCULO);

  const idAlumno = String(
  parametros.id ||
  parametros.idAlumno ||
  ""
).trim();

  if (!idAlumno) {
    return {
      exito: false,
      mensaje: "No se recibió el ID del alumno."
    };
  }

  const alumno = buscarAlumnoPorID_(libro, idAlumno);

  if (!alumno) {
    return {
      exito: false,
      mensaje: "Alumno no encontrado."
    };
  }

  const historial = []

  .concat(
    leerHistorialHoja_(
      libro,
      NOMBRE_HOJA_ASISTENCIAS,
      "Asistencia",
      idAlumno
    )
  )

  .concat(
    leerHistorialHoja_(
      libro,
      NOMBRE_HOJA_TAREAS,
      "Tareas",
      idAlumno
    )
  )

  .concat(
    leerHistorialHoja_(
      libro,
      NOMBRE_HOJA_PARTICIPACIONES,
      "Participación",
      idAlumno
    )
  )

  .concat(
    leerHistorialHoja_(
      libro,
      NOMBRE_HOJA_CONDUCTA,
      "Conducta",
      idAlumno
    )
  )

  .concat(
    leerHistorialHoja_(
      libro,
      NOMBRE_HOJA_LECTURA,
      "Lectura",
      idAlumno
    )
  );

  

return {
  exito: true,
  alumno: alumno,
  resumen: {},
  historial: historial
};
}

// ==========================================
// OBTENER CICLO ESCOLAR ACTIVO PARA HISTORIAL
// ==========================================

function obtenerCicloEscolarHistorial_() {

  try {

    const respuesta =
      obtenerConfiguracion_();

    if (
      respuesta &&
      respuesta.ok === true
    ) {

      return String(
        respuesta.configuracion
          ?.CICLO_ESCOLAR || ""
      ).trim();
    }

  } catch (error) {

    console.error(
      "No fue posible obtener el ciclo escolar para historial:",
      error
    );
  }

  return "";
}

// ==========================================
// LEER HISTORIAL DE UNA HOJA
// ==========================================

function leerHistorialHoja_(
  libro,
  nombreHoja,
  nombreModulo,
  idAlumno
) {
  const hoja = libro.getSheetByName(nombreHoja);

  if (!hoja) {
    return [];
  }

  const datos = hoja.getDataRange().getValues();

  if (datos.length < 2) {
    return [];
  }

  const encabezados = datos[0].map(function(valor) {
    return normalizarEncabezadoHistorial_(valor);
  });

  const indiceFecha =
    encabezados.indexOf("fecha");

  const indiceHora =
    encabezados.indexOf("hora");

  const indiceIdAlumno =
    encabezados.indexOf("id alumno");

  const indiceNombre =
    encabezados.indexOf("nombre");

  const indiceGrado =
    encabezados.indexOf("grado");

  const indiceGrupo =
    encabezados.indexOf("grupo");

  const indiceUID =
    encabezados.indexOf("uid");

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

  const indiceRegistro =
  buscarIndiceHistorial_(
    encabezados,
    [
      "tipo de participacion",
      "tipo",
      "estado",
      "registro",
      "resultado",
      "observacion",
      "palabras por minuto"
    ]
  );

  if (indiceIdAlumno === -1) {
    return [];
  }

  const historial = [];

  for (let fila = 1; fila < datos.length; fila++) {
    const registroFila = datos[fila];

    const idRegistro = String(
      registroFila[indiceIdAlumno] || ""
    ).trim();

    if (idRegistro !== String(idAlumno).trim()) {
      continue;
    }



// --------------------------------------
// FILTRAR POR CICLO ESCOLAR ACTIVO
// --------------------------------------

if (
  cicloEscolarActivo &&
  indiceCicloEscolar !== -1
) {

  const cicloRegistro =
    String(
      registroFila[
        indiceCicloEscolar
      ] || ""
    ).trim();

  if (
    cicloRegistro !==
    cicloEscolarActivo
  ) {
    continue;
  }
}

    historial.push({
      modulo: nombreModulo,

      fecha:
        indiceFecha !== -1
          ? formatearFechaHistorial_(
              registroFila[indiceFecha]
            )
          : "",

      hora:
        indiceHora !== -1
          ? formatearHoraHistorial_(
              registroFila[indiceHora]
            )
          : "",

      registro:
        indiceRegistro !== -1
          ? String(
              registroFila[indiceRegistro] || ""
            ).trim()
          : "",

      nombre:
        indiceNombre !== -1
          ? String(
              registroFila[indiceNombre] || ""
            ).trim()
          : "",

      grado:
        indiceGrado !== -1
          ? String(
              registroFila[indiceGrado] || ""
            ).trim()
          : "",

      grupo:
        indiceGrupo !== -1
          ? String(
              registroFila[indiceGrupo] || ""
            ).trim()
          : "",

      uid:
        indiceUID !== -1
          ? String(
              registroFila[indiceUID] || ""
            ).trim()
          : ""
    });
  }

  return historial;
}

function normalizarEncabezadoHistorial_(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}


function buscarIndiceHistorial_(
  encabezados,
  opciones
) {
  for (let i = 0; i < opciones.length; i++) {
    const buscado =
      normalizarEncabezadoHistorial_(
        opciones[i]
      );

    const indice =
      encabezados.indexOf(buscado);

    if (indice !== -1) {
      return indice;
    }
  }

  return -1;
}


function formatearFechaHistorial_(valor) {
  if (!valor) {
    return "";
  }

  if (valor instanceof Date) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
    );
  }

  return String(valor).trim();
}


function formatearHoraHistorial_(valor) {
  if (!valor) {
    return "";
  }

  if (valor instanceof Date) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "HH:mm"
    );
  }

  return String(valor).trim();
}

// ==========================================
// OBTENER HISTORIAL GENERAL
// ==========================================

function obtenerHistorialGeneral_(parametros) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const idAlumno = String(
      parametros.id ||
      parametros.idAlumno ||
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

    const fechaSolicitada =
      normalizarFechaConsultaHistorial_(
        parametros.fecha || ""
      );

    let registros = [];

    registros = registros.concat(
      leerHistorialGeneralHoja_(
        libro,
        NOMBRE_HOJA_ASISTENCIAS,
        "Asistencia",
        fechaSolicitada,
        idAlumno
      )
    );

    registros = registros.concat(
      leerHistorialGeneralHoja_(
        libro,
        NOMBRE_HOJA_TAREAS,
        "Tareas",
        fechaSolicitada,
        idAlumno
      )
    );

    registros = registros.concat(
      leerHistorialGeneralHoja_(
        libro,
        NOMBRE_HOJA_PARTICIPACIONES,
        "Participación",
        fechaSolicitada,
        idAlumno
      )
    );

    registros = registros.concat(
      leerHistorialGeneralHoja_(
        libro,
        NOMBRE_HOJA_CONDUCTA,
        "Conducta",
        fechaSolicitada,
        idAlumno
      )
    );

    registros = registros.concat(
      leerHistorialGeneralHoja_(
        libro,
        NOMBRE_HOJA_LECTURA,
        "Lectura",
        fechaSolicitada,
        idAlumno
      )
    );

    registros.sort(function(a, b) {
      const valorA =
        convertirFechaHoraHistorial_(
          a.fecha,
          a.hora
        );

      const valorB =
        convertirFechaHoraHistorial_(
          b.fecha,
          b.hora
        );

      return valorB - valorA;
    });

    const resumen = {
      asistencias: 0,
      tareas: 0,
      participaciones: 0,
      conductas: 0,
      lecturas: 0,
      total: registros.length
    };

    registros.forEach(function(registro) {
      const modulo =
        normalizarEncabezadoHistorial_(
          registro.modulo
        );

      if (modulo.indexOf("asistencia") !== -1) {
        resumen.asistencias++;

      } else if (
        modulo.indexOf("tarea") !== -1
      ) {
        resumen.tareas++;

      } else if (
        modulo.indexOf("participacion") !== -1
      ) {
        resumen.participaciones++;

      } else if (
        modulo.indexOf("conducta") !== -1
      ) {
        resumen.conductas++;

      } else if (
        modulo.indexOf("lectura") !== -1
      ) {
        resumen.lecturas++;
      }
    });

    return {
      ok: true,
      exito: true,
      fecha:
        fechaSolicitada || "",
      resumen: resumen,
      registros: registros,
      historial: registros
    };

  } catch (error) {
    console.error(
      "Error en obtenerHistorialGeneral_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener el historial.",
      error:
        error && error.message
          ? error.message
          : String(error)
    };
  }
}


// ==========================================
// LEER HISTORIAL GENERAL DE UNA HOJA
// ==========================================

function leerHistorialGeneralHoja_(
  libro,
  nombreHoja,
  nombreModulo,
  fechaSolicitada,
  idAlumno
) {
  const hoja =
    libro.getSheetByName(nombreHoja);

  if (!hoja) {
    console.warn(
      "No existe la hoja: " +
      nombreHoja
    );

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

  const indiceHora =
    buscarIndiceHistorial_(
      encabezados,
      [
        "hora",
        "hora de registro"
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

  const indiceNombre =
    buscarIndiceHistorial_(
      encabezados,
      [
        "nombre",
        "nombre completo",
        "alumno"
      ]
    );

  const indiceGrado =
    buscarIndiceHistorial_(
      encabezados,
      [
        "grado"
      ]
    );

  const indiceGrupo =
    buscarIndiceHistorial_(
      encabezados,
      [
        "grupo"
      ]
    );

  const indiceUID =
    buscarIndiceHistorial_(
      encabezados,
      [
        "uid",
        "uid nfc"
      ]
    );

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

  const indiceRegistro =
    buscarIndiceHistorial_(
      encabezados,
      [
        "tipo de participacion",
        "tipo de participación",
        "tipo de tarea",
        "resultado de tarea",
        "tipo de conducta",
        "resultado de lectura",
        "tipo de lectura",
        "palabras por minuto",
        "estado",
        "tipo",
        "registro",
        "resultado",
        "observacion",
        "observación",
        "detalle"
      ]
    );

  const indiceCampoFormativo =
    buscarIndiceHistorial_(
      encabezados,
      [
        "campo formativo",
        "campoformativo"
      ]
    );

  const indiceActividad =
  buscarIndiceHistorial_(
    encabezados,
    [
      "actividad",
      "actividad realizada",
      "actividad revisada"
    ]
  );

  const registros = [];

  for (
    let fila = 1;
    fila < datos.length;
    fila++
  ) {
    const registroFila =
      datos[fila];

        const idRegistro =
    indiceIdAlumno !== -1
      ? String(
          registroFila[indiceIdAlumno] || ""
        ).trim()
      : "";

  if (
    idRegistro !==
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
      registroFila[
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

    const fechaOriginal =
      indiceFecha !== -1
        ? registroFila[indiceFecha]
        : "";

    const fechaRegistro =
      normalizarFechaConsultaHistorial_(
        fechaOriginal
      );

    if (
      fechaSolicitada &&
      fechaRegistro !== fechaSolicitada
    ) {
      continue;
    }

    let detalle =
      indiceRegistro !== -1
        ? String(
            registroFila[indiceRegistro] ||
            ""
          ).trim()
        : "";

    const campoFormativo =
      indiceCampoFormativo !== -1
        ? String(
            registroFila[
              indiceCampoFormativo
            ] || ""
          ).trim()
        : "";
    
    const actividad =
  indiceActividad !== -1
    ? String(
        registroFila[
          indiceActividad
        ] || ""
      ).trim()
    : "";

    const partesDetalle = [];

if (campoFormativo) {
  partesDetalle.push(
    campoFormativo
  );
}

if (actividad) {
  partesDetalle.push(
    actividad
  );
}

if (detalle) {
  partesDetalle.push(
    detalle
  );
}

detalle =
  partesDetalle.join(
    " · "
  );

    registros.push({
      modulo: nombreModulo,

      fecha:
        formatearFechaHistorial_(
          fechaOriginal
        ),

      hora:
        indiceHora !== -1
          ? formatearHoraHistorial_(
              registroFila[indiceHora]
            )
          : "",

      registro: detalle,
      detalle: detalle,
      actividad: actividad,
campoFormativo: campoFormativo,

      idAlumno:
        indiceIdAlumno !== -1
          ? String(
              registroFila[
                indiceIdAlumno
              ] || ""
            ).trim()
          : "",

      nombre:
        indiceNombre !== -1
          ? String(
              registroFila[
                indiceNombre
              ] || ""
            ).trim()
          : "",

      grado:
        indiceGrado !== -1
          ? String(
              registroFila[
                indiceGrado
              ] || ""
            ).trim()
          : "",

      grupo:
        indiceGrupo !== -1
          ? String(
              registroFila[
                indiceGrupo
              ] || ""
            ).trim()
          : "",

      uid:
        indiceUID !== -1
          ? String(
              registroFila[
                indiceUID
              ] || ""
            ).trim()
          : ""
    });
  }

  return registros;
}


// ==========================================
// NORMALIZAR FECHA PARA COMPARACIÓN
// ==========================================

function normalizarFechaConsultaHistorial_(
  valor
) {
  if (!valor) {
    return "";
  }

  if (valor instanceof Date) {
    return Utilities.formatDate(
      valor,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  const texto =
    String(valor).trim();

  // Formato yyyy-MM-dd
  let coincidencia =
    texto.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (coincidencia) {
    return (
      coincidencia[1] +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[2]
      ) +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[3]
      )
    );
  }

  // Formato dd/MM/yyyy
  coincidencia =
    texto.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

  if (coincidencia) {
    return (
      coincidencia[3] +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[2]
      ) +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[1]
      )
    );
  }

  // Formato dd-MM-yyyy
  coincidencia =
    texto.match(
      /^(\d{1,2})-(\d{1,2})-(\d{4})/
    );

  if (coincidencia) {
    return (
      coincidencia[3] +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[2]
      ) +
      "-" +
      rellenarNumeroHistorial_(
        coincidencia[1]
      )
    );
  }

  const fechaConvertida =
    new Date(texto);

  if (
    !isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return Utilities.formatDate(
      fechaConvertida,
      Session.getScriptTimeZone(),
      "yyyy-MM-dd"
    );
  }

  return "";
}


function rellenarNumeroHistorial_(valor) {
  return String(valor).padStart(2, "0");
}


// ==========================================
// CONVERTIR FECHA Y HORA PARA ORDENAR
// ==========================================

function convertirFechaHoraHistorial_(
  fecha,
  hora
) {
  const fechaNormalizada =
    normalizarFechaConsultaHistorial_(
      fecha
    );

  if (!fechaNormalizada) {
    return 0;
  }

  const partesHora =
    String(hora || "00:00")
      .match(/(\d{1,2}):(\d{2})/);

  const horaNumero =
    partesHora
      ? Number(partesHora[1])
      : 0;

  const minutoNumero =
    partesHora
      ? Number(partesHora[2])
      : 0;

  const partesFecha =
    fechaNormalizada.split("-");

  return new Date(
    Number(partesFecha[0]),
    Number(partesFecha[1]) - 1,
    Number(partesFecha[2]),
    horaNumero,
    minutoNumero
  ).getTime();
}