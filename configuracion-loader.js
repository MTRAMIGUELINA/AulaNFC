(() => {
  if (!document.getElementById('estilosConfiguracionAulaNFC')) {
    const link=document.createElement('link');
    link.id='estilosConfiguracionAulaNFC';
    link.rel='stylesheet';
    link.href='configuracion.css?v=1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-configuracion-aulanfc]')) {
    const script=document.createElement('script');
    script.src='configuracion.js?v=1';
    script.defer=true;
    script.dataset.configuracionAulanfc='true';
    document.body.appendChild(script);
  }
  if (!document.querySelector('script[data-firma-ficha-ajuste]')) {
    const script=document.createElement('script');
    script.src='ficha-pdf-firma-ajuste.js?v=1';
    script.defer=true;
    script.dataset.firmaFichaAjuste='true';
    document.body.appendChild(script);
  }
})();