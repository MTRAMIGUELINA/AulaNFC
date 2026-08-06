/*
 * Sustituye únicamente la presentación visual de confirmarRegistro().
 * Conserva historial, contador, vibración y flujo NFC/manual existentes.
 */
(() => {
  const mensajesPorModulo = {
    asistencia: 'Asistencia registrada',
    tareas: 'Tarea registrada',
    participacion: 'Participación registrada',
    conducta: 'Conducta registrada',
    lectura: 'Lectura registrada'
  };

  let temporizadorOcultar = null;
  let temporizadorRetirar = null;

  function obtenerVentana() {
    let ventana = document.getElementById('confirmacionFlotante');

    if (ventana) return ventana;

    ventana = document.createElement('div');
    ventana.id = 'confirmacionFlotante';
    ventana.className = 'confirmacion-flotante';
    ventana.setAttribute('role', 'status');
    ventana.setAttribute('aria-live', 'assertive');
    ventana.setAttribute('aria-atomic', 'true');
    ventana.innerHTML = `
      <article class="confirmacion-flotante__tarjeta">
        <div class="confirmacion-flotante__icono" aria-hidden="true">✓</div>
        <p id="confirmacionFlotanteMensaje" class="confirmacion-flotante__mensaje"></p>
        <p id="confirmacionFlotanteAlumno" class="confirmacion-flotante__alumno"></p>
      </article>`;

    document.body.appendChild(ventana);
    return ventana;
  }

  function mostrarConfirmacionFlotante(nombre, modulo) {
    const ventana = obtenerVentana();
    const mensaje = mensajesPorModulo[modulo] || 'Registro guardado';

    document.getElementById('confirmacionFlotanteMensaje').textContent = mensaje;
    document.getElementById('confirmacionFlotanteAlumno').textContent = nombre || 'Alumno';

    clearTimeout(temporizadorOcultar);
    clearTimeout(temporizadorRetirar);

    ventana.classList.remove('saliendo');
    ventana.classList.remove('visible');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => ventana.classList.add('visible'));
    });

    temporizadorOcultar = setTimeout(() => {
      ventana.classList.add('saliendo');
      ventana.classList.remove('visible');

      temporizadorRetirar = setTimeout(() => {
        ventana.classList.remove('saliendo');
      }, 180);
    }, 1000);
  }

  window.confirmarRegistro = function (nombre, modulo, metodo) {
    $('estado').textContent = lectorActivo
      ? '📡 Registro confirmado. Acerca otra tarjeta.'
      : '✅ Registro confirmado.';

    $('resultado').innerHTML = '';
    mostrarConfirmacionFlotante(nombre, modulo);

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

/* Carga independiente del menú lateral para no alterar el archivo principal. */
(() => {
  if (document.querySelector('script[data-menu-aulanfc]')) return;

  const scriptMenu = document.createElement('script');
  scriptMenu.src = 'menu-lateral.js?v=2';
  scriptMenu.defer = true;
  scriptMenu.dataset.menuAulanfc = 'true';
  document.body.appendChild(scriptMenu);
})();

/* Carga aislada de la conexión estadística. */
(() => {
  if (document.querySelector('script[data-resumen-estadistico-conexion]')) return;

  const scriptResumen = document.createElement('script');
  scriptResumen.src = 'resumen-estadistico-conexion.js?v=1';
  scriptResumen.defer = true;
  scriptResumen.dataset.resumenEstadisticoConexion = 'true';
  document.body.appendChild(scriptResumen);
})();

/* Carga aislada de la opción Ficha del alumno. */
(() => {
  if (document.querySelector('script[data-ficha-alumno-menu]')) return;

  const scriptFicha = document.createElement('script');
  scriptFicha.src = 'ficha-alumno-menu.js?v=2';
  scriptFicha.defer = true;
  scriptFicha.dataset.fichaAlumnoMenu = 'true';
  document.body.appendChild(scriptFicha);
})();

/* Compatibilidad de fotos de la ficha con enlaces de Google Drive. */
(() => {
  if (document.querySelector('script[data-ficha-alumno-foto-drive]')) return;

  const scriptFoto = document.createElement('script');
  scriptFoto.src = 'ficha-alumno-foto-drive.js?v=1';
  scriptFoto.defer = true;
  scriptFoto.dataset.fichaAlumnoFotoDrive = 'true';
  document.body.appendChild(scriptFoto);
})();

/* Carga aislada de la conexión Ficha → Historial. */
(() => {
  if (document.querySelector('script[data-ficha-historial-conexion]')) return;

  const scriptFichaHistorial = document.createElement('script');
  scriptFichaHistorial.src = 'ficha-historial-conexion.js?v=1';
  scriptFichaHistorial.defer = true;
  scriptFichaHistorial.dataset.fichaHistorialConexion = 'true';
  document.body.appendChild(scriptFichaHistorial);
})();

/* Carga aislada del Dashboard diario. */
(() => {
  if (document.querySelector('script[data-dashboard-aulanfc]')) return;

  const scriptDashboard = document.createElement('script');
  scriptDashboard.src = 'dashboard.js?v=1';
  scriptDashboard.defer = true;
  scriptDashboard.dataset.dashboardAulanfc = 'true';
  document.body.appendChild(scriptDashboard);
})();
