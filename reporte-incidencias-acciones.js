/* AulaNFC v2.1 - Campo Acciones tomadas conectado con guardado y PDF. */
(() => {
  const esc = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function insertarCampoAcciones() {
    if (document.getElementById('incidenciaAccionesTomadas')) return true;

    const descripcion = document.getElementById('incidenciaDescripcion');
    if (!descripcion) return false;

    const bloqueDescripcion = descripcion.closest('.incidencias__bloque');
    if (!bloqueDescripcion) return false;

    const bloque = document.createElement('section');
    bloque.className = 'incidencias__bloque';
    bloque.innerHTML = `
      <h3>⚙️ Acciones tomadas</h3>
      <div class="incidencias__campo">
        <label for="incidenciaAccionesTomadas">Describe las acciones realizadas después del incidente</label>
        <textarea
          id="incidenciaAccionesTomadas"
          class="incidencias__textarea"
          placeholder="Ejemplo: se dialogó con los alumnos, se separó a los involucrados, se informó a la familia, se realizó mediación..."
        ></textarea>
      </div>
    `;

    bloqueDescripcion.insertAdjacentElement('afterend', bloque);
    return true;
  }

  function conectarEnvio() {
    if (window.__accionesIncidenciaJSONPConectado) return true;
    if (typeof window.solicitarJSONP !== 'function') return false;

    const solicitarOriginal = window.solicitarJSONP;

    window.solicitarJSONP = function (accion, parametros) {
      const datos = { ...(parametros || {}) };

      if (String(accion || '').toLowerCase() === 'guardarincidencia') {
        datos.accionesTomadas = String(
          document.getElementById('incidenciaAccionesTomadas')?.value || ''
        ).trim();
      }

      return solicitarOriginal(accion, datos);
    };

    window.__accionesIncidenciaJSONPConectado = true;
    return true;
  }

  function validarAntesDeGuardar(evento) {
    const acciones = String(
      document.getElementById('incidenciaAccionesTomadas')?.value || ''
    ).trim();

    if (acciones) return;

    evento.preventDefault();
    evento.stopImmediatePropagation();

    const estado = document.getElementById('estadoReporteIncidencias');
    if (estado) {
      estado.textContent = '❌ Escribe las acciones tomadas antes de guardar la incidencia.';
    }
  }

  function fechaVisible(valor) {
    const partes = String(valor || '').split('-');
    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : String(valor || '');
  }

  function obtenerDatosPDF() {
    const selectAlumno = document.getElementById('incidenciaAlumno');
    const nombre = selectAlumno?.selectedOptions?.[0]?.textContent?.trim() || 'Alumno';
    const datosTexto = document.getElementById('incidenciaDatosAlumno')?.textContent || '';

    const id = (datosTexto.match(/ID:\s*([^·]+)/i) || [,'—'])[1].trim();
    const grado = (datosTexto.match(/Grado:\s*([^°·]+)/i) || [,'—'])[1].trim();
    const grupo = (datosTexto.match(/Grupo:\s*([^·]+)/i) || [,'—'])[1].trim();

    return {
      folio: String(window.folioIncidenciaActual || '').trim(),
      fecha: document.getElementById('incidenciaFecha')?.value || '',
      nombre,
      id,
      grado,
      grupo,
      incidencia: document.getElementById('incidenciaTipo')?.value || '',
      descripcion: document.getElementById('incidenciaDescripcion')?.value.trim() || '',
      accionesTomadas: document.getElementById('incidenciaAccionesTomadas')?.value.trim() || '',
      acuerdos: document.getElementById('incidenciaAcuerdos')?.value.trim() || ''
    };
  }

  function htmlPDF(datos) {
    return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(datos.folio)} - Reporte de incidencia</title>
<style>
@page{size:letter portrait;margin:10mm}
*{box-sizing:border-box}
body{margin:0;background:#eef5fb;color:#243447;font-family:"Trebuchet MS",Arial,sans-serif}
.acciones{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:10px;padding:10px;background:#243447}
.acciones button{border:0;border-radius:12px;padding:11px 18px;font-weight:800;cursor:pointer}
.hoja{width:216mm;min-height:279mm;margin:14px auto;padding:10mm;background:#fff;box-shadow:0 8px 30px #0002}
.enc{text-align:center;padding:14px 18px;border-radius:22px;background:linear-gradient(135deg,#e8f7ff,#fff1d6 55%,#f2e9ff);border:3px solid #76c9f4}
.escuela{font-size:14px;font-weight:900;color:#1565c0}.enc h1{margin:5px 0 3px;font-size:26px;color:#ef5350}.datosEscuela{font-size:10px;font-weight:800;color:#546e7a}
.folio{display:flex;justify-content:space-between;gap:12px;margin-top:12px;padding:10px 13px;border-radius:14px;background:#fff8d9;border:2px solid #ffd45c;font-size:12px}
.alumno{margin-top:12px;padding:12px 14px;border:2px solid #90caf9;border-radius:18px;background:#f4faff}.alumno h2{margin:0 0 7px;color:#1565c0;font-size:19px}.datos{display:flex;gap:18px;flex-wrap:wrap;font-size:11px}
.tipo{margin-top:12px;padding:12px 14px;border:2px solid #ffb74d;border-radius:18px;background:#fff4e5}.tipo strong{display:block;margin-top:4px;font-size:17px;color:#e65100}
.bloque{margin-top:12px;padding:13px 15px;border-radius:18px;border:2px solid}.bloque h3{margin:0 0 8px;font-size:14px}.texto{min-height:88px;white-space:pre-wrap;line-height:1.5;font-size:12px;padding:9px 10px;background:#fff;border-radius:12px;border:1px solid #dbe5ee}
.descripcion{background:#eef7ff;border-color:#90caf9}.accionesTomadas{background:#edf9f1;border-color:#8fd6a3}.acuerdos{background:#f5ecff;border-color:#c7a3f3}
.firmas{display:grid;grid-template-columns:1fr 1fr;gap:48px;margin-top:52px;padding:0 20px}.firma{padding-top:7px;border-top:1.6px solid #546e7a;text-align:center;font-size:10px;font-weight:800}.pie{text-align:center;margin-top:24px;font-size:9px;color:#78909c}
@media print{body{background:#fff}.acciones{display:none!important}.hoja{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none}.enc,.folio,.alumno,.tipo,.bloque{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="acciones"><button onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button><button onclick="window.close()">✕ Cerrar</button></div>
<main class="hoja">
<header class="enc"><div class="escuela">ESCUELA PRIMARIA BENITO JUÁREZ</div><h1>Reporte de Incidencia</h1><div class="datosEscuela">C.C.T. 18DPR0099W · Zona Escolar 29 · Sector 08 · AulaNFC</div></header>
<section class="folio"><span><b>Folio:</b> ${esc(datos.folio)}</span><span><b>Fecha:</b> ${esc(fechaVisible(datos.fecha))}</span></section>
<section class="alumno"><h2>${esc(datos.nombre)}</h2><div class="datos"><span><b>ID:</b> ${esc(datos.id)}</span><span><b>Grado:</b> ${esc(datos.grado)}°</span><span><b>Grupo:</b> ${esc(datos.grupo)}</span></div></section>
<section class="tipo"><span>📌 Incidencia reportada</span><strong>${esc(datos.incidencia)}</strong></section>
<section class="bloque descripcion"><h3>📝 Descripción del incidente</h3><div class="texto">${esc(datos.descripcion)}</div></section>
<section class="bloque accionesTomadas"><h3>⚙️ Acciones tomadas</h3><div class="texto">${esc(datos.accionesTomadas)}</div></section>
<section class="bloque acuerdos"><h3>🤝 Acuerdos y compromisos</h3><div class="texto">${esc(datos.acuerdos)}</div></section>
<section class="firmas"><div class="firma">Firma del docente</div><div class="firma">Firma del padre, madre o tutor</div></section>
<footer class="pie">Reporte generado con AulaNFC · Seguimiento escolar</footer>
</main>
</body>
</html>`;
  }

  function generarPDFConAcciones(evento) {
    const folio = String(window.folioIncidenciaActual || '').trim();
    if (!folio) return;

    evento.preventDefault();
    evento.stopImmediatePropagation();

    const datos = obtenerDatosPDF();
    const ventana = window.open('', '_blank');
    const estado = document.getElementById('estadoReporteIncidencias');

    if (!ventana) {
      if (estado) estado.textContent = '❌ El navegador bloqueó la ventana del PDF.';
      return;
    }

    ventana.document.open();
    ventana.document.write(htmlPDF(datos));
    ventana.document.close();

    if (estado) estado.textContent = `✅ PDF preparado · Folio ${folio}`;
  }

  function conectarBotones() {
    const guardar = document.getElementById('btnGuardarIncidencia');
    const pdf = document.getElementById('btnPDFIncidencia');

    if (!guardar || !pdf) return false;

    if (!guardar.dataset.accionesValidacion) {
      guardar.dataset.accionesValidacion = 'true';
      guardar.addEventListener('click', validarAntesDeGuardar, true);
    }

    if (!pdf.dataset.accionesPdf) {
      pdf.dataset.accionesPdf = 'true';
      pdf.addEventListener('click', generarPDFConAcciones, true);
    }

    return true;
  }

  function inicializarTodo() {
    const campo = insertarCampoAcciones();
    const envio = conectarEnvio();
    const botones = conectarBotones();
    return campo && envio && botones;
  }

  if (inicializarTodo()) return;

  const observador = new MutationObserver(() => {
    if (inicializarTodo()) observador.disconnect();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
