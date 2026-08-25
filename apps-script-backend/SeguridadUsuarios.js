// ==========================================
// AULANFC v3.2
// S1-T2 - INFRAESTRUCTURA CENTRAL DE USUARIOS
// ==========================================

const AULANFC_PROP_ID_BASE_CENTRAL = "AULANFC_ID_BASE_CENTRAL";
const AULANFC_HOJA_USUARIOS = "USUARIOS";

const AULANFC_ROL_ADMIN = "ADMIN";
const AULANFC_ROL_DOCENTE = "DOCENTE";

const AULANFC_ESTADO_ACTIVO = "ACTIVO";
const AULANFC_ESTADO_INACTIVO = "INACTIVO";

const AULANFC_ENCABEZADOS_USUARIOS = [
  "ID_USUARIO",
  "CORREO",
  "NOMBRE",
  "ROL",
  "ESTADO",
  "ID_BASE",
  "ID_CARPETA_FOTOS",
  "FECHA_ALTA",
  "ULTIMO_ACCESO"
];

// ==========================================
// INICIALIZACIÓN MANUAL
// ==========================================

/**
 * Crea, si hace falta, la pequeña base central de usuarios de AulaNFC
 * y registra al propietario que ejecuta esta función como ADMIN.
 *
 * IMPORTANTE:
 * - Esta función NO se expone por doGet.
 * - Debe ejecutarse manualmente desde Apps Script por el propietario.
 * - No cambia todavía el funcionamiento de los módulos existentes.
 *
 * @param {string=} nombreAdministrador
 * @return {Object}
 */
function inicializarSeguridadUsuarios_(nombreAdministrador) {
  const properties = PropertiesService.getScriptProperties();
  let idBaseCentral = String(
    properties.getProperty(AULANFC_PROP_ID_BASE_CENTRAL) || ""
  ).trim();

  let libroCentral;

  if (idBaseCentral) {
    libroCentral = SpreadsheetApp.openById(idBaseCentral);
  } else {
    libroCentral = SpreadsheetApp.create("AulaNFC - Usuarios");
    idBaseCentral = libroCentral.getId();
    properties.setProperty(AULANFC_PROP_ID_BASE_CENTRAL, idBaseCentral);
  }

  const hojaUsuarios = asegurarHojaUsuarios_(libroCentral);
  const correoAdministrador = String(
    Session.getEffectiveUser().getEmail() || ""
  ).trim().toLowerCase();

  if (!correoAdministrador) {
    throw new Error(
      "No fue posible obtener el correo de la cuenta que ejecuta la inicialización."
    );
  }

  const nombre = String(nombreAdministrador || "Administrador").trim();

  const usuario = guardarUsuarioCentral_({
    correo: correoAdministrador,
    nombre: nombre,
    rol: AULANFC_ROL_ADMIN,
    estado: AULANFC_ESTADO_ACTIVO,
    idBase: String(ID_HOJA_CALCULO || "").trim(),
    idCarpetaFotos: ""
  }, hojaUsuarios);

  return {
    ok: true,
    exito: true,
    mensaje: "Infraestructura central de usuarios inicializada correctamente.",
    idBaseCentral: idBaseCentral,
    usuario: usuario
  };
}

// ==========================================
// ACCESO A LA BASE CENTRAL
// ==========================================

function obtenerIdBaseCentralUsuarios_() {
  return String(
    PropertiesService
      .getScriptProperties()
      .getProperty(AULANFC_PROP_ID_BASE_CENTRAL) || ""
  ).trim();
}

function obtenerLibroCentralUsuarios_() {
  const idBaseCentral = obtenerIdBaseCentralUsuarios_();

  if (!idBaseCentral) {
    throw new Error(
      "La base central de usuarios todavía no ha sido inicializada."
    );
  }

  return SpreadsheetApp.openById(idBaseCentral);
}

function asegurarHojaUsuarios_(libroCentral) {
  let hoja = libroCentral.getSheetByName(AULANFC_HOJA_USUARIOS);

  if (!hoja) {
    hoja = libroCentral.insertSheet(AULANFC_HOJA_USUARIOS);
  }

  if (hoja.getLastRow() === 0) {
    hoja.appendRow(AULANFC_ENCABEZADOS_USUARIOS);
  } else {
    const encabezadosActuales = hoja
      .getRange(1, 1, 1, AULANFC_ENCABEZADOS_USUARIOS.length)
      .getDisplayValues()[0]
      .map(function(valor) {
        return String(valor || "").trim().toUpperCase();
      });

    const encabezadosEsperados = AULANFC_ENCABEZADOS_USUARIOS.map(
      function(valor) {
        return String(valor).toUpperCase();
      }
    );

    const coinciden = encabezadosEsperados.every(function(valor, indice) {
      return encabezadosActuales[indice] === valor;
    });

    if (!coinciden) {
      throw new Error(
        "La hoja USUARIOS existe, pero sus encabezados no coinciden con la estructura esperada."
      );
    }
  }

  hoja.setFrozenRows(1);
  return hoja;
}

