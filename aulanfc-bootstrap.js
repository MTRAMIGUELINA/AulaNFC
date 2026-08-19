const cargasExtra=new Map();
const atributoEstadoCarga='data-aulanfc-load-state';

function registrarCarga(selector,script){
  const cargaExistente=cargasExtra.get(selector);
  if(cargaExistente?.script===script)return cargaExistente.promise;

  let resolver,rechazar;
  const promise=new Promise((resolve,reject)=>{resolver=resolve;rechazar=reject});
  const carga={script,estado:'loading',promise};
  cargasExtra.set(selector,carga);
  script.setAttribute(atributoEstadoCarga,'loading');

  script.addEventListener('load',()=>{
    carga.estado='loaded';
    script.setAttribute(atributoEstadoCarga,'loaded');
    resolver(script);
  },{once:true});

  script.addEventListener('error',()=>{
    carga.estado='failed';
    script.setAttribute(atributoEstadoCarga,'failed');
    rechazar(new Error(`No se pudo cargar ${script.src}`));
  },{once:true});

  promise.catch(()=>{});
  return promise;
}

function cargarExtra(selector,src,dataset){
  const cargaExistente=cargasExtra.get(selector);
  if(cargaExistente?.estado==='loading'||cargaExistente?.estado==='loaded')return cargaExistente.promise;
  if(cargaExistente?.estado==='failed'){
    cargaExistente.script.remove();
    cargasExtra.delete(selector);
  }

  let script=document.querySelector(selector);
  const estado=script?.getAttribute(atributoEstadoCarga);

  if(script&&estado==='failed'){
    script.remove();
    script=null;
  }
  if(script&&estado==='loading')return registrarCarga(selector,script);
  if(script){
    script.setAttribute(atributoEstadoCarga,'loaded');
    const promise=Promise.resolve(script);
    cargasExtra.set(selector,{script,estado:'loaded',promise});
    return promise;
  }

  script=document.createElement('script');
  script.src=src;
  script.defer=true;
  Object.assign(script.dataset,dataset);
  const promise=registrarCarga(selector,script);
  document.body.appendChild(script);
  return promise;
}

cargarExtra('script[data-menu-aulanfc]','menu-lateral.js?v=2',{menuAulanfc:'true'});
cargarExtra('script[data-resumen-estadistico-conexion]','resumen-estadistico-conexion.js?v=1',{resumenEstadisticoConexion:'true'});
cargarExtra('script[data-ficha-alumno-menu]','ficha-alumno-menu.js?v=2',{fichaAlumnoMenu:'true'});
cargarExtra('script[data-ficha-historial-conexion]','ficha-historial-conexion.js?v=1',{fichaHistorialConexion:'true'});
cargarExtra('script[data-ficha-pdf]','ficha-pdf.js?v=4',{fichaPdf:'true'});
cargarExtra('script[data-ficha-pdf-resultados-examen]','ficha-pdf-resultados-examen.js?v=1',{fichaPdfResultadosExamen:'true'});
cargarExtra('script[data-dashboard-aulanfc]','dashboard.js?v=1',{dashboardAulanfc:'true'});
cargarExtra('script[data-dashboard-conexion]','dashboard-conexion.js?v=1',{dashboardConexion:'true'});
cargarExtra('script[data-reporte-incidencias]','reporte-incidencias.js?v=1',{reporteIncidencias:'true'});
cargarExtra('script[data-reporte-incidencias-acciones]','reporte-incidencias-acciones.js?v=1',{reporteIncidenciasAcciones:'true'});
cargarExtra('script[data-reporte-incidencias-config]','reporte-incidencias-config.js?v=1',{reporteIncidenciasConfig:'true'});
cargarExtra('script[data-reporte-incidencias-grupo-activo]','reporte-incidencias-grupo-activo.js?v=1',{reporteIncidenciasGrupoActivo:'true'});
cargarExtra('script[data-historial-incidencias]','historial-incidencias.js?v=2',{historialIncidencias:'true'});
cargarExtra('script[data-participacion-actividad]','participacion-actividad.js?v=2',{participacionActividad:'true'});
cargarExtra('script[data-tareas-actividad]','tareas-actividad.js?v=2',{tareasActividad:'true'});
cargarExtra('script[data-resultados-examen-loader]','resultados-examen-loader.js?v=1',{resultadosExamenLoader:'true'});
cargarExtra('script[data-administracion-alumnos-loader]','administracion-alumnos-loader.js?v=1',{administracionAlumnosLoader:'true'});
cargarExtra('script[data-configuracion-loader]','configuracion-loader.js?v=1',{configuracionLoader:'true'});
cargarExtra('script[data-registro-manual-grupo-activo]','registro-manual-grupo-activo.js?v=1',{registroManualGrupoActivo:'true'});
