/* Compatibilidad con los nombres de parámetros esperados por Apps Script.
   Se carga después de script.js y no modifica la lógica del lector NFC. */
(function () {
  const construirOriginal = window.construirParametrosRegistro;

  window.construirParametrosRegistro = function (base) {
    const parametrosBase = typeof construirOriginal === 'function'
      ? construirOriginal(base || {})
      : { ...(base || {}), modulo: window.moduloSeleccionado || '' };

    const modulo = String(parametrosBase.modulo || '').trim().toLowerCase();
    const id = String(
      parametrosBase.id ||
      parametrosBase.alumnoId ||
      parametrosBase.idAlumno ||
      ''
    ).trim();

    let tipoRegistro = '';

    if (modulo === 'tareas') {
      tipoRegistro = parametrosBase.tipoTarea || parametrosBase.resultadoTarea || '';
    } else if (modulo === 'participacion') {
      tipoRegistro = parametrosBase.tipoParticipacion || '';
    } else if (modulo === 'conducta') {
      tipoRegistro = parametrosBase.tipoConducta || parametrosBase.conducta || '';
    } else if (modulo === 'lectura') {
      tipoRegistro = parametrosBase.tipoLectura || parametrosBase.lectura || '';
    } else if (modulo === 'asistencia') {
      tipoRegistro = 'Asistencia';
    }

    return {
      ...parametrosBase,

      // Identificador del alumno: compatibilidad con diferentes versiones del backend.
      id,
      alumnoId: id,
      idAlumno: id,

      // Resultado o tipo de registro: compatibilidad genérica.
      tipoRegistro,
      resultado: tipoRegistro,
      detalle: tipoRegistro,
      valor: tipoRegistro,
      tipo: tipoRegistro,

      // Alias específicos por módulo.
      tarea: parametrosBase.tipoTarea || parametrosBase.resultadoTarea || '',
      participacion: parametrosBase.tipoParticipacion || '',
      conducta: parametrosBase.tipoConducta || parametrosBase.conducta || '',
      lectura: parametrosBase.tipoLectura || parametrosBase.lectura || ''
    };
  };
})();
