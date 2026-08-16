// ==========================================
// AULANFC v3
// BITÁCORA DE REGISTROS NFC
// ==========================================

function guardarEnBitacoraNFC_(
  libro,
  uid,
  modulo,
  campoFormativo,
  tipoParticipacion,
  resultado,
  alumno
) {
  const hoja =
    obtenerOCrearHoja_(
      libro,
      NOMBRE_HOJA_BITACORA,
      [
        "Fecha",
        "Hora",
        "UID",
        "Módulo",
        "ID alumno",
        "Nombre del alumno",
        "Campo formativo",
        "Tipo de participación",
        "Resultado"
      ]
    );

  const ahora =
    new Date();

  hoja.appendRow([
    ahora,
    ahora,
    formatearUID_(uid),
    obtenerNombreModulo_(modulo),

    alumno
      ? alumno.id
      : "",

    alumno
      ? alumno.nombreCompleto
      : "No identificado",

    campoFormativo || "",
    tipoParticipacion || "",
    resultado || ""
  ]);

  formatearColumnasFechaHora_(
    hoja
  );
}