/* AulaNFC v3 - Administración de alumnos. */
(() => {
  let alumnosAdmin=[];
  let alumnoSeleccionado=null;
  let leyendoNFC=false;

  const esc=(v)=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const nombreCompleto=(a)=>String(a?.nombreCompleto||[a?.nombre,a?.apellidoPaterno,a?.apellidoMaterno].filter(Boolean).join(' ')).replace(/\s+/g,' ').trim();
  const normalizar=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const estadoAlumno=(a)=>String(a?.estado||(a?.activo===false?'INACTIVO':'ACTIVO')).trim().toUpperCase();

  function esperarBase(){
    const menu=document.getElementById('menuLateral');
    const nav=menu?.querySelector('.menu-lateral__navegacion');
    const contenedor=document.querySelector('.contenedor');
    if(!menu||!nav||!contenedor||typeof solicitarJSONP!=='function'){setTimeout(esperarBase,120);return;}
    if(document.getElementById('menuAdministracionAlumnos'))return;
    crearBoton(nav);crearVista(contenedor);conectarEventos();cargarAlumnos();
  }

  function crearBoton(nav){
    const b=document.createElement('button');b.id='menuAdministracionAlumnos';b.className='menu-lateral__opcion';b.type='button';b.innerHTML='<span class="menu-lateral__icono" aria-hidden="true">👥</span><span>Administración de alumnos</span>';nav.appendChild(b);
  }

  function crearVista(contenedor){
    const v=document.createElement('section');v.id='vistaAdministracionAlumnos';v.className='admin-alumnos oculto';v.innerHTML=`
      <header class="admin-alumnos__cabecera"><div><h2>👥 Administración de alumnos</h2><p>Altas, edición, UID NFC y estado del alumno.</p></div><button id="btnCerrarAdminAlumnos" class="admin-alumnos__cerrar" type="button">✕</button></header>
      <div class="admin-alumnos__acciones-superiores">
        <input id="buscarAdminAlumno" type="search" placeholder="🔎 Buscar alumno..." autocomplete="off">
        <select id="filtroEstadoAdminAlumno" aria-label="Mostrar alumnos">
          <option value="todos">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="baja">Baja definitiva</option>
        </select>
        <button id="btnNuevoAdminAlumno" class="admin-alumnos__nuevo" type="button">＋ Agregar alumno</button>
      </div>
      <p id="estadoAdminAlumnos" class="admin-alumnos__estado">Cargando alumnos...</p>
      <div id="listaAdminAlumnos" class="admin-alumnos__lista"></div>
      <section id="formAdminAlumno" class="admin-alumnos__formulario oculto">
        <h3 id="tituloFormAdminAlumno">Nuevo alumno</h3>
        <div class="admin-alumnos__grid">
          <label><span>ID alumno</span><input id="adminIdAlumno" class="admin-alumnos__id" type="text" readonly placeholder="Se genera automáticamente"></label>
          <label><span>Fecha de nacimiento</span><input id="adminFechaNacimiento" type="date"></label>
          <label><span>Nombre</span><input id="adminNombre" type="text" autocomplete="off"></label>
          <label><span>Apellido paterno</span><input id="adminApellidoPaterno" type="text" autocomplete="off"></label>
          <label><span>Apellido materno</span><input id="adminApellidoMaterno" type="text" autocomplete="off"></label>
          <label><span>Grado</span><input id="adminGrado" type="text" inputmode="numeric" autocomplete="off"></label>
          <label><span>Grupo</span><input id="adminGrupo" type="text" autocomplete="off"></label>
          <label class="ancho-completo"><span>UID NFC</span><div class="admin-alumnos__uid"><input id="adminUid" type="text" autocomplete="off" placeholder="UID de la tarjeta"><button id="btnLeerUidAdmin" type="button">📡 Leer NFC</button></div></label>
          <label class="ancho-completo"><span>Foto / URL</span><input id="adminFoto" type="text" autocomplete="off" placeholder="Opcional"></label>
        </div>
        <div class="admin-alumnos__botones">
          <button id="btnGuardarAdminAlumno" class="admin-alumnos__guardar" type="button">💾 Guardar alumno</button>
          <button id="btnEstadoAdminAlumno" class="admin-alumnos__estado-btn oculto" type="button"></button>
          <button id="btnBajaDefinitivaAdminAlumno" class="admin-alumnos__estado-btn oculto" type="button">🚫 Dar de baja definitivamente</button>
          <button id="btnEliminarAdminAlumno" class="admin-alumnos__eliminar oculto" type="button">🗑️ Eliminar definitivamente</button>
          <button id="btnCancelarAdminAlumno" class="admin-alumnos__cancelar" type="button">Cancelar</button>
        </div>
      </section>`;
    const escaner=document.getElementById('vistaEscaner');if(escaner)contenedor.insertBefore(v,escaner);else contenedor.appendChild(v);
  }

  function cerrarMenu(){document.getElementById('menuLateral')?.classList.remove('abierto');document.getElementById('fondoMenuLateral')?.classList.remove('visible');document.body.classList.remove('menu-abierto');document.getElementById('btnMenuLateral')?.setAttribute('aria-expanded','false');document.getElementById('menuLateral')?.setAttribute('aria-hidden','true');}
  function ocultarOtras(){document.getElementById('vistaEscaner')?.classList.add('oculto');document.getElementById('vistaResumenEstadistico')?.classList.add('oculto');document.getElementById('vistaResultadosExamen')?.classList.add('oculto');const h=document.getElementById('pantallaHistorial'),d=document.getElementById('btnAbrirHistorial');if(h&&!h.classList.contains('oculto')&&d)d.click();}
  function mostrarVista(){ocultarOtras();document.getElementById('vistaAdministracionAlumnos')?.classList.remove('oculto');document.getElementById('vistaAdministracionAlumnos')?.scrollIntoView({behavior:'smooth',block:'start'});cargarAlumnos(true);}
  function ocultarVista(){document.getElementById('vistaAdministracionAlumnos')?.classList.add('oculto');}
  function marcarActivo(){const m=document.getElementById('menuLateral'),b=document.getElementById('menuAdministracionAlumnos');m?.querySelectorAll('.menu-lateral__opcion').forEach(x=>x.classList.toggle('activa',x===b));}

  async function cargarAlumnos(forzar=false){
    if(alumnosAdmin.length&&!forzar){renderLista();return;}
    const e=document.getElementById('estadoAdminAlumnos');if(e)e.textContent='⏳ Cargando alumnos...';
    try{const r=await solicitarJSONP('obtenerAlumnos');if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No se pudieron cargar los alumnos.');alumnosAdmin=Array.isArray(r.alumnos)?r.alumnos:[];renderLista();if(e)e.textContent=`✅ ${alumnosAdmin.length} alumnos cargados.`;}catch(err){if(e)e.textContent=`❌ ${err?.message||'No se pudieron cargar los alumnos.'}`;}
  }

  function renderLista(){
    const term=normalizar(document.getElementById('buscarAdminAlumno')?.value||'');
    const filtro=document.getElementById('filtroEstadoAdminAlumno')?.value||'todos';
    const lista=document.getElementById('listaAdminAlumnos');if(!lista)return;
    const datos=alumnosAdmin.filter(a=>{
      const coincideTexto=!term||normalizar(nombreCompleto(a)).includes(term);
      const estado=estadoAlumno(a);
      const coincideEstado=filtro==='todos'||(filtro==='activos'&&estado==='ACTIVO')||(filtro==='inactivos'&&estado==='INACTIVO')||(filtro==='baja'&&estado==='BAJA DEFINITIVA');
      return coincideTexto&&coincideEstado;
    });
    lista.innerHTML=datos.length?datos.map(a=>{const estado=estadoAlumno(a);return `<article class="admin-alumno-item"><div><strong>${esc(nombreCompleto(a))}</strong><small>ID ${esc(a.id)} · ${esc(a.grado||'')}° ${esc(a.grupo||'')} · UID ${esc(a.uid||'Sin UID')} · ${esc(estado)}</small></div><button type="button" data-editar-admin="${esc(a.id)}">Editar</button></article>`;}).join(''):'<div class="admin-alumnos__vacio">No se encontraron alumnos.</div>';
    lista.querySelectorAll('[data-editar-admin]').forEach(b=>b.addEventListener('click',()=>editarAlumno(b.dataset.editarAdmin)));
  }

  function limpiarFormulario(){alumnoSeleccionado=null;['adminIdAlumno','adminFechaNacimiento','adminNombre','adminApellidoPaterno','adminApellidoMaterno','adminGrado','adminGrupo','adminUid','adminFoto'].forEach(id=>{const x=document.getElementById(id);if(x)x.value='';});document.getElementById('tituloFormAdminAlumno').textContent='Nuevo alumno';document.getElementById('btnEstadoAdminAlumno').classList.add('oculto');document.getElementById('btnBajaDefinitivaAdminAlumno').classList.add('oculto');document.getElementById('btnEliminarAdminAlumno').classList.add('oculto');}
  function nuevoAlumno(){limpiarFormulario();document.getElementById('formAdminAlumno').classList.remove('oculto');document.getElementById('adminNombre')?.focus();}
  function editarAlumno(id){
    const a=alumnosAdmin.find(x=>String(x.id)===String(id));if(!a)return;alumnoSeleccionado=a;
    document.getElementById('tituloFormAdminAlumno').textContent='Editar alumno';
    document.getElementById('adminIdAlumno').value=a.id||'';
    document.getElementById('adminFechaNacimiento').value=String(a.fechaNacimiento||'').slice(0,10);
    document.getElementById('adminNombre').value=a.nombre||'';
    document.getElementById('adminApellidoPaterno').value=a.apellidoPaterno||'';
    document.getElementById('adminApellidoMaterno').value=a.apellidoMaterno||'';
    document.getElementById('adminGrado').value=a.grado||'';
    document.getElementById('adminGrupo').value=a.grupo||'';
    document.getElementById('adminUid').value=a.uid||'';
    document.getElementById('adminFoto').value=a.foto||'';
    const estado=estadoAlumno(a);
    const bEstado=document.getElementById('btnEstadoAdminAlumno');
    const bBaja=document.getElementById('btnBajaDefinitivaAdminAlumno');
    bEstado.classList.add('oculto');bBaja.classList.add('oculto');
    if(estado==='ACTIVO'){bEstado.classList.remove('oculto');bEstado.textContent='⏸ Inactivar alumno';bBaja.classList.remove('oculto');}
    else if(estado==='INACTIVO'){bEstado.classList.remove('oculto');bEstado.textContent='✅ Reactivar alumno';bBaja.classList.remove('oculto');}
    document.getElementById('btnEliminarAdminAlumno').classList.remove('oculto');
    document.getElementById('formAdminAlumno').classList.remove('oculto');
    document.getElementById('formAdminAlumno').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function parametrosFormulario(){return {idAlumno:document.getElementById('adminIdAlumno').value.trim(),nombre:document.getElementById('adminNombre').value.trim(),apellidoPaterno:document.getElementById('adminApellidoPaterno').value.trim(),apellidoMaterno:document.getElementById('adminApellidoMaterno').value.trim(),fechaNacimiento:document.getElementById('adminFechaNacimiento').value,grado:document.getElementById('adminGrado').value.trim(),grupo:document.getElementById('adminGrupo').value.trim(),uid:document.getElementById('adminUid').value.trim(),foto:document.getElementById('adminFoto').value.trim()};}

  async function guardar(){const p=parametrosFormulario(),e=document.getElementById('estadoAdminAlumnos'),b=document.getElementById('btnGuardarAdminAlumno');if(!p.nombre||!p.apellidoPaterno||!p.grado||!p.grupo){e.textContent='❌ Completa nombre, apellido paterno, grado y grupo.';return;}b.disabled=true;e.textContent='⏳ Guardando alumno...';try{const accion=alumnoSeleccionado?'actualizaralumno':'crearalumno';const r=await solicitarJSONP(accion,p);if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible guardar el alumno.');e.textContent=`✅ ${r.mensaje||'Alumno guardado.'}`;document.getElementById('formAdminAlumno').classList.add('oculto');limpiarFormulario();await cargarAlumnos(true);}catch(err){e.textContent=`❌ ${err?.message||'No fue posible guardar el alumno.'}`;}finally{b.disabled=false;}}

  async function cambiarEstado(){
    if(!alumnoSeleccionado)return;
    const actual=estadoAlumno(alumnoSeleccionado);
    if(actual==='BAJA DEFINITIVA')return;
    const nuevo=actual==='ACTIVO'?'INACTIVO':'ACTIVO';
    const e=document.getElementById('estadoAdminAlumnos');e.textContent='⏳ Actualizando estado...';
    try{const r=await solicitarJSONP('cambiarestadoalumno',{idAlumno:alumnoSeleccionado.id,estado:nuevo});if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible cambiar el estado.');e.textContent=`✅ ${r.mensaje}`;document.getElementById('formAdminAlumno').classList.add('oculto');limpiarFormulario();await cargarAlumnos(true);}catch(err){e.textContent=`❌ ${err?.message||'No fue posible cambiar el estado.'}`;}
  }

  async function darBajaDefinitiva(){
    if(!alumnoSeleccionado)return;
    const nombre=nombreCompleto(alumnoSeleccionado);
    const confirmado=window.confirm(`¿Dar de baja definitivamente a ${nombre}?\n\nEl alumno dejará de estar disponible para nuevos registros, pero su historial se conservará.`);
    if(!confirmado)return;
    const e=document.getElementById('estadoAdminAlumnos');e.textContent='⏳ Registrando baja definitiva...';
    try{const r=await solicitarJSONP('cambiarestadoalumno',{idAlumno:alumnoSeleccionado.id,estado:'BAJA DEFINITIVA'});if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible dar de baja al alumno.');e.textContent=`✅ ${r.mensaje}`;document.getElementById('formAdminAlumno').classList.add('oculto');limpiarFormulario();await cargarAlumnos(true);}catch(err){e.textContent=`❌ ${err?.message||'No fue posible dar de baja al alumno.'}`;}
  }

  async function eliminarAlumno(){
    if(!alumnoSeleccionado)return;
    const nombre=nombreCompleto(alumnoSeleccionado);
    const confirmado=window.confirm(`¿Eliminar definitivamente a ${nombre}?\n\nEsta opción es solo para alumnos creados por error y sin historial. Si tiene registros, AulaNFC bloqueará la eliminación.`);
    if(!confirmado)return;
    const e=document.getElementById('estadoAdminAlumnos');const b=document.getElementById('btnEliminarAdminAlumno');b.disabled=true;e.textContent='⏳ Verificando si el alumno puede eliminarse...';
    try{const r=await solicitarJSONP('eliminaralumno',{idAlumno:alumnoSeleccionado.id});if(!r||(r.ok===false||r.exito===false))throw new Error(r?.mensaje||'No fue posible eliminar el alumno.');e.textContent=`✅ ${r.mensaje||'Alumno eliminado definitivamente.'}`;document.getElementById('formAdminAlumno').classList.add('oculto');limpiarFormulario();await cargarAlumnos(true);}catch(err){e.textContent=`❌ ${err?.message||'No fue posible eliminar el alumno.'}`;}finally{b.disabled=false;}
  }

  async function leerNFC(){const e=document.getElementById('estadoAdminAlumnos');if(leyendoNFC)return;if(!('NDEFReader'in window)){e.textContent='❌ Este dispositivo/navegador no admite Web NFC.';return;}leyendoNFC=true;e.textContent='📡 Acerca la tarjeta NFC del alumno...';try{const controller=new AbortController();const reader=new NDEFReader();await reader.scan({signal:controller.signal});reader.onreading=(event)=>{const uid=String(event.serialNumber||'').trim();document.getElementById('adminUid').value=uid;e.textContent=uid?`✅ UID leído: ${uid}`:'❌ No se pudo leer el UID.';controller.abort();leyendoNFC=false;};reader.onreadingerror=()=>{e.textContent='❌ No se pudo leer la tarjeta NFC.';controller.abort();leyendoNFC=false;};}catch(err){e.textContent=`❌ ${err?.message||'No fue posible activar el lector NFC.'}`;leyendoNFC=false;}}

  function conectarEventos(){
    document.getElementById('menuAdministracionAlumnos').addEventListener('click',()=>{marcarActivo();cerrarMenu();mostrarVista();});
    document.getElementById('btnCerrarAdminAlumnos').addEventListener('click',()=>{ocultarVista();document.getElementById('vistaEscaner')?.classList.remove('oculto');const inicio=document.getElementById('menuInicio');document.getElementById('menuLateral')?.querySelectorAll('.menu-lateral__opcion').forEach(b=>b.classList.toggle('activa',b===inicio));});
    document.getElementById('buscarAdminAlumno').addEventListener('input',renderLista);
    document.getElementById('filtroEstadoAdminAlumno').addEventListener('change',renderLista);
    document.getElementById('btnNuevoAdminAlumno').addEventListener('click',nuevoAlumno);
    document.getElementById('btnCancelarAdminAlumno').addEventListener('click',()=>{document.getElementById('formAdminAlumno').classList.add('oculto');limpiarFormulario();});
    document.getElementById('btnGuardarAdminAlumno').addEventListener('click',guardar);
    document.getElementById('btnEstadoAdminAlumno').addEventListener('click',cambiarEstado);
    document.getElementById('btnBajaDefinitivaAdminAlumno').addEventListener('click',darBajaDefinitiva);
    document.getElementById('btnEliminarAdminAlumno').addEventListener('click',eliminarAlumno);
    document.getElementById('btnLeerUidAdmin').addEventListener('click',leerNFC);
    ['menuInicio','menuHistorial','menuResumenEstadistico','menuResultadosExamen'].forEach(id=>document.getElementById(id)?.addEventListener('click',ocultarVista));
  }

  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',esperarBase):esperarBase();
})();