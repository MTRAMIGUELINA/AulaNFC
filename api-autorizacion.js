/* AulaNFC v3.4 - S1-T3 Autorizacion del API */
(() => {
  const CLAVE_CREDENCIAL = 'aulanfc_google_credential';
  const ACCIONES_PUBLICAS = new Set([
    'obtenerconfiglogin',
    'validarlogingoogle'
  ]);

  function obtenerCredencial() {
    return String(
      sessionStorage.getItem(CLAVE_CREDENCIAL) || ''
    ).trim();
  }

  const solicitarJSONPOriginal = window.solicitarJSONP;

  if (typeof solicitarJSONPOriginal !== 'function') {
    console.error('S1-T3: solicitarJSONP no está disponible.');
    return;
  }

  window.solicitarJSONP = function(accion, parametros = {}) {
    const accionNormalizada = String(accion || '').trim().toLowerCase();

    if (ACCIONES_PUBLICAS.has(accionNormalizada)) {
      return solicitarJSONPOriginal(accion, parametros);
    }

    const credential = obtenerCredencial();

    if (!credential) {
      return Promise.reject(
        new Error('Tu sesión no está disponible. Vuelve a iniciar sesión.')
      );
    }

    return solicitarJSONPOriginal(accion, {
      ...parametros,
      credential
    });
  };

  // Las fotografías usan POST directo. Se añade la misma credencial únicamente
  // cuando el destino es el Web App de AulaNFC y el cuerpo es URLSearchParams.
  const fetchOriginal = window.fetch.bind(window);

  window.fetch = function(recurso, opciones = {}) {
    let endpoint = '';

    try {
      endpoint = typeof URL_APPS_SCRIPT !== 'undefined'
        ? String(URL_APPS_SCRIPT || '')
        : '';
    } catch (_) {
      endpoint = '';
    }

    const url = typeof recurso === 'string'
      ? recurso
      : String(recurso && recurso.url || '');
    const metodo = String(opciones && opciones.method || 'GET').toUpperCase();
    const esApiAulaNFC = endpoint && url === endpoint;
    const cuerpo = opciones && opciones.body;

    if (
      esApiAulaNFC &&
      metodo === 'POST' &&
      cuerpo instanceof URLSearchParams
    ) {
      const credential = obtenerCredencial();

      if (!credential) {
        return Promise.reject(
          new Error('Tu sesión no está disponible. Vuelve a iniciar sesión.')
        );
      }

      if (!cuerpo.has('credential')) {
        cuerpo.set('credential', credential);
      }
    }

    return fetchOriginal(recurso, opciones);
  };
})();
