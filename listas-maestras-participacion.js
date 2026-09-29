/* AulaNFC - Actualización manual de listas maestras de Participación. */
(() => {
  if (document.getElementById('btnListasMaestrasParticipacion')) return;

  function instalar() {
    const nav = document.querySelector('.menu-lateral__navegacion');
    if (!nav || document.getElementById('btnListasMaestrasParticipacion')) return false;

    const boton = document.createElement('button');
    boton.id = 'btnListasMaestrasParticipacion';
    boton.className = 'menu-lateral__opcion';
    boton.type = 'button';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">📑</span><span>Actualizar Listas Maestras</span>';
    nav.appendChild(boton);

    boton.addEventListener('click', async () => {
      if (typeof window.solicitarJSONP !== 'function') return;
      const ciclo = window.prompt('Ciclo escolar para actualizar las listas maestras:', '2026-2027');
      if (ciclo === null) return;
      const cicloEscolar = String(ciclo || '').trim();
      if (!/^\d{4}-\d{4}$/.test(cicloEscolar)) {
        window.alert('Escribe el ciclo escolar con el formato 2026-2027.');
        return;
      }

      const textoOriginal = boton.innerHTML;
      boton.disabled = true;
      boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">⏳</span><span>Actualizando...</span>';
      try {
        const respuesta = await window.solicitarJSONP('actualizarListasMaestrasParticipacion', { cicloEscolar });
        if (typeof window.validarRespuesta === 'function') window.validarRespuesta(respuesta);
        const hojas = Array.isArray(respuesta.hojas) ? respuesta.hojas : [];
        const actividades = hojas.reduce((total, item) => total + Number(item.actividades || 0), 0);
        const advertencias = hojas.reduce((total, item) => total + Number(item.advertencias || 0), 0);
        let mensaje = `Listas maestras actualizadas.\nAlumnos: ${respuesta.alumnos || 0}\nActividades: ${actividades}`;
        if (advertencias) mensaje += `\nAdvertencia: ${advertencias} registro(s) sin ciclo escolar fueron excluidos.`;
        window.alert(mensaje);
      } catch (error) {
        window.alert(error && error.message ? error.message : 'No fue posible actualizar las listas maestras.');
      } finally {
        boton.disabled = false;
        boton.innerHTML = textoOriginal;
      }
    });
    return true;
  }

  if (instalar()) return;
  const observador = new MutationObserver(() => {
    if (instalar()) observador.disconnect();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true });
})();
