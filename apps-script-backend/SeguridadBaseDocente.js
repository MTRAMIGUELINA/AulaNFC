// ==========================================
// AULANFC v3.4
// S1-T3 - ACCESO A LA BASE DEL USUARIO AUTORIZADO
// ==========================================

/**
 * Devuelve exclusivamente el libro asignado al usuario autorizado.
 * Durante una solicitud del API usa el contexto derivado del token Google.
 * Fuera del API conserva el comportamiento interno existente.
 *
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function obtenerBaseDocenteActual_() {
  const contextoApi = typeof obtenerContextoApiActual_ === "function"
    ? obtenerContextoApiActual_()
    : null;

  if (contextoApi && contextoApi.autorizado && contextoApi.usuario) {
    const idBase = String(contextoApi.usuario.idBase || "").trim();

    if (!idBase) {
      throw new Error("El usuario autorizado no tiene una base asignada.");
    }

    return SpreadsheetApp.openById(idBase);
  }

  return obtenerLibroUsuarioActual_().libro;
}
