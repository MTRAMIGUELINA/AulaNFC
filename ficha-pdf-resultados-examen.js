/* AulaNFC v3 - Resultados de examen dentro del PDF de ficha del alumno. */
(() => {
  let ultimaVentanaPDF = null;
  const abrirOriginal = window.open.bind(window);

  if (!window.__aulaNfcCapturaVentanaPdfExamen) {
    window.open = function(...args) {
      const ventana = abrirOriginal(...args);
      ultimaVentanaPDF = ventana;
      return ventana;
    };
    window.__aulaNfcCapturaVentanaPdfExamen = true;
  }

  const PERIODOS = ['Primer trimestre','Segundo trimestre','Tercer trimestre'];
  const CAMPOS = ['Lenguajes','Saberes y Pensamiento Científico','Ética, Naturaleza y Sociedad','De lo Humano a lo Comunitario'];

  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');

  function esperarBoton() {
    const boton = document.getElementById('btnFichaPDF');
    const id = document.getElementById('idFichaAlumno');
    if (!boton || !id || typeof solicitarJSONP !== 'function') {
      setTimeout(esperarBoton, 120);
      return;
    }
    if (boton.dataset.examenPdfInicializado === 'true') return;
    boton.dataset.examenPdfInicializado = 'true';
    boton.addEventListener('click', () => {
      const idAlumno = String(id.textContent || '').trim();
      if (!idAlumno || idAlumno === '—') return;
      integrarResultados(idAlumno);
    });
  }

  async function obtenerResultadosAlumno(idAlumno) {
    const consultas = [];
    PERIODOS.forEach((periodo) => {
      CAMPOS.forEach((campoFormativo) => {
        consultas.push(
          solicitarJSONP('obtenerresultadosexamen', { periodo, campoFormativo })
            .then((respuesta) => ({ periodo, campoFormativo, respuesta }))
        );
      });
    });

    const respuestas = await Promise.all(consultas);
    const mapa = {};

    respuestas.forEach(({ periodo, campoFormativo, respuesta }) => {
      const lista = Array.isArray(respuesta?.resultados) ? respuesta.resultados : [];
      const registro = lista.find((item) => String(item.idAlumno || '').trim() === String(idAlumno).trim());
      if (!mapa[campoFormativo]) mapa[campoFormativo] = {};
      mapa[campoFormativo][periodo] = registro ? String(registro.calificacion ?? '').trim() : '';
    });

    return mapa;
  }

  async function integrarResultados(idAlumno) {
    try {
      const resultados = await obtenerResultadosAlumno(idAlumno);
      const ventana = await esperarVentanaLista();
      if (!ventana || ventana.closed) return;
      insertarSeccion(ventana, resultados);
    } catch (error) {
      console.error('No fue posible integrar resultados de examen al PDF:', error);
    }
  }

  function esperarVentanaLista() {
    return new Promise((resolve) => {
      let intentos = 0;
      const revisar = () => {
        intentos++;
        const ventana = ultimaVentanaPDF;
        try {
          if (ventana && !ventana.closed && ventana.document && ventana.document.querySelector('.obs')) {
            resolve(ventana);
            return;
          }
        } catch (e) {}
        if (intentos >= 100) {
          resolve(null);
          return;
        }
        setTimeout(revisar, 100);
      };
      revisar();
    });
  }

  function insertarSeccion(ventana, resultados) {
    const doc = ventana.document;
    if (doc.getElementById('resultadosExamenPdf')) return;
    const observaciones = doc.querySelector('.obs');
    if (!observaciones) return;

    const seccion = doc.createElement('section');
    seccion.id = 'resultadosExamenPdf';
    seccion.className = 'examenes-pdf';

    const filas = CAMPOS.map((campo) => {
      const valores = resultados[campo] || {};
      return `<tr><td>${esc(campo)}</td>${PERIODOS.map((periodo) => {
        const valor = String(valores[periodo] ?? '').trim();
        return `<td class="examen-nota">${valor ? esc(valor) : '—'}</td>`;
      }).join('')}</tr>`;
    }).join('');

    seccion.innerHTML = `<h3>📝 Resultados de examen</h3><p>Calificaciones registradas por campo formativo y periodo de evaluación.</p><table><thead><tr><th>Campo formativo</th><th>1.er trimestre</th><th>2.º trimestre</th><th>3.er trimestre</th></tr></thead><tbody>${filas}</tbody></table>`;

    const estilo = doc.createElement('style');
    estilo.textContent = `.examenes-pdf{margin-top:10px;padding:10px 12px;border:2px solid #80cbc4;border-radius:18px;background:#effaf8;break-inside:avoid}.examenes-pdf h3{margin:0 0 4px;color:#00796b;font-size:13px}.examenes-pdf p{margin:0 0 7px;font-size:9px;color:#607d8b}.examenes-pdf table{width:100%;border-collapse:collapse;font-size:9px;background:#fff}.examenes-pdf th{padding:5px;border:1px solid #b2dfdb;background:#dff5f1;color:#00695c;text-align:center}.examenes-pdf th:first-child{text-align:left}.examenes-pdf td{padding:5px;border:1px solid #cfd8dc}.examenes-pdf .examen-nota{text-align:center;font-weight:900;font-size:11px;color:#1565c0}@media print{.examenes-pdf,.examenes-pdf th{-webkit-print-color-adjust:exact;print-color-adjust:exact}}`;
    doc.head.appendChild(estilo);
    observaciones.insertAdjacentElement('beforebegin', seccion);
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', esperarBoton) : esperarBoton();
})();