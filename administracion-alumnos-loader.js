(() => {
  if (!document.getElementById('estilosAdministracionAlumnos')) {
    const link=document.createElement('link');
    link.id='estilosAdministracionAlumnos';
    link.rel='stylesheet';
    link.href='administracion-alumnos.css?v=2';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-administracion-alumnos-modulo]')) {
    const script=document.createElement('script');
    script.src='administracion-alumnos.js?v=3';
    script.defer=true;
    script.dataset.administracionAlumnosModulo='true';
    document.body.appendChild(script);
  }
})();