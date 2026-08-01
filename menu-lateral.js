/* Menú lateral de AulaNFC v2.1. Conserva intactas las funciones existentes. */
(() => {
  if (document.getElementById('menuLateral')) return;

  const enlaceEstilos = document.createElement('link');
  enlaceEstilos.rel = 'stylesheet';
  enlaceEstilos.href = 'menu-lateral.css?v=1';
  document.head.appendChild(enlaceEstilos);

  const estructuraMenu = document.createElement('div');
  estructuraMenu.innerHTML = `
    <button
      id="btnMenuLateral"
      class="boton-menu-lateral"
      type="button"
      aria-label="Abrir menú"
      aria-controls="menuLateral"
      aria-expanded="false"
    >☰</button>

    <div id="fondoMenuLateral" class="fondo-menu-lateral" aria-hidden="true"></div>

    <aside
      id="menuLateral"
      class="menu-lateral"
      aria-label="Menú principal de AulaNFC"
      aria-hidden="true"
    >
      <div class="menu-lateral__cabecera">
        <div class="menu-lateral__marca">
          <div class="menu-lateral__logo" aria-hidden="true">📚</div>
          <div>
            <h2 class="menu-lateral__titulo">AulaNFC</h2>
            <span class="menu-lateral__version">Versión 2.1</span>
          </div>
        </div>
        <button
          id="btnCerrarMenuLateral"
          class="menu-lateral__cerrar"
          type="button"
          aria-label="Cerrar menú"
        >✕</button>
      </div>

      <nav class="menu-lateral__navegacion" aria-label="Opciones principales">
        <button id="menuInicio" class="menu-lateral__opcion activa" type="button">
          <span class="menu-lateral__icono" aria-hidden="true">🏠</span>
          <span>Inicio</span>
        </button>

        <button id="menuHistorial" class="menu-lateral__opcion" type="button">
          <span class="menu-lateral__icono" aria-hidden="true">📋</span>
          <span>Historial</span>
        </button>

        <button
          id="menuResumenEstadistico"
          class="menu-lateral__opcion"
          type="button"
          aria-disabled="true"
        >
          <span class="menu-lateral__icono" aria-hidden="true">📊</span>
          <span>Resumen estadístico</span>
          <span class="menu-lateral__etiqueta-proxima">PRÓXIMO</span>
        </button>
      </nav>
    </aside>`;

  while (estructuraMenu.firstChild) {
    document.body.appendChild(estructuraMenu.firstChild);
  }

  const botonAbrir = document.getElementById('btnMenuLateral');
  const botonCerrar = document.getElementById('btnCerrarMenuLateral');
  const menu = document.getElementById('menuLateral');
  const fondo = document.getElementById('fondoMenuLateral');
  const opcionInicio = document.getElementById('menuInicio');
  const opcionHistorial = document.getElementById('menuHistorial');
  const opcionResumen = document.getElementById('menuResumenEstadistico');
  const disparadorHistorial = document.getElementById('btnAbrirHistorial');

  if (disparadorHistorial) {
    disparadorHistorial.classList.add('menu-disparador-oculto');
  }

  function abrirMenu() {
    menu.classList.add('abierto');
    fondo.classList.add('visible');
    document.body.classList.add('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    botonCerrar.focus();
  }

  function cerrarMenu(devolverFoco = true) {
    menu.classList.remove('abierto');
    fondo.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (devolverFoco) botonAbrir.focus();
  }

  function marcarOpcionActiva(opcion) {
    menu.querySelectorAll('.menu-lateral__opcion').forEach((boton) => {
      boton.classList.toggle('activa', boton === opcion);
    });
  }

  botonAbrir.addEventListener('click', () => {
    if (menu.classList.contains('abierto')) cerrarMenu();
    else abrirMenu();
  });

  botonCerrar.addEventListener('click', () => cerrarMenu());
  fondo.addEventListener('click', () => cerrarMenu());

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
      cerrarMenu();
    }
  });

  opcionInicio.addEventListener('click', () => {
    marcarOpcionActiva(opcionInicio);
    cerrarMenu(false);

    const pantallaHistorial = document.getElementById('pantallaHistorial');
    if (pantallaHistorial && !pantallaHistorial.classList.contains('oculto') && disparadorHistorial) {
      disparadorHistorial.click();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  if (disparadorHistorial) {
    opcionHistorial.addEventListener('click', () => {
      marcarOpcionActiva(opcionHistorial);
      cerrarMenu(false);

      const pantallaHistorial = document.getElementById('pantallaHistorial');
      const historialEstaOculto = !pantallaHistorial || pantallaHistorial.classList.contains('oculto');

      if (historialEstaOculto) disparadorHistorial.click();
      else pantallaHistorial.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  opcionResumen.addEventListener('click', (evento) => {
    evento.preventDefault();
    cerrarMenu();
  });
})();
