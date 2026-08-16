// ==========================================
// DASHBOARD DIARIO
// ==========================================

function obtenerDashboardDiario_(parametros) {
  try {
    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const fecha =
      normalizarFechaConsultaHistorial_(
        parametros.fecha ||
        new Date()
      );

    // --------------------------------------
// 1. OBTENER ALUMNOS DEL GRUPO ACTIVO
// --------------------------------------

const respuestaAlumnos =
  obtenerAlumnosGrupoActivo_();

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
        : "No fue posible obtener los alumnos del grupo activo."
  };
}

const activos =
  Array.isArray(
    respuestaAlumnos.alumnos
  )
    ? respuestaAlumnos.alumnos
    : [];


// --------------------------------------
// MAPA DE IDS DEL GRUPO ACTIVO
// --------------------------------------

const idsGrupoActivo = {};

activos.forEach(function(alumno) {
  idsGrupoActivo[
    String(
      alumno.id || ""
    ).trim()
  ] = true;
});

    // --------------------------------------
// 2. LEER REGISTROS DEL DÍA
//    SOLO DEL GRUPO ACTIVO
// --------------------------------------

const asistencias =
  leerRegistrosDashboard_(
    libro,
    NOMBRE_HOJA_ASISTENCIAS,
    fecha
  )
  .filter(function(registro) {
    return !!idsGrupoActivo[
      String(
        registro.idAlumno || ""
      ).trim()
    ];
  });


const participaciones =
  leerRegistrosDashboard_(
    libro,
    NOMBRE_HOJA_PARTICIPACIONES,
    fecha
  )
  .filter(function(registro) {
    return !!idsGrupoActivo[
      String(
        registro.idAlumno || ""
      ).trim()
    ];
  });


const tareas =
  leerRegistrosDashboard_(
    libro,
    NOMBRE_HOJA_TAREAS,
    fecha
  )
  .filter(function(registro) {
    return !!idsGrupoActivo[
      String(
        registro.idAlumno || ""
      ).trim()
    ];
  });
  
    // --------------------------------------
    // 3. PRESENTES
    // --------------------------------------

    const idsPresentes = {};

    asistencias.forEach(function(registro) {
      idsPresentes[
        String(registro.idAlumno)
      ] = true;
    });

    const presentes =
      activos.filter(function(alumno) {
        return !!idsPresentes[
          String(alumno.id)
        ];
      });

    // --------------------------------------
    // 4. FALTANTES
    // --------------------------------------

    const faltantes =
      activos.filter(function(alumno) {
        return !idsPresentes[
          String(alumno.id)
        ];
      });

    // --------------------------------------
// 5. PARTICIPACIÓN PENDIENTE POR CAMPO
// --------------------------------------

// Primero detectamos qué campos formativos
// realmente se trabajaron hoy.
const camposActivosMapa = {};

participaciones.forEach(
  function(registro) {
    const campo =
      String(
        registro.campoFormativo || ""
      ).trim();

    if (!campo) {
      return;
    }

    const claveCampo =
      normalizarEncabezadoHistorial_(
        campo
      );

    if (!claveCampo) {
      return;
    }

    camposActivosMapa[
      claveCampo
    ] = campo;
  }
);

const camposActivos =
  Object.keys(
    camposActivosMapa
  ).map(function(clave) {
    return {
      clave: clave,
      nombre:
        camposActivosMapa[clave]
    };
  });


// Guardamos en qué campos sí participó
// cada alumno.
const participacionPorAlumno = {};

participaciones.forEach(
  function(registro) {
    const idAlumno =
      String(
        registro.idAlumno || ""
      ).trim();

    const campo =
      String(
        registro.campoFormativo || ""
      ).trim();

    if (
      !idAlumno ||
      !campo
    ) {
      return;
    }

    const claveCampo =
      normalizarEncabezadoHistorial_(
        campo
      );

    if (
      !participacionPorAlumno[
        idAlumno
      ]
    ) {
      participacionPorAlumno[
        idAlumno
      ] = {};
    }

    participacionPorAlumno[
      idAlumno
    ][claveCampo] = true;
  }
);


// Solo habrá alumnos pendientes
// si hoy existe al menos un campo trabajado.
const participacionPendiente = [];

