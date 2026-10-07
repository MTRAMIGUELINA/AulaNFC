/* AulaNFC - Guardado grupal de asistencia. Pegar en un archivo .gs del proyecto Apps Script.
   Agregar en doGet, DESPUÉS de autorizarSolicitudApi_:
   if (accion === "registrarasistenciagrupal") return registrarAsistenciaGrupalWeb_(parametros);
*/
function registrarAsistenciaGrupalWeb_(parametros) {
  try {
    const ids = JSON.parse(String(parametros.ids || "[]"));
    if (!Array.isArray(ids) || !ids.length || ids.length > 100) {
      throw new Error("Selecciona entre 1 y 100 alumnos.");
    }
    const normalizados = ids.map(x => String(x || "").trim());
    if (normalizados.some(x => !x || x.length > 100)) throw new Error("ID de alumno no válido.");
    if (new Set(normalizados.map(x => x.toUpperCase())).size !== normalizados.length) {
      throw new Error("La selección contiene IDs repetidos.");
    }
    const libro = obtenerBaseDocenteActual_();
    const configuracionRespuesta = obtenerConfiguracion_();
    if (!configuracionRespuesta || configuracionRespuesta.ok !== true) throw new Error("No se pudo consultar la configuración.");
    const conf = configuracionRespuesta.configuracion || {};
    const grado = String(conf.GRADO || "").trim().replace(/[°º]/g, "").replace(/\s+/g, "").toUpperCase();
    const grupo = limpiarGrupo_(conf.GRUPO || "");
    const ciclo = String(conf.CICLO_ESCOLAR || "").trim();
    if (!grado || !grupo || !ciclo) throw new Error("Configura grado, grupo y ciclo escolar.");
    const hojaAlumnos = libro.getSheetByName(NOMBRE_HOJA_ALUMNOS);
    if (!hojaAlumnos) throw new Error("No existe la hoja ALUMNOS.");
    const datos = hojaAlumnos.getLastRow() >= 2
      ? hojaAlumnos.getRange(2, 1, hojaAlumnos.getLastRow() - 1, 10).getDisplayValues() : [];
    const indice = {};
    datos.forEach(f => {
      const id = String(f[0] || "").trim();
      if (id) indice[id.toUpperCase()] = {
        id: id, nombreCompleto: [f[1], f[2], f[3]].filter(Boolean).join(" ").trim(),
        grado: String(f[5] || "").trim().replace(/[°º]/g, "").replace(/\s+/g, "").toUpperCase(),
        grupo: limpiarGrupo_(f[6]), estatus: String(f[8] || "").trim().toUpperCase()
      };
    });
    const ahora = new Date();
    const zona = Session.getScriptTimeZone();
    const hoy = Utilities.formatDate(ahora, zona, "yyyy-MM-dd");
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) throw new Error("El registro está ocupado. Intenta nuevamente.");
    let nuevos = [], yaRegistrados = [], errores = [];
    try {
      const hoja = obtenerOCrearHoja_(libro, NOMBRE_HOJA_ASISTENCIAS,
        ["FECHA","HORA","ID","NOMBRE","ESTADO","OBSERVACIONES","CICLO ESCOLAR"]);
      const ultima = hoja.getLastRow();
      const anteriores = ultima >= 2 ? hoja.getRange(2, 1, ultima - 1, 3).getValues() : [];
      const existentes = new Set(anteriores.filter(f => {
        const fecha = f[0] instanceof Date ? Utilities.formatDate(f[0], zona, "yyyy-MM-dd") : String(f[0] || "").trim();
        return fecha === hoy;
      }).map(f => String(f[2] || "").trim().toUpperCase()));
      const filas = [];
      normalizados.forEach(id => {
        const alumno = indice[id.toUpperCase()];
        if (!alumno || alumno.estatus !== "ACTIVO" || alumno.grado !== grado || alumno.grupo !== grupo) {
          errores.push({id: id, mensaje: "Alumno no encontrado, inactivo o fuera del grupo."});
          return;
        }
        if (existentes.has(alumno.id.toUpperCase())) {
          yaRegistrados.push(alumno.id);
          return;
        }
        existentes.add(alumno.id.toUpperCase());
        nuevos.push(alumno.id);
        filas.push([ahora, ahora, alumno.id, alumno.nombreCompleto, "Presente", "Registro manual", ciclo]);
      });
      if (filas.length) {
        hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, 7).setValues(filas);
        SpreadsheetApp.flush();
        formatearColumnasFechaHora_(hoja);
      }
    } finally {
      lock.releaseLock();
    }
    let aviso = "";
    if (nuevos.length) {
      try { generarListaMaestraAsistencia_(ahora.getMonth() + 1, ahora.getFullYear(), ciclo); }
      catch (error) { aviso = "Las asistencias se guardaron, pero no se actualizó la Lista Maestra: " + error.message; }
    }
    return responderJSONP_(parametros.callback, {
      ok: true, exito: true, nuevos: nuevos, yaRegistrados: yaRegistrados,
      errores: errores, mensaje: aviso || "Pase de lista procesado."
    });
  } catch (error) {
    return responderJSONP_(parametros.callback, {
      ok: false, exito: false, mensaje: "No se pudo procesar el pase de lista: " + error.message
    });
  }
}
