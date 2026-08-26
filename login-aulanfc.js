/* AulaNFC v3.3 - S1-T2 Login e identidad */
(() => {
  const CLAVE_CREDENCIAL = 'aulanfc_google_credential';
  const CLAVE_USUARIO = 'aulanfc_usuario';
  let app = null;
  let pantalla = null;
  let mensaje = null;
  let contenedorGoogle = null;
  let clientId = '';

  function crearEstilos() {
    if (document.getElementById('aulanfc-login-estilos')) return;
    const style = document.createElement('style');
    style.id = 'aulanfc-login-estilos';
    style.textContent = `
      body.aulanfc-sin-acceso { overflow: hidden; }
      #aulanfcLoginPantalla {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        padding: 24px; background: #f4f7fb;
        font-family: Arial, sans-serif;
      }
      #aulanfcLoginPantalla.oculto-login { display: none; }
      .aulanfc-login-tarjeta {
        width: min(100%, 430px); background: #fff; border-radius: 22px;
        padding: 30px 26px; box-shadow: 0 18px 55px rgba(0,0,0,.12);
        text-align: center;
      }
      .aulanfc-login-logo { font-size: 46px; margin-bottom: 8px; }
      .aulanfc-login-tarjeta h1 { margin: 0 0 8px; font-size: 28px; color: #17324d; }
      .aulanfc-login-tarjeta p { margin: 0 0 22px; color: #61758a; line-height: 1.45; }
      #aulanfcLoginGoogle { min-height: 44px; display: flex; justify-content: center; }
      #aulanfcLoginMensaje { margin-top: 18px; min-height: 22px; font-size: 14px; color: #61758a; }
      #aulanfcLoginMensaje.error { color: #b42318; font-weight: 700; }
      #aulanfcLoginMensaje.ok { color: #067647; font-weight: 700; }
      .aulanfc-login-reintentar {
        margin-top: 14px; border: 0; border-radius: 10px; padding: 10px 16px;
        background: #1976d2; color: #fff; font-weight: 700; cursor: pointer;
      }
    `;
    document.head.appendChild(style);
  }

  function crearPantalla() {
    app = document.querySelector('main.contenedor');
    if (app) app.style.display = 'none';
    document.body.classList.add('aulanfc-sin-acceso');

    pantalla = document.createElement('section');
    pantalla.id = 'aulanfcLoginPantalla';
    pantalla.setAttribute('aria-live', 'polite');
    pantalla.innerHTML = `
      <div class="aulanfc-login-tarjeta">
        <div class="aulanfc-login-logo">📚</div>
        <h1>AulaNFC</h1>
        <p>Inicia sesión con la cuenta Google autorizada para acceder a tu aula.</p>
        <div id="aulanfcLoginGoogle"></div>
        <div id="aulanfcLoginMensaje">Comprobando acceso…</div>
      </div>
    `;
    document.body.appendChild(pantalla);
    mensaje = document.getElementById('aulanfcLoginMensaje');
    contenedorGoogle = document.getElementById('aulanfcLoginGoogle');
  }

  function ponerMensaje(texto, tipo = '') {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = tipo;
  }

  function desbloquearApp(usuario) {
    if (usuario) {
      sessionStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    }
    ponerMensaje(`Acceso autorizado${usuario?.nombre ? `: ${usuario.nombre}` : ''}.`, 'ok');

    setTimeout(() => {
      pantalla?.classList.add('oculto-login');
      document.body.classList.remove('aulanfc-sin-acceso');
      if (app) app.style.display = '';
      window.dispatchEvent(new CustomEvent('aulanfc:autorizado', { detail: usuario || null }));
    }, 250);
  }

  function bloquearApp(texto) {
    sessionStorage.removeItem(CLAVE_CREDENCIAL);
    sessionStorage.removeItem(CLAVE_USUARIO);
    if (app) app.style.display = 'none';
    ponerMensaje(texto || 'Esta cuenta no está autorizada para usar AulaNFC.', 'error');
  }

  async function validarCredencial(credential) {
    ponerMensaje('Validando tu cuenta con AulaNFC…');
    try {
      const respuesta = await solicitarJSONP('validarlogingoogle', { credential });
      if (!respuesta?.autorizado || !respuesta?.usuario) {
        bloquearApp(respuesta?.mensaje || 'Esta cuenta no está autorizada para usar AulaNFC.');
        return false;
      }

      sessionStorage.setItem(CLAVE_CREDENCIAL, credential);
      desbloquearApp(respuesta.usuario);
      return true;
    } catch (error) {
      bloquearApp(error?.message || 'No fue posible validar el acceso.');
      return false;
    }
  }

  function cargarGoogleIdentity() {
    return new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const existente = document.querySelector('script[data-google-identity-aulanfc]');
      if (existente) {
        existente.addEventListener('load', resolve, { once: true });
        existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google Identity.')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentityAulanfc = 'true';
      script.onload = resolve;
      script.onerror = () => reject(new Error('No se pudo cargar Google Identity.'));
      document.head.appendChild(script);
    });
  }

  async function mostrarBotonGoogle() {
    try {
      const configuracion = await solicitarJSONP('obtenerconfiglogin');
      clientId = String(configuracion?.clientId || '').trim();

      if (!configuracion?.configurado || !clientId) {
        bloquearApp(configuracion?.mensaje || 'El inicio de sesión con Google todavía no está configurado.');
        return;
      }

      await cargarGoogleIdentity();

      google.accounts.id.initialize({
        client_id: clientId,
        callback: (respuesta) => {
          const credential = String(respuesta?.credential || '').trim();
          if (!credential) {
            bloquearApp('Google no devolvió una credencial válida.');
            return;
          }
          validarCredencial(credential);
        },
        auto_select: false,
        cancel_on_tap_outside: false
      });

      contenedorGoogle.innerHTML = '';
      google.accounts.id.renderButton(contenedorGoogle, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: 320,
        locale: 'es'
      });
      ponerMensaje('Selecciona tu cuenta Google para continuar.');
    } catch (error) {
      bloquearApp(error?.message || 'No fue posible preparar el inicio de sesión.');
    }
  }

  async function iniciar() {
    crearEstilos();
    crearPantalla();

    const guardada = String(sessionStorage.getItem(CLAVE_CREDENCIAL) || '').trim();
    if (guardada) {
      const valida = await validarCredencial(guardada);
      if (valida) return;
    }

    await mostrarBotonGoogle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar, { once: true });
  } else {
    iniciar();
  }
})();
