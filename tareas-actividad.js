/* AulaNFC - Actividad revisada en Tareas. */
(() => {
  function insertarCampo() {
    if (document.getElementById('actividadTarea')) return true;

    const tipoTarea = document.getElementById('tipoTarea');
    const contenedor = document.getElementById('opcionesTareas');
    if (!tipoTarea || !contenedor) return false;

    const titulo = document.createElement('h2');
    titulo.textContent = 'Actividad revisada';

    const input = document.createElement('input');
    input.id = 'actividadTarea';
    input.type = 'text';
    input.maxLength = 180;
    input.autocomplete = 'off';
    input.placeholder = 'Ej. Problemas de multiplicación';
    input.setAttribute('aria-label', 'Actividad revisada');
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';

    tipoTarea.insertAdjacentElement('beforebegin', input);
    input.insertAdjacentElement('beforebegin', titulo);
    return true;
  }

  function conectarParametros() {
    if (window.__actividadTareaParametros) return true;
    if (typeof window.construirParametrosRegistro !== 'function') return false;

    const original = window.construirParametrosRegistro;
    window.construirParametrosRegistro = function(base) {
      const parametros = original(base);
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'tareas') {
        parametros.actividad = String(document.getElementById('actividadTarea')?.value || '').trim();
      }
      return parametros;
    };

    window.__actividadTareaParametros = true;
    return true;
  }

  function conectarValidacion() {
    if (window.__actividadTareaValidacion) return true;
    if (typeof window.validarModulo !== 'function') return false;

    const original = window.validarModulo;
    window.validarModulo = function() {
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'tareas') {
        const actividad = String(document.getElementById('actividadTarea')?.value || '').trim();
        if (!actividad) {
          const estado = document.getElementById('estado');
          if (estado) estado.textContent = '❌ Escribe la actividad revisada.';
          document.getElementById('actividadTarea')?.focus();
          return false;
        }
      }
      return original();
    };

    window.__actividadTareaValidacion = true;
    return true;
  }

  function iniciar() {
    return insertarCampo() && conectarParametros() && conectarValidacion();
  }

  if (iniciar()) return;
  const observador = new MutationObserver(() => {
    if (iniciar()) observador.disconnect();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true });
})();
