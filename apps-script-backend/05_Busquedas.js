// ==========================================
// BUSCAR ALUMNO POR UID NFC
// ==========================================

function buscarAlumnoPorUID_(
  libro,
  uidBuscado
) {
  const hoja =
    libro.getSheetByName(
      NOMBRE_HOJA_ALUMNOS
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja "' +
      NOMBRE_HOJA_ALUMNOS +
      '".'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      "La hoja ALUMNOS no contiene alumnos registrados."
    );
  }

  const uidNormalizado =
    normalizarUID_(
      uidBuscado
    );

  if (!uidNormalizado) {
    return null;
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        10
      )
      .getDisplayValues();

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    const fila =
      datos[i];

    const uidAlumno =
      normalizarUID_(
        fila[7]
      );

    if (
      uidAlumno &&
      uidAlumno === uidNormalizado
    ) {
      const nombre =
        String(
          fila[1] || ""
        ).trim();

      const apellidoPaterno =
        String(
          fila[2] || ""
        ).trim();

      const apellidoMaterno =
        String(
          fila[3] || ""
        ).trim();

      const nombreCompleto =
        [
          nombre,
          apellidoPaterno,
          apellidoMaterno
        ]
          .filter(Boolean)
          .join(" ")
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      return {
        fila:
          i + 2,

        id:
          String(
            fila[0] || ""
          ).trim(),

        nombre:
          nombre,

        apellidoPaterno:
          apellidoPaterno,

        apellidoMaterno:
          apellidoMaterno,

        nombreCompleto:
          nombreCompleto,

        fechaNacimiento:
          String(
            fila[4] || ""
          ).trim(),

        grado:
          String(
            fila[5] || ""
          ).trim(),

        grupo:
          limpiarGrupo_(
            fila[6]
          ),

        uid:
          formatearUID_(
            fila[7]
          ),

        estatus:
          String(
            fila[8] || ""
          )
            .trim()
            .toUpperCase(),

        foto:
          String(
            fila[9] || ""
          ).trim()
      };
    }
  }

  return null;
}

// ==========================================
// BUSCAR ALUMNO POR ID
// ==========================================

function buscarAlumnoPorID_(
  libro,
  idBuscado
) {
  const hoja =
    libro.getSheetByName(
      NOMBRE_HOJA_ALUMNOS
    );

  if (!hoja) {
    throw new Error(
      'No existe la hoja "' +
      NOMBRE_HOJA_ALUMNOS +
      '".'
    );
  }

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      "La hoja ALUMNOS no contiene alumnos registrados."
    );
  }

  const idNormalizado =
    String(
      idBuscado || ""
    )
      .trim()
      .toUpperCase();

  if (!idNormalizado) {
    return null;
  }

  const datos =
    hoja
      .getRange(
        2,
        1,
        ultimaFila - 1,
        10
      )
      .getDisplayValues();

  for (
    let i = 0;
    i < datos.length;
    i++
  ) {
    const fila =
      datos[i];

    const idAlumno =
      String(
        fila[0] || ""
      )
        .trim()
        .toUpperCase();

    if (
      idAlumno &&
      idAlumno === idNormalizado
    ) {
      const nombre =
        String(
          fila[1] || ""
        ).trim();

      const apellidoPaterno =
        String(
          fila[2] || ""
        ).trim();

      const apellidoMaterno =
        String(
          fila[3] || ""
        ).trim();

      const nombreCompleto =
        [
          nombre,
          apellidoPaterno,
          apellidoMaterno
        ]
          .filter(Boolean)
          .join(" ")
          .replace(
            /\s+/g,
            " "
          )
          .trim();

      return {
        fila:
          i + 2,

        id:
          String(
            fila[0] || ""
          ).trim(),

        nombre:
          nombre,

        apellidoPaterno:
          apellidoPaterno,

        apellidoMaterno:
          apellidoMaterno,

        nombreCompleto:
          nombreCompleto,

        fechaNacimiento:
          String(
            fila[4] || ""
          ).trim(),

        grado:
          String(
            fila[5] || ""
          ).trim(),

        grupo:
          limpiarGrupo_(
            fila[6]
          ),

        uid:
          formatearUID_(
            fila[7]
          ),

        estatus:
          String(
            fila[8] || ""
          )
            .trim()
            .toUpperCase(),

        foto:
          String(
            fila[9] || ""
          ).trim()
      };
    }
  }

  return null;
}