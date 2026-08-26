// ==========================================
// AULANFC v3.4
// S1-T3 - AUTORIZACION CENTRAL DEL API
// ==========================================

let AULANFC_CONTEXTO_API_ACTUAL = null;

/**
 * Valida la credencial Google recibida por una solicitud del API y vincula
 * toda la ejecución al usuario autorizado de la base central USUARIOS.
 *
 * Nunca confía en correo, rol, estado ni ID_BASE enviados por el navegador.
 */
function autorizarSolicitudApi_(parametros) {
  const credential = String(parametros && parametros.credential || "").trim();
  const clientId = obtenerGoogleClientId_();

  AULANFC_CONTEXTO_API_ACTUAL = null;

  if (!clientId) {
    return {
      autorizado: false,
      mensaje: "El inicio de sesión con Google no está configurado."
    };
  }

  if (!credential) {
    return {
      autorizado: false,
      mensaje: "Acceso denegado: falta la credencial de identidad."
    };
  }

  let tokenInfo;

  try {
    const respuesta = UrlFetchApp.fetch(
      "https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential),
      { muteHttpExceptions: true }
    );

    if (respuesta.getResponseCode() !== 200) {
      return {
        autorizado: false,
        mensaje: "Acceso denegado: credencial Google no válida."
      };
    }

    tokenInfo = JSON.parse(respuesta.getContentText());
  } catch (error) {
    return {
      autorizado: false,
      mensaje: "No fue posible validar la identidad de la solicitud."
    };
  }

  const audiencia = String(tokenInfo.aud || "").trim();
  const correo = normalizarCorreoUsuario_(tokenInfo.email);
  const correoVerificado =
    tokenInfo.email_verified === true ||
    String(tokenInfo.email_verified || "").toLowerCase() === "true";
  const expiracion = Number(tokenInfo.exp || 0);
  const ahoraSegundos = Math.floor(Date.now() / 1000);

  if (audiencia !== clientId) {
    return {
      autorizado: false,
      mensaje: "Acceso denegado: la credencial no pertenece a AulaNFC."
    };
  }

  if (!correo || !correoVerificado) {
    return {
      autorizado: false,
      mensaje: "Acceso denegado: Google no confirmó un correo válido."
    };
  }

  if (!expiracion || expiracion <= ahoraSegundos) {
    return {
      autorizado: false,
      mensaje: "La sesión expiró. Vuelve a iniciar sesión."
    };
  }

  const resultado = obtenerUsuarioCentralAutorizadoPorCorreo_(correo);

  if (!resultado || !resultado.autorizado || !resultado.usuario) {
    return {
      autorizado: false,
      mensaje: resultado && resultado.mensaje
        ? resultado.mensaje
        : "Esta cuenta no está autorizada para usar AulaNFC."
    };
  }

  const usuario = resultado.usuario;
  const rol = String(usuario.rol || "").trim().toUpperCase();
  const idBase = String(usuario.idBase || "").trim();

  if (rol !== AULANFC_ROL_ADMIN && rol !== AULANFC_ROL_DOCENTE) {
    return {
      autorizado: false,
      mensaje: "Acceso denegado: el rol del usuario no tiene permisos."
    };
  }

  if (!idBase) {
    return {
      autorizado: false,
      mensaje: "Acceso denegado: el usuario no tiene una base asignada."
    };
  }

  AULANFC_CONTEXTO_API_ACTUAL = {
    autorizado: true,
    usuario: {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: rol,
      estado: usuario.estado,
      idBase: idBase,
      idCarpetaFotos: String(usuario.idCarpetaFotos || "").trim()
    }
  };

  return AULANFC_CONTEXTO_API_ACTUAL;
}

function obtenerContextoApiActual_() {
  return AULANFC_CONTEXTO_API_ACTUAL;
}

function responderAccesoApiDenegado_(parametros, autorizacion) {
  return responderJSONP_(parametros && parametros.callback, {
    ok: false,
    exito: false,
    autorizado: false,
    codigo: "API_NO_AUTORIZADO",
    mensaje: autorizacion && autorizacion.mensaje
      ? autorizacion.mensaje
      : "Acceso no autorizado."
  });
}

function responderPostAccesoApiDenegado_(autorizacion) {
  return ContentService
    .createTextOutput(JSON.stringify({
      ok: false,
      exito: false,
      autorizado: false,
      codigo: "API_NO_AUTORIZADO",
      mensaje: autorizacion && autorizacion.mensaje
        ? autorizacion.mensaje
        : "Acceso no autorizado."
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