// ==========================================
// RESOLUCIÓN DEL USUARIO ACTUAL - S1-T2-B
// ==========================================

function obtenerContextoUsuarioActual_() {
  const correo = normalizarCorreoUsuario_(
    Session.getEffectiveUser().getEmail()
  );

  if (!correo) {
    return {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "No fue posible identificar la cuenta Google actual.",
      usuario: null
    };
  }

  const resultado = obtenerUsuarioCentralAutorizadoPorCorreo_(correo);

  if (!resultado.autorizado || !resultado.usuario) {
    return resultado;
  }

  const usuario = resultado.usuario;

  return {
    ok: true,
    exito: true,
    autorizado: true,
    mensaje: "Usuario actual autorizado.",
    usuario: {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
      estado: usuario.estado,
      idBase: usuario.idBase,
      idCarpetaFotos: usuario.idCarpetaFotos
    }
  };
}

// ==========================================
// APERTURA DE BASE AUTORIZADA - S1-T2-C
// ==========================================

/**
 * Abre exclusivamente la base asignada al usuario actual autorizado.
 * Por ahora no sustituye ningún acceso existente de AulaNFC.
 *
 * @return {{contexto:Object, libro:GoogleAppsScript.Spreadsheet.Spreadsheet}}
 */
function obtenerLibroUsuarioActual_() {
  const contexto = obtenerContextoUsuarioActual_();

  if (!contexto || !contexto.autorizado || !contexto.usuario) {
    throw new Error(
      contexto && contexto.mensaje
        ? contexto.mensaje
        : "No fue posible autorizar al usuario actual."
    );
  }

  const idBase = String(contexto.usuario.idBase || "").trim();

  if (!idBase) {
    throw new Error("El usuario actual no tiene una base asignada.");
  }

  const libro = SpreadsheetApp.openById(idBase);

  return {
    contexto: contexto,
    libro: libro
  };
}

/**
 * Diagnóstico aislado: abre la base autorizada y devuelve metadatos
 * suficientes para comprobar que corresponde a la base configurada.
 * No escribe ni modifica la hoja.
 *
 * @return {Object}
 */
function diagnosticarLibroUsuarioActual_() {
  const acceso = obtenerLibroUsuarioActual_();
  const libro = acceso.libro;
  const contexto = acceso.contexto;

  return {
    ok: true,
    exito: true,
    autorizado: true,
    mensaje: "Base del usuario actual abierta correctamente.",
    usuario: {
      idUsuario: contexto.usuario.idUsuario,
      nombre: contexto.usuario.nombre,
      rol: contexto.usuario.rol
    },
    base: {
      id: libro.getId(),
      nombre: libro.getName(),
      coincideConBaseAsignada:
        libro.getId() === String(contexto.usuario.idBase || "").trim()
    }
  };
}

// ==========================================
// CONSULTA DE USUARIOS
// ==========================================

function buscarUsuarioCentralPorCorreo_(correo) {
  const correoNormalizado = normalizarCorreoUsuario_(correo);

  if (!correoNormalizado) {
    return null;
  }

  const libroCentral = obtenerLibroCentralUsuarios_();
  const hoja = asegurarHojaUsuarios_(libroCentral);
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  const datos = hoja
    .getRange(2, 1, ultimaFila - 1, AULANFC_ENCABEZADOS_USUARIOS.length)
    .getValues();

  for (let indice = 0; indice < datos.length; indice += 1) {
    const usuario = filaAUsuarioCentral_(datos[indice], indice + 2);

    if (normalizarCorreoUsuario_(usuario.correo) === correoNormalizado) {
      return usuario;
    }
  }

  return null;
}

function obtenerUsuarioCentralAutorizadoPorCorreo_(correo) {
  const usuario = buscarUsuarioCentralPorCorreo_(correo);

  if (!usuario) {
    return {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La cuenta no está registrada en AulaNFC.",
      usuario: null
    };
  }

  if (usuario.estado !== AULANFC_ESTADO_ACTIVO) {
    return {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La cuenta está inactiva en AulaNFC.",
      usuario: usuario
    };
  }

  if (
    usuario.rol !== AULANFC_ROL_ADMIN &&
    usuario.rol !== AULANFC_ROL_DOCENTE
  ) {
    return {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La cuenta no tiene un rol válido en AulaNFC.",
      usuario: usuario
    };
  }

  if (!usuario.idBase) {
    return {
      ok: false,
      exito: false,
      autorizado: false,
      mensaje: "La cuenta no tiene una base de datos asignada.",
      usuario: usuario
    };
  }

  return {
    ok: true,
    exito: true,
    autorizado: true,
    mensaje: "Usuario autorizado.",
    usuario: usuario
  };
}

