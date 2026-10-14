/* AulaNFC: entrada de menú independiente para Bitácora Diaria. */
(() => {
  if (window.__bitacoraDiariaMenuInstalado) return;
  window.__bitacoraDiariaMenuInstalado = true;

  function iniciar() {
    const menu = document.getElementById('menuLateral');
    const contenedor = document.querySelector('.contenedor');
    const modulo = window.AulaNFCBitacoraDiariaVista;
    if (!menu || !contenedor || !modulo) return false;
    if (document.getElementById('menuBitacoraDiaria')) return true;

    const referencia = document.getElementById('menuReporteIncidencias')
      || document.getElementById('menuDashboard')
      || document.getElementById('menuResumenEstadistico');
    if (!referencia?.parentElement) return false;

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.id = 'menuBitacoraDiaria';
    boton.className = 'menu-lateral__opcion';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">📖</span><span>Bitácora Diaria</span>';
    referencia.insertAdjacentElement('afterend', boton);

    const seccion = document.createElement('section');
    seccion.id = 'vistaBitacoraDiaria';
    seccion.className = 'oculto';
    contenedor.appendChild(seccion);
    modulo.montar(seccion);

    function ocultar() { seccion.classList.add('oculto'); }
    document.querySelectorAll('.menu-lateral__opcion').forEach((opcion) => {
      if (opcion !== boton) opcion.addEventListener('click', ocultar);
    });

    boton.addEventListener('click', () => {
      ['vistaEscaner', 'vistaResumenEstadistico', 'vistaFichaAlumno',
       'vistaDashboard', 'vistaReporteIncidencias', 'vistaHistorialIncidencias']
        .forEach(id => document.getElementById(id)?.classList.add('oculto'));
      const historial = document.getElementById('pantallaHistorial');
      if (historial && !historial.classList.contains('oculto')) {
        document.getElementById('btnAbrirHistorial')?.click();
      }
      document.querySelectorAll('.menu-lateral__opcion')
        .forEach(opcion => opcion.classList.toggle('activa', opcion === boton));
      document.getElementById('menuLateral')?.classList.remove('abierto');
      document.getElementById('fondoMenuLateral')?.classList.remove('visible');
      document.body.classList.remove('menu-abierto');
      document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded', 'false');
      document.getElementById('menuLateral')?.setAttribute('aria-hidden', 'true');
      seccion.classList.remove('oculto');
      seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return true;
  }

  if (!iniciar()) {
    const observer = new MutationObserver(() => {
      if (iniciar()) observer.disconnect();
    });
    observer.observe(document.documentElement, {childList: true, subtree: true});
  }
})();