if (
  camposActivos.length > 0
) {
  activos.forEach(
    function(alumno) {
      const idAlumno =
        String(
          alumno.id || ""
        ).trim();

      const camposAlumno =
        participacionPorAlumno[
          idAlumno
        ] || {};

      const pendientes =
        camposActivos
          .filter(
            function(campo) {
              return !camposAlumno[
                campo.clave
              ];
            }
          )
          .map(
            function(campo) {
              return campo.nombre;
            }
          );

      if (
        pendientes.length > 0
      ) {
        participacionPendiente.push({
          id: alumno.id,

          nombre:
            alumno.nombreCompleto ||
            alumno.nombre ||
            "",

          grado:
            alumno.grado || "",

          grupo:
            alumno.grupo || "",

          camposPendientes:
            pendientes
        });
      }
    }
  );
}

    // --------------------------------------
    // 6. TAREAS NO CUMPLIDAS
    // --------------------------------------

    const tareasPendientesPorAlumno = {};

    tareas.forEach(function(registro) {
      const resultado =
        normalizarEncabezadoHistorial_(
          registro.resultado
        );

      if (
        resultado === "no entrego" ||
        resultado === "incompleta"
      ) {
        tareasPendientesPorAlumno[
          String(registro.idAlumno)
        ] = registro.resultado;
      }
    });

    const tareasPendientes =
      activos
        .filter(function(alumno) {
          return Object.prototype
            .hasOwnProperty.call(
              tareasPendientesPorAlumno,
              String(alumno.id)
            );
        })
        .map(function(alumno) {
          return {
            id: alumno.id,
            nombre:
              alumno.nombreCompleto ||
              alumno.nombre ||
              "",
            grado: alumno.grado || "",
            grupo: alumno.grupo || "",
            resultado:
              tareasPendientesPorAlumno[
                String(alumno.id)
              ]
          };
        });

    return {
      ok: true,
      exito: true,
      fecha: fecha,

      presentes:
        convertirAlumnosDashboard_(
          presentes
        ),

      faltantes:
        convertirAlumnosDashboard_(
          faltantes
        ),

      participacionPendiente:
  participacionPendiente,

camposActivos:
  camposActivos.map(
    function(campo) {
      return campo.nombre;
    }
  ),

      tareasPendientes:
        tareasPendientes
    };

  } catch (error) {
    console.error(
      "Error en obtenerDashboardDiario_:",
      error
    );

    return {
  ok: false,
  exito: false,
  mensaje:
    "No fue posible obtener el Dashboard diario. Detalle: " +
    (
      error && error.message
        ? error.message
        : String(error)
    ),
  error:
    error && error.message
      ? error.message
      : String(error)
    };
  }
}

// ==========================================
// LEER REGISTROS DE UNA HOJA PARA DASHBOARD
// ==========================================

function leerRegistrosDashboard_(
  libro,
  nombreHoja,
  fechaSolicitada
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
        "fecha"
      ]
    );

  const indiceId =
    buscarIndiceHistorial_(
      encabezados,
      [
        "id alumno",
        "id del alumno",
        "idalumno",
        "id"
      ]
    );

  const indiceResultado =
    buscarIndiceHistorial_(
      encabezados,
      [
        "tipo de tarea",
        "resultado de tarea",
        "tipo de participacion",
        "tipo de participación",
        "resultado",
        "tipo",
        "registro"
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

  if (
    indiceFecha === -1 ||
    indiceId === -1
  ) {
    return [];
  }

  const registros = [];

  for (
    let fila = 1;
    fila < datos.length;
    fila++
  ) {
    const fechaRegistro =
      normalizarFechaConsultaHistorial_(
        datos[fila][indiceFecha]
      );

    if (
      fechaRegistro !==
      fechaSolicitada
    ) {
      continue;
    }

    registros.push({
      idAlumno:
        String(
          datos[fila][indiceId] || ""
        ).trim(),

      resultado:
        indiceResultado !== -1
          ? String(
              datos[fila][
                indiceResultado
              ] || ""
            ).trim()
          : "",

      campoFormativo:
        indiceCampoFormativo !== -1
          ? String(
              datos[fila][
                indiceCampoFormativo
              ] || ""
            ).trim()
          : ""
    });
  }

  return registros;
}

// ==========================================
// FORMATO DE ALUMNOS PARA DASHBOARD
// ==========================================

function convertirAlumnosDashboard_(
  alumnos
) {
  return alumnos.map(
    function(alumno) {
      return {
        id: alumno.id,
        nombre:
          alumno.nombreCompleto ||
          alumno.nombre ||
          "",
        grado:
          alumno.grado || "",
        grupo:
          alumno.grupo || ""
      };
    }
  );
}