/* AulaNFC - Historial de incidencias. Interfaz preparada para conectar con Apps Script. */
(() => {
  function esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;')}

  function insertarBoton(){
    if(document.getElementById('btnHistorialIncidencias')) return true;
    const form=document.getElementById('formReporteIncidencias');
    const acciones=form?.querySelector('.incidencias__acciones');
    if(!form||!acciones) return false;
    const b=document.createElement('button');
    b.id='btnHistorialIncidencias'; b.type='button';
    b.className='incidencias__boton';
    b.style.cssText='width:100%;margin:0 0 14px;background:#0f6fbd;color:#fff;';
    b.innerHTML='📋 Ver historial de incidencias';
    acciones.insertAdjacentElement('beforebegin',b);
    return true;
  }

  function crearVista(){
    if(document.getElementById('panelHistorialIncidencias')) return true;
    const vista=document.getElementById('vistaReporteIncidencias');
    const form=document.getElementById('formReporteIncidencias');
    if(!vista||!form) return false;
    const p=document.createElement('section');
    p.id='panelHistorialIncidencias'; p.className='oculto';
    p.innerHTML=`
      <header class="incidencias__cabecera"><div><h2>📋 Historial de incidencias</h2><p>Consulta los reportes registrados y vuelve a abrirlos cuando sea necesario.</p></div><button id="btnCerrarHistorialIncidencias" class="incidencias__cerrar" type="button">✕</button></header>
      <section class="incidencias__bloque">
        <div class="incidencias__grid">
          <div class="incidencias__campo incidencias__campo--completo"><label for="historialIncidenciasAlumno">Alumno</label><select id="historialIncidenciasAlumno" class="incidencias__select"><option value="">Todos los alumnos</option></select></div>
          <div class="incidencias__campo"><label for="historialIncidenciasDesde">Desde</label><input id="historialIncidenciasDesde" class="incidencias__input" type="date"></div>
          <div class="incidencias__campo"><label for="historialIncidenciasHasta">Hasta</label><input id="historialIncidenciasHasta" class="incidencias__input" type="date"></div>
        </div>
        <button id="btnBuscarHistorialIncidencias" type="button" class="incidencias__boton incidencias__boton--guardar" style="margin-top:14px">🔎 Buscar reportes</button>
      </section>
      <p id="estadoHistorialIncidencias" class="incidencias__aviso">Selecciona un alumno o un periodo para consultar.</p>
      <div id="listaHistorialIncidencias"></div>`;
    form.insertAdjacentElement('afterend',p);
    return true;
  }

  async function cargarAlumnos(){
    const s=document.getElementById('historialIncidenciasAlumno');
    if(!s||s.dataset.cargado==='1'||typeof solicitarJSONP!=='function') return;
    try{
      const r=await solicitarJSONP('obtenerAlumnos');
      const alumnos=(Array.isArray(r?.alumnos)?r.alumnos:[]).filter(a=>a.activo!==false);
      s.innerHTML='<option value="">Todos los alumnos</option>'+alumnos.map(a=>{const n=a.nombreCompleto||[a.nombre,a.apellidoPaterno,a.apellidoMaterno].filter(Boolean).join(' ');return `<option value="${esc(a.id)}">${esc(n)}</option>`}).join('');
      s.dataset.cargado='1';
    }catch(e){}
  }

  function abrir(){
    document.getElementById('formReporteIncidencias')?.classList.add('oculto');
    document.getElementById('panelHistorialIncidencias')?.classList.remove('oculto');
    cargarAlumnos();
  }
  function cerrar(){
    document.getElementById('panelHistorialIncidencias')?.classList.add('oculto');
    document.getElementById('formReporteIncidencias')?.classList.remove('oculto');
  }

  async function buscar(){
    const estado=document.getElementById('estadoHistorialIncidencias');
    const lista=document.getElementById('listaHistorialIncidencias');
    if(typeof solicitarJSONP!=='function') return;
    estado.textContent='⏳ Consultando historial...'; lista.innerHTML='';
    try{
      const r=await solicitarJSONP('obtenerHistorialIncidencias',{
        idAlumno:document.getElementById('historialIncidenciasAlumno')?.value||'',
        desde:document.getElementById('historialIncidenciasDesde')?.value||'',
        hasta:document.getElementById('historialIncidenciasHasta')?.value||''
      });
      if(!r||(r.ok===false||r.exito===false)) throw new Error(r?.mensaje||'No fue posible obtener el historial.');
      const registros=Array.isArray(r.registros)?r.registros:[];
      estado.textContent=registros.length?`✅ ${registros.length} reporte(s) encontrado(s).`:'No hay incidencias registradas con esos filtros.';
      lista.innerHTML=registros.map(x=>`<article class="incidencias__bloque" style="margin-top:12px"><div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><strong>${esc(x.folio||'Sin folio')}</strong><span>${esc(x.fecha||'')}</span></div><h3 style="margin-top:10px">${esc(x.nombre||'Alumno')}</h3><p><b>Incidencia:</b> ${esc(x.incidencia||'')}</p><p>${esc(x.descripcion||'')}</p><button type="button" class="incidencias__boton btnDetalleIncidencia" data-folio="${esc(x.folio||'')}">👁️ Ver detalle</button></article>`).join('');
    }catch(e){estado.textContent=`❌ ${e?.message||'No fue posible obtener el historial.'}`}
  }

  function iniciar(){
    if(!insertarBoton()||!crearVista()) return false;
    const b=document.getElementById('btnHistorialIncidencias');
    if(b.dataset.iniciado==='1') return true;
    b.dataset.iniciado='1';
    b.addEventListener('click',abrir);
    document.getElementById('btnCerrarHistorialIncidencias')?.addEventListener('click',cerrar);
    document.getElementById('btnBuscarHistorialIncidencias')?.addEventListener('click',buscar);
    return true;
  }
  if(iniciar()) return;
  const o=new MutationObserver(()=>{if(iniciar())o.disconnect()});
  o.observe(document.documentElement,{childList:true,subtree:true});
})();
