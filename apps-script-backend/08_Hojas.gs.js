// ==========================================
// AULANFC v3
// UTILIDADES PARA HOJAS DE CÁLCULO
// ==========================================


// ==========================================
// REGISTRAR FILA DE MÓDULO
// ==========================================

function registrarFilaModulo_(
  libro,
  nombreHoja,
  encabezados,
  valores
) {

  // --------------------------------------
  // OBTENER CICLO ESCOLAR CONFIGURADO
  // --------------------------------------

  let cicloEscolar = "";

  try {

    const respuestaConfiguracion =
      obtenerConfiguracion_();

    if (
      respuestaConfiguracion &&
      respuestaConfiguracion.ok === true
    ) {

      cicloEscolar =
        String(
          respuestaConfiguracion
            .configuracion
            ?.CICLO_ESCOLAR || ""
        ).trim();
    }

  } catch (error) {

    console.error(
      "No fue posible obtener el ciclo escolar:",
      error
    );
  }


  // --------------------------------------
  // PREPARAR ENCABEZADOS
  // --------------------------------------

  const encabezadosFinales =
    encabezados.slice();

  const tieneCiclo =
    encabezadosFinales.some(
      function(encabezado) {

        return (
          String(
            encabezado || ""
          )
            .trim()
            .toUpperCase() ===
          "CICLO ESCOLAR"
        );
      }
    );

  if (!tieneCiclo) {

    encabezadosFinales.push(
      "CICLO ESCOLAR"
    );
  }


  const lock =
    LockService.getScriptLock();

  let lockAdquirido = false;
  let hoja;

  try {

    lockAdquirido =
      lock.tryLock(5000);

    if (!lockAdquirido) {
      throw new Error(
        "No fue posible guardar el registro en este momento. Intenta nuevamente."
      );
    }

    // --------------------------------------
    // OBTENER O CREAR HOJA
    // --------------------------------------

    hoja =
      obtenerOCrearHoja_(
        libro,
        nombreHoja,
        encabezadosFinales
      );


    // --------------------------------------
    // ASEGURAR COLUMNA CICLO ESCOLAR
    // --------------------------------------

    let ultimaColumna =
      hoja.getLastColumn();

    let encabezadosActuales = [];

    if (ultimaColumna > 0) {

      encabezadosActuales =
        hoja
          .getRange(
            1,
            1,
            1,
            ultimaColumna
          )
          .getDisplayValues()[0];
    }

    const indiceCiclo =
      encabezadosActuales.findIndex(
        function(encabezado) {

          return (
            String(
              encabezado || ""
            )
              .trim()
              .toUpperCase() ===
            "CICLO ESCOLAR"
          );
        }
      );


    let columnaCiclo;

    if (indiceCiclo === -1) {

      columnaCiclo =
        ultimaColumna + 1;

      hoja
        .getRange(
          1,
          columnaCiclo
        )
        .setValue(
          "CICLO ESCOLAR"
        )
        .setFontWeight(
          "bold"
        );

    } else {

      columnaCiclo =
        indiceCiclo + 1;
    }


    // --------------------------------------
    // GUARDAR REGISTRO
    // --------------------------------------

    const nuevaFila =
      hoja.getLastRow() + 1;

    if (valores.length > 0) {

      hoja
        .getRange(
          nuevaFila,
          1,
          1,
          valores.length
        )
        .setValues([
          valores
        ]);
    }

    hoja
      .getRange(
        nuevaFila,
        columnaCiclo
      )
      .setValue(
        cicloEscolar
      );

    SpreadsheetApp.flush();

  } finally {
    if (lockAdquirido) {
      lock.releaseLock();
    }
  }


  // --------------------------------------
  // FORMATO
  // --------------------------------------

  formatearColumnasFechaHora_(
    hoja
  );

  return hoja;
}


// ==========================================
// OBTENER O CREAR HOJA
// ==========================================

function obtenerOCrearHoja_(
  libro,
  nombreHoja,
  encabezados
) {

  let hoja =
    libro.getSheetByName(
      nombreHoja
    );

  if (!hoja) {

    hoja =
      libro.insertSheet(
        nombreHoja
      );
  }


  // --------------------------------------
  // CREAR ENCABEZADOS SI LA HOJA ESTÁ VACÍA
  // --------------------------------------

  if (hoja.getLastRow() === 0) {

    hoja
      .getRange(
        1,
        1,
        1,
        encabezados.length
      )
      .setValues([
        encabezados
      ]);

    hoja.setFrozenRows(1);

    hoja
      .getRange(
        1,
        1,
        1,
        encabezados.length
      )
      .setFontWeight(
        "bold"
      );
  }

  return hoja;
}


// ==========================================
// FORMATEAR FECHA Y HORA
// ==========================================

function formatearColumnasFechaHora_(
  hoja
) {

  const ultimaFila =
    hoja.getLastRow();

  if (ultimaFila < 2) {
    return;
  }


  // FECHA
  hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      1
    )
    .setNumberFormat(
      "dd/MM/yyyy"
    );


  // HORA
  hoja
    .getRange(
      2,
      2,
      ultimaFila - 1,
      1
    )
    .setNumberFormat(
      "hh:mm:ss"
    );
}