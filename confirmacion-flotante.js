/*
 * Sustituye únicamente la presentación visual de confirmarRegistro().
 * Conserva historial, contador, vibración y flujo NFC/manual existentes.
 */
(() => {
  const mensajesPorModulo = {
    asistencia: 'Asistencia registrada', tareas: 'Tarea registrada', participacion: 'Participación registrada', conducta: 'Conducta registrada', lectura: 'Lectura registrada'
  };
  let temporizadorOcultar=null,temporizadorRetirar=null;
  function obtenerVentana(){let ventana=document.getElementById('confirmacionFlotante');if(ventana)return ventana;ventana=document.createElement('div');ventana.id='confirmacionFlotante';ventana.className='confirmacion-flotante';ventana.setAttribute('role','status');ventana.setAttribute('aria-live','assertive');ventana.setAttribute('aria-atomic','true');ventana.innerHTML=`<article class="confirmacion-flotante__tarjeta"><div class="confirmacion-flotante__icono" aria-hidden="true">✓</div><p id="confirmacionFlotanteMensaje" class="confirmacion-flotante__mensaje"></p><p id="confirmacionFlotanteAlumno" class="confirmacion-flotante__alumno"></p></article>`;document.body.appendChild(ventana);return ventana}
  function mostrarConfirmacionFlotante(nombre,modulo){const ventana=obtenerVentana(),mensaje=mensajesPorModulo[modulo]||'Registro guardado';document.getElementById('confirmacionFlotanteMensaje').textContent=mensaje;document.getElementById('confirmacionFlotanteAlumno').textContent=nombre||'Alumno';clearTimeout(temporizadorOcultar);clearTimeout(temporizadorRetirar);ventana.classList.remove('saliendo','visible');requestAnimationFrame(()=>requestAnimationFrame(()=>ventana.classList.add('visible')));temporizadorOcultar=setTimeout(()=>{ventana.classList.add('saliendo');ventana.classList.remove('visible');temporizadorRetirar=setTimeout(()=>ventana.classList.remove('saliendo'),180)},1000)}
  window.confirmarRegistro=function(nombre,modulo,metodo){$('estado').textContent=lectorActivo?'📡 Registro confirmado. Acerca otra tarjeta.':'✅ Registro confirmado.';$('resultado').innerHTML='';mostrarConfirmacionFlotante(nombre,modulo);historialSesion.unshift({nombre,modulo,metodo,hora:new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})});$('totalSesion').textContent=historialSesion.length;$('historialSesion').innerHTML=historialSesion.map(r=>`<article class="historial-item"><div class="historial-icono">${moduloPresentacion(r.modulo)}</div><div><strong>${escaparHTML(r.nombre)}</strong><p>${escaparHTML(formatearModulo(r.modulo))} · ${r.metodo}</p></div><time>${r.hora}</time></article>`).join('');if('vibrate'in navigator)navigator.vibrate(180)};
})();

function cargarExtra(selector,src,dataset){if(document.querySelector(selector))return;const s=document.createElement('script');s.src=src;s.defer=true;Object.assign(s.dataset,dataset);document.body.appendChild(s)}
cargarExtra('script[data-menu-aulanfc]','menu-lateral.js?v=2',{menuAulanfc:'true'});
cargarExtra('script[data-resumen-estadistico-conexion]','resumen-estadistico-conexion.js?v=1',{resumenEstadisticoConexion:'true'});
cargarExtra('script[data-ficha-alumno-menu]','ficha-alumno-menu.js?v=2',{fichaAlumnoMenu:'true'});
cargarExtra('script[data-ficha-alumno-foto-drive]','ficha-alumno-foto-drive.js?v=1',{fichaAlumnoFotoDrive:'true'});
cargarExtra('script[data-ficha-historial-conexion]','ficha-historial-conexion.js?v=1',{fichaHistorialConexion:'true'});
cargarExtra('script[data-ficha-pdf]','ficha-pdf.js?v=3',{fichaPdf:'true'});
cargarExtra('script[data-dashboard-aulanfc]','dashboard.js?v=1',{dashboardAulanfc:'true'});
cargarExtra('script[data-dashboard-conexion]','dashboard-conexion.js?v=1',{dashboardConexion:'true'});
cargarExtra('script[data-reporte-incidencias]','reporte-incidencias.js?v=1',{reporteIncidencias:'true'});
cargarExtra('script[data-reporte-incidencias-acciones]','reporte-incidencias-acciones.js?v=1',{reporteIncidenciasAcciones:'true'});
cargarExtra('script[data-historial-incidencias]','historial-incidencias.js?v=2',{historialIncidencias:'true'});
cargarExtra('script[data-participacion-actividad]','participacion-actividad.js?v=2',{participacionActividad:'true'});
cargarExtra('script[data-tareas-actividad]','tareas-actividad.js?v=2',{tareasActividad:'true'});
