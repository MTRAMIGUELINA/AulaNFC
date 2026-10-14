/* AulaNFC - Bitácora Diaria. Etapa 2: pantalla de captura.
 * Vista preliminar sin conexión al servidor. No incluir en index.html
 * hasta incorporar autenticación docente y endpoint seguro.
 */
(() => {
  if (window.AulaNFCBitacoraDiariaVista) return;

  const categorias = [
    'Actividad escolar',
    'Incidente',
    'Observación',
    'Atención a padres de familia',
    'Otro acontecimiento'
  ];

  function fechaLocal() {
    const hoy = new Date();
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    }).format(hoy);
  }

  function horaLocal() {
    return new Intl.DateTimeFormat('es-MX', {
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(new Date());
  }

  function montar(contenedor) {
    if (!contenedor || contenedor.querySelector('#formBitacoraDiaria')) return;
    const vista = document.createElement('section');
    vista.className = 'bitacora-diaria';
    vista.setAttribute('aria-label', 'Bitácora diaria');
    vista.innerHTML = `
      <header class="bitacora-diaria__encabezado">
        <div>
          <h2>📖 Bitácora diaria</h2>
          <p>Registra las actividades, observaciones y acontecimientos de tu jornada escolar.</p>
        </div>
      </header>
      <form id="formBitacoraDiaria" class="bitacora-diaria__formulario">
        <div class="bitacora-diaria__datos">
          <div><span>Fecha</span><strong id="bitacoraFecha"></strong></div>
          <div><span>Hora</span><strong id="bitacoraHora"></strong></div>
          <div><span>Folio</span><strong>Se asignará al guardar</strong></div>
        </div>
        <label for="bitacoraCategoria">Categoría del acontecimiento</label>
        <select id="bitacoraCategoria" required>
          <option value="">Selecciona una categoría</option>
          ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <label for="bitacoraDescripcion">Descripción del acontecimiento</label>
        <textarea id="bitacoraDescripcion" rows="7" maxlength="20000"
          placeholder="Describe lo ocurrido, las actividades realizadas o las observaciones del día..."
          required></textarea>
        <p class="bitacora-diaria__nota">Puedes registrar varios acontecimientos durante el día.</p>
        <div class="bitacora-diaria__acciones">
          <button type="submit" disabled title="Disponible cuando conectemos el módulo con Apps Script">Guardar registro (próximamente)</button>
          <button type="reset" class="bitacora-diaria__secundario">Limpiar</button>
        </div>
        <p id="bitacoraMensaje" role="status" aria-live="polite">
          Vista preliminar: todavía no se guardan datos.
        </p>
      </form>
    `;
    contenedor.appendChild(vista);
    const actualizarHora = () => {
      vista.querySelector('#bitacoraFecha').textContent = fechaLocal();
      vista.querySelector('#bitacoraHora').textContent = horaLocal();
    };
    actualizarHora();
    vista.querySelector('form').addEventListener('submit', e => e.preventDefault());
    return { vista, actualizarHora };
  }

  window.AulaNFCBitacoraDiariaVista = { montar };
})();
