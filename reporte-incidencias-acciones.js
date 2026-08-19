/* AulaNFC v2.1 - Acciones tomadas + incidencia personalizada. */
(() => {
  function insertarCampoAcciones(){
    if(document.getElementById('incidenciaAccionesTomadas')) return true;
    const descripcion=document.getElementById('incidenciaDescripcion');
    const bloqueDescripcion=descripcion?.closest('.incidencias__bloque');
    if(!bloqueDescripcion) return false;
    const bloque=document.createElement('section');
    bloque.className='incidencias__bloque';
    bloque.innerHTML=`<h3>⚙️ Acciones tomadas</h3><div class="incidencias__campo"><label for="incidenciaAccionesTomadas">Describe las acciones realizadas después del incidente</label><textarea id="incidenciaAccionesTomadas" class="incidencias__textarea" placeholder="Ejemplo: se dialogó con los alumnos, se separó a los involucrados, se informó a la familia, se realizó mediación..."></textarea></div>`;
    bloqueDescripcion.insertAdjacentElement('afterend',bloque);
    return true;
  }

  function insertarCampoOtra(){
    if(document.getElementById('incidenciaOtraTexto')) return true;
    const select=document.getElementById('incidenciaTipo');
    if(!select) return false;
    const campo=document.createElement('div');
    campo.id='incidenciaOtraContenedor';
    campo.className='incidencias__campo incidencias__campo--completo oculto';
    campo.innerHTML=`<label for="incidenciaOtraTexto">Especifica la incidencia</label><input id="incidenciaOtraTexto" class="incidencias__input" type="text" maxlength="180" placeholder="Escribe aquí la incidencia reportada...">`;
    select.closest('.incidencias__campo')?.insertAdjacentElement('afterend',campo);
    const actualizar=()=>{
      const esOtra=String(select.value).trim().toLowerCase()==='otra';
      campo.classList.toggle('oculto',!esOtra);
      if(!esOtra) document.getElementById('incidenciaOtraTexto').value='';
    };
    select.addEventListener('change',actualizar);
    actualizar();
    return true;
  }

  function incidenciaFinal(){
    const tipo=String(document.getElementById('incidenciaTipo')?.value||'').trim();
    if(tipo.toLowerCase()!=='otra') return tipo;
    return String(document.getElementById('incidenciaOtraTexto')?.value||'').trim();
  }

  function conectarEnvio(){
    if(window.__accionesIncidenciaJSONPConectado) return true;
    if(typeof window.solicitarJSONP!=='function') return false;
    const original=window.solicitarJSONP;
    window.solicitarJSONP=function(accion,parametros){
      const datos={...(parametros||{})};
      if(String(accion||'').toLowerCase()==='guardarincidencia'){
        datos.accionesTomadas=String(document.getElementById('incidenciaAccionesTomadas')?.value||'').trim();
        datos.incidencia=incidenciaFinal();
      }
      return original(accion,datos);
    };
    window.__accionesIncidenciaJSONPConectado=true;
    return true;
  }

  function validarAntesDeGuardar(evento){
    const acciones=String(document.getElementById('incidenciaAccionesTomadas')?.value||'').trim();
    const tipo=String(document.getElementById('incidenciaTipo')?.value||'').trim().toLowerCase();
    const otra=String(document.getElementById('incidenciaOtraTexto')?.value||'').trim();
    let mensaje='';
    if(!acciones) mensaje='Escribe las acciones tomadas antes de guardar la incidencia.';
    else if(tipo==='otra'&&!otra) mensaje='Especifica cuál fue la incidencia reportada.';
    if(!mensaje) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
    const estado=document.getElementById('estadoReporteIncidencias');
    if(estado) estado.textContent=`❌ ${mensaje}`;
  }

  function conectarBotones(){
    const guardar=document.getElementById('btnGuardarIncidencia');
    if(!guardar) return false;
    if(!guardar.dataset.accionesValidacion){guardar.dataset.accionesValidacion='true';guardar.addEventListener('click',validarAntesDeGuardar,true)}
    return true;
  }

  function conectarOtra(){
    const select=document.getElementById('incidenciaTipo'),input=document.getElementById('incidenciaOtraTexto');
    if(!select||!input) return false;
    if(input.dataset.conectado==='true') return true;
    input.dataset.conectado='true';
    input.addEventListener('input',()=>{const estado=document.getElementById('estadoReporteIncidencias');if(estado&&input.value.trim())estado.textContent='Incidencia personalizada lista para guardar.'});
    return true;
  }

  function inicializar(){return insertarCampoAcciones()&&insertarCampoOtra()&&conectarEnvio()&&conectarBotones()&&conectarOtra()}
  if(inicializar()) return;
  const o=new MutationObserver(()=>{if(inicializar())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true});
})();
