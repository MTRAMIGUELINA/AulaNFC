/* AulaNFC: pase de lista manual para Asistencia. Otros módulos permanecen intactos. */
(() => {
  const $ = (id) => document.getElementById(id);
  const escapeHTML = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const nombre = (a) => String(a.nombreCompleto || [a.nombre,a.apellidoPaterno,a.apellidoMaterno].filter(Boolean).join(' ') || 'Alumno').trim();
  let lista = [], ocupado = false;
  const panel = $('panelRegistroManual'), boton = $('btnBuscarManual');
  if (!panel || !boton) return;
  const bloque = document.createElement('section');
  bloque.id = 'paseListaAsistencia';
  bloque.hidden = true;
  bloque.innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
      <button type="button" id="paseMarcarTodos">✓ Marcar todos</button>
      <button type="button" id="paseDesmarcarTodos">Desmarcar todos</button>
    </div>
    <p id="paseEstado" aria-live="polite"></p>
    <div id="paseAlumnos" style="max-height:55vh;overflow:auto"></div>
    <button type="button" id="paseGuardar" style="margin-top:12px" disabled>Guardar asistencia</button>`;
  panel.appendChild(bloque);
  const originales = ['campoBusquedaManual','listaManual','alumnoManualSeleccionado','btnGuardarManual'];
  function modoLista(activo) {
    bloque.hidden = !activo;
    originales.forEach(id => { const e=$(id); if(e) e.style.display=activo?'none':''; });
    const etiqueta=panel.querySelector('label[for="campoBusquedaManual"]');
    if(etiqueta) etiqueta.style.display=activo?'none':'';
  }
  function seleccionados() { return [...bloque.querySelectorAll('input[data-id]:checked')]; }
  function actualizar() {
    const n=seleccionados().length;
    $('paseGuardar').disabled=ocupado||!n;
    $('paseGuardar').textContent='Guardar asistencia ('+n+')';
    if(!ocupado) $('paseEstado').textContent=n+' de '+lista.length+' alumnos seleccionados';
  }
  function dibujar() {
    $('paseAlumnos').innerHTML=lista.map(a=>`<label style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #ddd;cursor:pointer"><input type="checkbox" data-id="${escapeHTML(a.id)}" style="width:20px;height:20px"><span>${escapeHTML(nombre(a))}</span></label>`).join('');
    $('paseAlumnos').querySelectorAll('input').forEach(e=>e.addEventListener('change',actualizar));
    actualizar();
  }
  boton.addEventListener('click',async e=>{
    if(moduloSeleccionado!=='asistencia') {modoLista(false);return;}
    e.preventDefault();e.stopImmediatePropagation();
    if(ocupado)return;
    modoLista(true);panel.classList.remove('oculto');
    $('paseAlumnos').innerHTML='';
    $('paseEstado').textContent='Cargando alumnos del grupo...';
    $('paseGuardar').disabled=true;
    try {
      const r=await solicitarJSONP('obteneralumnosgrupoactivo');
      validarRespuesta(r);
      lista=Array.isArray(r.alumnos)?r.alumnos:[];
      dibujar();
      if(!lista.length)$('paseEstado').textContent='No hay alumnos activos en el grupo.';
    } catch(err) {$('paseEstado').textContent='No se pudo cargar la lista: '+err.message;}
  },true);
  $('paseMarcarTodos').addEventListener('click',()=>{bloque.querySelectorAll('input[data-id]').forEach(e=>e.checked=true);actualizar();});
  $('paseDesmarcarTodos').addEventListener('click',()=>{bloque.querySelectorAll('input[data-id]').forEach(e=>e.checked=false);actualizar();});
  $('paseGuardar').addEventListener('click',async()=>{
    if(ocupado)return;
    const ids=seleccionados().map(e=>e.dataset.id);
    if(!ids.length)return;
    ocupado=true;actualizar();
    let guardados=0;const errores=[];
    for(const id of ids){
      const alumno=lista.find(a=>String(a.id)===String(id));
      if(!alumno)continue;
      $('paseEstado').textContent='Registrando '+(guardados+errores.length+1)+' de '+ids.length+'...';
      try{
        const r=await solicitarJSONP('registrarManual',{id,alumnoId:id,idAlumno:id,uid:alumno.uid||'',modulo:'asistencia'});
        validarRespuesta(r);
        guardados++;
        const casilla=[...bloque.querySelectorAll('input[data-id]')].find(e=>e.dataset.id===id);
        if(casilla){casilla.checked=false;casilla.disabled=true;casilla.closest('label').style.opacity='.55';}
      }catch(err){errores.push(nombre(alumno)+': '+err.message);}
    }
    ocupado=false;actualizar();
    $('paseEstado').textContent='Guardados: '+guardados+'. '+(errores.length?'Sin confirmar ('+errores.length+'): '+errores.join('; '):'Registro terminado.');
    if(guardados) $('estado').textContent='✅ Asistencia guardada para '+guardados+' alumnos.';
  });
  $('btnCerrarManual')?.addEventListener('click',()=>modoLista(false));
  document.querySelectorAll('[data-modulo]').forEach(b=>b.addEventListener('click',()=>modoLista(false)));
})();