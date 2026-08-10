/* AulaNFC v2.1 - Opción y vista Ficha del alumno conectada al motor estadístico. */
(() => {
  let alumnosFicha = [];
  let alumnosFichaCargados = false;
  let alumnoFichaSeleccionado = null;
  let consultaFichaEnProceso = false;

  function cargarEstiloFicha() {
    if (document.getElementById('estilosFichaAlumno')) return;
    const enlace = document.createElement('link');
    enlace.id = 'estilosFichaAlumno';
    enlace.rel = 'stylesheet';
    enlace.href = 'ficha-alumno.css?v=1';
    document.head.appendChild(enlace);
  }

  function nombreAlumno(alumno) {
    return String(alumno?.nombreCompleto || [alumno?.nombre, alumno?.apellidoPaterno, alumno?.apellidoMaterno].filter(Boolean).join(' ') || 'Alumno').replace(/\s+/g, ' ').trim();
  }
  function gradoGrupoAlumno(alumno) { const grado=String(alumno?.grado||'').trim(), grupo=String(alumno?.grupo||'').trim(); return grado&&grupo?`${grado}° ${grupo}`:grado||grupo||'Sin grado y grupo'; }
  function iniciales(nombre) { const partes=String(nombre||'').trim().split(/\s+/).filter(Boolean); return partes.length>1?(partes[0][0]+partes[1][0]).toUpperCase():(partes[0]||'AL').slice(0,2).toUpperCase(); }
  function normalizar(texto) { return String(texto||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim(); }
  function escapar(texto) { return String(texto??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;'); }
  function numero(valor) { const n=Number(valor); return Number.isFinite(n)?n:0; }

  function agregarBotonFichaAlumno() {
    if (document.getElementById('menuFichaAlumno')) return true;
    const resumen=document.getElementById('menuResumenEstadistico'); if(!resumen||!resumen.parentElement)return false;
    const boton=document.createElement('button'); boton.id='menuFichaAlumno'; boton.className='menu-lateral__opcion'; boton.type='button'; boton.innerHTML='<span class="menu-lateral__icono" aria-hidden="true">👤</span><span>Ficha del alumno</span>'; resumen.insertAdjacentElement('afterend',boton); return true;
  }

  function crearVistaFicha() {
    if(document.getElementById('vistaFichaAlumno'))return true; const contenedor=document.querySelector('.contenedor'),vistaEscaner=document.getElementById('vistaEscaner'); if(!contenedor)return false;
    const vista=document.createElement('section'); vista.id='vistaFichaAlumno'; vista.className='vista-ficha-alumno oculto'; vista.innerHTML=`
      <header class="ficha-alumno__cabecera"><div><h2>👤 Ficha del alumno</h2><p>Consulta rápida de datos e indicadores del alumno.</p></div><button id="btnCerrarFichaAlumno" class="ficha-alumno__cerrar" type="button" aria-label="Cerrar ficha del alumno">✕</button></header>
      <section class="ficha-alumno__busqueda"><label class="ficha-alumno__etiqueta" for="busquedaFichaAlumno">Buscar alumno</label><input id="busquedaFichaAlumno" class="ficha-alumno__buscador" type="search" placeholder="Escribe al menos dos letras..." autocomplete="off"><p id="contadorFichaAlumno" class="ficha-alumno__contador">Escribe un nombre para buscar.</p><div id="listaFichaAlumno" class="ficha-alumno__lista oculto"></div></section>
      <section id="contenidoFichaAlumno" class="ficha-alumno__contenido oculto"><section class="ficha-alumno__identidad"><div id="fotoFichaAlumno" class="ficha-alumno__foto">AL</div><div><h3 id="nombreFichaAlumno" class="ficha-alumno__nombre">Alumno</h3><div class="ficha-alumno__datos"><span>Grado: <strong id="gradoFichaAlumno">—</strong></span><span>Grupo: <strong id="grupoFichaAlumno">—</strong></span><span>ID: <strong id="idFichaAlumno">—</strong></span></div></div></section><p id="estadoFichaAlumno" class="ficha-alumno__contador" aria-live="polite"></p>
      <section class="ficha-alumno__resumen"><h3>Resumen rápido</h3><div class="ficha-alumno__indicadores"><div class="ficha-alumno__indicador"><span>🟢 Asistencia acumulada</span><strong id="fichaAsistencia">—</strong></div><div class="ficha-alumno__indicador"><span>🟡 Cumplimiento de tareas</span><strong id="fichaTareas">—</strong></div><div class="ficha-alumno__indicador"><span>🔵 Participaciones</span><strong id="fichaParticipaciones">—</strong></div><div class="ficha-alumno__indicador"><span>🟣 Conducta</span><strong id="fichaConducta">—</strong></div><div class="ficha-alumno__indicador"><span>🟠 Lectura</span><strong id="fichaLectura">—</strong></div></div></section>
      <section class="ficha-alumno__acciones"><button id="btnFichaHistorial" class="ficha-alumno__accion ficha-alumno__accion--historial" type="button" disabled>📜 Ver historial completo</button><button id="btnFichaPDF" class="ficha-alumno__accion ficha-alumno__accion--pdf" type="button" disabled>📄 Generar PDF</button></section></section>`;
    if(vistaEscaner)contenedor.insertBefore(vista,vistaEscaner);else contenedor.appendChild(vista); return true;
  }

  async function cargarAlumnosFicha() {
    const contador=document.getElementById('contadorFichaAlumno'); if(alumnosFichaCargados||typeof solicitarJSONP!=='function')return;
    contador.textContent='Cargando alumnos del grupo activo...';
    try {
      const respuesta=await solicitarJSONP('obtenerAlumnosGrupoActivo');
      if(!respuesta||(respuesta.ok===false||respuesta.exito===false))throw new Error(respuesta?.mensaje||'No se pudieron cargar los alumnos del grupo activo.');
      alumnosFicha=Array.isArray(respuesta.alumnos)?respuesta.alumnos:[]; alumnosFichaCargados=true;
      contador.textContent=alumnosFicha.length?`Grupo activo: ${respuesta.grado||''}° ${respuesta.grupo||''} · ${alumnosFicha.length} alumnos`:'No hay alumnos activos en el grupo configurado.';
    } catch(error){contador.textContent=error.message||'No se pudieron cargar los alumnos.';}
  }

  function buscarAlumnoFicha(){const buscador=document.getElementById('busquedaFichaAlumno'),lista=document.getElementById('listaFichaAlumno'),contador=document.getElementById('contadorFichaAlumno'),termino=normalizar(buscador.value);if(termino.length<2){lista.classList.add('oculto');contador.textContent='Escribe al menos dos letras.';return;}const coincidencias=alumnosFicha.filter(a=>normalizar(nombreAlumno(a)).includes(termino));contador.textContent=`${coincidencias.length} coincidencias`;lista.classList.remove('oculto');lista.innerHTML=coincidencias.length?coincidencias.map(a=>`<button class="ficha-alumno__opcion" type="button" data-ficha-id="${escapar(a.id)}"><strong>${escapar(nombreAlumno(a))}</strong><small>${escapar(gradoGrupoAlumno(a))}</small></button>`).join(''):'<div class="mensaje-lista">No se encontraron alumnos.</div>';}

  async function seleccionarAlumnoFicha(id){const alumno=alumnosFicha.find(item=>String(item.id)===String(id));if(!alumno)return;alumnoFichaSeleccionado=alumno;const nombre=nombreAlumno(alumno),foto=alumno.foto||alumno.fotoUrl||alumno.fotografia||alumno.imagen||'';document.getElementById('nombreFichaAlumno').textContent=nombre;document.getElementById('gradoFichaAlumno').textContent=alumno.grado||'—';document.getElementById('grupoFichaAlumno').textContent=alumno.grupo||'—';document.getElementById('idFichaAlumno').textContent=alumno.id||'—';const contenedorFoto=document.getElementById('fotoFichaAlumno');contenedorFoto.innerHTML=foto?`<img src="${escapar(foto)}" alt="Foto de ${escapar(nombre)}">`:escapar(iniciales(nombre));document.getElementById('contenidoFichaAlumno').classList.remove('oculto');document.getElementById('listaFichaAlumno').classList.add('oculto');document.getElementById('busquedaFichaAlumno').value='';document.getElementById('contadorFichaAlumno').textContent='Alumno seleccionado.';await cargarResumenFicha(alumno);}
  function limpiarResumenFicha(){['fichaAsistencia','fichaTareas','fichaParticipaciones','fichaConducta','fichaLectura'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent='—';});}
  async function cargarResumenFicha(alumno){if(!alumno||!alumno.id||consultaFichaEnProceso||typeof solicitarJSONP!=='function')return;consultaFichaEnProceso=true;limpiarResumenFicha();const estado=document.getElementById('estadoFichaAlumno');if(estado)estado.textContent='⏳ Consultando resumen del alumno...';try{const respuesta=await solicitarJSONP('obtenerResumenEstadistico',{idAlumno:String(alumno.id),periodo:'ciclo'});if(!respuesta||(respuesta.ok!==true&&respuesta.exito!==true))throw new Error(respuesta?.mensaje||'No fue posible obtener el resumen del alumno.');pintarResumenFicha(respuesta);if(estado)estado.textContent='✅ Resumen actualizado.';}catch(error){if(estado)estado.textContent=`❌ ${error?.message||'No fue posible obtener el resumen del alumno.'}`;}finally{consultaFichaEnProceso=false;}}
  function pintarResumenFicha(respuesta){const asistencia=respuesta.asistencia||{},tareas=respuesta.tareas||{},participaciones=respuesta.participaciones||{},conducta=respuesta.conducta||{},lectura=respuesta.lectura||{};const presentes=numero(asistencia.presentes),faltas=numero(asistencia.faltas),diasEscolares=numero(asistencia.diasEscolares),porcentajeAsistencia=diasEscolares>0?Math.round((presentes/diasEscolares)*100):numero(asistencia.porcentajeAsistencia);document.getElementById('fichaAsistencia').textContent=diasEscolares>0?`${porcentajeAsistencia}% · ${presentes} presentes / ${faltas} faltas`:`${presentes} presentes`;document.getElementById('fichaTareas').textContent=`${numero(tareas.porcentajeCumplimiento)}%`;document.getElementById('fichaParticipaciones').textContent=String(numero(participaciones.total));document.getElementById('fichaConducta').textContent=String(conducta.resumen||'').trim()||'Sin resumen';document.getElementById('fichaLectura').textContent=String(lectura.nivelPredominante||'').trim()||'Sin registros';}
  function ocultarFicha(){const vista=document.getElementById('vistaFichaAlumno');if(vista)vista.classList.add('oculto');}
  function mostrarFicha(){const vistaFicha=document.getElementById('vistaFichaAlumno'),vistaResumen=document.getElementById('vistaResumenEstadistico'),vistaEscaner=document.getElementById('vistaEscaner'),pantallaHistorial=document.getElementById('pantallaHistorial'),disparadorHistorial=document.getElementById('btnAbrirHistorial');if(vistaResumen)vistaResumen.classList.add('oculto');if(pantallaHistorial&&!pantallaHistorial.classList.contains('oculto')&&disparadorHistorial)disparadorHistorial.click();if(vistaEscaner)vistaEscaner.classList.add('oculto');vistaFicha.classList.remove('oculto');vistaFicha.scrollIntoView({behavior:'smooth',block:'start'});cargarAlumnosFicha();}
  function cerrarMenuVisualmente(){const menu=document.getElementById('menuLateral'),fondo=document.getElementById('fondoMenuLateral'),boton=document.getElementById('btnMenuLateral');if(menu){menu.classList.remove('abierto');menu.setAttribute('aria-hidden','true');}if(fondo)fondo.classList.remove('visible');if(boton)boton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-abierto');}
  function inicializarFicha(){cargarEstiloFicha();if(!agregarBotonFichaAlumno()||!crearVistaFicha())return false;const botonFicha=document.getElementById('menuFichaAlumno'),buscador=document.getElementById('busquedaFichaAlumno'),lista=document.getElementById('listaFichaAlumno'),cerrar=document.getElementById('btnCerrarFichaAlumno');if(botonFicha.dataset.fichaInicializada==='true')return true;botonFicha.dataset.fichaInicializada='true';botonFicha.addEventListener('click',()=>{document.querySelectorAll('.menu-lateral__opcion').forEach(opcion=>opcion.classList.toggle('activa',opcion===botonFicha));cerrarMenuVisualmente();mostrarFicha();});buscador.addEventListener('input',buscarAlumnoFicha);lista.addEventListener('click',e=>{const boton=e.target.closest('[data-ficha-id]');if(boton)seleccionarAlumnoFicha(boton.dataset.fichaId);});cerrar.addEventListener('click',()=>{ocultarFicha();const vistaEscaner=document.getElementById('vistaEscaner');if(vistaEscaner)vistaEscaner.classList.remove('oculto');});return true;}
  const intervalo=setInterval(()=>{if(inicializarFicha())clearInterval(intervalo);},200);setTimeout(()=>clearInterval(intervalo),10000);
  window.AulaNFCFichaAlumno={obtenerAlumnoSeleccionado:()=>alumnoFichaSeleccionado,ocultar:ocultarFicha,mostrar:mostrarFicha};
})();