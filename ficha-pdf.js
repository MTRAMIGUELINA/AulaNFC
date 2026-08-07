/* AulaNFC v2.1 - Informe individual imprimible / Guardar como PDF. */
(() => {
  let exportando = false;

  function esperarElementos() {
    const boton = document.getElementById('btnFichaPDF');
    const idAlumno = document.getElementById('idFichaAlumno');

    if (!boton || !idAlumno || typeof solicitarJSONP !== 'function') {
      setTimeout(esperarElementos, 120);
      return;
    }

    if (boton.dataset.pdfFichaInicializado === 'true') return;
    boton.dataset.pdfFichaInicializado = 'true';

    const actualizarEstado = () => {
      const id = String(idAlumno.textContent || '').trim();
      boton.disabled = !id || id === '—' || exportando;
    };

    const observador = new MutationObserver(actualizarEstado);
    observador.observe(idAlumno, {
      childList: true,
      characterData: true,
      subtree: true
    });

    actualizarEstado();
    boton.addEventListener('click', generarInforme);
  }

  function texto(id, respaldo = '') {
    return String(document.getElementById(id)?.textContent || respaldo).trim();
  }

  function numero(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
  }

  function escapar(valor) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fechaGeneracion() {
    return new Date().toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  function obtenerFoto() {
    const imagen = document.querySelector('#fotoFichaAlumno img');
    return imagen?.src || '';
  }

  function obtenerIniciales() {
    return String(document.getElementById('fotoFichaAlumno')?.textContent || 'AL').trim();
  }

  function validarRespuesta(respuesta, mensaje) {
    if (!respuesta || (respuesta.ok !== true && respuesta.exito !== true)) {
      throw new Error(respuesta?.mensaje || mensaje);
    }
  }

  async function generarInforme() {
    if (exportando) return;

    const boton = document.getElementById('btnFichaPDF');
    const estado = document.getElementById('estadoFichaAlumno');
    const idAlumno = texto('idFichaAlumno');

    if (!idAlumno || idAlumno === '—') return;

    // Se abre inmediatamente para evitar bloqueos del navegador por ventanas emergentes.
    const ventana = window.open('', '_blank');
    if (!ventana) {
      if (estado) estado.textContent = '❌ El navegador bloqueó la ventana del reporte.';
      return;
    }

    ventana.document.write(`<!doctype html><html><head><title>Preparando reporte...</title></head><body style="font-family:Arial,sans-serif;padding:30px"><p>Preparando reporte del alumno...</p></body></html>`);
    ventana.document.close();

    exportando = true;
    boton.disabled = true;
    if (estado) estado.textContent = '⏳ Preparando reporte para PDF...';

    try {
      const [resumen, historial] = await Promise.all([
        solicitarJSONP('obtenerResumenEstadistico', {
          idAlumno,
          periodo: 'ciclo'
        }),
        solicitarJSONP('obtenerHistorialGeneral', {
          idAlumno
        })
      ]);

      validarRespuesta(resumen, 'No fue posible obtener el resumen estadístico.');
      validarRespuesta(historial, 'No fue posible obtener el historial general.');

      const datosAlumno = {
        id: idAlumno,
        nombre: texto('nombreFichaAlumno', 'Alumno'),
        grado: texto('gradoFichaAlumno', '—'),
        grupo: texto('grupoFichaAlumno', '—'),
        foto: obtenerFoto(),
        iniciales: obtenerIniciales()
      };

      const registros = Array.isArray(historial.registros)
        ? historial.registros
        : Array.isArray(historial.historial)
          ? historial.historial
          : [];

      ventana.document.open();
      ventana.document.write(construirHTML(datosAlumno, resumen, registros));
      ventana.document.close();

      if (estado) estado.textContent = '✅ Reporte listo para imprimir o guardar como PDF.';

    } catch (error) {
      ventana.document.open();
      ventana.document.write(`<!doctype html><html><head><title>Error</title></head><body style="font-family:Arial,sans-serif;padding:30px"><h2>No fue posible generar el reporte</h2><p>${escapar(error?.message || 'Error desconocido')}</p></body></html>`);
      ventana.document.close();
      if (estado) estado.textContent = `❌ ${error?.message || 'No fue posible generar el reporte.'}`;

    } finally {
      exportando = false;
      boton.disabled = false;
    }
  }

  function construirHTML(alumno, respuesta, registros) {
    const asistencia = respuesta.asistencia || {};
    const tareas = respuesta.tareas || {};
    const participaciones = respuesta.participaciones || {};
    const conducta = respuesta.conducta || {};
    const lectura = respuesta.lectura || {};

    const presentes = numero(asistencia.presentes);
    const faltas = numero(asistencia.faltas);
    const diasEscolares = numero(asistencia.diasEscolares) || (presentes + faltas);
    const porcentajeAsistencia = diasEscolares > 0
      ? Math.round((presentes / diasEscolares) * 100)
      : numero(asistencia.porcentajeAsistencia);

    const porcentajeTareas = Math.max(0, Math.min(100, Math.round(numero(tareas.porcentajeCumplimiento))));

    const fotoHTML = alumno.foto
      ? `<img class="foto" src="${escapar(alumno.foto)}" alt="Foto del alumno">`
      : `<div class="foto iniciales">${escapar(alumno.iniciales || 'AL')}</div>`;

    const filasHistorial = registros.length
      ? registros.map((r) => `
          <tr>
            <td>${escapar(r.fecha || '')}</td>
            <td>${escapar(r.hora || '')}</td>
            <td>${escapar(r.modulo || '')}</td>
            <td>${escapar(r.registro || r.detalle || '')}</td>
          </tr>`).join('')
      : '<tr><td colspan="4" class="sin-datos">No hay registros en el período.</td></tr>';

    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Reporte - ${escapar(alumno.nombre)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: #eef3f8; }
  .acciones { position: sticky; top: 0; z-index: 5; display:flex; gap:10px; justify-content:center; padding:12px; background:#0f172a; }
  .acciones button { border:0; border-radius:9px; padding:11px 18px; font-weight:700; cursor:pointer; }
  .hoja { width: 210mm; min-height: 297mm; margin: 18px auto; padding: 14mm; background:white; box-shadow:0 8px 30px rgba(15,23,42,.12); }
  .encabezado { display:flex; align-items:center; justify-content:space-between; gap:18px; padding-bottom:14px; border-bottom:3px solid #1976d2; }
  .marca h1 { margin:0; font-size:24px; color:#0f3d70; }
  .marca p { margin:4px 0 0; color:#607d8b; font-size:12px; }
  .fecha { text-align:right; font-size:11px; color:#64748b; }
  .alumno { display:grid; grid-template-columns:90px 1fr; gap:16px; align-items:center; margin-top:18px; padding:14px; border:1px solid #dbe7f3; border-radius:14px; background:#f8fbff; }
  .foto { width:78px; height:78px; border-radius:50%; object-fit:cover; border:4px solid white; box-shadow:0 3px 12px rgba(15,23,42,.15); }
  .iniciales { display:flex; align-items:center; justify-content:center; background:#dceeff; color:#1565c0; font-size:25px; font-weight:800; }
  .alumno h2 { margin:0 0 8px; font-size:21px; }
  .datos { display:flex; flex-wrap:wrap; gap:14px; color:#475569; font-size:12px; }
  .seccion { margin-top:20px; }
  .seccion h3 { margin:0 0 10px; font-size:16px; color:#0f172a; }
  .rejilla { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .bloque { break-inside:avoid; border:1px solid #e2e8f0; border-radius:12px; padding:12px; }
  .bloque h4 { margin:0 0 9px; font-size:14px; }
  .asistencia h4 { color:#2e7d32; } .tareas h4 { color:#9a6b00; } .participacion h4 { color:#1565c0; } .conducta h4 { color:#7b1fa2; } .lectura h4 { color:#ef6c00; }
  .dato { display:flex; justify-content:space-between; gap:12px; padding:4px 0; font-size:12px; border-bottom:1px dotted #e2e8f0; }
  .dato:last-child { border-bottom:0; }
  .dato strong { text-align:right; }
  .barra { height:8px; margin-top:8px; border-radius:99px; background:#e2e8f0; overflow:hidden; }
  .barra span { display:block; height:100%; background:#1976d2; }
  table { width:100%; border-collapse:collapse; font-size:10.5px; }
  th { text-align:left; background:#edf4fb; color:#334155; }
  th, td { padding:7px 6px; border:1px solid #dbe3ec; vertical-align:top; }
  .sin-datos { text-align:center; color:#64748b; padding:16px; }
  .observaciones { margin-top:18px; border:1px solid #dbe3ec; border-radius:10px; padding:12px; min-height:72px; }
  .linea { height:24px; border-bottom:1px solid #94a3b8; }
  .firmas { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-top:35px; }
  .firma { padding-top:32px; border-top:1px solid #475569; text-align:center; font-size:11px; }
  .pie { margin-top:20px; padding-top:10px; border-top:1px solid #e2e8f0; text-align:center; font-size:9px; color:#94a3b8; }
  @media print {
    body { background:white; }
    .acciones { display:none !important; }
    .hoja { width:auto; min-height:auto; margin:0; padding:0; box-shadow:none; }
    .seccion-historial { break-before:page; }
  }
</style>
</head>
<body>
  <div class="acciones">
    <button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>
    <button onclick="window.close()">✕ Cerrar</button>
  </div>

  <main class="hoja">
    <header class="encabezado">
      <div class="marca">
        <h1>REPORTE INDIVIDUAL DEL ALUMNO</h1>
        <p>AulaNFC · Seguimiento escolar</p>
      </div>
      <div class="fecha"><strong>Período:</strong> Todo el ciclo escolar<br><strong>Generado:</strong> ${escapar(fechaGeneracion())}</div>
    </header>

    <section class="alumno">
      ${fotoHTML}
      <div>
        <h2>${escapar(alumno.nombre)}</h2>
        <div class="datos">
          <span><strong>Grado:</strong> ${escapar(alumno.grado)}</span>
          <span><strong>Grupo:</strong> ${escapar(alumno.grupo)}</span>
          <span><strong>ID:</strong> ${escapar(alumno.id)}</span>
        </div>
      </div>
    </section>

    <section class="seccion">
      <h3>Resumen estadístico</h3>
      <div class="rejilla">
        <article class="bloque asistencia">
          <h4>🟢 Asistencia</h4>
          <div class="dato"><span>Presentes</span><strong>${presentes}</strong></div>
          <div class="dato"><span>Faltas</span><strong>${faltas}</strong></div>
          <div class="dato"><span>Asistencia</span><strong>${porcentajeAsistencia}%</strong></div>
        </article>

        <article class="bloque tareas">
          <h4>🟡 Tareas</h4>
          <div class="dato"><span>Entregadas</span><strong>${numero(tareas.entregadas)}</strong></div>
          <div class="dato"><span>No entregadas</span><strong>${numero(tareas.noEntregadas)}</strong></div>
          <div class="dato"><span>Incompletas</span><strong>${numero(tareas.incompletas)}</strong></div>
          <div class="dato"><span>Cumplimiento</span><strong>${porcentajeTareas}%</strong></div>
          <div class="barra"><span style="width:${porcentajeTareas}%"></span></div>
        </article>

        <article class="bloque participacion">
          <h4>🔵 Participaciones</h4>
          <div class="dato"><span>Lenguajes</span><strong>${numero(participaciones.lenguajes)}</strong></div>
          <div class="dato"><span>Saberes y Pensamiento Científico</span><strong>${numero(participaciones.saberes)}</strong></div>
          <div class="dato"><span>Ética, Naturaleza y Sociedad</span><strong>${numero(participaciones.etica)}</strong></div>
          <div class="dato"><span>De lo Humano a lo Comunitario</span><strong>${numero(participaciones.comunitario)}</strong></div>
          <div class="dato"><span>Total</span><strong>${numero(participaciones.total)}</strong></div>
        </article>

        <article class="bloque conducta">
          <h4>🟣 Conducta</h4>
          <div class="dato"><span>Buenas conductas</span><strong>${numero(conducta.buenasConductas)}</strong></div>
          <div class="dato"><span>Llamadas de atención</span><strong>${numero(conducta.llamadasAtencion)}</strong></div>
          <div class="dato"><span>Tarjetas amarillas</span><strong>${numero(conducta.tarjetasAmarillas)}</strong></div>
          <div class="dato"><span>Tarjetas rojas</span><strong>${numero(conducta.tarjetasRojas)}</strong></div>
        </article>

        <article class="bloque lectura">
          <h4>🟠 Lectura</h4>
          <div class="dato"><span>Requiere apoyo</span><strong>${numero(lectura.requiereApoyo)}</strong></div>
          <div class="dato"><span>Se acerca al estándar</span><strong>${numero(lectura.seAcercaEstandar)}</strong></div>
          <div class="dato"><span>Estándar</span><strong>${numero(lectura.estandar)}</strong></div>
          <div class="dato"><span>Avanzado</span><strong>${numero(lectura.avanzado)}</strong></div>
          <div class="dato"><span>Total de registros</span><strong>${numero(lectura.total)}</strong></div>
        </article>
      </div>
    </section>

    <section class="seccion seccion-historial">
      <h3>Historial general</h3>
      <table>
        <thead><tr><th>Fecha</th><th>Hora</th><th>Módulo</th><th>Registro</th></tr></thead>
        <tbody>${filasHistorial}</tbody>
      </table>
    </section>

    <section class="seccion">
      <h3>Observaciones del docente</h3>
      <div class="observaciones"><div class="linea"></div><div class="linea"></div></div>
    </section>

    <section class="firmas">
      <div class="firma">Firma del docente</div>
      <div class="firma">Firma de madre, padre o tutor</div>
    </section>

    <footer class="pie">Documento generado desde AulaNFC.</footer>
  </main>
</body>
</html>`;
  }

  esperarElementos();
})();
