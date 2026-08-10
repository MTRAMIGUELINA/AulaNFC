/* AulaNFC v3.1 - Ajuste visual de firma en ficha del alumno PDF. */
(() => {
  if (window.__aulaNfcFirmaFichaAjustada) return;
  window.__aulaNfcFirmaFichaAjustada = true;

  const abrirOriginal = window.open.bind(window);

  window.open = function(...args) {
    const ventana = abrirOriginal(...args);
    if (!ventana || !ventana.document) return ventana;

    const escribirOriginal = ventana.document.write.bind(ventana.document);

    ventana.document.write = function(html) {
      let contenido = String(html ?? '');

      if (
        contenido.includes('Reporte de <span>Seguimiento del Alumno</span>') &&
        contenido.includes('Firma del docente')
      ) {
        contenido = contenido.replace(
          /<div class="firma">([^<]*?) · Firma del docente<\/div>/,
          '<div class="firma"><div style="margin-bottom:2px;font-weight:800">$1</div><div>Firma del docente</div></div>'
        );
      }

      return escribirOriginal(contenido);
    };

    return ventana;
  };
})();