(() => {
  if (!document.getElementById('estilosResultadosExamen')) {
    const link = document.createElement('link');
    link.id = 'estilosResultadosExamen';
    link.rel = 'stylesheet';
    link.href = 'resultados-examen.css?v=1';
    document.head.appendChild(link);
  }

  if (!document.querySelector('script[data-resultados-examen-modulo]')) {
    const script = document.createElement('script');
    script.src = 'resultados-examen.js?v=3';
    script.defer = true;
    script.dataset.resultadosExamenModulo = 'true';
    document.body.appendChild(script);
  }
})();
