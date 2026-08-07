/* AulaNFC v2.1 - Reporte de incidencias conectado con ALUMNOS y Google Sheets. */
(() => {
  let alumnosIncidencias = [];
  let alumnosCargados = false;
  let folioIncidenciaActual = '';
  let guardandoIncidencia = false;

  const esc = (v) => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const nombreAlumno = (a) => String(a?.nombreCompleto || [a?.nombre,a?.apellidoPaterno,a?.apellidoMaterno].filter(Boolean).join(' ') || 'Alumno').replace(/\s+/g,' ').trim();

  function cargarEstilos(){if(document.getElementById('estilosReporteIncidencias'))return;const l=document.createElement('link');l.id='estilosReporteIncidencias';l.rel='stylesheet';l.href='reporte-incidencias.css?v=1';document.head.appendChild(l)}
  function fechaHoy(){const a=new Date(),l=new Date(a.getTime()-a.getTimezoneOffset()*60000);return l.toISOString().slice(0,10)}

  function agregarBoton(){if(document.getElementById('menuReporteIncidencias'))return true;const r=document.getElementById('menuDashboard')||document.getElementById('menuFichaAlumno')||document.getElementById('menuResumenEstadistico');if(!r?.parentElement)return false;const b=document.createElement('button');b.id='menuReporteIncidencias';b.type='button';b.className='menu-lateral__opcion';b.innerHTML='<span class="menu-lateral__icono" aria-hidden="true">📝</span><span>Reporte de incidencias</span>';r.insertAdjacentElement('afterend',b);return true}

  function crearVista(){if(document.getElementById('vistaReporteIncidencias'))return true;const c=document.querySelector('.contenedor'),vE=document.getElementById('vistaEscaner');if(!c)return false;const v=document.createElement('section');v.id='vistaReporteIncidencias';v.className='vista-incidencias oculto';v.innerHTML=`
<header class="incidencias__cabecera"><div><h2>📝 Reporte de incidencias</h2><p>Registra la situación, acuerdos y datos necesarios para generar el documento.</p></div><button id="btnCerrarReporteIncidencias" class="incidencias__cerrar" type="button">✕</button></header>
<form id="formReporteIncidencias" class="incidencias__formulario" autocomplete="off">
<section class="incidencias__bloque"><h3>👤 Datos del alumno</h3><div class="incidencias__grid">
<div class="incidencias__campo incidencias__campo--completo"><label for="incidenciaAlumno">Alumno</label><select id="incidenciaAlumno" class="incidencias__select"><option value="">Selecciona un alumno</option></select></div>
<div class="incidencias__campo"><label for="incidenciaFecha">Fecha</label><input id="incidenciaFecha" class="incidencias__input" type="date" value="${fechaHoy()}"></div>
<div class="incidencias__campo"><label for="incidenciaTipo">Incidencia reportada</label><select id="incidenciaTipo" class="incidencias__select"><option value="">Selecciona una opción</option><option>Agresión física</option><option>Agresión verbal</option><option>Falta de respeto</option><option>Incumplimiento de indicaciones</option><option>Daño a materiales o instalaciones</option><option>Conducta disruptiva</option><option>Conflicto entre compañeros</option><option>Otra</option></select></div></div>
<div id="incidenciaAlumnoSeleccionado" class="incidencias__seleccion oculto"><strong id="incidenciaNombreAlumno">Alumno</strong><span id="incidenciaDatosAlumno">Grado · Grupo · ID</span></div></section>
<section class="incidencias__bloque"><h3>📌 Descripción del incidente</h3><div class="incidencias__campo"><label for="incidenciaDescripcion">Describe de forma clara qué ocurrió</label><textarea id="incidenciaDescripcion" class="incidencias__textarea" placeholder="Escribe aquí los hechos observados, contexto y personas involucradas..."></textarea></div></section>
<section class="incidencias__bloque"><h3>🤝 Acuerdos y compromisos</h3><div class="incidencias__campo"><label for="incidenciaAcuerdos">Acuerdos establecidos con la familia y/o el alumno</label><textarea id="incidenciaAcuerdos" class="incidencias__textarea incidencias__textarea--acuerdos" placeholder="Escribe aquí los acuerdos, compromisos y acciones de seguimiento..."></textarea></div></section>
<div class="incidencias__acciones"><button id="btnGuardarIncidencia" class="incidencias__boton incidencias__boton--guardar" type="button" disabled>💾 Guardar reporte</button><button id="btnPDFIncidencia" class="incidencias__boton incidencias__boton--pdf" type="button" disabled>📄 Generar PDF</button><button id="btnLimpiarIncidencia" class="incidencias__boton incidencias__boton--limpiar" type="reset">Limpiar</button></div>
<p id="estadoReporteIncidencias" class="incidencias__aviso">Selecciona un alumno para comenzar.</p></form>`;if(vE)c.insertBefore(v,vE);else c.appendChild(v);return true}

  async function cargarAlumnos(){const s=document.getElementById('incidenciaAlumno'),estado=document.getElementById('estadoReporteIncidencias');if(alumnosCargados||typeof solicitarJSONP!=='function')return;estado.textContent='⏳ Cargando alumnos...';try{const r=await solicitarJSONP('obtenerAlumnos');if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No se pudieron cargar los alumnos.');alumnosIncidencias=(Array.isArray(r.alumnos)?r.alumnos:[]).filter(a=>a.activo!==false).sort((a,b)=>nombreAlumno(a).localeCompare(nombreAlumno(b),'es',{sensitivity:'base'}));s.innerHTML='<option value="">Selecciona un alumno</option>'+alumnosIncidencias.map(a=>`<option value="${esc(a.id)}">${esc(nombreAlumno(a))}</option>`).join('');alumnosCargados=true;estado.textContent=`✅ ${alumnosIncidencias.length} alumnos disponibles.`}catch(e){estado.textContent=`❌ ${e?.message||'No se pudieron cargar los alumnos.'}`}}

  function obtenerAlumnoSeleccionado(){const id=document.getElementById('incidenciaAlumno')?.value||'';return alumnosIncidencias.find(x=>String(x.id)===String(id))||null}

  function seleccionarAlumno(){invalidarFolio();const a=obtenerAlumnoSeleccionado(),caja=document.getElementById('incidenciaAlumnoSeleccionado');if(!a){caja.classList.add('oculto');validarFormulario();return}document.getElementById('incidenciaNombreAlumno').textContent=nombreAlumno(a);document.getElementById('incidenciaDatosAlumno').textContent=`Grado: ${a.grado||'—'}° · Grupo: ${a.grupo||'—'} · ID: ${a.id||'—'}`;caja.classList.remove('oculto');validarFormulario()}

  function formularioCompleto(){const alumno=document.getElementById('incidenciaAlumno')?.value,fecha=document.getElementById('incidenciaFecha')?.value,tipo=document.getElementById('incidenciaTipo')?.value,desc=document.getElementById('incidenciaDescripcion')?.value.trim(),ac=document.getElementById('incidenciaAcuerdos')?.value.trim();return !!(alumno&&fecha&&tipo&&desc&&ac)}

  function validarFormulario(){const listo=formularioCompleto();const guardar=document.getElementById('btnGuardarIncidencia'),pdf=document.getElementById('btnPDFIncidencia');if(guardar)guardar.disabled=!listo||guardandoIncidencia||!!folioIncidenciaActual;if(pdf)pdf.disabled=!listo}

  function invalidarFolio(){if(!folioIncidenciaActual)return;folioIncidenciaActual='';const b=document.getElementById('btnGuardarIncidencia');if(b)b.textContent='💾 Guardar reporte'}

  async function guardarIncidencia(){if(guardandoIncidencia||!formularioCompleto()||typeof solicitarJSONP!=='function')return;const alumno=obtenerAlumnoSeleccionado(),estado=document.getElementById('estadoReporteIncidencias'),boton=document.getElementById('btnGuardarIncidencia');if(!alumno)return;guardandoIncidencia=true;boton.disabled=true;boton.textContent='⏳ Guardando...';estado.textContent='⏳ Guardando reporte de incidencia...';try{const respuesta=await solicitarJSONP('guardarIncidencia',{
      fecha:document.getElementById('incidenciaFecha').value,
      idAlumno:String(alumno.id||''),
      nombre:nombreAlumno(alumno),
      grado:String(alumno.grado||''),
      grupo:String(alumno.grupo||''),
      incidencia:document.getElementById('incidenciaTipo').value,
      descripcion:document.getElementById('incidenciaDescripcion').value.trim(),
      acuerdos:document.getElementById('incidenciaAcuerdos').value.trim()
    });
    if(!respuesta||(respuesta.ok!==true&&respuesta.exito!==true))throw new Error(respuesta?.mensaje||'No fue posible guardar la incidencia.');folioIncidenciaActual=String(respuesta.folio||'').trim();boton.textContent='✅ Reporte guardado';estado.textContent=folioIncidenciaActual?`✅ Incidencia guardada correctamente · Folio ${folioIncidenciaActual}`:'✅ Incidencia guardada correctamente.';window.folioIncidenciaActual=folioIncidenciaActual;
  }catch(e){boton.textContent='💾 Guardar reporte';estado.textContent=`❌ ${e?.message||'No fue posible guardar la incidencia.'}`}
  finally{guardandoIncidencia=false;validarFormulario()}}

  function ocultarOtrasVistas(){['vistaResumenEstadistico','vistaFichaAlumno','vistaDashboard','vistaEscaner'].forEach(id=>document.getElementById(id)?.classList.add('oculto'));const h=document.getElementById('pantallaHistorial'),d=document.getElementById('btnAbrirHistorial');if(h&&!h.classList.contains('oculto')&&d)d.click()}
  function cerrarMenu(){document.getElementById('menuLateral')?.classList.remove('abierto');document.getElementById('fondoMenuLateral')?.classList.remove('visible');document.body.classList.remove('menu-abierto');document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded','false');document.getElementById('menuLateral')?.setAttribute('aria-hidden','true')}
  function mostrarVista(){ocultarOtrasVistas();const v=document.getElementById('vistaReporteIncidencias');if(!v)return;v.classList.remove('oculto');v.scrollIntoView({behavior:'smooth',block:'start'});cargarAlumnos()}
  function volverInicio(){document.getElementById('vistaReporteIncidencias')?.classList.add('oculto');document.getElementById('vistaEscaner')?.classList.remove('oculto');document.querySelectorAll('.menu-lateral__opcion').forEach(op=>op.classList.toggle('activa',op.id==='menuInicio'));window.scrollTo({top:0,behavior:'smooth'})}

  function inicializar(){cargarEstilos();if(!agregarBoton()||!crearVista())return false;const b=document.getElementById('menuReporteIncidencias');if(b.dataset.incidenciasInicializado==='true')return true;b.dataset.incidenciasInicializado='true';b.addEventListener('click',()=>{document.querySelectorAll('.menu-lateral__opcion').forEach(op=>op.classList.toggle('activa',op===b));cerrarMenu();mostrarVista()});document.getElementById('btnCerrarReporteIncidencias')?.addEventListener('click',volverInicio);document.getElementById('incidenciaAlumno')?.addEventListener('change',seleccionarAlumno);['incidenciaFecha','incidenciaTipo','incidenciaDescripcion','incidenciaAcuerdos'].forEach(id=>{const el=document.getElementById(id);el?.addEventListener('input',()=>{invalidarFolio();validarFormulario()});el?.addEventListener('change',()=>{invalidarFolio();validarFormulario()})});document.getElementById('btnGuardarIncidencia')?.addEventListener('click',guardarIncidencia);document.getElementById('formReporteIncidencias')?.addEventListener('reset',()=>setTimeout(()=>{folioIncidenciaActual='';window.folioIncidenciaActual='';document.getElementById('incidenciaAlumnoSeleccionado')?.classList.add('oculto');document.getElementById('incidenciaFecha').value=fechaHoy();const guardar=document.getElementById('btnGuardarIncidencia');if(guardar)guardar.textContent='💾 Guardar reporte';document.getElementById('estadoReporteIncidencias').textContent='Selecciona un alumno para comenzar.';validarFormulario()},0));['menuInicio','menuHistorial','menuResumenEstadistico','menuFichaAlumno','menuDashboard'].forEach(id=>document.getElementById(id)?.addEventListener('click',()=>document.getElementById('vistaReporteIncidencias')?.classList.add('oculto')));return true}
  if(inicializar())return;const o=new MutationObserver(()=>{if(inicializar())o.disconnect()});o.observe(document.documentElement,{childList:true,subtree:true});
})();
