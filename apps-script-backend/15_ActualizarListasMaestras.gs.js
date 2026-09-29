// ==========================================
// AULANFC v3
// ACTUALIZACIÓN GENERAL DE LISTAS MAESTRAS
// ==========================================

/**
 * Regenera en una sola operación las listas maestras de Asistencia,
 * Tareas y Participación del ciclo escolar indicado.
 *
 * Asistencia usa el mes y año actuales del huso horario del proyecto.
 * Tareas y Participación usan el ciclo escolar recibido.
 */
function actualizarTodasListasMaestras_(cicloEscolar) {
  const ciclo = String(cicloEscolar || "").trim();
  if (!ciclo) throw new Error("Debes indicar el ciclo escolar.");

  const zona = Session.getScriptTimeZone();
  const ahora = new Date();
  const mes = Number(Utilities.formatDate(ahora, zona, "M"));
  const anio = Number(Utilities.formatDate(ahora, zona, "yyyy"));

  const asistencia = generarListaMaestraAsistencia_(mes, anio, ciclo);
  const tareas = generarListaMaestraTareas_(ciclo);
  const participacion = generarListasMaestrasParticipacion_(ciclo);

  return {
    ok: true,
    exito: true,
    mensaje: "Listas Maestras de Asistencia, Tareas y Participación actualizadas correctamente.",
    asistencia: asistencia,
    tareas: tareas,
    participacion: participacion
  };
}

function actualizarTodasListasMaestrasWeb_(parametros) {
  const callback = parametros && parametros.callback;
  try {
    const ciclo = String(parametros && parametros.cicloEscolar || "").trim();
    if (!ciclo) {
      return responderJSONP_(callback, {
        ok: false,
        exito: false,
        mensaje: "Debes indicar el ciclo escolar."
      });
    }

    return responderJSONP_(callback, actualizarTodasListasMaestras_(ciclo));
  } catch (error) {
    console.error("Error al actualizar todas las listas maestras:", error);
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      mensaje: error && error.message ? error.message : String(error)
    });
  }
}
