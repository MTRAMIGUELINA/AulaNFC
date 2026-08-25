// ==========================================
// AULANFC v3.3
// S1-T2 - LOGIN CON GOOGLE IDENTITY SERVICES
// ==========================================

const AULANFC_PROP_GOOGLE_CLIENT_ID = "AULANFC_GOOGLE_CLIENT_ID";

function obtenerGoogleClientId_() {
  return String(
    PropertiesService.getScriptProperties().getProperty(AULANFC_PROP_GOOGLE_CLIENT_ID) || ""
  ).trim();
}

/**
 * Configuración pública mínima necesaria para renderizar Google Identity Services.
 * El Client ID OAuth no es un secreto.
 */
function obtenerConfiguracionLoginGoogleWeb_(parametros) {
  const clientId = obtenerGoogleClientId_();

  return responderJSONP_(parametros && parametros.callback, {
    ok: !!clientId,
    exito: !!clientId,
    configurado: !!clientId,
    clientId: clientId,
    mensaje: clientId
      ? "Inicio de sesión con Google configurado."
      : "Falta configurar AULANFC_GOOGLE_CLIENT_ID en Propiedades del script."
  });
}

/**
 * Valida un ID token emitido por Google Identity Services y después comprueba
 * que el correo pertenezca a un usuario ACTIVO registrado en AulaNFC.
 *
 * IMPORTANTE: no confía en el correo enviado por el navegador; el correo se
 * obtiene exclusivamente del token validado por Google.
 */
function validarLoginGoogleWeb_(parametros) {
  const callback = parametros && parametros.callback;
  const credential = String(parametros && parametros.credential || "").trim();
  const clientId = obtenerGoogleClientId_();

  if (!clientId) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "El inicio de sesión con Google todavía no está configurado."
    });
  }

  if (!credential) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "No se recibió la credencial de Google."
    });
  }

  let tokenInfo;

  try {
    const respuesta = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential),
      { muteHttpExceptions: true }
    );

    if (respuesta.getResponseCode() !== 200) {
      throw new Error("Google rechazó la credencial recibida.");
    }

    tokenInfo = JSON.parse(respuesta.getContentText());
  } catch (error) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "No fue posible validar la identidad con Google.",
      error: error && error.message ? error.message : String(error)
    });
  }

  const audiencia = String(tokenInfo.aud || "").trim();
  const correo = normalizarCorreoUsuario_(tokenInfo.email);
  const correoVerificado =
    tokenInfo.email_verified === true ||
    String(tokenInfo.email_verified || "").toLowerCase() === "true";
  const expiracion = Number(tokenInfo.exp || 0);
  const ahoraSegundos = Math.floor(Date.now() / 1000);

  if (audiencia !== clientId) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La credencial de Google no pertenece a AulaNFC."
    });
  }

  if (!correo || !correoVerificado) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "Google no confirmó un correo válido para esta cuenta."
    });
  }

  if (!expiracion || expiracion <= ahoraSegundos) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La sesión de Google ya expiró. Vuelve a iniciar sesión."
    });
  }

  const resultado = obtenerUsuarioCentralAutorizadoPorCorreo_(correo);

  if (!resultado || !resultado.autorizado || !resultado.usuario) {
    return responderJSONP_(callback, {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: resultado && resultado.mensaje
        ? resultado.mensaje
        : "Esta cuenta no está autorizada para usar AulaNFC."
    });
  }

  actualizarUltimoAccesoUsuario_(resultado.usuario);

  return responderJSONP_(callback, {
    ok: true,
    exito: true,
    autorizado: true,
    mensaje: "Acceso autorizado.",
    usuario: {
      idUsuario: resultado.usuario.idUsuario,
      correo: resultado.usuario.correo,
      nombre: resultado.usuario.nombre,
      rol: resultado.usuario.rol,
      estado: resultado.usuario.estado
    }
  });
}

function actualizarUltimoAccesoUsuario_(usuario) {
  if (!usuario || !usuario.fila) return;

  try {
    const libro = obtenerLibroCentralUsuarios_();
    const hoja = asegurarHojaUsuarios_(libro);
    hoja.getRange(Number(usuario.fila), 9).setValue(new Date());
  } catch (error) {
    console.warn("No fue posible actualizar ULTIMO_ACCESO:", error);
  }
}
