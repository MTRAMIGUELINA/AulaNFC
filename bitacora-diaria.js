/* AulaNFC - Bitácora Diaria. Etapa 3: formulario con guardado por API.
 * Requiere cargar solicitarJSONP y publicar la API actualizada.
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
    if (!document.getElementById('estilosBitacoraDiaria')) {
      const estilo = document.createElement('link');
      estilo.id = 'estilosBitacoraDiaria';
      estilo.rel = 'stylesheet';
      estilo.href = 'bitacora-diaria.css?v=1';
      document.head.appendChild(estilo);
    }
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
          <button type="submit">Guardar registro</button>
          <button type="reset" class="bitacora-diaria__secundario">Limpiar</button>
        </div>
        <p id="bitacoraMensaje" role="status" aria-live="polite">
          Completa los campos y guarda el acontecimiento.
        </p>
      </form>
    `;
    contenedor.appendChild(vista);
    const actualizarHora = () => {
      vista.querySelector('#bitacoraFecha').textContent = fechaLocal();
      vista.querySelector('#bitacoraHora').textContent = horaLocal();
    };
    actualizarHora();
    const formulario = vista.querySelector('form');
    const boton = formulario.querySelector('button[type="submit"]');
    const mensaje = vista.querySelector('#bitacoraMensaje');
    formulario.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (boton.disabled) return;
      const categoria = vista.querySelector('#bitacoraCategoria').value.trim();
      const descripcion = vista.querySelector('#bitacoraDescripcion').value.trim();
      if (!categoria || !descripcion) {
        mensaje.textContent = 'Selecciona una categoría y escribe la descripción.';
        return;
      }
      if (typeof window.solicitarJSONP !== 'function') {
        mensaje.textContent = 'No está disponible la conexión con AulaNFC.';
        return;
      }
      boton.disabled = true;
      boton.textContent = 'Guardando...';
      mensaje.textContent = 'Enviando registro...';
      try {
        const respuesta = await window.solicitarJSONP('guardarbitacoradiaria', {
          categoria, descripcion
        });
        if (!respuesta || !respuesta.ok) {
          throw new Error(respuesta?.mensaje || 'No se pudo guardar el registro.');
        }
        mensaje.textContent = 'Registro guardado: ' + respuesta.folio
          + ' (' + respuesta.fecha + ' ' + respuesta.hora + ').';
        formulario.reset();
        actualizarHora();
      } catch (error) {
        mensaje.textContent = error?.message || 'Error al guardar el registro.';
      } finally {
        boton.disabled = false;
        boton.textContent = 'Guardar registro';
      }
    });
    return { vista, actualizarHora };
  }

  window.AulaNFCBitacoraDiariaVista = { montar };
})();
