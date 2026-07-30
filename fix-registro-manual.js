(() => {
  const botonAnterior = document.getElementById('btnGuardarManual');
  if (!botonAnterior) return;

  const botonNuevo = botonAnterior.cloneNode(true);
  botonAnterior.replaceWith(botonNuevo);

  function obtenerTipoRegistro() {
    if (moduloSeleccionado === 'tareas') {
      return document.getElementById('tipoTarea')?.value || '';
    }
    if (moduloSeleccionado === 'participacion') {
      return document.getElementById('tipoParticipacion')?.value || '';
    }
    if (moduloSeleccionado === 'conducta') {
      return document.getElementById('tipoConducta')?.value || '';
    }
    if (moduloSeleccionado === 'lectura') {
      return document.getElementById('tipoLectura')?.value || '';
    }
    if (moduloSeleccionado === 'asistencia') {
      return 'Asistencia';
    }
    return '';
  }

  botonNuevo.addEventListener('click', async () => {
    if (!alumnoManualId || !validarModulo() || envioEnProceso) return;

    const alumno = alumnos.find((item) => String(item.id) === String(alumnoManualId));
    if (!alumno) {
      document.getElementById('estado').textContent = '❌ No se encontró el alumno seleccionado.';
      return;
    }

    envioEnProceso = true;
    botonNuevo.disabled = true;
    document.getElementById('estado').textContent = '⏳ Guardando registro manual...';
    document.getElementById('resultado').textContent = '';

    try {
      const tipoRegistro = obtenerTipoRegistro();
      const parametros = construirParametrosRegistro({
        id: alumnoManualId,
        alumnoId: alumnoManualId,
        idAlumno: alumnoManualId,
        uid: alumno.uid || ''
      });

      Object.assign(parametros, {
        tipoRegistro,
        resultado: tipoRegistro,
        detalle: tipoRegistro,
        valor: tipoRegistro,
        registro: tipoRegistro,
        tipo: tipoRegistro,
        resultadoLectura: moduloSeleccionado === 'lectura' ? tipoRegistro : '',
        resultadoConducta: moduloSeleccionado === 'conducta' ? tipoRegistro : '',
        resultadoParticipacion: moduloSeleccionado === 'participacion' ? tipoRegistro : '',
        tarea: moduloSeleccionado === 'tareas' ? tipoRegistro : ''
      });

      const respuesta = await solicitarJSONP('registrarManual', parametros);
      validarRespuesta(respuesta);

      confirmarRegistro(
        respuesta.nombre || respuesta.nombreCompleto || nombreCompleto(alumno),
        moduloSeleccionado,
        'Manual'
      );

      cerrarRegistroManual();
    } catch (error) {
      document.getElementById('estado').textContent = '❌ No se pudo guardar el registro manual.';
      document.getElementById('resultado').textContent = error.message || 'Error de registro.';
      botonNuevo.disabled = false;
    } finally {
      envioEnProceso = false;
    }
  });
})();