/* AulaNFC - Actualización general de Listas Maestras. */
(() => {
  let actualizando = false;

  function esperarBase() {
    const nav = document.getElementById('menuLateral')?.querySelector('.menu-lateral__navegacion');
    if (!nav || typeof window.solicitarJSONP !== 'function') {
      setTimeout(esperarBase, 120);
      return;
    }
    if (document.getElementById('menuListasMaestras')) return;

    const boton = document.createElement('button');
    boton.id = 'menuListasMaestras';
    boton.type = 'button';
    boton.className = 'menu-lateral__opcion';
    boton.innerHTML = '<span class="menu-lateral__icono" aria-hidden="true">🔄</span><span>Actualizar Listas Maestras</span>';
    nav.appendChild(boton);
    boton.addEventListener('click', actualizarListas);
  }

  function cerrarMenu() {
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded', 'false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden', 'true');
  }

  function mostrarEstado(texto) {
    const estado = document.getElementById('estado');
    if (estado) estado.textContent = texto;
  }

  async function obtenerCicloEscolar() {
    const configuracionLocal = String(window.AULANFC_CONFIGURACION?.CICLO_ESCOLAR || '').trim();
    if (configuracionLocal) return configuracionLocal;

    const respuesta = await window.solicitarJSONP('obtenerconfiguracion');
    if (!respuesta || respuesta.ok === false || respuesta.exito === false) {
      throw new Error(respuesta?.mensaje || 'No fue posible obtener la configuración.');
    }
    const ciclo = String(respuesta.configuracion?.CICLO_ESCOLAR || '').trim();
    if (!ciclo) throw new Error('Configura primero el ciclo escolar en Configuración.');
    window.AULANFC_CONFIGURACION = respuesta.configuracion || {};
    return ciclo;
  }

  async function actualizarListas() {
    if (actualizando) return;
    actualizando = true;
    const boton = document.getElementById('menuListasMaestras');
    if (boton) boton.disabled = true;
    cerrarMenu();
    mostrarEstado('⏳ Actualizando Asistencia, Tareas y Participación...');

    try {
      const cicloEscolar = await obtenerCicloEscolar();
      const respuesta = await window.solicitarJSONP('actualizartodaslistasmaestras', { cicloEscolar });
      if (!respuesta || respuesta.ok === false || respuesta.exito === false) {
        throw new Error(respuesta?.mensaje || 'No fue posible actualizar las Listas Maestras.');
      }
      mostrarEstado(`✅ ${respuesta.mensaje || 'Listas Maestras actualizadas correctamente.'}`);
    } catch (error) {
      mostrarEstado(`❌ ${error?.message || 'No fue posible actualizar las Listas Maestras.'}`);
    } finally {
      actualizando = false;
      if (boton) boton.disabled = false;
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', esperarBase)
    : esperarBase();
})();
