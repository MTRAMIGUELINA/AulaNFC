(() => {
  if (!document.getElementById('estilosAdministracionAlumnos')) {
    const link=document.createElement('link');
    link.id='estilosAdministracionAlumnos';
    link.rel='stylesheet';
    link.href='administracion-alumnos.css?v=2';
    document.head.appendChild(link);
  }

  function cargarExtensionFoto() {
    if (document.querySelector('script[data-administracion-alumnos-foto]')) return;
    const foto=document.createElement('script');
    foto.src='administracion-alumnos-foto.js?v=3';
    foto.defer=true;
    foto.dataset.administracionAlumnosFoto='true';
    document.body.appendChild(foto);
  }

  if (!document.querySelector('script[data-administracion-alumnos-modulo]')) {
    const script=document.createElement('script');
    script.src='administracion-alumnos.js?v=3';
    script.defer=true;
    script.dataset.administracionAlumnosModulo='true';
    script.addEventListener('load', cargarExtensionFoto, { once:true });
    document.body.appendChild(script);
  } else {
    cargarExtensionFoto();
  }
})();