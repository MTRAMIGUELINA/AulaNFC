(() => {
  if (!document.getElementById('estilosResultadosExamen')) {
    const link = document.createElement('link');
    link.id = 'estilosResultadosExamen';
    link.rel = 'stylesheet';
    link.href = 'resultados-examen.css?v=1';
    document.head.appendChild(link);
  }

  function cargarModuloResultados() {
    if (!document.querySelector('script[data-resultados-examen-modulo]')) {
      const script = document.createElement('script');
      script.src = 'resultados-examen.js?v=2';
      script.defer = true;
      script.dataset.resultadosExamenModulo = 'true';
      document.body.appendChild(script);
    }
  }

  if (!document.querySelector('script[data-resultados-examen-grupo-activo]')) {
    const filtro = document.createElement('script');
    filtro.src = 'resultados-examen-grupo-activo.js?v=1';
    filtro.defer = true;
    filtro.dataset.resultadosExamenGrupoActivo = 'true';
    filtro.onload = cargarModuloResultados;
    document.body.appendChild(filtro);
  } else {
    cargarModuloResultados();
  }
})();
