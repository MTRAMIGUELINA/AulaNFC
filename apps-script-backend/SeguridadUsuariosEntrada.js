// ==========================================
// AULANFC v3.2
// S1-T2 - ENTRADAS MANUALES DE PRUEBA
// ==========================================

function inicializarSeguridadUsuarios() {
  return inicializarSeguridadUsuarios_("Angie");
}

function probarContextoUsuarioActual() {
  const resultado = obtenerContextoUsuarioActual_();
  console.log(JSON.stringify(resultado));
  return resultado;
}

/**
 * Prueba aislada de S1-T2-C.
 * Abre la base asignada al usuario autorizado y solo devuelve metadatos.
 * No escribe ni modifica registros.
 *
 * @return {Object}
 */
function probarLibroUsuarioActual() {
  const resultado = diagnosticarLibroUsuarioActual_();
  console.log(JSON.stringify(resultado));
  return resultado;
}
