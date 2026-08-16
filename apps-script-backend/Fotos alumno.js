// ==========================================
// AULANFC v3.1
// FOTOGRAFÍAS DE ALUMNOS
// ==========================================

const NOMBRE_CARPETA_FOTOS_ALUMNOS =
  "AulaNFC - Fotos de alumnos";


// ==========================================
// GUARDAR FOTO DEL ALUMNO EN DRIVE
// ==========================================

function guardarFotoAlumno_(parametros) {
  try {

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    const nombreAlumno =
      String(
        parametros.nombreAlumno || ""
      ).trim();

    const nombreArchivoOriginal =
      String(
        parametros.nombreArchivo || "foto.jpg"
      ).trim();

    const tipoMime =
      String(
        parametros.tipoMime || "image/jpeg"
      ).trim();

    let base64 =
      String(
        parametros.base64 || ""
      ).trim();


    // --------------------------------------
    // VALIDACIONES
    // --------------------------------------

    if (!base64) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se recibió ninguna fotografía."
      };
    }

    if (
      !tipoMime.startsWith("image/")
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "El archivo recibido no es una imagen válida."
      };
    }


    // --------------------------------------
    // QUITAR ENCABEZADO DATA URL
    // Ejemplo:
    // data:image/jpeg;base64,AAAA...
    // --------------------------------------

    if (
      base64.indexOf("base64,") !== -1
    ) {
      base64 =
        base64.split("base64,")[1];
    }


    // --------------------------------------
    // DECODIFICAR
    // --------------------------------------

    const bytes =
      Utilities.base64Decode(
        base64
      );


    // --------------------------------------
    // LÍMITE DE SEGURIDAD: 8 MB
    // --------------------------------------

    const maxBytes =
      8 * 1024 * 1024;

    if (
      bytes.length >
      maxBytes
    ) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "La fotografía supera el límite de 8 MB."
      };
    }


    // --------------------------------------
    // OBTENER CARPETA
    // --------------------------------------

    const carpeta =
      obtenerCarpetaFotosAlumnos_();


    // --------------------------------------
    // CREAR NOMBRE SEGURO
    // --------------------------------------

    const extension =
      obtenerExtensionFoto_(
        tipoMime,
        nombreArchivoOriginal
      );

    const nombreLimpio =
      limpiarNombreArchivoFoto_(
        nombreAlumno ||
        "Alumno"
      );

    const identificador =
      idAlumno
        ? "ALU-" + idAlumno
        : "ALU-SIN-ID";

    const marcaTiempo =
      Utilities.formatDate(
        new Date(),
        Session.getScriptTimeZone(),
        "yyyyMMdd-HHmmss"
      );

    const nombreArchivo =
      identificador +
      "_" +
      nombreLimpio +
      "_" +
      marcaTiempo +
      "." +
      extension;


    // --------------------------------------
    // CREAR BLOB
    // --------------------------------------

    const blob =
      Utilities.newBlob(
        bytes,
        tipoMime,
        nombreArchivo
      );


    // --------------------------------------
    // GUARDAR EN DRIVE
    // --------------------------------------

    const archivo =
      carpeta.createFile(
        blob
      );


    // --------------------------------------
    // IMPORTANTE:
    // NO HACEMOS PÚBLICO EL ARCHIVO
    // --------------------------------------

    const idArchivo =
      archivo.getId();


    return {
      ok: true,
      exito: true,

      mensaje:
        "Fotografía guardada correctamente.",

      idArchivo:
        idArchivo,

      foto:
        idArchivo,

      nombreArchivo:
        nombreArchivo
    };

  } catch (error) {

    console.error(
      "Error en guardarFotoAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,

      mensaje:
        "No fue posible guardar la fotografía.",

      error:
        error &&
        error.message
          ? error.message
          : String(error)
    };
  }
}

// ==========================================
// RESPUESTA WEB: GUARDAR FOTO DEL ALUMNO
// ==========================================

function guardarFotoAlumnoWeb_(
  parametros
) {

  const respuesta =
    guardarFotoAlumno_(
      parametros || {}
    );

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}

// ==========================================
// OBTENER / CREAR CARPETA
// ==========================================

function obtenerCarpetaFotosAlumnos_() {

  const carpetas =
    DriveApp.getFoldersByName(
      NOMBRE_CARPETA_FOTOS_ALUMNOS
    );

  if (
    carpetas.hasNext()
  ) {
    return carpetas.next();
  }

  return DriveApp.createFolder(
    NOMBRE_CARPETA_FOTOS_ALUMNOS
  );
}


// ==========================================
// LIMPIAR NOMBRE PARA ARCHIVO
// ==========================================

function limpiarNombreArchivoFoto_(
  texto
) {

  return String(
    texto || "Alumno"
  )
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .replace(
      /[^a-zA-Z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    )
    .substring(
      0,
      60
    ) ||
    "Alumno";
}


// ==========================================
// OBTENER EXTENSIÓN
// ==========================================

function obtenerExtensionFoto_(
  tipoMime,
  nombreOriginal
) {

  const mime =
    String(
      tipoMime || ""
    ).toLowerCase();

  if (
    mime === "image/jpeg" ||
    mime === "image/jpg"
  ) {
    return "jpg";
  }

  if (
    mime === "image/png"
  ) {
    return "png";
  }

  if (
    mime === "image/webp"
  ) {
    return "webp";
  }

  const nombre =
    String(
      nombreOriginal || ""
    );

  const coincidencia =
    nombre.match(
      /\.([a-zA-Z0-9]+)$/
    );

  if (coincidencia) {
    return coincidencia[1]
      .toLowerCase()
      .substring(0, 5);
  }

  return "jpg";
}


// ==========================================
// OBTENER FOTO PRIVADA DEL ALUMNO
// ==========================================

function obtenerFotoAlumno_(parametros) {
  try {

    const idAlumno =
      String(
        parametros.idAlumno || ""
      ).trim();

    if (!idAlumno) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se recibió el ID del alumno."
      };
    }

    const libro =
      SpreadsheetApp.openById(
        ID_HOJA_CALCULO
      );

    const alumno =
      buscarAlumnoPorID_(
        libro,
        idAlumno
      );

    if (!alumno) {
      return {
        ok: false,
        exito: false,
        mensaje:
          "No se encontró el alumno."
      };
    }

    const idFoto =
      String(
        alumno.foto || ""
      ).trim();

    if (!idFoto) {
      return {
        ok: true,
        exito: true,
        tieneFoto: false,
        mensaje:
          "El alumno no tiene fotografía."
      };
    }

    const archivo =
      DriveApp.getFileById(
        idFoto
      );

    const blob =
      archivo.getBlob();

    const tipoMime =
      blob.getContentType();

    const base64 =
      Utilities.base64Encode(
        blob.getBytes()
      );

    return {
      ok: true,
      exito: true,
      tieneFoto: true,

      tipoMime:
        tipoMime,

      base64:
        base64
    };

  } catch (error) {

    console.error(
      "Error en obtenerFotoAlumno_:",
      error
    );

    return {
      ok: false,
      exito: false,
      mensaje:
        "No fue posible obtener la fotografía.",
      error:
        error &&
        error.message
          ? error.message
          : String(error)
    };
  }
}


// ==========================================
// RESPUESTA WEB: OBTENER FOTO DEL ALUMNO
// ==========================================

function obtenerFotoAlumnoWeb_(
  parametros
) {

  const respuesta =
    obtenerFotoAlumno_(
      parametros || {}
    );

  return responderJSONP_(
    parametros &&
    parametros.callback
      ? parametros.callback
      : "",
    respuesta
  );
}