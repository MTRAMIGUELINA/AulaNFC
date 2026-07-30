(() => {
  const botonAnterior = document.getElementById('btnGuardarManual');
  if (!botonAnterior) return;

  const botonNuevo = botonAnterior.cloneNode(true);
  botonAnterior.replaceWith(botonNuevo);

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
      const parametros = construirParametrosRegistro({
        id: alumnoManualId,
        alumnoId: alumnoManualId,
        idAlumno: alumnoManualId,
        uid: alumno.uid || ''
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
