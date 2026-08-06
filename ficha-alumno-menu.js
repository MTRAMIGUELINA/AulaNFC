/* AulaNFC v2.1 - Opción Ficha del alumno en el menú lateral. */
(() => {
  function agregarBotonFichaAlumno() {
    if (document.getElementById('menuFichaAlumno')) return true;

    const resumen = document.getElementById('menuResumenEstadistico');
    if (!resumen || !resumen.parentElement) return false;

    const boton = document.createElement('button');
    boton.id = 'menuFichaAlumno';
    boton.className = 'menu-lateral__opcion';
    boton.type = 'button';
    boton.innerHTML = `
      <span class="menu-lateral__icono" aria-hidden="true">👤</span>
      <span>Ficha del alumno</span>
    `;

    resumen.insertAdjacentElement('afterend', boton);
    return true;
  }

  if (agregarBotonFichaAlumno()) return;

  const observador = new MutationObserver(() => {
    if (agregarBotonFichaAlumno()) observador.disconnect();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
