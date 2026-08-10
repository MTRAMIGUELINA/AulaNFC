/* AulaNFC v3.1 - Filtra la selección de alumnos de Incidencias por el grupo activo configurado. */
(() => {
  function instalar() {
    if (window.__incidenciasGrupoActivoInstalado) return true;
    if (typeof window.solicitarJSONP !== 'function') return false;

    const original = window.solicitarJSONP;

    window.solicitarJSONP = function(accion, parametros = {}) {
      const nombreAccion = String(accion || '').trim().toLowerCase();
      const vistaIncidencias = document.getElementById('vistaReporteIncidencias');
      const incidenciasVisible = vistaIncidencias && !vistaIncidencias.classList.contains('oculto');

      if (incidenciasVisible && nombreAccion === 'obteneralumnos') {
        return original('obtenerAlumnosGrupoActivo', parametros);
      }

      return original(accion, parametros);
    };

    window.__incidenciasGrupoActivoInstalado = true;
    return true;
  }

  if (instalar()) return;

  const intervalo = setInterval(() => {
    if (instalar()) clearInterval(intervalo);
  }, 150);

  setTimeout(() => clearInterval(intervalo), 10000);
})();
