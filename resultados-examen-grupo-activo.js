/* AulaNFC v3.1 - Resultados de examen: alumnos del grupo activo. */
(() => {
  if (window.__aulaNfcResultadosGrupoActivo) return;
  window.__aulaNfcResultadosGrupoActivo = true;

  const esperar = () => {
    if (typeof window.solicitarJSONP !== 'function') {
      setTimeout(esperar, 100);
      return;
    }

    if (window.__solicitarJSONPBaseResultados) return;

    const solicitarBase = window.solicitarJSONP;
    window.__solicitarJSONPBaseResultados = solicitarBase;

    window.solicitarJSONP = function(accion, parametros = {}) {
      const vista = document.getElementById('vistaResultadosExamen');
      const resultadosVisible = vista && !vista.classList.contains('oculto');

      if (
        resultadosVisible &&
        String(accion || '').toLowerCase() === 'obteneralumnos'
      ) {
        return solicitarBase('obtenerAlumnosGrupoActivo', parametros);
      }

      return solicitarBase(accion, parametros);
    };
  };

  esperar();
})();
