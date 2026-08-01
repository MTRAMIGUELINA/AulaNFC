/* Menú lateral de AulaNFC v2.1. Conserva intactas las funciones existentes. */
(() => {
  const botonAbrir = document.getElementById('btnMenuLateral');
  const botonCerrar = document.getElementById('btnCerrarMenuLateral');
  const menu = document.getElementById('menuLateral');
  const fondo = document.getElementById('fondoMenuLateral');
  const opcionInicio = document.getElementById('menuInicio');
  const opcionHistorial = document.getElementById('menuHistorial');
  const opcionResumen = document.getElementById('menuResumenEstadistico');
  const disparadorHistorial = document.getElementById('btnAbrirHistorial');

  if (!botonAbrir || !botonCerrar || !menu || !fondo) return;

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
    if (menu.classList.contains('abierto')) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  });

  botonCerrar.addEventListener('click', () => cerrarMenu());
  fondo.addEventListener('click', () => cerrarMenu());

  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape' && menu.classList.contains('abierto')) {
      cerrarMenu();
    }
  });

  if (opcionInicio) {
    opcionInicio.addEventListener('click', () => {
      marcarOpcionActiva(opcionInicio);
      cerrarMenu(false);

      const pantallaHistorial = document.getElementById('pantallaHistorial');
      if (pantallaHistorial && !pantallaHistorial.classList.contains('oculto') && disparadorHistorial) {
        disparadorHistorial.click();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (opcionHistorial && disparadorHistorial) {
    opcionHistorial.addEventListener('click', () => {
      marcarOpcionActiva(opcionHistorial);
      cerrarMenu(false);

      const pantallaHistorial = document.getElementById('pantallaHistorial');
      const historialEstaOculto = !pantallaHistorial || pantallaHistorial.classList.contains('oculto');

      if (historialEstaOculto) {
        disparadorHistorial.click();
      } else if (pantallaHistorial) {
        pantallaHistorial.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (opcionResumen) {
    opcionResumen.addEventListener('click', (evento) => {
      evento.preventDefault();
      cerrarMenu();
    });
  }
})();
