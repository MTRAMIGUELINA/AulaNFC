// ==========================================
// AULANFC v3.2
// S1-T2 - ENTRADAS MANUALES DE PRUEBA
// ==========================================

/**
 * Punto de entrada publico para ejecutar manualmente la inicializacion
 * desde el editor de Google Apps Script.
 *
 * No se expone por doGet ni modifica el funcionamiento de los modulos.
 *
 * @return {Object}
 */
function inicializarSeguridadUsuarios() {
  return inicializarSeguridadUsuarios_("Angie");
}

/**
 * Prueba aislada de S1-T2-B.
 * Identifica la cuenta actual y comprueba su registro central.
 * No modifica alumnos, NFC ni ningun modulo de AulaNFC.
 *
 * @return {Object}
 */
function probarContextoUsuarioActual() {
  const resultado = obtenerContextoUsuarioActual_();
  console.log(JSON.stringify(resultado));
  return resultado;
}
