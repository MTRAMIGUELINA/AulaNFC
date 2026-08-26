/* AulaNFC v3.4 - S1-T3 Autorizacion del API */
(() => {
  const CLAVE_CREDENCIAL = 'aulanfc_google_credential';
  const ACCIONES_PUBLICAS = new Set([
    'obtenerconfiglogin',
    'validarlogingoogle'
  ]);

  const original = window.solicitarJSONP;

  if (typeof original !== 'function') {
    console.error('S1-T3: solicitarJSONP no está disponible.');
    return;
  }

  window.solicitarJSONP = function(accion, parametros = {}) {
    const accionNormalizada = String(accion || '').trim().toLowerCase();

    if (ACCIONES_PUBLICAS.has(accionNormalizada)) {
      return original(accion, parametros);
    }

    const credential = String(
      sessionStorage.getItem(CLAVE_CREDENCIAL) || ''
    ).trim();

    if (!credential) {
      return Promise.reject(
        new Error('Tu sesión no está disponible. Vuelve a iniciar sesión.')
      );
    }

    return original(accion, {
      ...parametros,
      credential
    });
  };
})();
