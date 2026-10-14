// ==========================================
// AULANFC - BITÁCORA DIARIA DEL DOCENTE
// Módulo independiente de la bitácora NFC.
// Etapa 1: almacenamiento de registros.
// No publicar estas funciones directamente como rutas JSONP.
// ==========================================

const BITACORA_DIARIA_HOJA_ = "BITACORA_DIARIA";
const BITACORA_DIARIA_HISTORIAL_HOJA_ = "BITACORA_HISTORIAL";
const BITACORA_DIARIA_CATEGORIAS_ = [
  "Actividad escolar",
  "Incidente",
  "Observación",
  "Atención a padres de familia",
  "Otro acontecimiento"
];

function obtenerHojaBitacoraDiaria_(libro) {
  let hoja = libro.getSheetByName(BITACORA_DIARIA_HOJA_);
  if (!hoja) {
    hoja = libro.insertSheet(BITACORA_DIARIA_HOJA_);
    hoja.appendRow([
      "Folio", "Fecha", "Hora", "Categoría", "Descripción",
      "Estado", "Versión", "Creado el", "Actualizado el"
    ]);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function obtenerHojaHistorialBitacoraDiaria_(libro) {
  let hoja = libro.getSheetByName(BITACORA_DIARIA_HISTORIAL_HOJA_);
  if (!hoja) {
    hoja = libro.insertSheet(BITACORA_DIARIA_HISTORIAL_HOJA_);
    hoja.appendRow([
      "Folio", "Versión anterior", "Descripción anterior",
      "Categoría anterior", "Estado anterior", "Fecha del cambio",
      "Tipo de cambio", "Motivo"
    ]);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/**
 * Genera el siguiente folio dentro de un bloqueo de escritura.
 * Requiere que el llamador haya adquirido LockService.
 */
function generarFolioBitacoraDiaria_(hoja, anio) {
  const prefijo = "BIT-" + anio + "-";
  const ultimaFila = hoja.getLastRow();
  const folios = ultimaFila > 1
    ? hoja.getRange(2, 1, ultimaFila - 1, 1).getDisplayValues().flat()
    : [];
  let maximo = 0;
  folios.forEach(function(valor) {
    const texto = String(valor || "");
    if (!texto.startsWith(prefijo)) return;
    const resto = texto.slice(prefijo.length);
    if (!/^\\d+$/.test(resto)) return;
    maximo = Math.max(maximo, Number(resto));
  });
  return prefijo + String(maximo + 1).padStart(4, "0");
}

/**
 * Guarda un acontecimiento narrativo del docente.
 * Fecha y hora se obtienen del servidor; no se aceptan desde el cliente.
 * La autorización del usuario debe verificarse en el punto de entrada
 * antes de invocar esta función.
 */
function guardarBitacoraDiaria_(parametros) {
  try {
    parametros = parametros || {};
    const categoria = String(parametros.categoria || "").trim();
    const descripcion = String(parametros.descripcion || "").trim();

    if (BITACORA_DIARIA_CATEGORIAS_.indexOf(categoria) === -1) {
      return { ok: false, mensaje: "Selecciona una categoría válida." };
    }
    if (!descripcion) {
      return { ok: false, mensaje: "Escribe la descripción del acontecimiento." };
    }
    if (descripcion.length > 20000) {
      return { ok: false, mensaje: "La descripción es demasiado extensa." };
    }

    const lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) {
      return { ok: false, mensaje: "El registro está ocupado. Intenta nuevamente." };
    }

    try {
      const libro = obtenerBaseDocenteActual_();
      const hoja = obtenerHojaBitacoraDiaria_(libro);
      const ahora = new Date();
      const zona = libro.getSpreadsheetTimeZone() || Session.getScriptTimeZone();
      const fecha = Utilities.formatDate(ahora, zona, "yyyy-MM-dd");
      const hora = Utilities.formatDate(ahora, zona, "HH:mm:ss");
      const anio = Utilities.formatDate(ahora, zona, "yyyy");
      const folio = generarFolioBitacoraDiaria_(hoja, anio);

      hoja.appendRow([
        folio, fecha, hora, categoria, descripcion,
        "Activo", 1, ahora, ahora
      ]);
      SpreadsheetApp.flush();
      return { ok: true, mensaje: "Registro guardado correctamente.", folio: folio, fecha: fecha, hora: hora };
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    console.error("Error en guardarBitacoraDiaria_:", error);
    return { ok: false, mensaje: "No fue posible guardar el registro." };
  }
}
