// ==========================================
// AULANFC v3
// FUNCIONES DE UTILIDAD
// ==========================================


// ==========================================
// NORMALIZAR UID
// ==========================================

function normalizarUID_(uid) {
  return String(
    uid || ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /[^0-9A-F]/g,
      ""
    );
}


// ==========================================
// FORMATEAR UID
// ==========================================

function formatearUID_(uid) {
  const limpio =
    normalizarUID_(uid);

  if (!limpio) {
    return "";
  }

  const partes =
    limpio.match(
      /.{1,2}/g
    );

  return partes
    ? partes.join(":")
    : limpio;
}


// ==========================================
// NOMBRE DEL MÓDULO
// ==========================================

function obtenerNombreModulo_(modulo) {
  const nombres = {
    asistencia:
      "Asistencia",

    tareas:
      "Tareas",

    participacion:
      "Participación",

    conducta:
      "Conducta",

    lectura:
      "Lectura"
  };

  return (
    nombres[modulo] ||
    modulo ||
    ""
  );
}


// ==========================================
// LIMPIAR GRUPO
// ==========================================

function limpiarGrupo_(grupo) {
  return String(
    grupo || ""
  )
    .replace(
      /"/g,
      ""
    )
    .trim();
}


// ==========================================
// RESPUESTA JSONP
// ==========================================

function responderJSONP_(
  callback,
  respuesta
) {
  const nombreCallback =
    String(
      callback || ""
    )
      .replace(
        /[^\w.$]/g,
        ""
      );

  const contenido =
    nombreCallback
      ? nombreCallback +
        "(" +
        JSON.stringify(
          respuesta
        ) +
        ");"
      : JSON.stringify(
          respuesta
        );

  return ContentService
    .createTextOutput(
      contenido
    )
    .setMimeType(
      nombreCallback
        ? ContentService
            .MimeType
            .JAVASCRIPT
        : ContentService
            .MimeType
            .JSON
    );
}