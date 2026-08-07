/* AulaNFC v2.1 - Campo adicional Acciones tomadas para Reporte de incidencias. */
(() => {
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

  if (insertarCampoAcciones()) return;

  const observador = new MutationObserver(() => {
    if (insertarCampoAcciones()) observador.disconnect();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