// ==========================================
// ALTA / ACTUALIZACIÓN INTERNA DE USUARIOS
// ==========================================

function guardarUsuarioCentral_(datosUsuario, hojaUsuarios) {
  const libroCentral = hojaUsuarios
    ? hojaUsuarios.getParent()
    : obtenerLibroCentralUsuarios_();

  const hoja = hojaUsuarios || asegurarHojaUsuarios_(libroCentral);
  const correo = normalizarCorreoUsuario_(datosUsuario && datosUsuario.correo);
  const nombre = String(datosUsuario && datosUsuario.nombre || "").trim();
  const rol = String(datosUsuario && datosUsuario.rol || "").trim().toUpperCase();
  const estado = String(datosUsuario && datosUsuario.estado || "")
    .trim()
    .toUpperCase();
  const idBase = String(datosUsuario && datosUsuario.idBase || "").trim();
  const idCarpetaFotos = String(
    datosUsuario && datosUsuario.idCarpetaFotos || ""
  ).trim();

  if (!correo) throw new Error("El correo del usuario es obligatorio.");
  if (rol !== AULANFC_ROL_ADMIN && rol !== AULANFC_ROL_DOCENTE) {
    throw new Error("El rol del usuario no es válido.");
  }
  if (estado !== AULANFC_ESTADO_ACTIVO && estado !== AULANFC_ESTADO_INACTIVO) {
    throw new Error("El estado del usuario no es válido.");
  }
  if (!idBase) throw new Error("El usuario debe tener una base de datos asignada.");

  const existente = buscarUsuarioEnHojaPorCorreo_(hoja, correo);
  const ahora = new Date();

  if (existente) {
    hoja.getRange(existente.fila, 2, 1, 6).setValues([[
      correo, nombre, rol, estado, idBase, idCarpetaFotos
    ]]);
    SpreadsheetApp.flush();
    return filaAUsuarioCentral_(
      hoja.getRange(
        existente.fila, 1, 1, AULANFC_ENCABEZADOS_USUARIOS.length
      ).getValues()[0],
      existente.fila
    );
  }

  const idUsuario = generarSiguienteIdUsuario_(hoja);
  hoja.appendRow([
    idUsuario, correo, nombre, rol, estado, idBase,
    idCarpetaFotos, ahora, ""
  ]);
  SpreadsheetApp.flush();

  return {
    fila: hoja.getLastRow(), idUsuario: idUsuario, correo: correo,
    nombre: nombre, rol: rol, estado: estado, idBase: idBase,
    idCarpetaFotos: idCarpetaFotos, fechaAlta: ahora, ultimoAcceso: ""
  };
}

function buscarUsuarioEnHojaPorCorreo_(hoja, correo) {
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return null;

  const correos = hoja.getRange(2, 2, ultimaFila - 1, 1)
    .getDisplayValues().flat();

  for (let indice = 0; indice < correos.length; indice += 1) {
    if (normalizarCorreoUsuario_(correos[indice]) === correo) {
      return { fila: indice + 2 };
    }
  }
  return null;
}

function generarSiguienteIdUsuario_(hoja) {
  const ultimaFila = hoja.getLastRow();
  if (ultimaFila < 2) return "USR-0001";

  const ids = hoja.getRange(2, 1, ultimaFila - 1, 1)
    .getDisplayValues().flat().map(function(valor) {
      const coincidencia = String(valor || "").trim().toUpperCase()
        .match(/^USR-(\d+)$/);
      return coincidencia ? Number(coincidencia[1]) : 0;
    });

  const siguiente = Math.max.apply(null, ids.concat([0])) + 1;
  return "USR-" + String(siguiente).padStart(4, "0");
}

function normalizarCorreoUsuario_(correo) {
  return String(correo || "").trim().toLowerCase();
}

function filaAUsuarioCentral_(fila, numeroFila) {
  return {
    fila: numeroFila || 0,
    idUsuario: String(fila[0] || "").trim(),
    correo: normalizarCorreoUsuario_(fila[1]),
    nombre: String(fila[2] || "").trim(),
    rol: String(fila[3] || "").trim().toUpperCase(),
    estado: String(fila[4] || "").trim().toUpperCase(),
    idBase: String(fila[5] || "").trim(),
    idCarpetaFotos: String(fila[6] || "").trim(),
    fechaAlta: fila[7] || "",
    ultimoAcceso: fila[8] || ""
  };
}
