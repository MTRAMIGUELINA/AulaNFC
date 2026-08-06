/* AulaNFC v2.1 - Botón y vista visual del Dashboard diario. */
(() => {
  function cargarEstiloDashboard() {
    if (document.getElementById('estilosDashboard')) return;
    const enlace = document.createElement('link');
    enlace.id = 'estilosDashboard';
    enlace.rel = 'stylesheet';
    enlace.href = 'dashboard.css?v=1';
    document.head.appendChild(enlace);
  }

  function fechaVisible() {
    return new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  function agregarBotonDashboard() {
    if (document.getElementById('menuDashboard')) return true;

    const ficha = document.getElementById('menuFichaAlumno');
    const resumen = document.getElementById('menuResumenEstadistico');
    const referencia = ficha || resumen;
    if (!referencia || !referencia.parentElement) return false;

    const boton = document.createElement('button');
    boton.id = 'menuDashboard';
    boton.className = 'menu-lateral__opcion';
    boton.type = 'button';
    boton.innerHTML = `
      <span class="menu-lateral__icono" aria-hidden="true">📈</span>
      <span>Dashboard</span>
    `;

    referencia.insertAdjacentElement('afterend', boton);
    return true;
  }

  function crearVistaDashboard() {
    if (document.getElementById('vistaDashboard')) return true;

    const contenedor = document.querySelector('.contenedor');
    const vistaEscaner = document.getElementById('vistaEscaner');
    if (!contenedor) return false;

    const vista = document.createElement('section');
    vista.id = 'vistaDashboard';
    vista.className = 'vista-dashboard oculto';
    vista.innerHTML = `
      <header class="dashboard__cabecera">
        <div>
          <h2>📈 Dashboard</h2>
          <p>Seguimiento rápido del grupo durante la jornada.</p>
        </div>
        <button id="btnCerrarDashboard" class="dashboard__cerrar" type="button" aria-label="Cerrar Dashboard">✕</button>
      </header>

      <p class="dashboard__fecha">Hoy: ${fechaVisible()}</p>

      <section class="dashboard__rejilla">
        <button class="dashboard__tarjeta dashboard__tarjeta--presentes" type="button" data-dashboard-detalle="presentes">
          <span>🟢 Presentes hoy</span>
          <strong id="dashboardPresentes">0</strong>
          <small>Toca para ver la lista</small>
        </button>

        <button class="dashboard__tarjeta dashboard__tarjeta--faltantes" type="button" data-dashboard-detalle="faltantes">
          <span>🔴 Faltantes hoy</span>
          <strong id="dashboardFaltantes">0</strong>
          <small>Toca para ver la lista</small>
        </button>

        <button class="dashboard__tarjeta dashboard__tarjeta--participacion" type="button" data-dashboard-detalle="participacion">
          <span>🔵 Sin participación hoy</span>
          <strong id="dashboardSinParticipacion">0</strong>
          <small>Toca para ver la lista</small>
        </button>

        <button class="dashboard__tarjeta dashboard__tarjeta--tareas" type="button" data-dashboard-detalle="tareas">
          <span>🟡 No cumplieron con tareas</span>
          <strong id="dashboardTareasPendientes">0</strong>
          <small>No entregó o incompleta</small>
        </button>
      </section>

      <section id="detalleDashboard" class="dashboard__detalle oculto" aria-live="polite">
        <h3 id="tituloDetalleDashboard">Detalle</h3>
        <div id="listaDetalleDashboard" class="dashboard__lista">
          <div class="dashboard__alumno">La lista se conectará con Apps Script en la siguiente fase.</div>
        </div>
      </section>

      <p class="dashboard__aviso">Vista preparada. Los valores del día se conectarán con los registros reales en la siguiente fase.</p>
    `;

    if (vistaEscaner) contenedor.insertBefore(vista, vistaEscaner);
    else contenedor.appendChild(vista);

    return true;
  }

  function ocultarOtrasVistas() {
    ['vistaResumenEstadistico', 'vistaFichaAlumno', 'vistaEscaner'].forEach((id) => {
      document.getElementById(id)?.classList.add('oculto');
    });

    const pantallaHistorial = document.getElementById('pantallaHistorial');
    const disparadorHistorial = document.getElementById('btnAbrirHistorial');
    if (pantallaHistorial && !pantallaHistorial.classList.contains('oculto') && disparadorHistorial) {
      disparadorHistorial.click();
    }
  }

  function cerrarMenuVisualmente() {
    document.getElementById('menuLateral')?.classList.remove('abierto');
    document.getElementById('fondoMenuLateral')?.classList.remove('visible');
    document.body.classList.remove('menu-abierto');
    document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded', 'false');
    document.getElementById('menuLateral')?.setAttribute('aria-hidden', 'true');
  }

  function mostrarDashboard() {
    ocultarOtrasVistas();
    const vista = document.getElementById('vistaDashboard');
    if (!vista) return;
    vista.classList.remove('oculto');
    vista.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function ocultarDashboard() {
    document.getElementById('vistaDashboard')?.classList.add('oculto');
  }

  function volverInicio() {
    ocultarDashboard();
    document.getElementById('vistaEscaner')?.classList.remove('oculto');
    document.querySelectorAll('.menu-lateral__opcion').forEach((opcion) => {
      opcion.classList.toggle('activa', opcion.id === 'menuInicio');
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function mostrarDetalle(tipo) {
    const titulos = {
      presentes: '🟢 Presentes hoy',
      faltantes: '🔴 Faltantes hoy',
      participacion: '🔵 Alumnos sin participación hoy',
      tareas: '🟡 Alumnos que no cumplieron con tareas'
    };

    document.getElementById('tituloDetalleDashboard').textContent = titulos[tipo] || 'Detalle';
    document.getElementById('listaDetalleDashboard').innerHTML =
      '<div class="dashboard__alumno">La lista se conectará con Apps Script en la siguiente fase.</div>';
    document.getElementById('detalleDashboard').classList.remove('oculto');
    document.getElementById('detalleDashboard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function inicializarDashboard() {
    cargarEstiloDashboard();
    if (!agregarBotonDashboard() || !crearVistaDashboard()) return false;

    const boton = document.getElementById('menuDashboard');
    if (boton.dataset.dashboardInicializado === 'true') return true;
    boton.dataset.dashboardInicializado = 'true';

    boton.addEventListener('click', () => {
      document.querySelectorAll('.menu-lateral__opcion').forEach((opcion) => {
        opcion.classList.toggle('activa', opcion === boton);
      });
      cerrarMenuVisualmente();
      mostrarDashboard();
    });

    document.getElementById('btnCerrarDashboard').addEventListener('click', volverInicio);

    document.querySelectorAll('[data-dashboard-detalle]').forEach((tarjeta) => {
      tarjeta.addEventListener('click', () => mostrarDetalle(tarjeta.dataset.dashboardDetalle));
    });

    ['menuInicio', 'menuHistorial', 'menuResumenEstadistico', 'menuFichaAlumno'].forEach((id) => {
      document.getElementById(id)?.addEventListener('click', ocultarDashboard);
    });

    return true;
  }

  if (inicializarDashboard()) return;

  const observador = new MutationObserver(() => {
    if (inicializarDashboard()) observador.disconnect();
  });

  observador.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
