// ==========================================
// AULANFC v3.2
// S1-T2-D1 - ACCESO A LA BASE DEL DOCENTE
// ==========================================

/**
 * Devuelve exclusivamente el libro asignado al usuario actual autorizado.
 * Centraliza el acceso para los módulos funcionales de AulaNFC.
 *
 * @return {GoogleAppsScript.Spreadsheet.Spreadsheet}
 */
function obtenerBaseDocenteActual_() {
  return obtenerLibroUsuarioActual_().libro;
}
