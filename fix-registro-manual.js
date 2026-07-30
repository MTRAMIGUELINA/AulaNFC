(() => {
  const botonAnterior = document.getElementById('btnGuardarManual');
  if (!botonAnterior) return;

  const botonNuevo = botonAnterior.cloneNode(true);
  botonAnterior.replaceWith(botonNuevo);

  function valorSeleccionado(id) {
    const selector = document.getElementById(id);
    if (!selector) return '';

    const valor = String(selector.value || '').trim();
    if (valor) return valor;

    const opcion = selector.options?.[selector.selectedIndex];
    return String(opcion?.textContent || '').trim();
  }

  function obtenerTipoRegistroManual() {
    if (moduloSeleccionado === 'conducta') {
      return valorSeleccionado('tipoConducta');
    }

    if (moduloSeleccionado === 'lectura') {
      return valorSeleccionado('tipoLectura');
    }

    if (moduloSeleccionado === 'tareas') {
      return valorSeleccionado('tipoTarea');
    }

    if (moduloSeleccionado === 'participacion') {
      return valorSeleccionado('tipoParticipacion');
    }

    if (moduloSeleccionado === 'asistencia') {
      return 'Asistencia';
    }

    return '';
  }

  botonNuevo.addEventListener('click', async () => {
    if (!alumnoManualId || envioEnProceso) return;

    const moduloActual = moduloSeleccionado;
    const tipoRegistro = obtenerTipoRegistroManual();

    if ((moduloActual === 'conducta' || moduloActual === 'lectura') && !tipoRegistro) {
      document.getElementById('estado').textContent = moduloActual === 'conducta'
        ? '❌ Selecciona el tipo de conducta.'
        : '❌ Selecciona el resultado de lectura.';
      return;
    }

    if (!validarModulo()) return;

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
      const parametros = construirParametrosRegistro({
        id: alumnoManualId,
        alumnoId: alumnoManualId,
        idAlumno: alumnoManualId,
        uid: alumno.uid || ''
      });

      if (moduloActual === 'conducta') {
        Object.assign(parametros, {
          modulo: 'conducta',
          tipoConducta: tipoRegistro,
          conducta: tipoRegistro,
          resultadoConducta: tipoRegistro,
          tipoRegistro: tipoRegistro,
          resultadoRegistro: tipoRegistro,
          tipoResultado: tipoRegistro,
          resultado: tipoRegistro,
          detalle: tipoRegistro,
          valor: tipoRegistro,
          registro: tipoRegistro,
          tipo: tipoRegistro
        });
      }

      if (moduloActual === 'lectura') {
        Object.assign(parametros, {
          modulo: 'lectura',
          tipoLectura: tipoRegistro,
          lectura: tipoRegistro,
          resultadoLectura: tipoRegistro,
          tipoRegistro: tipoRegistro,
          resultadoRegistro: tipoRegistro,
          tipoResultado: tipoRegistro,
          resultado: tipoRegistro,
          detalle: tipoRegistro,
          valor: tipoRegistro,
          registro: tipoRegistro,
          tipo: tipoRegistro
        });
      }

      const respuesta = await solicitarJSONP('registrarManual', parametros);
      validarRespuesta(respuesta);

      confirmarRegistro(
        respuesta.nombre || respuesta.nombreCompleto || nombreCompleto(alumno),
        moduloActual,
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