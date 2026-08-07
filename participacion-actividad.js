/* AulaNFC - Actividad realizada en Participación. */
(() => {
  function insertarCampo() {
    if (document.getElementById('actividadParticipacion')) return true;

    const campo = document.getElementById('campoFormativo');
    const contenedor = document.getElementById('opcionesParticipacion');
    if (!campo || !contenedor) return false;

    const titulo = document.createElement('h2');
    titulo.textContent = 'Actividad realizada';

    const input = document.createElement('input');
    input.id = 'actividadParticipacion';
    input.type = 'text';
    input.maxLength = 180;
    input.autocomplete = 'off';
    input.placeholder = 'Ej. Preguntas sobre el cuerpo humano';
    input.setAttribute('aria-label', 'Actividad realizada');
    input.style.width = '100%';
    input.style.boxSizing = 'border-box';

    campo.insertAdjacentElement('afterend', input);
    input.insertAdjacentElement('beforebegin', titulo);
    return true;
  }

  function conectarParametros() {
    if (window.__actividadParticipacionParametros) return true;
    if (typeof window.construirParametrosRegistro !== 'function') return false;

    const original = window.construirParametrosRegistro;

    window.construirParametrosRegistro = function(base) {
      const parametros = original(base);

      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'participacion') {
        parametros.actividad = String(
          document.getElementById('actividadParticipacion')?.value || ''
        ).trim();
      } else {
        parametros.actividad = '';
      }

      return parametros;
    };

    window.__actividadParticipacionParametros = true;
    return true;
  }

  function conectarValidacion() {
    if (window.__actividadParticipacionValidacion) return true;
    if (typeof window.validarModulo !== 'function') return false;

    const original = window.validarModulo;

    window.validarModulo = function() {
      if (typeof moduloSeleccionado !== 'undefined' && moduloSeleccionado === 'participacion') {
        const actividad = String(
          document.getElementById('actividadParticipacion')?.value || ''
        ).trim();

        if (!actividad) {
          const estado = document.getElementById('estado');
          if (estado) estado.textContent = '❌ Escribe la actividad realizada.';
          document.getElementById('actividadParticipacion')?.focus();
          return false;
        }
      }

      return original();
    };

    window.__actividadParticipacionValidacion = true;
    return true;
  }

  function iniciar() {
    return insertarCampo() && conectarParametros() && conectarValidacion();
  }

  if (iniciar()) return;

  const observador = new MutationObserver(() => {
    if (iniciar()) observador.disconnect();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
