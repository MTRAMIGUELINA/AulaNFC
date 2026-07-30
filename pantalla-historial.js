(() => {
  const botonAbrir = document.getElementById('btnAbrirHistorial');
  const botonCerrar = document.getElementById('btnCerrarHistorial');
  const pantalla = document.getElementById('pantallaHistorial');

  if (!botonAbrir || !botonCerrar || !pantalla) return;

  function abrirHistorial() {
    pantalla.classList.remove('oculto');
    botonAbrir.setAttribute('aria-expanded', 'true');
    botonAbrir.textContent = '📚 OCULTAR HISTORIAL';
    pantalla.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function cerrarHistorial() {
    pantalla.classList.add('oculto');
    botonAbrir.setAttribute('aria-expanded', 'false');
    botonAbrir.textContent = '📚 HISTORIAL';

    const vistaBuscar = document.getElementById('vistaBuscar');
    const resultado = document.getElementById('resultadoConsultaHistorial');
    const lista = document.getElementById('listaHistorialGeneral');
    const desplegar = document.getElementById('btnDesplegarLista');

    if (vistaBuscar) vistaBuscar.classList.add('oculto');
    if (resultado) resultado.classList.add('oculto');
    if (lista) lista.classList.add('oculto');
    if (desplegar) desplegar.classList.add('oculto');
  }

  botonAbrir.addEventListener('click', () => {
    if (pantalla.classList.contains('oculto')) {
      abrirHistorial();
    } else {
      cerrarHistorial();
    }
  });

  botonCerrar.addEventListener('click', cerrarHistorial);
})();