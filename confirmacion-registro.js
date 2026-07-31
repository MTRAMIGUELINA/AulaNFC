/* Mejora visual de la confirmación sin cambiar la comunicación con Apps Script. */
(function () {
  const mensajesPorModulo = {
    asistencia: 'Asistencia registrada',
    tareas: 'Tarea registrada',
    participacion: 'Participación registrada',
    conducta: 'Conducta registrada',
    lectura: 'Lectura registrada'
  };

  window.confirmarRegistro = function (nombre, modulo, metodo) {
    const mensaje = mensajesPorModulo[modulo] || 'Registro guardado';
    const nombreSeguro = escaparHTML(nombre || 'Alumno');
    const metodoSeguro = escaparHTML(metodo || '');
    const moduloSeguro = escaparHTML(formatearModulo(modulo));

    $('estado').textContent = lectorActivo
      ? '📡 Registro confirmado. Acerca otra tarjeta.'
      : '✅ Registro confirmado.';

    $('resultado').innerHTML = `
      <article class="tarjeta-confirmacion" role="status" aria-label="${escaparHTML(mensaje)}">
        <div class="confirmacion-icono" aria-hidden="true">✓</div>
        <div class="confirmacion-contenido">
          <p class="confirmacion-mensaje">${escaparHTML(mensaje)}</p>
          <h3 class="confirmacion-alumno">${nombreSeguro}</h3>
          <p class="confirmacion-detalle">${moduloSeguro} · ${metodoSeguro}</p>
        </div>
      </article>`;

    historialSesion.unshift({
      nombre,
      modulo,
      metodo,
      hora: new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      })
    });

    $('totalSesion').textContent = historialSesion.length;
    $('historialSesion').innerHTML = historialSesion.map((r) =>
      `<article class="historial-item"><div class="historial-icono">${moduloPresentacion(r.modulo)}</div><div><strong>${escaparHTML(r.nombre)}</strong><p>${escaparHTML(formatearModulo(r.modulo))} · ${r.metodo}</p></div><time>${r.hora}</time></article>`
    ).join('');

    if ('vibrate' in navigator) navigator.vibrate(180);
  };
})();
